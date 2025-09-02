/* SheRages app logic */
(function() {
  'use strict';

  // Simple toast notifications
  const ui = (() => {
    let container;
    function ensureContainer() {
      if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
      }
    }
    function toast(message, type = 'info', timeout = 3000) {
      ensureContainer();
      const el = document.createElement('div');
      el.className = `toast ${type}`;
      el.textContent = message;
      container.appendChild(el);
      requestAnimationFrame(() => el.classList.add('show'));
      setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 250);
      }, timeout);
    }
    return { toast };
  })();

  // Animations: reveal-on-scroll and microinteractions
  const animations = (() => {
    let observer;
    const selectors = [
      '.feature-item', '.feature-card', '.testimonial', '.stat-card', '.card', '.post', '.sym-item'
    ];
    function markReveal(el) {
      if (!el) return;
      el.classList.add('reveal');
      if (observer) observer.observe(el);
    }
    function observeAll() {
      selectors.forEach(sel => document.querySelectorAll(sel).forEach(markReveal));
    }
    function init() {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) return; // Respect reduced motion
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      observeAll();
    }
    return { init, markReveal, observeAll };
  })();

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

  // Dummy data for screenshots
  const DUMMY_POSTS = [
    {
      id: 'p1',
      text: "Finally got my cardiologist to take my chest pain seriously after showing him 3 months of symptom logs from SheRages. The data made all the difference! 💪",
      topic: "Cardio",
      location: "Beirut",
      ts: Date.now() - 3600000,
      author: "Maya K."
    },
    {
      id: 'p2',
      text: "The Gaslight Mode training really helped me practice assertive responses. Used them today when the doctor tried to dismiss my symptoms as anxiety. Got the tests I needed!",
      topic: "Advocacy",
      location: "Tripoli",
      ts: Date.now() - 7200000,
      author: "Lina H."
    },
    {
      id: 'p3',
      text: "Does anyone else experience heart palpitations that get worse at night? My doctor says it's stress but I've been tracking patterns and it seems hormonal.",
      topic: "Cardio",
      location: "Saida",
      ts: Date.now() - 10800000,
      author: "Rania M."
    },
    {
      id: 'p4',
      text: "Support group meeting tomorrow at AUB Medical Center, 6 PM. Topic: Navigating insurance claims for specialized care. All welcome! 🤝",
      topic: "Support",
      location: "Beirut",
      ts: Date.now() - 14400000,
      author: "Nour T."
    },
    {
      id: 'p5',
      text: "After months of being told my fatigue was 'normal', finally got diagnosed with an autoimmune condition. Never give up advocating for yourself!",
      topic: "Diagnosis",
      location: "Jbeil",
      ts: Date.now() - 18000000,
      author: "Sarah A."
    },
    {
      id: 'p6',
      text: "New research paper published on gender bias in cardiovascular diagnosis in Lebanon. Sharing the link in comments. We need systemic change! 📊",
      topic: "Research",
      location: "Beirut",
      ts: Date.now() - 21600000,
      author: "Dr. Zeina K."
    }
  ];

  const DUMMY_SYMPTOMS = [
    {
      id: 's1',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      name: "Chest pain",
      severity: 7,
      heartRate: 95,
      bpSys: 130,
      bpDia: 85,
      notes: "Sharp pain on left side, lasted 20 minutes. Happened during rest, not exertion.",
      ts: Date.now() - 86400000
    },
    {
      id: 's2',
      date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
      name: "Heart palpitations",
      severity: 6,
      heartRate: 110,
      bpSys: 125,
      bpDia: 80,
      notes: "Irregular heartbeat, felt like skipping. Occurred after coffee.",
      ts: Date.now() - 172800000
    },
    {
      id: 's3',
      date: new Date(Date.now() - 259200000).toISOString().split('T')[0],
      name: "Fatigue",
      severity: 8,
      heartRate: 72,
      bpSys: 115,
      bpDia: 75,
      notes: "Extreme exhaustion despite 9 hours sleep. Unable to complete daily activities.",
      ts: Date.now() - 259200000
    },
    {
      id: 's4',
      date: new Date(Date.now() - 345600000).toISOString().split('T')[0],
      name: "Dizziness",
      severity: 5,
      heartRate: 88,
      bpSys: 110,
      bpDia: 70,
      notes: "Light-headed when standing up quickly. Improved after hydration.",
      ts: Date.now() - 345600000
    },
    {
      id: 's5',
      date: new Date().toISOString().split('T')[0],
      name: "Shortness of breath",
      severity: 6,
      heartRate: 98,
      bpSys: 135,
      bpDia: 88,
      notes: "Difficulty breathing during light activity. Had to stop walking up stairs.",
      ts: Date.now()
    }
  ];

  const DUMMY_GAME = {
    score: 850,
    xp: 450,
    level: 5,
    streak: 7,
    lastPlayDate: new Date().toISOString(),
    played: ['s1', 's2', 's3', 's4', 's5'],
    badges: [
      { id: 'first-step', name: 'First Step', icon: '🌟', desc: 'Complete your first scenario', earned: true },
      { id: 'week-warrior', name: 'Week Warrior', icon: '💪', desc: '7-day streak', earned: true },
      { id: 'advocate', name: 'Advocate', icon: '📢', desc: 'Level 5 reached', earned: true },
      { id: 'persistent', name: 'Persistent', icon: '🎯', desc: '10 scenarios completed', earned: false }
    ],
    reminders: { freq: 'daily', nextAt: Date.now() + 86400000, notifs: 'enabled' }
  };

  // State - Check for demo mode or use stored data
  const isDemoMode = localStorage.getItem('demoMode') === 'true';
  const state = {
    view: 'home',
    posts: isDemoMode ? DUMMY_POSTS : store.get(KEYS.posts, []),
    topics: store.get(KEYS.topics, DEFAULT_TOPICS),
    game: isDemoMode ? DUMMY_GAME : store.get(KEYS.game, { 
      score: 0, 
      xp: 0, 
      level: 1, 
      streak: 0, 
      lastPlayDate: null,
      played: [], 
      badges: [],
      reminders: { freq: 'none', nextAt: 0, notifs: 'default' } 
    }),
    symptoms: isDemoMode ? DUMMY_SYMPTOMS : store.get(KEYS.symptoms, []),
    _loadedPosts: false,
    _loadedSymptoms: false
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
  function mapSupabasePost(row) {
    return {
      id: row.id,
      text: row.text,
      topic: row.topic,
      location: row.location,
      ts: row.ts ? new Date(row.ts).getTime() : (row.created_at ? new Date(row.created_at).getTime() : Date.now()),
      user_id: row.user_id || null
    };
  }

  async function loadPostsFromSupabase() {
    if (!window.sheragesSupabase?.enabled || state._loadedPosts) return;
    els.feed.innerHTML = '<div class="note">Loading feed…</div>';
    const { data, error } = await window.sheragesSupabase.posts.list();
    if (error) {
      ui.toast('Failed to load posts', 'error');
      return;
    }
    state.posts = (data || []).map(mapSupabasePost);
    state._loadedPosts = true;
    renderFeed();
  }

  function renderFeed() {
    // Collect filters
    const locChecks = Array.from(document.querySelectorAll('input[name="loc"]:checked')).map(x => x.value);
    const topicChecks = Array.from(els.topicFilters.querySelectorAll('input[name="topic"]:checked')).map(x => x.value);

    if (window.sheragesSupabase?.enabled && !state._loadedPosts) {
      loadPostsFromSupabase();
    }

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
      return `<article class=\"post\" data-id=\"${p.id}\">\n        <div class=\"meta\">${meta}</div>\n        <div class=\"body\">${escapeHtml(p.text)}</div>\n      </article>`;
    }).join('');
    animations.observeAll();
  }

  async function addPost(text, topic, location) {
    if (window.sheragesSupabase?.enabled) {
      const { data, error } = await window.sheragesSupabase.posts.create({ text, topic, location });
      if (error) { ui.toast('Failed to post', 'error'); return; }
      const mapped = mapSupabasePost(data);
      state.posts.unshift(mapped);
      renderFeed();
      ui.toast('Posted!', 'success');
      return;
    }
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
  function mapSupabaseSymptom(row) {
    return {
      id: row.id,
      dateTs: row.date_ts || (row.dateTs ?? Date.now()),
      name: row.name,
      severity: row.severity,
      hr: row.hr,
      sys: row.sys,
      dia: row.dia,
      notes: row.notes || ''
    };
  }

  async function loadSymptomsFromSupabase() {
    if (!window.sheragesSupabase?.enabled || state._loadedSymptoms === true) return;
    els.symList.innerHTML = '<div class="note">Loading entries…</div>';
    const { data, error } = await window.sheragesSupabase.symptoms.list();
    if (error) { ui.toast('Failed to load symptoms', 'error'); return; }
    state.symptoms = (data || []).map(mapSupabaseSymptom);
    state._loadedSymptoms = true;
    renderSymptoms();
  }

  function renderSymptoms() {
    const from = els.fromDate.value ? new Date(els.fromDate.value).getTime() : -Infinity;
    const to = els.toDate.value ? new Date(els.toDate.value).getTime() + 24*3600*1000 - 1 : Infinity;
    if (window.sheragesSupabase?.enabled && !state._loadedSymptoms) {
      loadSymptomsFromSupabase();
    }
    const items = state.symptoms.slice().sort((a,b)=>b.dateTs-a.dateTs).filter(s => s.dateTs >= from && s.dateTs <= to);
    if (items.length === 0) { els.symList.innerHTML = '<div class="note">No entries yet for this range.</div>'; return; }
    els.symList.innerHTML = items.map(s => {
      const meta = [new Date(s.dateTs).toLocaleDateString(), `Severity ${s.severity}`].join(' • ');
      const vitals = [
        s.hr ? `${s.hr} bpm` : null,
        (s.sys && s.dia) ? `${s.sys}/${s.dia} mmHg` : null
      ].filter(Boolean).join(' • ');
      return `<div class=\"sym-item\">\n        <div class=\"meta\">${escapeHtml(meta + (vitals ? ' • ' + vitals : ''))}</div>\n        <div class=\"body\"><strong>${escapeHtml(s.name)}</strong>${s.notes ? ': ' + escapeHtml(s.notes) : ''}</div>\n      </div>`;
    }).join('');
    animations.observeAll();
  }

  async function addSymptomEntry(entry) {
    if (window.sheragesSupabase?.enabled) {
      // Supabase expects date_ts
      const payload = { ...entry, date_ts: entry.dateTs };
      const { data, error } = await window.sheragesSupabase.symptoms.create(payload);
      if (error) { ui.toast('Failed to save entry', 'error'); return; }
      const mapped = mapSupabaseSymptom(data);
      state.symptoms.unshift(mapped);
      renderSymptoms();
      ui.toast('Symptom logged', 'success');
      return;
    }
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

  // Authentication
  const auth = {
    authenticated: store.get('authenticated', false),
    demoMode: false,
    
    showLanding() {
      document.getElementById('landing-page').style.display = 'block';
      document.getElementById('app-content').style.display = 'none';
    },
    
    showApp() {
      document.getElementById('landing-page').style.display = 'none';
      document.getElementById('app-content').style.display = 'block';
    },
    
    openModal(modalId) {
      document.getElementById(modalId).classList.add('active');
    },
    
    closeModal(modalId) {
      document.getElementById(modalId).classList.remove('active');
    },
    
    async login(email, password) {
      // Use Supabase if configured; fallback to demo local auth
      try {
        if (window.sheragesSupabase?.enabled) {
          const { error } = await window.sheragesSupabase.auth.signIn({ email, password });
          if (error) { ui.toast(error.message || 'Login failed', 'error'); return; }
          this.authenticated = true;
          store.set('authenticated', true);
          ui.toast('Logged in', 'success');
        } else {
          this.authenticated = true;
          store.set('authenticated', true);
        }
        this.closeModal('login-modal');
        this.showApp();
      } catch (e) {
        ui.toast('Login error', 'error');
      }
    },
    
    async signup(name, email, password, location) {
      try {
        if (window.sheragesSupabase?.enabled) {
          const { error } = await window.sheragesSupabase.auth.signUp({ name, email, password, location });
          if (error) { ui.toast(error.message || 'Signup failed', 'error'); return; }
          ui.toast('Check your email to confirm your account.', 'success');
          this.closeModal('signup-modal');
          // Stay on landing; do not auto-login
          return;
        } else {
          this.authenticated = true;
          store.set('authenticated', true);
          this.closeModal('signup-modal');
          this.showApp();
        }
      } catch (e) {
        ui.toast('Signup error', 'error');
      }
    },
    
    startDemo() {
      this.demoMode = true;
      localStorage.setItem('demoMode', 'true');
      // Load dummy data into state
      state.posts = DUMMY_POSTS;
      state.symptoms = DUMMY_SYMPTOMS;
      state.game = DUMMY_GAME;
      // Save to localStorage so it persists
      store.set(KEYS.posts, DUMMY_POSTS);
      store.set(KEYS.symptoms, DUMMY_SYMPTOMS);
      store.set(KEYS.game, DUMMY_GAME);
      this.showApp();
      // Jump straight to the home view to show everything
      location.hash = '#home';
      ui.toast('Demo mode activated with sample data!', 'success');
    },
    
    init() {
      if (window.sheragesSupabase?.enabled) {
        // React to auth state changes
        window.sheragesSupabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            this.authenticated = true;
            store.set('authenticated', true);
            this.showApp();
          } else if (!this.demoMode) {
            this.authenticated = false;
            store.set('authenticated', false);
            this.showLanding();
          }
        });
      }
      if (this.authenticated || this.demoMode) {
        this.showApp();
      } else {
        this.showLanding();
      }
    }
  };
  
  function bindAuthEvents() {
    // Landing page auth buttons
    document.getElementById('show-login')?.addEventListener('click', (e) => {
      e.preventDefault();
      auth.openModal('login-modal');
    });
    
    document.getElementById('show-signup')?.addEventListener('click', (e) => {
      e.preventDefault();
      auth.openModal('signup-modal');
    });
    // Also bind any elements with .open-signup (landing CTAs)
    document.querySelectorAll('.open-signup').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        auth.openModal('signup-modal');
      });
    });
    
    document.getElementById('try-demo')?.addEventListener('click', (e) => {
      e.preventDefault();
      auth.startDemo();
    });
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const modal = btn.closest('.modal');
        modal.classList.remove('active');
      });
    });
    
    // Modal backdrop clicks
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });
    
    // Login form
    document.getElementById('login-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      auth.login(email, password);
    });
    
    // Signup form
    document.getElementById('signup-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      const location = document.getElementById('signup-location').value;
      auth.signup(name, email, password, location);
    });
    
    // Demo buttons
    document.querySelectorAll('.demo-button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        auth.startDemo();
      });
    });
    
    // Switch between login and signup
    document.getElementById('switch-to-signup')?.addEventListener('click', (e) => {
      e.preventDefault();
      auth.closeModal('login-modal');
      auth.openModal('signup-modal');
    });
    
    document.getElementById('switch-to-login')?.addEventListener('click', (e) => {
      e.preventDefault();
      auth.closeModal('signup-modal');
      auth.openModal('login-modal');
    });
  }

  // Testimonial Slider
  const testimonialSlider = {
    currentSlide: 0,
    totalSlides: 0,
    slider: null,
    dots: null,
    
    init() {
      this.slider = document.getElementById('testimonials-slider');
      this.dots = document.getElementById('testimonial-dots');
      
      if (!this.slider) return; // Not on landing page
      
      this.totalSlides = this.slider.children.length;
      
      // Bind controls
      const prevBtn = document.getElementById('prev-testimonial');
      const nextBtn = document.getElementById('next-testimonial');
      
      if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => this.prevSlide());
        nextBtn.addEventListener('click', () => this.nextSlide());
      }
      
      // Bind dots
      if (this.dots) {
        this.dots.addEventListener('click', (e) => {
          if (e.target.classList.contains('slider-dot')) {
            const slideIndex = parseInt(e.target.dataset.slide);
            this.goToSlide(slideIndex);
          }
        });
      }
      
      // Auto-advance every 6 seconds
      setInterval(() => this.nextSlide(), 6000);
    },
    
    goToSlide(index) {
      this.currentSlide = index;
      if (this.currentSlide >= this.totalSlides) this.currentSlide = 0;
      if (this.currentSlide < 0) this.currentSlide = this.totalSlides - 1;
      
      // Update slider position
      const translateX = -this.currentSlide * 100;
      this.slider.style.transform = `translateX(${translateX}%)`;
      
      // Update dots
      if (this.dots) {
        this.dots.querySelectorAll('.slider-dot').forEach((dot, i) => {
          dot.classList.toggle('active', i === this.currentSlide);
        });
      }
    },
    
    nextSlide() {
      this.goToSlide(this.currentSlide + 1);
    },
    
    prevSlide() {
      this.goToSlide(this.currentSlide - 1);
    }
  };

  // Start
  function init() {
    bindAuthEvents();
    auth.init();
    testimonialSlider.init();
    initTopicsUI();
    bindEvents();
    onHashChange();
    checkDueReminderOnLoad();
    animations.init();
  }

  document.addEventListener('DOMContentLoaded', init);
})();

