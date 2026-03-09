// ===== STATE =====
const STORAGE_KEY = 'cvnp2646_w12_progress';

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
  { id: 0, key: 'ORIENTATION',    label: '00\nORIENT',    icon: '⬡' },
  { id: 1, key: 'PURE_FUNC',      label: '01\nPURE',      icon: '⬡' },
  { id: 2, key: 'CONSTANTS',      label: '02\nCONSTANTS', icon: '⬡' },
  { id: 3, key: 'EXTRACT',        label: '03\nEXTRACT',   icon: '⬡' },
  { id: 4, key: 'PURE_GATE',      label: '04\nGATE',      icon: '⬡' },
  { id: 5, key: 'REFACTOR_SIM',   label: '05\nSIMULATE',  icon: '⬡' },
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
    showBriefing('OPERATION COMPLETE. Pure functions implemented. Magic numbers eliminated. Monolithic code decomposed into testable units. Your security tools are now maintainable, auditable, and ready for code review. Outstanding work, Analyst.', null);
    renderMissionMap();
    updateProgress();
  }
}

// ===== COMMANDER ZHANG BRIEFINGS =====
const BRIEFINGS = [
  'Welcome to CVNP Code Quality Operations. Security tools fail when code is unmaintainable. This week you refactor: pure functions, named constants, extracted logic. Clean code is the difference between a tool that passes audit and one that creates findings.',
  'Orientation confirmed. Now master pure functions. Same input, same output, no hidden state changes. Pure functions are the foundation of testable security code.',
  'Pure functions locked in. Now eliminate magic numbers. Every unexplained constant in security code is a liability — name them and link them to compliance standards.',
  'Constants understood. Now learn extract function refactoring. Long functions are untestable. Extract logical chunks into named units, each with one responsibility.',
  'Extraction mastered. Now implement a pure threat scoring function. No globals, no side effects — deterministic output that analysts can trust and auditors can verify.',
  'Gate cleared. Run the refactor simulator. Watch three scenarios show how clean code principles transform messy security tools into maintainable assets.',
  'Three final challenges stand between you and a complete code quality toolkit. Pass all three to complete the operation.',
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
    if (loader) {
      loader.textContent = '✓ Python engine ready';
      setTimeout(function() { loader.classList.add('hidden'); }, 2000);
    }
  } catch (e) {
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
      'import sys, io\n_old_stdout = sys.stdout\nsys.stdout = io.StringIO()\n'
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
    const qPanel = document.getElementById(missionKey + '-question-panel');
    if (qPanel) {
      qPanel.style.display = 'block';
      qPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

// ===== RENDER MISSION (dispatcher) =====
function renderMission(id) {
  document.title = 'MISSION ' + String(id).padStart(2,'0') + ' — ' + (MISSIONS[id] ? MISSIONS[id].key : '') + ' | OPERATION: CODE FORGE';
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
    <div class="panel-title">Why Code Quality Matters in Security</div>
    <p>Security tools accumulate technical debt fast. A script written under deadline pressure becomes the audit system that hundreds of analysts rely on. Untestable code hides bugs. Magic numbers obscure compliance requirements. Monolithic functions resist change. This week you refactor.</p>
    <p>Three techniques transform messy security code into maintainable, auditable tools: <strong>pure functions</strong> eliminate hidden state, <strong>named constants</strong> document policy, and <strong>extract function</strong> creates independently testable units from monoliths.</p>
    <div class="concept-grid">
      <div class="concept-card">
        <h3>Pure Functions</h3>
        <p>A function that returns the same output for the same input every time, with no side effects. No global mutations, no I/O, no randomness. Pure functions are predictable — which means they are testable, and trustworthy in security-critical operations.</p>
      </div>
      <div class="concept-card">
        <h3>Named Constants</h3>
        <p>Replace hard-coded numbers with descriptive names that link values to their source. <code>FAILED_LOGIN_LIMIT = 5  # NIST 800-53 AC-7</code> tells every reader why the number exists and where to find the original requirement.</p>
      </div>
      <div class="concept-card">
        <h3>Extract Function</h3>
        <p>Identify a logical chunk inside a long function and move it to a named function with a single responsibility. The original function becomes an orchestrator. Each extracted function becomes independently testable with no setup required.</p>
      </div>
      <div class="concept-card">
        <h3>Single Responsibility</h3>
        <p>Each function should do exactly one thing. <code>parse_log_line()</code> parses. <code>extract_failed_login()</code> extracts. <code>generate_report()</code> reports. Small, focused functions are easier to understand, test, and modify without breaking other parts.</p>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Orientation Check — 3 Questions</div>
    <p>Answer all three correctly to unlock Mission 01.</p>

    <div class="quiz-question" id="q0-0">
      <p><strong>Q1:</strong> What makes a function "pure"?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">It uses only built-in Python functions</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, true)">Same input always returns same output with no side effects</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">It has fewer than 15 lines of code</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">It uses only for-loops, no while-loops</button>
      </div>
    </div>

    <div class="quiz-question" id="q0-1">
      <p><strong>Q2:</strong> What is a "magic number" in source code?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">A randomly generated cryptographic token</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">A number used in hash algorithms</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, true)">A hard-coded value whose meaning or origin is not explained</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">A number that only appears once in the code</button>
      </div>
    </div>

    <div class="quiz-question" id="q0-2">
      <p><strong>Q3:</strong> What is the primary benefit of "Extract Function" refactoring?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">The extracted code runs faster at runtime</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">It reduces the total number of imports needed</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, true)">Each extracted function can be independently tested and reused</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">It eliminates the need for docstrings</button>
      </div>
    </div>

    <div id="m0-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 01 — PURE_FUNC
// ===================================================
MISSION_RENDERERS[1] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Pure Functions</div>
    <p>A pure function has two properties: (1) <strong>deterministic</strong> — same inputs always produce the same output, and (2) <strong>no side effects</strong> — it does not modify any state outside itself. Pure functions can be tested with a single call and no setup.</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code># IMPURE — modifies global state (side effect)
risk_scores = []

def log_risk_impure(severity, host):
    score = severity * 10
    risk_scores.append((host, score))  # SIDE EFFECT: mutates global
    return score

# PURE — returns result, caller manages state
def calculate_risk_pure(severity, multiplier):
    return severity * multiplier  # Same input → same output, always</code></pre>
    </div>
    <div class="hint-box">
      <strong>The test tells you everything:</strong> If you can write <code>assert calculate_risk(5, 10) == 50</code> with no other setup, it is pure. If you need to initialize globals, mock files, or reset state before testing — it is impure.
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Read All Four Concept Cards</div>
    <p style="color:var(--text-dim); font-size:0.85em;">Click each card to read it. All four must be reviewed before the question unlocks.</p>
    <div class="concept-grid">
      <div class="concept-card" id="card-m1-0" onclick="visitCard('m1', 0, 4)">
        <h3>Determinism</h3>
        <p>A pure function called with the same arguments must return identical results every time — on any machine, in any order, at any time. No date/time dependency, no randomness, no reading from files or databases. The output is fully determined by the input alone.</p>
      </div>
      <div class="concept-card" id="card-m1-1" onclick="visitCard('m1', 1, 4)">
        <h3>Side Effects to Avoid</h3>
        <p>Side effects are any changes a function makes outside its own scope: modifying a global list, writing to a file, printing to console, making a network request, or changing a mutable argument. Any of these make the function impure and harder to test in isolation.</p>
      </div>
      <div class="concept-card" id="card-m1-2" onclick="visitCard('m1', 2, 4)">
        <h3>Why Purity Matters in Security Code</h3>
        <p>Security tools must be auditable. When a function has no hidden state changes, a code reviewer can verify its behavior by reading it alone — no need to trace global state. Pure functions are also safe to run in parallel, which matters for high-volume log scanners and concurrent analysis pipelines.</p>
      </div>
      <div class="concept-card" id="card-m1-3" onclick="visitCard('m1', 3, 4)">
        <h3>Refactoring to Pure</h3>
        <p>Pattern: move state management to the caller. The function returns a value; the caller decides what to do with it. Before: <code>def log_threat(sev): threat_list.append(sev)</code>. After: <code>def is_threat(sev, threshold): return sev > threshold</code>. The caller appends to the list only if True.</p>
      </div>
    </div>
    <div id="card-m1-status" style="color:var(--text-dim); font-size:0.8em; margin-top:8px; letter-spacing:1px;">0 / 4 cards read</div>
  </div>

  <div class="panel" id="m1-question-panel" style="display:none">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Comprehension Check</div>
    <div class="quiz-question" id="q1-0">
      <p><strong>Q1:</strong> Which of the following is a pure function?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">def score(sev): risk_log.append(sev); return sev * 10</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">def score(sev): return sev * random.random()</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, true)">def score(sev, multiplier): return sev * multiplier</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">def score(sev): print(sev); return sev</button>
      </div>
    </div>
    <div id="m1-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 02 — CONSTANTS
// ===================================================
MISSION_RENDERERS[2] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Named Constants</div>
    <p>Magic numbers are hard-coded values embedded directly in logic. Six months after writing <code>if attempts > 5:</code>, no one knows if 5 is a compliance requirement, an operational policy, or a developer's guess. Named constants replace the number with a name that documents its purpose and source.</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code># BEFORE — magic numbers obscure intent
def check_auth(attempts):
    if attempts > 5:        # Why 5?
        return "locked"

def validate_password(pw):
    if len(pw) < 12:        # Why 12?
        return False

# AFTER — named constants document intent and source
FAILED_LOGIN_LIMIT  = 5    # NIST 800-53 AC-7: Unsuccessful Login Attempts
MIN_PASSWORD_LENGTH = 12   # PCI DSS 8.2.3: Minimum Password Length

def check_auth(attempts):
    if attempts > FAILED_LOGIN_LIMIT:
        return "locked"

def validate_password(pw):
    if len(pw) < MIN_PASSWORD_LENGTH:
        return False</code></pre>
    </div>
    <div class="hint-box">
      <strong>Single source of truth:</strong> When the compliance standard changes from 5 to 8 failed attempts, you update <code>FAILED_LOGIN_LIMIT = 8</code> in one place. Every function that references it is updated automatically — no search-and-replace, no missed occurrences.
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Constants in Action</div>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code># Full security policy constants — each linked to its standard
PORT_SCAN_THRESHOLD  = 25   # CIS Control 13: Network Monitoring
FAILED_LOGIN_LIMIT   = 5    # NIST 800-53 AC-7: Unsuccessful Logins
MIN_PASSWORD_LENGTH  = 12   # PCI DSS 8.2.3: Password Requirements
SESSION_TIMEOUT_MINS = 15   # NIST 800-53 AC-12: Session Termination
AUDIT_RETENTION_DAYS = 365  # SOC 2 CC7.2: Log Retention

def analyze_port_scan(port_count):
    return port_count > PORT_SCAN_THRESHOLD  # Self-documenting

def check_session_timeout(minutes_idle):
    return minutes_idle >= SESSION_TIMEOUT_MINS</code></pre>
    </div>
    <div class="concept-grid">
      <div class="concept-card">
        <h3>Clarity</h3>
        <p><code>if count > FAILED_LOGIN_LIMIT</code> reads like a sentence. A new team member instantly knows what the check does and where the threshold comes from — without reading the commit history or asking the original author.</p>
      </div>
      <div class="concept-card">
        <h3>Compliance Traceability</h3>
        <p>Auditors ask "where does this threshold come from?" With a constant named <code>FAILED_LOGIN_LIMIT</code> and a comment citing NIST 800-53 AC-7, the answer is immediate. Without it, the audit becomes an investigation into developer intent.</p>
      </div>
      <div class="concept-card">
        <h3>Maintainability</h3>
        <p>Security standards update. When NIST changes a requirement, you find the constant by its standard reference and update one line. No grep-and-replace across 47 files hoping you caught every occurrence.</p>
      </div>
      <div class="concept-card">
        <h3>Testability via Parameters</h3>
        <p>Pure functions that accept thresholds as parameters are even better: <code>def is_locked(attempts, limit)</code>. Tests pass different values without changing the constant. The constant provides the production default; tests can override it freely.</p>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Comprehension Check</div>
    <div class="quiz-question" id="q2-0">
      <p><strong>Q1:</strong> You see <code>if failed_attempts > 5:</code> in security code. What is the best refactoring?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">Rename 5 to a variable called n</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">Add a comment: # 5 is the lockout limit</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, true)">Define FAILED_LOGIN_LIMIT = 5 and replace 5 with that constant</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">Move 5 into a separate config.json file</button>
      </div>
    </div>
    <div id="m2-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 03 — EXTRACT
// ===================================================
MISSION_RENDERERS[3] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Extract Function Refactoring</div>
    <p>A function that does three things is three times harder to test than one that does one thing. Extract function refactoring identifies a logical chunk inside a long function and moves it to a named function with a single responsibility. The original becomes an orchestrator that calls the helpers.</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code># BEFORE: monolithic — 40 lines, 3 responsibilities, untestable
def process_security_log(log_file):
    with open(log_file) as f:
        lines = f.readlines()
    failed_logins = []
    port_scans = []
    for line in lines:
        parts = line.strip().split("|")
        if len(parts) < 4:
            continue
        timestamp, event_type, source_ip, details = parts[:4]
        if event_type == "auth_failure":
            username = details.split("user=")[1].split()[0]
            failed_logins.append({"ts": timestamp, "user": username})
        if event_type == "port_scan":
            count = int(details.split("ports=")[1])
            if count > PORT_SCAN_THRESHOLD:
                port_scans.append({"ts": timestamp, "src": source_ip})
    print(f"Failures: {len(failed_logins)} | Scans: {len(port_scans)}")</code></pre>
    </div>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code># AFTER: extracted — each function testable in isolation

def parse_log_line(line):
    """One job: parse raw line into structured dict or None."""
    parts = line.strip().split("|")
    if len(parts) < 4:
        return None
    return {"timestamp": parts[0], "event_type": parts[1],
            "source_ip": parts[2], "details": parts[3]}

def extract_failed_login(entry):
    """One job: extract login failure details or return None."""
    if entry["event_type"] != "auth_failure":
        return None
    username = entry["details"].split("user=")[1].split()[0]
    return {"ts": entry["timestamp"], "user": username}

def extract_port_scan(entry):
    """One job: extract port scan if above threshold or return None."""
    if entry["event_type"] != "port_scan":
        return None
    count = int(entry["details"].split("ports=")[1])
    if count <= PORT_SCAN_THRESHOLD:
        return None
    return {"ts": entry["timestamp"], "src": entry["source_ip"]}

def process_security_log(log_file):
    """One job: orchestrate — read, parse, classify, report."""
    with open(log_file) as f:
        entries = [parse_log_line(l) for l in f]
    entries = [e for e in entries if e is not None]
    failed_logins = [r for e in entries for r in [extract_failed_login(e)] if r]
    port_scans    = [r for e in entries for r in [extract_port_scan(e)] if r]
    return {"failures": len(failed_logins), "scans": len(port_scans)}</code></pre>
    </div>
    <div class="hint-box">
      <strong>Test the extracted function directly:</strong> <code>assert parse_log_line("ts|auth_failure|1.2.3.4|user=admin")</code> returns the right dict — no file needed, no setup, instant feedback on the one function that does parsing.
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Extraction Principles — 4 Questions</div>
    <p>Answer all four correctly to unlock Mission 04.</p>

    <div class="quiz-question" id="q3-0">
      <p><strong>Q1:</strong> What is the first step in "Extract Function" refactoring?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">Delete the original function entirely</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, true)">Identify a logical chunk of code that does one distinct thing</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">Add more inline comments to the existing function</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">Convert all local variables to global variables</button>
      </div>
    </div>

    <div class="quiz-question" id="q3-1">
      <p><strong>Q2:</strong> After extracting helper functions, the original function becomes:</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(3, 1, this, false)">Unnecessary and should be deleted</button>
        <button class="quiz-option" onclick="answerQuiz(3, 1, this, false)">A recursive function that calls itself</button>
        <button class="quiz-option" onclick="answerQuiz(3, 1, this, true)">An orchestration function that calls the helpers in sequence</button>
        <button class="quiz-option" onclick="answerQuiz(3, 1, this, false)">A class instead of a function</button>
      </div>
    </div>

    <div class="quiz-question" id="q3-2">
      <p><strong>Q3:</strong> Which code smell is the strongest signal to extract a function?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(3, 2, this, false)">A function that uses a for-loop</button>
        <button class="quiz-option" onclick="answerQuiz(3, 2, this, false)">A function that accepts more than two arguments</button>
        <button class="quiz-option" onclick="answerQuiz(3, 2, this, true)">A function that is long and handles multiple distinct responsibilities</button>
        <button class="quiz-option" onclick="answerQuiz(3, 2, this, false)">A function that returns a dictionary</button>
      </div>
    </div>

    <div class="quiz-question" id="q3-3">
      <p><strong>Q4:</strong> Why does extracting functions improve testability?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(3, 3, this, false)">Tests run faster when there are more functions</button>
        <button class="quiz-option" onclick="answerQuiz(3, 3, this, true)">Each small function can be unit tested with simple, focused inputs</button>
        <button class="quiz-option" onclick="answerQuiz(3, 3, this, false)">Python's test runner is optimized for small functions</button>
        <button class="quiz-option" onclick="answerQuiz(3, 3, this, false)">Extracted functions automatically generate test cases</button>
      </div>
    </div>

    <div id="m3-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 04 — PURE_GATE
// ===================================================
window._m4StarterCode = [
  'def calculate_threat_score(severity, age_days, is_external):',
  '    # Pure function: no global variables, no side effects',
  '    # severity (int): threat level 1-10',
  '    # age_days (int): days since vulnerability was discovered',
  '    # is_external (bool): True if the affected system is internet-facing',
  '    # Formula: severity * age_days + (50 if is_external else 0)',
  '    pass',
  '',
  '# --- Test harness (do not modify) ---',
  'score1 = calculate_threat_score(5, 10, True)',
  'score2 = calculate_threat_score(3, 7, False)',
  'score3 = calculate_threat_score(8, 5, True)',
  'print(f"Score 1: {score1}")',
  'print(f"Score 2: {score2}")',
  'print(f"Score 3: {score3}")',
  'print(f"Type: {type(score1).__name__}")',
  'print(f"Pure check: {calculate_threat_score(5, 10, True) == calculate_threat_score(5, 10, True)}")',
  'print("calculate_threat_score verified")',
].join('\n');

MISSION_RENDERERS[4] = function() {
  return `
  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Pure Function Gate</div>
    <p>Implement <code>calculate_threat_score(severity, age_days, is_external)</code> as a pure function. All three parameters are inputs — no global variables, no side effects. The function computes and returns an integer score.</p>
    <div class="panel">
      <div class="panel-accent"></div>
      <div class="panel-title">Specification</div>
      <div class="code-block">
        <span class="code-lang-tag">spec</span>
        <pre><code>calculate_threat_score(severity, age_days, is_external) -> int

Parameters:
  severity    (int)  : threat severity level, 1 to 10
  age_days    (int)  : days since vulnerability was discovered
  is_external (bool) : True if the affected system is internet-facing

Formula:
  score = severity * age_days + (50 if is_external else 0)

Examples:
  calculate_threat_score(5, 10, True)  ->  100  (5x10 + 50)
  calculate_threat_score(3, 7, False)  ->   21  (3x7 + 0)
  calculate_threat_score(8, 5, True)   ->   90  (8x5 + 50)</code></pre>
      </div>
    </div>
    <textarea id="gate-m4" data-codemirror data-initial=""></textarea>
    <div class="btn-row" style="margin-top:12px; display:flex; gap:10px;">
      <button class="btn-run" onclick="runM4()">&#9654; RUN</button>
      <button class="btn-reset" onclick="resetEditor('gate-m4', window._m4StarterCode)">&#x21BA; RESET</button>
    </div>
    <div id="gate-m4-output" class="gate-output"></div>
    <div id="m4-status" class="gate-status"></div>
  </div>
  `;
};

async function runM4() {
  const passed = await runCode('gate-m4', 'gate-m4-output', function(stdout) {
    return stdout.includes('Score 1: 100') &&
           stdout.includes('Score 2: 21') &&
           stdout.includes('Score 3: 90') &&
           stdout.includes('Type: int') &&
           stdout.includes('Pure check: True') &&
           stdout.includes('calculate_threat_score verified');
  });
  const el = document.getElementById('m4-status');
  if (passed) {
    el.innerHTML = '<span class="status-pass">✓ All checks passed — MISSION 04 COMPLETE</span>';
    setTimeout(function() { completeMission(4); }, 800);
  } else {
    el.innerHTML = '<span class="status-fail">✗ Expected Score 1: 100, Score 2: 21, Score 3: 90. Formula: severity * age_days + (50 if is_external else 0).</span>';
  }
}


// ===================================================
// MISSION 05 — REFACTOR_SIM
// ===================================================
const refactorSimState = { seenA: false, seenB: false, seenC: false };

function refLog(text, cls) {
  const term = document.getElementById('refactor-terminal');
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

function refClear() {
  const term = document.getElementById('refactor-terminal');
  if (term) term.innerHTML = '';
}

function runRefactorScenario(key) {
  refClear();

  if (key === 'A') {
    refLog('>> Scenario A: Impure to Pure Refactoring', 'info');
    refLog('   Analyzing threat_logger.py...', '');
    refLog('', '');
    refLog('   [DETECT] def log_threat(severity, host):', 'warn');
    refLog('     Line 4: threat_log.append((host, severity))  <- SIDE EFFECT', 'error');
    refLog('     Side effect: modifies global list threat_log', 'error');
    refLog('     Cannot test in isolation without mutating global state', 'error');
    refLog('', '');
    refLog('   [REFACTOR] Extracting pure function...', 'info');
    refLog('', '');
    refLog('   def is_critical_threat(severity, threshold):', 'success');
    refLog('       return severity > threshold', 'success');
    refLog('', '');
    refLog('   [TEST] is_critical_threat(8, 7) == True   OK', 'success');
    refLog('   [TEST] is_critical_threat(5, 7) == False  OK', 'success');
    refLog('   [TEST] Same inputs -> same outputs: True  OK', 'success');
    refLog('   [TEST] No global state required: True     OK', 'success');
    refLog('', '');
    refLog('   STATUS: IMPURE FUNCTION REFACTORED', 'success');

  } else if (key === 'B') {
    refLog('>> Scenario B: Magic Number Elimination', 'info');
    refLog('   Scanning security_policy.py...', '');
    refLog('', '');
    refLog('   [SCAN] Line 12: if port_count > 25:', 'warn');
    refLog('          Magic number: 25 (no explanation provided)', 'warn');
    refLog('   [SCAN] Line 19: if failed_logins > 5:', 'warn');
    refLog('          Magic number: 5 (no explanation provided)', 'warn');
    refLog('   [SCAN] Line 28: if len(password) < 12:', 'warn');
    refLog('          Magic number: 12 (no explanation provided)', 'warn');
    refLog('', '');
    refLog('   [REFACTOR] Defining named constants...', 'info');
    refLog('', '');
    refLog('   PORT_SCAN_THRESHOLD  = 25   # CIS Control 13', 'success');
    refLog('   FAILED_LOGIN_LIMIT   = 5    # NIST 800-53 AC-7', 'success');
    refLog('   MIN_PASSWORD_LENGTH  = 12   # PCI DSS 8.2.3', 'success');
    refLog('', '');
    refLog('   [VERIFY] Magic numbers replaced: 3 / 3  OK', 'success');
    refLog('   [VERIFY] Compliance standards cited: 3 / 3  OK', 'success');
    refLog('   [VERIFY] Single source of truth: True  OK', 'success');
    refLog('', '');
    refLog('   STATUS: MAGIC NUMBERS ELIMINATED', 'success');

  } else if (key === 'C') {
    refLog('>> Scenario C: Monolith to Extracted Functions', 'info');
    refLog('   Analyzing process_security_log(): 47 lines', '');
    refLog('', '');
    refLog('   [DETECT] 3 responsibilities identified:', 'warn');
    refLog('     1. Parse raw log lines into structured data', 'warn');
    refLog('     2. Classify events (failed logins, port scans)', 'warn');
    refLog('     3. Generate summary report', 'warn');
    refLog('   [DETECT] Testability score: 0%', 'error');
    refLog('     Cannot test classification without file I/O', 'error');
    refLog('', '');
    refLog('   [EXTRACT] parse_log_line()       ->  8 lines, 1 responsibility  OK', 'success');
    refLog('   [EXTRACT] extract_failed_login() ->  9 lines, 1 responsibility  OK', 'success');
    refLog('   [EXTRACT] extract_port_scan()    -> 10 lines, 1 responsibility  OK', 'success');
    refLog('   [EXTRACT] generate_report()      ->  6 lines, 1 responsibility  OK', 'success');
    refLog('', '');
    refLog('   [AFTER] process_security_log(): 12 lines (orchestration only)', 'info');
    refLog('', '');
    refLog('   [TEST] parse_log_line() tested independently: PASS  OK', 'success');
    refLog('   [TEST] extract_failed_login() tested independently: PASS  OK', 'success');
    refLog('   [TEST] Testability score: 100%  OK', 'success');
    refLog('', '');
    refLog('   STATUS: MONOLITH DECOMPOSED', 'success');
  }

  refactorSimState['seen' + key] = true;
  const checkEl = document.getElementById('refactor-check-' + key);
  if (checkEl) {
    checkEl.style.color = 'var(--green-primary)';
    checkEl.textContent = '\u2713 Scenario ' + key;
  }
  refactorSimCheckComplete();
}

function refactorSimCheckComplete() {
  if (refactorSimState.seenA && refactorSimState.seenB && refactorSimState.seenC) {
    const statusEl = document.getElementById('m5-status');
    if (statusEl) statusEl.innerHTML = '<span class="status-pass">\u2713 ALL SCENARIOS ANALYZED \u2014 MISSION 05 COMPLETE</span>';
    setTimeout(function() { completeMission(5); }, 800);
  }
}

function initMission5() {
  refactorSimState.seenA = false;
  refactorSimState.seenB = false;
  refactorSimState.seenC = false;
}

MISSION_RENDERERS[5] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Refactor Simulator</div>
    <p>Run each scenario to see how code quality principles transform real security code. Watch side effects get extracted, magic numbers get named, and monolithic functions get decomposed. Analyze all three to unlock the final challenge.</p>
    <div class="concept-grid">
      <div class="concept-card">
        <h3>Scenario A</h3>
        <p><strong>Impure &rarr; Pure</strong><br>A threat logger with a global side effect is refactored into a pure scoring function. Side effect identified, pure version implemented, testability confirmed.</p>
        <button class="btn-run" style="margin-top:14px; font-size:0.8em; padding:8px 16px;" onclick="runRefactorScenario('A')">&#9654; ANALYZE</button>
      </div>
      <div class="concept-card">
        <h3>Scenario B</h3>
        <p><strong>Magic Numbers &rarr; Constants</strong><br>Three unexplained numbers in security policy code are identified and replaced with named constants linked to compliance standards.</p>
        <button class="btn-run" style="margin-top:14px; font-size:0.8em; padding:8px 16px;" onclick="runRefactorScenario('B')">&#9654; ANALYZE</button>
      </div>
      <div class="concept-card">
        <h3>Scenario C</h3>
        <p><strong>Monolith &rarr; Extracted</strong><br>A 47-line function with three responsibilities is decomposed into four single-purpose functions. Testability score goes from 0% to 100%.</p>
        <button class="btn-run" style="margin-top:14px; font-size:0.8em; padding:8px 16px;" onclick="runRefactorScenario('C')">&#9654; ANALYZE</button>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Refactor Terminal</div>
    <div id="refactor-terminal" style="background:var(--bg-editor); border:1px solid var(--border); border-radius:3px; padding:16px; min-height:200px; font-family:var(--font); font-size:0.88em; overflow-y:auto; max-height:440px; white-space:pre-wrap;"></div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Scenarios Completed</div>
    <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:8px;">
      <div id="refactor-check-A" style="color:var(--text-dim);">&#9744; Scenario A &mdash; Impure to Pure</div>
      <div id="refactor-check-B" style="color:var(--text-dim);">&#9744; Scenario B &mdash; Magic Numbers</div>
      <div id="refactor-check-C" style="color:var(--text-dim);">&#9744; Scenario C &mdash; Extract Function</div>
    </div>
    <div id="m5-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 06 — FINAL_CHALLENGE
// ===================================================
window._c1StarterCode = [
  'def calculate_threat_score(severity, age_days, is_external):',
  '    """',
  '    Pure function: compute threat score from explicit parameters.',
  '    No global variables. No side effects. Deterministic output.',
  '    Formula: severity * age_days + (50 if is_external else 0)',
  '    """',
  '    pass',
  '',
  '# score_a: severity=10, age_days=3, external=True  -> 10*3 + 50 = 80',
  '# score_b: severity=2,  age_days=30, external=False -> 2*30 + 0  = 60',
  '# score_c: severity=7,  age_days=7,  external=True  -> 7*7 + 50  = 99',
  'score_a = calculate_threat_score(10, 3, True)',
  'score_b = calculate_threat_score(2, 30, False)',
  'score_c = calculate_threat_score(7, 7, True)',
  'print(f"Score A: {score_a}")',
  'print(f"Score B: {score_b}")',
  'print(f"Score C: {score_c}")',
  'print(f"Is pure: {calculate_threat_score(10, 3, True) == score_a}")',
  'print("calculate_threat_score verified")',
].join('\n');

window._c2StarterCode = [
  '# Pure function: all thresholds passed as parameters — no globals',
  '# Returns "CRITICAL" if score >= critical_threshold',
  '# Returns "HIGH"     if score >= high_threshold (and < critical_threshold)',
  '# Returns "NORMAL"   otherwise',
  'def get_risk_level(score, critical_threshold, high_threshold):',
  '    pass',
  '',
  '# --- Test harness ---',
  'CRITICAL_THRESHOLD = 75',
  'HIGH_THRESHOLD = 40',
  'level1 = get_risk_level(90, CRITICAL_THRESHOLD, HIGH_THRESHOLD)',
  'level2 = get_risk_level(55, CRITICAL_THRESHOLD, HIGH_THRESHOLD)',
  'level3 = get_risk_level(20, CRITICAL_THRESHOLD, HIGH_THRESHOLD)',
  'level4 = get_risk_level(75, CRITICAL_THRESHOLD, HIGH_THRESHOLD)',
  'print(f"Level 1 (score=90): {level1}")',
  'print(f"Level 2 (score=55): {level2}")',
  'print(f"Level 3 (score=20): {level3}")',
  'print(f"Level 4 (score=75): {level4}")',
  'print(f"Pure check: {get_risk_level(90, 75, 40) == level1}")',
  'print("get_risk_level verified")',
].join('\n');

window._c3StarterCode = [
  '# Extract function: parse one log line into structured data',
  '# Format: "timestamp|event_type|source_ip|details"',
  '# Returns dict with 4 keys, or None if fewer than 4 pipe-separated parts',
  'def parse_log_line(line):',
  '    pass',
  '',
  '# --- Test harness ---',
  'line1 = "2024-01-15T10:30:00|auth_failure|192.168.1.50|user=admin failed"',
  'line2 = "invalid line"',
  'line3 = "2024-01-15T11:00:00|port_scan|10.0.0.5|ports=35"',
  'result1 = parse_log_line(line1)',
  'result2 = parse_log_line(line2)',
  'result3 = parse_log_line(line3)',
  'print(f"Result 1 type: {type(result1).__name__}")',
  'event = result1.get("event_type")',
  'source = result1.get("source_ip")',
  'print(f"Event type: {event}")',
  'print(f"Source IP: {source}")',
  'print(f"Invalid line: {result2}")',
  'event3 = result3.get("event_type")',
  'print(f"Result 3 event: {event3}")',
  'print("parse_log_line verified")',
].join('\n');

MISSION_RENDERERS[6] = function() {
  return `
  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Three Final Challenges</div>
    <p>Three functions form the core of a clean, testable security analysis system. Each must pass its automated check. Pass all three to complete the operation.</p>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Challenge 1 &mdash; calculate_threat_score</div>
    <p>Implement the pure threat scoring function. This test uses different values than Mission 04 — trace through each calculation manually before running to confirm your understanding of the formula.</p>
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
    <div class="panel-title">Challenge 2 &mdash; get_risk_level</div>
    <p>Implement a pure risk classification function. All thresholds are parameters — no globals. <code>CRITICAL_THRESHOLD = 75</code> and <code>HIGH_THRESHOLD = 40</code> are passed as arguments so the function is testable with any threshold values. Note the boundary case: score of 75 is CRITICAL (not HIGH).</p>
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
    <div class="panel-title">Challenge 3 &mdash; parse_log_line</div>
    <p>Implement the extracted log parser. One job: split a pipe-delimited string into a structured dict, or return <code>None</code> for malformed lines. No file I/O — the caller handles reading. Test it with a single function call and zero setup.</p>
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
    if (el) el.innerHTML = '<div class="panel"><div class="panel-accent" style="background:var(--green-primary)"></div><div class="panel-title" style="color:var(--green-primary)">OPERATION COMPLETE</div><p>Code quality toolkit is fully operational. You can write pure functions with no side effects, replace magic numbers with named constants linked to compliance standards, and decompose monolithic functions into independently testable units. Security tools built this way survive code review, team handoffs, and compliance audits.</p></div>';
    setTimeout(function() { completeMission(6); }, 1000);
  }
}

async function runC1() {
  var passed = await runCode('gate-c1', 'gate-c1-output', function(stdout) {
    return stdout.includes('Score A: 80') &&
           stdout.includes('Score B: 60') &&
           stdout.includes('Score C: 99') &&
           stdout.includes('Is pure: True') &&
           stdout.includes('calculate_threat_score verified');
  });
  var el = document.getElementById('c1-status');
  if (passed) {
    el.innerHTML = '<span class="status-pass">\u2713 Challenge 1 passed</span>';
    challengesPassed.c1 = true;
    checkAllChallenges();
  } else {
    el.innerHTML = '<span class="status-fail">\u2717 Expected Score A: 80, Score B: 60, Score C: 99. Formula: severity * age_days + (50 if is_external else 0).</span>';
  }
}

async function runC2() {
  var passed = await runCode('gate-c2', 'gate-c2-output', function(stdout) {
    return stdout.includes('Level 1 (score=90): CRITICAL') &&
           stdout.includes('Level 2 (score=55): HIGH') &&
           stdout.includes('Level 3 (score=20): NORMAL') &&
           stdout.includes('Level 4 (score=75): CRITICAL') &&
           stdout.includes('Pure check: True') &&
           stdout.includes('get_risk_level verified');
  });
  var el = document.getElementById('c2-status');
  if (passed) {
    el.innerHTML = '<span class="status-pass">\u2713 Challenge 2 passed</span>';
    challengesPassed.c2 = true;
    checkAllChallenges();
  } else {
    el.innerHTML = '<span class="status-fail">\u2717 score >= critical_threshold: CRITICAL. score >= high_threshold: HIGH. Otherwise: NORMAL. Boundary: 75 >= 75 is CRITICAL.</span>';
  }
}

async function runC3() {
  var passed = await runCode('gate-c3', 'gate-c3-output', function(stdout) {
    return stdout.includes('Result 1 type: dict') &&
           stdout.includes('Event type: auth_failure') &&
           stdout.includes('Source IP: 192.168.1.50') &&
           stdout.includes('Invalid line: None') &&
           stdout.includes('Result 3 event: port_scan') &&
           stdout.includes('parse_log_line verified');
  });
  var el = document.getElementById('c3-status');
  if (passed) {
    el.innerHTML = '<span class="status-pass">\u2713 Challenge 3 passed</span>';
    challengesPassed.c3 = true;
    checkAllChallenges();
  } else {
    el.innerHTML = '<span class="status-fail">\u2717 Split on "|", check len >= 4, return dict with keys: timestamp, event_type, source_ip, details. Return None for invalid lines.</span>';
  }
}
