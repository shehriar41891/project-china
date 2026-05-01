/**
 * Full-stack server: SQLite (users, quiz), auth, Mistral adaptive learning.
 * Run: npm run server  (after: npm run prep)
 * Set MISTRAL_API_KEY and SESSION_SECRET in .env (see .env.example).
 */
try { require('dotenv').config({ path: require('path').join(__dirname, '.env') }); } catch (e) {
  try {
    const fs = require('fs');
    const p = require('path').join(__dirname, '.env');
    if (fs.existsSync(p)) {
      fs.readFileSync(p, 'utf8').split('\n').forEach(function (line) {
        const m = line.match(/^\s*([^#=]+)=(.*)$/);
        if (m) process.env[m[1].trim()] = (m[2] || '').trim();
      });
    }
  } catch (_) {}
}
const fs = require('fs');
const path = require('path');
const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');

const PORT = process.env.PORT || 3000;
const DIST = path.join(__dirname, 'dist');
const DATA_DIR = path.join(__dirname, 'data');
const SESSION_DIR = path.join(DATA_DIR, 'sessions');
const DB_PATH = path.join(DATA_DIR, 'playground.db');
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || '';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-in-production';
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_TTL_SEC = Math.floor(SESSION_MAX_AGE_MS / 1000);

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

// ----- SQLite -----
const Database = require('better-sqlite3');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 8000');
db.exec(`
  CREATE TABLE IF NOT EXISTS store ( key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT DEFAULT (datetime('now')) );
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    started_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    total_questions INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    topics_json TEXT,
    context_for_retake TEXT,
    chapter_id INTEGER
  );
  CREATE TABLE IF NOT EXISTS quiz_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attempt_id INTEGER NOT NULL REFERENCES quiz_attempts(id),
    question_text TEXT NOT NULL,
    topic TEXT,
    options_json TEXT,
    user_answer_index INTEGER,
    correct_index INTEGER,
    is_correct INTEGER NOT NULL,
    model_feedback TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    content_text TEXT NOT NULL,
    video_links TEXT,
    doc_links TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS chapter_progress (
    user_id INTEGER NOT NULL REFERENCES users(id),
    chapter_id INTEGER NOT NULL REFERENCES chapters(id),
    completed_at TEXT,
    quiz_best_correct INTEGER,
    quiz_best_total INTEGER,
    PRIMARY KEY (user_id, chapter_id)
  );
`);
try { db.exec('ALTER TABLE quiz_attempts ADD COLUMN chapter_id INTEGER'); } catch (e) {}
try { db.exec('ALTER TABLE chapter_progress ADD COLUMN progress_pct INTEGER DEFAULT 0'); } catch (e) {}
try { db.exec('ALTER TABLE chapter_progress ADD COLUMN materials_confirmed INTEGER DEFAULT 0'); } catch (e) {}
try { db.exec('ALTER TABLE chapter_progress ADD COLUMN quiz_confirmed INTEGER DEFAULT 0'); } catch (e) {}
console.log('SQLite DB:', DB_PATH);
console.log('Session store (file):', SESSION_DIR);

// Seed chapters if empty
const chapterCount = db.prepare('SELECT COUNT(*) as c FROM chapters').get().c;
if (chapterCount === 0) {
  const chapters = [
    { title: 'Introduction to Neural Networks', slug: 'intro-neural-nets', order: 1, content: 'Neural networks are computing systems inspired by biological brains. They consist of layers of nodes (neurons) that process inputs and produce outputs. Each connection has a weight that is adjusted during training. This chapter covers the basic structure: input layer, hidden layers, and output layer, and how data flows forward through the network.', videos: '["https://www.youtube.com/watch?v=aircAruvnKk"]', docs: '["https://en.wikipedia.org/wiki/Artificial_neural_network"]' },
    { title: 'Neurons and Activation Functions', slug: 'neurons-activation', order: 2, content: 'A single neuron receives inputs, multiplies them by weights, sums the result, and applies an activation function. Common activations: ReLU (max(0,x)), Sigmoid (squashes to 0–1), Tanh (squashes to -1–1), and Linear. The choice of activation affects learning and the kinds of patterns the network can learn.', videos: '["https://www.youtube.com/watch?v=68BZ5f7P94E"]', docs: '["https://en.wikipedia.org/wiki/Activation_function"]' },
    { title: 'Layers and Network Architecture', slug: 'layers-architecture', order: 3, content: 'Layers are groups of neurons. The input layer holds your features; hidden layers transform them; the output layer produces predictions. Deeper networks can learn more complex patterns but need more data and care to train. Width (neurons per layer) and depth (number of layers) are key design choices.', videos: '["https://www.youtube.com/watch?v=IHZwWFHWa-w"]', docs: '["https://www.deeplearningbook.org/contents/mlp.html"]' },
    { title: 'Loss Functions', slug: 'loss-functions', order: 4, content: 'A loss function measures how wrong the network\'s predictions are. For regression, Mean Squared Error (MSE) is common. For classification, Cross-Entropy is standard. The goal of training is to minimize the loss on the training data by adjusting weights.', videos: '["https://www.youtube.com/watch?v=eqEc66RFY0I"]', docs: '["https://en.wikipedia.org/wiki/Loss_function"]' },
    { title: 'Gradient Descent and Backpropagation', slug: 'gradient-backprop', order: 5, content: 'Gradient descent updates weights in the direction that reduces the loss. Backpropagation is the algorithm that computes the gradient of the loss with respect to every weight using the chain rule. Learning rate controls how big each update step is.', videos: '["https://www.youtube.com/watch?v=IHZwWFHWa-w"]', docs: '["https://en.wikipedia.org/wiki/Backpropagation"]' },
    { title: 'Optimizers: SGD, Adam', slug: 'optimizers', order: 6, content: 'Optimizers decide how to update weights from gradients. Stochastic Gradient Descent (SGD) uses a fixed or decaying learning rate. Adam adapts the learning rate per parameter using momentum and scaling, and often converges faster. Other options include RMSprop and AdaGrad.', videos: '["https://www.youtube.com/watch?v=3kjxzq7cXOk"]', docs: '["https://ruder.io/optimizing-gradient-descent/"]' },
    { title: 'Overfitting and Regularization', slug: 'regularization', order: 7, content: 'Overfitting means the model memorizes training data and fails on new data. Regularization reduces overfitting: L2 (weight decay), Dropout (randomly disabling neurons), and early stopping. Validation data is used to monitor generalization.', videos: '["https://www.youtube.com/watch?v=EuBBz3bI-aA"]', docs: '["https://en.wikipedia.org/wiki/Regularization_(mathematics)"]' },
    { title: 'Convolutional Neural Networks (CNNs)', slug: 'cnns', order: 8, content: 'CNNs are designed for grid-like data (images). Convolutional layers apply filters to detect local patterns (edges, textures). Pooling layers reduce spatial size. Stacking these layers builds up from low-level to high-level features, leading to state-of-the-art image recognition.', videos: '["https://www.youtube.com/watch?v=YRhxdVk_sIs"]', docs: '["https://cs231n.github.io/convolutional-networks/"]' },
    { title: 'Recurrent Networks and RNNs', slug: 'rnns', order: 9, content: 'RNNs process sequences by maintaining a hidden state that carries information across time steps. They are used for text, speech, and time series. Long Short-Term Memory (LSTM) and Gated Recurrent Units (GRU) address the vanishing gradient problem in basic RNNs.', videos: '["https://www.youtube.com/watch?v=UNmqTiOnRfg"]', docs: '["https://en.wikipedia.org/wiki/Recurrent_neural_network"]' },
    { title: 'Data and Training Practice', slug: 'data-training', order: 10, content: 'Good data and training practice are essential. Topics: train/validation/test split, normalization and preprocessing, batch size and epochs, monitoring loss and metrics, and debugging (e.g., checking gradients and overfitting).', videos: '["https://www.youtube.com/watch?v=fSytzGwwBVw"]', docs: '["https://www.deeplearningbook.org/contents/optimization.html"]' }
  ];
  const ins = db.prepare('INSERT INTO chapters (title, slug, sort_order, content_text, video_links, doc_links) VALUES (?, ?, ?, ?, ?, ?)');
  chapters.forEach(c => ins.run(c.title, c.slug, c.order, c.content, c.videos || '[]', c.docs || '[]'));
  console.log('Seeded 10 chapters');
}

// Replace YouTube URLs that became private/unlisted (chapters 2, 6, 10 by slug)
const CHAPTER_VIDEO_FIXES = [
  { slug: 'neurons-activation', videos: '["https://www.youtube.com/watch?v=68BZ5f7P94E"]' },
  { slug: 'optimizers', videos: '["https://www.youtube.com/watch?v=3kjxzq7cXOk"]' },
  { slug: 'data-training', videos: '["https://www.youtube.com/watch?v=fSytzGwwBVw"]' }
];
const fixChapterVideos = db.prepare('UPDATE chapters SET video_links = ? WHERE slug = ?');
CHAPTER_VIDEO_FIXES.forEach(({ slug, videos }) => fixChapterVideos.run(videos, slug));

const getStore = db.prepare('SELECT value FROM store WHERE key = ?');
const setStore = db.prepare(`INSERT INTO store (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`);
function storeGet(key) { const r = getStore.get(key); return r ? r.value : null; }
function storeSet(key, val) { setStore.run(key, typeof val === 'string' ? val : JSON.stringify(val)); }

// ----- Express -----
const app = express();
const isProduction = process.env.NODE_ENV === 'production';
// Behind Render / other reverse proxies, required for secure cookies and correct client IP
if (isProduction) {
  app.set('trust proxy', 1);
}

const sessionStore = new FileStore({
  path: SESSION_DIR,
  ttl: SESSION_TTL_SEC,
  retries: 1,
  logFn: function () {}
});

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  store: sessionStore,
  name: 'connect.sid',
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: false,
  cookie: {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_MS,
    sameSite: 'lax',
    secure: isProduction,
    path: '/'
  }
}));

function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  res.status(401).json({ error: 'Not authenticated' });
}

// ----- Auth -----
app.post('/api/auth/signup', (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password || !name) return res.status(400).json({ error: 'Email, password and name required' });
  const hash = bcrypt.hashSync(password, 10);
  try {
    const stmt = db.prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)');
    stmt.run(email.trim().toLowerCase(), hash, (name || '').trim());
    const row = db.prepare('SELECT id, email, name FROM users WHERE email = ?').get(email.trim().toLowerCase());
    req.session.userId = row.id;
    req.session.userEmail = row.email;
    req.session.userName = row.name;
    return res.json({ user: { id: row.id, email: row.email, name: row.name } });
  } catch (e) {
    if (e.message && e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already registered' });
    return res.status(500).json({ error: 'Signup failed' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const user = db.prepare('SELECT id, email, name, password_hash FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: 'Invalid email or password' });
  req.session.userId = user.id;
  req.session.userEmail = user.email;
  req.session.userName = user.name;
  res.json({ user: { id: user.id, email: user.email, name: user.name } });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session || !req.session.userId) return res.status(401).json({ error: 'Not logged in' });
  res.json({ user: { id: req.session.userId, email: req.session.userEmail, name: req.session.userName } });
});

// ----- Legacy graph/preferences (keyed by user or anonymous) -----
app.get('/api/graph', (req, res) => {
  const key = req.session && req.session.userId ? `graph:${req.session.userId}` : 'graph';
  res.json(storeGet(key) ? JSON.parse(storeGet(key)) : null);
});
app.post('/api/graph', (req, res) => {
  const key = req.session && req.session.userId ? `graph:${req.session.userId}` : 'graph';
  storeSet(key, JSON.stringify(req.body || {}));
  res.json({ ok: true });
});
app.get('/api/preferences', (req, res) => {
  const key = req.session && req.session.userId ? `preferences:${req.session.userId}` : 'preferences';
  res.json(storeGet(key) ? JSON.parse(storeGet(key)) : {});
});
app.post('/api/preferences', (req, res) => {
  const key = req.session && req.session.userId ? `preferences:${req.session.userId}` : 'preferences';
  storeSet(key, JSON.stringify(req.body || {}));
  res.json({ ok: true });
});

// ----- Mistral -----
async function mistralChat(messages, options = {}) {
  if (!MISTRAL_API_KEY) throw new Error('MISTRAL_API_KEY not set');
  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + MISTRAL_API_KEY
    },
    body: JSON.stringify({
      model: options.model || 'mistral-small-latest',
      messages,
      max_tokens: options.max_tokens || 1024,
      temperature: options.temperature ?? 0.3,
      response_format: options.json ? { type: 'json_object' } : undefined
    })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error('Mistral API: ' + res.status + ' ' + t);
  }
  const data = await res.json();
  const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  return content || '';
}

// ----- Chapters -----
app.get('/api/chapters', requireAuth, (req, res) => {
  const chapters = db.prepare('SELECT id, title, slug, sort_order, video_links FROM chapters ORDER BY sort_order').all();
  const progress = db.prepare('SELECT chapter_id, completed_at, quiz_best_correct, quiz_best_total, progress_pct, materials_confirmed, quiz_confirmed FROM chapter_progress WHERE user_id = ?').all(req.session.userId);
  const progressMap = {};
  progress.forEach(p => { progressMap[p.chapter_id] = p; });
  const list = chapters.map(c => {
    let video_links = [];
    try { video_links = JSON.parse(c.video_links || '[]'); } catch (_) {}
    const pr = progressMap[c.id];
    const progress_pct = pr ? computeChapterProgressPct(pr) : 0;
    const materials_confirmed = pr ? !!pr.materials_confirmed : false;
    const quiz_done = pr ? pr.quiz_best_total > 0 : false;
    return {
      id: c.id,
      title: c.title,
      slug: c.slug,
      sort_order: c.sort_order,
      video_links,
      completed_at: pr ? pr.completed_at : null,
      progress_pct,
      materials_confirmed,
      quiz_confirmed: pr ? !!pr.quiz_confirmed : false,
      quiz_done,
      quiz_best: pr ? (pr.quiz_best_total > 0 ? pr.quiz_best_correct + '/' + pr.quiz_best_total : null) : null
    };
  });
  res.json({ chapters: list });
});

app.get('/api/chapters/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const ch = db.prepare('SELECT id, title, slug, sort_order, content_text, video_links, doc_links FROM chapters WHERE id = ?').get(id);
  if (!ch) return res.status(404).json({ error: 'Chapter not found' });
  let video_links = []; let doc_links = [];
  try { video_links = JSON.parse(ch.video_links || '[]'); } catch (_) {}
  try { doc_links = JSON.parse(ch.doc_links || '[]'); } catch (_) {}
  res.json({
    id: ch.id,
    title: ch.title,
    slug: ch.slug,
    sort_order: ch.sort_order,
    content_text: ch.content_text,
    video_links,
    doc_links
  });
});

app.post('/api/chapters/:id/start', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const ch = db.prepare('SELECT id FROM chapters WHERE id = ?').get(id);
  if (!ch) return res.status(404).json({ error: 'Chapter not found' });
  db.prepare('INSERT OR IGNORE INTO chapter_progress (user_id, chapter_id) VALUES (?, ?)').run(req.session.userId, id);
  res.json({ ok: true });
});

function getChapterProgressRow(userId, chapterId) {
  return db.prepare('SELECT completed_at, quiz_best_correct, quiz_best_total, progress_pct, materials_confirmed, quiz_confirmed FROM chapter_progress WHERE user_id = ? AND chapter_id = ?').get(userId, chapterId);
}

/** 50% = materials confirmed, 50% = chapter quiz completed (quiz_best_total > 0). */
function computeChapterProgressPct(row) {
  if (!row) return 0;
  const m = row.materials_confirmed ? 50 : 0;
  const q = row.quiz_best_total > 0 ? 50 : 0;
  return Math.min(100, m + q);
}

function persistChapterProgressPct(userId, chapterId) {
  const row = getChapterProgressRow(userId, chapterId);
  if (!row) return 0;
  const pct = computeChapterProgressPct(row);
  db.prepare('UPDATE chapter_progress SET progress_pct = ? WHERE user_id = ? AND chapter_id = ?').run(pct, userId, chapterId);
  return pct;
}

function migrateAllChapterProgressPct() {
  try {
    const rows = db.prepare('SELECT user_id, chapter_id FROM chapter_progress').all();
    rows.forEach((r) => {
      try {
        persistChapterProgressPct(r.user_id, r.chapter_id);
      } catch (_) {}
    });
  } catch (_) {}
}
migrateAllChapterProgressPct();

/** Confirm learning materials reviewed (50% of chapter progress when quiz is still pending). */
app.post('/api/chapters/:id/confirm-materials', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const ch = db.prepare('SELECT id FROM chapters WHERE id = ?').get(id);
  if (!ch) return res.status(404).json({ error: 'Chapter not found' });
  db.prepare('INSERT OR IGNORE INTO chapter_progress (user_id, chapter_id, progress_pct) VALUES (?, ?, 0)').run(req.session.userId, id);
  const row = getChapterProgressRow(req.session.userId, id);
  if (row.materials_confirmed) {
    return res.json({ ok: true, progress_pct: computeChapterProgressPct(row), already: true });
  }
  db.prepare('UPDATE chapter_progress SET materials_confirmed = 1 WHERE user_id = ? AND chapter_id = ?').run(req.session.userId, id);
  const pct = persistChapterProgressPct(req.session.userId, id);
  res.json({ ok: true, progress_pct: pct });
});

/** Optional: mark that you acknowledged the quiz score (progress is driven by quiz_best_*). */
app.post('/api/chapters/:id/confirm-quiz', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const ch = db.prepare('SELECT id FROM chapters WHERE id = ?').get(id);
  if (!ch) return res.status(404).json({ error: 'Chapter not found' });
  db.prepare('INSERT OR IGNORE INTO chapter_progress (user_id, chapter_id, progress_pct) VALUES (?, ?, 0)').run(req.session.userId, id);
  const row = getChapterProgressRow(req.session.userId, id);
  if (!row || !row.quiz_best_total) {
    return res.status(400).json({ error: 'Complete the chapter quiz first' });
  }
  if (row.quiz_confirmed) {
    return res.json({ ok: true, progress_pct: computeChapterProgressPct(row), already: true });
  }
  db.prepare('UPDATE chapter_progress SET quiz_confirmed = 1 WHERE user_id = ? AND chapter_id = ?').run(req.session.userId, id);
  const pct = persistChapterProgressPct(req.session.userId, id);
  res.json({ ok: true, progress_pct: pct });
});

/** Mark chapter finished only when materials + chapter quiz are both done (100% progress). */
app.post('/api/chapters/:id/complete-chapter', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const ch = db.prepare('SELECT id FROM chapters WHERE id = ?').get(id);
  if (!ch) return res.status(404).json({ error: 'Chapter not found' });
  db.prepare('INSERT OR IGNORE INTO chapter_progress (user_id, chapter_id, progress_pct) VALUES (?, ?, 0)').run(req.session.userId, id);
  const row = getChapterProgressRow(req.session.userId, id);
  if (row && row.completed_at) {
    return res.json({ ok: true, progress_pct: 100, already: true, completed_at: row.completed_at });
  }
  const pct = computeChapterProgressPct(row);
  if (pct < 100) {
    return res.status(400).json({ error: 'completeMaterialsAndQuizFirst', progress_pct: pct });
  }
  db.prepare("UPDATE chapter_progress SET completed_at = datetime('now'), progress_pct = 100 WHERE user_id = ? AND chapter_id = ?").run(req.session.userId, id);
  res.json({ ok: true, progress_pct: 100, completed_at: new Date().toISOString() });
});

// ----- Quiz: start attempt -----
app.post('/api/quiz/start', requireAuth, (req, res) => {
  const { contextForRetake, chapterId } = req.body || {};
  const context = contextForRetake || null;
  const cid = chapterId ? parseInt(chapterId, 10) : null;
  const stmt = db.prepare('INSERT INTO quiz_attempts (user_id, context_for_retake, chapter_id) VALUES (?, ?, ?)');
  const r = stmt.run(req.session.userId, context, cid);
  const id = r.lastInsertRowid;
  res.json({ attemptId: id });
});

// ----- Quiz: get next question (adaptive via Mistral) -----
app.post('/api/quiz/question', requireAuth, async (req, res) => {
  const { attemptId, previousQuestion, userAnswerIndex, correctIndex, topic } = req.body || {};
  const attempt = db.prepare('SELECT id, user_id, context_for_retake, chapter_id FROM quiz_attempts WHERE id = ? AND user_id = ?').get(attemptId, req.session.userId);
  if (!attempt) return res.status(404).json({ error: 'Attempt not found' });

  const existingCount = db.prepare('SELECT COUNT(*) as c FROM quiz_answers WHERE attempt_id = ?').get(attemptId).c;
  const QUESTIONS_PER_ATTEMPT = 6;

  if (existingCount >= QUESTIONS_PER_ATTEMPT) {
    const att = db.prepare('SELECT total_questions, correct_count, chapter_id FROM quiz_attempts WHERE id = ?').get(attemptId);
    return res.json({ done: true, totalQuestions: att ? att.total_questions : QUESTIONS_PER_ATTEMPT, correctCount: att ? att.correct_count : 0, chapterId: att ? att.chapter_id : null });
  }

  let chapterTopic = '';
  let chapterMaterial = '';
  if (attempt.chapter_id) {
    const ch = db.prepare('SELECT title, content_text FROM chapters WHERE id = ?').get(attempt.chapter_id);
    if (ch) {
      chapterTopic = ` The quiz is ONLY for this chapter: "${ch.title}". Every question must test understanding of this lesson—do not ask about unrelated topics (e.g. no CNN/RNN questions if this chapter is introductory).`;
      const raw = (ch.content_text || '').trim();
      if (raw) {
        const snippet = raw.length > 4000 ? raw.slice(0, 4000) + '…' : raw;
        chapterMaterial = `\n\nUse this chapter material to write accurate, grounded questions (paraphrase concepts; do not copy long excerpts):\n${snippet}`;
      }
    }
  }

  // Adaptive: fetch user's past attempts for this chapter (or all) to build weak-topics context
  let pastContext = '';
  const pastAttempts = attempt.chapter_id
    ? db.prepare('SELECT id FROM quiz_attempts WHERE user_id = ? AND chapter_id = ? AND id != ? AND completed_at IS NOT NULL ORDER BY id DESC LIMIT 3').all(req.session.userId, attempt.chapter_id, attemptId)
    : db.prepare('SELECT id FROM quiz_attempts WHERE user_id = ? AND id != ? AND completed_at IS NOT NULL ORDER BY id DESC LIMIT 2').all(req.session.userId, attemptId);
  if (pastAttempts.length > 0) {
    const pastIds = pastAttempts.map(a => a.id);
    const placeholders = pastIds.map(() => '?').join(',');
    const pastAnswers = db.prepare(`SELECT topic, is_correct FROM quiz_answers WHERE attempt_id IN (${placeholders})`).all(...pastIds);
    const weakTopics = [];
    const topicCount = {};
    pastAnswers.forEach(a => {
      if (!a.is_correct && a.topic) {
        topicCount[a.topic] = (topicCount[a.topic] || 0) + 1;
      }
    });
    Object.entries(topicCount).sort((a, b) => b[1] - a[1]).slice(0, 4).forEach(([t]) => weakTopics.push(t));
    if (weakTopics.length > 0) pastContext = ' The learner often gets wrong: ' + weakTopics.join(', ') + '. Prefer questions that reinforce these topics with different wording.';
  }

  const isRetake = !!attempt.context_for_retake || !!pastContext;
  const retakeInstruction = isRetake
    ? ' This is a RETAKE: ask about the SAME concepts/topics as before (e.g. activation functions, backpropagation) but with a NEW question—different wording, different scenario, different wrong options. Same underlying concept, different question.'
    : '';
  const topicScope = attempt.chapter_id
    ? 'Question must align with the chapter title and material above only.'
    : 'Topics may span basics (neurons, layers, activation), backpropagation, CNNs, RNNs, optimization (SGD, Adam), regularization, loss functions, data preprocessing.';
  let systemPrompt = `You are a teacher for an adaptive learning platform about neural networks and deep learning.${chapterTopic}${chapterMaterial}${pastContext}
${topicScope}
Generate exactly ONE multiple-choice question (4 options, one correct).
Output ONLY valid JSON with this exact structure (no markdown):
{"question":"...","options":["A","B","C","D"],"correctIndex":0,"topic":"short topic name"}${retakeInstruction}`;

  const history = db.prepare('SELECT question_text, topic, user_answer_index, correct_index, is_correct FROM quiz_answers WHERE attempt_id = ? ORDER BY id').all(attemptId);
  let userPrompt = 'Generate the first question for a short quiz (6 questions total).';
  if (history.length > 0) {
    const last = history[history.length - 1];
    userPrompt = `Previous Q: ${last.question_text}. User chose index ${last.user_answer_index}, correct was ${last.correct_index}. Topic: ${last.topic}. Generate the next question (${history.length + 1}/6).`;
    if (isRetake) userPrompt += ' Same concept/topic as before but ask in a different way (new scenario, new phrasing).';
  } else if (attempt.context_for_retake) {
    userPrompt = 'Retake quiz. Context from previous attempt: ' + attempt.context_for_retake + '. Generate the first question (1/6). Cover the SAME concepts/topics but with a completely different question—different wording and options.';
  }

  try {
    const out = await mistralChat([{ role: 'user', content: systemPrompt + '\n\n' + userPrompt }], { json: true });
    let parsed;
    try {
      const cleaned = out.replace(/```json?\s*/g, '').replace(/```\s*$/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (_) {
      parsed = { question: 'What is a neuron in a neural network?', options: ['A single computation unit', 'A layer', 'An optimizer', 'A dataset'], correctIndex: 0, topic: 'basics' };
    }
    if (!parsed.options || !Array.isArray(parsed.options)) parsed.options = [parsed.option1, parsed.option2, parsed.option3, parsed.option4].filter(Boolean) || ['A', 'B', 'C', 'D'];
    if (typeof parsed.correctIndex !== 'number') parsed.correctIndex = 0;
    return res.json({ question: parsed.question, options: parsed.options, correctIndex: parsed.correctIndex, topic: parsed.topic || 'general' });
  } catch (e) {
    console.error('Mistral question error:', e.message);
    return res.status(500).json({ error: 'Failed to generate question', detail: e.message });
  }
});

// ----- Quiz: submit answer -----
app.post('/api/quiz/answer', requireAuth, (req, res) => {
  const { attemptId, questionText, topic, options, userAnswerIndex, correctIndex } = req.body || {};
  const attempt = db.prepare('SELECT id FROM quiz_attempts WHERE id = ? AND user_id = ?').get(attemptId, req.session.userId);
  if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
  const correct = Number(userAnswerIndex) === Number(correctIndex);
  db.prepare('INSERT INTO quiz_answers (attempt_id, question_text, topic, options_json, user_answer_index, correct_index, is_correct) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    attemptId, questionText || '', topic || '', JSON.stringify(options || []), userAnswerIndex, correctIndex, correct ? 1 : 0
  );
  const counts = db.prepare('SELECT COUNT(*) as total, SUM(is_correct) as correct FROM quiz_answers WHERE attempt_id = ?').get(attemptId);
  db.prepare('UPDATE quiz_attempts SET total_questions = ?, correct_count = ? WHERE id = ?').run(counts.total, counts.correct || 0, attemptId);
  res.json({ correct, correctIndex });
});

// ----- Quiz: complete attempt (set completed_at, build context for retake) -----
app.post('/api/quiz/complete', requireAuth, async (req, res) => {
  const { attemptId } = req.body || {};
  const attempt = db.prepare('SELECT id, user_id FROM quiz_attempts WHERE id = ? AND user_id = ?').get(attemptId, req.session.userId);
  if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
  const answers = db.prepare('SELECT question_text, topic, is_correct FROM quiz_answers WHERE attempt_id = ?').all(attemptId);
  let contextForRetake = '';
  if (answers.length > 0) {
    try {
      const summary = answers.map(a => `${a.topic}: ${a.is_correct ? 'correct' : 'wrong'}`).join('; ');
      contextForRetake = await mistralChat([{
        role: 'user',
        content: `In one short paragraph (2-3 sentences), summarize this quiz result for adaptive retake: ${summary}. Mention weak topics. No JSON.`
      }], { max_tokens: 200 });
    } catch (_) {}
  }
  db.prepare("UPDATE quiz_attempts SET completed_at = datetime('now'), context_for_retake = ? WHERE id = ?").run(contextForRetake, attemptId);
  const att = db.prepare('SELECT chapter_id, correct_count, total_questions FROM quiz_attempts WHERE id = ?').get(attemptId);
  if (att && att.chapter_id) {
    const cur = db.prepare('SELECT quiz_best_correct, quiz_best_total FROM chapter_progress WHERE user_id = ? AND chapter_id = ?').get(req.session.userId, att.chapter_id);
    const newCorrect = att.correct_count || 0;
    const newTotal = att.total_questions || 0;
    const isBetter = !cur || (newTotal > 0 && (!cur.quiz_best_total || (newCorrect / newTotal) >= (cur.quiz_best_correct / cur.quiz_best_total)));
    if (isBetter && newTotal > 0) {
      db.prepare(`INSERT INTO chapter_progress (user_id, chapter_id, quiz_best_correct, quiz_best_total) VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id, chapter_id) DO UPDATE SET quiz_best_correct = excluded.quiz_best_correct, quiz_best_total = excluded.quiz_best_total`).run(
        req.session.userId, att.chapter_id, newCorrect, newTotal
      );
      persistChapterProgressPct(req.session.userId, att.chapter_id);
    }
  }
  const final = db.prepare('SELECT total_questions, correct_count FROM quiz_attempts WHERE id = ?').get(attemptId);
  res.json({ ok: true, totalQuestions: final ? final.total_questions : 0, correctCount: final ? final.correct_count : 0 });
});

// ----- Quiz: list attempts -----
app.get('/api/quiz/attempts', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT id, started_at, completed_at, total_questions, correct_count, context_for_retake, chapter_id FROM quiz_attempts WHERE user_id = ? ORDER BY id DESC LIMIT 50').all(req.session.userId);
  res.json({ attempts: rows });
});

// ----- Quiz: retake context for a chapter (for "Retake" button on quiz page) -----
app.get('/api/quiz/retake-context', requireAuth, (req, res) => {
  const chapterId = parseInt(req.query.chapterId, 10);
  if (!chapterId) return res.status(400).json({ error: 'chapterId required' });
  const row = db.prepare(`
    SELECT context_for_retake FROM quiz_attempts
    WHERE user_id = ? AND chapter_id = ? AND completed_at IS NOT NULL AND context_for_retake IS NOT NULL AND context_for_retake != ''
    ORDER BY id DESC LIMIT 1
  `).get(req.session.userId, chapterId);
  res.json({ contextForRetake: row ? row.context_for_retake : null });
});

// ----- Profile: stats + LLM recommendations -----
app.get('/api/profile', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  const chapters = db.prepare('SELECT id, title, slug, sort_order FROM chapters ORDER BY sort_order').all();
  const prog = db.prepare('SELECT chapter_id, completed_at, quiz_best_correct, quiz_best_total, progress_pct, materials_confirmed, quiz_confirmed FROM chapter_progress WHERE user_id = ?').all(userId);
  const progressMap = {};
  prog.forEach(p => { progressMap[p.chapter_id] = p; });
  // Last completed attempt per chapter (for retake context)
  const lastAttemptByChapter = db.prepare(`
    SELECT chapter_id, context_for_retake FROM quiz_attempts
    WHERE user_id = ? AND chapter_id IS NOT NULL AND completed_at IS NOT NULL AND context_for_retake IS NOT NULL AND context_for_retake != ''
    ORDER BY id DESC
  `).all(userId);
  const retakeContextByChapter = {};
  lastAttemptByChapter.forEach(row => {
    if (retakeContextByChapter[row.chapter_id] == null) retakeContextByChapter[row.chapter_id] = row.context_for_retake;
  });
  const chapterProgress = chapters.map(c => {
    const p = progressMap[c.id];
    const total = p ? (p.quiz_best_total || 0) : 0;
    const correct = p ? (p.quiz_best_correct || 0) : 0;
    const needsRetake = total > 0 && correct < total;
    const progress_pct = p ? computeChapterProgressPct(p) : 0;
    const materials_confirmed = p ? !!p.materials_confirmed : false;
    const quiz_done = total > 0;
    return {
      id: c.id,
      title: c.title,
      slug: c.slug,
      sort_order: c.sort_order,
      completed_at: p ? p.completed_at : null,
      progress_pct,
      materials_confirmed,
      quiz_confirmed: p ? !!p.quiz_confirmed : false,
      quiz_done,
      quiz_best: total > 0 ? correct + '/' + total : null,
      quiz_best_correct: correct,
      quiz_best_total: total,
      needs_retake: needsRetake,
      retake_context: retakeContextByChapter[c.id] || null
    };
  });
  const nCh = chapterProgress.length || 1;
  const overall_progress_pct = Math.round(
    chapterProgress.reduce((sum, x) => sum + (x.progress_pct || 0), 0) / nCh
  );
  const attempts = db.prepare('SELECT id, started_at, completed_at, total_questions, correct_count, chapter_id FROM quiz_attempts WHERE user_id = ? ORDER BY id DESC').all(userId);
  const answers = db.prepare(`
    SELECT a.attempt_id, a.topic, a.is_correct FROM quiz_answers a
    JOIN quiz_attempts t ON t.id = a.attempt_id WHERE t.user_id = ?
  `).all(userId);
  const byTopic = {};
  answers.forEach(a => {
    if (!byTopic[a.topic]) byTopic[a.topic] = { correct: 0, total: 0 };
    byTopic[a.topic].total++;
    if (a.is_correct) byTopic[a.topic].correct++;
  });
  let recommendations = '';
  if (answers.length > 0 && MISTRAL_API_KEY) {
    try {
      const topicSummary = Object.entries(byTopic).map(([t, s]) => `${t}: ${s.correct}/${s.total} correct`).join('; ');
      recommendations = await mistralChat([{
        role: 'user',
        content: `As a friendly learning coach, in 3-4 short bullet points: suggest what this learner should focus on next for neural networks/deep learning. Be specific and encouraging. Quiz summary: ${topicSummary}. Do not use markdown. Plain text bullets only.`
      }], { max_tokens: 400 });
    } catch (e) {
      recommendations = 'Recommendations will appear here after you complete quizzes.';
    }
  } else {
    recommendations = 'Complete at least one quiz to get personalized recommendations.';
  }
  res.json({
    user: { id: req.session.userId, email: req.session.userEmail, name: req.session.userName },
    chapterProgress,
    overall_progress_pct,
    attempts,
    byTopic,
    recommendations
  });
});

/**
 * Mastery per chapter: 50/50 blend of latest quiz accuracy % and average of prior attempts %.
 * Status: <50 Weak, 50–69 Developing, ≥70 Strong.
 */
function attemptAccuracyPct(row) {
  const tq = row.total_questions;
  if (!tq || tq <= 0) return null;
  return (100 * (row.correct_count || 0)) / tq;
}

function masteryFromAttempts(attemptRowsNewestFirst) {
  const list = (attemptRowsNewestFirst || []).filter((r) => r && r.total_questions > 0);
  if (!list.length) {
    return {
      masteryScore: null,
      status: 'Developing',
      nextAction: 'review',
      reasonCode: 'NO_DATA',
      latestAccuracy: null,
      previousAverageAccuracy: null
    };
  }
  const latest = list[0];
  const L = attemptAccuracyPct(latest);
  const prev = list.slice(1);
  let masteryScore;
  let previousAverageAccuracy = null;
  if (!prev.length) {
    masteryScore = Math.round(L);
  } else {
    const sum = prev.reduce((s, r) => s + attemptAccuracyPct(r), 0);
    previousAverageAccuracy = Math.round((sum / prev.length) * 10) / 10;
    masteryScore = Math.round(0.5 * L + 0.5 * (sum / prev));
  }
  const latestAccuracy = Math.round(L * 10) / 10;
  let status;
  let nextAction;
  let reasonCode;
  if (masteryScore < 50) {
    status = 'Weak';
    nextAction = 'review';
    reasonCode = prev.length ? 'WEAK_WITH_HISTORY' : 'WEAK_SINGLE';
  } else if (masteryScore < 70) {
    status = 'Developing';
    nextAction = 'retake';
    reasonCode = prev.length ? 'DEVELOPING_WITH_HISTORY' : 'DEVELOPING_SINGLE';
  } else {
    status = 'Strong';
    nextAction = 'advance';
    reasonCode = prev.length ? 'STRONG_WITH_HISTORY' : 'STRONG_SINGLE';
  }
  return {
    masteryScore,
    status,
    nextAction,
    reasonCode,
    latestAccuracy,
    previousAverageAccuracy
  };
}

app.get('/api/mastery', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const chapters = db.prepare('SELECT id, title, slug, sort_order FROM chapters ORDER BY sort_order').all();
  const rows = db.prepare(`
    SELECT chapter_id, correct_count, total_questions, id
    FROM quiz_attempts
    WHERE user_id = ? AND chapter_id IS NOT NULL AND completed_at IS NOT NULL AND total_questions > 0
    ORDER BY chapter_id ASC, id DESC
  `).all(userId);
  const byChapter = {};
  rows.forEach((r) => {
    if (!byChapter[r.chapter_id]) byChapter[r.chapter_id] = [];
    byChapter[r.chapter_id].push(r);
  });
  const out = chapters.map((c) => {
    const attemptsForChapter = byChapter[c.id] || [];
    const m = masteryFromAttempts(attemptsForChapter);
    return {
      chapterId: c.id,
      title: c.title,
      slug: c.slug,
      sort_order: c.sort_order,
      masteryScore: m.masteryScore,
      status: m.status,
      nextAction: m.nextAction,
      reasonCode: m.reasonCode,
      latestAccuracy: m.latestAccuracy,
      previousAverageAccuracy: m.previousAverageAccuracy,
      attemptCount: attemptsForChapter.length
    };
  });
  res.json({ chapters: out });
});

// ----- Chat (LLM) — scoped tutor intents (reduces off-topic / quiz-spoil answers) -----
const TUTOR_INTENTS = {
  explain: 'The user wants a simpler explanation. Use short sentences and plain language. No code unless asked.',
  hint: 'Give a learning hint or direction only—do NOT reveal answers to quiz or homework questions. Nudge toward the concept.',
  navigate: 'Help them use this app: routes are /learn (chapters), /quiz, /profile (progress), /editor (Network Builder), /playground (classic 2D visualization). One or two sentences.',
  glossary: 'Define ML/DL terms clearly. If they ask for another language, give the English term and a short equivalent or transliteration when helpful.',
  general: 'Help with neural networks, deep learning, and this learning platform. Be brief and friendly.'
};

function chatFallbackReply(message, chapterLine) {
  const q = String(message || '').trim().slice(0, 400);
  const ctx = chapterLine ? '\n\n(Lesson context was included but AI is offline.)' : '';
  if (!MISTRAL_API_KEY) {
    return (
      'Demo mode: MISTRAL_API_KEY is not set on the server, so live AI replies are disabled.\n\n' +
      `You asked: "${q}"${ctx}\n\n` +
      'Add a Mistral API key to your .env file and restart the server to enable the tutor. ' +
      'Until then, use the lesson text, quizzes, and Network Builder to study.'
    );
  }
  return (
    'The AI service could not complete a reply right now. Please try again in a moment.\n\n' +
    `Your question: "${q}"${ctx}`
  );
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], intent, chapterSlug, chapterTitle } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.json({ reply: 'Send a question in the message box so the tutor can respond.' });
    }
    const trimmed = message.trim().slice(0, 2000);
    if (!trimmed) {
      return res.json({ reply: 'Please type a question first, then send.' });
    }
    const intentKey = typeof intent === 'string' && TUTOR_INTENTS[intent] ? intent : 'general';
    const intentLine = TUTOR_INTENTS[intentKey];
    let chapterLine = '';
    if (chapterSlug || chapterTitle) {
      const ch = chapterSlug
        ? db.prepare('SELECT title, content_text FROM chapters WHERE slug = ?').get(chapterSlug)
        : null;
      const title = (ch && ch.title) || (typeof chapterTitle === 'string' ? chapterTitle : '') || '';
      const snippet = ch && ch.content_text ? String(ch.content_text).slice(0, 2500) : '';
      chapterLine = title
        ? `\nThe learner selected this lesson: "${title}". Tailor explanations to this module.${snippet ? ' Relevant material (for grounding, do not quote verbatim):\n' + snippet : ''}`
        : '';
    }
    const historyMessages = (Array.isArray(history) ? history : []).slice(-10).map((m) => ({
      role: m && m.role === 'assistant' ? 'assistant' : 'user',
      content: typeof m?.content === 'string' ? m.content : String(m?.content ?? '')
    }));
    const messages = [
      { role: 'system', content: `You are a scoped tutor for the Neural Network Playground (browser-based NN learning). Stay on-topic: concepts, training intuition, builder/playground help, study tips. Do not fabricate features the app may not have. Current mode: ${intentKey}. ${intentLine}${chapterLine}\n\nFormatting: use **double asterisks** around important terms, numbers, and percentages (e.g. **50%**, **learning rate**) so they render bold in the UI. Use *single asterisks* only for light emphasis. Plain line breaks are fine for short lists.` },
      ...historyMessages,
      { role: 'user', content: trimmed }
    ];
    if (!MISTRAL_API_KEY) {
      return res.json({ reply: chatFallbackReply(trimmed, chapterLine) });
    }
    try {
      const reply = await mistralChat(messages, { max_tokens: 512 });
      return res.json({ reply: reply || 'I couldn\'t generate a response. Try rephrasing.' });
    } catch (e) {
      console.error('Chat error:', e.message);
      return res.json({ reply: chatFallbackReply(trimmed, chapterLine) });
    }
  } catch (e) {
    console.error('Chat route error:', e);
    const q = String(req.body?.message || '').trim().slice(0, 400);
    return res.json({ reply: chatFallbackReply(q, '') });
  }
});

// ----- Static (SPA: serve index.html for non-API routes that are not files) -----
app.use(express.static(DIST));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const p = path.join(DIST, req.path === '/' ? 'index.html' : req.path);
  if (fs.existsSync(p) && fs.statSync(p).isFile()) return res.sendFile(p);
  res.sendFile(path.join(DIST, 'index.html'));
});

function shutdownDb() {
  try {
    db.close();
  } catch (_) {}
}
process.once('SIGINT', () => {
  shutdownDb();
  process.exit(0);
});
process.once('SIGTERM', () => {
  shutdownDb();
  process.exit(0);
});

app.listen(PORT, () => {
  const url = 'http://localhost:' + PORT;
  console.log('Server listening on port', PORT, '(' + url + ' on local dev)');
  if (!MISTRAL_API_KEY) console.warn('MISTRAL_API_KEY not set — quiz generation will fall back to defaults');
});
