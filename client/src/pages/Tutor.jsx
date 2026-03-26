import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import styles from './Tutor.module.css';

const QUICK_PROMPTS = [
  'Explain backpropagation in simple words.',
  'What is the difference between loss and accuracy?',
  'How do I reduce overfitting in this model?',
  'Give me a mini quiz on activation functions.',
];

export default function Tutor() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I am your AI Tutor. Ask anything about concepts, quizzes, or model building.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function send(text) {
    const prompt = (text || input).trim();
    if (!prompt || loading) return;
    setLoading(true);
    setInput('');
    const userMsg = { role: 'user', content: prompt };
    setMessages((prev) => [...prev, userMsg]);
    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const data = await api('/api/chat', { method: 'POST', body: { message: prompt, history } });
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || 'No response.' }]);
    } catch (_) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Tutor is currently unavailable.', isError: true }]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    send();
  }

  return (
    <div className={styles.main}>
      <div className={styles.headerCard}>
        <h1>AI Tutor</h1>
        <p>Ask concepts, clear confusion, and get guided next steps tailored to your learning journey.</p>
        <div className={styles.headerActions}>
          <Link to="/learn">Go to Learning Path</Link>
          <Link to="/quiz">Take Quiz</Link>
        </div>
      </div>

      <div className={styles.layout}>
        <aside className={styles.side}>
          <h3>Quick prompts</h3>
          <div className={styles.promptList}>
            {QUICK_PROMPTS.map((p) => (
              <button key={p} type="button" onClick={() => send(p)}>{p}</button>
            ))}
          </div>
        </aside>

        <section className={styles.chatCard}>
          <div className={styles.messages}>
            {messages.map((m, i) => (
              <div key={i} className={`${styles.bubble} ${m.role === 'user' ? styles.user : styles.assistant} ${m.isError ? styles.err : ''}`}>
                {m.content}
              </div>
            ))}
            {loading ? <div className={`${styles.bubble} ${styles.assistant}`}>Thinking…</div> : null}
          </div>
          <form className={styles.form} onSubmit={onSubmit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your question..."
              maxLength={2000}
              disabled={loading}
            />
            <button type="submit" disabled={!input.trim() || loading}>Send</button>
          </form>
        </section>
      </div>
    </div>
  );
}
