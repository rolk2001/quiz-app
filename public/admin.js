async function $(sel){ return document.querySelector(sel); }
// Use relative URLs so it works on localhost AND Render
const API_BASE = '';

// Question builder state
let questions = [];
let editingIndex = -1;
let editorOptions = []; // temporary options list in modal
let editingQuizId = null; // null if creating new, or quiz ID if editing existing

// Modal visibility helpers
function showQuestionModal(title, index=-1) {
  editingIndex = index;
  editorOptions = [];
  document.getElementById('editorTitle').textContent = title;
  if (index >= 0) {
    const q = questions[index];
    document.getElementById('eqText').value = q.text;
    document.getElementById('eqType').value = q.type;
    document.getElementById('eqPoints').value = q.points || 1;
    if (q.type === 'mcq') {
      editorOptions = [...q.options];
      document.getElementById('eqAnswerIdx').value = q.answer;
    } else {
      document.getElementById('eqTextAns').value = q.answer;
    }
  } else {
    document.getElementById('eqText').value = '';
    document.getElementById('eqType').value = 'mcq';
    document.getElementById('eqNewOption').value = '';
    document.getElementById('eqAnswerIdx').value = '0';
    document.getElementById('eqTextAns').value = '';
    document.getElementById('eqPoints').value = '1';
  }
  updateModalDisplay();
  renderEditorOptions();
  document.getElementById('questionEditorModal').style.display = 'flex';
}

function hideQuestionModal() {
  document.getElementById('questionEditorModal').style.display = 'none';
  editingIndex = -1;
}

function updateModalDisplay() {
  const type = document.getElementById('eqType').value;
  document.getElementById('eMcqArea').style.display = type === 'mcq' ? 'block' : 'none';
  document.getElementById('eTextArea').style.display = type === 'text' ? 'block' : 'none';
}

function renderEditorOptions() {
  const el = document.getElementById('eOptionsList');
  if (editorOptions.length === 0) { el.innerHTML = '<em style="color:#999">Aucune option</em>'; return; }
  el.innerHTML = editorOptions.map((opt, idx) => {
    return `<div style="background:#f0f0f0;padding:8px;margin:4px 0;border-radius:4px;display:flex;justify-content:space-between">
      <span>${idx}. ${escapeHtml(opt)}</span>
      <button type="button" onclick="deleteEditorOption(${idx})" style="background:#d32f2f;color:white;border:none;padding:2px 6px;border-radius:3px;cursor:pointer">✕</button>
    </div>`;
  }).join('');
}

function deleteEditorOption(idx) {
  editorOptions.splice(idx, 1);
  renderEditorOptions();
  // Adjust answer index if needed
  const ansIdx = parseInt(document.getElementById('eqAnswerIdx').value);
  if (ansIdx >= editorOptions.length && editorOptions.length > 0) {
    document.getElementById('eqAnswerIdx').value = editorOptions.length - 1;
  }
}

document.getElementById('addOptionBtn').addEventListener('click', ()=> {
  const txt = document.getElementById('eqNewOption').value.trim();
  if (!txt) { alert('Entrez le texte de l\'option'); return; }
  if (editorOptions.includes(txt)) { alert('Cette option existe déjà'); return; }
  editorOptions.push(txt);
  document.getElementById('eqNewOption').value = '';
  renderEditorOptions();
});

document.getElementById('eqType').addEventListener('change', ()=> {
  updateModalDisplay();
  if (document.getElementById('eqType').value === 'mcq') {
    editorOptions = [];
    renderEditorOptions();
    document.getElementById('eqNewOption').value = '';
  }
});

document.getElementById('addNewQuestionBtn').addEventListener('click', ()=> showQuestionModal('Ajouter une question'));

document.getElementById('saveQuestionBtn').addEventListener('click', ()=> {
  const text = document.getElementById('eqText').value.trim();
  const type = document.getElementById('eqType').value;
  const pts = document.getElementById('eqPoints').value;
  const points = Number.isFinite(Number(pts)) ? Number(pts) : 1;
  if (!text) { alert('Entrez le texte de la question'); return; }
  if (points < 1) { alert('Les points doivent être ≥1'); return; }
  
  if (type === 'mcq') {
    if (editorOptions.length < 2) { alert('≥2 options requises'); return; }
    const ai = document.getElementById('eqAnswerIdx').value;
    const ansIdx = Number.isFinite(Number(ai)) ? Number(ai) : 0;
    if (ansIdx < 0 || ansIdx >= editorOptions.length) { alert('Index invalide'); return; }
    const q = { type: 'mcq', text, options: editorOptions, answer: ansIdx, points };
    if (editingIndex >= 0) questions[editingIndex] = q; else questions.push(q);
  } else {
    const ans = document.getElementById('eqTextAns').value.trim();
    if (!ans) { alert('Entrez la réponse'); return; }
    const q = { type: 'text', text, answer: ans, points };
    if (editingIndex >= 0) questions[editingIndex] = q; else questions.push(q);
  }
  hideQuestionModal();
  renderQuestionsList();
});

document.getElementById('cancelQuestionBtn').addEventListener('click', hideQuestionModal);

function renderQuestionsList() {
  const el = document.getElementById('questionsList');
  if (questions.length === 0) { el.innerHTML = '<em style="color:#999">Aucune question</em>'; return; }
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
  el.innerHTML = `<div style="color:#666;margin-bottom:8px;font-size:0.9rem"><strong>Points totaux: ${totalPoints}</strong> (seront normalisés sur 20)</div>` + questions.map((q, idx) => {
    const type = q.type === 'mcq' ? 'QCM' : 'Texte';
    const preview = q.type === 'mcq' ? `${q.options.length} options` : `Rép: ${escapeHtml(q.answer)}`;
    const pts = q.points || 1;
    return `<div style="background:#f5f5f5;padding:10px;margin:8px 0;border-radius:6px;border-left:4px solid var(--accent)">
      <div><strong>#${idx+1}</strong> (${type}, <em>${pts} pt${pts>1?'s':''}</em>) ${escapeHtml(q.text)}</div>
      <div class="small" style="color:#666;margin:6px 0">${preview}</div>
      <div style="margin-top:6px">
        <button onclick="editQuestion(${idx})" style="background:var(--accent);color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;margin-right:4px">Éditer</button>
        <button onclick="deleteQuestion(${idx})" style="background:#d32f2f;color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer">Supprimer</button>
      </div>
    </div>`;
  }).join('');
}

function editQuestion(idx) { showQuestionModal('Éditer la question', idx); }
function deleteQuestion(idx) { if (confirm('Confirmer la suppression?')) { questions.splice(idx, 1); renderQuestionsList(); } }

function escapeHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

document.getElementById('publishQuizBtn').addEventListener('click', async ()=>{
  const id = document.getElementById('quizId').value.trim();
  const title = document.getElementById('quizTitle').value.trim();
  const desc = document.getElementById('quizDesc').value.trim();
  if (!id || !title) { alert('Remplissez ID et titre'); return; }
  if (questions.length === 0) { alert('Ajoutez ≥1 question'); return; }
  const payload = { id, title, description: desc, questions };
  const token = localStorage.getItem('adminToken');
  const headers = Object.assign({'Content-Type':'application/json'}, token ? {'X-Admin-Token': token} : {});
  
  // If editing existing quiz, use PUT. If new quiz, use POST.
  let r;
  if (editingQuizId) {
    r = await fetch(API_BASE + `/api/admin/quizzes/${editingQuizId}`, { method:'PUT', headers, body: JSON.stringify(payload) });
  } else {
    r = await fetch(API_BASE + '/api/admin/quizzes', { method:'POST', headers, body: JSON.stringify(payload) });
  }
  
  if (r.ok) { 
    alert('Quiz enregistré'); 
    editingQuizId = null;
    questions = []; renderQuestionsList(); 
    document.getElementById('quizId').value = ''; 
    document.getElementById('quizTitle').value = ''; 
    document.getElementById('quizDesc').value = ''; 
    loadAdminData(); 
  } else {
    const err = await r.json().catch(()=>({error:'unknown'})); alert('Erreur: '+(err.error||'Erreur serveur'));
  }
});

async function loadAdminData(){
  const token = localStorage.getItem('adminToken');
  const headers = token ? {'X-Admin-Token': token} : {};
  const qres = await fetch(API_BASE + '/api/admin/quizzes', {headers});
  if(qres.ok){
    const quizzes = await qres.json();
    document.getElementById('quizzesList').innerHTML = quizzes.map(q=>{
      return `<div style="background:#f9f9f9;padding:8px;margin:4px 0;border-radius:4px">
        <strong>${escapeHtml(q.id)}</strong> — ${escapeHtml(q.title)} (${q.questions.length} questions)
        <button onclick="loadQuizToEdit('${q.id}')" style="float:right;background:var(--accent);color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;margin-left:4px">Éditer</button>
        <button onclick="deleteQuiz('${q.id}')" style="float:right;background:#d32f2f;color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer">Supprimer</button>
      </div>`;
    }).join('');
  }
  const rres = await fetch(API_BASE + '/api/admin/results', {headers});
  if(rres.ok){
    const results = await rres.json();
    const tbody = document.querySelector('#resultsTable tbody');
    tbody.innerHTML = results.map(r=>`<tr><td>${escapeHtml(r.participantId)}</td><td>${escapeHtml(r.quizId)}</td><td>${r.score}</td><td>${r.correct}/${r.total}</td><td class="small">${r.ts}</td></tr>`).join('');
  }
}

function loadQuizToEdit(quizId) {
  const token = localStorage.getItem('adminToken');
  const headers = token ? {'X-Admin-Token': token} : {};
  fetch(API_BASE + '/api/admin/quizzes', {headers}).then(r => r.json()).then(quizzes => {
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) { alert('Quiz non trouvé'); return; }
    editingQuizId = quizId;
    document.getElementById('quizId').value = quiz.id;
    document.getElementById('quizTitle').value = quiz.title;
    document.getElementById('quizDesc').value = quiz.description || '';
    questions = JSON.parse(JSON.stringify(quiz.questions));
    renderQuestionsList();
    alert('Quiz chargé pour édition. Modifiez les questions et cliquez "Publier le quiz" pour enregistrer.');
  });
}

async function deleteQuiz(quizId) {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer le quiz "${quizId}"?`)) return;
  const token = localStorage.getItem('adminToken');
  const headers = Object.assign({'Content-Type':'application/json'}, token ? {'X-Admin-Token': token} : {});
  try {
    const r = await fetch(API_BASE + `/api/admin/quizzes/${quizId}`, { method: 'DELETE', headers });
    if (r.ok) {
      alert('Quiz supprimé');
      loadAdminData();
    } else {
      const err = await r.json().catch(()=>({error:'Erreur serveur'}));
      alert('Erreur: '+(err.error||'Impossible supprimer le quiz'));
    }
  } catch (err) {
    alert('Erreur: ' + err.message);
  }
}

// If token already present try to show admin area
async function checkAndLoadAdmin(){
  const token = localStorage.getItem('adminToken');
  if (!token) return; // no token, stay on login form
  
  // Test if token is valid by trying to fetch quizzes
  try {
    const headers = token ? {'X-Admin-Token': token} : {};
    const r = await fetch(API_BASE + '/api/admin/quizzes', {headers});
    if (r.ok) {
      // Token is valid, show admin area
      document.getElementById('loginPanel').style.display = 'none';
      document.getElementById('adminArea').style.display = 'block';
      loadAdminData();
    } else {
      // Token is invalid, clear it and show login form
      localStorage.removeItem('adminToken');
    }
  } catch (err) {
    // Network error, clear token and show login form
    localStorage.removeItem('adminToken');
  }
}

window.addEventListener('load', checkAndLoadAdmin);

// Login form handler - wrap in DOMContentLoaded to ensure DOM is ready
document.addEventListener('DOMContentLoaded', ()=>{
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const email = document.querySelector('#loginForm input[name="email"]').value.trim();
      const password = document.querySelector('#loginForm input[name="password"]').value.trim();
      if (!email || !password) { alert('Remplissez les champs'); return; }
      
      try {
        const r = await fetch(API_BASE + '/api/login', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ email, password })
        });
        if (r.ok) {
          const data = await r.json();
          if (data.ok && data.token) {
            localStorage.setItem('adminToken', data.token);
            document.getElementById('loginPanel').style.display = 'none';
            document.getElementById('adminArea').style.display = 'block';
            loadAdminData();
          } else {
            alert('Erreur: ' + (data.error || 'Connexion échouée'));
          }
        } else {
          alert('Erreur: Identifiants incorrects');
        }
      } catch (err) {
        alert('Erreur réseau: ' + err.message);
      }
    });
  }

  // Logout
  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async ()=>{
      const token = localStorage.getItem('adminToken');
      if (token) {
        try {
          const headers = {'X-Admin-Token': token};
          await fetch(API_BASE + '/api/logout', { method: 'POST', headers });
        } catch (err) { console.warn('logout error', err); }
      }
      localStorage.removeItem('adminToken');
      document.getElementById('loginPanel').style.display = 'block';
      document.getElementById('adminArea').style.display = 'none';
      document.querySelector('#loginForm input[name="email"]').value = '';
      document.querySelector('#loginForm input[name="password"]').value = '';
    });
  }
});
