import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Background from '../components/Background';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import styles from './Home.module.css';

// Real AI/tech images: Popsy illustrations (primary) + Unsplash fallbacks
const IMAGES = {
  hero: {
    primary: 'https://illustrations.popsy.co/teal/artificial-intelligence.svg',
    fallback: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
  },
  builder: {
    primary: 'https://illustrations.popsy.co/teal/coding.svg',
    fallback: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&q=80',
  },
  learn: {
    primary: 'https://illustrations.popsy.co/teal/developer-activity.svg',
    fallback: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80',
  },
  quiz: {
    primary: 'https://illustrations.popsy.co/teal/online-learning.svg',
    fallback: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400&q=80',
  },
  progress: {
    primary: 'https://illustrations.popsy.co/teal/data-report.svg',
    fallback: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80',
  },
  guide: {
    primary: 'https://illustrations.popsy.co/teal/rocket-launch.svg',
    fallback: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80',
  },
};

function ImgWithFallback({ primary, fallback, alt, className, ...props }) {
  const [src, setSrc] = useState(primary);
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setSrc(fallback)}
      {...props}
    />
  );
}

export default function Home() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!user) return;
    api('/api/profile').then(setProfile).catch(() => {});
  }, [user]);

  const weakTopics = useMemo(() => {
    if (!profile || !profile.byTopic) return [];
    return Object.entries(profile.byTopic)
      .map(([topic, stats]) => {
        const total = stats.total || 0;
        const correct = stats.correct || 0;
        const pct = total ? correct / total : 0;
        return { topic, pct };
      })
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 3)
      .map((x) => x.topic);
  }, [profile]);

  const nextLesson = useMemo(() => {
    if (!profile || !profile.chapterProgress) return null;
    return profile.chapterProgress.find((c) => !c.completed_at) || null;
  }, [profile]);

  const quickAccess = [
    { title: 'Start Learning', desc: 'Open course modules and begin your path.', to: '/learn' },
    { title: 'Build a Neural Network', desc: 'Use drag-and-drop to build architecture.', to: '/editor' },
    { title: 'Visualize Training', desc: 'Run and watch training behavior live.', to: '/playground' },
    { title: 'Take a Quiz', desc: 'Checkpoint your understanding with adaptive quiz.', to: '/quiz' },
    { title: 'Talk to Tutor AI', desc: 'Ask concepts and get guided support.', to: '/tutor' },
    { title: 'Learning Path', desc: 'Follow structured beginner-to-advanced flow.', to: '/learn' },
  ];

  const modulePreview = ['Neuron & Perceptron', 'Activation Functions', 'Loss Functions', 'Gradient Descent', 'Backpropagation', 'Overfitting & Generalization'];
  const popularCourses = [
    { title: 'Neural Networks 101', level: 'Beginner', students: '12.4k students', to: '/learn' },
    { title: 'Optimization in Deep Learning', level: 'Intermediate', students: '8.9k students', to: '/learn' },
    { title: 'CNNs for Vision', level: 'Intermediate', students: '10.2k students', to: '/learn' },
    { title: 'Debugging Model Training', level: 'Advanced', students: '6.3k students', to: '/learn' },
  ];

  return (
    <>
      <Background />
      <div className={styles.landing}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <p className={styles.heroKicker}>Interactive AI Learning Platform</p>
            <h1 className={styles.heroHeadline}>Learn deep learning like a pro, not from static slides.</h1>
            <p className={styles.heroText}>
              Explore concepts, build neural networks, track progress, and get AI-guided feedback in one modern workflow.
            </p>
            <div className={styles.heroActions}>
              <Link to="/learn" className={styles.heroBtnPrimary}>Start Learning</Link>
              <Link to="/editor" className={styles.heroBtnSecondary}>Open Builder</Link>
            </div>
          </div>
          <div className={styles.heroMedia}>
            <div className={styles.heroIllusWrap}>
              <ImgWithFallback primary={IMAGES.hero.primary} fallback={IMAGES.hero.fallback} alt="Learn AI visually" width={500} height={400} loading="eager" />
              <span className={styles.heroFloat1} aria-hidden="true" />
              <span className={styles.heroFloat2} aria-hidden="true" />
              <span className={styles.heroFloat3} aria-hidden="true" />
            </div>
          </div>
        </section>

        <section className={styles.surfaceSection}>
          <div className={styles.sectionHead}>
            <h2>Quick Access</h2>
            <p>Everything important, one click away.</p>
          </div>
          <div className={styles.featureGridSix}>
            {quickAccess.map((card, idx) => (
              <article className={styles.featureCard} key={card.title}>
                <div className={styles.featureCardImgWrap}>
                  <ImgWithFallback
                    primary={[IMAGES.builder.primary, IMAGES.learn.primary, IMAGES.hero.primary, IMAGES.quiz.primary, IMAGES.guide.primary, IMAGES.progress.primary][idx]}
                    fallback={[IMAGES.builder.fallback, IMAGES.learn.fallback, IMAGES.hero.fallback, IMAGES.quiz.fallback, IMAGES.guide.fallback, IMAGES.progress.fallback][idx]}
                    alt={card.title}
                    className={styles.featureCardImg}
                    width={260}
                    height={140}
                    loading="lazy"
                  />
                </div>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
                <Link to={card.to} className={styles.featureLink}>Open module</Link>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.loopSection}>
          <div className={styles.sectionHead}>
            <h2>How It Works</h2>
            <p>A complete learning loop from concept to recommendation.</p>
          </div>
          <div className={styles.loopSteps}>
            {['Learn concept', 'Build model', 'Visualize behavior', 'Take quiz', 'Get recommendation'].map((step, index) => (
              <article key={step} className={styles.loopStep}>
                <span>{index + 1}</span>
                <p>{step}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.surfaceSection}>
          <div className={styles.sectionHead}>
            <h2>Learning Modules</h2>
            <p>Structured lessons from fundamentals to advanced debugging.</p>
          </div>
          <div className={styles.moduleGrid}>
            {modulePreview.map((m) => (
              <article key={m} className={styles.moduleCard}>
                <h3>{m}</h3>
                <p>Concept explanation, guided visualization, micro task, quiz checkpoint.</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.surfaceSection}>
          <div className={styles.sectionHead}>
            <h2>Popular Courses</h2>
            <p>Most visited paths from learners this week.</p>
          </div>
          <div className={styles.popularGrid}>
            {popularCourses.map((c) => (
              <article key={c.title} className={styles.popularCard}>
                <h3>{c.title}</h3>
                <p>{c.level} • {c.students}</p>
                <Link to={c.to}>View course</Link>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.progressSection}>
          <div className={styles.progressPanel}>
            <h2>Continue Learning</h2>
            {user && profile ? (
              <>
                <p><strong>Completed modules:</strong> {profile.chapterProgress ? profile.chapterProgress.filter((c) => c.completed_at).length : 0}</p>
                <p><strong>Weak topics:</strong> {weakTopics.length ? weakTopics.join(', ') : 'No weak topics yet'}</p>
                <p><strong>Recommended next lesson:</strong> {nextLesson ? nextLesson.title : 'You completed all modules'}</p>
                {nextLesson ? <Link to={'/learn/' + nextLesson.slug} className={styles.ctaPrimary}>Continue next lesson</Link> : <Link to="/profile" className={styles.ctaPrimary}>Go to profile</Link>}
              </>
            ) : (
              <>
                <p>New learner? Start with a diagnostic and follow the beginner path.</p>
                <div className={styles.ctaRow}>
                  <Link to="/quiz" className={styles.ctaPrimary}>Take Diagnostic Quiz</Link>
                  <Link to="/learn" className={styles.ctaSecondary}>Start Beginner Path</Link>
                </div>
              </>
            )}
          </div>
          <div className={styles.tutorPanel}>
            <h3>Need help right now?</h3>
            <p>Ask Tutor AI about any concept, quiz answer, or training issue.</p>
            <Link to="/tutor" className={styles.ctaPrimary}>Open Tutor AI</Link>
          </div>
        </section>

        <Link to="/tutor" className={styles.tutorFab} aria-label="Open AI Tutor">🤖</Link>
      </div>
    </>
  );
}
