/**
 * ClustrCore Floating Chatbot Widget v2
 * Now with backend Q&A — unanswered questions go to team leads!
 *
 * Usage: <script src="clustrcore-chatbot.js"></script>
 */
(() => {
  const API = (window.CLUSTR_CHATBOT?.apiBase) || 'http://localhost:5000/api';
  const POLL_INTERVAL = 12000; // check for answers every 12s

  /* ── FAQ DATA ─────────────────────────────────────────── */
  const FAQS = [
    { k: ['join','membership','become member','sign up','register','how to join','enroll'],
      a: '🎉 To join ClustrCore, fill out the registration form on our website! Membership is open to all students — you\'ll get access to events, workshops, certificates, and exclusive resources.' },
    { k: ['next event','upcoming event','when is event','event date','events','what events'],
      a: '📅 Check our Events page for upcoming workshops, hackathons, and seminars. New events are posted regularly!' },
    { k: ['meeting','when meet','club meeting','meet time','where meet'],
      a: '📍 Club meetings happen weekly. Check our Announcements section for exact timing and venue!' },
    { k: ['contact','email','phone','reach','get in touch','call','whatsapp'],
      a: '📬 Reach us at:\n• Email: clustrcore@college.edu\n• Instagram: @clustrcore\n• Or just ask me — I\'ll forward to our team!' },
    { k: ['certificate','certificates','cert','participation certificate'],
      a: '🏆 Certificates are issued to all registered participants after the event. Check your email, or ask the Digital Team!' },
    { k: ['fee','cost','price','payment','how much','charges','free'],
      a: '💰 Most ClustrCore events are free for registered members! Some special workshops may have a small fee. Check the specific event page.' },
    { k: ['benefit','advantage','why join','perks','what do i get','features'],
      a: '✨ ClustrCore members get:\n• Free access to workshops & events\n• Participation certificates\n• Networking opportunities\n• Skill development sessions\n• Exclusive resources & materials' },
    { k: ['team','teams','technical','events team','digital','who runs'],
      a: '👥 ClustrCore has 3 teams:\n• 🔵 Technical — Dev, code, tech sessions\n• 🟠 Events — Workshops, hackathons, planning\n• 🟣 Digital — Design, social media, outreach' },
    { k: ['portal','login','dashboard','team login','sign in'],
      a: '🔐 Team members access their dashboard via the Team Portal. Select your team → pick your name → OTP verification → dashboard!' },
    { k: ['registration','register for event','how to register','event registration'],
      a: '📝 Visit our website, click on any event, fill in your details — done! You\'ll receive a confirmation email.' },
    { k: ['hi','hello','hey','hola','namaste','sup','howdy','good morning','good evening'],
      a: '👋 Hey there! I\'m ClustrCore\'s AI assistant.\n\nAsk me about events, membership, teams, or certificates. For anything else, I\'ll forward your question to our team leads!' },
    { k: ['thank','thanks','thank you','thx','ty'],
      a: '😊 You\'re welcome! Feel free to ask anything else.' },
    { k: ['bye','goodbye','see you','later','cya'],
      a: '👋 See you around! Stay curious 🚀' },
  ];

  function checkFAQ(q) {
    const lq = q.toLowerCase();
    for (const f of FAQS) if (f.k.some(k => lq.includes(k))) return f.a;
    return null;
  }

  /* ── LOCAL STORAGE ────────────────────────────────────── */
  const LS_MSGS    = 'clustr_chat_v3';
  const LS_PENDING = 'clustr_pending_ids'; // { questionId, text, asked }[]

  function getMsgs()    { try { return JSON.parse(localStorage.getItem(LS_MSGS)    || '[]'); } catch { return []; } }
  function saveMsgs(m)  { try { localStorage.setItem(LS_MSGS, JSON.stringify(m.slice(-80))); } catch {} }
  function getPending() { try { return JSON.parse(localStorage.getItem(LS_PENDING) || '[]'); } catch { return []; } }
  function savePending(p){ try { localStorage.setItem(LS_PENDING, JSON.stringify(p)); } catch {} }

  /* ── STYLES ───────────────────────────────────────────── */
  const S = document.createElement('style');
  S.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');

    #cc-fab{position:fixed;bottom:1.75rem;right:1.75rem;z-index:10000;display:flex;flex-direction:column;align-items:flex-end;gap:.75rem;font-family:'DM Sans',sans-serif}

    #cc-fab-btn{width:58px;height:58px;border-radius:18px;background:linear-gradient(135deg,#8b5cf6 0%,#6366f1 50%,#3b82f6 100%);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 32px rgba(139,92,246,.45),0 2px 8px rgba(0,0,0,.2);transition:transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .25s ease;position:relative;overflow:hidden}
    #cc-fab-btn::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.18) 0%,transparent 60%);border-radius:inherit}
    #cc-fab-btn:hover{transform:scale(1.1) translateY(-2px);box-shadow:0 16px 48px rgba(139,92,246,.55),0 4px 12px rgba(0,0,0,.25)}
    #cc-fab-btn svg{position:relative;z-index:1;transition:all .3s ease}

    #cc-badge{position:absolute;top:-5px;right:-5px;width:20px;height:20px;background:#f43f5e;border-radius:50%;border:2.5px solid #0a0910;font-size:.62rem;font-weight:700;color:white;display:flex;align-items:center;justify-content:center;opacity:0;transform:scale(0);transition:all .3s cubic-bezier(.34,1.56,.64,1)}
    #cc-badge.show{opacity:1;transform:scale(1)}

    #cc-win{width:370px;height:540px;background:#0f0e13;border-radius:24px;border:1px solid rgba(139,92,246,.25);box-shadow:0 32px 80px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.04);display:flex;flex-direction:column;overflow:hidden;transform:scale(.85) translateY(20px);transform-origin:bottom right;opacity:0;pointer-events:none;transition:all .35s cubic-bezier(.34,1.56,.64,1)}
    #cc-win.open{transform:scale(1) translateY(0);opacity:1;pointer-events:all}

    .cc-hdr{padding:1rem 1.125rem;background:linear-gradient(135deg,#1a1628 0%,#16121f 100%);border-bottom:1px solid rgba(139,92,246,.15);display:flex;align-items:center;gap:.75rem;flex-shrink:0}
    .cc-hdr-av{width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,#8b5cf6,#6366f1);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(139,92,246,.4)}
    .cc-hdr-name{font-family:'Syne',sans-serif;font-size:.88rem;font-weight:700;color:#f4f0ff;letter-spacing:-.01em;line-height:1.2}
    .cc-hdr-status{font-size:.68rem;color:#a78bfa;display:flex;align-items:center;gap:.3rem;margin-top:1px}
    .cc-dot-green{width:6px;height:6px;border-radius:50%;background:#4ade80;animation:cc-pulse 2s infinite}
    @keyframes cc-pulse{0%,100%{opacity:1}50%{opacity:.4}}
    .cc-x{width:28px;height:28px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#a1a1aa;transition:all .2s;margin-left:auto}
    .cc-x:hover{background:rgba(255,255,255,.12);color:#f4f4f5}

    .cc-msgs{flex:1;overflow-y:auto;padding:.875rem;display:flex;flex-direction:column;gap:.625rem;background:#0f0e13}
    .cc-msgs::-webkit-scrollbar{width:3px}
    .cc-msgs::-webkit-scrollbar-thumb{background:rgba(139,92,246,.3);border-radius:2px}

    .cc-m{display:flex;gap:.5rem;align-items:flex-end;animation:cc-in .3s ease both}
    @keyframes cc-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    .cc-m.user{flex-direction:row-reverse}
    .cc-av{width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:.75rem;flex-shrink:0}
    .cc-m.bot .cc-av{background:linear-gradient(135deg,#8b5cf6,#6366f1)}
    .cc-m.user .cc-av{background:linear-gradient(135deg,#3b82f6,#2563eb)}
    .cc-m.team .cc-av{background:linear-gradient(135deg,#f59e0b,#f97316)}

    .cc-body{max-width:80%;display:flex;flex-direction:column;gap:.2rem}
    .cc-m.user .cc-body{align-items:flex-end}
    .cc-bub{padding:.6rem .875rem;border-radius:14px;font-size:.82rem;line-height:1.55;white-space:pre-line;word-break:break-word}
    .cc-m.bot .cc-bub{background:#1c1a2e;color:#e4e0f0;border:1px solid rgba(139,92,246,.15);border-bottom-left-radius:4px}
    .cc-m.user .cc-bub{background:linear-gradient(135deg,#8b5cf6,#6366f1);color:#fff;border-bottom-right-radius:4px;box-shadow:0 4px 12px rgba(139,92,246,.3)}
    .cc-m.team .cc-bub{background:linear-gradient(135deg,#1e1508,#231a09);border:1px solid rgba(245,158,11,.25);color:#fde68a;border-bottom-left-radius:4px}
    .cc-answerer{font-size:.62rem;color:#f59e0b;margin-top:.15rem}
    .cc-time{font-size:.62rem;color:#3f3f46;padding:0 .25rem}

    /* pending pill */
    .cc-pending-pill{display:inline-flex;align-items:center;gap:.4rem;background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.25);border-radius:100px;padding:.3rem .75rem;font-size:.72rem;color:#f59e0b;margin:.25rem 0;animation:cc-spin-border 2s linear infinite}
    .cc-pending-dot{width:6px;height:6px;border-radius:50%;background:#f59e0b;animation:cc-pulse 1s infinite}

    /* typing */
    .cc-typing .cc-bub{display:flex;align-items:center;gap:.3rem;padding:.7rem 1rem}
    .cc-d{width:6px;height:6px;border-radius:50%;background:#7c3aed;animation:cc-b .9s infinite}
    .cc-d:nth-child(2){animation-delay:.15s}
    .cc-d:nth-child(3){animation-delay:.3s}
    @keyframes cc-b{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}

    /* quick replies */
    .cc-qr{display:flex;flex-wrap:wrap;gap:.4rem;padding:.5rem .875rem 0;flex-shrink:0}
    .cc-qr-btn{padding:.35rem .75rem;border:1px solid rgba(139,92,246,.35);border-radius:100px;background:rgba(139,92,246,.08);color:#a78bfa;font-family:'DM Sans',sans-serif;font-size:.72rem;font-weight:500;cursor:pointer;transition:all .2s;white-space:nowrap}
    .cc-qr-btn:hover{background:rgba(139,92,246,.2);color:#c4b5fd}

    /* name input */
    .cc-name-row{padding:.625rem .875rem;background:#16131f;border-top:1px solid rgba(139,92,246,.1);display:flex;gap:.5rem;align-items:center;flex-shrink:0}
    .cc-name-input{flex:1;background:#1c1a2e;border:1px solid rgba(245,158,11,.25);border-radius:10px;padding:.5rem .75rem;font-family:'DM Sans',sans-serif;font-size:.78rem;color:#fde68a;outline:none}
    .cc-name-input::placeholder{color:#78716c}
    .cc-name-input:focus{border-color:rgba(245,158,11,.5)}
    .cc-name-save{background:rgba(245,158,11,.15);border:1px solid rgba(245,158,11,.3);color:#f59e0b;border-radius:8px;padding:.5rem .875rem;font-size:.75rem;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s}
    .cc-name-save:hover{background:rgba(245,158,11,.25)}

    /* input row */
    .cc-inp-row{padding:.75rem;background:#16131f;border-top:1px solid rgba(139,92,246,.12);display:flex;gap:.5rem;align-items:center;flex-shrink:0}
    .cc-inp{flex:1;background:#1c1a2e;border:1px solid rgba(139,92,246,.2);border-radius:12px;padding:.6rem .875rem;font-family:'DM Sans',sans-serif;font-size:.82rem;color:#f4f0ff;outline:none;transition:border-color .2s}
    .cc-inp::placeholder{color:#52525b}
    .cc-inp:focus{border-color:rgba(139,92,246,.5);box-shadow:0 0 0 3px rgba(139,92,246,.08)}
    .cc-send{width:36px;height:36px;background:linear-gradient(135deg,#8b5cf6,#6366f1);border:none;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s cubic-bezier(.34,1.56,.64,1);box-shadow:0 4px 12px rgba(139,92,246,.35);flex-shrink:0}
    .cc-send:hover{transform:scale(1.1)}
    .cc-send:disabled{opacity:.4;cursor:not-allowed;transform:none}

    .cc-foot{text-align:center;font-size:.6rem;color:#3f3f46;padding:.4rem;background:#16131f;letter-spacing:.04em}
    .cc-foot span{color:#52525b}

    @media(max-width:420px){#cc-win{width:calc(100vw - 2rem)}}
  `;
  document.head.appendChild(S);

  /* ── HTML ─────────────────────────────────────────────── */
  const wrap = document.createElement('div');
  wrap.id = 'cc-fab';
  wrap.innerHTML = `
    <div id="cc-win">
      <div class="cc-hdr">
        <div class="cc-hdr-av">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
          </svg>
        </div>
        <div style="flex:1">
          <div class="cc-hdr-name">ClustrCore Assistant</div>
          <div class="cc-hdr-status"><span class="cc-dot-green"></span> Online · Team leads available</div>
        </div>
        <button class="cc-x" id="cc-x">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div class="cc-msgs" id="cc-msgs"></div>

      <div class="cc-qr" id="cc-qr">
        <button class="cc-qr-btn" onclick="window._cc('How do I join ClustrCore?')">How to join?</button>
        <button class="cc-qr-btn" onclick="window._cc('What events are upcoming?')">Events</button>
        <button class="cc-qr-btn" onclick="window._cc('Tell me about the teams')">Teams</button>
        <button class="cc-qr-btn" onclick="window._cc('How to get certificates?')">Certificates</button>
      </div>

      <div class="cc-name-row" id="cc-name-row" style="display:none">
        <input class="cc-name-input" id="cc-name-inp" placeholder="Your name (so team can address you)" maxlength="40">
        <button class="cc-name-save" id="cc-name-save">Save</button>
      </div>

      <div class="cc-inp-row">
        <input class="cc-inp" id="cc-inp" placeholder="Ask anything about ClustrCore…" autocomplete="off" maxlength="400">
        <button class="cc-send" id="cc-send">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
        </button>
      </div>
      <div class="cc-foot">Powered by <span>ClustrCore</span> · Team responds within 24h</div>
    </div>

    <button id="cc-fab-btn">
      <svg id="cc-icon-chat" width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
      </svg>
      <svg id="cc-icon-x" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.5" style="display:none">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
      </svg>
      <div id="cc-badge"></div>
    </button>
  `;
  document.body.appendChild(wrap);

  /* ── REFS ─────────────────────────────────────────────── */
  const win      = document.getElementById('cc-win');
  const msgsEl   = document.getElementById('cc-msgs');
  const inpEl    = document.getElementById('cc-inp');
  const sendBtn  = document.getElementById('cc-send');
  const badge    = document.getElementById('cc-badge');
  const qrEl     = document.getElementById('cc-qr');
  const nameRow  = document.getElementById('cc-name-row');
  const nameInp  = document.getElementById('cc-name-inp');
  const nameSave = document.getElementById('cc-name-save');

  /* ── STATE ────────────────────────────────────────────── */
  let isOpen  = false;
  let unread  = 0;
  let studentName = localStorage.getItem('cc_name') || '';
  let studentId   = localStorage.getItem('cc_sid')  || ('s_' + Math.random().toString(36).slice(2,10));
  localStorage.setItem('cc_sid', studentId);

  /* ── TOGGLE ───────────────────────────────────────────── */
  function toggle() {
    isOpen = !isOpen;
    win.classList.toggle('open', isOpen);
    document.getElementById('cc-icon-chat').style.display = isOpen ? 'none'  : 'block';
    document.getElementById('cc-icon-x').style.display   = isOpen ? 'block' : 'none';
    if (isOpen) { clearBadge(); inpEl.focus(); scrollBot(); }
  }
  document.getElementById('cc-fab-btn').addEventListener('click', toggle);
  document.getElementById('cc-x').addEventListener('click', toggle);

  function clearBadge() { unread = 0; badge.textContent = ''; badge.classList.remove('show'); }
  function incBadge()   { if (isOpen) return; unread++; badge.textContent = unread > 9 ? '9+' : unread; badge.classList.add('show'); }
  function scrollBot()  { requestAnimationFrame(() => { msgsEl.scrollTop = msgsEl.scrollHeight; }); }

  /* ── ADD MESSAGE ──────────────────────────────────────── */
  function addMsg(text, sender, extra = {}, save = true) {
    const div  = document.createElement('div');
    div.className = `cc-m ${sender}`;
    const time = new Date().toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit',hour12:true});
    const icon = sender === 'user' ? '↑' : sender === 'team' ? '★' : '✦';
    const answererLine = extra.answeredBy
      ? `<div class="cc-answerer">— ${extra.answeredBy}, ClustrCore Team</div>` : '';

    div.innerHTML = `
      <div class="cc-av">${icon}</div>
      <div class="cc-body">
        <div class="cc-bub">${text.replace(/</g,'&lt;').replace(/\n/g,'<br>')}</div>
        ${answererLine}
        <div class="cc-time">${time}</div>
      </div>`;

    msgsEl.appendChild(div);
    scrollBot();

    if (save) {
      const h = getMsgs();
      h.push({ text, sender, answeredBy: extra.answeredBy||null, ts: new Date().toISOString() });
      saveMsgs(h);
    }
    if (!isOpen && (sender === 'bot' || sender === 'team')) incBadge();
    if (sender === 'user' && qrEl) qrEl.style.display = 'none';
  }

  /* ── PENDING PILL ─────────────────────────────────────── */
  function addPendingPill(questionId, questionText) {
    const div = document.createElement('div');
    div.className = 'cc-m bot';
    div.id = `cc-pill-${questionId}`;
    div.innerHTML = `
      <div class="cc-av">✦</div>
      <div class="cc-body">
        <div class="cc-pending-pill">
          <span class="cc-pending-dot"></span>
          Forwarded to team leads · waiting for reply…
        </div>
        <div class="cc-time">${new Date().toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit',hour12:true})}</div>
      </div>`;
    msgsEl.appendChild(div);
    scrollBot();
  }

  function removePendingPill(questionId) {
    const el = document.getElementById(`cc-pill-${questionId}`);
    if (el) el.remove();
  }

  /* ── TYPING ───────────────────────────────────────────── */
  function showTyping() {
    const d = document.createElement('div');
    d.className = 'cc-m bot cc-typing'; d.id = 'cc-typing';
    d.innerHTML = `<div class="cc-av">✦</div><div class="cc-body"><div class="cc-bub"><div class="cc-d"></div><div class="cc-d"></div><div class="cc-d"></div></div></div>`;
    msgsEl.appendChild(d); scrollBot();
  }
  function hideTyping() { document.getElementById('cc-typing')?.remove(); }

  /* ── SEND FLOW ────────────────────────────────────────── */
  async function handleSend() {
    const text = inpEl.value.trim();
    if (!text) return;
    inpEl.value = '';
    sendBtn.disabled = true;

    addMsg(text, 'user');
    showTyping();
    await new Promise(r => setTimeout(r, 800 + Math.random() * 500));
    hideTyping();

    const faqAns = checkFAQ(text);
    if (faqAns) {
      addMsg(faqAns, 'bot');
    } else {
      // Ask for name if not set
      if (!studentName) {
        nameRow.style.display = 'flex';
        addMsg(
          "🤔 Great question! I'm forwarding this to our team leads — they'll answer you here.\n\nOptionally, share your name so they can address you personally 👇",
          'bot'
        );
      } else {
        addMsg(
          `🤔 Forwarding your question to ClustrCore team leads. You'll see their reply right here once they respond!`,
          'bot'
        );
      }

      // POST to backend
      try {
        const res  = await fetch(`${API}/chatbot/question`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ question: text, studentId, studentName: studentName || 'Student' }),
        });
        const data = await res.json();
        if (data.questionId) {
          // Track this pending question
          const pending = getPending();
          pending.push({ questionId: data.questionId, text, asked: new Date().toISOString() });
          savePending(pending);
          addPendingPill(data.questionId, text);
        }
      } catch {
        addMsg("⚠️ Couldn't reach the server right now. Please try again shortly.", 'bot');
      }
    }

    sendBtn.disabled = false;
    inpEl.focus();
  }

  /* ── SAVE NAME ────────────────────────────────────────── */
  nameSave.addEventListener('click', () => {
    const n = nameInp.value.trim();
    if (!n) return;
    studentName = n;
    localStorage.setItem('cc_name', n);
    nameRow.style.display = 'none';
    addMsg(`Got it! Your name is saved as "${n}" 👍`, 'bot');
  });

  /* ── POLL FOR ANSWERS ─────────────────────────────────── */
  async function pollAnswers() {
    const pending = getPending();
    if (!pending.length) return;

    try {
      const res  = await fetch(`${API}/chatbot/answers/bulk`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ questionIds: pending.map(p => p.questionId) }),
      });
      const answered = await res.json();

      if (!answered.length) return;

      // Remove answered from pending list
      const answeredIds = answered.map(a => a.questionId.toString());
      savePending(pending.filter(p => !answeredIds.includes(p.questionId.toString())));

      // Show answers in chat
      for (const a of answered) {
        removePendingPill(a.questionId);
        addMsg(
          `💬 ${a.answer}`,
          'team',
          { answeredBy: a.answeredBy || 'ClustrCore Team' }
        );
      }
    } catch {}
  }

  setInterval(pollAnswers, POLL_INTERVAL);

  /* ── GLOBAL HELPER ────────────────────────────────────── */
  window._cc = (msg) => {
    if (!isOpen) toggle();
    setTimeout(() => { inpEl.value = msg; handleSend(); }, 150);
  };

  sendBtn.addEventListener('click', handleSend);
  inpEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  });

  /* ── LOAD HISTORY ─────────────────────────────────────── */
  function loadHistory() {
    const h = getMsgs();
    if (!h.length) {
      setTimeout(() => addMsg(
        "👋 Hi! I'm ClustrCore's AI assistant.\n\nAsk about events, membership, teams, or certificates.\n\nFor anything else, I'll forward your question directly to our team leads! ✨",
        'bot'
      ), 400);
    } else {
      h.slice(-25).forEach(m => addMsg(m.text, m.sender, { answeredBy: m.answeredBy }, false));
      // Re-add pending pills for unanswered
      getPending().forEach(p => addPendingPill(p.questionId, p.text));
    }
  }

  loadHistory();

  // Proactive badge on first visit after 3s
  if (!localStorage.getItem('cc_seen')) {
    setTimeout(() => {
      if (!isOpen) { incBadge(); localStorage.setItem('cc_seen','1'); }
    }, 3000);
  }

  // Poll immediately on load too
  setTimeout(pollAnswers, 2000);
})();