(function(){
  const appEl = document.getElementById('app');
  // Use relative URLs so it works on localhost AND Render
  const API_BASE = '';
  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  let quizzes = [];
  let currentQuizAnswers = {}; // stores user answers during quiz
  let currentQuestionIndex = 0; // tracks which question being displayed
  let currentQuiz = null; // stores current quiz being taken
  let currentParticipantId = ''; // stores participant ID
  
  async function loadQuizzes() {
    try {
      const r = await fetch(API_BASE + '/api/quizzes');
      if (r.ok) {
        quizzes = await r.json();
        init();
      } else {
        appEl.innerHTML = '<p>Erreur lors du chargement des quizzes.</p>';
      }
    } catch (err) {
      console.error('Error loading quizzes:', err);
      appEl.innerHTML = '<p>Impossible de charger les quizzes.</p>';
    }
  }
  
  loadQuizzes();

  function getQuizById(id){ return quizzes.find(q=>q.id===id); }

  async function renderList(){
    // reload quizzes from API to get latest list
    try {
      const r = await fetch(API_BASE + '/api/quizzes');
      if (r.ok) {
        quizzes = await r.json();
      }
    } catch (err) {
      console.error('Error reloading quizzes:', err);
    }
    
    appEl.innerHTML = '';
    const list = document.createElement('div'); list.className='list';
    quizzes.forEach(q=>{
      const card = document.createElement('div'); card.className='quiz-card';
      card.innerHTML = `<h2>${esc(q.title)}</h2><p>${esc(q.description||'')}</p><button data-id="${q.id}">Commencer</button>`;
      list.appendChild(card);
    });
    appEl.appendChild(list);
    list.addEventListener('click', e=>{
      const b = e.target.closest('button[data-id]'); if(b) startQuiz(b.dataset.id);
    });
  }

  function startQuiz(id){
    const quiz = getQuizById(id); if(!quiz){ appEl.innerHTML='<p>Quiz introuvable</p>'; return; }
    history.replaceState(null,'',`?quiz=${id}`);
    currentQuiz = quiz;
    currentQuestionIndex = 0;
    currentQuizAnswers = {};
    renderQuizStart(quiz);
  }

  function renderQuizStart(quiz){
    appEl.innerHTML = `<h2>${esc(quiz.title)}</h2><form id="startForm"><label>Numéro d'identification du participant : <input id="participantIdInput" name="participantId" required></label><div style="margin-top:12px"><button type="submit">Commencer le quiz</button></div></form>`;
    document.getElementById('startForm').addEventListener('submit', e=>{
      e.preventDefault();
      currentParticipantId = document.getElementById('participantIdInput').value.trim();
      if (!currentParticipantId) { alert('Entrez votre numéro'); return; }
      currentQuestionIndex = 0;
      renderQuestion();
    });
  }

  function renderQuestion(){
    if (!currentQuiz) return;
    const q = currentQuiz.questions[currentQuestionIndex];
    const totalQ = currentQuiz.questions.length;
    const answerableTotal = currentQuiz.questions.filter(x => x.type !== 'case').length;
    const isLast = currentQuestionIndex === totalQ - 1;
    const isCase = q.type === 'case';
    const answerableIndex = isCase ? null : currentQuiz.questions.slice(0, currentQuestionIndex + 1).filter(x => x.type !== 'case').length;

    let html = `<h2>${esc(currentQuiz.title)}</h2>`;
    if (isCase) {
      html += `<p style="color:#666;font-size:0.9rem">Etude de cas</p>`;
    } else {
      html += `<p style="color:#666;font-size:0.9rem">Question ${answerableIndex} / ${answerableTotal}</p>`;
    }

    // Show nearest previous case as context for sub-questions
    const caseIndex = currentQuiz.questions.slice(0, currentQuestionIndex + 1).map((x, i) => ({x, i})).filter(obj => obj.x.type === 'case').pop();
    if (!isCase && caseIndex) {
      html += `<div style="background:#f7f7f7;border-left:4px solid #888;padding:10px;margin:10px 0;border-radius:6px"><strong>Etude de cas</strong><div style="margin-top:6px">${esc(caseIndex.x.text)}</div></div>`;
    }

    html += `<div class="question"><p class="qtext">${esc(q.text)}</p>`;
    if(q.type==='mcq'){
      q.options.forEach((opt,ii)=> {
        const checked = currentQuizAnswers[currentQuestionIndex] === ii ? 'checked' : '';
        html += `<label><input type="radio" name="answer" value="${ii}" ${checked}> ${esc(opt)}</label>`;
      });
    } else if (q.type === 'text') {
      const txtVal = currentQuizAnswers[currentQuestionIndex] || '';
      html += `<input type="text" id="answerText" value="${esc(txtVal)}" placeholder="Votre réponse">`;
    } else {
      html += `<div style="color:#666">Lisez attentivement puis cliquez sur Suivant.</div>`;
    }
    html += `</div><div class="actions">`;
    if (currentQuestionIndex > 0) html += `<button type="button" id="prevBtn">← Précédent</button>`;
    if (isLast) {
      html += isCase ? `<button type="button" id="finishBtn">Terminer</button>` : `<button type="button" id="submitBtn">Soumettre</button>`;
    } else {
      html += `<button type="button" id="nextBtn">Suivant →</button>`;
    }
    html += `</div>`;
    appEl.innerHTML = html;

    // Save answer before navigating
    function saveCurrentAnswer(){
      if (q.type === 'mcq') {
        const v = document.querySelector('input[name="answer"]:checked')?.value;
        if (v !== undefined) currentQuizAnswers[currentQuestionIndex] = Number(v);
      } else if (q.type === 'text') {
        const v = document.getElementById('answerText').value.trim();
        if (v) currentQuizAnswers[currentQuestionIndex] = v;
      }
    }

    document.getElementById('prevBtn')?.addEventListener('click', ()=>{ saveCurrentAnswer(); currentQuestionIndex--; renderQuestion(); });
    document.getElementById('nextBtn')?.addEventListener('click', ()=>{ saveCurrentAnswer(); currentQuestionIndex++; renderQuestion(); });
    document.getElementById('finishBtn')?.addEventListener('click', ()=>{ history.replaceState(null,'','/'); renderList(); });
    document.getElementById('submitBtn')?.addEventListener('click', ()=>{
      saveCurrentAnswer();
      calculateAndSubmitResult();
    });
  }

  function calculateAndSubmitResult(){
    let earnedPoints = 0;
    let totalPoints = 0;
    const detailedResults = [];
    currentQuiz.questions.forEach((q,i)=>{
      if (q.type === 'case') return;
      const pts = q.points || 1;
      totalPoints += pts;
      let isCorrect = false;
      if(q.type==='mcq'){
        const v = currentQuizAnswers[i]; isCorrect = (v !== undefined && Number(v) === q.answer);
      } else {
        const v = (currentQuizAnswers[i]||'').trim().toLowerCase(); isCorrect = (v && q.answer.trim().toLowerCase() === v);
      }
      if(isCorrect) earnedPoints += pts;
      detailedResults.push({index: i, correct: isCorrect});
    });
    const correctCount = detailedResults.filter(r => r.correct).length;
    const answerableTotal = currentQuiz.questions.filter(q => q.type !== 'case').length;
    appEl.innerHTML = `<h2>Resultat</h2><p>Vous avez obtenu <strong>${earnedPoints} / ${totalPoints}</strong> points</p><p class="small">(${correctCount} / ${answerableTotal} questions correctes)</p><button id="again">Retour aux quizz</button>`;
    // send result to server
    try{
      const payload = { participantId: currentParticipantId, quizId: currentQuiz.id, score: earnedPoints, correct: correctCount, total: answerableTotal };
      fetch(API_BASE + '/api/submit', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    }catch(err){ console.warn('Could not send result', err); }
    document.getElementById('again').addEventListener('click', ()=>{ history.replaceState(null,'','/'); renderList(); });
  }

  function init(){
    const params = new URLSearchParams(location.search);
    const q = params.get('quiz');
    if(q && getQuizById(q)) startQuiz(q); else renderList();
  }
})();
