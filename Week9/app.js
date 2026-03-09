// ===== STATE =====
const STORAGE_KEY = 'cvnp2646_w9_progress';

const state = {
  completedMissions: new Set(),
  currentMission: 0,
  pyodide: null,
  pyodideReady: false,
  editors: {},
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    state.completedMissions = new Set(saved.completedMissions || []);
    state.currentMission = saved.currentMission ?? 0;
  } catch (e) {
    console.warn('Could not load saved state:', e);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    completedMissions: [...state.completedMissions],
    currentMission: state.currentMission,
  }));
}

// ===== MISSION METADATA =====
const MISSIONS = [
  { id: 0, key: 'ORIENTATION',     label: '00\nORIENT',    icon: '⬡' },
  { id: 1, key: 'DATETIME_TOOLS',  label: '01\nDATETIME',  icon: '⬡' },
  { id: 2, key: 'LIST_FILTER',     label: '02\nFILTER',    icon: '⬡' },
  { id: 3, key: 'SCORE_FACTORS',   label: '03\nSCORING',   icon: '⬡' },
  { id: 4, key: 'PATCH_AGE_GATE',  label: '04\nPATCH AGE', icon: '⬡' },
  { id: 5, key: 'RISK_SIMULATOR',  label: '05\nSIMULATE',  icon: '⬡' },
  { id: 6, key: 'FINAL_CHALLENGE', label: '06\nCHALLENGE', icon: '⬡' },
];

// ===== MISSION MAP RENDER =====
function renderMissionMap() {
  const nav = document.getElementById('mission-map');
  nav.innerHTML = '';
  MISSIONS.forEach(function(mission, i) {
    if (i > 0) {
      const conn = document.createElement('div');
      conn.className = 'mission-node-connector' + (state.completedMissions.has(i - 1) ? ' completed' : '');
      nav.appendChild(conn);
    }
    const isCompleted = state.completedMissions.has(mission.id);
    const isActive    = mission.id === state.currentMission;
    const isLocked    = mission.id > state.currentMission;
    const node = document.createElement('button');
    node.className = 'mission-node ' + (isCompleted ? 'completed' : isActive ? 'active' : 'locked');
    node.setAttribute('aria-label', 'Mission ' + mission.id + ': ' + mission.key);
    node.disabled = isLocked;
    node.innerHTML =
      '<div class="mission-icon">' + (isCompleted ? '✓' : String(mission.id).padStart(2, '0')) + '</div>' +
      '<div class="mission-label">' + mission.label + '</div>';
    node.addEventListener('click', function() {
      if (!isLocked) navigateToMission(mission.id);
    });
    nav.appendChild(node);
  });
}

// ===== PROGRESS BAR =====
function updateProgress() {
  const pct = (state.completedMissions.size / MISSIONS.length) * 100;
  document.getElementById('progress-bar-fill').style.width = pct + '%';
  document.getElementById('progress-label').textContent =
    state.completedMissions.size + ' / ' + MISSIONS.length + ' MISSIONS COMPLETE';
}

// ===== NAVIGATE =====
function navigateToMission(id) {
  state.currentMission = id;
  saveState();
  renderMissionMap();
  updateProgress();
  renderMission(id);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== COMPLETE MISSION =====
function completeMission(id) {
  state.completedMissions.add(id);
  saveState();
  const content = document.getElementById('mission-content');
  content.classList.add('unlock-flash');
  setTimeout(function() { content.classList.remove('unlock-flash'); }, 700);
  const nextId = id + 1;
  if (nextId < MISSIONS.length) {
    showBriefing(BRIEFINGS[nextId], function() { navigateToMission(nextId); });
  } else {
    showBriefing('OPERATION COMPLETE. Patch risk prioritization system is online. The compliance report is ready. Outstanding work, Analyst.', null);
    renderMissionMap();
    updateProgress();
  }
}

// ===== COMMANDER ZHANG BRIEFINGS =====
const BRIEFINGS = [
  'Welcome to CVNP Patch Compliance Operations. Twenty hosts. Limited bandwidth. You cannot patch everything at once. Before you build the risk scorer, understand what drives the score.',
  'Good. Now master the datetime module. Every patch age calculation starts here — strptime parses the date string, timedelta gives you the day count.',
  'Datetime tools confirmed. Now learn to filter lists of host dicts. The risk scorer relies on list comprehensions to isolate the systems that matter.',
  'Filtering solid. Now internalize all six scoring factors. You must know each one before you can implement them correctly.',
  'Scoring logic understood. Now implement the first function in your pipeline: calculate_days_since_patch.',
  'Patch age function verified. Run the risk simulator. See how different system profiles produce radically different scores.',
  'Three final challenges stand between you and a working patch prioritization system. Pass all three to complete the operation.',
];

let briefingInterval = null;

function showBriefing(text, callback) {
  const panel = document.getElementById('briefing-panel');
  const textEl = document.getElementById('briefing-text');
  panel.classList.remove('hidden');
  textEl.textContent = '';
  let i = 0;
  if (briefingInterval) clearInterval(briefingInterval);
  briefingInterval = setInterval(function() {
    if (i < text.length) {
      textEl.textContent += text[i];
      i++;
    } else {
      clearInterval(briefingInterval);
      if (callback) setTimeout(callback, 800);
    }
  }, 28);
}

// ===== PYODIDE INIT =====
async function initPyodide() {
  const loader = document.getElementById('pyodide-loader');
  if (loader) loader.classList.remove('hidden');
  try {
    state.pyodide = await loadPyodide();
    state.pyodideReady = true;
    console.log('Pyodide ready');
    if (loader) {
      loader.textContent = '✓ Python engine ready';
      setTimeout(function() { loader.classList.add('hidden'); }, 2000);
    }
  } catch (e) {
    console.error('Pyodide failed to load:', e);
    if (loader) {
      loader.textContent = '⚠ Python engine failed to load';
      loader.style.color = 'var(--red-alert)';
    }
  }
}

// ===== CODEMIRROR HELPER =====
function createEditor(textareaId, initialCode) {
  const ta = document.getElementById(textareaId);
  if (!ta) return null;
  const editor = CodeMirror.fromTextArea(ta, {
    mode: 'python',
    theme: 'dracula',
    lineNumbers: true,
    indentUnit: 4,
    tabSize: 4,
    indentWithTabs: false,
    extraKeys: { Tab: function(cm) { cm.execCommand('indentMore'); } },
    viewportMargin: Infinity,
  });
  if (initialCode) editor.setValue(initialCode);
  state.editors[textareaId] = editor;
  return editor;
}

// ===== PYODIDE RUNNER =====
async function runCode(editorId, outputId, validator) {
  if (!state.pyodideReady) {
    document.getElementById(outputId).textContent = 'Python is still loading. Please wait a moment and try again.';
    return false;
  }
  const editor = state.editors[editorId];
  const code = editor ? editor.getValue() : '';
  const outputEl = document.getElementById(outputId);
  outputEl.textContent = 'Running...';
  outputEl.className = 'gate-output';
  try {
    state.pyodide.runPython(
      'import sys, io\n' +
      '_old_stdout = sys.stdout\n' +
      'sys.stdout = io.StringIO()\n'
    );
    state.pyodide.runPython(code);
    const stdout = state.pyodide.runPython('sys.stdout.getvalue()');
    state.pyodide.runPython('sys.stdout = _old_stdout');
    outputEl.textContent = stdout || '(no output)';
    const passed = validator(stdout, code);
    outputEl.className = 'gate-output ' + (passed ? 'pass' : 'fail');
    return passed;
  } catch (err) {
    try { state.pyodide.runPython('sys.stdout = _old_stdout'); } catch(e2) {}
    outputEl.textContent = '⚠ ERROR:\n' + err.message;
    outputEl.className = 'gate-output fail';
    return false;
  }
}

// ===== COPY BUTTON HELPER =====
function copyCode(btn) {
  const block = btn.closest('.code-block');
  const pre = block ? block.querySelector('pre') : null;
  const text = pre ? (pre.innerText || pre.textContent) : '';
  navigator.clipboard.writeText(text).then(function() {
    btn.textContent = 'COPIED';
    btn.style.background = 'var(--green-primary)';
    btn.style.color = 'var(--bg-deep)';
    setTimeout(function() {
      btn.textContent = 'COPY';
      btn.style.background = '';
      btn.style.color = '';
    }, 2000);
  });
}

// ===== HELPERS =====
function toggleHint(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('hidden');
}

function resetEditor(editorId, code) {
  const editor = state.editors[editorId];
  if (editor) editor.setValue(code);
}

// ===== QUIZ SYSTEM =====
const quizState = {};

function answerQuiz(missionId, questionIdx, btn, isCorrect) {
  const questionEl = btn.closest('.quiz-question');
  questionEl.querySelectorAll('.quiz-option').forEach(function(b) {
    b.disabled = true;
    b.style.pointerEvents = 'none';
  });
  btn.classList.add(isCorrect ? 'correct' : 'wrong');
  if (!quizState[missionId]) quizState[missionId] = {};
  quizState[missionId][questionIdx] = isCorrect;
  checkQuizComplete(missionId);
}

function checkQuizComplete(missionId) {
  const answers = quizState[missionId] || {};
  const totalMap = { 0: 3, 1: 1, 2: 1, 3: 4, 4: 0, 5: 0, 6: 0 };
  const totalQuestions = totalMap[missionId] !== undefined ? totalMap[missionId] : 0;
  const answeredCount = Object.keys(answers).length;
  const allCorrect = Object.values(answers).every(Boolean);
  if (answeredCount < totalQuestions) return;
  if (totalQuestions === 0) return;
  const statusEl = document.getElementById('m' + missionId + '-status');
  if (!statusEl) return;
  if (allCorrect) {
    statusEl.innerHTML = '<span class="status-pass">✓ ALL CORRECT — MISSION 0' + missionId + ' COMPLETE</span>';
    setTimeout(function() { completeMission(missionId); }, 600);
  } else {
    statusEl.innerHTML = '<span class="status-fail">✗ Some answers were wrong. Re-read the panels above and refresh to try again.</span>';
  }
}

// ===== CARD VISIT TRACKER =====
const cardState = {};

function visitCard(missionKey, cardIdx, total) {
  const card = document.getElementById('card-' + missionKey + '-' + cardIdx);
  if (card) card.classList.add('visited');
  if (!cardState[missionKey]) cardState[missionKey] = new Set();
  cardState[missionKey].add(cardIdx);
  const statusEl = document.getElementById('card-' + missionKey + '-status');
  const count = cardState[missionKey].size;
  if (statusEl) statusEl.textContent = count + ' / ' + total + ' cards read';
  if (count >= total) {
    const qPanel = document.getElementById('m1-question-panel');
    if (qPanel) {
      qPanel.style.display = 'block';
      qPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

// ===== RENDER MISSION (dispatcher) =====
function renderMission(id) {
  document.title = 'MISSION ' + String(id).padStart(2,'0') + ' — ' + (MISSIONS[id] ? MISSIONS[id].key : '') + ' | OPERATION: PATCH ZERO';
  const container = document.getElementById('mission-content');
  const renderer = MISSION_RENDERERS[id];
  container.innerHTML = renderer ? renderer() : '<p style="color:var(--text-dim); padding:40px 0;">Mission ' + id + ' content loading...</p>';
  container.querySelectorAll('textarea[data-codemirror]').forEach(function(ta) {
    const initial = ta.dataset.initial || '';
    const decoded = initial.replace(/&#10;/g, '\n').replace(/&quot;/g, '"').replace(/\\\\/g, '\\');
    createEditor(ta.id, decoded);
  });
  if (id === 5) { if (typeof initMission5 === 'function') initMission5(); }
  var starterCodes = {
    4: function() {
      var ed = state.editors['gate-m4'];
      if (ed && window._m4StarterCode) ed.setValue(window._m4StarterCode);
    },
    6: function() {
      var starters = { 'gate-c1': window._c1StarterCode, 'gate-c2': window._c2StarterCode, 'gate-c3': window._c3StarterCode };
      Object.keys(starters).forEach(function(edId) {
        var ed = state.editors[edId];
        if (ed && starters[edId]) ed.setValue(starters[edId]);
      });
    }
  };
  if (starterCodes[id]) setTimeout(starterCodes[id], 50);
}

// ===== MISSION RENDERERS =====
const MISSION_RENDERERS = {};

// ===== BOOT =====
document.addEventListener('DOMContentLoaded', function() {
  loadState();
  renderMissionMap();
  updateProgress();
  renderMission(state.currentMission);
  showBriefing(BRIEFINGS[state.currentMission], null);
  const loader = document.createElement('div');
  loader.id = 'pyodide-loader';
  loader.textContent = '⟳ Loading Python engine...';
  document.body.appendChild(loader);
  initPyodide();
});


// ===================================================
// MISSION 00 — ORIENTATION
// ===================================================
MISSION_RENDERERS[0] = function() {
  return `
  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">What Is Patch Management Risk Scoring?</div>
    <p>You cannot patch every system immediately. Patch windows are limited. Security teams need a repeatable method to rank which systems pose the greatest unpatched risk right now.</p>
    <p>Multi-factor risk scoring combines patch age with business context — criticality, environment, and compliance tags — to produce a numeric score from 0 to 100. Higher scores demand earlier patching.</p>
    <div class="concept-grid">
      <div class="concept-card">
        <h3>The Problem</h3>
        <p>A system unpatched for 60 days means very different things for a dev VM versus a production payment server exposed to the internet. Single-factor rules miss this context entirely.</p>
      </div>
      <div class="concept-card">
        <h3>CIS Control 7</h3>
        <p>Continuous Vulnerability Management mandates defined patch timelines. Critical CVEs: 24-48 hours. High CVEs: 7-14 days. Medium: 30 days. Your score implements these timelines as point thresholds.</p>
      </div>
      <div class="concept-card">
        <h3>What You Will Build</h3>
        <p><code>patch_risk_scorer.py</code> — loads a JSON host inventory, calculates risk scores using 6 factors, filters high-risk systems, and exports a prioritization report.</p>
      </div>
      <div class="concept-card">
        <h3>The Pipeline</h3>
        <p>JSON file → <code>load_inventory()</code> → <code>analyze_inventory()</code> → <code>get_high_risk_hosts()</code> → JSON report + text summary.</p>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Orientation Check — 3 Questions</div>
    <p>Answer all three correctly to unlock Mission 01.</p>

    <div class="quiz-question" id="q0-0">
      <p><strong>Q1:</strong> Which Python module is used to parse date strings and calculate how many days have passed since a patch date?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">calendar</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, true)">datetime</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">time</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">dateutil</button>
      </div>
    </div>

    <div class="quiz-question" id="q0-1">
      <p><strong>Q2:</strong> CIS Control 7 recommends patching critical vulnerabilities within:</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">30 days</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">14 days</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">7 days</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, true)">24-48 hours</button>
      </div>
    </div>

    <div class="quiz-question" id="q0-2">
      <p><strong>Q3:</strong> A production database exposed to the internet has not been patched in 60 days. Compared to an identical development server, it should score:</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">The same — patch age is the only relevant factor</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">Lower — development servers handle more traffic</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, true)">Higher — production environment and internet exposure increase business risk</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">Lower — development servers have more dependencies</button>
      </div>
    </div>

    <div id="m0-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 01 — DATETIME_TOOLS
// ===================================================
MISSION_RENDERERS[1] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">The datetime Module</div>
    <p>Every patch age calculation requires converting a date string into a <code>datetime</code> object, then subtracting it from today. Python's built-in <code>datetime</code> module handles all of this with three lines of code.</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code>from datetime import datetime

# Parse a date string into a datetime object
last_patch = datetime.strptime("2024-08-15", "%Y-%m-%d")

# Get today's date and time
today = datetime.now()

# Calculate the difference — a timedelta object
delta = today - last_patch

# Extract the number of days as an integer
days = delta.days

print(f"Last patched {days} days ago")</code></pre>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Read All Four Datetime Cards</div>
    <p style="color:var(--text-dim); font-size:0.85em;">Click each card to read it. All four must be reviewed before the question unlocks.</p>
    <div class="concept-grid">
      <div class="concept-card" id="card-m1-0" onclick="visitCard('m1', 0, 4)">
        <h3>datetime.strptime()</h3>
        <p><strong>String Parse Time.</strong> Converts a date string to a datetime object using a format string. The format must match the string exactly — <code>strptime("2024-08-15", "%Y-%m-%d")</code> — or Python raises a ValueError.</p>
      </div>
      <div class="concept-card" id="card-m1-1" onclick="visitCard('m1', 1, 4)">
        <h3>datetime.now()</h3>
        <p>Returns the current local date and time as a datetime object. Use this to get "today" for your subtraction. In <code>analyze_inventory()</code>, call it once at the top of the loop — not once per host — so every host is compared to the same timestamp.</p>
      </div>
      <div class="concept-card" id="card-m1-2" onclick="visitCard('m1', 2, 4)">
        <h3>timedelta.days</h3>
        <p>Subtracting two datetime objects gives a <code>timedelta</code> object, not an integer. To get the integer day count, read the <code>.days</code> attribute: <code>(datetime.now() - patch_date).days</code>. This is always an <code>int</code>.</p>
      </div>
      <div class="concept-card" id="card-m1-3" onclick="visitCard('m1', 3, 4)">
        <h3>Format Codes</h3>
        <p><code>%Y</code> = 4-digit year (2024)<br><code>%m</code> = 2-digit month (01-12)<br><code>%d</code> = 2-digit day (01-31)<br><br>Use <code>"%Y-%m-%d"</code> for ISO dates like "2024-08-15". Codes must match the string's exact format.</p>
      </div>
    </div>
    <div id="card-m1-status" style="color:var(--text-dim); font-size:0.8em; margin-top:8px; letter-spacing:1px;">0 / 4 cards read</div>
  </div>

  <div class="panel" id="m1-question-panel" style="display:none">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Comprehension Check</div>
    <div class="quiz-question" id="q1-0">
      <p><strong>Q:</strong> Which expression correctly calculates the number of days since the date string "2024-06-15"?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, true)">(datetime.now() - datetime.strptime("2024-06-15", "%Y-%m-%d")).days</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">datetime.days("2024-06-15")</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">timedelta.parse("2024-06-15").days</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">(datetime.strptime("2024-06-15", "%Y-%m-%d") - datetime.now()).days</button>
      </div>
    </div>
    <div id="m1-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 02 — LIST_FILTER
// ===================================================
MISSION_RENDERERS[2] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Filtering Lists of Host Dicts</div>
    <p>Your host inventory is a <code>list[dict]</code>. List comprehensions are the clean Python way to filter it. Each pattern below produces a new list containing only the hosts that match your condition.</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code># Single condition — exact match
critical_hosts = [h for h in hosts if h['criticality'] == 'critical']

# Single condition — case-insensitive partial match
windows_hosts = [h for h in hosts if 'windows' in h['os'].lower()]

# Multiple conditions (AND) — both must be true
critical_prod = [h for h in hosts
                 if h['criticality'] == 'critical'
                 and h['environment'] == 'production']

# Tag check — use .get() to safely handle missing 'tags' key
pci_hosts = [h for h in hosts if 'pci-scope' in h.get('tags', [])]

# High-risk filter — after scores have been calculated
high_risk = [h for h in hosts if h.get('risk_score', 0) >= 50]</code></pre>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Safe Key Access with .get()</div>
    <p>Not every host dict will have every key. If a host lacks a <code>tags</code> key and you access <code>h['tags']</code>, Python raises a <code>KeyError</code> and your script crashes. Use <code>.get()</code> to provide a safe default instead.</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <pre><code># WRONG — crashes if 'tags' key is missing in any host
if 'pci-scope' in host['tags']:    # KeyError on hosts without tags

# CORRECT — returns [] when 'tags' key is absent
if 'pci-scope' in host.get('tags', []):    # always safe</code></pre>
    </div>
    <div class="hint-box">
      <strong>Rule of thumb:</strong> Use <code>host['key']</code> only when you are certain the key exists (e.g., <code>hostname</code>, <code>criticality</code> — always present). Use <code>host.get('key', default)</code> for optional fields like <code>tags</code>, <code>risk_score</code>, or custom annotations.
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Filter Check</div>
    <div class="quiz-question" id="q2-0">
      <p><strong>Q:</strong> What does <code>h.get('tags', [])</code> return when a host dict has no <code>'tags'</code> key at all?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">Raises a KeyError</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">Returns None</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, true)">Returns an empty list []</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">Returns the string 'tags'</button>
      </div>
    </div>
    <div id="m2-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 03 — SCORE_FACTORS
// ===================================================
MISSION_RENDERERS[3] = function() {
  return `
  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">The Six Scoring Factors</div>
    <p>Your risk scoring function accumulates points from six independent factors. The final score is capped at 100. Every factor must be evaluated for every host — they are additive, not exclusive.</p>

    <table>
      <thead>
        <tr><th>Factor</th><th>Condition</th><th>Points</th></tr>
      </thead>
      <tbody>
        <tr><td rowspan="4"><strong>Criticality</strong></td><td>critical</td><td>40</td></tr>
        <tr><td>high</td><td>25</td></tr>
        <tr><td>medium</td><td>10</td></tr>
        <tr><td>low</td><td>5</td></tr>
        <tr><td rowspan="4"><strong>Patch Age</strong></td><td>&gt;90 days</td><td>30</td></tr>
        <tr><td>&gt;60 days</td><td>20</td></tr>
        <tr><td>&gt;30 days</td><td>10</td></tr>
        <tr><td>≤30 days</td><td>0</td></tr>
        <tr><td rowspan="3"><strong>Environment</strong></td><td>production</td><td>15</td></tr>
        <tr><td>staging</td><td>8</td></tr>
        <tr><td>development</td><td>3</td></tr>
        <tr><td><strong>Tag: internet-facing</strong></td><td>present in tags list</td><td>+15</td></tr>
        <tr><td><strong>Tag: pci-scope</strong></td><td>present in tags list</td><td>+10</td></tr>
        <tr><td><strong>Tag: hipaa</strong></td><td>present in tags list</td><td>+10</td></tr>
      </tbody>
    </table>

    <div class="hint-box">
      <strong>Order matters for patch age:</strong> Always check <code>&gt;90</code> FIRST, then <code>&gt;60</code>, then <code>&gt;30</code>. Use <code>if / elif / elif</code> — never nested ifs — to ensure only one bracket applies per host.
    </div>

    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <pre><code># Example: high criticality, 65 days old, staging, hipaa tag
# 25 (high) + 20 (>60 days) + 8 (staging) + 10 (hipaa) = 63

# Example: critical, 95 days, production, internet-facing + pci-scope
# 40 + 30 + 15 + 15 + 10 = 110  →  capped at 100</code></pre>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Scoring Check — 4 Questions</div>
    <p>Answer all four correctly to unlock Mission 04.</p>

    <div class="quiz-question" id="q3-0">
      <p><strong>Q1:</strong> What is the criticality score for a system rated <code>"high"</code>?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">5</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">10</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, true)">25</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">40</button>
      </div>
    </div>

    <div class="quiz-question" id="q3-1">
      <p><strong>Q2:</strong> A system was last patched 65 days ago. How many patch-age points does it receive?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(3, 1, this, false)">0</button>
        <button class="quiz-option" onclick="answerQuiz(3, 1, this, false)">10</button>
        <button class="quiz-option" onclick="answerQuiz(3, 1, this, true)">20</button>
        <button class="quiz-option" onclick="answerQuiz(3, 1, this, false)">30</button>
      </div>
    </div>

    <div class="quiz-question" id="q3-2">
      <p><strong>Q3:</strong> What is the environment score for a <code>"staging"</code> system?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(3, 2, this, false)">3</button>
        <button class="quiz-option" onclick="answerQuiz(3, 2, this, true)">8</button>
        <button class="quiz-option" onclick="answerQuiz(3, 2, this, false)">10</button>
        <button class="quiz-option" onclick="answerQuiz(3, 2, this, false)">15</button>
      </div>
    </div>

    <div class="quiz-question" id="q3-3">
      <p><strong>Q4:</strong> A host with the <code>"internet-facing"</code> tag gets an additional bonus of:</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(3, 3, this, false)">+5</button>
        <button class="quiz-option" onclick="answerQuiz(3, 3, this, false)">+10</button>
        <button class="quiz-option" onclick="answerQuiz(3, 3, this, true)">+15</button>
        <button class="quiz-option" onclick="answerQuiz(3, 3, this, false)">+20</button>
      </div>
    </div>

    <div id="m3-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 04 — PATCH_AGE_GATE
// ===================================================
window._m4StarterCode = [
  'from datetime import datetime',
  '',
  'def calculate_days_since_patch(host):',
  '    """Parse last_patch_date from host dict and return integer days elapsed."""',
  '    patch_date = datetime.strptime(host[\'last_patch_date\'], \'%Y-%m-%d\')',
  '    delta = datetime.now() - patch_date',
  '    return delta.days',
  '',
  '# Test with two hosts — host1 was patched earlier so it should have more days',
  'host1 = {"hostname": "web-server-01", "last_patch_date": "2024-01-15"}',
  'host2 = {"hostname": "db-server-02",  "last_patch_date": "2024-08-01"}',
  '',
  'days1 = calculate_days_since_patch(host1)',
  'days2 = calculate_days_since_patch(host2)',
  '',
  'print(f"Type check: {type(days1).__name__}")',
  'print(f"web-server-01 days positive: {days1 > 0}")',
  'print(f"db-server-02 days positive: {days2 > 0}")',
  'print(f"web-server-01 patched longer ago: {days1 > days2}")',
  'print("calculate_days_since_patch verified" if type(days1).__name__ == \'int\' and days1 > 0 and days1 > days2 else "FAILED")',
].join('\n');

MISSION_RENDERERS[4] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">First Pipeline Function</div>
    <p><code>calculate_days_since_patch(host)</code> is the entry point to your risk scorer. It takes a host dict, parses the <code>last_patch_date</code> string, subtracts it from today, and returns an integer representing elapsed days.</p>
    <p>This value feeds directly into the patch-age scoring branch. The function must return an <strong>integer</strong> — not a float, not a timedelta object.</p>
    <div class="hint-box">
      <strong>The three-step pattern:</strong><br>
      1. <code>patch_date = datetime.strptime(host['last_patch_date'], '%Y-%m-%d')</code><br>
      2. <code>delta = datetime.now() - patch_date</code><br>
      3. <code>return delta.days</code>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Code Gate — calculate_days_since_patch</div>
    <p>The starter code below is already complete. Run it to verify it works, then experiment by changing the dates or adding print statements. The gate passes when all four checks print <code>True</code> and the final line says <code>calculate_days_since_patch verified</code>.</p>
    <textarea id="gate-m4" data-codemirror data-initial=""></textarea>
    <div class="btn-row" style="margin-top:12px; display:flex; gap:10px;">
      <button class="btn-run" onclick="runM4()">&#9654; RUN</button>
      <button class="btn-reset" onclick="resetEditor('gate-m4', window._m4StarterCode)">&#x21BA; RESET</button>
    </div>
    <div id="gate-m4-output" class="gate-output"></div>
    <div id="m4-status" class="gate-status"></div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Where This Fits in the Pipeline</div>
    <p>In <code>analyze_inventory()</code>, you call this function once per host and store the result. The scoring function reads <code>days_since_patch</code> directly from the dict — no recalculation needed.</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <pre><code>def analyze_inventory(hosts):
    for host in hosts:
        host['days_since_patch'] = calculate_days_since_patch(host)
        host['risk_score'] = calculate_risk_score(host)
        host['risk_level'] = get_risk_level(host['risk_score'])
    return hosts</code></pre>
    </div>
  </div>
  `;
};

async function runM4() {
  const passed = await runCode('gate-m4', 'gate-m4-output', function(stdout) {
    return stdout.includes('Type check: int') &&
           stdout.includes('web-server-01 days positive: True') &&
           stdout.includes('db-server-02 days positive: True') &&
           stdout.includes('web-server-01 patched longer ago: True') &&
           stdout.includes('calculate_days_since_patch verified');
  });
  const el = document.getElementById('m4-status');
  if (passed) {
    el.innerHTML = '<span class="status-pass">✓ All checks passed — MISSION 04 COMPLETE</span>';
    setTimeout(function() { completeMission(4); }, 800);
  } else {
    el.innerHTML = '<span class="status-fail">✗ Output must include all four True checks and "calculate_days_since_patch verified". Check strptime format and that you return delta.days (an int).</span>';
  }
}


// ===================================================
// MISSION 05 — RISK_SIMULATOR
// ===================================================
const riskSimState = { seenA: false, seenB: false, seenC: false };

const riskScenarios = {
  A: {
    label: 'prod-web-01',
    system: { hostname: 'prod-web-01', criticality: 'critical', days_since_patch: 95, environment: 'production', tags: ['internet-facing', 'pci-scope'] },
    breakdown: [
      ['Criticality (critical)',        40],
      ['Patch age (95 days  >  90)',    30],
      ['Environment (production)',      15],
      ['Tag: internet-facing',          15],
      ['Tag: pci-scope',                10],
    ],
    rawTotal: 110,
    cappedScore: 100,
    level: 'CRITICAL',
  },
  B: {
    label: 'dev-vm-03',
    system: { hostname: 'dev-vm-03', criticality: 'low', days_since_patch: 20, environment: 'development', tags: [] },
    breakdown: [
      ['Criticality (low)',              5],
      ['Patch age (20 days  <=  30)',    0],
      ['Environment (development)',      3],
    ],
    rawTotal: 8,
    cappedScore: 8,
    level: 'LOW',
  },
  C: {
    label: 'staging-api-02',
    system: { hostname: 'staging-api-02', criticality: 'high', days_since_patch: 65, environment: 'staging', tags: ['hipaa'] },
    breakdown: [
      ['Criticality (high)',            25],
      ['Patch age (65 days  >  60)',    20],
      ['Environment (staging)',          8],
      ['Tag: hipaa',                    10],
    ],
    rawTotal: 63,
    cappedScore: 63,
    level: 'HIGH',
  },
};

function simRiskLog(text, cls) {
  const term = document.getElementById('risk-sim-terminal');
  if (!term) return;
  const line = document.createElement('div');
  line.style.cssText = 'padding:2px 0; font-size:0.88em; font-family:var(--font);';
  if (cls === 'error') line.style.color = 'var(--red-alert)';
  else if (cls === 'success') line.style.color = 'var(--green-primary)';
  else if (cls === 'warn') line.style.color = 'var(--amber)';
  else if (cls === 'info') line.style.color = 'var(--blue-info)';
  line.textContent = text;
  term.appendChild(line);
  term.scrollTop = term.scrollHeight;
}

function simRiskClear() {
  const term = document.getElementById('risk-sim-terminal');
  if (term) term.innerHTML = '';
}

function runRiskScenario(key) {
  const s = riskScenarios[key];
  if (!s) return;
  simRiskClear();
  simRiskLog('>> Analyzing: ' + s.system.hostname, 'info');
  simRiskLog('   criticality     : ' + s.system.criticality, '');
  simRiskLog('   days_since_patch: ' + s.system.days_since_patch, '');
  simRiskLog('   environment     : ' + s.system.environment, '');
  simRiskLog('   tags            : [' + (s.system.tags.length ? s.system.tags.join(', ') : 'none') + ']', '');
  simRiskLog('', '');
  simRiskLog('>> Score breakdown:', 'info');
  s.breakdown.forEach(function(row) {
    var pts = row[1];
    var marker = pts > 0 ? ('+' + pts).padStart(4) : '  +0';
    simRiskLog('   ' + marker + '  pts   ' + row[0], pts > 0 ? '' : 'warn');
  });
  simRiskLog('         ─────────', '');
  if (s.rawTotal > 100) {
    simRiskLog('   raw total: ' + s.rawTotal + '  →  capped at 100', 'warn');
  }
  var levelColor = s.level === 'CRITICAL' ? 'error' : s.level === 'HIGH' ? 'warn' : s.level === 'LOW' ? 'success' : 'info';
  simRiskLog('   FINAL SCORE: ' + s.cappedScore + ' / 100   [' + s.level + ']', levelColor);

  riskSimState['seen' + key] = true;
  var checkEl = document.getElementById('sim-check-' + key);
  if (checkEl) {
    checkEl.style.color = 'var(--green-primary)';
    checkEl.textContent = '✓ ' + s.label;
  }
  simCheckRiskComplete();
}

function simCheckRiskComplete() {
  if (riskSimState.seenA && riskSimState.seenB && riskSimState.seenC) {
    var statusEl = document.getElementById('m5-status');
    if (statusEl) statusEl.innerHTML = '<span class="status-pass">✓ ALL SCENARIOS ANALYZED — MISSION 05 COMPLETE</span>';
    setTimeout(function() { completeMission(5); }, 800);
  }
}

function initMission5() {
  riskSimState.seenA = false;
  riskSimState.seenB = false;
  riskSimState.seenC = false;
}

MISSION_RENDERERS[5] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Risk Score Simulator</div>
    <p>Run each scenario to see the complete scoring breakdown. The simulator calculates exactly what your <code>calculate_risk_score()</code> function will produce — factor by factor. Analyze all three scenarios to unlock the final challenge.</p>
    <div class="concept-grid">
      <div class="concept-card">
        <h3>Scenario A</h3>
        <p><strong>prod-web-01</strong><br>criticality: critical<br>days unpatched: 95<br>environment: production<br>tags: internet-facing, pci-scope</p>
        <button class="btn-run" style="margin-top:14px; font-size:0.8em; padding:8px 16px;" onclick="runRiskScenario('A')">&#9654; ANALYZE</button>
      </div>
      <div class="concept-card">
        <h3>Scenario B</h3>
        <p><strong>dev-vm-03</strong><br>criticality: low<br>days unpatched: 20<br>environment: development<br>tags: none</p>
        <button class="btn-run" style="margin-top:14px; font-size:0.8em; padding:8px 16px;" onclick="runRiskScenario('B')">&#9654; ANALYZE</button>
      </div>
      <div class="concept-card">
        <h3>Scenario C</h3>
        <p><strong>staging-api-02</strong><br>criticality: high<br>days unpatched: 65<br>environment: staging<br>tags: hipaa</p>
        <button class="btn-run" style="margin-top:14px; font-size:0.8em; padding:8px 16px;" onclick="runRiskScenario('C')">&#9654; ANALYZE</button>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Analysis Terminal</div>
    <div id="risk-sim-terminal" style="background:var(--bg-editor); border:1px solid var(--border); border-radius:3px; padding:16px; min-height:180px; font-family:var(--font); font-size:0.88em; overflow-y:auto; max-height:400px; white-space:pre-wrap;"></div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Scenarios Completed</div>
    <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:8px;">
      <div id="sim-check-A" style="color:var(--text-dim);">&#9744; prod-web-01</div>
      <div id="sim-check-B" style="color:var(--text-dim);">&#9744; dev-vm-03</div>
      <div id="sim-check-C" style="color:var(--text-dim);">&#9744; staging-api-02</div>
    </div>
    <div id="m5-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 06 — FINAL_CHALLENGE
// ===================================================
window._c1StarterCode = [
  'from datetime import datetime',
  '',
  'def calculate_risk_score(host):',
  '    """',
  '    Calculate risk score (0-100) based on 6 factors:',
  '      - criticality: critical=40, high=25, medium=10, low=5',
  '      - patch age (days_since_patch): >90=30, >60=20, >30=10',
  '      - environment: production=15, staging=8, development=3',
  '      - tag "internet-facing": +15',
  '      - tag "pci-scope": +10',
  '      - tag "hipaa": +10',
  '    Cap at 100.',
  '    """',
  '    score = 0',
  '',
  '    # Criticality',
  '    crit_pts = {"critical": 40, "high": 25, "medium": 10, "low": 5}',
  '    score += crit_pts.get(host["criticality"], 0)',
  '',
  '    # Patch age — check highest bracket first',
  '    days = host.get("days_since_patch", 0)',
  '    if days > 90:',
  '        score += 30',
  '    elif days > 60:',
  '        score += 20',
  '    elif days > 30:',
  '        score += 10',
  '',
  '    # Environment',
  '    env_pts = {"production": 15, "staging": 8, "development": 3}',
  '    score += env_pts.get(host["environment"], 0)',
  '',
  '    # Tags',
  '    tags = host.get("tags", [])',
  '    if "internet-facing" in tags:',
  '        score += 15',
  '    if "pci-scope" in tags:',
  '        score += 10',
  '    if "hipaa" in tags:',
  '        score += 10',
  '',
  '    return min(score, 100)',
  '',
  '# Test: critical(40) + >90days(30) + production(15) + internet-facing(15) + pci-scope(10) = 110 -> capped 100',
  'test_host = {',
  '    "hostname": "prod-db-01",',
  '    "criticality": "critical",',
  '    "days_since_patch": 95,',
  '    "environment": "production",',
  '    "tags": ["internet-facing", "pci-scope"]',
  '}',
  'score = calculate_risk_score(test_host)',
  'print(f"Score: {score}")',
  'print(f"Capped at 100: {score == 100}")',
  'print("calculate_risk_score verified" if score == 100 else "FAILED - expected 100")',
].join('\n');

window._c2StarterCode = [
  'def get_risk_level(score):',
  '    """',
  '    Map numeric score to risk level string.',
  '    >= 70 -> "critical"',
  '    >= 50 -> "high"',
  '    >= 25 -> "medium"',
  '    else  -> "low"',
  '    """',
  '    if score >= 70:',
  '        return "critical"',
  '    elif score >= 50:',
  '        return "high"',
  '    elif score >= 25:',
  '        return "medium"',
  '    else:',
  '        return "low"',
  '',
  '# Test all key boundaries',
  'tests = [',
  '    (100, "critical"), (70, "critical"),',
  '    (69,  "high"),     (50, "high"),',
  '    (49,  "medium"),   (25, "medium"),',
  '    (24,  "low"),      (0,  "low"),',
  ']',
  '',
  'all_pass = True',
  'for score, expected in tests:',
  '    result = get_risk_level(score)',
  '    ok = result == expected',
  '    if not ok:',
  '        all_pass = False',
  '    status = "ok" if ok else "FAIL"',
  '    print(f"{status}  get_risk_level({score}) = \'{result}\' (expected \'{expected}\')")',
  '',
  'print()',
  'print("All tests passed!" if all_pass else "Some tests failed - check your boundaries")',
].join('\n');

window._c3StarterCode = [
  'def get_high_risk_hosts(hosts):',
  '    """',
  '    Filter hosts where risk_score >= 50.',
  '    Sort descending by risk_score.',
  '    Return sorted list.',
  '    """',
  '    high_risk = [h for h in hosts if h.get("risk_score", 0) >= 50]',
  '    high_risk.sort(key=lambda h: h["risk_score"], reverse=True)',
  '    return high_risk',
  '',
  '# Test data — pre-scored hosts',
  'test_hosts = [',
  '    {"hostname": "web-01",    "risk_score": 85},',
  '    {"hostname": "db-prod",   "risk_score": 100},',
  '    {"hostname": "dev-vm",    "risk_score": 8},',
  '    {"hostname": "staging-1", "risk_score": 60},',
  '    {"hostname": "app-prod",  "risk_score": 45},',
  ']',
  '',
  'result = get_high_risk_hosts(test_hosts)',
  'print(f"High risk count: {len(result)}")',
  'print(f"First host: {result[0][\'hostname\']}")',
  'print(f"Second host: {result[1][\'hostname\']}")',
  'print(f"Third host: {result[2][\'hostname\']}")',
  'print(f"Correctly sorted: {result[0][\'risk_score\'] >= result[1][\'risk_score\']}")',
  'print("get_high_risk_hosts verified" if len(result) == 3 and result[0]["hostname"] == "db-prod" else "FAILED")',
].join('\n');

MISSION_RENDERERS[6] = function() {
  return `
  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Three Final Challenges</div>
    <p>Three functions form the core of your patch risk prioritization system. Each must pass its automated check before you can proceed. Pass all three to complete the operation.</p>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Challenge 1 — calculate_risk_score</div>
    <p>Implement the full six-factor scoring function. The test system (critical, 95 days, production, internet-facing + pci-scope) should produce a raw total of 110 — capped at 100. The starter code is complete and ready to run.</p>
    <textarea id="gate-c1" data-codemirror data-initial=""></textarea>
    <div class="btn-row" style="margin-top:12px; display:flex; gap:10px;">
      <button class="btn-run" onclick="runC1()">&#9654; RUN</button>
      <button class="btn-reset" onclick="resetEditor('gate-c1', window._c1StarterCode)">&#x21BA; RESET</button>
    </div>
    <div id="gate-c1-output" class="gate-output"></div>
    <div id="c1-status" class="gate-status"></div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Challenge 2 — get_risk_level</div>
    <p>Implement <code>get_risk_level(score)</code> that maps a 0-100 score to <code>"critical"</code> (≥70), <code>"high"</code> (≥50), <code>"medium"</code> (≥25), or <code>"low"</code> (below 25). All 8 boundary tests must pass.</p>
    <textarea id="gate-c2" data-codemirror data-initial=""></textarea>
    <div class="btn-row" style="margin-top:12px; display:flex; gap:10px;">
      <button class="btn-run" onclick="runC2()">&#9654; RUN</button>
      <button class="btn-reset" onclick="resetEditor('gate-c2', window._c2StarterCode)">&#x21BA; RESET</button>
    </div>
    <div id="gate-c2-output" class="gate-output"></div>
    <div id="c2-status" class="gate-status"></div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Challenge 3 — get_high_risk_hosts</div>
    <p>Implement <code>get_high_risk_hosts(hosts)</code> that filters hosts where <code>risk_score &ge; 50</code> and returns them sorted by score descending. The test dataset has 5 hosts — 3 qualify, and they must come back in correct order.</p>
    <textarea id="gate-c3" data-codemirror data-initial=""></textarea>
    <div class="btn-row" style="margin-top:12px; display:flex; gap:10px;">
      <button class="btn-run" onclick="runC3()">&#9654; RUN</button>
      <button class="btn-reset" onclick="resetEditor('gate-c3', window._c3StarterCode)">&#x21BA; RESET</button>
    </div>
    <div id="gate-c3-output" class="gate-output"></div>
    <div id="c3-status" class="gate-status"></div>
  </div>

  <div id="m6-overall-status"></div>
  `;
};

const challengesPassed = { c1: false, c2: false, c3: false };

function checkAllChallenges() {
  if (challengesPassed.c1 && challengesPassed.c2 && challengesPassed.c3) {
    var el = document.getElementById('m6-overall-status');
    if (el) el.innerHTML = '<div class="panel"><div class="panel-accent" style="background:var(--green-primary)"></div><div class="panel-title" style="color:var(--green-primary)">OPERATION COMPLETE</div><p>Patch risk prioritization system is fully operational. You can parse date strings with strptime, filter host inventories with list comprehensions, score systems across six factors, and export a sorted priority report. The compliance audit is covered. The SOC has what it needs.</p></div>';
    setTimeout(function() { completeMission(6); }, 1000);
  }
}

async function runC1() {
  var passed = await runCode('gate-c1', 'gate-c1-output', function(stdout) {
    return stdout.includes('Score: 100') &&
           stdout.includes('Capped at 100: True') &&
           stdout.includes('calculate_risk_score verified');
  });
  var el = document.getElementById('c1-status');
  if (passed) {
    el.innerHTML = '<span class="status-pass">✓ Challenge 1 passed</span>';
    challengesPassed.c1 = true;
    checkAllChallenges();
  } else {
    el.innerHTML = '<span class="status-fail">✗ Expected "Score: 100" and "Capped at 100: True". Check all six factors and the min(score, 100) cap.</span>';
  }
}

async function runC2() {
  var passed = await runCode('gate-c2', 'gate-c2-output', function(stdout) {
    return stdout.includes('All tests passed!') &&
           !stdout.includes('Some tests failed');
  });
  var el = document.getElementById('c2-status');
  if (passed) {
    el.innerHTML = '<span class="status-pass">✓ Challenge 2 passed</span>';
    challengesPassed.c2 = true;
    checkAllChallenges();
  } else {
    el.innerHTML = '<span class="status-fail">✗ Check your boundaries: 70 \u2192 critical, 50 \u2192 high, 25 \u2192 medium, 24 \u2192 low.</span>';
  }
}

async function runC3() {
  var passed = await runCode('gate-c3', 'gate-c3-output', function(stdout) {
    return stdout.includes('High risk count: 3') &&
           stdout.includes('First host: db-prod') &&
           stdout.includes('get_high_risk_hosts verified');
  });
  var el = document.getElementById('c3-status');
  if (passed) {
    el.innerHTML = '<span class="status-pass">✓ Challenge 3 passed</span>';
    challengesPassed.c3 = true;
    checkAllChallenges();
  } else {
    el.innerHTML = '<span class="status-fail">✗ Filter risk_score >= 50, sort descending. Expected 3 hosts with db-prod first (score 100).</span>';
  }
}
