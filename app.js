/* ==========================================================
   CyberGuardian 2026 — Hackathon Edition (single-file logic)
   - English only
   - Quiz + visual + story + spot + password forge
   - Poster generator (canvas)
   - Leaderboard: Firebase optional / localStorage fallback
   - Generative background (canvas)
========================================================== */

(() => {
  /* -------------------- CONFIG -------------------- */
  // If you want online leaderboard, paste your Firebase config here.
  // Otherwise leave placeholder: the script will use localStorage fallback.
  const FIREBASE_CONFIG = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_BUCKET",
    messagingSenderId: "YOUR_MSG_ID",
    appId: "YOUR_APP_ID",
    databaseURL: "YOUR_DATABASE_URL" // optional
  };

  const USE_FIREBASE = FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY";

  /* -------------------- DOM -------------------- */
  const $ = (s) => document.querySelector(s);
  // Screens
  const menu = $('#menu');
  const screenGame = $('#screen-game');
  const screenSpot = $('#screen-spot');
  const screenForge = $('#screen-forge');
  const screenStory = $('#screen-story');
  const screenResult = $('#screen-result');
  const screenLeaderboard = $('#screen-leaderboard');

  // Shared UI
  const gameModeLabel = $('#gameModeLabel');
  const questionText = $('#questionText');
  const answersEl = $('#answers');
  const questionCounter = $('#questionCounter');
  const scoreDisplay = $('#scoreDisplay');
  const progressBar = $('#progress-bar');
  const topDisplay = $('#topDisplay');

  // Poster + leaderboard canvas
  const posterCanvas = $('#posterCanvas');

  // Buttons
  const modeButtons = [...document.querySelectorAll('.mode-btn')];
  const btnLeaderboard = $('#btn-leaderboard');
  const btnPoster = $('#btn-poster');

  /* -------------------- State -------------------- */
  const TOTAL_QUESTIONS = 8;
  const SCORE_CORRECT = 120;

  let state = {
    topScore: loadTopScore(),
    currentScore: 0,
    mode: null,
    questions: [],
    qIndex: 0,
    playerName: null,
  };

  // storage key for local fallback leaderboard
  const LB_KEY = 'cg_leaderboard_v1';

  /* -------------------- Question Bank (mix) -------------------- */
  // Visual choices use 'img' property; others use 't' text.
  // Story nodes for story mode: {id,text,choices:[{text,nextId,scoreDelta}]}
  const BANK = [
    { type:'quiz', q:'You receive an email: "Your bank account locked — click link". What do you do?', choices:[
      {t:'Click link and enter details', c:false, explain:'Likely phishing. Do not enter credentials.'},
      {t:'Open bank site directly and log in', c:true, explain:'Correct — verify by going to official site.'},
      {t:'Forward to colleagues to warn them', c:false, explain:'This may spread the phishing; verify first.'}
    ]},
    { type:'quiz', q:'Which password is strongest?', choices:[
      {t:'password123', c:false, explain:'Very weak.'},
      {t:'Summer2021!', c:false, explain:'Better but predictable.'},
      {t:'Xr9!A2#pQ7jS', c:true, explain:'Strong — random chars.'}
    ]},
    { type:'visual', q:'Which login page is fake?', choices:[
      {img:generateFakeImg('LEGIT','#0b6bff'), c:false},
      {img:generateFakeImg('LOGIN-VERIFY','crimson'), c:true}
    ]},
    { type:'story', q:'You find a USB stick in the parking lot.', choices:[
      {t:'Plug it into work laptop', c:false, explain:'May contain malware.'},
      {t:'Hand to IT', c:true, explain:'Correct — let specialists handle.'},
      {t:'Plug into personal laptop', c:false, explain:'Risky.'}
    ]},
    { type:'quiz', q:'Best practice for public Wi-Fi?', choices:[
      {t:'Use VPN', c:true, explain:'VPN encrypts traffic.'},
      {t:'Transfer sensitive data — Wi-Fi is fine', c:false, explain:'Public Wi-Fi is risky.'}
    ]},
  ];

  // Story nodes for Cyber Heist mode
  const STORY = {
    start: { id:'start', text:'You are a security analyst. A suspicious process is using CPU. What do you do?', choices:[
      {text:'Kill the process immediately', next:'scan', score:20},
      {text:'Isolate machine and notify IT', next:'isolate', score:50},
      {text:'Ignore — likely benign', next:'ignore', score:-20}
    ]},
    scan: { id:'scan', text:'You killed the process. Your tools show outgoing connections to unknown IPs. Next?', choices:[
      {text:'Perform forensic capture and report', next:'forensic', score:40},
      {text:'Restart machine and hope for the best', next:'restart', score:-20}
    ]},
    isolate: { id:'isolate', text:'IT thanks you and finds exfiltration attempts. You?', choices:[
      {text:'Coordinate containment, notify stakeholders', next:'forensic', score:60},
      {text:'Shut down entire network', next:'shutdown', score:-10}
    ]},
    ignore: { id:'ignore', text:'Attack escalates. Data leak occurs.', choices:[
      {text:'Admit and help with response', next:'forensic', score:0},
      {text:'Quit', next:'end_bad', score:-100}
    ]},
    forensic: { id:'forensic', text:'Forensic shows malware family and IOC. Good job.', choices:[
      {text:'Share IOC and patch', next:'end_good', score:60}
    ]},
    restart: { id:'restart', text:'Restart made malware persistent. Incident worsens.', choices:[
      {text:'Escalate to senior response', next:'forensic', score:-10}
    ]},
    shutdown: { id:'shutdown', text:'Massive shutdown causes business loss, but halts exfiltration.', choices:[
      {text:'Post-incident review', next:'end_mixed', score:10}
    ]},
    end_good: { id:'end_good', text:'You mitigated the attack. Reputation improves.', choices:[] },
    end_mixed: { id:'end_mixed', text:'Mixed outcome: data safe but business impact occurred.', choices:[] },
    end_bad: { id:'end_bad', text:'Severe breach; major impact.', choices:[] }
  };

  /* -------------------- Utility & UI helpers -------------------- */
  function $(s) { return document.querySelector(s); }
  function showScreen(el) {
    // hide all screens
    [menu, screenGame, screenSpot, screenForge, screenStory, screenResult, screenLeaderboard].forEach(x => x && (x.hidden = true));
    el.hidden = false;
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function pickQuestions(n) {
    const pool = [];
    const bank = BANK.slice();
    while(pool.length < n && bank.length) {
      const idx = Math.floor(Math.random() * bank.length);
      pool.push(bank.splice(idx,1)[0]);
    }
    return pool;
  }

  function setTopDisplay() { $('#topDisplay').textContent = state.topScore || 0; }

  function resetGame() {
    state.currentScore = 0;
    state.qIndex = 0;
    state.questions = [];
    scoreDisplay.textContent = state.currentScore;
    progressBar.style.width = '0%';
  }

  /* -------------------- MENU actions -------------------- */
  modeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mode = btn.dataset.mode;
      startMode(mode);
    });
  });
  $('#btn-leaderboard').addEventListener('click', () => showLeaderboard());
  $('#btn-poster').addEventListener('click', () => generatePosterPrompt());

  $('#btn-leaderboard').addEventListener('keydown', (e)=>{ if(e.key==='Enter') showLeaderboard(); });

  /* -------------------- MODE LAUNCHERS -------------------- */
  function startMode(mode) {
    resetGame();
    state.mode = mode;
    gameModeLabel.textContent = mode.toUpperCase();
    setTopDisplay();

    if (mode === 'quiz' || mode === 'practice') {
      state.questions = pickQuestions(TOTAL_QUESTIONS);
      if (mode === 'practice') state.questions = pickQuestions(8); // marathon
      showScreen(screenGame);
      renderQuestion();
    } else if (mode === 'spot') {
      showScreen(screenSpot);
      initSpotGame();
    } else if (mode === 'forge') {
      showScreen(screenForge);
      initForge();
    } else if (mode === 'story') {
      showScreen(screenStory);
      startStory();
    }
  }

  /* -------------------- QUIZ / GAME FLOW -------------------- */
  function renderQuestion() {
    const q = state.questions[state.qIndex];
    if (!q) return endGame();
    // UI
    questionText.textContent = q.q;
    answersEl.innerHTML = '';

    if (q.type === 'visual') {
      // show images side-by-side; choices contain 'img'
      q.choices.forEach((c, i) => {
        const btn = document.createElement('button');
        btn.className = 'btn';
        const img = document.createElement('img');
        img.src = c.img;
        img.style.width = '100%';
        img.style.height = 'auto';
        btn.appendChild(img);
        btn.addEventListener('click', ()=>handleAnswer(c.c, c));
        answersEl.appendChild(btn);
      });
    } else {
      q.choices.forEach((c, i) => {
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.textContent = c.t;
        btn.addEventListener('click', ()=>handleAnswer(c.c, c));
        answersEl.appendChild(btn);
      });
    }

    questionCounter.textContent = `${state.qIndex + 1}/${state.questions.length}`;
    progressBar.style.width = `${(state.qIndex / state.questions.length) * 100}%`;
    scoreDisplay.textContent = state.currentScore;
  }

  function handleAnswer(correct, choice) {
    // feedback
    if (correct) {
      state.currentScore += SCORE_CORRECT;
      flashBorder('good');
    } else {
      flashBorder('bad');
    }

    // show explanation if available
    if (choice && choice.explain) {
      const note = document.createElement('div');
      note.className = 'muted';
      note.style.marginTop = '10px';
      note.textContent = choice.explain;
      answersEl.appendChild(note);
    }

    // next
    state.qIndex++;
    setTimeout(()=> {
      if (state.qIndex >= state.questions.length) return endGame();
      renderQuestion();
    }, 600);
  }

  function endGame() {
    showScreen(screenResult);
    $('#resultTitle').textContent = `Score: ${state.currentScore}`;
    const pct = state.currentScore / (state.questions.length * SCORE_CORRECT || 1);
    let text = '', badge='';
    if (pct >= 0.8) { text = 'Excellent — Cyber Guardian!'; badge='CYBER GUARDIAN'; }
    else if (pct >= 0.45) { text = 'Nice — Security Analyst.'; badge='ANALYST'; }
    else { text = 'Keep practicing — Rookie.'; badge='ROOKIE'; }
    $('#resultDescription').textContent = text;
    $('#badgeEarned').textContent = badge;

    // update top
    if (state.currentScore > state.topScore) {
      state.topScore = state.currentScore;
      saveTopScore(state.topScore);
    }
    setTopDisplay();
  }

  /* -------------------- SPOT THE PHISH -------------------- */
  let spotIndex = 0;
  function initSpotGame() {
    spotIndex = 0;
    renderSpotRound();
    $('#spot-exit').addEventListener('click', ()=>showScreen(menu));
    $('#spot-next').addEventListener('click', ()=>renderSpotRound());
  }

  function renderSpotRound() {
    const grid = $('#spotGrid');
    grid.innerHTML = '';
    // generate pair: one legit, one fake
    const legit = generateFakeImg('SECURE','teal');
    const fake = generateFakeImg('VERIFY-LOGIN','maroon');
    const choices = Math.random() > 0.5 ? [fake, legit] : [legit, fake];
    choices.forEach((src, i) => {
      const card = document.createElement('div'); card.className='spot-card card';
      const img = document.createElement('img'); img.src = src; img.style.width='100%';
      card.appendChild(img);
      card.addEventListener('click', ()=> {
        const isFake = src === fake;
        if (isFake) { flashBorder('good'); state.currentScore += 200; }
        else { flashBorder('bad'); }
        setTimeout(()=> renderSpotRound(), 600);
      });
      grid.appendChild(card);
    });
  }

  /* -------------------- PASSWORD FORGE -------------------- */
  function initForge() {
    const input = $('#pwdInput');
    const strength = $('#pwdStrength');
    $('#pwd-exit').addEventListener('click', ()=> showScreen(menu));
    $('#pwd-check').addEventListener('click', ()=> {
      const val = input.value || '';
      const score = evaluatePassword(val);
      if (score >= 80) { state.currentScore += 300; flashBorder('good'); alert('Accepted — +300 points'); }
      else { flashBorder('bad'); alert('Password too weak — try again'); }
      showScreen(menu);
    });
    input.addEventListener('input', ()=> {
      const val = input.value || '';
      const sc = evaluatePassword(val);
      strength.textContent = `Strength: ${sc}%`;
      strength.style.color = sc > 75 ? 'var(--good)' : (sc > 40 ? 'orange' : 'var(--bad)');
    });
  }

  function evaluatePassword(p) {
    if (!p) return 0;
    // basic heuristics: length + variety + entropy-ish
    let score = Math.min(40, p.length * 4); // length
    if (/[a-z]/.test(p)) score += 10;
    if (/[A-Z]/.test(p)) score += 10;
    if (/\d/.test(p)) score += 15;
    if (/[^A-Za-z0-9]/.test(p)) score += 25;
    // penalize common patterns
    const lowers = p.toLowerCase();
    if (/(password|1234|qwerty|admin)/.test(lowers)) score = Math.min(score, 30);
    return Math.min(100, score);
  }

  /* -------------------- STORY MODE -------------------- */
  let currentStoryNode = 'start';
  function startStory() {
    currentStoryNode = 'start';
    renderStoryNode();
    $('#story-exit').addEventListener('click', ()=> showScreen(menu));
  }

  function renderStoryNode() {
    const node = STORY[currentStoryNode];
    if (!node) return showScreen(menu);
    $('#storyText').textContent = node.text;
    const choicesEl = $('#storyChoices');
    choicesEl.innerHTML = '';
    node.choices.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = c.text;
      btn.addEventListener('click', () => {
        state.currentScore += c.score || 0;
        currentStoryNode = c.next;
        if (currentStoryNode.startsWith('end')) {
          // end
          $('#resultTitle').textContent = `Story result — score ${state.currentScore}`;
          $('#resultDescription').textContent = STORY[currentStoryNode].text || '';
          $('#badgeEarned').textContent = state.currentScore > 100 ? 'CYBER GUARDIAN' : 'ROOKIE';
          showScreen(screenResult);
        } else {
          renderStoryNode();
        }
      });
      choicesEl.appendChild(btn);
    });
  }

  /* -------------------- POSTER GENERATOR -------------------- */
  function generatePosterPrompt() {
    const name = prompt('Enter your display name for the poster (or leave blank):') || 'ANON';
    generatePoster(name, state.currentScore, $('#badgeEarned').textContent || 'ROOKIE');
  }

  function generatePoster(name='ANON', score=0, badge='ROOKIE') {
    const c = posterCanvas;
    const ctx = c.getContext('2d');
    c.width = 1024; c.height = 1024;
    // background gradient
    const g = ctx.createLinearGradient(0,0,c.width,c.height);
    g.addColorStop(0,'#061021'); g.addColorStop(0.5,'#08102a'); g.addColorStop(1,'#0b0621');
    ctx.fillStyle = g; ctx.fillRect(0,0,c.width,c.height);
    // glowing rings
    for (let i=0;i<8;i++){
      ctx.beginPath();
      ctx.strokeStyle = `hsla(${(i*40)%360},80%,60%,${0.06})`;
      ctx.lineWidth = 20;
      ctx.arc(c.width/2,c.height/2,120 + i*40,0,Math.PI*2);
      ctx.stroke();
    }
    // Title
    ctx.font = '64px Inter, sans-serif';
    ctx.fillStyle = '#00eaff';
    ctx.textAlign = 'center';
    ctx.fillText('CYBERGUARDIAN', c.width/2, 180);
    // Badge
    ctx.font = '36px Inter';
    ctx.fillStyle = '#fff';
    ctx.fillText(badge, c.width/2, 240);
    // Score
    ctx.font = '80px Inter';
    ctx.fillStyle = '#7CFFDB';
    ctx.fillText(`Score: ${score}`, c.width/2, 420);
    // Name
    ctx.font = '40px Inter';
    ctx.fillStyle = '#ffb6ff';
    ctx.fillText(`${name}`, c.width/2, 520);

    // small generative shapes
    for (let i=0;i<60;i++){
      ctx.fillStyle = `hsla(${(i*13 + score)%360},90%,60%,0.08)`;
      const x = Math.random()*c.width;
      const y = Math.random()*c.height;
      ctx.fillRect(x,y,Math.random()*8,Math.random()*8);
    }

    // export
    const url = c.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `cyberguardian_poster_${name}_${score}.png`;
    a.click();
  }

  /* -------------------- LEADERBOARD -------------------- */
  // Firebase optional: if you paste config, we'll initialize; else fallback to localStorage
  let firebaseDB = null;
  if (USE_FIREBASE) {
    try {
      // dynamic load Firebase scripts
      const s1 = document.createElement('script'); s1.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js';
      const s2 = document.createElement('script'); s2.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js';
      document.head.appendChild(s1); document.head.appendChild(s2);
      s2.onload = () => {
        const app = firebase.initializeApp(FIREBASE_CONFIG);
        firebaseDB = firebase.database();
        console.log('Firebase initialized');
      };
    } catch (e) { console.warn('Firebase failed: ', e); firebaseDB = null; }
  }

  function saveTopScore(score) {
    const top = Math.max(score, loadTopScore());
    localStorage.setItem('cg_top', String(top));
    state.topScore = top;
  }
  function loadTopScore() {
    const t = localStorage.getItem('cg_top');
    return t ? Number(t) : 0;
  }

  function showLeaderboard() {
    showScreen(screenLeaderboard);
    const list = $('#leaderboardList');
    list.innerHTML = '<strong>Top scores</strong>';
    // if firebase available, fetch online
    if (firebaseDB) {
      // read top 10 from /scores
      firebaseDB.ref('scores').orderByChild('score').limitToLast(20).once('value', snap => {
        const val = snap.val() || {};
        const arr = Object.values(val).sort((a,b)=>b.score - a.score).slice(0,10);
        renderLeaderboard(arr);
      });
    } else {
      // localStorage fallback
      const raw = localStorage.getItem(LB_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      renderLeaderboard(arr.sort((a,b)=>b.score - a.score).slice(0,10));
    }
  }
  function renderLeaderboard(arr) {
    const list = $('#leaderboardList');
    list.innerHTML = '';
    if (!arr.length) list.innerHTML = '<div class="muted">No scores yet</div>';
    arr.forEach((r, i) => {
      const row = document.createElement('div'); row.className='lb-row';
      row.innerHTML = `<div>#${i+1} ${escapeHtml(r.name||'ANON')}</div><div>${r.score}</div>`;
      list.appendChild(row);
    });
    $('#lb-back').onclick = ()=> showScreen(menu);
    $('#lb-clear').onclick = ()=> { localStorage.removeItem(LB_KEY); showLeaderboard(); };
  }

  function submitScore(name, score) {
    const record = { name: name || 'ANON', score: score, ts: Date.now() };
    if (firebaseDB) {
      const ref = firebaseDB.ref('scores').push();
      ref.set(record);
      alert('Submitted to online leaderboard');
    } else {
      const raw = localStorage.getItem(LB_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      arr.push(record);
      localStorage.setItem(LB_KEY, JSON.stringify(arr));
      alert('Saved locally (no Firebase configured)');
    }
  }

  /* -------------------- HELPERS -------------------- */
  function showScreen(el) {
    [menu, screenGame, screenSpot, screenForge, screenStory, screenResult, screenLeaderboard].forEach(x => x && (x.hidden = true));
    el.hidden = false;
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function flashBorder(kind) {
    const el = document.body;
    const orig = el.style.boxShadow;
    if (kind === 'good') {
      el.style.boxShadow = '0 0 40px rgba(124,255,219,0.25)';
    } else {
      el.style.boxShadow = '0 0 40px rgba(255,95,109,0.25)';
    }
    setTimeout(()=> el.style.boxShadow = orig, 300);
  }

  // escape helper for names
  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  /* -------------------- Utilities: generateFakeImg (canvas->dataURL) -------------------- */
  function generateFakeImg(label='LOGIN', color='crimson') {
    // create small canvas and draw pseudo-login banner with label
    const c = document.createElement('canvas');
    c.width = 800; c.height = 220;
    const ctx = c.getContext('2d');
    // background
    const grad = ctx.createLinearGradient(0,0,c.width,0);
    grad.addColorStop(0,'#071225'); grad.addColorStop(1,'#0b0f2a');
    ctx.fillStyle = grad; ctx.fillRect(0,0,c.width,c.height);
    // box
    ctx.fillStyle = '#0f1626'; ctx.fillRect(20,30,c.width-40,c.height-60);
    // fake logo
    ctx.fillStyle = color; ctx.fillRect(40,50,120,80);
    ctx.fillStyle = '#fff'; ctx.font = '34px Inter, sans-serif'; ctx.fillText(label, 180, 110);
    // subtle artifacts for 'fake'
    if (color === 'crimson' || color === 'maroon') {
      for (let i=0;i<30;i++){
        ctx.fillStyle = `rgba(255,255,255,${Math.random()*0.03})`;
        ctx.fillRect(Math.random()*c.width, Math.random()*c.height, Math.random()*4, Math.random()*20);
      }
    }
    return c.toDataURL('image/png');
  }

  /* -------------------- Generative background (animated) -------------------- */
  const bg = document.querySelector('#bg-art');
  const bgCtx = bg.getContext('2d');
  function resizeBg(){ bg.width = window.innerWidth; bg.height = window.innerHeight; }
  window.addEventListener('resize', resizeBg);
  resizeBg();

  let t0 = performance.now();
  function bgLoop(now) {
    const w = bg.width, h = bg.height;
    const dt = (now - t0) / 1000;
    t0 = now;
    bgCtx.clearRect(0,0,w,h);

    // animated radial blobs
    for (let i=0;i<8;i++){
      const x = w * (0.2 + 0.6 * ((Math.sin(now/1400 + i) + 1)/2));
      const y = h * (0.2 + 0.6 * ((Math.cos(now/1200 + i*1.2) + 1)/2));
      const r = 200 + (Math.sin(now/800 + i) * 40);
      const grad = bgCtx.createRadialGradient(x,y,r*0.1,x,y,r);
      grad.addColorStop(0, `hsla(${(i*45 + now/30)%360}, 80%, 60%, 0.06)`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      bgCtx.fillStyle = grad;
      bgCtx.beginPath(); bgCtx.arc(x,y,r,0,Math.PI*2); bgCtx.fill();
    }

    requestAnimationFrame(bgLoop);
  }
  requestAnimationFrame(bgLoop);

  /* -------------------- INIT -------------------- */
  function init() {
    // menu handlers done above
    // game buttons
    $('#btn-leaderboard').addEventListener('click', showLeaderboard);
    // result controls
    $('#result-menu').addEventListener('click', ()=> showScreen(menu));
    $('#result-poster').addEventListener('click', ()=> generatePosterPrompt());
    $('#result-leaderboard').addEventListener('click', ()=> {
      const name = prompt('Enter your name to submit score:') || 'ANON';
      submitScore(name, state.currentScore);
      showLeaderboard();
    });
    // set initial display
    setTopDisplay();
    showScreen(menu);
  }

  init();

})();
