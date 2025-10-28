/* =====================================================
   CYBERGUARDIAN 2026 — Hackathon Edition
   + PWA install prompt + VS (Hotseat & P2P WebRTC)
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
  if(bgMusic.paused){ bgMusic.play(); $("#soundToggle").textContent="🔊"; }
  else { bgMusic.pause(); $("#soundToggle").textContent="🔈"; }
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

/* BANK OF QUESTIONS (txt + visual) */
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

/* UI screens */
const screenMenu = $("#menu");
const screenGame = $("#screen-game");
const screenSpot = $("#screen-spot");
const screenForge = $("#screen-forge");
const screenStory = $("#screen-story");
const screenResult = $("#screen-result");
const screenLB = $("#screen-leaderboard");
const screenVSSetup = $("#screen-vs-setup");
const screenVS = $("#screen-vs");

/* Common elements */
const questionText = $("#questionText");
const answersEl = $("#answers");
const scoreDisplay = $("#scoreDisplay");
const topDisplay = $("#topDisplay");
const progressBar = $("#progress-bar");
const badgeDisplay = $("#badgeEarned");

/* VS elements */
const vsP1El = $("#vs-p1");
const vsP2El = $("#vs-p2");
const vsQEl = $("#vs-question");
const vsAnsEl = $("#vs-answers");
const vsProg = $("#vs-progress");

/* MENU */
document.querySelectorAll(".mode-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const mode = btn.dataset.mode;
    if(mode==="vs"){ showScreen(screenVSSetup); return; }
    startMode(mode);
  });
});
$("#btn-leaderboard").addEventListener("click", ()=>showLeaderboard());
$("#btn-poster").addEventListener("click", ()=>poster("Player", state.score, "POSTER"));

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

/* QUIZ */
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
  if(correct){ playSFX("correct"); flash("good"); state.score += 120; }
  else { playSFX("wrong"); flash("bad"); }
  if(choice && choice.explain){
    const msg=document.createElement("p");
    msg.className="muted"; msg.textContent=choice.explain; answersEl.appendChild(msg);
  }
  setTimeout(()=>{
    state.qIndex++;
    if(state.qIndex>=state.questions.length){ endGame(); }
    else { renderQuestion(); }
  },600);
}

/* SPOT */
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

/* FORGE */
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
      playSFX("correct"); state.score+=300; endGame();
    } else { playSFX("wrong"); alert("Too weak, try again."); }
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

/* STORY (minimal) */
const STORY={
  start:{text:"Suspicious process detected. Action?",choices:[
    {txt:"Kill process", next:"scan",score:20},
    {txt:"Isolate & report", next:"forensic",score:60},
    {txt:"Ignore", next:"bad",score:-40}
  ]},
  scan:{text:"Unknown IP connections.",choices:[
    {txt:"Forensic capture",next:"good",score:40}
  ]},
  forensic:{text:"Exfiltration attempt confirmed.",choices:[
    {txt:"Patch & notify",next:"good",score:50}
  ]},
  good:{text:"Attack mitigated — great job!",choices:[]},
  bad:{text:"Data breach escalated. Ouch.",choices:[]}
};
function renderStory(node){
  const n = STORY[node];
  $("#storyText").textContent=n.text;
  const box=$("#storyChoices"); box.innerHTML="";
  n.choices.forEach(ch=>{
    const btn=document.createElement("button");
    btn.className="btn"; btn.textContent=ch.txt;
    btn.onclick=()=>{ state.score+=ch.score; renderStory(ch.next); };
    box.appendChild(btn);
  });
  $("#story-exit").onclick=()=>showScreen(screenMenu);
  if(n.choices.length===0) endGame();
}

/* RESULT + ACHIEVEMENTS + POSTER/PDF */
function endGame(){
  showScreen(screenResult);
  $("#resultTitle").textContent=`Score: ${state.score}`;
  let badge="ROOKIE";
  if(state.score>800) badge="CYBER GUARDIAN";
  else if(state.score>400) badge="ANALYST";
  badgeDisplay.textContent=badge;
  $("#resultDescription").textContent="Your cybersecurity level:";
  unlockAchievements(badge);
  if(state.score > state.top){ state.top = state.score; saveTopScore(state.top); }
  $("#result-menu").onclick=()=>showScreen(screenMenu);
  $("#result-leaderboard").onclick=()=>{
    const name=prompt("Name for leaderboard?") || "ANON";
    saveScore(name,state.score);
    showLeaderboard();
  };
  $("#result-poster").onclick=()=>poster("Player", state.score, badge);
}
function unlockAchievements(badge){
  let ach = JSON.parse(localStorage.getItem("cg_ach")||"[]");
  function unlock(name){
    if(!ach.includes(name)){ ach.push(name); localStorage.setItem("cg_ach",JSON.stringify(ach)); alert("Achievement unlocked: "+name); }
  }
  if(badge==="CYBER GUARDIAN") unlock("Perfect Defender");
  if(state.mode==="spot" && state.score>200) unlock("Phish Hunter");
  if(state.mode==="forge" && state.score>200) unlock("Password Warrior");
}

/* LEADERBOARD (local) */
function saveScore(name,score){
  const arr = JSON.parse(localStorage.getItem(LB_KEY)||"[]");
  arr.push({name,score});
  localStorage.setItem(LB_KEY,JSON.stringify(arr));
}
function showLeaderboard(){
  showScreen(screenLB);
  const box=$("#leaderboardList"); box.innerHTML="";
  let arr=JSON.parse(localStorage.getItem(LB_KEY)||"[]");
  arr.sort((a,b)=>b.score-a.score).slice(0,10).forEach((x,i)=>{
    const row=document.createElement("div");
    row.className="lb-row";
    row.innerHTML=`<div>#${i+1} ${escapeHtml(x.name)}</div><div>${x.score}</div>`;
    box.appendChild(row);
  });
  $("#lb-back").onclick=()=>showScreen(screenMenu);
  $("#lb-clear").onclick=()=>{localStorage.removeItem(LB_KEY);showLeaderboard();};
}
function loadTopScore(){ return Number(localStorage.getItem("cg_top")||0); }
function saveTopScore(s){ localStorage.setItem("cg_top",String(s)); }

/* POSTER + PDF */
function poster(name,score,badge){
  const c=$("#posterCanvas"); const ctx=c.getContext("2d");
  c.width=c.height=1024;
  ctx.fillStyle="#020611"; ctx.fillRect(0,0,c.width,c.height);
  for(let i=0;i<8;i++){
    ctx.beginPath();
    ctx.strokeStyle=`hsla(${(i*40)%360},80%,60%,0.06)`;
    ctx.lineWidth=20; ctx.arc(512,512,120+i*40,0,Math.PI*2); ctx.stroke();
  }
  ctx.font="64px Inter"; ctx.fillStyle="#00eaff"; ctx.textAlign="center";
  ctx.fillText("CYBERGUARDIAN",512,180);
  ctx.font="36px Inter"; ctx.fillStyle="#fff"; ctx.fillText(badge,512,240);
  ctx.font="80px Inter"; ctx.fillStyle="#7CFFDB"; ctx.fillText(`Score: ${score}`,512,420);
  ctx.font="40px Inter"; ctx.fillStyle="#ffb6ff"; ctx.fillText(`${name}`,512,520);
  const png=c.toDataURL();
  const a=document.createElement("a"); a.href=png; a.download="poster.png"; a.click();

  // PDF
  window.jsPDF=window.jspdf.jsPDF;
  const pdf = new jsPDF({orientation:"portrait",unit:"px",format:"a4"});
  pdf.setFont("Helvetica","bold"); pdf.setFontSize(28);
  pdf.text("CyberGuardian — Certificate",80,110);
  pdf.setFontSize(18); pdf.text(`Name: ${name}`,80,150);
  pdf.text(`Score: ${score}`,80,180);
  pdf.text(`Badge: ${badge}`,80,210);
  pdf.addImage(png,"PNG",80,240,400,400);
  pdf.save(`CyberGuardian_certificate_${name}.pdf`);
}

/* PWA Install Prompt */
let deferredPrompt=null;
window.addEventListener("beforeinstallprompt",(e)=>{
  e.preventDefault(); deferredPrompt=e;
});
$("#btn-install").addEventListener("click", async ()=>{
  if(deferredPrompt){ deferredPrompt.prompt(); deferredPrompt=null; }
  else { alert("Install prompt not available (maybe already installed)."); }
});

/* VS SETUP */
$("#vs-exit").addEventListener("click", ()=>showScreen(screenMenu));
$("#vs-local").addEventListener("click", startVSLocal);
$("#vs-p2p").addEventListener("click", ()=>{ $("#vs-p2p-setup").hidden=false; });
$("#vs-host").addEventListener("click", createOffer);
$("#vs-guest").addEventListener("click", ()=>{ $("#vs-guest-box").hidden=false; $("#vs-host-box").hidden=true; });

$("#vs-accept").addEventListener("click", acceptAnswer);
$("#vs-gen-answer").addEventListener("click", generateAnswer);

/* VS — Local Hotseat */
function startVSLocal(){
  vsInitScores();
  showScreen(screenVS);
  vsNextQuestion();
  $("#vs-end").onclick=()=>showScreen(screenMenu);
}
function vsInitScores(){ vsP1El.textContent="0"; vsP2El.textContent="0"; vsProg.style.width="0%"; }
function vsNextQuestion(){
  const q = pickQuestions(1)[0];
  vsQEl.textContent = q.q;
  vsAnsEl.innerHTML="";
  const roll = Math.random()>.5 ? q.choices : [...q.choices].reverse();
  roll.forEach((c,i)=>{
    const btn=document.createElement("button");
    btn.className="btn"; btn.textContent = c.t ? c.t : (c.img ? "Open image" : "Answer");
    if(c.img){ const img=new Image(); img.src=c.img; img.style.width="100%"; btn.innerHTML=""; btn.appendChild(img); }
    btn.onclick = ()=>{
      // Players tap in turns: even taps = P1, odd = P2 (simple hotseat)
      const total = Number(vsP1El.dataset.clicks||0) + Number(vsP2El.dataset.clicks||0);
      const p = (total % 2 === 0) ? 'P1' : 'P2';
      if(c.c){ if(p==='P1'){ vsP1El.textContent = (+vsP1El.textContent)+1; } else { vsP2El.textContent = (+vsP2El.textContent)+1; } flash("good"); }
      else { flash("bad"); }
      vsP1El.dataset.clicks = String((+vsP1El.dataset.clicks||0) + (p==='P1'?1:0));
      vsP2El.dataset.clicks = String((+vsP2El.dataset.clicks||0) + (p==='P2'?1:0));
      const totalRounds = (+vsP1El.textContent)+(+vsP2El.textContent);
      vsProg.style.width = `${Math.min(100,totalRounds*10)}%`;
      if(totalRounds>=10){ $("#vs-end").click(); }
      else setTimeout(vsNextQuestion, 400);
    };
    vsAnsEl.appendChild(btn);
  });
}

/* VS — P2P WebRTC (copy-paste signaling) */
let pc=null, ch=null, isHost=false;
async function createOffer(){
  isHost = true;
  $("#vs-host-box").hidden=false; $("#vs-guest-box").hidden=true;
  pc = new RTCPeerConnection();
  ch = pc.createDataChannel("cg");
  setupChannel();
  const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
  $("#vs-offer").value = btoa(JSON.stringify(pc.localDescription));
  pc.onicecandidate = (e)=> { if(!e.candidate){ $("#vs-offer").value = btoa(JSON.stringify(pc.localDescription)); } };
}
function setupChannel(){
  ch.onopen = ()=>{ startVSOnline(); };
  ch.onmessage = (evt)=>{ const msg = JSON.parse(evt.data); handleVSMessage(msg); };
}
async function generateAnswer(){
  const remote = $("#vs-remote-offer").value.trim();
  if(!remote) return alert("Paste Host Offer first.");
  pc = new RTCPeerConnection();
  pc.ondatachannel = (e)=>{ ch = e.channel; setupChannel(); };
  await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(atob(remote))));
  const ans = await pc.createAnswer(); await pc.setLocalDescription(ans);
  $("#vs-guest-answer").value = btoa(JSON.stringify(pc.localDescription));
  pc.onicecandidate = (e)=>{ if(!e.candidate){ $("#vs-guest-answer").value = btoa(JSON.stringify(pc.localDescription)); } };
}
async function acceptAnswer(){
  const ans = $("#vs-answer").value.trim();
  if(!ans || !pc) return alert("Paste Guest Answer.");
  await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(atob(ans))));
}
function startVSOnline(){
  vsInitScores();
  showScreen(screenVS);
  vsSend({type:"start"});
  vsOnlineNext();
  $("#vs-end").onclick=()=>{ vsSend({type:"end"}); showScreen(screenMenu); try{pc.close()}catch{} };
}
function vsOnlineNext(){
  const q = pickQuestions(1)[0];
  vsQEl.textContent = q.q;
  vsAnsEl.innerHTML="";
  const payload = {type:"q", q:q.q, choices:q.choices.map(c=>({t:c.t||null, img:c.img||null, c:!!c.c}))};
  vsSend(payload);
  renderVSChoices(payload.choices);
}
function renderVSChoices(choices){
  choices.forEach(c=>{
    const btn=document.createElement("button");
    btn.className="btn";
    if(c.img){ const img=new Image(); img.src=c.img; img.style.width="100%"; btn.appendChild(img); }
    else { btn.textContent = c.t; }
    btn.onclick=()=>{
      vsSend({type:"a", correct:c.c});
      if(c.c){ incVS(isHost? 'p1':'p2'); flash("good"); }
      else { flash("bad"); }
      setTimeout(vsOnlineNext, 400);
    };
    vsAnsEl.appendChild(btn);
  });
}
function handleVSMessage(msg){
  if(msg.type==="start"){ vsInitScores(); }
  if(msg.type==="q"){
    vsQEl.textContent = msg.q; vsAnsEl.innerHTML=""; renderVSChoices(msg.choices);
  }
  if(msg.type==="a"){
    if(msg.correct){ incVS(isHost? 'p2':'p1'); flash("good"); }
    else { flash("bad"); }
  }
  if(msg.type==="end"){ showScreen(screenMenu); try{pc.close()}catch{} }
}
function incVS(who){
  if(who==='p1'){ vsP1El.textContent = (+vsP1El.textContent)+1; }
  else { vsP2El.textContent = (+vsP2El.textContent)+1; }
  const total = (+vsP1El.textContent)+(+vsP2El.textContent);
  vsProg.style.width = `${Math.min(100,total*10)}%`;
}
function vsSend(o){ try{ ch && ch.readyState==="open" && ch.send(JSON.stringify(o)); }catch{} }

/* HELPERS */
function showScreen(el){
  [screenMenu,screenGame,screenSpot,screenForge,screenStory,screenResult,screenLB,screenVSSetup,screenVS]
    .forEach(x=> x.hidden=true);
  el.hidden=false;
}
function escapeHtml(s){ return String(s).replace(/[&<>"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c])); }
function fakeIMG(label,color){
  const c=document.createElement("canvas"); c.width=800; c.height=220;
  const ctx=c.getContext("2d");
  ctx.fillStyle="#071426"; ctx.fillRect(0,0,c.width,c.height);
  ctx.fillStyle=color; ctx.font="60px Arial"; ctx.fillText(label,50,130);
  return c.toDataURL();
}
function flash(type){
  document.body.style.boxShadow = type==="good" ?
    "0 0 40px rgba(124,255,219,0.4)" :
    "0 0 40px rgba(255,95,109,0.4)";
  setTimeout(()=>document.body.style.boxShadow="none",250);
}

/* Leaderboard helpers */
function renderLB(){
  const box=$("#leaderboardList");
  box.innerHTML="";
  let arr=JSON.parse(localStorage.getItem(LB_KEY)||"[]");
  arr.sort((a,b)=>b.score-a.score).slice(0,10).forEach((x,i)=>{
    const row=document.createElement("div");
    row.className="lb-row";
    row.innerHTML=`<div>#${i+1} ${escapeHtml(x.name)}</div><div>${x.score}</div>`;
    box.appendChild(row);
  });
  $("#lb-back").onclick=()=>showScreen(screenMenu);
  $("#lb-clear").onclick=()=>{localStorage.removeItem(LB_KEY);renderLB();};
}

/* INIT */
function init(){
  setTop();
  showScreen(screenMenu);
  // Leaderboard button also in header
  $("#btn-leaderboard").addEventListener("click", ()=>{ showLeaderboard(); });
}
function setTop(){ topDisplay.textContent = state.top; }
function showLeaderboard(){ renderLB(); showScreen(screenLB); }

init();

/* Background */
const bg=$("#bg-art").getContext("2d");
function resizeBg(){
  const c=$("#bg-art"); c.width=innerWidth; c.height=innerHeight;
}
resizeBg(); onresize=resizeBg;
function bgLoop(t){
  const c=$("#bg-art");
  bg.clearRect(0,0,c.width,c.height);
  for(let i=0;i<6;i++){
    const x=Math.sin(t/900+i)*c.width*0.4+c.width/2;
    const y=Math.cos(t/700+i)*c.height*0.4+c.height/2;
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

/* Storage */
function loadTopScore(){ return Number(localStorage.getItem("cg_top")||0); }
function saveTopScore(s){ localStorage.setItem("cg_top",String(s)); }

})();
