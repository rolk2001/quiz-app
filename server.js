require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// IMPORTANT: These MUST be set via environment variables for security
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASS = process.env.ADMIN_PASS;
const MONGODB_URI = process.env.MONGODB_URI;

if (!ADMIN_EMAIL || !ADMIN_PASS) {
  console.error('ERROR: ADMIN_EMAIL and ADMIN_PASS environment variables are required!');
  process.exit(1);
}

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI environment variable is required!');
  process.exit(1);
}

app.use(express.json());
app.use(cookieParser());

// Simple CORS so admin page served from any local port can call API
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Admin-Token');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// serve static site
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
// Newer MongoDB drivers no longer accept `useNewUrlParser`/`useUnifiedTopology` options;
// pass the URI directly and let mongoose manage defaults.
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define schemas
const quizSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: String,
  questions: [
    {
      type: { type: String, enum: ['mcq', 'text'], required: true },
      text: { type: String, required: true },
      options: [String], // for MCQ
      answer: mongoose.Schema.Types.Mixed, // index for MCQ or string for text
      points: { type: Number, default: 1 }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const resultSchema = new mongoose.Schema({
  participantId: { type: String, required: true },
  quizId: { type: String, required: true },
  score: { type: Number, required: true },
  correct: { type: Number, required: true },
  total: { type: Number, required: true },
  ts: { type: Date, default: Date.now }
});

const Quiz = mongoose.model('Quiz', quizSchema);
const Result = mongoose.model('Result', resultSchema);

// simple token-based auth for admin APIs
const adminTokens = new Set();
app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  console.log('Login attempt:', email);
  if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
    const token = Math.random().toString(36).slice(2);
    adminTokens.add(token);
    console.log('Login successful, token:', token);
    return res.json({ ok: true, token });
  }
  console.log('Login failed: invalid credentials');
  return res.status(401).json({ ok: false, error: 'Invalid credentials' });
});

app.post('/api/logout', (req, res) => {
  const token = req.headers['x-admin-token'];
  if (token && adminTokens.has(token)) adminTokens.delete(token);
  res.json({ ok: true });
});

function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  console.log('Checking admin token:', token ? 'present' : 'missing', 'Valid tokens:', adminTokens.size);
  if (token && adminTokens.has(token)) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

// Public: list quizzes (for participants)
app.get('/api/quizzes', async (req,res)=>{
  try {
    const quizzes = await Quiz.find();
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: list quizzes
app.get('/api/admin/quizzes', requireAdmin, async (req,res)=>{
  try {
    const quizzes = await Quiz.find();
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: add quiz
app.post('/api/admin/quizzes', requireAdmin, async (req,res)=>{
  try {
    const newQuiz = req.body;
    console.log('POST /api/admin/quizzes body:', JSON.stringify(newQuiz, null, 2));
    if(!newQuiz || !newQuiz.id) return res.status(400).json({error:'Invalid quiz: missing id'});
    if(!newQuiz.title) return res.status(400).json({error:'Invalid quiz: missing title'});
    if(!Array.isArray(newQuiz.questions) || newQuiz.questions.length === 0) return res.status(400).json({error:'Quiz must include at least one question'});
    
    // Validate each question
    for (let i = 0; i < newQuiz.questions.length; i++) {
      const q = newQuiz.questions[i];
      if (!q.text) return res.status(400).json({error:`Question ${i+1}: text is required`});
      if (!q.type) return res.status(400).json({error:`Question ${i+1}: type is required (mcq or text)`});
      if (q.type === 'mcq') {
        if (!Array.isArray(q.options) || q.options.length === 0) return res.status(400).json({error:`Question ${i+1}: must have at least 1 option`});
        if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= q.options.length) return res.status(400).json({error:`Question ${i+1}: answer index out of range (${q.answer} not valid for ${q.options.length} options)`});
      } else if (q.type === 'text') {
        if (!q.answer) return res.status(400).json({error:`Question ${i+1}: answer text is required`});
      }
    }
    
    // Ensure all questions have points
    newQuiz.questions = newQuiz.questions.map(qst => ({ ...qst, points: qst.points || 1 }));
    const quiz = new Quiz(newQuiz);
    console.log('Saving quiz:', quiz);
    await quiz.save();
    console.log('Quiz saved successfully');
    res.json({ok:true});
  } catch (err) {
    console.error('Error saving quiz:', err);
    res.status(400).json({ error: err.message });
  }
});

// Admin: update quiz by ID
app.put('/api/admin/quizzes/:id', requireAdmin, async (req,res)=>{
  try {
    const upd = req.body;
    if(!Array.isArray(upd.questions) || upd.questions.length === 0) return res.status(400).json({error:'Quiz must include at least one question'});
    
    // Validate each question
    for (let i = 0; i < upd.questions.length; i++) {
      const q = upd.questions[i];
      if (!q.text) return res.status(400).json({error:`Question ${i+1}: text is required`});
      if (!q.type) return res.status(400).json({error:`Question ${i+1}: type is required (mcq or text)`});
      if (q.type === 'mcq') {
        if (!Array.isArray(q.options) || q.options.length === 0) return res.status(400).json({error:`Question ${i+1}: must have at least 1 option`});
        if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= q.options.length) return res.status(400).json({error:`Question ${i+1}: answer index out of range`});
      } else if (q.type === 'text') {
        if (!q.answer) return res.status(400).json({error:`Question ${i+1}: answer text is required`});
      }
    }
    
    // Ensure all questions have points
    upd.questions = upd.questions.map(qst => ({ ...qst, points: qst.points || 1 }));
    const quiz = await Quiz.findOneAndUpdate({ id: req.params.id }, upd, { new: true });
    if (!quiz) return res.status(404).json({error:'Quiz not found'});
    res.json({ok:true});
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: delete quiz by ID
app.delete('/api/admin/quizzes/:id', requireAdmin, async (req,res)=>{
  try {
    const result = await Quiz.deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) return res.status(404).json({error:'Quiz not found'});
    res.json({ok:true});
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Submit result (anyone)
app.post('/api/submit', async (req,res)=>{
  try {
    const {participantId, quizId, score, correct, total} = req.body || {};
    if(!participantId || !quizId) return res.status(400).json({error:'Missing participantId or quizId'});
    const result = new Result({participantId, quizId, score, correct, total});
    await result.save();
    res.json({ok:true});
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: get results
app.get('/api/admin/results', requireAdmin, async (req,res)=>{
  try {
    const results = await Result.find().sort({ ts: -1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: delete result
app.delete('/api/admin/results/:id', requireAdmin, async (req,res)=>{
  try {
    const { id } = req.params;
    const result = await Result.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ error: 'Result not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, ()=>{
  console.log('Server listening on port', PORT);
});
