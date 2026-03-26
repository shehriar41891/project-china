import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import styles from './Chapter.module.css';

export default function Chapter() {
  const { id, slug } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [taskDone, setTaskDone] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatReply, setChatReply] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    api('/api/chapters')
      .then((data) => {
        const list = data.chapters || [];
        setChapters(list);
        let current = null;
        if (id) current = list.find((c) => String(c.id) === String(id));
        if (!current && slug) current = list.find((c) => c.slug === slug);
        if (!current) throw new Error('Invalid chapter');
        return api('/api/chapters/' + current.id);
      })
      .then((data) => {
        setChapter(data);
        fetch('/api/chapters/' + data.id + '/start', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {});
      })
      .catch(() => setErr('Could not load lesson.'))
      .finally(() => setLoading(false));
  }, [id, slug, user, authLoading, navigate]);

  if (authLoading || !user) return null;

  if (loading || err || !chapter) {
    return (
      <div className={styles.main}>
        <div className={styles.card}>{err || 'Loading lesson…'}</div>
      </div>
    );
  }

  const videos = chapter.video_links || [];
  const docs = chapter.doc_links || [];
  const currentIndex = chapters.findIndex((c) => c.id === chapter.id);
  const prev = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;
  const objective = `By the end of this lesson, you should confidently explain and apply: ${chapter.title}.`;
  const quizProgress = Math.round((chapter.sort_order / 10) * 100);
  const keyTerms = (chapter.content_text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 5)
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 10);

  async function askTutor() {
    if (!chatInput.trim()) return;
    try {
      const res = await api('/api/chat', { method: 'POST', body: { message: chatInput } });
      setChatReply(res.reply || 'No response.');
    } catch (_) {
      setChatReply('Tutor is unavailable right now.');
    }
  }

  return (
    <div className={styles.main}>
      <aside className={styles.left}>
        <h3>Lesson list</h3>
        <ul className={styles.lessonList}>
          {chapters.map((c) => (
            <li key={c.id} className={c.id === chapter.id ? styles.activeLesson : ''}>
              <Link to={'/learn/' + c.slug}>{c.sort_order}. {c.title}</Link>
            </li>
          ))}
        </ul>
      </aside>

      <section className={styles.center}>
        <article className={styles.card}>
          <h1>{chapter.title || 'Lesson'}</h1>
          <p className={styles.objective}><strong>Learning objective:</strong> {objective}</p>

          <div className={styles.section}>
            <h3>Concept explanation</h3>
            <div className={styles.content}>{chapter.content_text || 'No content.'}</div>
          </div>

          <div className={styles.section}>
            <h3>Guided visualization</h3>
            <p className={styles.tryItDesc}>Open visual tools and map this concept with your own network setup.</p>
            <div className={styles.links}>
              <Link to="/editor">Open Network Builder</Link>
              <Link to="/playground">Open Classic Playground</Link>
            </div>
          </div>

          <div className={styles.section}>
            <h3>Micro-exploration task</h3>
            <p className={styles.tryItDesc}>Change one parameter, run again, and compare the behavior.</p>
            <label className={styles.checkline}>
              <input type="checkbox" checked={taskDone} onChange={(e) => setTaskDone(e.target.checked)} /> Task completed
            </label>
          </div>

          <div className={styles.section}>
            <h3>Quiz checkpoint</h3>
            <Link to={'/quiz?chapterId=' + chapter.id} className={styles.btnQuiz}>Take checkpoint quiz</Link>
          </div>

          <div className={styles.section}>
            <h3>Summary + next recommendation</h3>
            <p className={styles.tryItDesc}>
              You finished the core ideas for <strong>{chapter.title}</strong>. {next ? `Next lesson: ${next.title}.` : 'You completed all lessons.'}
            </p>
          </div>

          <div className={styles.bottomNav}>
            {prev ? <Link to={'/learn/' + prev.slug} className={styles.btnBack}>← Previous lesson</Link> : <span />}
            {next ? <Link to={'/learn/' + next.slug} className={styles.btnBack}>Next lesson →</Link> : <Link to="/profile" className={styles.btnBack}>Go to profile →</Link>}
          </div>
        </article>
      </section>

      <aside className={styles.right}>
        <div className={styles.card}>
          <h3>Key terms</h3>
          <div className={styles.termWrap}>
            {keyTerms.length ? keyTerms.map((term) => <span key={term} className={styles.termChip}>{term}</span>) : <span className={styles.termChip}>neural</span>}
          </div>
        </div>

        <div className={styles.card}>
          <h3>Progress in this lesson</h3>
          <div className={styles.lessonProgress}><span style={{ width: quizProgress + '%' }} /></div>
          <p className={styles.tryItDesc}>{quizProgress}% through this module track.</p>
        </div>

        <div className={styles.card}>
          <h3>Ask tutor</h3>
          <textarea className={styles.askBox} value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask anything about this lesson..." />
          <button type="button" className={styles.askBtn} onClick={askTutor}>Ask</button>
          {chatReply ? <p className={styles.tutorReply}>{chatReply}</p> : null}
        </div>

        <div className={styles.card}>
          <h3>Related glossary terms</h3>
          <div className={styles.termWrap}>
            {(keyTerms.slice(0, 4)).map((term) => <span key={term} className={styles.termChip}>{term}</span>)}
          </div>
          {(videos.length || docs.length) ? (
            <div className={styles.links}>
              {videos.map((url, i) => <a key={'v' + i} href={url} target="_blank" rel="noopener noreferrer">Video</a>)}
              {docs.map((url, i) => <a key={'d' + i} href={url} target="_blank" rel="noopener noreferrer">Doc</a>)}
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
