/* ═══════════════════════════════════════════════════
   LIFT TRACKER — app.js
   Storage · Automation · Router · Views
   ═══════════════════════════════════════════════════ */

// ─── STORAGE LAYER ───────────────────────────────────
const STORAGE_KEYS = {
  meta: 'lift_meta',
  logs: 'lift_logs',
  draft: 'lift_draft'
};

function getMeta() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.meta)) || null; }
  catch { return null; }
}

function saveMeta(data) {
  localStorage.setItem(STORAGE_KEYS.meta, JSON.stringify(data));
}

function getLogs() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.logs)) || []; }
  catch { return []; }
}

function saveLogs(logs) {
  localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(logs));
}

function addLog(entry) {
  const logs = getLogs();
  logs.push(entry);
  saveLogs(logs);
}

function deleteLog(id) {
  saveLogs(getLogs().filter(l => l.id !== id));
}

function getDraft() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.draft)) || null; }
  catch { return null; }
}

function saveDraft(day, week, state) {
  localStorage.setItem(STORAGE_KEYS.draft, JSON.stringify({ day, week, state }));
}

function clearDraft() {
  localStorage.removeItem(STORAGE_KEYS.draft);
}

function exportData() {
  const data = {
    meta: getMeta(),
    logs: getLogs(),
    exportedAt: new Date().toISOString(),
    version: 1
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `lift-backup-${todayISO()}.json`;
  a.click();
}

function importData(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (data.meta) saveMeta(data.meta);
    if (data.logs) saveLogs(data.logs);
    return true;
  } catch { return false; }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

// ─── AUTOMATION ENGINE ────────────────────────────────
function getCurrentWeek() {
  const meta = getMeta();
  if (!meta?.programStartDate) return 1;
  const start = new Date(meta.programStartDate);
  const now = new Date();
  const days = Math.floor((now - start) / 86400000);
  return Math.min(Math.max(Math.floor(days / 7) + 1, 1), 12);
}

function getMesoId(week) {
  if (week <= 4) return 'm1';
  if (week <= 8) return 'm2';
  return 'm3';
}

function isDeload(week) {
  return PROGRAM.meta.deloadWeeks.includes(week);
}

function getMesoLabel(week) {
  const meso = PROGRAM.meta.mesocycles.find(m => m.id === getMesoId(week));
  return meso ? meso.label : '';
}

function getTodaysProgramDay() {
  const map = { 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat', 0: 'sun' };
  return map[new Date().getDay()];
}

function isProgramStarted() {
  const meta = getMeta();
  if (!meta?.programStartDate) return false;
  return todayISO() >= meta.programStartDate;
}

function getCompoundScheme(week) {
  const meso = getMesoId(week);
  if (isDeload(week)) return PROGRAM.schemes.compoundDeload[meso];
  return PROGRAM.schemes.compound[meso];
}

function getAccScheme(week) {
  const meso = getMesoId(week);
  if (isDeload(week)) return { sets: PROGRAM.schemes.accessoryDeload.sets, repsMin: null, repsMax: null };
  return PROGRAM.schemes.accessory[meso];
}

function estimateMax(weight, reps) {
  if (!weight || !reps) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) / 5) * 5;
}

function getSuggestedWeight(exerciseName, week) {
  const lastLog = getLastLogForExercise(exerciseName);
  if (lastLog && lastLog.sets && lastLog.sets.length) {
    const scheme = getCompoundScheme(week);
    const topRep = scheme.repsMax || 10;
    const allHitTop = lastLog.sets.every(s => s.completed && s.reps >= topRep);
    const lastWeight = lastLog.sets[0]?.weight || 0;
    if (lastWeight > 0) return allHitTop ? lastWeight + 5 : lastWeight;
  }
  const meta = getMeta();
  if (!meta?.maxes) return null;
  const max = meta.maxes[exerciseName];
  if (!max) return null;
  const scheme = getCompoundScheme(week);
  const loadFactor = scheme.loadFactor || scheme.loadMin || 0.65;
  return Math.round(max.weight * loadFactor / 5) * 5;
}

function getLastLogForExercise(exerciseName) {
  const logs = getLogs();
  for (let i = logs.length - 1; i >= 0; i--) {
    const log = logs[i];
    if (log.type === 'zone2') continue;
    if (log.compound?.exercise === exerciseName) return log.compound;
    for (const ss of Object.values(log.supersets || {})) {
      for (const ex of Object.values(ss)) {
        if (ex?.exercise === exerciseName) return ex;
      }
    }
  }
  return null;
}

function detectPRs(log) {
  if (log.type === 'zone2') return [];
  const prs = [];
  const meta = getMeta();
  const checkExercise = (exData) => {
    if (!exData?.exercise || !exData?.sets?.length) return;
    const bestSet = exData.sets.reduce((best, s) => {
      if (!s.completed) return best;
      const e = estimateMax(s.weight, s.reps);
      const bestE = estimateMax(best.weight || 0, best.reps || 1);
      return e > bestE ? s : best;
    }, {});
    if (!bestSet.weight) return;
    const current1RM = estimateMax(bestSet.weight, bestSet.reps);
    const storedMax = meta?.maxes?.[exData.exercise];
    const stored1RM = storedMax ? estimateMax(storedMax.weight, storedMax.reps || 1) : 0;
    if (current1RM > stored1RM) {
      prs.push({ exercise: exData.exercise, weight: bestSet.weight, reps: bestSet.reps, estimated1RM: current1RM });
    }
  };
  checkExercise(log.compound);
  for (const ss of Object.values(log.supersets || {})) {
    for (const ex of Object.values(ss)) checkExercise(ex);
  }
  return prs;
}

function savePRs(prs) {
  if (!prs.length) return;
  const meta = getMeta();
  if (!meta.maxes) meta.maxes = {};
  prs.forEach(pr => {
    meta.maxes[pr.exercise] = {
      weight: pr.weight,
      reps: pr.reps,
      estimated1RM: pr.estimated1RM,
      date: todayISO()
    };
  });
  saveMeta(meta);
}

function isTodayLogged(day) {
  const today = todayISO();
  return getLogs().some(l => l.date === today && l.day === day);
}

function getNextLiftDay(fromDay) {
  const order = ['mon', 'wed', 'fri', 'sat'];
  const idx = order.indexOf(fromDay);
  return order[(idx + 1) % order.length];
}

// ─── HASH ROUTER ──────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}

const VIEWS = {};

function navigate(hash) {
  window.location.hash = hash;
}

function renderCurrentView() {
  const hash = window.location.hash.replace('#', '') || 'dashboard';
  const app = document.getElementById('app');

  const meta = getMeta();
  if (!meta && hash !== 'onboarding') {
    window.location.hash = 'onboarding';
    return;
  }

  document.querySelectorAll('[data-nav]').forEach(el => {
    el.classList.toggle('active', el.dataset.nav === hash);
  });

  const weekEl = document.getElementById('headerWeek');
  if (weekEl && meta) {
    const w = getCurrentWeek();
    weekEl.textContent = `WK ${w} · ${getMesoLabel(w).toUpperCase()}`;
  }

  app.style.animation = 'none';
  void app.offsetHeight;
  app.style.animation = '';

  const viewFn = VIEWS[hash] || VIEWS['dashboard'];
  app.innerHTML = '';
  viewFn(app);
}

window.addEventListener('hashchange', renderCurrentView);
window.addEventListener('load', renderCurrentView);

// ─── TOAST ────────────────────────────────────────────
function showToast(msg, duration = 3000) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), duration);
}

// ─── HELPERS ──────────────────────────────────────────
function formatDate(iso) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function rpeColor(rpe) {
  if (!rpe) return 'var(--muted)';
  if (rpe <= 6) return '#3a8c4a';
  if (rpe <= 7) return '#c8a020';
  if (rpe <= 8) return '#e07820';
  return '#d63a20';
}

function dayBadgeClass(day) {
  const map = { mon: 'badge-ss-a', wed: 'badge-ss-b', fri: 'badge-compound', sat: 'badge-ss-c' };
  return map[day] || 'badge-z2';
}

function dayLabel(day) {
  const map = { mon: 'MON', tue: 'TUE', wed: 'WED', thu: 'THU', fri: 'FRI', sat: 'SAT', sun: 'SUN' };
  return map[day] || day.toUpperCase();
}

// ═══════════════════════════════════════════════════
// VIEW: ONBOARDING
// ═══════════════════════════════════════════════════
VIEWS['onboarding'] = function(app) {
  let screen = 1;
  let startDate = todayISO();
  let maxes = { 'Back Squat': '', 'Barbell Bench Press': '', 'Conventional / Sumo Deadlift': '', 'Standing Overhead Press': '' };
  let bodyweight = '';

  function render() {
    app.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'onboard-wrap';

    if (screen === 1) {
      wrap.innerHTML = `
        <div class="onboard-logo">L</div>
        <div class="onboard-title">Lift Tracker</div>
        <div class="onboard-sub">12-Week Hybrid Strength &amp; Mirror Program.<br>Track your Big 4 lifts, accessories, and Zone 2.</div>
        <div class="form-group">
          <label class="form-label">Program Start Date</label>
          <input type="date" class="input" id="ob-start" value="${startDate}">
        </div>
        <div style="margin-top: auto; padding-top: 24px;">
          <button class="btn btn-primary" id="ob-next1">Start Program →</button>
        </div>
      `;
      app.appendChild(wrap);
      wrap.querySelector('#ob-start').addEventListener('change', e => { startDate = e.target.value; });
      wrap.querySelector('#ob-next1').addEventListener('click', () => { screen = 2; render(); });

    } else if (screen === 2) {
      const liftKey = lift => lift.replace(/\s+/g, '-').replace(/\//g, '-');
      const lifts = Object.keys(maxes);
      const formGroups = lifts.map(lift => `
        <div class="form-group">
          <label class="form-label">${lift}</label>
          <div class="max-input-group">
            <input type="number" class="input" placeholder="lbs" inputmode="decimal"
              data-lift="${lift}" value="${maxes[lift]}" id="max-${liftKey(lift)}">
            <span class="estimate-toggle" data-lift="${lift}">Estimate from a set →</span>
            <div class="estimate-expander" id="est-${liftKey(lift)}" style="display:none">
              <div class="estimate-inputs">
                <input type="number" class="input" placeholder="Weight" inputmode="decimal" data-est-w="${lift}">
                <span class="text-muted">×</span>
                <input type="number" class="input" placeholder="Reps" inputmode="numeric" data-est-r="${lift}">
              </div>
              <div class="estimate-e1rm" data-e1rm="${lift}">Est. 1RM: —</div>
              <button class="btn btn-sm btn-secondary" data-use="${lift}">Use this weight</button>
            </div>
          </div>
        </div>
      `).join('');

      wrap.innerHTML = `
        <div class="label" style="margin-bottom:4px">Step 2 of 3</div>
        <div class="onboard-title" style="margin-bottom:8px">Your Best Lifts</div>
        <div class="onboard-sub">Used to suggest starting weights. Skip if you don't know.</div>
        ${formGroups}
        <div class="form-group">
          <label class="form-label">Bodyweight (optional)</label>
          <input type="number" class="input" placeholder="lbs" inputmode="decimal" id="ob-bw" value="${bodyweight}">
        </div>
        <div style="margin-top: auto; padding-top: 12px; display: flex; flex-direction: column; gap: 10px;">
          <button class="btn btn-primary" id="ob-next2">Continue →</button>
          <button class="btn btn-ghost btn-sm" id="ob-skip">Skip for now</button>
        </div>
      `;
      app.appendChild(wrap);

      lifts.forEach(lift => {
        const key = liftKey(lift);
        wrap.querySelector(`#max-${key}`).addEventListener('input', e => { maxes[lift] = e.target.value; });
        wrap.querySelector(`[data-lift="${lift}"]`).addEventListener('click', () => {
          const exp = wrap.querySelector(`#est-${key}`);
          exp.style.display = exp.style.display === 'none' ? 'block' : 'none';
        });
        const wInput = wrap.querySelector(`[data-est-w="${lift}"]`);
        const rInput = wrap.querySelector(`[data-est-r="${lift}"]`);
        const e1rmEl = wrap.querySelector(`[data-e1rm="${lift}"]`);
        const updateE1rm = () => {
          const w = parseFloat(wInput.value); const r = parseInt(rInput.value);
          if (w && r) e1rmEl.textContent = `Est. 1RM: ${estimateMax(w, r)} lbs`;
          else e1rmEl.textContent = 'Est. 1RM: —';
        };
        wInput.addEventListener('input', updateE1rm);
        rInput.addEventListener('input', updateE1rm);
        wrap.querySelector(`[data-use="${lift}"]`).addEventListener('click', () => {
          const w = parseFloat(wInput.value); const r = parseInt(rInput.value);
          if (w && r) {
            const val = estimateMax(w, r);
            maxes[lift] = val;
            wrap.querySelector(`#max-${key}`).value = val;
          }
        });
      });

      wrap.querySelector('#ob-bw').addEventListener('input', e => { bodyweight = e.target.value; });
      wrap.querySelector('#ob-next2').addEventListener('click', () => {
        lifts.forEach(lift => {
          const key = liftKey(lift);
          const val = wrap.querySelector(`#max-${key}`).value;
          maxes[lift] = val ? parseFloat(val) : null;
        });
        screen = 3; render();
      });
      wrap.querySelector('#ob-skip').addEventListener('click', () => { lifts.forEach(l => { maxes[l] = null; }); screen = 3; render(); });

    } else if (screen === 3) {
      const today = getTodaysProgramDay();
      const dayData = PROGRAM.days[today];
      const todayLabel = dayData.name || 'Rest Day';

      wrap.innerHTML = `
        <div class="onboard-logo" style="font-size:48px;margin-bottom:16px">✓</div>
        <div class="onboard-title" style="margin-bottom:8px">You're set.</div>
        <div class="card" style="margin-bottom:16px">
          <div class="label">Program Start</div>
          <div class="bold">${formatDate(startDate)}</div>
        </div>
        <div class="card" style="margin-bottom:16px">
          <div class="label">Week 1 · Mesocycle 1 · Hypertrophy</div>
          <div class="bold">Today: ${todayLabel}</div>
          <div class="text-muted text-sm mt4">4 sets · 8–10 reps · 65–75% 1RM</div>
        </div>
        <div style="margin-top: auto; padding-top: 24px;">
          <button class="btn btn-primary" id="ob-go">Let's Train →</button>
        </div>
      `;
      app.appendChild(wrap);

      wrap.querySelector('#ob-go').addEventListener('click', () => {
        const maxObj = {};
        Object.entries(maxes).forEach(([k, v]) => {
          if (v) maxObj[k] = { weight: v, reps: 1, date: startDate };
        });
        saveMeta({
          programStartDate: startDate,
          maxes: maxObj,
          bodyweight: bodyweight ? [{ weight: parseFloat(bodyweight), date: startDate }] : []
        });
        navigate('log');
      });
    }
  }

  render();
};

// ═══════════════════════════════════════════════════
// VIEW: DASHBOARD
// ═══════════════════════════════════════════════════
VIEWS['dashboard'] = function(app) {
  const div = document.createElement('div');
  div.className = 'view';
  const week = getCurrentWeek();
  const meso = getMesoId(week);
  const today = getTodaysProgramDay();
  const dayData = PROGRAM.days[today];
  const alreadyLogged = isTodayLogged(today);
  const logs = getLogs();

  // Smart card
  let smartCardHTML = `<div class="smart-card">`;

  if (!isProgramStarted()) {
    const meta = getMeta();
    smartCardHTML += `
      <div class="meso-label">PROGRAM NOT STARTED</div>
      <div class="session-title" style="font-size:18px">Starting ${meta.programStartDate}</div>
      <div class="text-muted text-sm" style="margin-top:8px">Come back on your start date to log your first session.</div>`;
    smartCardHTML += `</div>`;
  } else {

  smartCardHTML += `<div class="meso-label">WEEK ${week} · ${getMesoLabel(week).toUpperCase()}${isDeload(week) ? ' · DELOAD' : ''}</div>`;

  if (dayData.type === 'lift') {
    smartCardHTML += `<div class="session-title">${dayData.name}</div>`;
    smartCardHTML += `<div class="session-sub">${dayData.sub}</div>`;
    if (alreadyLogged) {
      const next = getNextLiftDay(today);
      const nextData = PROGRAM.days[next];
      smartCardHTML += `
        <div style="color:var(--green);font-size:15px;font-weight:700;margin-bottom:12px">Session complete ✓</div>
        <div class="text-muted text-sm">Next: ${dayLabel(next)} — ${nextData.name}</div>`;
    } else {
      smartCardHTML += `<button class="btn btn-primary" onclick="navigate('log')">Start Today's Workout</button>`;
    }
  } else if (dayData.type === 'zone2') {
    smartCardHTML += `<div class="session-title">${dayData.name}</div>`;
    smartCardHTML += `<div class="session-sub">${PROGRAM.zone2.structure}</div>`;
    if (alreadyLogged) {
      smartCardHTML += `<div style="color:var(--green);font-size:15px;font-weight:700;">Zone 2 complete ✓</div>`;
    } else {
      smartCardHTML += `
        <div class="text-sm text-muted mb12">60 min · RPE 5–6 · conversational pace</div>
        <button class="btn btn-secondary" onclick="navigate('log')">Log Zone 2</button>`;
    }
  } else {
    smartCardHTML += `<div class="session-title">Rest Day</div>`;
    const nextMon = PROGRAM.days.mon;
    smartCardHTML += `<div class="session-sub">Recovery &amp; mobility</div>`;
    smartCardHTML += `<div class="text-muted text-sm mt8">Next: Monday — ${nextMon.name}</div>`;
  }
  smartCardHTML += `</div>`;

  } // end isProgramStarted

  // Week dots
  const liftDays = ['mon', 'wed', 'fri', 'sat'];
  const dayNames = { mon: 'M', wed: 'W', fri: 'F', sat: 'S' };
  let weekDotsHTML = `<div class="week-dots">`;
  liftDays.forEach(d => {
    const done = logs.some(l => {
      const lDate = new Date(l.date + 'T12:00:00');
      const lWeek = Math.floor((lDate - new Date(getMeta().programStartDate)) / (7 * 86400000)) + 1;
      return lWeek === week && l.day === d;
    });
    const isToday = d === today;
    weekDotsHTML += `
      <div class="week-dot">
        <div class="week-dot-circle ${done ? 'done' : isToday ? 'today' : ''}">${dayNames[d]}</div>
        <div class="week-dot-label">${dayLabel(d)}</div>
      </div>`;
  });
  weekDotsHTML += `</div>`;

  // Last 4 sessions
  const recentLogs = logs.filter(l => l.type !== 'zone2').slice(-4).reverse();
  let recentHTML = '';
  if (recentLogs.length) {
    recentHTML = `<div class="section-title">Recent Sessions</div>`;
    recentLogs.forEach(l => {
      const topSet = l.compound?.sets?.filter(s => s.completed).reduce((b, s) => s.weight > (b.weight || 0) ? s : b, {});
      const topStr = topSet?.weight ? `${topSet.weight} lbs × ${topSet.reps}` : '';
      const rpeDot = l.rpe ? `<div class="rpe-dot" style="background:${rpeColor(l.rpe)}"></div>` : '';
      recentHTML += `
        <div class="card card-sm flex-between" style="gap:8px">
          <div class="date-chip">${formatDate(l.date)}</div>
          <div style="flex:1">
            <div class="badge ${dayBadgeClass(l.day)}">${dayLabel(l.day)}</div>
            <div class="history-exercise mt4">${l.compound?.exercise || ''}</div>
            ${topStr ? `<div class="text-sm text-muted">${topStr}</div>` : ''}
          </div>
          ${rpeDot}
        </div>`;
    });
  }

  // Sparklines for Big 4
  const big4 = [
    { name: 'Back Squat', day: 'mon' },
    { name: 'Barbell Bench Press', day: 'wed' },
    { name: 'Conventional / Sumo Deadlift', day: 'fri' },
    { name: 'Standing Overhead Press', day: 'sat' }
  ];

  let sparkHTML = `<div class="section-title">Big 4 Trend</div><div class="sparkline-grid">`;
  big4.forEach(lift => {
    const exerciseLogs = logs.filter(l => l.compound?.exercise === lift.name).slice(-8);
    const points = exerciseLogs.map(l => {
      const topSet = l.compound?.sets?.filter(s => s.completed).reduce((b, s) => s.weight > (b?.weight || 0) ? s : b, null);
      return topSet ? topSet.weight : null;
    }).filter(Boolean);
    const latest = points.length ? points[points.length - 1] : null;
    let svgPath = '';
    if (points.length >= 2) {
      const W = 100, H = 40;
      const minY = Math.min(...points), maxY = Math.max(...points);
      const range = maxY - minY || 10;
      const pts = points.map((y, i) => {
        const x = (i / (points.length - 1)) * (W - 10) + 5;
        const yp = H - 4 - ((y - minY) / range) * (H - 10);
        return `${x},${yp}`;
      });
      svgPath = `<svg viewBox="0 0 ${W} ${H}" class="chart-svg" style="height:40px">
        <polyline points="${pts.join(' ')}" fill="none" stroke="var(--red)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="${pts[pts.length-1].split(',')[0]}" cy="${pts[pts.length-1].split(',')[1]}" r="3" fill="var(--red)"/>
      </svg>`;
    } else {
      svgPath = `<div style="height:40px;display:flex;align-items:center;color:var(--muted);font-size:12px">No data yet</div>`;
    }
    sparkHTML += `
      <div class="sparkline-card">
        <div class="sparkline-name">${lift.name.split(' ')[lift.name.split(' ').length - 1]}</div>
        ${svgPath}
        <div class="sparkline-weight">${latest ? `${latest}<span>lbs</span>` : '—'}</div>
      </div>`;
  });
  sparkHTML += `</div>`;

  div.innerHTML = smartCardHTML + weekDotsHTML + recentHTML + sparkHTML;
  app.appendChild(div);
};

// ═══════════════════════════════════════════════════
// VIEW: LOG
// ═══════════════════════════════════════════════════
VIEWS['log'] = function(app) {
  if (!isProgramStarted()) {
    const meta = getMeta();
    app.innerHTML = `<div class="view">
      <div class="card" style="text-align:center;padding:32px">
        <div class="title" style="margin-bottom:8px">Program Not Started</div>
        <div class="text-muted">Your program begins on ${meta.programStartDate}.<br>Come back then to log your first session.</div>
      </div>
    </div>`;
    return;
  }

  const week = getCurrentWeek();
  const meso = getMesoId(week);
  const today = getTodaysProgramDay();
  const dayData = PROGRAM.days[today];

  if (!dayData) { app.innerHTML = '<div class="view"><p class="text-muted">No program data for today.</p></div>'; return; }

  if (dayData.type === 'zone2') {
    renderZone2Logger(app, today, week);
  } else if (dayData.type === 'lift') {
    renderLiftLogger(app, today, week, meso, dayData);
  } else {
    const div = document.createElement('div');
    div.className = 'view';
    div.innerHTML = `
      <div class="card" style="text-align:center;padding:32px">
        <div style="font-size:40px;margin-bottom:12px">🛋</div>
        <div class="title" style="margin-bottom:8px">Rest Day</div>
        <div class="text-muted">Recovery, mobility, and prep for Monday.</div>
      </div>`;
    app.appendChild(div);
  }
};

function renderZone2Logger(app, today, week) {
  let selectedActivity = PROGRAM.zone2.activities[0];
  let duration = 60;
  let notes = '';

  const div = document.createElement('div');
  div.className = 'view';
  div.innerHTML = `
    <div class="label mb8">TODAY · ${dayLabel(today)}</div>
    <div class="title mb8">Zone 2 Cardio</div>
    <div class="badge badge-z2" style="display:inline-block;margin-bottom:16px">AEROBIC</div>
    <div class="card" style="margin-bottom:16px">
      <div class="scheme-hint">${PROGRAM.zone2.structure}<br>${PROGRAM.zone2.note}</div>
    </div>
    <div class="section-title">Activity</div>
    <div class="z2-activities">
      ${PROGRAM.zone2.activities.map(a => `<button class="activity-btn${a === selectedActivity ? ' selected' : ''}" data-act="${a}">${a}</button>`).join('')}
    </div>
    <div class="section-title">Duration</div>
    <div class="flex-row mb12">
      <input type="number" class="input" id="z2-dur" value="${duration}" inputmode="numeric" style="width:80px">
      <span class="text-muted">min</span>
    </div>
    <div class="section-title">Notes (optional)</div>
    <textarea class="notes-input" id="z2-notes" placeholder="How did it feel?"></textarea>
    <button class="btn btn-primary" id="z2-save">Mark Complete</button>
  `;
  app.appendChild(div);

  div.querySelectorAll('.activity-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedActivity = btn.dataset.act;
      div.querySelectorAll('.activity-btn').forEach(b => b.classList.toggle('selected', b === btn));
    });
  });
  div.querySelector('#z2-dur').addEventListener('input', e => { duration = parseInt(e.target.value) || 60; });
  div.querySelector('#z2-notes').addEventListener('input', e => { notes = e.target.value; });
  div.querySelector('#z2-save').addEventListener('click', () => {
    addLog({
      id: generateId(), type: 'zone2', day: today, week,
      date: todayISO(),
      activity: selectedActivity, duration, notes
    });
    showToast('Zone 2 session logged!');
    navigate('dashboard');
  });
}

function renderLiftLogger(app, today, week, meso, dayData) {
  const scheme = getCompoundScheme(week);
  const sets = scheme.sets || 4;
  const repsDefault = scheme.repsMax || 10;
  const compound = dayData.compound;
  const suggestedWeight = getSuggestedWeight(compound.name, week) || 135;
  const lastCompound = getLastLogForExercise(compound.name);

  // State — restore draft if it matches today's day + week
  const existingDraft = getDraft();
  const sessionState = (existingDraft && existingDraft.day === today && existingDraft.week === week)
    ? existingDraft.state
    : {
        compound: {
          exercise: compound.name,
          sets: Array.from({ length: sets }, (_, i) => ({
            setNum: i + 1, weight: suggestedWeight, reps: repsDefault, completed: false
          }))
        },
        supersets: {},
        rpe: null, notes: '', startTime: null, duration: 0
      };

  let timerInterval = null;

  function startTimer() {
    if (sessionState.startTime) return;
    sessionState.startTime = Date.now();
    timerInterval = setInterval(() => {
      sessionState.duration = Math.floor((Date.now() - sessionState.startTime) / 1000);
      const el = document.getElementById('log-timer');
      if (el) el.textContent = formatDuration(sessionState.duration);
    }, 1000);
  }

  // Init superset state
  const accScheme = getAccScheme(week);
  dayData.supersets.forEach((ss, ssIdx) => {
    const variant = ss[meso];
    if (!variant) return;
    sessionState.supersets[ssIdx] = {};
    variant.exercises.forEach((ex, exIdx) => {
      const suggested = getSuggestedWeight(ex.name, week) || '';
      sessionState.supersets[ssIdx][exIdx] = {
        exercise: ex.name,
        sets: Array.from({ length: accScheme.sets || 3 }, (_, i) => ({
          setNum: i + 1, weight: suggested, reps: accScheme.repsMax || 12, completed: false
        }))
      };
    });
  });

  function buildSetId(type, ss, ex, set) {
    return type === 'compound' ? `set-${set}` : `set-${ss}-${ex}-${set}`;
  }

  const div = document.createElement('div');
  div.className = 'view';

  function renderLog() {
    const allCompoundDone = sessionState.compound.sets.every(s => s.completed);
    const deloadBadge = isDeload(week) ? `<span class="badge badge-deload" style="margin-left:8px">DELOAD</span>` : '';

    let html = `
      <div class="flex-between mb12">
        <div>
          <div class="label">WEEK ${week} · ${dayLabel(today)}</div>
          <div class="title" style="font-size:18px">${dayData.name}</div>
        </div>
        <div class="timer-badge" id="log-timer">0:00</div>
      </div>

      <!-- COMPOUND -->
      <div class="card" style="margin-bottom:16px">
        <div class="exercise-header">
          <div>
            <div class="badge badge-compound" style="margin-bottom:6px">COMPOUND${deloadBadge}</div>
            <div class="exercise-name">${compound.name}</div>
            <div class="exercise-sub">${compound.note}</div>
          </div>
        </div>
        <div class="scheme-hint">
          ${sets} sets · ${scheme.repsMin}–${scheme.repsMax} reps · ${scheme.rpe ? `RPE ${scheme.rpe}` : ''}
          ${scheme.note ? `<br><span style="color:var(--orange)">${scheme.note}</span>` : ''}
        </div>
        ${lastCompound ? `<div class="last-session">Last: <strong>${lastCompound.sets.map(s => s.weight && s.completed ? `${s.weight}×${s.reps}` : '').filter(Boolean).join(', ')}</strong></div>` : ''}
        <div id="compound-sets">
          ${sessionState.compound.sets.map((s, i) => renderSetRow('compound', 0, i, s)).join('')}
        </div>
        <div id="apply-all-compound" style="display:none" class="apply-all-bar">
          <span class="text-sm text-muted">Apply ${sessionState.compound.sets[0].weight} lbs to all sets?</span>
          <button onclick="applyAllCompound()">Apply All</button>
        </div>
      </div>`;

    // Supersets
    dayData.supersets.forEach((ss, ssIdx) => {
      const variant = ss[meso];
      if (!variant) return;
      const ssState = sessionState.supersets[ssIdx];
      const ssClass = ['badge-ss-a','badge-ss-b','badge-ss-c'][ssIdx] || 'badge-ss-a';
      html += `<div class="ss-block">
        <div class="ss-header">
          <span class="badge ${ssClass}">${ss.label}</span>
          <span class="ss-rest">${ss.restLabel}</span>
        </div>`;

      variant.exercises.forEach((ex, exIdx) => {
        const exState = ssState?.[exIdx];
        if (!exState) return;
        const lastEx = getLastLogForExercise(ex.name);
        html += `
          <div class="exercise-block">
            <div class="exercise-header">
              <div>
                ${ex.isUnilateral ? `<span class="badge badge-uni" style="margin-bottom:4px">${ex.uniLabel}</span><br>` : ''}
                <div class="exercise-name">${ex.letter}. ${ex.name}</div>
                <div class="exercise-sub">${ex.sub}</div>
              </div>
            </div>
            <div class="scheme-hint">${accScheme.sets || 3} sets · ${ex.setsLabel}</div>
            ${lastEx ? `<div class="last-session">Last: <strong>${lastEx.sets.filter(s=>s.completed&&s.weight).map(s=>`${s.weight}×${s.reps}`).join(', ')}</strong></div>` : ''}
            <div id="ss-sets-${ssIdx}-${exIdx}">
              ${exState.sets.map((s, i) => renderSetRow('ss', ssIdx, i, s, exIdx)).join('')}
            </div>
          </div>`;
        if (exIdx < variant.exercises.length - 1) html += `<div class="ss-divider"></div>`;
      });
      html += `</div>`;
    });

    // Session footer
    html += `
      <div class="session-footer" id="session-footer" style="display:${allCompoundDone ? 'block' : 'none'}">
        <div class="section-title">Rate this session (RPE)</div>
        <div class="rpe-selector">
          ${[5,6,7,8,9,10].map(r => `<button class="rpe-btn${sessionState.rpe === r ? ' selected-rpe' : ''}" onclick="setRPE(${r})">${r}</button>`).join('')}
        </div>
        <div class="section-title">Notes</div>
        <textarea class="notes-input" id="session-notes" placeholder="How did it feel?">${sessionState.notes}</textarea>
        <div class="duration-row">
          <div class="label" style="margin:0">Duration</div>
          <div class="duration-time" id="log-timer-footer">${formatDuration(sessionState.duration)}</div>
        </div>
        <button class="btn btn-primary" id="save-session">Save Workout</button>
      </div>`;

    div.innerHTML = html;
    attachLogEvents();
  }

  function renderSetRow(type, ssIdx, setIdx, s, exIdx) {
    const id = buildSetId(type, ssIdx, exIdx ?? '', setIdx);
    return `
      <div class="set-row${s.completed ? ' completed' : ''}" id="row-${id}">
        <div class="set-num">S${s.setNum}</div>
        <div class="set-weight-group">
          <button class="adj-btn" data-type="${type}" data-ss="${ssIdx}" data-ex="${exIdx ?? ''}" data-set="${setIdx}" data-adj="-5">−</button>
          <input type="number" class="weight-input" inputmode="decimal"
            value="${s.weight || ''}" placeholder="—"
            data-type="${type}" data-ss="${ssIdx}" data-ex="${exIdx ?? ''}" data-set="${setIdx}"
            id="wi-${id}">
          <button class="adj-btn" data-type="${type}" data-ss="${ssIdx}" data-ex="${exIdx ?? ''}" data-set="${setIdx}" data-adj="+5">+</button>
          <span class="weight-unit">lbs</span>
        </div>
        <input type="number" class="rep-input" inputmode="numeric"
          value="${s.reps || ''}" placeholder="—"
          data-type="${type}" data-ss="${ssIdx}" data-ex="${exIdx ?? ''}" data-set="${setIdx}"
          id="ri-${id}">
        <span class="rep-label">reps</span>
        <button class="check-btn${s.completed ? ' done' : ''}"
          data-type="${type}" data-ss="${ssIdx}" data-ex="${exIdx ?? ''}" data-set="${setIdx}"
          id="cb-${id}">✓</button>
      </div>`;
  }

  function getSetState(type, ssIdx, exIdx, setIdx) {
    if (type === 'compound') return sessionState.compound.sets[setIdx];
    return sessionState.supersets[ssIdx]?.[exIdx]?.sets[setIdx];
  }

  function attachLogEvents() {
    function parseSetCoords({ type, ss, ex, set }) {
      return [type, parseInt(ss), ex !== '' ? parseInt(ex) : undefined, parseInt(set)];
    }

    // Weight inputs
    div.querySelectorAll('.weight-input').forEach(input => {
      input.addEventListener('input', e => {
        const { type, set } = e.target.dataset;
        const s = getSetState(...parseSetCoords(e.target.dataset));
        if (s) {
          s.weight = parseFloat(e.target.value) || 0;
          saveDraft(today, week, sessionState);
          if (type === 'compound' && parseInt(set) === 0 && sessionState.compound.sets.length > 1) {
            const applyBar = div.querySelector('#apply-all-compound');
            if (applyBar) {
              applyBar.style.display = 'flex';
              applyBar.querySelector('span').textContent = `Apply ${s.weight} lbs to all sets?`;
            }
          }
        }
      });
    });

    // Rep inputs
    div.querySelectorAll('.rep-input').forEach(input => {
      input.addEventListener('input', e => {
        const s = getSetState(...parseSetCoords(e.target.dataset));
        if (s) {
          s.reps = parseInt(e.target.value) || 0;
          saveDraft(today, week, sessionState);
        }
      });
    });

    // Adj buttons
    div.querySelectorAll('.adj-btn').forEach(btn => {
      let pressTimer;
      const adjust = (mult = 1) => {
        const { type, ss, ex, set, adj } = btn.dataset;
        const s = getSetState(type, parseInt(ss), ex !== '' ? parseInt(ex) : undefined, parseInt(set));
        if (!s) return;
        const delta = adj === '-5' ? -5 * mult : 5 * mult;
        s.weight = Math.max(0, (s.weight || 0) + delta);
        const id = buildSetId(type, ss, ex, set);
        const wi = document.getElementById(`wi-${id}`);
        if (wi) wi.value = s.weight;
      };
      btn.addEventListener('click', () => adjust(1));
      btn.addEventListener('pointerdown', () => { pressTimer = setTimeout(() => adjust(0.5), 400); });
      btn.addEventListener('pointerup', () => clearTimeout(pressTimer));
      btn.addEventListener('pointerleave', () => clearTimeout(pressTimer));
    });

    // Check buttons
    div.querySelectorAll('.check-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const { type, ss, ex, set } = btn.dataset;
        const s = getSetState(...parseSetCoords(btn.dataset));
        if (!s) return;
        s.completed = !s.completed;
        saveDraft(today, week, sessionState);
        startTimer();
        const id = buildSetId(type, ss, ex, set);
        const row = document.getElementById(`row-${id}`);
        const cb = document.getElementById(`cb-${id}`);
        if (row) row.classList.toggle('completed', s.completed);
        if (cb) cb.classList.toggle('done', s.completed);
        const allDone = sessionState.compound.sets.every(s => s.completed);
        const footer = document.getElementById('session-footer');
        if (footer) footer.style.display = allDone ? 'block' : 'none';
      });
    });

    // Notes
    const notesEl = div.querySelector('#session-notes');
    if (notesEl) notesEl.addEventListener('input', e => {
      sessionState.notes = e.target.value;
      saveDraft(today, week, sessionState);
    });

    // Save
    const saveBtn = div.querySelector('#save-session');
    if (saveBtn) saveBtn.addEventListener('click', saveSession);
  }

  window.applyAllCompound = () => {
    const w = sessionState.compound.sets[0].weight;
    sessionState.compound.sets.forEach(s => { s.weight = w; });
    document.querySelectorAll('[data-type="compound"]').forEach(el => {
      if (el.classList.contains('weight-input')) el.value = w;
    });
    const applyBar = document.getElementById('apply-all-compound');
    if (applyBar) applyBar.style.display = 'none';
  };

  window.setRPE = (r) => {
    sessionState.rpe = r;
    document.querySelectorAll('.rpe-btn').forEach(b => {
      b.classList.toggle('selected-rpe', parseInt(b.textContent) === r);
    });
  };

  function saveSession() {
    if (timerInterval) clearInterval(timerInterval);
    sessionState.duration = sessionState.startTime
      ? Math.floor((Date.now() - sessionState.startTime) / 1000) : 0;

    const log = {
      id: generateId(),
      type: 'lift',
      day: today,
      week,
      date: todayISO(),
      compound: sessionState.compound,
      supersets: sessionState.supersets,
      rpe: sessionState.rpe,
      notes: sessionState.notes,
      duration: sessionState.duration
    };

    const prs = detectPRs(log);
    savePRs(prs);
    addLog(log);
    clearDraft();

    if (prs.length) {
      prs.forEach(pr => {
        showToast(`PR — ${pr.exercise}: ${pr.weight} lbs × ${pr.reps} (Est. 1RM: ${pr.estimated1RM} lbs)`, 4000);
      });
    } else {
      showToast('Workout saved!');
    }
    navigate('dashboard');
  }

  renderLog();
  app.appendChild(div);
}

// ═══════════════════════════════════════════════════
// VIEW: HISTORY
// ═══════════════════════════════════════════════════
VIEWS['history'] = function(app) {
  let filter = 'all';
  let expanded = null;

  function render() {
    const logs = getLogs().slice().reverse();
    const filtered = filter === 'all' ? logs
      : filter === 'z2' ? logs.filter(l => l.type === 'zone2')
      : logs.filter(l => l.day === filter);

    const div = document.createElement('div');
    div.className = 'view';

    const filters = ['all', 'mon', 'wed', 'fri', 'sat', 'z2'];
    const filterLabels = { all: 'All', mon: 'Mon', wed: 'Wed', fri: 'Fri', sat: 'Sat', z2: 'Zone 2' };

    let html = `<div class="filter-strip">
      ${filters.map(f => `<button class="filter-btn${filter === f ? ' active' : ''}" data-filter="${f}">${filterLabels[f]}</button>`).join('')}
    </div>`;

    if (!filtered.length) {
      html += `<div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-text">No sessions yet.</div>
        <button class="btn btn-primary btn-sm" onclick="navigate('log')">Log First Workout</button>
      </div>`;
    } else {
      filtered.forEach(log => {
        let mainText = '';
        let subText = '';
        if (log.type === 'zone2') {
          mainText = 'Zone 2';
          subText = `${log.activity || ''} · ${log.duration || 60} min`;
        } else {
          mainText = log.compound?.exercise || 'Workout';
          const topSet = log.compound?.sets?.filter(s => s.completed).reduce((b, s) => s.weight > (b?.weight||0) ? s : b, null);
          subText = topSet?.weight ? `Top set: ${topSet.weight} lbs × ${topSet.reps}` : '';
        }
        const rpeDotHTML = log.rpe ? `<div class="rpe-dot" style="background:${rpeColor(log.rpe)}"></div>` : '';
        const isExp = expanded === log.id;

        html += `
          <div class="history-row" data-id="${log.id}">
            <div class="date-chip">${formatDate(log.date)}</div>
            <div style="flex:1;min-width:0">
              <div><span class="badge ${log.type === 'zone2' ? 'badge-z2' : dayBadgeClass(log.day)}">${log.type === 'zone2' ? 'Z2' : dayLabel(log.day)}</span></div>
              <div class="history-exercise mt4">${mainText}</div>
              <div class="history-sub">${subText}</div>
            </div>
            ${rpeDotHTML}
            <button class="btn btn-ghost btn-sm" data-del="${log.id}" style="color:var(--muted);padding:8px;min-height:40px">✕</button>
          </div>`;

        if (isExp && log.type !== 'zone2') {
          html += `<div class="history-detail">`;
          if (log.compound) {
            html += `<div class="bold mb8">${log.compound.exercise}</div>`;
            log.compound.sets?.forEach(s => {
              if (s.completed) html += `<div class="text-sm">Set ${s.setNum}: ${s.weight} lbs × ${s.reps} reps</div>`;
            });
          }
          Object.values(log.supersets || {}).forEach(ss => {
            Object.values(ss).forEach(ex => {
              if (ex.sets?.some(s => s.completed && s.weight)) {
                html += `<div class="bold mt8 mb4">${ex.exercise}</div>`;
                ex.sets.forEach(s => {
                  if (s.completed && s.weight) html += `<div class="text-sm">Set ${s.setNum}: ${s.weight} lbs × ${s.reps}</div>`;
                });
              }
            });
          });
          if (log.rpe) html += `<div class="text-sm mt8 text-muted">RPE ${log.rpe}</div>`;
          if (log.notes) html += `<div class="text-sm mt4 text-muted">${log.notes}</div>`;
          html += `</div>`;
        }
      });
    }

    div.innerHTML = html;
    app.innerHTML = '';
    app.appendChild(div);

    div.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => { filter = btn.dataset.filter; render(); });
    });
    div.querySelectorAll('.history-row').forEach(row => {
      row.addEventListener('click', e => {
        if (e.target.closest('[data-del]')) return;
        const id = row.dataset.id;
        expanded = expanded === id ? null : id;
        render();
      });
    });
    div.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (confirm('Delete this session?')) {
          deleteLog(btn.dataset.del);
          render();
        }
      });
    });
  }

  render();
};

// ═══════════════════════════════════════════════════
// VIEW: PROGRESS
// ═══════════════════════════════════════════════════
VIEWS['progress'] = function(app) {
  const div = document.createElement('div');
  div.className = 'view';
  const meta = getMeta();
  const logs = getLogs();

  const big4 = [
    { name: 'Back Squat', short: 'Squat' },
    { name: 'Barbell Bench Press', short: 'Bench' },
    { name: 'Conventional / Sumo Deadlift', short: 'Deadlift' },
    { name: 'Standing Overhead Press', short: 'OHP' }
  ];

  // PR Board
  let prHTML = `<div class="section-title">Personal Records</div><div class="pr-grid">`;
  big4.forEach(lift => {
    const pr = meta?.maxes?.[lift.name];
    const e1rm = pr ? estimateMax(pr.weight, pr.reps || 1) : null;
    prHTML += `
      <div class="pr-card">
        <div class="pr-lift">${lift.short}</div>
        <div class="pr-weight">${pr ? `${pr.weight}<span>lbs</span>` : '—'}</div>
        ${e1rm ? `<div class="pr-e1rm">~${e1rm} lbs 1RM</div>` : ''}
        ${pr?.date ? `<div class="pr-date">${formatDate(pr.date)}</div>` : ''}
      </div>`;
  });
  prHTML += `</div>`;

  // Per-lift SVG charts
  let chartsHTML = `<div class="section-title">Strength Trend</div>`;
  big4.forEach(lift => {
    const exerciseLogs = logs.filter(l => l.compound?.exercise === lift.name);
    const points = exerciseLogs.map(l => {
      const topSet = l.compound?.sets?.filter(s => s.completed).reduce((b, s) => s.weight > (b?.weight||0) ? s : b, null);
      return topSet ? { w: topSet.weight, date: l.date } : null;
    }).filter(Boolean);

    let svgContent = '<div class="text-muted text-sm" style="padding:16px 0">No data yet — log some sessions!</div>';
    if (points.length >= 2) {
      const W = 300, H = 80;
      const weights = points.map(p => p.w);
      const minY = Math.min(...weights), maxY = Math.max(...weights);
      const range = maxY - minY || 10;
      const pts = points.map((p, i) => {
        const x = 10 + (i / (points.length - 1)) * (W - 20);
        const y = H - 8 - ((p.w - minY) / range) * (H - 20);
        return { x, y, w: p.w };
      });
      const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      svgContent = `
        <svg viewBox="0 0 ${W} ${H}" class="chart-svg" style="height:80px">
          <path d="${pathD}" fill="none" stroke="var(--red)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          ${pts.map(p => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="var(--red)"/>`).join('')}
          <text x="2" y="${H - 4}" fill="var(--muted)" font-size="9">${minY}</text>
          <text x="${W - 30}" y="${H - 4}" fill="var(--muted)" font-size="9">${maxY} lbs</text>
        </svg>`;
    }
    chartsHTML += `
      <div class="chart-container">
        <div class="chart-title">${lift.name}</div>
        ${svgContent}
      </div>`;
  });

  // Weekly volume
  const weeklyVolume = {};
  logs.forEach(l => {
    if (l.type === 'zone2') return;
    let sets = 0;
    const compound = l.compound?.sets?.filter(s => s.completed).length || 0;
    sets += compound;
    Object.values(l.supersets || {}).forEach(ss => {
      Object.values(ss).forEach(ex => { sets += ex.sets?.filter(s => s.completed).length || 0; });
    });
    if (sets > 0) weeklyVolume[l.week] = (weeklyVolume[l.week] || 0) + sets;
  });

  const weeks = Object.keys(weeklyVolume).map(Number).sort((a, b) => a - b).slice(-8);
  let volHTML = '';
  if (weeks.length >= 2) {
    const maxVol = Math.max(...weeks.map(w => weeklyVolume[w]));
    const W = 300, H = 60;
    const barW = Math.floor((W - 20) / weeks.length) - 4;
    const bars = weeks.map((w, i) => {
      const h = Math.max(4, ((weeklyVolume[w] / maxVol) * (H - 16)));
      const x = 10 + i * ((W - 20) / weeks.length);
      const y = H - 8 - h;
      return `<rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="2" fill="var(--red)" opacity="0.7"/>
              <text x="${x + barW/2}" y="${H}" fill="var(--muted)" font-size="8" text-anchor="middle">W${w}</text>`;
    }).join('');
    volHTML = `
      <div class="section-title">Weekly Volume (sets)</div>
      <div class="chart-container">
        <svg viewBox="0 0 ${W} ${H + 10}" class="chart-svg" style="height:70px">${bars}</svg>
      </div>`;
  }

  // Bodyweight
  const bwEntries = (meta?.bodyweight || []).slice(-6).reverse();
  let bwHTML = `
    <div class="section-title">Bodyweight</div>
    <div class="card">
      <div class="flex-row mb12">
        <input type="number" class="input" id="bw-input" placeholder="lbs" inputmode="decimal" style="flex:1">
        <button class="btn btn-secondary btn-sm" id="bw-save" style="width:auto">Save</button>
      </div>
      ${bwEntries.map(e => `
        <div class="bw-entry">
          <span class="bw-entry-date">${formatDate(e.date)}</span>
          <span class="bw-entry-weight">${e.weight} lbs</span>
        </div>`).join('')}
    </div>`;

  div.innerHTML = prHTML + chartsHTML + volHTML + bwHTML;
  app.appendChild(div);

  div.querySelector('#bw-save').addEventListener('click', () => {
    const val = parseFloat(div.querySelector('#bw-input').value);
    if (!val) return;
    const m = getMeta();
    if (!m.bodyweight) m.bodyweight = [];
    m.bodyweight.push({ weight: val, date: todayISO() });
    saveMeta(m);
    showToast('Bodyweight saved');
    VIEWS['progress'](app);
  });
};

// ═══════════════════════════════════════════════════
// VIEW: PROGRAM
// ═══════════════════════════════════════════════════
VIEWS['program'] = function(app) {
  const week = getCurrentWeek();
  let selectedWeek = week;
  let selectedDay = 'mon';

  function render() {
    const div = document.createElement('div');
    div.className = 'view';
    const meso = getMesoId(selectedWeek);
    const deload = isDeload(selectedWeek);
    const dayData = PROGRAM.days[selectedDay];

    // Mesocycle cards
    let mesoHTML = `<div class="meso-cards">`;
    PROGRAM.meta.mesocycles.forEach(m => {
      const isActive = m.id === getMesoId(week);
      mesoHTML += `
        <div class="meso-card${isActive ? ' active' : ''}">
          <div class="meso-card-id">${m.id.toUpperCase()}</div>
          <div class="meso-card-label">${m.label}</div>
          <div class="meso-card-weeks">Wk ${m.weeks[0]}–${m.weeks[m.weeks.length-1]}</div>
        </div>`;
    });
    mesoHTML += `</div>`;

    // Week grid
    let weekHTML = `<div class="section-title">Select Week</div><div class="week-grid">`;
    for (let w = 1; w <= 12; w++) {
      const isCurrent = w === week;
      const isDl = PROGRAM.meta.deloadWeeks.includes(w);
      const isSel = w === selectedWeek;
      weekHTML += `<div class="week-cell${isCurrent ? ' current' : ''}${isDl ? ' deload' : ''}${isSel ? ' selected' : ''}" data-week="${w}">${w}${isDl ? '*' : ''}</div>`;
    }
    weekHTML += `</div>`;

    // Day tabs
    let tabHTML = `<div class="day-tabs">`;
    ['mon', 'wed', 'fri', 'sat'].forEach(d => {
      tabHTML += `<button class="day-tab${d === selectedDay ? ' active' : ''}" data-day="${d}">${dayLabel(d)}</button>`;
    });
    tabHTML += `</div>`;

    // Program detail
    const scheme = getCompoundScheme(selectedWeek);
    const compound = dayData.compound;

    let detailHTML = `
      <div class="card" style="margin-bottom:16px">
        <div class="badge badge-compound" style="margin-bottom:8px">COMPOUND${deload ? ' · DELOAD' : ''}</div>
        <div class="exercise-name">${compound.name}</div>
        <div class="exercise-sub">${compound.note}</div>
        <div class="scheme-hint mt8">
          ${scheme.sets} sets · ${scheme.repsMin}–${scheme.repsMax} reps
          ${scheme.rpe ? ` · RPE ${scheme.rpe}` : ''}
          ${scheme.note ? `<br><span style="color:var(--orange)">${scheme.note}</span>` : ''}
        </div>
      </div>`;

    // Progression tracker
    detailHTML += `<div class="section-title">Progression (M1 → M3)</div>
      <div class="progression-track">`;
    PROGRAM.meta.mesocycles.forEach(m => {
      const s = PROGRAM.schemes.compound[m.id];
      const active = m.id === meso && !deload;
      detailHTML += `
        <div class="prog-step${active ? ' active' : ''}">
          <div class="prog-step-id">${m.id.toUpperCase()}</div>
          <div class="prog-step-sets">${s.sets}×</div>
          <div class="prog-step-reps">${s.repsMin}–${s.repsMax}</div>
        </div>`;
    });
    detailHTML += `</div>`;

    // Supersets
    dayData.supersets.forEach((ss, idx) => {
      const variant = ss[meso];
      if (!variant) return;
      const ssClass = ['badge-ss-a','badge-ss-b','badge-ss-c'][idx];
      detailHTML += `
        <div class="ss-block">
          <div class="ss-header">
            <span class="badge ${ssClass}">${ss.label}</span>
            <span class="ss-rest">${ss.restLabel}</span>
          </div>`;
      variant.exercises.forEach((ex, ei) => {
        detailHTML += `
          <div class="exercise-block">
            <div class="exercise-header">
              <div>
                ${ex.isUnilateral ? `<span class="badge badge-uni" style="margin-bottom:4px">${ex.uniLabel}</span><br>` : ''}
                <div class="exercise-name">${ex.letter}. ${ex.name}</div>
                <div class="exercise-sub">${ex.sub}</div>
              </div>
            </div>
            <div class="scheme-hint">${ex.setsLabel}</div>
            <div class="text-xs text-muted">${variant.equip[ei] || ''}</div>
          </div>`;
        if (ei < variant.exercises.length - 1) detailHTML += `<div class="ss-divider"></div>`;
      });
      detailHTML += `</div>`;
    });

    div.innerHTML = mesoHTML + weekHTML + tabHTML + detailHTML;
    app.innerHTML = '';
    app.appendChild(div);

    div.querySelectorAll('.week-cell').forEach(cell => {
      cell.addEventListener('click', () => { selectedWeek = parseInt(cell.dataset.week); render(); });
    });
    div.querySelectorAll('.day-tab').forEach(tab => {
      tab.addEventListener('click', () => { selectedDay = tab.dataset.day; render(); });
    });
  }

  render();
};

// ═══════════════════════════════════════════════════
// VIEW: SETTINGS
// ═══════════════════════════════════════════════════
VIEWS['settings'] = function(app) {
  const meta = getMeta();
  const div = document.createElement('div');
  div.className = 'view';

  const maxLifts = [
    'Back Squat', 'Barbell Bench Press', 'Conventional / Sumo Deadlift', 'Standing Overhead Press'
  ];

  let html = `
    <div class="title mb12">Settings</div>

    <div class="settings-section">
      <div class="section-title">Program</div>
      <div class="settings-row">
        <div class="settings-row-label">Start Date</div>
        <input type="date" class="input" id="start-date-input" value="${meta?.programStartDate || ''}" style="width:auto;flex:0 0 auto">
      </div>
    </div>

    <div class="settings-section">
      <div class="section-title">1RM Maxes</div>
      ${maxLifts.map(lift => `
        <div class="settings-row">
          <div class="settings-row-label" style="flex:1">${lift}</div>
          <input type="number" class="input" style="width:80px;flex:0 0 auto"
            inputmode="decimal" placeholder="lbs"
            data-max="${lift}" value="${meta?.maxes?.[lift]?.weight || ''}">
        </div>`).join('')}
      <button class="btn btn-secondary btn-sm mt12" id="save-maxes">Save Maxes</button>
    </div>

    <div class="settings-section">
      <div class="section-title">Data</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <button class="btn btn-secondary" id="export-btn">Export to JSON</button>
        <button class="btn btn-secondary" id="import-btn">Import from JSON</button>
        <input type="file" id="import-file" accept=".json" style="display:none">
      </div>
      <div class="mt16">
        <div class="section-title">Danger Zone</div>
        <div class="form-group">
          <label class="form-label">Type RESET to confirm</label>
          <div class="confirm-input-row">
            <input type="text" class="input" id="reset-confirm" placeholder="RESET">
            <button class="btn btn-danger btn-sm" id="reset-btn">Clear All Data</button>
          </div>
        </div>
      </div>
    </div>

    <div class="settings-section" style="border-bottom:none">
      <div class="text-muted text-sm text-center" style="padding:8px 0">
        Lift Tracker v1.0 · lift.ddumont.dev<br>
        All data stored locally in your browser.
      </div>
    </div>`;

  div.innerHTML = html;
  app.appendChild(div);

  div.querySelector('#start-date-input').addEventListener('change', e => {
    const m = getMeta() || {};
    m.programStartDate = e.target.value;
    saveMeta(m);
    showToast('Start date updated');
  });

  div.querySelector('#save-maxes').addEventListener('click', () => {
    const m = getMeta() || {};
    if (!m.maxes) m.maxes = {};
    maxLifts.forEach(lift => {
      const input = div.querySelector(`[data-max="${lift}"]`);
      const val = parseFloat(input.value);
      if (val) m.maxes[lift] = { weight: val, reps: 1, date: todayISO() };
    });
    saveMeta(m);
    showToast('Maxes saved');
  });

  div.querySelector('#export-btn').addEventListener('click', exportData);

  div.querySelector('#import-btn').addEventListener('click', () => {
    div.querySelector('#import-file').click();
  });

  div.querySelector('#import-file').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      if (importData(ev.target.result)) {
        showToast('Data imported successfully');
        navigate('dashboard');
      } else {
        showToast('Import failed — invalid file');
      }
    };
    reader.readAsText(file);
  });

  div.querySelector('#reset-btn').addEventListener('click', () => {
    const val = div.querySelector('#reset-confirm').value;
    if (val !== 'RESET') { showToast('Type RESET to confirm'); return; }
    localStorage.removeItem(STORAGE_KEYS.meta);
    localStorage.removeItem(STORAGE_KEYS.logs);
    showToast('All data cleared');
    navigate('onboarding');
  });
};
