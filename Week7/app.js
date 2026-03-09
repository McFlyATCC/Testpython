// ===== STATE =====
const STORAGE_KEY = 'cvnp2646_w7_progress';

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
  { id: 1, key: 'INTEL_BRIEFING',  label: '01\nINTEL',     icon: '⬡' },
  { id: 2, key: 'SCHEMA_DESIGN',   label: '02\nSCHEMA',    icon: '⬡' },
  { id: 3, key: 'BUILD_VALIDATOR', label: '03\nVALIDATE',  icon: '⬡' },
  { id: 4, key: 'WIRE_PIPELINE',   label: '04\nPIPELINE',  icon: '⬡' },
  { id: 5, key: 'DRY_RUN_SIM',     label: '05\nSIMULATE',  icon: '⬡' },
  { id: 6, key: 'FINAL_CHALLENGE', label: '06\nCHALLENGE', icon: '⬡' },
];

// ===== MISSION MAP RENDER =====
function renderMissionMap() {
  const nav = document.getElementById('mission-map');
  nav.innerHTML = '';

  MISSIONS.forEach((mission, i) => {
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
    showBriefing('OPERATION COMPLETE. All systems backed up. The breach has been contained. Well done, Analyst.', null);
    renderMissionMap();
    updateProgress();
  }
}

// ===== COMMANDER ZHANG BRIEFINGS =====
const BRIEFINGS = [
  'Welcome to CVNP Security Operations. Before you can build anything, you need to understand the tools. Complete this orientation.',
  'BREACH CONFIRMED. Logs were hard-coded into a deprecated script. Your mission: learn why config-driven programming prevents this.',
  'Good work. Now design the JSON schema that will drive the entire backup system. Types matter — get them right.',
  'Schema approved. Build the validator. Remember: collect ALL errors, never return early.',
  'Validator online. Now wire the five functions into a clean pipeline. One function, one responsibility.',
  'Pipeline verified. Run the dry-run simulation. No real files — use random data to prove the logic works.',
  'Three final challenges stand between you and mission completion. Pass all three.',
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

function escapeForAttr(str) {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '&quot;').replace(/\n/g, '&#10;');
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
  const totalMap = { 0: 3, 1: 1, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
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
  // Update page title
  document.title = 'MISSION ' + String(id).padStart(2,'0') + ' — ' + (MISSIONS[id] ? MISSIONS[id].key : '') + ' | OPERATION: BACKUP RESTORE';

  const container = document.getElementById('mission-content');
  const renderer = MISSION_RENDERERS[id];
  container.innerHTML = renderer ? renderer() : '<p style="color:var(--text-dim); padding:40px 0;">Mission ' + id + ' content loading...</p>';

  // Initialize CodeMirror editors
  container.querySelectorAll('textarea[data-codemirror]').forEach(function(ta) {
    const initial = ta.dataset.initial || '';
    // Decode HTML entities used in data-initial attribute
    const decoded = initial.replace(/&#10;/g, '\n').replace(/&quot;/g, '"').replace(/\\\\/g, '\\');
    createEditor(ta.id, decoded);
  });

  // Post-render inits
  if (id === 2) { if (typeof initMission2 === 'function') initMission2(); }
  if (id === 4) { if (typeof initMission4 === 'function') initMission4(); }

  // Inject starter codes for Pyodide gates (50ms delay allows CodeMirror to fully init)
  var starterCodes = {
    3: function() {
      var ed = state.editors['gate-m3'];
      if (ed && window._m3StarterCode) ed.setValue(window._m3StarterCode);
    },
    5: function() {
      var ed = state.editors['gate-m5'];
      if (ed && window._m5StarterCode) ed.setValue(window._m5StarterCode);
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

// ===== MISSION RENDERERS (populated in missions 4-10) =====
const MISSION_RENDERERS = {};

// ===== BOOT =====
document.addEventListener('DOMContentLoaded', function() {
  loadState();
  renderMissionMap();
  updateProgress();
  renderMission(state.currentMission);
  showBriefing(BRIEFINGS[state.currentMission], null);

  // Create Pyodide loader indicator
  const loader = document.createElement('div');
  loader.id = 'pyodide-loader';
  loader.textContent = '⟳ Loading Python engine...';
  document.body.appendChild(loader);

  // Pyodide loads in background
  initPyodide();
});

// ===================================================
// MISSION 00 — ORIENTATION
// ===================================================
MISSION_RENDERERS[0] = function() {
  return `
  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">What Is Python?</div>
    <p>Python is a programming language. You write instructions in plain text — Python reads them and makes your computer do things. It is named after Monty Python, not the snake.</p>
    <p>This week you will use Python to build a backup planning tool for a security operations team.</p>
    <div class="concept-grid">
      <div class="concept-card">
        <h3>A Python Script</h3>
        <p>A <code>.py</code> file. Plain text. You run it with <code>python3 filename.py</code> in a terminal.</p>
      </div>
      <div class="concept-card">
        <h3>A Function</h3>
        <p>A named block of code that does one thing. <code>def load_config():</code> — the word after <code>def</code> is the name.</p>
      </div>
      <div class="concept-card">
        <h3>A JSON File</h3>
        <p>A text file formatted like a Python dictionary. Used to store settings. Ends in <code>.json</code>.</p>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">What Is JSON?</div>
    <p>JSON stands for JavaScript Object Notation. Despite the name, it is used in almost every programming language. It looks like this:</p>
    <div class="code-block">
      <span class="code-lang-tag">json</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code>{
  "plan_name": "Daily Backup",
  "active": true,
  "retention_days": 90,
  "sources": ["/var/log", "/var/db"]
}</code></pre>
    </div>
    <p>Every value has a <strong>type</strong>: <code>"Daily Backup"</code> is a string, <code>true</code> is a boolean, <code>90</code> is a number, and <code>[...]</code> is a list.</p>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Orientation Check — 3 Questions</div>
    <p>Answer all three correctly to unlock Mission 01.</p>

    <div class="quiz-question" id="q0-0">
      <p><strong>Q1:</strong> What command runs a Python file called <code>backup.py</code>?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">run backup.py</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, true)">python3 backup.py</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">execute backup.py</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">open backup.py</button>
      </div>
    </div>

    <div class="quiz-question" id="q0-1">
      <p><strong>Q2:</strong> In JSON, what type is the value <code>true</code>?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">String</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">Number</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, true)">Boolean</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">List</button>
      </div>
    </div>

    <div class="quiz-question" id="q0-2">
      <p><strong>Q3:</strong> What does the keyword <code>def</code> mean in Python?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">Default value</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, true)">Define a function</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">Delete a file</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">Define a variable</button>
      </div>
    </div>

    <div id="m0-status" class="gate-status"></div>
  </div>
  `;
};

// ===================================================
// MISSION 01 — INTEL_BRIEFING
// ===================================================
MISSION_RENDERERS[1] = function() {
  return `
  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Why Config-Driven Programming?</div>
    <p>Hard-coding paths in scripts is a maintainability trap. When the backup destination changes, you open the code, hunt for the string, change it, hope you did not break anything, and push again.</p>
    <p>Config-driven programming solves this: keep behavior in JSON files, keep logic in Python files. Swap the config — get different behavior. Zero code changes.</p>
    <div class="danger-box">
      <strong>THE BREACH:</strong> The previous analyst hard-coded <code>"/var/log/firewall"</code> directly into the Python script. When the log path changed during a server migration, nobody updated the script. For 11 days, no logs were backed up.
    </div>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <pre><code><span class="cm"># WRONG — never do this</span>
<span class="fn">shutil</span>.copy(<span class="str">"/var/log/firewall"</span>, <span class="str">"/backup/logs"</span>)

<span class="cm"># RIGHT — read from config</span>
<span class="fn">shutil</span>.copy(config[<span class="str">"source_path"</span>], config[<span class="str">"dest_path"</span>])</code></pre>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Read All Four Intel Cards</div>
    <p style="color:var(--text-dim); font-size:0.85em;">Click each card to read it. All four must be reviewed before the question unlocks.</p>
    <div class="concept-grid">
      <div class="concept-card" id="card-m1-0" onclick="visitCard('m1', 0, 4)">
        <h3>The Core Principle</h3>
        <p>Change behavior <strong>without changing code</strong>. Your Python script reads a JSON config and does exactly what the config says. Swap the config, get different behavior.</p>
      </div>
      <div class="concept-card" id="card-m1-1" onclick="visitCard('m1', 1, 4)">
        <h3>The Scenario</h3>
        <p>You are a SOC engineer automating security log backups for firewall logs, IDS alerts, and auth logs. Every source path, every destination — stored in <code>backup_config.json</code>.</p>
      </div>
      <div class="concept-card" id="card-m1-2" onclick="visitCard('m1', 2, 4)">
        <h3>What You Will Build</h3>
        <p><code>backup_planner.py</code> reads <code>backup_config.json</code>, validates the config structure, and generates a dry-run simulation showing what would be backed up.</p>
      </div>
      <div class="concept-card" id="card-m1-3" onclick="visitCard('m1', 3, 4)">
        <h3>Dry-Run Only</h3>
        <p>No actual file copying. No reading real directories. The simulator uses <code>random</code> to generate realistic fake file data and produce a report of what <em>would</em> happen.</p>
      </div>
    </div>
    <div id="card-m1-status" style="color:var(--text-dim); font-size:0.8em; margin-top:8px; letter-spacing:1px;">0 / 4 cards read</div>
  </div>

  <div class="panel" id="m1-question-panel" style="display:none">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Comprehension Check</div>
    <div class="quiz-question" id="q1-0">
      <p><strong>Q:</strong> What is the main advantage of storing paths in <code>backup_config.json</code> instead of inside the Python script?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">The script runs faster when paths are in JSON</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, true)">You can change behavior without modifying or redeploying the Python code</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">JSON files are encrypted so paths are more secure</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">Python can only read file paths from JSON, not from within the script itself</button>
      </div>
    </div>
    <div id="m1-status" class="gate-status"></div>
  </div>
  `;
};

// ===================================================
// MISSION 02 — SCHEMA_DESIGN
// ===================================================
MISSION_RENDERERS[2] = function() {
  return `
  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">JSON Schema Design</div>
    <p>Your backup config has four sections: metadata, sources, destination, and options. Here is the complete valid schema:</p>
    <div class="code-block">
      <span class="code-lang-tag">json</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code>{
  "plan_name": "Security Logs Daily Backup",
  "version": "1.0",
  "created_by": "security_team",
  "sources": [
    {
      "name": "Firewall Logs",
      "path": "/var/log/firewall",
      "recursive": true,
      "include_patterns": ["*.log", "*.txt"]
    }
  ],
  "destination": {
    "base_path": "/backup/security_logs",
    "retention_days": 90
  },
  "options": {
    "verify_backups": true,
    "max_file_size_mb": 100
  }
}</code></pre>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Type Design Decisions</div>
    <p>Every field type was chosen deliberately. Here is why:</p>
    <table>
      <thead><tr><th>Field</th><th>Type</th><th>Why This Type</th></tr></thead>
      <tbody>
        <tr><td><code>plan_name</code></td><td>string</td><td>Human-readable label, no computation needed</td></tr>
        <tr><td><code>sources</code></td><td>list</td><td>Multiple sources possible; easy to iterate with a loop</td></tr>
        <tr><td><code>recursive</code></td><td>boolean</td><td>Python's <code>isinstance(val, bool)</code> can verify it; string "true" causes type bugs</td></tr>
        <tr><td><code>destination</code></td><td>dict</td><td>Groups related settings; accessed by key</td></tr>
        <tr><td><code>retention_days</code></td><td>number</td><td>Used in arithmetic — must not be the string "90"</td></tr>
        <tr><td><code>options</code></td><td>dict (optional)</td><td>Use <code>config.get('options', {})</code> to handle when absent</td></tr>
      </tbody>
    </table>
    <div class="hint-box">
      <strong>Key Insight:</strong> A boolean <code>true</code> in JSON becomes Python <code>True</code>. A string <code>"true"</code> would pass a string check but fail a boolean check — causing subtle bugs downstream.
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent red"></div>
    <div class="panel-title red">Find The 3 Errors</div>
    <p>This config is deliberately broken. Identify the <strong>3 problems</strong> to unlock the next mission.</p>
    <div id="json-inspector-container"></div>
    <div id="error-found-list" style="margin-top:12px; font-size:0.85em; color:var(--text-dim); letter-spacing:1px;">Errors found: 0 / 3</div>
    <div id="m2-status" class="gate-status"></div>
  </div>
  `;
};

function initMission2() {
  const container = document.getElementById('json-inspector-container');
  if (!container) return;

  const errorsFound = new Set();

  const lines = [
    '{',
    '  "version": "1.0",',
    '  "created_by": "security_team",',
    '  "sources": "not_a_list_this_is_wrong"',
    '}'
  ];

  // Build the display
  const codeBlock = document.createElement('div');
  codeBlock.className = 'code-block';
  codeBlock.style.cursor = 'default';

  const pre = document.createElement('pre');

  lines.forEach(function(line, idx) {
    const span = document.createElement('span');
    span.style.display = 'block';
    span.style.padding = '2px 4px';
    span.style.borderRadius = '2px';
    span.style.fontFamily = 'var(--font)';
    span.textContent = line;

    // Line 3 (sources = "not_a_list") is clickable
    if (idx === 3) {
      span.style.cursor = 'pointer';
      span.style.color = 'var(--amber)';
      span.title = 'Click if you think this line contains an error';
      span.addEventListener('click', function() {
        if (errorsFound.has('sources_type')) return;
        errorsFound.add('sources_type');
        span.style.background = 'rgba(255,60,60,0.2)';
        span.style.color = 'var(--red-alert)';
        span.style.cursor = 'default';
        span.title = 'Identified: "sources" must be a list, not a string';
        updateM2Count();
      });
    }
    pre.appendChild(span);
  });

  codeBlock.appendChild(pre);
  container.appendChild(codeBlock);

  // Missing fields section
  const missingNote = document.createElement('div');
  missingNote.style.marginTop = '14px';
  missingNote.style.fontSize = '0.88em';

  const label = document.createElement('span');
  label.style.color = 'var(--text-dim)';
  label.textContent = 'Missing required fields (click to flag): ';
  missingNote.appendChild(label);

  [
    { key: 'plan_name_missing', label: '"plan_name" is missing' },
    { key: 'destination_missing', label: '"destination" is missing' },
  ].forEach(function(item) {
    const btn = document.createElement('button');
    btn.textContent = item.label;
    btn.style.cssText = 'background:var(--bg-editor);border:1px solid var(--amber);color:var(--amber);padding:4px 12px;cursor:pointer;font-family:var(--font);font-size:0.85em;margin:4px 6px;border-radius:2px;transition:all 0.2s;';
    btn.addEventListener('click', function() {
      if (errorsFound.has(item.key)) return;
      errorsFound.add(item.key);
      btn.style.background = 'rgba(255,60,60,0.2)';
      btn.style.color = 'var(--red-alert)';
      btn.style.borderColor = 'var(--red-alert)';
      btn.disabled = true;
      updateM2Count();
    });
    missingNote.appendChild(btn);
  });

  container.appendChild(missingNote);

  function updateM2Count() {
    const countEl = document.getElementById('error-found-list');
    if (countEl) countEl.textContent = 'Errors found: ' + errorsFound.size + ' / 3';

    if (errorsFound.size >= 3) {
      const statusEl = document.getElementById('m2-status');
      if (statusEl) statusEl.innerHTML = '<span class="status-pass">✓ ALL 3 ERRORS IDENTIFIED — MISSION 02 COMPLETE</span>';
      setTimeout(function() { completeMission(2); }, 800);
    }
  }
}

// ===================================================
// MISSION 03 — BUILD_VALIDATOR
// ===================================================
MISSION_RENDERERS[3] = function() {
  return '<div class="panel">' +
    '<div class="panel-accent red"></div>' +
    '<div class="panel-title red">Collect ALL Errors — Never Return Early</div>' +
    '<p>Never return after the first error. Your manager needs the full list of what is wrong, not just the first problem. An incomplete error report sends them back with another ticket five minutes later.</p>' +
    '<p>The pattern: build an <code>errors = []</code> list, <code>errors.append()</code> every problem you find, and return the complete list at the end.</p>' +
    '</div>' +

    '<div class="panel">' +
    '<div class="panel-accent"></div>' +
    '<div class="panel-title">The 4-Level Validation Hierarchy</div>' +
    '<div class="concept-grid">' +
      '<div class="concept-card"><h3>Level 1 — File I/O</h3><p>Handled in <code>load_config()</code>. FileNotFoundError and JSONDecodeError. Separate concern from validate_config.</p></div>' +
      '<div class="concept-card"><h3>Level 2 — Required Fields</h3><p>Check that <code>plan_name</code>, <code>sources</code>, and <code>destination</code> exist in the dict.</p></div>' +
      '<div class="concept-card"><h3>Level 3 — Type Validation</h3><p>Use <code>isinstance()</code>: sources must be list, destination must be dict.</p></div>' +
      '<div class="concept-card"><h3>Level 4 — Value Validation</h3><p>Sources list must not be empty. Each source must have a non-empty <code>path</code> field.</p></div>' +
    '</div>' +
    '<div class="code-block">' +
      '<span class="code-lang-tag">python</span>' +
      '<button class="copy-btn" onclick="copyCode(this)">COPY</button>' +
      '<pre><code>' +
      '<span class="cm"># Level 2: Required fields</span>\n' +
      'required_fields = [<span class="str">\'plan_name\'</span>, <span class="str">\'sources\'</span>, <span class="str">\'destination\'</span>]\n' +
      '<span class="kw">for</span> field <span class="kw">in</span> required_fields:\n' +
      '    <span class="kw">if</span> field <span class="kw">not in</span> config:\n' +
      '        errors.<span class="fn">append</span>(<span class="fn">f</span><span class="str">"Missing required field: \'{field}\'"</span>)\n\n' +
      '<span class="cm"># Level 3: Type validation</span>\n' +
      '<span class="kw">if</span> <span class="str">\'sources\'</span> <span class="kw">in</span> config <span class="kw">and not</span> <span class="fn">isinstance</span>(config[<span class="str">\'sources\'</span>], <span class="tp">list</span>):\n' +
      '    errors.<span class="fn">append</span>(\n' +
      '        <span class="fn">f</span><span class="str">"\'sources\' must be a list, got {type(config[\'sources\']).__name__}"</span>\n' +
      '    )' +
      '</code></pre>' +
    '</div>' +
    '</div>' +

    '<div class="code-gate">' +
    '<p style="margin-bottom:12px; color:var(--text-dim); font-size:0.85em;">Write <code>validate_config()</code> that collects all errors. Uncomment and complete the code. Test 1 must show <strong>Valid: False, Errors: 3</strong>.</p>' +
    '<textarea id="gate-m3" data-codemirror></textarea>' +
    '<div class="gate-controls">' +
      '<button class="btn-run" onclick="runGateM3()">&#9654; RUN</button>' +
      '<button class="btn-hint" onclick="toggleHint(\'hint-m3\')">HINT</button>' +
      '<button class="btn-reset" onclick="resetGateM3()">RESET</button>' +
    '</div>' +
    '<div id="hint-m3" class="hint-box hidden">' +
      '<strong>Hint:</strong> Uncomment the required_fields loop and the isinstance check. Replace the <code>#</code> comments with real code. Key: use <code>errors.append()</code> inside each if-block, NOT <code>return</code>. The final return must be <code>return len(errors) == 0, errors</code>.' +
    '</div>' +
    '<div id="output-m3" class="gate-output">Output will appear here after running...</div>' +
    '<div id="status-m3" class="gate-status"></div>' +
    '</div>';

  // NOTE: starterCode set via window after render
};

// Store starter codes globally for reset functions
window._m3StarterCode = [
  "def validate_config(config):",
  "    \"\"\"",
  "    Validate backup config. Return (is_valid, [errors]).",
  "    Collect ALL errors before returning -- never return early.",
  "    \"\"\"",
  "    errors = []",
  "",
  "    # --- Level 2: Check required fields ---",
  "    # required_fields = ['plan_name', 'sources', 'destination']",
  "    # for field in required_fields:",
  "    #     if field not in config:",
  "    #         errors.append(f\"Missing required field: '{field}'\")",
  "",
  "    # --- Level 3: Type validation ---",
  "    # if 'sources' in config and not isinstance(config['sources'], list):",
  "    #     errors.append(f\"'sources' must be a list, got {type(config['sources']).__name__}\")",
  "",
  "    # --- Level 4: Value validation ---",
  "    # if isinstance(config.get('sources'), list) and len(config['sources']) == 0:",
  "    #     errors.append(\"'sources' list cannot be empty\")",
  "",
  "    return len(errors) == 0, errors",
  "",
  "",
  "# --- TEST YOUR FUNCTION ---",
  "test1 = {\"version\": \"1.0\"}  # Missing all 3 required fields",
  "is_valid, errs = validate_config(test1)",
  "print(f\"Test 1 -- Valid: {is_valid}, Errors: {len(errs)}\")",
  "for e in errs:",
  "    print(f\"  - {e}\")"
].join('\n');

function resetGateM3() {
  var ed = state.editors['gate-m3'];
  if (ed) ed.setValue(window._m3StarterCode);
}

async function runGateM3() {
  var passed = await runCode('gate-m3', 'output-m3', function(stdout) {
    var hasErrors3 = stdout.includes('Errors: 3') ||
      (stdout.match(/Missing required field/g) || []).length >= 3;
    var isInvalid = stdout.includes('Valid: False');
    return hasErrors3 && isInvalid;
  });

  var statusEl = document.getElementById('status-m3');
  if (passed) {
    statusEl.innerHTML = '<span class="status-pass">&#10003; VALIDATOR COLLECTS ALL ERRORS &#8212; MISSION 03 COMPLETE</span>';
    setTimeout(function() { completeMission(3); }, 800);
  } else {
    statusEl.innerHTML = '<span class="status-fail">&#10007; Not quite. Test 1 must output "Valid: False" and show 3 errors. Uncomment the required_fields loop.</span>';
  }
}

// ===================================================
// MISSION 04 — WIRE_PIPELINE
// ===================================================
var FN_DETAILS = {
  load_config: "def load_config(filepath):\n    \"\"\"Load and parse a JSON config file. Returns None on error.\"\"\"\n    try:\n        with open(filepath) as f:\n            return json.load(f)\n    except FileNotFoundError:\n        print(f\"Error: '{filepath}' not found\")\n        return None\n    except json.JSONDecodeError as e:\n        print(f\"Error: Invalid JSON: {e}\")\n        return None",

  validate_config: "def validate_config(config: dict) -> tuple[bool, list[str]]:\n    \"\"\"Validate config across 4 levels. Collect ALL errors.\"\"\"\n    errors = []\n    required_fields = ['plan_name', 'sources', 'destination']\n    for field in required_fields:\n        if field not in config:\n            errors.append(f\"Missing required field: '{field}'\")\n    if 'sources' in config and not isinstance(config['sources'], list):\n        errors.append(f\"'sources' must be a list, got {type(config['sources']).__name__}\")\n    return len(errors) == 0, errors",

  simulate_backup: "def simulate_backup(config):\n    \"\"\"Generate dry-run simulation using random file data.\n    Does NOT read real directories or copy files.\"\"\"\n    operations = []\n    for source in config['sources']:\n        num_files = random.randint(5, 15)\n        files = [{\"name\": f\"{source['name'].lower().replace(' ','_')}_{i+1:03d}.log\",\n                  \"size_mb\": round(random.uniform(1, 100), 1)}\n                 for i in range(num_files)]\n        operations.append({\"source_name\": source['name'],\n                           \"source_path\": source['path'],\n                           \"files\": files})\n    total_files = sum(len(op['files']) for op in operations)\n    total_size = round(sum(f['size_mb'] for op in operations for f in op['files']), 1)\n    return {\"plan_name\": config['plan_name'], \"mode\": \"DRY-RUN\",\n            \"summary\": {\"total_sources\": len(operations), \"total_files\": total_files, \"total_size_mb\": total_size},\n            \"operations\": operations}",

  generate_report: "def generate_report(report_data):\n    \"\"\"Print formatted dry-run report to stdout.\"\"\"\n    sep = \"=\" * 70\n    print(sep)\n    print(f\"{'BACKUP PLAN DRY-RUN SIMULATION':^70}\")\n    print(sep)\n    s = report_data['summary']\n    print(f\"Total Files: {s['total_files']}\")\n    print(f\"Total Size:  {s['total_size_mb']} MB\")\n    print()\n    for i, op in enumerate(report_data['operations'], 1):\n        print(f\"SOURCE {i}: {op['source_name']}\")\n        print(f\"Path: {op['source_path']}\")\n        for f in op['files'][:3]:\n            print(f\"  -> {f['name']} ({f['size_mb']} MB)\")\n        remaining = len(op['files']) - 3\n        if remaining > 0:\n            print(f\"  ... and {remaining} more files\")\n        print()\n    print(sep)\n    print(\"DRY-RUN complete. No files were copied.\")\n    print(sep)",

  main: "def main():\n    \"\"\"Orchestrate the backup planning pipeline.\"\"\"\n    import sys\n    if len(sys.argv) < 2:\n        print(\"Usage: python backup_planner.py <config>\")\n        sys.exit(1)\n    filepath = sys.argv[1]\n    config = load_config(filepath)           # Step 1: Load\n    if config is None: sys.exit(1)\n    is_valid, errors = validate_config(config)  # Step 2: Validate\n    if not is_valid: sys.exit(1)\n    report_data = simulate_backup(config)    # Step 3: Simulate\n    generate_report(report_data)             # Step 4: Report\n\nif __name__ == \"__main__\":\n    main()"
};

MISSION_RENDERERS[4] = function() {
  return '<div class="panel">' +
    '<div class="panel-accent blue"></div>' +
    '<div class="panel-title blue">The 5-Function Pipeline</div>' +
    '<p>Each function has exactly one responsibility. Click any function in the diagram to see its full implementation.</p>' +
    '<div class="pipeline-diagram">' +
      '<div class="pipeline-nodes" id="pipeline-viz">' +
        '<div class="pipe-node" onclick="showFnDetails(\'load_config\')" data-fn="load_config"><div class="fn-name">load_config()</div><div class="fn-returns">&#8594; dict | None</div></div>' +
        '<div class="pipe-arrow">&#8594;</div>' +
        '<div class="pipe-node" onclick="showFnDetails(\'validate_config\')" data-fn="validate_config"><div class="fn-name">validate_config()</div><div class="fn-returns">&#8594; (bool, [str])</div></div>' +
        '<div class="pipe-arrow">&#8594;</div>' +
        '<div class="pipe-node" onclick="showFnDetails(\'simulate_backup\')" data-fn="simulate_backup"><div class="fn-name">simulate_backup()</div><div class="fn-returns">&#8594; dict</div></div>' +
        '<div class="pipe-arrow">&#8594;</div>' +
        '<div class="pipe-node" onclick="showFnDetails(\'generate_report\')" data-fn="generate_report"><div class="fn-name">generate_report()</div><div class="fn-returns">&#8594; None (prints)</div></div>' +
        '<div class="pipe-arrow">&#8594;</div>' +
        '<div class="pipe-node" onclick="showFnDetails(\'main\')" data-fn="main" style="border-color:var(--green-primary)"><div class="fn-name" style="color:var(--green-primary)">main()</div><div class="fn-returns">orchestrator</div></div>' +
      '</div>' +
    '</div>' +
    '<div id="fn-detail-box" class="code-block hidden" style="margin-top:16px; border-color:var(--blue-info);">' +
      '<pre id="fn-detail-code" style="white-space:pre-wrap;"></pre>' +
    '</div>' +
    '</div>' +

    '<div class="panel">' +
    '<div class="panel-accent red"></div>' +
    '<div class="panel-title red">Single Responsibility Principle</div>' +
    '<p><code>validate_config()</code> only validates. <code>simulate_backup()</code> only simulates. <code>generate_report()</code> only generates the report. Never mix concerns.</p>' +
    '<p>If you find yourself writing a function that both validates AND generates output — split it. This makes testing, debugging, and code reuse far easier.</p>' +
    '</div>' +

    '<div class="panel">' +
    '<div class="panel-accent amber"></div>' +
    '<div class="panel-title amber">Pipeline Ordering Challenge</div>' +
    '<p>Click the functions below in the correct pipeline order (first to last). All 5 must be in the right sequence to unlock the next mission.</p>' +
    '<div id="pipeline-order-buttons" style="display:flex; flex-wrap:wrap; gap:10px; margin:16px 0;"></div>' +
    '<div id="pipeline-selected" style="display:flex; align-items:center; gap:8px; min-height:52px; margin:12px 0; flex-wrap:wrap;">' +
      '<span style="color:var(--text-dim); font-size:0.8em; letter-spacing:1px;">Your order: </span>' +
    '</div>' +
    '<div class="gate-controls">' +
      '<button class="btn-run" onclick="checkPipelineOrder()">CHECK ORDER</button>' +
      '<button class="btn-reset" onclick="resetPipelineOrder()">RESET</button>' +
    '</div>' +
    '<div id="status-m4" class="gate-status"></div>' +
    '</div>';
};

window.showFnDetails = function(fnName) {
  var box = document.getElementById('fn-detail-box');
  var code = document.getElementById('fn-detail-code');
  document.querySelectorAll('.pipe-node').forEach(function(n) { n.classList.remove('active'); });
  var activeNode = document.querySelector('.pipe-node[data-fn="' + fnName + '"]');
  if (activeNode) activeNode.classList.add('active');
  if (code) code.textContent = FN_DETAILS[fnName] || '';
  if (box) box.classList.remove('hidden');
};

function initMission4() {
  var correct = ['load_config', 'validate_config', 'simulate_backup', 'generate_report', 'main'];
  var shuffled = correct.slice().sort(function() { return Math.random() - 0.5; });
  var selected = [];

  var btnContainer = document.getElementById('pipeline-order-buttons');
  var selectedContainer = document.getElementById('pipeline-selected');
  if (!btnContainer || !selectedContainer) return;

  function renderPipeline() {
    btnContainer.innerHTML = '';
    shuffled.forEach(function(fn) {
      if (selected.indexOf(fn) !== -1) return;
      var btn = document.createElement('button');
      btn.className = 'btn-hint';
      btn.textContent = fn + '()';
      btn.onclick = function() {
        selected.push(fn);
        renderPipeline();
      };
      btnContainer.appendChild(btn);
    });

    // Remove old selected chips (keep the label)
    selectedContainer.querySelectorAll('.selected-fn, .selected-arrow').forEach(function(el) { el.remove(); });
    selected.forEach(function(fn, i) {
      if (i > 0) {
        var arr = document.createElement('span');
        arr.className = 'selected-arrow';
        arr.textContent = ' \u2192 ';
        arr.style.color = 'var(--text-dim)';
        selectedContainer.appendChild(arr);
      }
      var chip = document.createElement('span');
      chip.className = 'selected-fn';
      chip.style.cssText = 'background:var(--bg-editor);border:1px solid var(--green-dim);padding:4px 10px;border-radius:2px;font-size:0.82em;color:var(--green-primary);font-family:var(--font);';
      chip.textContent = (i + 1) + '. ' + fn + '()';
      selectedContainer.appendChild(chip);
    });
  }

  renderPipeline();

  window.checkPipelineOrder = function() {
    var statusEl = document.getElementById('status-m4');
    if (selected.length < 5) {
      statusEl.innerHTML = '<span class="status-fail">&#10007; Select all 5 functions first.</span>';
      return;
    }
    var isCorrect = selected.every(function(fn, i) { return fn === correct[i]; });
    if (isCorrect) {
      statusEl.innerHTML = '<span class="status-pass">&#10003; PIPELINE WIRED CORRECTLY &#8212; MISSION 04 COMPLETE</span>';
      setTimeout(function() { completeMission(4); }, 800);
    } else {
      statusEl.innerHTML = '<span class="status-fail">&#10007; Order incorrect. Think: what do you need before you can validate? Before you can simulate?</span>';
    }
  };

  window.resetPipelineOrder = function() {
    selected.length = 0;
    renderPipeline();
    var statusEl = document.getElementById('status-m4');
    if (statusEl) statusEl.innerHTML = '';
  };
}

// ===================================================
// MISSION 05 — DRY_RUN_SIM
// ===================================================
window._m5StarterCode = [
  "import random",
  "",
  "def simulate_backup(config):",
  "    \"\"\"",
  "    Generate a dry-run simulation using fake file data.",
  "    DO NOT read real directories. Use random module only.",
  "    Returns dict with plan_name, mode, summary, operations.",
  "    \"\"\"",
  "    operations = []",
  "",
  "    for source in config['sources']:",
  "        # Create 5-15 fake files for this source",
  "        # num_files = random.randint(5, 15)",
  "        # files = []",
  "        # for i in range(num_files):",
  "        #     size_mb = round(random.uniform(1, 100), 1)",
  "        #     name = f\"{source['name'].lower().replace(' ', '_')}_{i+1:03d}.log\"",
  "        #     files.append({'name': name, 'size_mb': size_mb})",
  "        # operations.append({'source_name': source['name'], 'source_path': source['path'], 'files': files})",
  "        pass",
  "",
  "    total_files = sum(len(op['files']) for op in operations)",
  "    total_size = round(sum(f['size_mb'] for op in operations for f in op['files']), 1)",
  "",
  "    return {",
  "        'plan_name': config['plan_name'],",
  "        'mode': 'DRY-RUN',",
  "        'summary': {",
  "            'total_sources': len(operations),",
  "            'total_files': total_files,",
  "            'total_size_mb': total_size",
  "        },",
  "        'operations': operations",
  "    }",
  "",
  "",
  "def generate_report(report_data):",
  "    \"\"\"Print a formatted dry-run report to stdout.\"\"\"",
  "    sep = '=' * 70",
  "    print(sep)",
  "    print(f\"{'BACKUP PLAN DRY-RUN SIMULATION':^70}\")",
  "    print(sep)",
  "    print(f\"Plan: {report_data['plan_name']}\")",
  "    print(f\"Mode: {report_data['mode']} (no files will be copied)\")",
  "    print()",
  "    s = report_data['summary']",
  "    print('SUMMARY')",
  "    print('-' * 7)",
  "    print(f\"Total Sources:  {s['total_sources']}\")",
  "    print(f\"Total Files:    {s['total_files']}\")",
  "    print(f\"Total Size:     {s['total_size_mb']} MB\")",
  "    print()",
  "    # YOUR CODE HERE: loop over report_data['operations']",
  "    # For each op: print SOURCE name, path, file count",
  "    # Show first 3 files, then '... and N more files'",
  "    print(sep)",
  "    print('DRY-RUN complete. No files were copied.')",
  "    print(sep)",
  "",
  "",
  "# Test config",
  "test_config = {",
  "    'plan_name': 'Security Logs Daily Backup',",
  "    'sources': [",
  "        {'name': 'Firewall Logs', 'path': '/var/log/firewall'},",
  "        {'name': 'IDS Alerts',    'path': '/var/log/suricata'}",
  "    ],",
  "    'destination': {'base_path': '/backup/security_logs'}",
  "}",
  "",
  "report = simulate_backup(test_config)",
  "generate_report(report)"
].join('\n');

MISSION_RENDERERS[5] = function() {
  return '<div class="panel">' +
    '<div class="panel-accent red"></div>' +
    '<div class="panel-title red">Critical: Dry-Run Only</div>' +
    '<p>This simulation uses the <code>random</code> module for all file data. Never read real directories. Never copy actual files. The entire point is to show what <em>would</em> happen without doing it.</p>' +
    '</div>' +

    '<div class="panel">' +
    '<div class="panel-accent"></div>' +
    '<div class="panel-title">Expected Report Output</div>' +
    '<p>Your generate_report() should produce output in this format:</p>' +
    '<div class="code-block">' +
      '<span class="code-lang-tag">output</span>' +
      '<pre><code>======================================================================\n' +
      '              BACKUP PLAN DRY-RUN SIMULATION\n' +
      '======================================================================\n' +
      'Plan: Security Logs Daily Backup\n' +
      'Mode: DRY-RUN (no files will be copied)\n\n' +
      'SUMMARY\n' +
      '-------\n' +
      'Total Sources:  2\n' +
      'Total Files:    &lt;10-30&gt;\n' +
      'Total Size:     &lt;float&gt; MB\n\n' +
      'SOURCE 1: Firewall Logs\n' +
      'Path: /var/log/firewall\n' +
      '  -&gt; firewall_logs_001.log (23.4 MB)\n' +
      '  -&gt; firewall_logs_002.log (15.8 MB)\n' +
      '  -&gt; firewall_logs_003.log (8.1 MB)\n' +
      '  ... and N more files\n\n' +
      '======================================================================\n' +
      'DRY-RUN complete. No files were copied.\n' +
      '======================================================================</code></pre>' +
    '</div>' +
    '</div>' +

    '<div class="code-gate">' +
    '<p style="margin-bottom:12px; color:var(--text-dim); font-size:0.85em;">Implement <code>simulate_backup()</code> by uncommenting the loop. Then add source output to <code>generate_report()</code>. Output must contain "DRY-RUN", both source names, and "No files were copied".</p>' +
    '<textarea id="gate-m5" data-codemirror></textarea>' +
    '<div class="gate-controls">' +
      '<button class="btn-run" onclick="runGateM5()">&#9654; RUN</button>' +
      '<button class="btn-hint" onclick="toggleHint(\'hint-m5\')">HINT</button>' +
      '<button class="btn-reset" onclick="resetGateM5()">RESET</button>' +
    '</div>' +
    '<div id="hint-m5" class="hint-box hidden">' +
      '<strong>simulate_backup hint:</strong> Remove the <code>pass</code> and uncomment the loop lines. ' +
      '<strong>generate_report hint:</strong> Add a for loop: <code>for i, op in enumerate(report_data[\'operations\'], 1): print(f"SOURCE {i}: {op[\'source_name\']}")</code>. Show first 3 files: <code>for f in op[\'files\'][:3]: print(f"  -&gt; {f[\'name\']} ({f[\'size_mb\']} MB)")</code>' +
    '</div>' +
    '<div id="output-m5" class="gate-output">Output will appear here after running...</div>' +
    '<div id="status-m5" class="gate-status"></div>' +
    '</div>';
};

function resetGateM5() {
  var ed = state.editors['gate-m5'];
  if (ed) ed.setValue(window._m5StarterCode);
}

async function runGateM5() {
  var passed = await runCode('gate-m5', 'output-m5', function(stdout) {
    return stdout.includes('DRY-RUN') &&
           stdout.includes('Firewall Logs') &&
           stdout.includes('IDS Alerts') &&
           stdout.includes('No files were copied');
  });

  var statusEl = document.getElementById('status-m5');
  if (passed) {
    statusEl.innerHTML = '<span class="status-pass">&#10003; SIMULATION COMPLETE &#8212; MISSION 05 COMPLETE</span>';
    setTimeout(function() { completeMission(5); }, 800);
  } else {
    statusEl.innerHTML = '<span class="status-fail">&#10007; Output must include "DRY-RUN", both source names ("Firewall Logs" and "IDS Alerts"), and "No files were copied". Check your generate_report() loop.</span>';
  }
}

// ===================================================
// MISSION 06 — FINAL_CHALLENGE
// ===================================================
window._c1StarterCode = [
  "# BROKEN: Returns after finding first error",
  "# FIX IT: Collect ALL errors before returning",
  "",
  "def validate_config(config):",
  "    if 'plan_name' not in config:",
  "        return False, [\"Missing required field: 'plan_name'\"]",
  "    if 'sources' not in config:",
  "        return False, [\"Missing required field: 'sources'\"]",
  "    if 'destination' not in config:",
  "        return False, [\"Missing required field: 'destination'\"]",
  "    return True, []",
  "",
  "# Test: should produce 3 errors, not 1",
  "result = validate_config({'version': '1.0'})",
  "print(f'Valid: {result[0]}, Errors: {len(result[1])}')",
  "for e in result[1]:",
  "    print(f'  - {e}')"
].join('\n');

window._c2StarterCode = [
  "# Add isinstance() type checking to validate_config",
  "# When 'sources' is not a list, add this error message:",
  "# \"'sources' must be a list, got <typename>\"",
  "",
  "def validate_config(config):",
  "    errors = []",
  "    required_fields = ['plan_name', 'sources', 'destination']",
  "    for field in required_fields:",
  "        if field not in config:",
  "            errors.append(f\"Missing required field: '{field}'\")",
  "",
  "    # YOUR CODE HERE",
  "    # if 'sources' in config and not isinstance(config['sources'], list):",
  "    #     errors.append(...)",
  "",
  "    return len(errors) == 0, errors",
  "",
  "bad_config = {",
  "    'plan_name': 'Test Plan',",
  "    'sources': 'not_a_list',",
  "    'destination': {'base_path': '/backup'}",
  "}",
  "is_valid, errs = validate_config(bad_config)",
  "print(f'Valid: {is_valid}')",
  "for e in errs:",
  "    print(f'  - {e}')"
].join('\n');

window._c3StarterCode = [
  "import random",
  "",
  "def simulate_backup(config):",
  "    operations = []",
  "",
  "    # YOUR CODE HERE",
  "    # for source in config['sources']:",
  "    #     num_files = random.randint(5, 15)",
  "    #     files = []",
  "    #     for i in range(num_files):",
  "    #         size_mb = round(random.uniform(1, 100), 1)",
  "    #         name = f\"{source['name'].lower().replace(' ', '_')}_{i+1:03d}.log\"",
  "    #         files.append({'name': name, 'size_mb': size_mb})",
  "    #     operations.append({'source_name': source['name'], 'source_path': source['path'], 'files': files})",
  "",
  "    total_files = sum(len(op['files']) for op in operations)",
  "    total_size = round(",
  "        sum(f['size_mb'] for op in operations for f in op['files']), 1",
  "    )",
  "    return {",
  "        'plan_name': config['plan_name'],",
  "        'mode': 'DRY-RUN',",
  "        'summary': {",
  "            'total_sources': len(operations),",
  "            'total_files': total_files,",
  "            'total_size_mb': total_size",
  "        },",
  "        'operations': operations",
  "    }",
  "",
  "test_config = {",
  "    'plan_name': 'Security Logs Daily Backup',",
  "    'sources': [",
  "        {'name': 'Firewall Logs', 'path': '/var/log/firewall'},",
  "        {'name': 'IDS Alerts',    'path': '/var/log/suricata'}",
  "    ],",
  "    'destination': {'base_path': '/backup/security_logs'}",
  "}",
  "result = simulate_backup(test_config)",
  "print(f\"Mode: {result['mode']}\")",
  "print(f\"Sources: {result['summary']['total_sources']}\")",
  "print(f\"Files: {result['summary']['total_files']}\")",
  "print(f\"Size: {result['summary']['total_size_mb']} MB\")"
].join('\n');

var challengesPassed = { 1: false, 2: false, 3: false };

MISSION_RENDERERS[6] = function() {
  return '<div class="panel">' +
    '<div class="panel-accent"></div>' +
    '<div class="panel-title">Final Mission &#8212; Three Challenges</div>' +
    '<p>Complete all three to finish your mission and contain the breach. Each challenge tests a key skill from this week.</p>' +
    '<div id="challenge-progress" style="display:flex;gap:12px;margin:12px 0;flex-wrap:wrap;">' +
      (function() {
        var badges = '';
        [1,2,3].forEach(function(n) {
          var passed = challengesPassed[n];
          var color = passed ? 'var(--green-primary)' : 'var(--text-dim)';
          var borderColor = passed ? 'var(--green-primary)' : 'var(--border)';
          var text = passed ? ('C' + n + ': PASS ✓') : ('C' + n + ': PENDING');
          badges += '<span id="c' + n + '-badge" style="padding:4px 12px;border:1px solid ' + borderColor + ';border-radius:2px;font-size:0.8em;color:' + color + ';font-family:var(--font);">' + text + '</span>';
        });
        return badges;
      })() +
    '</div>' +
    '</div>' +

    '<div class="code-gate">' +
    '<p style="margin-bottom:8px;"><strong style="color:var(--green-primary);">Challenge 1 &#8212; Fix the Validator</strong></p>' +
    '<p style="font-size:0.85em;color:var(--text-dim);margin-bottom:12px;">The broken validator returns after the first error. Fix it to collect ALL errors before returning. When called with <code>{\'version\': \'1.0\'}</code>, it must report 3 errors.</p>' +
    '<textarea id="gate-c1" data-codemirror></textarea>' +
    '<div class="gate-controls">' +
      '<button class="btn-run" onclick="runChallenge(1)">&#9654; RUN</button>' +
      '<button class="btn-hint" onclick="toggleHint(\'hint-c1\')">HINT</button>' +
      '<button class="btn-reset" onclick="resetChallenge(1)">RESET</button>' +
    '</div>' +
    '<div id="hint-c1" class="hint-box hidden">Replace each <code>return False, [...]</code> inside the if-blocks with <code>errors.append("...")</code>. Add <code>errors = []</code> at the top. Return <code>len(errors) == 0, errors</code> at the very end &#8212; NOT inside the if-blocks.</div>' +
    '<div id="output-c1" class="gate-output">Output will appear here...</div>' +
    '<div id="status-c1" class="gate-status"></div>' +
    '</div>' +

    '<div class="code-gate">' +
    '<p style="margin-bottom:8px;"><strong style="color:var(--green-primary);">Challenge 2 &#8212; Add Type Validation</strong></p>' +
    '<p style="font-size:0.85em;color:var(--text-dim);margin-bottom:12px;">Add <code>isinstance()</code> type checking. When <code>sources</code> is a string instead of a list, add the error: <code>"\'sources\' must be a list, got str"</code>.</p>' +
    '<textarea id="gate-c2" data-codemirror></textarea>' +
    '<div class="gate-controls">' +
      '<button class="btn-run" onclick="runChallenge(2)">&#9654; RUN</button>' +
      '<button class="btn-hint" onclick="toggleHint(\'hint-c2\')">HINT</button>' +
      '<button class="btn-reset" onclick="resetChallenge(2)">RESET</button>' +
    '</div>' +
    '<div id="hint-c2" class="hint-box hidden">Uncomment the block and fill in the error message: <code>errors.append(f"\'sources\' must be a list, got {type(config[\'sources\']).__name__}")</code>. Note: <code>type(value).__name__</code> gives you the type name as a string.</div>' +
    '<div id="output-c2" class="gate-output">Output will appear here...</div>' +
    '<div id="status-c2" class="gate-status"></div>' +
    '</div>' +

    '<div class="code-gate">' +
    '<p style="margin-bottom:8px;"><strong style="color:var(--green-primary);">Challenge 3 &#8212; Complete the Simulation</strong></p>' +
    '<p style="font-size:0.85em;color:var(--text-dim);margin-bottom:12px;">Implement <code>simulate_backup()</code> to return the correct structure. Must show Mode: DRY-RUN, Sources: 2, and at least 10 total files.</p>' +
    '<textarea id="gate-c3" data-codemirror></textarea>' +
    '<div class="gate-controls">' +
      '<button class="btn-run" onclick="runChallenge(3)">&#9654; RUN</button>' +
      '<button class="btn-hint" onclick="toggleHint(\'hint-c3\')">HINT</button>' +
      '<button class="btn-reset" onclick="resetChallenge(3)">RESET</button>' +
    '</div>' +
    '<div id="hint-c3" class="hint-box hidden">Uncomment the loop. For each source: use <code>random.randint(5, 15)</code> for num_files, <code>random.uniform(1, 100)</code> for size_mb. Build the files list then append to operations.</div>' +
    '<div id="output-c3" class="gate-output">Output will appear here...</div>' +
    '<div id="status-c3" class="gate-status"></div>' +
    '</div>' +

    '<div id="final-status" class="gate-status" style="font-size:1em; padding:16px 0; min-height:40px;"></div>';
};

function resetChallenge(n) {
  var starters = { 1: window._c1StarterCode, 2: window._c2StarterCode, 3: window._c3StarterCode };
  var ed = state.editors['gate-c' + n];
  if (ed) ed.setValue(starters[n]);
}

async function runChallenge(n) {
  var validators = {
    1: function(stdout) {
      return (stdout.includes('Errors: 3') || (stdout.match(/Missing required field/g) || []).length >= 3) &&
             stdout.includes('Valid: False');
    },
    2: function(stdout) {
      return stdout.includes("must be a list, got str") && stdout.includes('Valid: False');
    },
    3: function(stdout) {
      var filesMatch = stdout.match(/Files:\s*(\d+)/);
      var fileCount = filesMatch ? parseInt(filesMatch[1]) : 0;
      return stdout.includes('Mode: DRY-RUN') &&
             stdout.includes('Sources: 2') &&
             fileCount >= 10;
    }
  };

  var passed = await runCode('gate-c' + n, 'output-c' + n, validators[n]);
  challengesPassed[n] = passed;

  var badge = document.getElementById('c' + n + '-badge');
  var statusEl = document.getElementById('status-c' + n);

  if (passed) {
    badge.style.borderColor = 'var(--green-primary)';
    badge.style.color = 'var(--green-primary)';
    badge.textContent = 'C' + n + ': PASS \u2713';
    statusEl.innerHTML = '<span class="status-pass">\u2713 Challenge ' + n + ' passed!</span>';
  } else {
    badge.style.borderColor = 'var(--red-alert)';
    badge.style.color = 'var(--red-alert)';
    badge.textContent = 'C' + n + ': FAIL';
    var failMessages = {
      1: 'Output must show "Valid: False" and 3 errors. Replace the return statements inside if-blocks with errors.append().',
      2: 'Output must include "must be a list, got str" and "Valid: False". Uncomment and complete the isinstance check.',
      3: 'Output must show "Mode: DRY-RUN", "Sources: 2", and at least 10 files. Uncomment the for loop.'
    };
    statusEl.innerHTML = '<span class="status-fail">\u2717 ' + failMessages[n] + '</span>';
  }

  var allPassed = challengesPassed[1] && challengesPassed[2] && challengesPassed[3];
  var finalEl = document.getElementById('final-status');
  if (finalEl && allPassed) {
    finalEl.innerHTML = '<span class="status-pass" style="font-size:1.1em;">\u2713 ALL CHALLENGES COMPLETE \u2014 OPERATION: BACKUP RESTORE COMPLETE. THE BREACH IS CONTAINED.</span>';
    setTimeout(function() { completeMission(6); }, 1200);
  }
}
