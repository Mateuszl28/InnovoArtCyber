/* ==========================================================
   CyberGuardian 2026 — app.js
   🔥 Final hackathon edition (only EN)
========================================================== */

const $ = (s) => document.querySelector(s);

const startBtn = $("#startBtn");
const screenStart = $("#screen-start");
const screenGame = $("#screen-game");
const screenResult = $("#screen-result");
const questionTextEl = $("#questionText");
const answersEl = $("#answers");
const questionCounterEl = $("#questionCounter");
const scoreDisplayEl = $("#scoreDisplay");
const progressBar = $("#progress-bar");
const resultTitleEl = $("#resultTitle");
const resultDescEl = $("#resultDescription");
const badgeEl = $("#badgeEarned");
const againBtn = $("#againBtn");

/* GAME CONFIG */
const POINTS_CORRECT = 120;
const TOTAL_QUESTIONS = 8;
let session = { pool: [], index: 0, score: 0 };

/* QUESTIONS */
const BANK = [
  {
    type: "story",
    q: "You receive an email from your 'bank' asking to confirm your login. It includes a link.",
    choices: [
      { t: "Click the link to confirm quickly.", c: false },
      { t: "Open a new tab and type the bank URL manually.", c: true },
      { t: "Forward the email to friends to warn them.", c: false }
    ]
  },
  {
    type: "quiz",
    q: "Which password is safest?",
    choices: [
      { t: "password123", c: false },
      { t: "YellowTurtle!", c: false },
      { t: "Xr9!A2#pQ7jS", c: true }
    ]
  },
  {
    type: "visual",
    q: "Which login page is phishing?",
    choices: [
      { img: "https://dummyimage.com/600x200/222/ff48e8&text=Login+SECURE", c: false },
      { img: "https://dummyimage.com/600x200/220/ff0000&text=B4nk-Verify-Login", c: true }
    ]
  },
  {
    type: "story",
    q: "A stranger hands you a free USB stick after a conference.",
    choices: [
      { t: "Plug it into your company laptop.", c: false },
      { t: "Do not use it. Give it to security / IT.", c: true },
      { t: "Plug it into a private laptop.", c: false }
    ]
  },
  {
    type: "quiz",
    q: "Best practice for public Wi-Fi?",
    choices: [
      { t: "Use VPN.", c: true },
      { t: "Send confidential files — Wi-Fi means safe.", c: false }
    ]
  }
];

/* RANDOMIZE QUESTIONS */
function startGame() {
  session.pool = [...BANK].sort(() => Math.random() - 0.5).slice(0, TOTAL_QUESTIONS);
  session.index = 0;
  session.score = 0;

  screenStart.hidden = true;
  screenResult.hidden = true;
  screenGame.hidden = false;

  renderQuestion();
}

function renderQuestion() {
  const q = session.pool[session.index];
  if (!q) return endGame();

  questionTextEl.textContent = q.q;
  progressBar.style.width = ((session.index) / TOTAL_QUESTIONS) * 100 + "%";
  answersEl.innerHTML = "";

  q.choices.forEach((choice, idx) => {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.onclick = () => handleAnswer(choice.c);

    if (q.type === "visual") {
      btn.innerHTML = `<img src="${choice.img}" style="width:100%;border-radius:12px;">`;
    } else {
      btn.textContent = choice.t;
    }
    answersEl.appendChild(btn);
  });

  questionCounterEl.textContent = `Question ${session.index + 1}/${TOTAL_QUESTIONS}`;
  scoreDisplayEl.textContent = `Score: ${session.score}`;
}

function handleAnswer(correct) {
  if (correct) session.score += POINTS_CORRECT;

  session.index++;
  setTimeout(renderQuestion, 400);
}

function endGame() {
  screenGame.hidden = true;
  screenResult.hidden = false;

  resultTitleEl.textContent = `Final score: ${session.score}`;
  resultDescEl.textContent = session.score >= 700
    ? "Excellent! You detect attacks like a pro."
    : "Keep training. Hackers don't sleep.";

  badgeEl.textContent =
    session.score >= 700 ? "🏆 BADGE EARNED: CYBER GUARDIAN"
    : session.score >= 400 ? "🔰 BADGE: ANALYST"
    : "🟣 BADGE: ROOKIE";
}

/* EVENTS */
startBtn.onclick = startGame;
againBtn.onclick = () => (window.location.reload());

/* ===== Generative art background ===== */
const canvas = document.querySelector("#bg-art");
const ctx = canvas.getContext("2d");
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.onresize = resize;
resize();

function art() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = `hsla(${(i * 6) + performance.now() / 40}, 80%, 60%, .15)`;
    ctx.beginPath();
    ctx.arc(
      Math.sin(i + performance.now()/700) * canvas.width/2 + canvas.width/2,
      Math.cos(i + performance.now()/700) * canvas.height/2 + canvas.height/2,
      60, 0, Math.PI * 2
    );
    ctx.fill();
  }
  requestAnimationFrame(art);
}
art();
