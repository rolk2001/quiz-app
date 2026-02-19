require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// IMPORTANT: These MUST be set via environment variables for security
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASS = process.env.ADMIN_PASS;

if (!ADMIN_EMAIL || !ADMIN_PASS) {
  console.error('ERROR: ADMIN_EMAIL and ADMIN_PASS environment variables are required!');
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

function readJSON(p){
  try{ return JSON.parse(fs.readFileSync(p,'utf8')); }catch(e){ return null; }
}
function writeJSON(p,obj){ fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8'); }

const QUIZ_PATH = path.join(__dirname, 'public', 'quizzes.json');
const RESULTS_PATH = path.join(__dirname, 'data', 'results.json');

// ensure data dir
if(!fs.existsSync(path.join(__dirname,'data'))){ fs.mkdirSync(path.join(__dirname,'data')); }
if(!fs.existsSync(RESULTS_PATH)){ writeJSON(RESULTS_PATH, []); }

// simple token-based auth for admin APIs
const adminTokens = new Set();
app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
    const token = Math.random().toString(36).slice(2);
    adminTokens.add(token);
    return res.json({ ok: true, token });
  }
  return res.status(401).json({ ok: false, error: 'Invalid credentials' });
});

app.post('/api/logout', (req, res) => {
  const token = req.headers['x-admin-token'];
  if (token && adminTokens.has(token)) adminTokens.delete(token);
  res.json({ ok: true });
});

function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (token && adminTokens.has(token)) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

// Admin: list quizzes
app.get('/api/admin/quizzes', requireAdmin, (req,res)=>{
  const q = readJSON(QUIZ_PATH) || [];
  res.json(q);
});

// Admin: add quiz (append). Body: full quiz object
app.post('/api/admin/quizzes', requireAdmin, (req,res)=>{
  const q = readJSON(QUIZ_PATH) || [];
  const newQuiz = req.body;
  if(!newQuiz || !newQuiz.id) return res.status(400).json({error:'Invalid quiz'});
  if(!Array.isArray(newQuiz.questions) || newQuiz.questions.length === 0) return res.status(400).json({error:'Quiz must include at least one question'});
  // Ensure all questions have points
  newQuiz.questions = newQuiz.questions.map(qst => ({ ...qst, points: qst.points || 1 }));
  q.push(newQuiz);
  writeJSON(QUIZ_PATH, q);
  res.json({ok:true});
});

// Admin: update quiz by ID
app.put('/api/admin/quizzes/:id', requireAdmin, (req,res)=>{
  const q = readJSON(QUIZ_PATH) || [];
  const idx = q.findIndex(x => x.id === req.params.id);
  if(idx < 0) return res.status(404).json({error:'Quiz not found'});
  const upd = req.body;
  if(!Array.isArray(upd.questions) || upd.questions.length === 0) return res.status(400).json({error:'Quiz must include at least one question'});
  // Ensure all questions have points
  upd.questions = upd.questions.map(qst => ({ ...qst, points: qst.points || 1 }));
  q[idx] = Object.assign(q[idx], upd);
  writeJSON(QUIZ_PATH, q);
  res.json({ok:true});
});

// Admin: delete quiz by ID
app.delete('/api/admin/quizzes/:id', requireAdmin, (req,res)=>{
  let q = readJSON(QUIZ_PATH) || [];
  q = q.filter(x => x.id !== req.params.id);
  writeJSON(QUIZ_PATH, q);
  res.json({ok:true});
});

// Submit result (anyone)
app.post('/api/submit', (req,res)=>{
  const {participantId, quizId, score, correct, total} = req.body || {};
  if(!participantId || !quizId) return res.status(400).json({error:'Missing participantId or quizId'});
  const results = readJSON(RESULTS_PATH) || [];
  const entry = {participantId, quizId, score, correct, total, ts: new Date().toISOString()};
  results.push(entry);
  writeJSON(RESULTS_PATH, results);
  res.json({ok:true});
});

// Admin: get results
app.get('/api/admin/results', requireAdmin, (req,res)=>{
  const results = readJSON(RESULTS_PATH) || [];
  res.json(results);
});

app.listen(PORT, ()=>{
  console.log('Server listening on port', PORT);
});
