/* =====================================
   CyberGuardian 2026 — app.js
   Quiz + mini-scenariusze (Mix)
   - bilingual (pl/en)
   - scoring, progress, top score (localStorage)
   - simple animations & feedback
===================================== */

(() => {
  // --- Local storage key
  const STORAGE_KEY = 'cyberguardian.v1';

  // --- UI elements
  const $ = (s) => document.querySelector(s);
  const startBtn = $('#startBtn');
  const toggleLangBtn = $('#toggleLang');
  const screenStart = $('#screen-start');
  const screenGame = $('#screen-game');
  const screenResult = $('#screen-result');
  const questionTextEl = $('#questionText');
  const answersEl = $('#answers');
  const questionCounterEl = $('#questionCounter');
  const scoreDisplayEl = $('#scoreDisplay');
  const resultTitleEl = $('#resultTitle');
  const resultDescEl = $('#resultDescription');
  const againBtn = $('#againBtn');

  // --- Game config
  const TOTAL_QUESTIONS = 8; // per run
  const POINTS_CORRECT = 100;
  const POINTS_PARTIAL = 40; // if applicable (not used here)
  const FLASH_TIME = 700;

  // --- Language & translations
  let LANG = (loadState().lang) || 'pl'; // 'pl' or 'en'

  const T = {
    pl: {
      startTitle: 'Witaj w cyber-grze!',
      startDesc: 'Sprawdź, czy rozpoznasz cyberzagrożenia i podejmiesz właściwe decyzje.',
      startBtn: '▶ Start gry',
      score: 'Wynik',
      questionOf: (i, n) => `Pytanie ${i}/${n}`,
      correct: 'Poprawna odpowiedź!',
      wrong: 'To niepoprawna odpowiedź.',
      resultTitle: (score) => `Twój wynik: ${score} pkt`,
      resultGood: 'Świetnie — jesteś CyberGuardianem!',
      resultMid: 'Dobrze — jeszcze trochę praktyki i będzie świetnie.',
      resultLow: 'Trzeba poćwiczyć — dowiedz się więcej o zagrożeniach.',
      playAgain: '🔄 Zagraj ponownie',
      topScore: 'Rekord',
      toggleTo: 'EN',
    },
    en: {
      startTitle: 'Welcome to the cyber game!',
      startDesc: 'Test your ability to spot cyber threats and make the right decisions.',
      startBtn: '▶ Start Game',
      score: 'Score',
      questionOf: (i, n) => `Question ${i}/${n}`,
      correct: 'Correct answer!',
      wrong: 'Incorrect answer.',
      resultTitle: (score) => `Your score: ${score} pts`,
      resultGood: "Excellent — you're a Cyber Guardian!",
      resultMid: "Good — a bit more practice and you'll be great.",
      resultLow: "Keep learning — know the threats and avoid them.",
      playAgain: '🔄 Play again',
      topScore: 'Top score',
      toggleTo: 'PL',
    },
  };

  // --- Questions (mix of quiz and short scenario). Each question:
  // { id, type: 'quiz'|'scenario', q: {pl,en}, choices: [{pl,en,correct:boolean,explain:{pl,en}}...], explain:{pl,en} }
  // Keep explanations short and educational.
  const BANK = [
    {
      id: 'q1',
      type: 'quiz',
      q: {
        pl: 'Otrzymujesz e-mail „Twoje konto bankowe zostało zablokowane. Kliknij link, by potwierdzić dane.” Co robisz?',
        en: 'You receive an email "Your bank account has been locked. Click link to confirm your details." What do you do?',
      },
      choices: [
        { pl: 'Klikam link i podaję dane, żeby odblokować konto.', en: 'Click the link and provide my details to unlock the account.', correct: false, explain: { pl: 'To prawdopodobny phishing — nie podawaj danych.', en: 'Likely phishing — do not provide credentials.' } },
        { pl: 'Sprawdzam nadawcę i adres domeny banku, loguję się bezpośrednio na stronie banku.', en: 'Check the sender and domain, log in directly on the bank website.', correct: true, explain: { pl: 'Poprawnie — weryfikacja i samodzielne logowanie to bezpieczna praktyka.', en: 'Correct — verify sender and log in directly.' } },
        { pl: 'Przekazuję e-mail dalej znajomym, by ostrzec ich przed bankiem.', en: 'Forward the email to friends to warn them about the bank.', correct: false, explain: { pl: 'Najpierw zweryfikuj; udostępnianie może rozsiewać phishing.', en: 'Verify first; sharing may spread phishing.' } },
      ]
    },
    {
      id: 'q2',
      type: 'scenario',
      q: {
        pl: 'Na ulicy znajdziesz pendrive. Co robisz?',
        en: 'You find a USB drive on the street. What do you do?',
      },
      choices: [
        { pl: 'Podłączam do służbowego komputera — może zawiera ważne pliki.', en: 'Plug it into my work PC — maybe it has important files.', correct: false, explain: { pl: 'Może zawierać malware. Nie podłączaj.', en: 'May contain malware. Do not plug in.' } },
        { pl: 'Przekazuję IT / policji lub niszczę i zgłaszam.', en: 'Hand it to IT/police or destroy and report it.', correct: true, explain: { pl: 'Bezpieczna opcja — pozwól specjalistom zbadać nośnik.', en: 'Safe — let specialists examine it.' } },
        { pl: 'Podłączam do prywatnego laptopa, żeby sprawdzić zawartość.', en: 'Plug into my personal laptop to check contents.', correct: false, explain: { pl: 'Ryzyko zainfekowania urządzenia.', en: 'Risk to your device.' } },
      ]
    },
    {
      id: 'q3',
      type: 'quiz',
      q: {
        pl: 'Które hasło jest najsilniejsze?',
        en: 'Which password is the strongest?',
      },
      choices: [
        { pl: 'haslo123', en: 'password123', correct: false, explain: { pl: 'Słabe — częste i przewidywalne.', en: 'Weak — common and predictable.' } },
        { pl: 'MójKotMa4Łapy!', en: 'MyCatHas4Paws!', correct: false, explain: { pl: 'Lepiej, ale zawiera słowa i łatwe wzorce.', en: 'Better, but still predictable.' } },
        { pl: 'J7#v9!zQ@4rX', en: 'J7#v9!zQ@4rX', correct: true, explain: { pl: 'Silne — losowy zestaw znaków.', en: 'Strong — random characters.' } },
      ]
    },
    {
      id: 'q4',
      type: 'scenario',
      q: {
        pl: 'Twoje konto służbowe prosi o autoryzację z nieznanego urządzenia. Co robisz?',
        en: 'Your work account asks for authorization from an unknown device. What do you do?',
      },
      choices: [
        { pl: 'Autoryzuję — może to ja użyłem innego urządzenia.', en: 'Authorize it — maybe I used another device.', correct: false, explain: { pl: 'Jeśli nie rozpoznajesz, lepiej odrzucić i zgłosić do IT.', en: 'If unrecognized, reject and report to IT.' } },
        { pl: 'Odrzucam i zgłaszam incydent do działu IT.', en: 'Reject and report to IT.', correct: true, explain: { pl: 'Bezpieczne postępowanie — sprawdź logi i dostęp.', en: 'Safe — have IT check logs and access.' } },
        { pl: 'Ignoruję powiadomienie — pewnie błąd.', en: 'Ignore the notification — probably an error.', correct: false, explain: { pl: 'Ignorowanie może opóźnić reakcję na atak.', en: 'Ignoring may delay response to an attack.' } },
      ]
    },
    {
      id: 'q5',
      type: 'quiz',
      q: {
        pl: 'Czym jest „phishing”?',
        en: 'What is "phishing"?',
      },
      choices: [
        { pl: 'Metoda wędkowania — w sensie nie ma to związku z cyberbezpieczeństwem.', en: 'Fishing method — not related to cybersecurity.', correct: false, explain: { pl: 'Nie — to oszustwo online.', en: 'No — it is an online scam.' } },
        { pl: 'Oszustwo polegające na podszywaniu się pod zaufane podmioty, by wyłudzić informacje.', en: 'A scam impersonating trusted entities to extract information.', correct: true, explain: { pl: 'Dokładnie — e-maile i strony podszywające się.', en: 'Exactly — emails and spoofed sites.' } },
        { pl: 'Szyfrowanie wiadomości przy użyciu klucza publicznego.', en: 'Encrypting messages with a public key.', correct: false, explain: { pl: 'Nie — to inna technika.', en: 'No — different technique.' } },
      ]
    },
    {
      id: 'q6',
      type: 'quiz',
      q: {
        pl: 'Jak często warto aktualizować system i oprogramowanie?',
        en: 'How often should you update your OS and software?',
      },
      choices: [
        { pl: 'Gdy tylko pojawi się aktualizacja — jak najszybciej.', en: 'As soon as updates appear — ASAP.', correct: true, explain: { pl: 'Aktualizacje często zawierają łatki bezpieczeństwa.', en: 'Patches often fix security issues.' } },
        { pl: 'Rzadko — aktualizacje mogą zepsuć system.', en: 'Rarely — updates can break things.', correct: false, explain: { pl: 'Ryzyko pozostawienia luk bezpieczeństwa.', en: 'Risk leaving vulnerabilities.' } },
        { pl: 'Tylko raz w roku, aby zachować stabilność.', en: 'Only once a year to keep stability.', correct: false, explain: { pl: 'To za rzadko — krytyczne łaty trzeba instalować szybciej.', en: 'Too infrequent — critical patches should be applied sooner.' } },
      ]
    },
    {
      id: 'q7',
      type: 'scenario',
      q: {
        pl: 'Dostajesz wiadomość od „szefa” z prośbą: „Pilne — przelej 5000 zł na ten numer konta”. Co robisz?',
        en: 'You receive a message from "your boss": "Urgent — transfer $5000 to this account". What do you do?',
      },
      choices: [
        { pl: 'Wykonuję przelew — pilne polecenie.', en: 'Make the transfer — urgent order.', correct: false, explain: { pl: 'Atak typu business email compromise — weryfikuj osobiście.', en: 'BEC attack — verify personally.' } },
        { pl: 'Weryfikuję instrukcję telefonicznie lub w osobnym kanale.', en: 'Verify the instruction by phone or separate channel.', correct: true, explain: { pl: 'Zawsze potwierdzaj nietypowe prośby.', en: 'Always confirm unusual requests.' } },
        { pl: 'Ignoruję i kasuję wiadomość.', en: 'Ignore and delete the message.', correct: false, explain: { pl: 'Może to ważna prośba — lepiej zweryfikować.', en: 'Could be real — better verify.' } },
      ]
    },
    {
      id: 'q8',
      type: 'quiz',
      q: {
        pl: 'Co to jest dwuskładnikowe uwierzytelnianie (2FA)?',
        en: 'What is two-factor authentication (2FA)?',
      },
      choices: [
        { pl: 'Uwierzytelnianie przy użyciu hasła dwukrotnie wpisanego.', en: 'Authentication by typing password twice.', correct: false, explain: { pl: 'Nie — to nie jest 2FA.', en: 'No — that is not 2FA.' } },
        { pl: 'Dodatkowa warstwa bezpieczeństwa (np. token, SMS, aplikacja), oprócz hasła.', en: 'Extra security layer (token, SMS, app) besides password.', correct: true, explain: { pl: 'Tak — to zwiększa bezpieczeństwo.', en: 'Yes — it improves security.' } },
        { pl: 'Szyfrowanie plików przy użyciu dwóch kluczy.', en: 'Encrypting files with two keys.', correct: false, explain: { pl: 'Nie — to inna koncepcja.', en: 'No — different concept.' } },
      ]
    },
    {
      id: 'q9',
      type: 'quiz',
      q: {
        pl: 'Czy publiczne sieci Wi-Fi są bezpieczne do przesyłania poufnych danych?',
        en: 'Are public Wi-Fi networks safe for transmitting sensitive data?',
      },
      choices: [
        { pl: 'Tak, zawsze są zabezpieczone.', en: 'Yes, they are always secure.', correct: false, explain: { pl: 'Publiczne Wi-Fi często jest ryzykowne; używaj VPN.', en: 'Public Wi-Fi can be risky; use VPN.' } },
        { pl: 'Nie — lepiej używać VPN lub danych mobilnych.', en: 'No — better use VPN or mobile data.', correct: true, explain: { pl: 'VPN szyfruje ruch i chroni przed podsłuchem.', en: 'VPN encrypts traffic and protects against sniffing.' } },
        { pl: 'Tylko jeśli strona ma https.', en: 'Only if the site uses https.', correct: false, explain: { pl: 'HTTPS pomaga, ale VPN jest dalej bezpieczniejszy.', en: 'HTTPS helps, but VPN is still safer.' } },
      ]
    },
    {
      id: 'q10',
      type: 'scenario',
      q: {
        pl: 'Instalujesz nową aplikację i widzisz prośbę o szerokie uprawnienia (SMS, kontakty). Co robisz?',
        en: 'Installing a new app and it requests broad permissions (SMS, contacts). What do you do?',
      },
      choices: [
        { pl: 'Zgadzam się — szybciej działa aplikacja.', en: 'Agree — makes app work faster.', correct: false, explain: { pl: 'Nadmiar uprawnień zwiększa ryzyko nadużyć.', en: 'Excess permissions increase abuse risk.' } },
        { pl: 'Sprawdzam, czy uprawnienia są potrzebne; odrzucam zbędne.', en: 'Check if permissions are necessary; deny unnecessary ones.', correct: true, explain: { pl: 'Zasada najmniejszych uprawnień — pozwalaj tylko na to, co potrzebne.', en: 'Principle of least privilege.' } },
        { pl: 'Instaluję i od razu usuwam, gdy działa.', en: 'Install then uninstall once it runs.', correct: false, explain: { pl: 'Nadal ryzykujesz: aplikacja może wykonać złośliwe akcje.', en: 'You still risk malicious actions.' } },
      ]
    },
  ];

  // --- State per session
  let session = {
    pool: [], // selected questions
    index: 0, // 0-based
    score: 0,
    usedIds: new Set(),
  };

  // --- Load & Save (top score & lang)
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { topScore: 0, lang: 'pl' };
    } catch (e) {
      return { topScore: 0, lang: 'pl' };
    }
  }

  function saveTopScore(score) {
    const st = loadState();
    if (!st.topScore || score > st.topScore) st.topScore = score;
    st.lang = LANG;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(st));
  }

  function getTopScore() {
    const st = loadState();
    return st.topScore || 0;
  }

  // --- Utility functions
  function randShuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function applyLangToUI() {
    const t = T[LANG];
    $('#toggleLang').textContent = t.toggleTo;
    // start screen
    $('#screen-start h2').textContent = t.startTitle;
    $('#screen-start p').textContent = t.startDesc;
    $('#startBtn').textContent = t.startBtn;
    $('#againBtn').textContent = t.playAgain;
  }

  // --- Game flow
  function startGame() {
    // prepare session: pick random questions
    const pool = randShuffle(BANK).slice(0, TOTAL_QUESTIONS);
    session.pool = pool;
    session.index = 0;
    session.score = 0;
    session.usedIds = new Set();
    // switch screens
    screenStart.hidden = true;
    screenResult.hidden = true;
    screenGame.hidden = false;
    renderCurrent();
    updateScoreUI();
  }

  function renderCurrent() {
    const curIdx = session.index;
    const n = session.pool.length;
    if (curIdx >= n) {
      endGame();
      return;
    }
    const qObj = session.pool[curIdx];
    // question text
    questionTextEl.textContent = qObj.q[LANG];
    // render choices
    answersEl.innerHTML = '';
    const choices = qObj.choices.map((c, i) => ({ ...c, idx: i }));
    // shuffle choices display to avoid position bias
    const dispChoices = randShuffle(choices);
    dispChoices.forEach((choice) => {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.style.justifyContent = 'flex-start';
      btn.style.borderColor = 'rgba(255,255,255,0.06)';
      btn.textContent = choice[LANG];
      btn.dataset.idx = choice.idx;
      btn.onclick = () => handleAnswer(choice.idx);
      answersEl.appendChild(btn);
    });
    // counter & score
    questionCounterEl.textContent = T[LANG].questionOf(curIdx + 1, n);
    updateScoreUI();
  }

  function updateScoreUI() {
    scoreDisplayEl.textContent = `${T[LANG].score}: ${session.score} • ${T[LANG].topScore}: ${getTopScore()}`;
  }

  function handleAnswer(choiceIdx) {
    const cur = session.pool[session.index];
    // prevent double-clicks
    if (!cur) return;
    // mark buttons disabled
    [...answersEl.children].forEach(b => b.disabled = true);
    const chosen = cur.choices[choiceIdx];
    const correctChoice = cur.choices.find(c => c.correct);
    // find button elements to style
    [...answersEl.children].forEach(btn => {
      const idx = Number(btn.dataset.idx);
      const opt = cur.choices[idx];
      if (opt.correct) {
        btn.style.borderColor = 'rgba(110,231,183,0.9)';
        btn.style.color = 'var(--accent)';
        btn.style.boxShadow = '0 0 12px rgba(110,231,183,0.12)';
      }
      if (idx === choiceIdx && !opt.correct) {
        btn.style.borderColor = 'rgba(255,107,107,0.9)';
        btn.style.color = '#ff6b6b';
        btn.style.opacity = '0.95';
      }
    });

    // scoring and message
    let message = '';
    if (chosen && chosen.correct) {
      session.score += POINTS_CORRECT;
      message = T[LANG].correct;
    } else {
      message = T[LANG].wrong;
    }

    // show short explanation below question
    const expl = chosen && chosen.explain ? (chosen.explain[LANG] || '') : (cur.explain ? cur.explain[LANG] : '');
    const note = document.createElement('div');
    note.style.marginTop = '10px';
    note.style.color = 'var(--muted)';
    note.style.fontSize = '13px';
    note.textContent = (expl ? expl + ' ' : '') + `(${message})`;
    answersEl.appendChild(note);

    // small flash then next
    setTimeout(() => {
      session.index++;
      renderCurrent();
      // re-enable (buttons recreated in render)
    }, FLASH_TIME + 200);

    // update top score if necessary at end
    if (session.index + 1 > session.pool.length) {
      // will be handled in endGame
    }

    updateScoreUI();
  }

  function endGame() {
    // show result screen
    screenGame.hidden = true;
    screenResult.hidden = false;
    const sc = session.score;
    resultTitleEl.textContent = T[LANG].resultTitle(sc);
    // message depending on score
    const maxPossible = TOTAL_QUESTIONS * POINTS_CORRECT;
    const pct = sc / maxPossible;
    if (pct >= 0.8) resultDescEl.textContent = T[LANG].resultGood;
    else if (pct >= 0.45) resultDescEl.textContent = T[LANG].resultMid;
    else resultDescEl.textContent = T[LANG].resultLow;

    // save top
    saveTopScore(sc);
    // show top in footer of result
    const top = getTopScore();
    const topLine = document.createElement('div');
    topLine.style.marginTop = '10px';
    topLine.style.color = 'var(--muted)';
    topLine.textContent = `${T[LANG].topScore}: ${top} pts`;
    resultDescEl.parentNode.appendChild(topLine);
  }

  // --- Events
  startBtn.addEventListener('click', () => {
    startGame();
  });

  againBtn.addEventListener('click', () => {
    // cleanup potential appended topLine
    const parent = resultDescEl.parentNode;
    const appended = parent.querySelectorAll('div');
    appended.forEach(div => {
      if (div.textContent.startsWith(T[LANG].topScore)) div.remove();
    });
    startGame();
  });

  toggleLangBtn.addEventListener('click', () => {
    LANG = LANG === 'pl' ? 'en' : 'pl';
    // persist lang
    const st = loadState();
    st.lang = LANG;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(st));
    applyLangToUI();
    // update live texts
    updateScoreUI();
    // update question text if visible
    if (!screenStart.hidden && screenGame.hidden && screenResult.hidden) {
      // start screen
      applyLangToUI();
    } else if (!screenGame.hidden) {
      renderCurrent();
      applyLangToUI();
    } else if (!screenResult.hidden) {
      // update result texts
      resultTitleEl.textContent = T[LANG].resultTitle(session.score || 0);
      applyLangToUI();
    } else {
      applyLangToUI();
    }
  });

  // initial setup
  function boot() {
    // set language toggle label
    applyLangToUI();
    // ensure score show top
    updateScoreUI();
    // ensure screens initial state
    screenStart.hidden = false;
    screenGame.hidden = true;
    screenResult.hidden = true;
    // small keyboard support: Enter starts, number keys pick answers
    document.addEventListener('keydown', (e) => {
      if (!screenGame.hidden) {
        if (e.key >= '1' && e.key <= '9') {
          const index = Number(e.key) - 1;
          const btn = answersEl.children[index];
          if (btn && btn.tagName === 'BUTTON') btn.click();
        }
      }
      if (!screenStart.hidden && (e.key === 'Enter')) startBtn.click();
    });
  }

  boot();

})();
