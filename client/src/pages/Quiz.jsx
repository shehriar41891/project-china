import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { api } from '../api/client';
import styles from './Quiz.module.css';

const TOTAL_QUESTIONS = 6;

export default function Quiz() {
  const { t } = useLocale();
  const [searchParams] = useSearchParams();
  const chapterId = searchParams.get('chapterId') ? parseInt(searchParams.get('chapterId'), 10) : null;
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [screen, setScreen] = useState('start'); // start | question | feedback | loading | done
  const [attemptId, setAttemptId] = useState(null);
  const [attemptChapterId, setAttemptChapterId] = useState(null);
  const [contextForRetake, setContextForRetake] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [feedback, setFeedback] = useState(null); // { correct, userIndex, correctIndex, topic, options }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (chapterId) {
      api('/api/quiz/retake-context?chapterId=' + chapterId)
        .then((d) => d.contextForRetake && setContextForRetake(d.contextForRetake))
        .catch(() => {});
    }
  }, [user, authLoading, chapterId, navigate]);

  const startQuiz = async (retakeContext) => {
    setScreen('loading');
    try {
      const body = {};
      if (retakeContext) body.contextForRetake = retakeContext;
      if (chapterId) body.chapterId = chapterId;
      const data = await api('/api/quiz/start', { method: 'POST', body });
      setAttemptId(data.attemptId);
      setAttemptChapterId(chapterId || null);
      setAnsweredCount(0);
      setFeedback(null);
      setScreen('question');
      fetchNext(data.attemptId, null);
    } catch {
      setScreen('start');
    }
  };

  const fetchNext = async (aid, prev) => {
    setScreen('loading');
    try {
      const body = { attemptId: aid };
      if (prev) {
        body.previousQuestion = prev.question;
        body.userAnswerIndex = prev.userAnswerIndex;
        body.correctIndex = prev.correctIndex;
        body.topic = prev.topic;
      }
      const data = await api('/api/quiz/question', { method: 'POST', body });
      if (data.done) {
        await api('/api/quiz/complete', { method: 'POST', body: { attemptId: aid } });
        setScore({ correct: data.correctCount ?? 0, total: data.totalQuestions ?? TOTAL_QUESTIONS });
        setScreen('done');
        return;
      }
      setFeedback(null);
      setCurrentQuestion({
        question: data.question,
        options: data.options || [],
        correctIndex: data.correctIndex,
        topic: data.topic,
      });
      setScreen('question');
    } catch {
      setScreen('start');
    }
  };

  const submitAnswer = async (optionIndex) => {
    if (!currentQuestion || currentQuestion.answered) return;
    const q = { ...currentQuestion, answered: true, userAnswerIndex: optionIndex };
    setCurrentQuestion(q);
    const correct = Number(optionIndex) === Number(q.correctIndex);
    try {
      await api('/api/quiz/answer', {
        method: 'POST',
        body: {
          attemptId: attemptId,
          questionText: q.question,
          topic: q.topic,
          options: q.options,
          userAnswerIndex: optionIndex,
          correctIndex: q.correctIndex,
        },
      });
      const nextCount = answeredCount + 1;
      setAnsweredCount(nextCount);
      setFeedback({
        correct,
        userIndex: optionIndex,
        correctIndex: q.correctIndex,
        topic: q.topic,
        options: q.options || [],
        question: q.question,
      });
      setScreen('feedback');
    } catch {
      setScreen('start');
    }
  };

  const continueAfterFeedback = () => {
    if (!currentQuestion || !feedback) return;
    const q = { ...currentQuestion, answered: true, userAnswerIndex: feedback.userIndex };
    fetchNext(attemptId, q);
  };

  if (authLoading || !user) return null;

  return (
    <div className={styles.main}>
      <div className={styles.card}>
        {screen === 'start' && (
          <>
            <h1 className={styles.title}>{t('quiz.title')}</h1>
            <p className={styles.sub}>
              {chapterId ? t('quiz.chapterIntro') : t('quiz.generalIntro')}
            </p>
            <button type="button" className={styles.btnStart} onClick={() => startQuiz(null)}>{t('quiz.startQuiz')}</button>
            {contextForRetake && (
              <button type="button" className={styles.btnRetake} onClick={() => startQuiz(contextForRetake)}>{t('quiz.retakeAdapted')}</button>
            )}
            <p className={styles.footer}><Link to="/profile">{t('quiz.viewProfile')}</Link></p>
          </>
        )}

        {screen === 'loading' && <div className={styles.loading}>{t('quiz.loading')}</div>}

        {screen === 'feedback' && feedback && (
          <>
            <p className={styles.feedbackTitle} role="status">
              {feedback.correct ? t('quiz.correct') : t('quiz.incorrect')}
            </p>
            {!feedback.correct && (
              <p className={styles.feedbackDetail}>
                {t('quiz.correctWas')}{' '}
                <strong>{(feedback.options[feedback.correctIndex] ?? '').toString()}</strong>
              </p>
            )}
            {feedback.topic && (
              <p className={styles.topicTag}>
                {t('quiz.topic')}: {feedback.topic}
              </p>
            )}
            <button type="button" className={styles.btnStart} onClick={continueAfterFeedback}>
              {t('quiz.next')}
            </button>
          </>
        )}

        {screen === 'question' && currentQuestion && (
          <>
            <p className={styles.progress}>{t('quiz.questionOf').replace('{n}', String(answeredCount + 1)).replace('{total}', String(TOTAL_QUESTIONS))}</p>
            <p className={styles.qText}>{currentQuestion.question}</p>
            <div className={styles.options}>
              {(currentQuestion.options || []).map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  className={styles.opt}
                  onClick={() => submitAnswer(i)}
                  disabled={currentQuestion.answered}
                >
                  {opt}
                </button>
              ))}
            </div>
          </>
        )}

        {screen === 'done' && (
          <>
            <h2>{t('quiz.completeTitle')}</h2>
            <p className={styles.score}>{t('quiz.scoreOutOf').replace('{correct}', String(score.correct)).replace('{total}', String(score.total))}</p>
            {attemptChapterId && score.correct < score.total && (
              <p><Link to={`/quiz?chapterId=${attemptChapterId}`}>{t('quiz.retakeChapter')}</Link></p>
            )}
            <p><Link to="/profile">{t('quiz.profileRec')}</Link></p>
            <p><Link to="/quiz">{t('quiz.anotherQuiz')}</Link></p>
          </>
        )}
      </div>
    </div>
  );
}
