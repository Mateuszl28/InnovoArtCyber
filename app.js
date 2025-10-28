/* =====================================================
   CYBERGUARDIAN 2026 — Hackathon Edition
   Game + Art + Achievements + Poster + PDF + SFX
===================================================== */

(() => {

const $ = (s) => document.querySelector(s);

/* AUDIO */
const bgMusic = $("#bgMusic");
const sfxCorrect = $("#sfxCorrect");
const sfxWrong = $("#sfxWrong");
function playSFX(type){
  if(type==="correct") sfxCorrect.play();
  if(type==="wrong") sfxWrong.play();
}

$("#soundToggle").addEventListener("click", ()=>{
  if(bgMusic.paused){
    bgMusic.play();
    $("#soundToggle").textContent="🔊";
  } else {
    bgMusic.pause();
    $("#soundToggle").textContent="🔈";
  }
});

/* STATE */
let state = {
  score:0,
  top: loadTopScore(),
  mode:null,
  qIndex:0,
  questions:[]
};

const LB_KEY="cg_lb";

/* BANK OF QUESTIONS (txt + visual + story) */
const BANK = [
  {type:"quiz", q:"You receive an email: 'Your account locked — verify here'.", choices:[
    {t:"Click & validate", c:false, explain:"Phishing attempt."},
    {t:"Open official site manually", c:true, explain:"Correct."},
    {t:"Forward email to friends", c:false}
  ]},
  {type:"quiz", q:"Which password is strongest?", choices:[
    {t:"password123", c:false},
    {t:"Summer2023!", c:false},
    {t:"xR!91az$Q2", c:true}
  ]},
  {type:"visual", q:"Which login page is fake?", choices:[
    {img:fakeIMG("SECURE","#0ef"), c:false},
    {img:fakeIMG("VERIFY","#ff0066"), c:true}
  ]},
  {type:"quiz", q:"Best Wi-Fi practice?", choices:[
    {t:"Always use VPN on public Wi-Fi", c:true},
    {t:"Send files unencrypted", c:false}
  ]}
];

/* UI references */
const screenMenu = $("#menu");
const screenGame = $("#screen-game");
const screenSpot = $("#screen-spot");
const screenForge = $("#screen-forge");
const screenStory = $("#screen-story");
const screenResult = $("#screen-result");
const screenLB = $("#screen-leaderboard");

const questionText = $("#questionText");
const answersEl = $("#answers");
const scoreDisplay = $("#scoreDisplay");
const topDisplay = $("#topDisplay");
const progressBar = $("#progress-bar");
const badgeDisplay = $("#badgeEarned");

function showScreen(el){
  [screenMenu,screenGame,screenSpot,screenForge,screenStory,screenResult,screenLB]
    .forEach(x=> x.hidden=true);
  el.hidden=false;
}

/* ===== MENU ===== */
document.querySelectorAll(".mode-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const mode = btn.dataset.mode;
    startMode(mode);
  });
});

function startMode(mode){
  state.mode = mode;
  state.score = 0;
  state.qIndex = 0;

  if(mode==="quiz" || mode==="practice"){
    state.questions = pickQuestions(8);
    showScreen(screenGame);
    renderQuestion();
  }
  else if(mode==="spot"){
    showScreen(screenSpot);
    renderSpot();
  }
  else if(mode==="forge"){
    showScreen(screenForge);
    initForge();
  }
  else if(mode==="story"){
    showScreen(screenStory);
    renderStory("start");
  }
}

/* ===== QUIZ ===== */
function pickQuestions(n){
  const arr=[...BANK];
  const out=[];
  while(out.length<n && arr.length){
    out.push(arr.splice(Math.floor(Math.random()*arr.length),1)[0]);
  }
  return out;
}

function renderQuestion(){
  const q = state.questions[state.qIndex];
  questionText.textContent = q.q;
  answersEl.innerHTML="";

  if(q.type==="visual"){
    q.choices.forEach(choice=>{
      const btn=document.createElement("button");
      btn.className="btn";
      const img=document.createElement("img");
      img.src=choice.img;
      img.style.width="100%";
      btn.appendChild(img);
      btn.onclick = ()=>answer(choice.c,choice);
      answersEl.appendChild(btn);
    });
  } else {
    q.choices.forEach(choice=>{
      const btn=document.createElement("button");
      btn.className="btn";
      btn.textContent=choice.t;
      btn.onclick=()=>answer(choice.c,choice);
      answersEl.appendChild(btn);
    });
  }

  scoreDisplay.textContent=state.score;
  topDisplay.textContent=state.top;
  progressBar.style.width = `${(state.qIndex/state.questions.length)*100}%`;
}

function answer(correct, choice){
  if(correct){
    playSFX("correct");
    flash("good");
    state.score += 120;
  }
  else {
    playSFX("wrong");
    flash("bad");
  }

  if(choice && choice.explain){
    const msg=document.createElement("p");
    msg.className="muted";
    msg.textContent=choice.explain;
    answersEl.appendChild(msg);
  }

  setTimeout(()=>{
    state.qIndex++;
    if(state.qIndex>=state.questions.length){
      endGame();
    } else renderQuestion();
  },600);
}

/* ===== SPOT THE PHISH ===== */
function renderSpot(){
  const grid=$("#spotGrid");
  grid.innerHTML="";
  const legit=fakeIMG("LEGIT","#00eaff");
  const fake=fakeIMG("FAKE","#ff0066");
  const arr=Math.random()>0.5?[fake,legit]:[legit,fake];

  arr.forEach(src=>{
    const img=document.createElement("img");
    img.src=src;
    img.onclick = ()=>{
      if(src===fake){ playSFX("correct"); flash("good"); state.score+=200; }
      else { playSFX("wrong"); flash("bad"); }
      renderSpot();
    };
    grid.appendChild(img);
  });

  $("#spot-exit").onclick=()=>showScreen(screenMenu);
}

/* ===== PASSWORD FORGE ===== */
function initForge(){
  const input=$("#pwdInput");
  const meter=$("#pwdStrength");
  input.value="";

  input.oninput=()=>{
    const s=strength(input.value);
    meter.textContent=`Strength: ${s}%`;
    meter.style.color = s>75 ? 'var(--good)' : s>40 ? 'orange' : 'var(--bad)';
  };

  $("#pwd-check").onclick=()=>{
    if(strength(input.value)>=80){
      playSFX("correct");
      state.score+=300;
      endGame();
    } else {
      playSFX("wrong");
      alert("Too weak, try again.");
    }
  };

  $("#pwd-exit").onclick=()=>showScreen(screenMenu);
}

function strength(p){
  if(!p) return 0;
  let score=Math.min(40,p.length*4);
  if(/[A-Z]/.test(p))score+=15;
  if(/[a-z]/.test(p))score+=10;
  if(/\d/.test(p))score+=15;
  if(/[^A-Za-z0-9]/.test(p))score+=20;
  if(/pass|123|qwert/.test(p.toLowerCase()))score=30;
  return Math.min(100,score);
}

/* ===== STORY MODE ===== */
const STORY={
  start:{text:"Suspicious process detected. Action?",choices:[
    {txt:"Kill process", next:"scan",score:20},
    {txt:"Isolate machine & report", next:"forensic",score:60},
    {txt:"Ignore", next:"bad",score:-40}
  ]},
  scan:{text:"Connections to unknown IPs.",choices:[
    {txt:"Forensic capture",next:"good",score:40}
  ]},
  forensic:{text:"Team confirms exfiltration attempt.",choices:[
    {txt:"Patch & notify stakeholders",next:"good",score:50}
  ]},
  good:{text:"Attack mitigated — great job!",choices:[]},
  bad:{text:"Data breach escalated. Ouch.",choices:[]}
};

function renderStory(node){
  const n = STORY[node];
  $("#storyText").textContent=n.text;
  const box=$("#storyChoices");
  box.innerHTML="";
  n.choices.forEach(ch=>{
    const btn=document.createElement("button");
    btn.className="btn";
    btn.textContent=ch.txt;
    btn.onclick=()=>{
      state.score+=ch.score;
      renderStory(ch.next);
    };
    box.appendChild(btn);
  });

  $("#story-exit").onclick=()=>showScreen(screenMenu);
  if(n.choices.length===0) endGame();
}

/* ===== END GAME ===== */
function endGame(){
  showScreen(screenResult);

  $("#resultTitle").textContent=`Score: ${state.score}`;
  let badge="ROOKIE";
  if(state.score>800) badge="CYBER GUARDIAN";
  else if(state.score>400) badge="ANALYST";

  badgeDisplay.textContent=badge;
  $("#resultDescription").textContent="Your cybersecurity level:";
  unlockAchievements(badge);

  if(state.score > state.top){
    state.top = state.score;
    saveTopScore(state.top);
  }

  $("#result-menu").onclick=()=>showScreen(screenMenu);
  $("#result-leaderboard").onclick=()=>{
    const name=prompt("Name for leaderboard?") || "ANON";
    saveScore(name,state.score);
  };
  $("#result-poster").onclick=()=>poster(
    "Player",
    state.score,
    badge
  );
}

/* ===== ACHIEVEMENTS ===== */
function unlockAchievements(badge){
  let ach = JSON.parse(localStorage.getItem("cg_ach")||"[]");
  function unlock(name){
    if(!ach.includes(name)){
      ach.push(name);
      localStorage.setItem("cg_ach",JSON.stringify(ach));
      alert("Achievement unlocked: "+name);
    }
  }
  if(badge==="CYBER GUARDIAN") unlock("Perfect Defender");
  if(state.mode==="spot" && state.score>200) unlock("Phish Hunter");
  if(state.mode==="forge" && state.score>200) unlock("Password Warrior");
}

/* ===== LEADERBOARD ===== */
function saveScore(name,score){
  let arr = JSON.parse(localStorage.getItem(LB_KEY)||"[]");
  arr.push({name,score});
  localStorage.setItem(LB_KEY,JSON.stringify(arr));
  showScreen(screenLB);
  renderLB();
}

function renderLB(){
  const box=$("#leaderboardList");
  box.innerHTML="";
  let arr=JSON.parse(localStorage.getItem(LB_KEY)||"[]");
  arr.sort((a,b)=>b.score-a.score).slice(0,10).forEach((x,i)=>{
    box.innerHTML+=`<div>${i+1}. ${x.name} — ${x.score}</div>`;
  });
  $("#lb-back").onclick=()=>showScreen(screenMenu);
  $("#lb-clear").onclick=()=>{localStorage.removeItem(LB_KEY);renderLB();}
}

function loadTopScore(){
  return Number(localStorage.getItem("cg_top")||0);
}
function saveTopScore(s){
  localStorage.setItem("cg_top",String(s));
}

/* ===== POSTER + PDF ===== */
function poster(name,score,badge){
  const c=$("#posterCanvas");
  const ctx=c.getContext("2d");
  c.width=c.height=1024;
  ctx.fillStyle="#020611";
  ctx.fillRect(0,0,c.width,c.height);

  ctx.font="64px Inter"; ctx.fillStyle="#00eaff"; ctx.textAlign="center";
  ctx.fillText("CYBERGUARDIAN",512,140);

  ctx.font="44px Inter"; ctx.fillStyle="#ff48e8";
  ctx.fillText(badge,512,240);

  ctx.fillStyle="#7CFFDB"; ctx.font="90px Inter";
  ctx.fillText(score,512,430);

  ctx.font="38px Inter"; ctx.fillStyle="white";
  ctx.fillText(name,512,520);

  const png=c.toDataURL();
  const a=document.createElement("a");
  a.href=png;
  a.download="poster.png";
  a.click();

  // PDF
  window.jsPDF=window.jspdf.jsPDF;
  const pdf = new jsPDF({orientation:"portrait",unit:"px",format:"a4"});
  pdf.text(`CyberGuardian — Certificate`,80,120);
  pdf.text(`Name: ${name}`,80,170);
  pdf.text(`Score: ${score}`,80,210);
  pdf.text(`Badge: ${badge}`,80,250);
  pdf.addImage(png,"PNG",90,300,350,350);
  pdf.save(`CyberGuardian_certificate_${name}.pdf`);
}

/* ===== VISUAL IMG GENERATOR ===== */
function fakeIMG(label,color){
  const c=document.createElement("canvas");
  c.width=800; c.height=220;
  const ctx=c.getContext("2d");
  ctx.fillStyle="#071426"; ctx.fillRect(0,0,c.width,c.height);
  ctx.fillStyle=color;
  ctx.font="60px Arial"; ctx.fillText(label,50,130);
  return c.toDataURL();
}

/* ===== FLASH ===== */
function flash(type){
  document.body.style.boxShadow = type==="good" ?
    "0 0 40px rgba(124,255,219,0.4)" :
    "0 0 40px rgba(255,95,109,0.4)";
  setTimeout(()=>document.body.style.boxShadow="none",250);
}

/* ===== ANIMATED BACKGROUND ===== */
const bg=$("#bg-art").getContext("2d");
function resizeBg(){
  const c=$("#bg-art");
  c.width=window.innerWidth;
  c.height=window.innerHeight;
}
resizeBg(); window.onresize=resizeBg;

function bgLoop(t){
  const canvas=$("#bg-art");
  bg.clearRect(0,0,canvas.width,canvas.height);
  for(let i=0;i<6;i++){
    const x=Math.sin(t/900+i)*canvas.width*0.4+canvas.width/2;
    const y=Math.cos(t/700+i)*canvas.height*0.4+canvas.height/2;
    const r=200+Math.sin(t/1000+i)*40;
    const grad=bg.createRadialGradient(x,y,10,x,y,r);
    grad.addColorStop(0,`hsla(${(i*50+t/30)%360},90%,60%,0.07)`);
    grad.addColorStop(1,"transparent");
    bg.fillStyle=grad;
    bg.beginPath(); bg.arc(x,y,r,0,Math.PI*2); bg.fill();
  }
  requestAnimationFrame(bgLoop);
}
requestAnimationFrame(bgLoop);

})();
