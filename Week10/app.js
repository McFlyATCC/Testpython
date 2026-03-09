// ===== STATE =====
const STORAGE_KEY = 'cvnp2646_w10_progress';

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
  { id: 0, key: 'ORIENTATION',   label: '00\nORIENT',   icon: '⬡' },
  { id: 1, key: 'DICT_JOINS',    label: '01\nJOINS',    icon: '⬡' },
  { id: 2, key: 'DEFAULTDICT',   label: '02\nDEFAULT',  icon: '⬡' },
  { id: 3, key: 'SET_OPS',       label: '03\nSET OPS',  icon: '⬡' },
  { id: 4, key: 'INDEX_GATE',    label: '04\nINDEX',    icon: '⬡' },
  { id: 5, key: 'IAM_SIMULATOR', label: '05\nSIMULATE', icon: '⬡' },
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
    showBriefing('OPERATION COMPLETE. IAM audit system is online. Permission drift detected, unauthorized accounts flagged, compliance report generated. Outstanding work, Analyst.', null);
    renderMissionMap();
    updateProgress();
  }
}

// ===== COMMANDER ZHANG BRIEFINGS =====
const BRIEFINGS = [
  'Welcome to CVNP IAM Compliance Operations. Identity drift is silent and dangerous. Before you build the audit system, understand why efficient data joining and set arithmetic are the right tools for this problem.',
  'Good. Now master dictionary joins. When you have thousands of users and role assignments, O(n²) nested loops are a performance disaster. Dictionary indexing gives you O(1) lookups.',
  'Dict joins confirmed. Now learn defaultdict. Grouping multiple roles per user is a common pattern — defaultdict eliminates the boilerplate that causes bugs.',
  'defaultdict locked in. Now master set operations. The difference, intersection, and union operators are how you detect permission drift in one line of code.',
  'Set operations understood. Now implement the first core function: build the dictionary index from a user list.',
  'Index function verified. Run the IAM simulator. See how the three drift scenarios produce different audit outcomes.',
  'Three final challenges stand between you and a working IAM audit system. Pass all three to complete the operation.',
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
  document.title = 'MISSION ' + String(id).padStart(2,'0') + ' — ' + (MISSIONS[id] ? MISSIONS[id].key : '') + ' | OPERATION: ACCESS AUDIT';
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
    <div class="panel-title">What Is an IAM Audit System?</div>
    <p>Identity and Access Management (IAM) is the practice of controlling who has access to what — and verifying that those permissions match your baseline. CIS Control 6 mandates continuous access control management for compliance.</p>
    <p><strong>Permission drift</strong> occurs silently: users get promoted, change teams, or leave the company while their access permissions remain unchanged. Your tool detects this drift automatically by comparing a current state snapshot against an approved baseline.</p>
    <div class="concept-grid">
      <div class="concept-card">
        <h3>The Problem</h3>
        <p>A list of 10,000 users joined against 50,000 role assignments using nested loops runs in O(n²) time. That's 500 million comparisons. Dictionary indexing reduces this to O(n) — 60,000 operations.</p>
      </div>
      <div class="concept-card">
        <h3>Dictionary Joins</h3>
        <p>Build a dict indexed by <code>user_id</code>. Every lookup is O(1) constant time regardless of dataset size. This is the same technique used by SQL join algorithms and search engines.</p>
      </div>
      <div class="concept-card">
        <h3>defaultdict</h3>
        <p>Users have multiple roles. <code>defaultdict(list)</code> automatically creates an empty list when a new key is first accessed — eliminating the check-then-append boilerplate that causes bugs.</p>
      </div>
      <div class="concept-card">
        <h3>Set Operations</h3>
        <p><code>baseline - current</code> = missing users (should exist, don't). <code>current - baseline</code> = unauthorized users (exist, shouldn't). One line of Python replaces 20 lines of loop logic.</p>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Orientation Check — 3 Questions</div>
    <p>Answer all three correctly to unlock Mission 01.</p>

    <div class="quiz-question" id="q0-0">
      <p><strong>Q1:</strong> Which Python data structure provides O(1) average-case key lookup regardless of size?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">list</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, true)">dict</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">tuple</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">deque</button>
      </div>
    </div>

    <div class="quiz-question" id="q0-1">
      <p><strong>Q2:</strong> The set operation <code>baseline - current</code> returns:</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">Users present in both sets</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">Users in current but not baseline (unauthorized)</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, true)">Users in baseline but not current (missing access)</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">All users from both sets combined</button>
      </div>
    </div>

    <div class="quiz-question" id="q0-2">
      <p><strong>Q3:</strong> What does <code>defaultdict(list)</code> automatically do when you access a key that has never been set?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">Raises a KeyError</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">Returns None</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">Returns the string "list"</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, true)">Creates an empty list and returns it</button>
      </div>
    </div>

    <div id="m0-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 01 — DICT_JOINS
// ===================================================
MISSION_RENDERERS[1] = function() {
  return `
  <div class="panel">
    <div class="panel-accent red"></div>
    <div class="panel-title red">The Performance Problem</div>
    <p>Joining users with role assignments using nested loops is O(n²). For 10,000 users and 50,000 assignments, that is 500 million comparisons on every audit run. In production, this makes your tool too slow to be useful.</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <pre><code># SLOW — O(n²) nested loops
for assignment in role_assignments:       # 50,000 iterations
    for user in users_list:               # 10,000 iterations each
        if user["user_id"] == assignment["user_id"]:
            print(f"{user['name']}: {assignment['role']}")
# Total: 500,000,000 comparisons</code></pre>
    </div>
    <div class="danger-box">
      <strong>Why this matters in security:</strong> A slow audit tool gets skipped. If your drift-detection script takes 20 minutes, the analyst finds a workaround. Dictionary joins keep the tool fast enough to run on every push to production.
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Read All Four Join Cards</div>
    <p style="color:var(--text-dim); font-size:0.85em;">Click each card to read it. All four must be reviewed before the question unlocks.</p>
    <div class="concept-grid">
      <div class="concept-card" id="card-m1-0" onclick="visitCard('m1', 0, 4)">
        <h3>Build the Index</h3>
        <p>Convert your user list to a dict keyed by <code>user_id</code>. Loop once: O(n). Every subsequent lookup is O(1). Two patterns work — a for loop or a dict comprehension:</p>
        <p style="font-size:0.85em; color:var(--text-dim); margin-top:8px;"><code>{u["user_id"]: u for u in users}</code></p>
      </div>
      <div class="concept-card" id="card-m1-1" onclick="visitCard('m1', 1, 4)">
        <h3>O(1) Lookup</h3>
        <p>Once indexed, every lookup is constant time regardless of how many users exist. <code>users_dict["U001"]</code> takes the same time whether you have 10 users or 10 million.</p>
      </div>
      <div class="concept-card" id="card-m1-2" onclick="visitCard('m1', 2, 4)">
        <h3>Safe Lookup with .get()</h3>
        <p>A role assignment might reference a user_id that no longer exists. <code>users_dict.get(user_id)</code> returns <code>None</code> instead of raising a KeyError. Always use <code>.get()</code> when joining across datasets that may be out of sync.</p>
      </div>
      <div class="concept-card" id="card-m1-3" onclick="visitCard('m1', 3, 4)">
        <h3>Foreign Keys</h3>
        <p>The shared <code>user_id</code> field is a <em>foreign key</em> — the same concept SQL databases use for JOIN operations. Python dict joins are how you implement SQL-style joins in memory, without a database.</p>
      </div>
    </div>
    <div id="card-m1-status" style="color:var(--text-dim); font-size:0.8em; margin-top:8px; letter-spacing:1px;">0 / 4 cards read</div>
  </div>

  <div class="panel" id="m1-question-panel" style="display:none">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Comprehension Check</div>
    <div class="quiz-question" id="q1-0">
      <p><strong>Q:</strong> Which expression builds a dictionary index from a list of user dicts, keyed by <code>user_id</code>?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, true)">{u["user_id"]: u for u in users}</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">list(users.keys())</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">dict(users)</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">users.index("user_id")</button>
      </div>
    </div>
    <div id="m1-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 02 — DEFAULTDICT
// ===================================================
MISSION_RENDERERS[2] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">The Grouping Problem</div>
    <p>Users have multiple roles. You need to collect all roles per user into a list. With a regular dict, every append requires a pre-check — this check-then-append pattern is verbose and a common source of bugs.</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code># Regular dict — verbose and error-prone
roles_by_user = {}
for assignment in role_assignments:
    user_id = assignment["user_id"]
    role = assignment["role"]

    if user_id not in roles_by_user:    # boilerplate check
        roles_by_user[user_id] = []     # manual initialization

    roles_by_user[user_id].append(role)</code></pre>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">defaultdict — Clean Grouping</div>
    <p><code>defaultdict(list)</code> from the <code>collections</code> module automatically creates an empty list the first time a key is accessed. The boilerplate disappears — just append directly.</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code>from collections import defaultdict

# defaultdict — clean and safe
roles_by_user = defaultdict(list)
for assignment in role_assignments:
    user_id = assignment["user_id"]
    role = assignment["role"]

    roles_by_user[user_id].append(role)    # auto-creates [] if needed

# Result: {"U001": ["admin", "editor"], "U002": ["viewer"]}</code></pre>
    </div>
    <div class="hint-box">
      <strong>How it works:</strong> The argument to <code>defaultdict</code> is a <em>factory function</em> called with no arguments when a missing key is accessed. <code>defaultdict(list)</code> calls <code>list()</code> — returning <code>[]</code>. You can also use <code>defaultdict(int)</code> for counters or <code>defaultdict(set)</code> for deduplication.
    </div>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <pre><code># Accessing a missing key creates the default
d = defaultdict(list)
d["new_key"].append("first_item")    # no KeyError — [] created automatically
print(d["new_key"])                  # ['first_item']

# Regular dict raises KeyError for the same operation
r = {}
r["new_key"].append("first_item")   # KeyError: 'new_key'</code></pre>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">defaultdict Check</div>
    <div class="quiz-question" id="q2-0">
      <p><strong>Q:</strong> What does <code>defaultdict(list)</code> return when you access a key that has never been set?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">Raises a KeyError</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">Returns None without modifying the dict</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, true)">Creates an empty list [], stores it under that key, and returns it</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">Returns the string "list"</button>
      </div>
    </div>
    <div id="m2-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 03 — SET_OPS
// ===================================================
MISSION_RENDERERS[3] = function() {
  return `
  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Set Operations for Drift Detection</div>
    <p>Sets hold unique values and support mathematical operations — difference, intersection, union — in O(n) time. For IAM auditing, sets of user IDs replace 30 lines of loop logic with three one-liners.</p>

    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code># Who should have access (approved baseline)
baseline = {"U001", "U002", "U003", "U004"}

# Who currently has access (live snapshot)
current  = {"U001", "U003", "U099", "U100"}

# Missing: in baseline but NOT in current (access was removed without approval)
missing      = baseline - current      # {"U002", "U004"}

# Unauthorized: in current but NOT in baseline (access added without approval)
unauthorized = current - baseline      # {"U099", "U100"}

# Compliant: in both (correct access — no action needed)
compliant    = baseline & current      # {"U001", "U003"}

# Full union: everyone in either set
all_users    = baseline | current      # {"U001", "U002", "U003", "U004", "U099", "U100"}</code></pre>
    </div>

    <table>
      <thead>
        <tr><th>Operator</th><th>Name</th><th>Returns</th><th>IAM Meaning</th></tr>
      </thead>
      <tbody>
        <tr><td><code>A - B</code></td><td>Difference</td><td>In A, not in B</td><td>In baseline, missing from current</td></tr>
        <tr><td><code>B - A</code></td><td>Difference</td><td>In B, not in A</td><td>In current, not in baseline (unauthorized)</td></tr>
        <tr><td><code>A &amp; B</code></td><td>Intersection</td><td>In both A and B</td><td>Compliant — access matches baseline</td></tr>
        <tr><td><code>A | B</code></td><td>Union</td><td>In either A or B</td><td>All users across both snapshots</td></tr>
      </tbody>
    </table>

    <div class="hint-box">
      <strong>Building sets from lists:</strong> Use a set comprehension — <code>{u["user_id"] for u in users}</code> — or pass the list to <code>set()</code>. For IAM audits, you typically extract just the IDs from your user dicts before running set operations.
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Set Operations Check — 4 Questions</div>
    <p>Answer all four correctly to unlock Mission 04.</p>

    <div class="quiz-question" id="q3-0">
      <p><strong>Q1:</strong> <code>baseline - current</code> returns users that are:</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">In current but not baseline (unauthorized)</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, true)">In baseline but not current (missing access)</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">In both sets (compliant)</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">In either set (all users)</button>
      </div>
    </div>

    <div class="quiz-question" id="q3-1">
      <p><strong>Q2:</strong> <code>current - baseline</code> returns users that are:</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(3, 1, this, true)">In current but not baseline (unauthorized access)</button>
        <button class="quiz-option" onclick="answerQuiz(3, 1, this, false)">In baseline but not current (missing access)</button>
        <button class="quiz-option" onclick="answerQuiz(3, 1, this, false)">In both sets (compliant)</button>
        <button class="quiz-option" onclick="answerQuiz(3, 1, this, false)">In either set (all users)</button>
      </div>
    </div>

    <div class="quiz-question" id="q3-2">
      <p><strong>Q3:</strong> <code>baseline &amp; current</code> returns:</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(3, 2, this, false)">Users in baseline but not current</button>
        <button class="quiz-option" onclick="answerQuiz(3, 2, this, false)">Users in current but not baseline</button>
        <button class="quiz-option" onclick="answerQuiz(3, 2, this, true)">Users in both sets — access is correct and compliant</button>
        <button class="quiz-option" onclick="answerQuiz(3, 2, this, false)">All users from both sets combined</button>
      </div>
    </div>

    <div class="quiz-question" id="q3-3">
      <p><strong>Q4:</strong> Given <code>baseline = {"U001", "U002", "U003"}</code> and <code>current = {"U001", "U099"}</code>, how many users have <em>unauthorized</em> access?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(3, 3, this, false)">0</button>
        <button class="quiz-option" onclick="answerQuiz(3, 3, this, true)">1</button>
        <button class="quiz-option" onclick="answerQuiz(3, 3, this, false)">2</button>
        <button class="quiz-option" onclick="answerQuiz(3, 3, this, false)">3</button>
      </div>
    </div>

    <div id="m3-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 04 — INDEX_GATE
// ===================================================
window._m4StarterCode = [
  'def build_user_index(users):',
  '    """',
  '    Build a dictionary index from a list of user dicts.',
  '    Key: user_id (string)',
  '    Value: full user dict',
  '    Returns dict for O(1) lookup.',
  '    """',
  '    return {user["user_id"]: user for user in users}',
  '',
  '# Test it',
  'test_users = [',
  '    {"user_id": "U001", "username": "jdoe",   "status": "active"},',
  '    {"user_id": "U002", "username": "asmith", "status": "disabled"},',
  '    {"user_id": "U003", "username": "mchen",  "status": "active"},',
  ']',
  '',
  'index = build_user_index(test_users)',
  'print(f"Type: {type(index).__name__}")',
  'print(f"Keys count: {len(index)}")',
  'print(f"U001 username: {index[\'U001\'][\'username\']}")',
  'print(f"U002 status: {index[\'U002\'][\'status\']}")',
  'print(f"U003 in index: {\'U003\' in index}")',
  'print("build_user_index verified" if type(index).__name__ == "dict" and len(index) == 3 and index["U001"]["username"] == "jdoe" else "FAILED")',
].join('\n');

MISSION_RENDERERS[4] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Building the User Index</div>
    <p><code>build_user_index(users)</code> is the first function in your IAM pipeline. It converts a raw list of user dicts into a dictionary keyed by <code>user_id</code>. Every downstream operation — role joining, orphan detection, drift analysis — depends on this index being fast and correct.</p>
    <div class="hint-box">
      <strong>Two valid approaches:</strong><br>
      Dict comprehension (one line): <code>return {u["user_id"]: u for u in users}</code><br>
      For loop (explicit): build an empty dict, loop, assign <code>index[u["user_id"]] = u</code>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Code Gate — build_user_index</div>
    <p>The starter code uses a dict comprehension. Run it to verify it passes, then try rewriting it using a for loop to understand both approaches. The gate passes when the output confirms type <code>dict</code>, 3 keys, and the correct username lookup.</p>
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
    <div class="panel-title">Using the Index in Your Pipeline</div>
    <p>Once built, the index lets you join any other dataset against users in O(1) per lookup — no nested loops needed.</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <pre><code>users_index = build_user_index(users)

# O(1) lookup — instant regardless of list size
user = users_index.get("U001")        # returns dict or None
if user:
    print(user["username"], user["status"])

# Joining role assignments against the index
for assignment in role_assignments:
    user = users_index.get(assignment["user_id"])  # O(1) join
    if user:
        print(f"{user['username']} has role: {assignment['role']}")</code></pre>
    </div>
  </div>
  `;
};

async function runM4() {
  const passed = await runCode('gate-m4', 'gate-m4-output', function(stdout) {
    return stdout.includes('Type: dict') &&
           stdout.includes('Keys count: 3') &&
           stdout.includes('U001 username: jdoe') &&
           stdout.includes('U002 status: disabled') &&
           stdout.includes('U003 in index: True') &&
           stdout.includes('build_user_index verified');
  });
  const el = document.getElementById('m4-status');
  if (passed) {
    el.innerHTML = '<span class="status-pass">✓ All checks passed — MISSION 04 COMPLETE</span>';
    setTimeout(function() { completeMission(4); }, 800);
  } else {
    el.innerHTML = '<span class="status-fail">✗ Output must confirm type dict, 3 keys, correct username/status lookups, and "build_user_index verified".</span>';
  }
}


// ===================================================
// MISSION 05 — IAM_SIMULATOR
// ===================================================
const iamSimState = { seenA: false, seenB: false, seenC: false };

const iamScenarios = {
  A: {
    label: 'Clean State',
    baseline: ['U001', 'U002', 'U003', 'U004'],
    current:  ['U001', 'U002', 'U003', 'U004'],
    verdict: 'COMPLIANT',
  },
  B: {
    label: 'Missing Users',
    baseline: ['U001', 'U002', 'U003', 'U004'],
    current:  ['U001', 'U003'],
    verdict: 'DRIFT DETECTED',
  },
  C: {
    label: 'Unauthorized Access',
    baseline: ['U001', 'U002'],
    current:  ['U001', 'U002', 'U099', 'U100'],
    verdict: 'DRIFT DETECTED',
  },
};

function simIamLog(text, cls) {
  const term = document.getElementById('iam-sim-terminal');
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

function simIamClear() {
  const term = document.getElementById('iam-sim-terminal');
  if (term) term.innerHTML = '';
}

function runIamScenario(key) {
  const s = iamScenarios[key];
  if (!s) return;
  simIamClear();

  const baselineSet = new Set(s.baseline);
  const currentSet  = new Set(s.current);
  const missing      = s.baseline.filter(function(id) { return !currentSet.has(id); });
  const unauthorized = s.current.filter(function(id)  { return !baselineSet.has(id); });
  const compliant    = s.baseline.filter(function(id)  { return currentSet.has(id); });

  simIamLog('>> Scenario: ' + s.label, 'info');
  simIamLog('   baseline users : [' + s.baseline.join(', ') + ']', '');
  simIamLog('   current users  : [' + s.current.join(', ') + ']', '');
  simIamLog('', '');
  simIamLog('>> Running set operations:', 'info');
  simIamLog('   baseline - current  =  missing      : ' + (missing.length ? '[' + missing.join(', ') + ']' : '(none)'), missing.length ? 'warn' : 'success');
  simIamLog('   current  - baseline =  unauthorized : ' + (unauthorized.length ? '[' + unauthorized.join(', ') + ']' : '(none)'), unauthorized.length ? 'error' : 'success');
  simIamLog('   baseline & current  =  compliant    : [' + compliant.join(', ') + ']', 'success');
  simIamLog('', '');

  const isClean = missing.length === 0 && unauthorized.length === 0;
  const verdictColor = isClean ? 'success' : 'error';
  simIamLog('   AUDIT RESULT: ' + s.verdict, verdictColor);
  if (!isClean) {
    if (missing.length)      simIamLog('   ACTION REQUIRED: Restore access for ' + missing.length + ' missing user(s)', 'warn');
    if (unauthorized.length) simIamLog('   ACTION REQUIRED: Revoke access for ' + unauthorized.length + ' unauthorized user(s)', 'error');
  }

  iamSimState['seen' + key] = true;
  const checkEl = document.getElementById('iam-check-' + key);
  if (checkEl) {
    checkEl.style.color = 'var(--green-primary)';
    checkEl.textContent = '✓ ' + s.label;
  }
  simIamCheckComplete();
}

function simIamCheckComplete() {
  if (iamSimState.seenA && iamSimState.seenB && iamSimState.seenC) {
    const statusEl = document.getElementById('m5-status');
    if (statusEl) statusEl.innerHTML = '<span class="status-pass">✓ ALL SCENARIOS ANALYZED — MISSION 05 COMPLETE</span>';
    setTimeout(function() { completeMission(5); }, 800);
  }
}

function initMission5() {
  iamSimState.seenA = false;
  iamSimState.seenB = false;
  iamSimState.seenC = false;
}

MISSION_RENDERERS[5] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">IAM Drift Simulator</div>
    <p>Run each scenario to see how the set operations produce different audit outcomes. The simulator applies <code>baseline - current</code>, <code>current - baseline</code>, and <code>baseline &amp; current</code> to real user ID sets. Analyze all three to unlock the final challenge.</p>
    <div class="concept-grid">
      <div class="concept-card">
        <h3>Scenario A</h3>
        <p><strong>Clean State</strong><br>baseline: U001, U002, U003, U004<br>current: U001, U002, U003, U004<br><br>No drift — all access matches baseline.</p>
        <button class="btn-run" style="margin-top:14px; font-size:0.8em; padding:8px 16px;" onclick="runIamScenario('A')">&#9654; AUDIT</button>
      </div>
      <div class="concept-card">
        <h3>Scenario B</h3>
        <p><strong>Missing Users</strong><br>baseline: U001, U002, U003, U004<br>current: U001, U003<br><br>Two users lost access without approval.</p>
        <button class="btn-run" style="margin-top:14px; font-size:0.8em; padding:8px 16px;" onclick="runIamScenario('B')">&#9654; AUDIT</button>
      </div>
      <div class="concept-card">
        <h3>Scenario C</h3>
        <p><strong>Unauthorized Access</strong><br>baseline: U001, U002<br>current: U001, U002, U099, U100<br><br>Two users gained access without authorization.</p>
        <button class="btn-run" style="margin-top:14px; font-size:0.8em; padding:8px 16px;" onclick="runIamScenario('C')">&#9654; AUDIT</button>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Audit Terminal</div>
    <div id="iam-sim-terminal" style="background:var(--bg-editor); border:1px solid var(--border); border-radius:3px; padding:16px; min-height:180px; font-family:var(--font); font-size:0.88em; overflow-y:auto; max-height:420px; white-space:pre-wrap;"></div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Scenarios Completed</div>
    <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:8px;">
      <div id="iam-check-A" style="color:var(--text-dim);">&#9744; Clean State</div>
      <div id="iam-check-B" style="color:var(--text-dim);">&#9744; Missing Users</div>
      <div id="iam-check-C" style="color:var(--text-dim);">&#9744; Unauthorized Access</div>
    </div>
    <div id="m5-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 06 — FINAL_CHALLENGE
// ===================================================
window._c1StarterCode = [
  'def build_user_index(users):',
  '    """',
  '    Build a dictionary index from a list of user dicts.',
  '    Key: user_id   Value: full user dict',
  '    """',
  '    return {user["user_id"]: user for user in users}',
  '',
  '# Test: verify correct type, key count, and lookup',
  'test_users = [',
  '    {"user_id": "U001", "username": "jdoe",   "department": "IT"},',
  '    {"user_id": "U002", "username": "asmith", "department": "HR"},',
  '    {"user_id": "U003", "username": "mchen",  "department": "SEC"},',
  '    {"user_id": "U004", "username": "lpark",  "department": "IT"},',
  ']',
  'idx = build_user_index(test_users)',
  'print(f"Type: {type(idx).__name__}")',
  'print(f"Count: {len(idx)}")',
  'print(f"U003 department: {idx[\'U003\'][\'department\']}")',
  'print(f"U004 username: {idx[\'U004\'][\'username\']}")',
  'print("build_user_index verified" if type(idx).__name__ == "dict" and len(idx) == 4 and idx["U003"]["department"] == "SEC" else "FAILED")',
].join('\n');

window._c2StarterCode = [
  'from collections import defaultdict',
  '',
  'def group_roles_by_user(assignments):',
  '    """',
  '    Group role assignment dicts by user_id.',
  '    Returns defaultdict(list): {user_id: [role1, role2, ...]}',
  '    """',
  '    roles = defaultdict(list)',
  '    for assignment in assignments:',
  '        roles[assignment["user_id"]].append(assignment["role"])',
  '    return roles',
  '',
  '# Test data — U002 has two roles',
  'test_assignments = [',
  '    {"user_id": "U001", "role": "viewer"},',
  '    {"user_id": "U002", "role": "admin"},',
  '    {"user_id": "U002", "role": "hr_manager"},',
  '    {"user_id": "U003", "role": "editor"},',
  ']',
  'result = group_roles_by_user(test_assignments)',
  'print(f"U001 roles: {result[\'U001\']}")',
  'print(f"U002 roles: {sorted(result[\'U002\'])}")',
  'print(f"U003 roles: {result[\'U003\']}")',
  'print(f"U002 role count: {len(result[\'U002\'])}")',
  'print("group_roles_by_user verified" if len(result["U002"]) == 2 and "admin" in result["U002"] and "hr_manager" in result["U002"] else "FAILED")',
].join('\n');

window._c3StarterCode = [
  'def detect_drift(baseline_ids, current_ids):',
  '    """',
  '    Compare two sets of user IDs and return drift report.',
  '    Args:',
  '        baseline_ids: set of approved user IDs',
  '        current_ids:  set of current user IDs',
  '    Returns dict with keys: missing, unauthorized, compliant, is_clean',
  '    """',
  '    missing      = baseline_ids - current_ids',
  '    unauthorized = current_ids  - baseline_ids',
  '    compliant    = baseline_ids & current_ids',
  '    return {',
  '        "missing":      missing,',
  '        "unauthorized": unauthorized,',
  '        "compliant":    compliant,',
  '        "is_clean":     len(missing) == 0 and len(unauthorized) == 0,',
  '    }',
  '',
  '# Test with a drift scenario',
  'baseline = {"U001", "U002", "U003", "U004"}',
  'current  = {"U001", "U003", "U099"}',
  '',
  'report = detect_drift(baseline, current)',
  'print(f"Missing count: {len(report[\'missing\'])}")',
  'print(f"Missing IDs: {sorted(report[\'missing\'])}")',
  'print(f"Unauthorized: {sorted(report[\'unauthorized\'])}")',
  'print(f"Compliant count: {len(report[\'compliant\'])}")',
  'print(f"Is clean: {report[\'is_clean\']}")',
  'print("detect_drift verified" if len(report["missing"]) == 2 and sorted(report["missing"]) == ["U002", "U004"] and sorted(report["unauthorized"]) == ["U099"] and not report["is_clean"] else "FAILED")',
].join('\n');

MISSION_RENDERERS[6] = function() {
  return `
  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Three Final Challenges</div>
    <p>Three functions form the core of your IAM audit system. Each must pass its automated check. Pass all three to complete the operation.</p>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Challenge 1 — build_user_index</div>
    <p>Build a dictionary index from a list of user dicts using <code>user_id</code> as the key. This time the test set has 4 users — verify type, count, and two specific lookups.</p>
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
    <div class="panel-title">Challenge 2 — group_roles_by_user</div>
    <p>Use <code>defaultdict(list)</code> to group role assignment dicts by <code>user_id</code>. U002 has two roles — both must appear in the result. The starter code is complete and ready to run.</p>
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
    <div class="panel-title">Challenge 3 — detect_drift</div>
    <p>Implement <code>detect_drift(baseline_ids, current_ids)</code> using set operations. Returns a dict with <code>missing</code>, <code>unauthorized</code>, <code>compliant</code>, and <code>is_clean</code>. The test scenario has 2 missing users, 1 unauthorized, and should not be clean.</p>
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
    if (el) el.innerHTML = '<div class="panel"><div class="panel-accent" style="background:var(--green-primary)"></div><div class="panel-title" style="color:var(--green-primary)">OPERATION COMPLETE</div><p>IAM audit system is fully operational. You can build O(1) dictionary indexes, group data with defaultdict, and detect permission drift with set operations. The compliance report is ready. The SOC has what it needs for the audit.</p></div>';
    setTimeout(function() { completeMission(6); }, 1000);
  }
}

async function runC1() {
  var passed = await runCode('gate-c1', 'gate-c1-output', function(stdout) {
    return stdout.includes('Type: dict') &&
           stdout.includes('Count: 4') &&
           stdout.includes('U003 department: SEC') &&
           stdout.includes('U004 username: lpark') &&
           stdout.includes('build_user_index verified');
  });
  var el = document.getElementById('c1-status');
  if (passed) {
    el.innerHTML = '<span class="status-pass">✓ Challenge 1 passed</span>';
    challengesPassed.c1 = true;
    checkAllChallenges();
  } else {
    el.innerHTML = '<span class="status-fail">✗ Expected type dict, count 4, U003 department SEC, U004 username lpark, and "build_user_index verified".</span>';
  }
}

async function runC2() {
  var passed = await runCode('gate-c2', 'gate-c2-output', function(stdout) {
    return stdout.includes('U002 role count: 2') &&
           stdout.includes('group_roles_by_user verified');
  });
  var el = document.getElementById('c2-status');
  if (passed) {
    el.innerHTML = '<span class="status-pass">✓ Challenge 2 passed</span>';
    challengesPassed.c2 = true;
    checkAllChallenges();
  } else {
    el.innerHTML = '<span class="status-fail">✗ U002 must have 2 roles (admin and hr_manager). Use defaultdict(list) and append each role.</span>';
  }
}

async function runC3() {
  var passed = await runCode('gate-c3', 'gate-c3-output', function(stdout) {
    return stdout.includes('Missing count: 2') &&
           stdout.includes("Missing IDs: ['U002', 'U004']") &&
           stdout.includes("Unauthorized: ['U099']") &&
           stdout.includes('Is clean: False') &&
           stdout.includes('detect_drift verified');
  });
  var el = document.getElementById('c3-status');
  if (passed) {
    el.innerHTML = '<span class="status-pass">✓ Challenge 3 passed</span>';
    challengesPassed.c3 = true;
    checkAllChallenges();
  } else {
    el.innerHTML = '<span class="status-fail">✗ Use baseline - current for missing, current - baseline for unauthorized, baseline &amp; current for compliant.</span>';
  }
}
