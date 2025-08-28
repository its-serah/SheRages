/* SheRages app logic */
(function() {
  'use strict';

  // Storage helpers
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
    },
    set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
    remove(key) { localStorage.removeItem(key); }
  };

  // Constants
  const KEYS = {
    posts: 'sheRages_posts',
    topics: 'sheRages_topics',
    game: 'sheRages_game',
    symptoms: 'sheRages_symptoms'
  };

  const DEFAULT_TOPICS = [
    'Advocacy','Diagnosis','Cardio','Pain','Mental Health','Medication','Reproductive Health','Research','Insurance','Support'
  ];

  // State
  const state = {
    view: 'home',
    posts: store.get(KEYS.posts, []),
    topics: store.get(KEYS.topics, DEFAULT_TOPICS),
    game: store.get(KEYS.game, { 
      score: 0, 
      xp: 0, 
      level: 1, 
      streak: 0, 
      lastPlayDate: null,
      played: [], 
      badges: [],
      reminders: { freq: 'none', nextAt: 0, notifs: 'default' } 
    }),
    symptoms: store.get(KEYS.symptoms, [])
  };

  // Elements
  const els = {
    views: document.querySelectorAll('.view'),
    navLinks: document.querySelectorAll('[data-nav]'),
    resetAllBtn: document.getElementById('resetAllBtn'),

    // Community
    postForm: document.getElementById('postForm'),
    postText: document.getElementById('postText'),
    postTopic: document.getElementById('postTopic'),
    customTopicRow: document.getElementById('customTopicRow'),
    customTopic: document.getElementById('customTopic'),
    postLocation: document.getElementById('postLocation'),
    topicFilters: document.getElementById('topicFilters'),
    feed: document.getElementById('feed'),

    // Simulator
    scoreValue: document.getElementById('scoreValue'),
    startSimBtn: document.getElementById('startSimBtn'),
    nextSimBtn: document.getElementById('nextSimBtn'),
    resetGameBtn: document.getElementById('resetGameBtn'),
    scenarioText: document.getElementById('scenarioText'),
    choices: document.getElementById('choices'),
    feedback: document.getElementById('feedback'),
    enableNotifsBtn: document.getElementById('enableNotifsBtn'),
    reminderFreq: document.getElementById('reminderFreq'),
    saveReminderBtn: document.getElementById('saveReminderBtn'),
    downloadIcsBtn: document.getElementById('downloadIcsBtn'),
    reminderStatus: document.getElementById('reminderStatus'),
    dueReminder: document.getElementById('dueReminder'),
    snoozeBtn: document.getElementById('snoozeBtn'),

    // Symptoms
    symForm: document.getElementById('symForm'),
    symDate: document.getElementById('symDate'),
    symName: document.getElementById('symName'),
    symSeverity: document.getElementById('symSeverity'),
    symHeartRate: document.getElementById('symHeartRate'),
    symBpSys: document.getElementById('symBpSys'),
    symBpDia: document.getElementById('symBpDia'),
    symNotes: document.getElementById('symNotes'),
    fromDate: document.getElementById('fromDate'),
    toDate: document.getElementById('toDate'),
    applySymFilterBtn: document.getElementById('applySymFilterBtn'),
    exportCsvBtn: document.getElementById('exportCsvBtn'),
    symList: document.getElementById('symList')
  };

  // Utilities
  function nowTs() { return Date.now(); }
  function byNewest(a, b) { return b.ts - a.ts; }
  function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  function fmtDate(ts) { const d = new Date(ts); return d.toLocaleString(); }

  // Router
  function setActiveNav(hash) {
    els.navLinks.forEach(a => {
      const target = a.getAttribute('href');
      if (target === hash) a.classList.add('active'); else a.classList.remove('active');
    });
  }
  function showView(name) {
    state.view = name;
    els.views.forEach(v => v.classList.toggle('active', v.id === name));
    setActiveNav('#' + name);
    if (name === 'community') renderFeed();
    if (name === 'simulator') renderGameUI();
    if (name === 'symptoms') renderSymptoms();
  }
  function onHashChange() {
    const name = (location.hash || '#home').slice(1);
    const valid = ['home','community','simulator','symptoms'];
    showView(valid.includes(name) ? name : 'home');
  }

  // Initialize topics select and filters
  function initTopicsUI() {
    // Post topic dropdown: topics + "Add new…"
    els.postTopic.innerHTML = '';
    state.topics.forEach(t => {
      const opt = document.createElement('option'); opt.value = t; opt.textContent = t; els.postTopic.appendChild(opt);
    });
    const add = document.createElement('option'); add.value = '__add__'; add.textContent = 'Add new topic…'; els.postTopic.appendChild(add);

    // Topic filters as checkboxes
    els.topicFilters.innerHTML = '<legend>Topics</legend>';
    state.topics.forEach(t => {
      const id = 'tf_' + t.replace(/\s+/g,'_');
      const label = document.createElement('label');
      label.innerHTML = `<input type="checkbox" name="topic" value="${escapeHtml(t)}" checked> ${escapeHtml(t)}`;
      els.topicFilters.appendChild(label);
    });
  }

  // Community logic
  function renderFeed() {
    // Collect filters
    const locChecks = Array.from(document.querySelectorAll('input[name="loc"]:checked')).map(x => x.value);
    const topicChecks = Array.from(els.topicFilters.querySelectorAll('input[name="topic"]:checked')).map(x => x.value);

    const posts = state.posts
      .slice()
      .sort(byNewest)
      .filter(p => locChecks.includes(p.location) && topicChecks.includes(p.topic));

    if (posts.length === 0) {
      els.feed.innerHTML = '<div class="note">No posts yet that match these filters.</div>';
      return;
    }

    els.feed.innerHTML = posts.map(p => {
      const meta = `${escapeHtml(p.location)} • ${escapeHtml(p.topic)} • ${fmtDate(p.ts)}`;
      return `<article class="post" data-id="${p.id}">
        <div class="meta">${meta}</div>
        <div class="body">${escapeHtml(p.text)}</div>
      </article>`;
    }).join('');
  }

  function addPost(text, topic, location) {
    const post = { id: uid(), text, topic, location, ts: nowTs() };
    state.posts.push(post); store.set(KEYS.posts, state.posts);
    renderFeed();
  }

  function onPostTopicChange() {
    const v = els.postTopic.value;
    els.customTopicRow.classList.toggle('hidden', v !== '__add__');
  }

  function ensureTopic(topic) {
    if (!state.topics.includes(topic)) {
      state.topics.push(topic); store.set(KEYS.topics, state.topics);
      initTopicsUI();
    }
  }

  // Gamification system
  const BADGES = [
    { id: 'first_steps', name: 'First Steps', desc: 'Complete your first scenario', icon: '👶', requirement: 'scenarios', count: 1 },
    { id: 'getting_stronger', name: 'Getting Stronger', desc: 'Complete 5 scenarios', icon: '💪', requirement: 'scenarios', count: 5 },
    { id: 'advocate', name: 'Advocate', desc: 'Score 20+ points', icon: '⚡', requirement: 'score', count: 20 },
    { id: 'unstoppable', name: 'Unstoppable', desc: 'Get a 3-day streak', icon: '🔥', requirement: 'streak', count: 3 },
    { id: 'warrior', name: 'Warrior', desc: 'Reach level 5', icon: '⚔️', requirement: 'level', count: 5 },
    { id: 'perfectionist', name: 'Perfectionist', desc: 'Get 5 perfect scores in a row', icon: '✨', requirement: 'perfect_streak', count: 5 },
    { id: 'dedicated', name: 'Dedicated', desc: 'Practice for 7 days', icon: '🎯', requirement: 'total_days', count: 7 },
    { id: 'master', name: 'Master', desc: 'Complete all scenarios', icon: '👑', requirement: 'all_scenarios', count: 6 }
  ];

  function getXPForLevel(level) { return level * 100; }
  function getLevelFromXP(xp) { return Math.floor(xp / 100) + 1; }
  function getXPToNextLevel(xp) { const level = getLevelFromXP(xp); return getXPForLevel(level) - (xp % 100); }

  function checkStreak() {
    const today = new Date().toDateString();
    const lastPlay = state.game.lastPlayDate;
    if (!lastPlay) return 0;
    
    const lastPlayDate = new Date(lastPlay).toDateString();
    const yesterday = new Date(Date.now() - 24*60*60*1000).toDateString();
    
    if (lastPlayDate === today) return state.game.streak || 0;
    if (lastPlayDate === yesterday) return (state.game.streak || 0);
    return 0; // streak broken
  }

  function updateStreak() {
    const today = new Date().toDateString();
    const lastPlay = state.game.lastPlayDate;
    
    if (!lastPlay || new Date(lastPlay).toDateString() !== today) {
      const currentStreak = checkStreak();
      if (!lastPlay || new Date(Date.now() - 24*60*60*1000).toDateString() === new Date(lastPlay).toDateString()) {
        state.game.streak = currentStreak + 1;
      } else {
        state.game.streak = 1; // new streak starts
      }
      state.game.lastPlayDate = Date.now();
      return true; // streak updated
    }
    return false; // already played today
  }

  function awardXP(amount) {
    const oldLevel = state.game.level || 1;
    state.game.xp = (state.game.xp || 0) + amount;
    state.game.level = getLevelFromXP(state.game.xp);
    
    if (state.game.level > oldLevel) {
      showAchievement('Level Up!', `Welcome to Level ${state.game.level}!`);
      return true;
    }
    return false;
  }

  function checkBadges() {
    const earnedBadges = state.game.badges || [];
    const newBadges = [];
    
    BADGES.forEach(badge => {
      if (earnedBadges.includes(badge.id)) return;
      
      let earned = false;
      switch(badge.requirement) {
        case 'scenarios':
          earned = (state.game.played || []).length >= badge.count;
          break;
        case 'score':
          earned = (state.game.score || 0) >= badge.count;
          break;
        case 'streak':
          earned = (state.game.streak || 0) >= badge.count;
          break;
        case 'level':
          earned = (state.game.level || 1) >= badge.count;
          break;
        case 'all_scenarios':
          earned = (state.game.played || []).length >= SCENARIOS.length;
          break;
      }
      
      if (earned) {
        newBadges.push(badge.id);
        state.game.badges = state.game.badges || [];
        state.game.badges.push(badge.id);
        showAchievement('Badge Earned!', `${badge.icon} ${badge.name}`);
      }
    });
    
    return newBadges;
  }

  function showAchievement(title, desc) {
    const alert = document.getElementById('achievementAlert');
    const titleEl = alert.querySelector('.achievement-title');
    const descEl = alert.querySelector('.achievement-desc');
    
    titleEl.textContent = title;
    descEl.textContent = desc;
    
    alert.classList.add('show');
    setTimeout(() => alert.classList.remove('show'), 3000);
  }

  function renderBadges() {
    const grid = document.getElementById('badgeGrid');
    if (!grid) return;
    
    const earnedBadges = state.game.badges || [];
    grid.innerHTML = BADGES.map(badge => {
      const earned = earnedBadges.includes(badge.id);
      return `<div class="badge ${earned ? 'earned' : 'locked'}">
        <div class="badge-icon">${badge.icon}</div>
        <div class="badge-name">${badge.name}</div>
        <div class="badge-desc">${badge.desc}</div>
      </div>`;
    }).join('');
  }

  // Simulator logic
  const SCENARIOS = [
    {
      id: 's1',
      text: 'Clinician: "It is probably just stress. Let us not overreact." You have had recurrent chest pain with palpitations.',
      choices: [
        { t: 'Describe a concrete episode with duration and impact, and request a specific test.', s: 2, fb: 'Specifics and a clear ask increase the chance of action.' },
        { t: 'Say you will wait it out and come back later.', s: -1, fb: 'Delays can prolong harm when red flags exist.' },
        { t: 'Repeat that it feels serious, without details.', s: 0, fb: 'Feelings matter, and pairing them with concrete data is stronger.' }
      ]
    },
    {
      id: 's2',
      text: 'Clinician: "You are too young for heart issues." You had a fainting episode last week.',
      choices: [
        { t: 'State your risk factors and ask for an EKG referral.', s: 2, fb: 'Naming risks plus a specific test is assertive and reasonable.' },
        { t: 'Ask if drinking more water will fix it.', s: -1, fb: 'Hydration can help some issues but does not exclude cardiac causes.' },
        { t: 'Request documentation that concerns were raised and declined.', s: 1, fb: 'Creating a paper trail can prompt reconsideration.' }
      ]
    },
    {
      id: 's3',
      text: 'Clinician: "Maybe you are just sensitive."',
      choices: [
        { t: 'Share symptom logs with timestamps and severity, and ask to review patterns.', s: 2, fb: 'Evidence counters minimization.' },
        { t: 'Stay silent to avoid conflict.', s: -1, fb: 'Silence can be interpreted as acceptance.' },
        { t: 'Ask to speak with a different provider or patient advocate.', s: 1, fb: 'Escalation pathways exist; using them is valid.' }
      ]
    },
    {
      id: 's4',
      text: 'Clinician interrupts you repeatedly.',
      choices: [
        { t: 'Calmly say you want two uninterrupted minutes to summarize key symptoms.', s: 2, fb: 'Setting boundaries can improve information flow.' },
        { t: 'Talk faster and accept interruptions.', s: -1, fb: 'Important details may be missed.' },
        { t: 'Hand over a written one-page summary.', s: 1, fb: 'Structured summaries can help when time is tight.' }
      ]
    },
    {
      id: 's5',
      text: 'Clinician: "Online forums exaggerate." You have found many similar cases.',
      choices: [
        { t: 'Cite a guideline or study and ask how your case fits it.', s: 2, fb: 'Grounding in literature reframes the discussion.' },
        { t: 'Argue about social media credibility.', s: 0, fb: 'It may not move the clinical plan.' },
        { t: 'Ask for a second opinion referral.', s: 1, fb: 'Getting fresh eyes can help.' }
      ]
    },
    {
      id: 's6',
      text: 'Discharge plan omits your primary concern.',
      choices: [
        { t: 'Request the concern be added to the discharge summary.', s: 1, fb: 'Documentation matters for continuity.' },
        { t: 'Accept the plan unchanged.', s: -1, fb: 'Unaddressed concerns can persist.' },
        { t: 'Ask for clear return precautions and thresholds.', s: 2, fb: 'Knowing when to return can prevent harm.' }
      ]
    }
  ];

  function renderGameUI() {
    // Update stats display
    document.getElementById('scoreValue').textContent = state.game.score || 0;
    document.getElementById('levelValue').textContent = state.game.level || 1;
    document.getElementById('streakValue').textContent = state.game.streak || 0;
    
    // Update progress bar
    const currentXP = state.game.xp || 0;
    const currentLevel = state.game.level || 1;
    const xpInLevel = currentXP % 100;
    const xpNeeded = 100;
    const progressPercent = (xpInLevel / xpNeeded) * 100;
    
    document.getElementById('currentXP').textContent = xpInLevel;
    document.getElementById('neededXP').textContent = xpNeeded;
    document.getElementById('nextLevel').textContent = currentLevel + 1;
    document.getElementById('progressFill').style.width = progressPercent + '%';
    
    // Update difficulty
    const difficulty = currentLevel <= 2 ? 'Easy' : currentLevel <= 4 ? 'Medium' : 'Hard';
    document.getElementById('scenarioDifficulty').textContent = difficulty;
    
    // Render badges
    renderBadges();
    
    // reminder status
    const g = state.game; const freq = g.reminders?.freq || 'none';
    els.reminderFreq.value = freq;
    const nextAt = g.reminders?.nextAt || 0;
    els.reminderStatus.textContent = freq === 'none' ? 'Reminders off' : `Next reminder scheduled: ${nextAt ? new Date(nextAt).toLocaleString() : 'not scheduled'}`;
  }

  function pickScenario() {
    const played = new Set(state.game.played || []);
    const pool = SCENARIOS.filter(s => !played.has(s.id));
    if (pool.length === 0) {
      els.scenarioText.textContent = 'Congratulations! You\'ve completed all scenarios. Reset to practice again!';
      els.choices.innerHTML = '';
      els.nextSimBtn.disabled = true;
      return null;
    }
    const s = pool[Math.floor(Math.random()*pool.length)];
    els.scenarioText.textContent = s.text;
    els.choices.innerHTML = '';
    s.choices.forEach((c, idx) => {
      const btn = document.createElement('button');
      btn.className = 'button choice-btn';
      btn.textContent = c.t;
      btn.addEventListener('click', () => {
        // Update score and provide feedback
        state.game.score = (state.game.score || 0) + c.s;
        els.feedback.textContent = c.fb;
        
        // Award XP based on choice score
        const xpGain = Math.max(5, 10 + (c.s * 5)); // 5-20 XP per scenario
        awardXP(xpGain);
        
        // Update streak
        const streakUpdated = updateStreak();
        if (streakUpdated) {
          els.feedback.textContent += ` +${state.game.streak} day streak!`;
        }
        
        // Track completed scenario
        (state.game.played = state.game.played || []).push(s.id);
        
        // Check for new badges
        checkBadges();
        
        // Update UI
        renderGameUI();
        store.set(KEYS.game, state.game);
        
        els.nextSimBtn.disabled = false;
        scheduleNextReminderIfNeeded();
      });
      els.choices.appendChild(btn);
    });
    els.feedback.textContent = '';
    els.nextSimBtn.disabled = true;
    return s;
  }

  function resetGame() {
    state.game = { score: 0, played: [], reminders: state.game.reminders || { freq: 'none', nextAt: 0, notifs: 'default' } };
    store.set(KEYS.game, state.game);
    els.feedback.textContent = '';
    renderGameUI();
  }

  // Reminders
  function requestNotifs() {
    if (!('Notification' in window)) { alert('Notifications are not supported in this browser.'); return; }
    Notification.requestPermission().then(p => {
      state.game.reminders = state.game.reminders || { freq: 'none', nextAt: 0, notifs: 'default' };
      state.game.reminders.notifs = p;
      store.set(KEYS.game, state.game);
      renderGameUI();
    });
  }

  function saveReminderSettings() {
    const freq = els.reminderFreq.value; // none | daily | weekly
    state.game.reminders = state.game.reminders || { freq: 'none', nextAt: 0, notifs: 'default' };
    state.game.reminders.freq = freq;
    if (freq === 'none') {
      state.game.reminders.nextAt = 0;
    } else {
      const period = freq === 'daily' ? 24*3600*1000 : 7*24*3600*1000;
      state.game.reminders.nextAt = nowTs() + period;
    }
    store.set(KEYS.game, state.game);
    renderGameUI();
  }

  function scheduleNextReminderIfNeeded() {
    const r = state.game.reminders || { freq: 'none' };
    if (r.freq === 'none') return;
    if (!r.nextAt || r.nextAt < nowTs()) {
      const period = r.freq === 'daily' ? 24*3600*1000 : 7*24*3600*1000;
      r.nextAt = nowTs() + period;
      state.game.reminders = r;
      store.set(KEYS.game, state.game);
      renderGameUI();
    }
  }

  function checkDueReminderOnLoad() {
    const r = state.game.reminders || { freq: 'none', nextAt: 0 };
    if (r.freq === 'none') return;
    if (r.nextAt && nowTs() >= r.nextAt) {
      // Show banner
      els.dueReminder.classList.remove('hidden');
      // Try desktop notification if allowed
      if ('Notification' in window && Notification.permission === 'granted') {
        try { new Notification('SheRages training reminder', { body: 'Ready to practice Gaslight Mode?' }); } catch {}
      }
      // schedule next
      const period = r.freq === 'daily' ? 24*3600*1000 : 7*24*3600*1000;
      r.nextAt = nowTs() + period;
      state.game.reminders = r; store.set(KEYS.game, state.game);
    }
  }

  function snoozeOneDay() {
    const r = state.game.reminders || { freq: 'none', nextAt: 0 };
    r.nextAt = nowTs() + 24*3600*1000;
    state.game.reminders = r; store.set(KEYS.game, state.game);
    els.dueReminder.classList.add('hidden');
    renderGameUI();
  }

  function downloadICS() {
    const freq = els.reminderFreq.value;
    if (freq === 'none') { alert('Select a frequency first.'); return; }
    const dtStart = new Date(Date.now() + 5*60*1000); // 5 minutes from now
    const uidStr = uid() + '@sherages.local';
    const dt = dtStart.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const rule = freq === 'daily' ? 'FREQ=DAILY' : 'FREQ=WEEKLY;BYDAY=MO';
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SheRages//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:' + uidStr,
      'DTSTAMP:' + dt,
      'DTSTART:' + dt,
      'SUMMARY:SheRages training reminder',
      'DESCRIPTION:Practice Gaslight Mode and build your self-advocacy skills.',
      'RRULE:' + rule,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sherages-training.ics'; a.click();
    URL.revokeObjectURL(url);
  }

  // Symptoms logic
  function renderSymptoms() {
    const from = els.fromDate.value ? new Date(els.fromDate.value).getTime() : -Infinity;
    const to = els.toDate.value ? new Date(els.toDate.value).getTime() + 24*3600*1000 - 1 : Infinity;
    const items = state.symptoms.slice().sort((a,b)=>b.dateTs-a.dateTs).filter(s => s.dateTs >= from && s.dateTs <= to);
    if (items.length === 0) { els.symList.innerHTML = '<div class="note">No entries yet for this range.</div>'; return; }
    els.symList.innerHTML = items.map(s => {
      const meta = [new Date(s.dateTs).toLocaleDateString(), `Severity ${s.severity}`].join(' • ');
      const vitals = [
        s.hr ? `${s.hr} bpm` : null,
        (s.sys && s.dia) ? `${s.sys}/${s.dia} mmHg` : null
      ].filter(Boolean).join(' • ');
      return `<div class="sym-item">
        <div class="meta">${escapeHtml(meta + (vitals ? ' • ' + vitals : ''))}</div>
        <div class="body"><strong>${escapeHtml(s.name)}</strong>${s.notes ? ': ' + escapeHtml(s.notes) : ''}</div>
      </div>`;
    }).join('');
  }

  function addSymptomEntry(entry) {
    state.symptoms.push(entry); store.set(KEYS.symptoms, state.symptoms); renderSymptoms();
  }

  function exportCSV() {
    const header = ['Date','Symptom','Severity','HeartRate','Systolic','Diastolic','Notes'];
    const rows = state.symptoms.map(s => [
      new Date(s.dateTs).toISOString().slice(0,10),
      s.name, s.severity, s.hr || '', s.sys || '', s.dia || '', (s.notes || '').replace(/\n/g,' ')
    ]);
    const csv = [header].concat(rows).map(r => r.map(v => '"' + String(v).replace(/"/g,'""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sherages-symptoms.csv'; a.click(); URL.revokeObjectURL(url);
  }

  // Event bindings
  function bindEvents() {
    window.addEventListener('hashchange', onHashChange);

    // Reset all data
    els.resetAllBtn?.addEventListener('click', () => {
      if (!confirm('This will clear all local data for this prototype. Continue?')) return;
      store.remove(KEYS.posts); store.remove(KEYS.topics); store.remove(KEYS.game); store.remove(KEYS.symptoms);
      location.reload();
    });

    // Community
    els.postTopic.addEventListener('change', onPostTopicChange);
    document.querySelectorAll('input[name="loc"]').forEach(cb => cb.addEventListener('change', renderFeed));
    els.topicFilters.addEventListener('change', renderFeed);

    els.postForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = (els.postText.value || '').trim();
      if (!text) { alert('Post cannot be empty.'); return; }
      let topic = els.postTopic.value;
      if (topic === '__add__') {
        const ct = (els.customTopic.value || '').trim();
        if (!ct) { alert('Enter a new topic name.'); return; }
        topic = ct; ensureTopic(topic);
      }
      const location = els.postLocation.value;
      addPost(text, topic, location);
      els.postText.value = ''; els.customTopic.value = ''; els.postTopic.value = topic; els.customTopicRow.classList.add('hidden');
    });

    // Simulator
    els.startSimBtn.addEventListener('click', () => { pickScenario(); });
    els.nextSimBtn.addEventListener('click', () => { pickScenario(); });
    els.resetGameBtn.addEventListener('click', resetGame);
    els.enableNotifsBtn.addEventListener('click', requestNotifs);
    els.saveReminderBtn.addEventListener('click', saveReminderSettings);
    els.downloadIcsBtn.addEventListener('click', downloadICS);
    els.snoozeBtn.addEventListener('click', snoozeOneDay);

    // Symptoms
    const today = new Date(); els.symDate.valueAsDate = today;
    els.symForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const dateVal = els.symDate.value ? new Date(els.symDate.value) : new Date();
      const entry = {
        id: uid(),
        dateTs: new Date(dateVal.getFullYear(), dateVal.getMonth(), dateVal.getDate()).getTime(),
        name: (els.symName.value || '').trim(),
        severity: Math.max(1, Math.min(10, parseInt(els.symSeverity.value || '5', 10))),
        hr: els.symHeartRate.value ? parseInt(els.symHeartRate.value, 10) : null,
        sys: els.symBpSys.value ? parseInt(els.symBpSys.value, 10) : null,
        dia: els.symBpDia.value ? parseInt(els.symBpDia.value, 10) : null,
        notes: (els.symNotes.value || '').trim()
      };
      if (!entry.name) { alert('Symptom name is required.'); return; }
      addSymptomEntry(entry);
      els.symForm.reset(); els.symSeverity.value = 5; els.symDate.valueAsDate = today;
    });

    els.applySymFilterBtn.addEventListener('click', () => { renderSymptoms(); });
    els.exportCsvBtn.addEventListener('click', exportCSV);
  }

  // Start
  function init() {
    initTopicsUI();
    bindEvents();
    onHashChange();
    checkDueReminderOnLoad();
  }

  document.addEventListener('DOMContentLoaded', init);
})();

