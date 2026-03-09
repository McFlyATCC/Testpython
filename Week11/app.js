// ===== STATE =====
const STORAGE_KEY = 'cvnp2646_w11_progress';

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
  { id: 0, key: 'ORIENTATION',    label: '00\nORIENT',   icon: '⬡' },
  { id: 1, key: 'RECURSION',      label: '01\nRECURSE',  icon: '⬡' },
  { id: 2, key: 'NESTED_JSON',    label: '02\nNESTED',   icon: '⬡' },
  { id: 3, key: 'DRIFT_RESULT',   label: '03\nCLASS',    icon: '⬡' },
  { id: 4, key: 'TRAVERSE_GATE',  label: '04\nTRAVERSE', icon: '⬡' },
  { id: 5, key: 'DRIFT_SIM',      label: '05\nSIMULATE', icon: '⬡' },
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
    showBriefing('OPERATION COMPLETE. Configuration drift detector is online. Recursive comparison is running. Critical findings are flagged and exported. Outstanding work, Analyst.', null);
    renderMissionMap();
    updateProgress();
  }
}

// ===== COMMANDER ZHANG BRIEFINGS =====
const BRIEFINGS = [
  'Welcome to CVNP Configuration Compliance Operations. Firewall rules change. Auth settings drift. Without automated comparison, you will never catch it. This week you build the recursive detector.',
  'Good. Now master recursion fundamentals. A function calling itself sounds circular — but with a base case, it terminates cleanly and handles unlimited nesting depth.',
  'Base case and recursive call confirmed. Now apply recursion to nested JSON. The key insight: dicts and lists recurse deeper, primitives are the base case.',
  'JSON traversal solid. Now study the DriftResult class. Classes bundle findings with behavior — is_critical() and to_dict() make the output useful for both humans and automation.',
  'DriftResult understood. Now implement the recursive leaf counter. This proves you can write a recursive function that handles all three node types correctly.',
  'Recursive traversal verified. Run the drift simulator. See how three config scenarios produce different drift findings.',
  'Three final challenges stand between you and a working drift detector. Pass all three to complete the operation.',
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
    const qPanel = document.getElementById('m1-question-panel');
    if (qPanel) {
      qPanel.style.display = 'block';
      qPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

// ===== RENDER MISSION (dispatcher) =====
function renderMission(id) {
  document.title = 'MISSION ' + String(id).padStart(2,'0') + ' — ' + (MISSIONS[id] ? MISSIONS[id].key : '') + ' | OPERATION: DRIFT LOCK';
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
    <div class="panel-title">What Is Configuration Drift?</div>
    <p>Security baselines define the approved state of a system — firewall rules, authentication settings, encryption standards. Over time, administrators make small changes. Each change alone may seem harmless. Accumulated, they represent drift from a known-secure state.</p>
    <p>Manual comparison of nested JSON configs fails immediately — you cannot visually diff a 500-key firewall config file reliably. Recursive code navigates to any depth automatically, finding every changed value no matter how deeply it is buried.</p>
    <div class="concept-grid">
      <div class="concept-card">
        <h3>Recursion</h3>
        <p>A function that calls itself with a smaller version of the same problem. Perfect for nested data where you don't know the depth in advance. Every recursive function needs a <strong>base case</strong> that stops the calls.</p>
      </div>
      <div class="concept-card">
        <h3>Nested JSON</h3>
        <p>Security configs are hierarchical — firewall contains rules, rules contain ports, ports contain values. Loops only handle one level. Recursion handles <em>any</em> level because each nested dict is the same structure as the parent.</p>
      </div>
      <div class="concept-card">
        <h3>DriftResult Class</h3>
        <p>A class bundles a finding with behavior. Each <code>DriftResult</code> knows its path, drift type, baseline value, and current value. It can classify itself as critical and export itself to a dict for JSON output.</p>
      </div>
      <div class="concept-card">
        <h3>Three Drift Types</h3>
        <p><strong>modified</strong> — value changed at an existing path. <strong>missing</strong> — key present in baseline, absent in current. <strong>extra</strong> — key absent in baseline, present in current (unauthorized addition).</p>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Orientation Check — 3 Questions</div>
    <p>Answer all three correctly to unlock Mission 01.</p>

    <div class="quiz-question" id="q0-0">
      <p><strong>Q1:</strong> What is the term for the condition in a recursive function that prevents it from calling itself indefinitely?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">Exit point</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, true)">Base case</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">Return guard</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">Stack limit</button>
      </div>
    </div>

    <div class="quiz-question" id="q0-1">
      <p><strong>Q2:</strong> What Python error occurs when a recursive function has no base case and exhausts the call stack?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">OverflowError</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">MemoryError</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, true)">RecursionError</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">StackOverflowError</button>
      </div>
    </div>

    <div class="quiz-question" id="q0-2">
      <p><strong>Q3:</strong> When traversing a nested JSON config with <em>unknown</em> nesting depth, why is recursion preferred over a fixed number of loops?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">Recursion is faster than loops for all operations</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, true)">Loops require knowing the depth in advance — recursion handles any depth automatically</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">Python does not support nested loops</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">Recursion uses less memory than loops</button>
      </div>
    </div>

    <div id="m0-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 01 — RECURSION
// ===================================================
MISSION_RENDERERS[1] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Recursion Fundamentals</div>
    <p>A recursive function solves a problem by solving a smaller version of the same problem. It calls itself with a reduced input until it reaches the base case — a condition so simple it can be answered directly.</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code>def countdown(n):
    if n <= 0:           # BASE CASE — stops the recursion
        print("Done!")
        return

    print(n)
    countdown(n - 1)     # RECURSIVE CALL — smaller input each time

countdown(3)
# Output: 3  2  1  Done!</code></pre>
    </div>
    <div class="hint-box">
      <strong>Two required components:</strong> Every recursive function must have (1) a <strong>base case</strong> that returns without calling itself, and (2) a <strong>recursive call</strong> that moves toward the base case. Missing the base case causes <code>RecursionError</code>. Moving away from the base case causes infinite recursion too.
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Read All Four Recursion Cards</div>
    <p style="color:var(--text-dim); font-size:0.85em;">Click each card to read it. All four must be reviewed before the question unlocks.</p>
    <div class="concept-grid">
      <div class="concept-card" id="card-m1-0" onclick="visitCard('m1', 0, 4)">
        <h3>The Base Case</h3>
        <p>The condition that terminates recursion without another call. For config traversal: a primitive value (string, int, bool) is the base case — there is nothing to recurse into. Without it, you get <code>RecursionError: maximum recursion depth exceeded</code>.</p>
      </div>
      <div class="concept-card" id="card-m1-1" onclick="visitCard('m1', 1, 4)">
        <h3>The Recursive Call</h3>
        <p>The call to the same function with a <em>smaller</em> or <em>simpler</em> input. For dict traversal, the recursive call processes one nested value — always one level deeper than the current call. Each call gets its own local variables on the call stack.</p>
      </div>
      <div class="concept-card" id="card-m1-2" onclick="visitCard('m1', 2, 4)">
        <h3>The Call Stack</h3>
        <p>Python maintains a call stack — a record of all active function calls. Each recursive call adds a frame. Python's default limit is ~1000 frames. For security configs, this is more than enough — real configs rarely exceed 10-15 levels of nesting.</p>
      </div>
      <div class="concept-card" id="card-m1-3" onclick="visitCard('m1', 3, 4)">
        <h3>Unwinding</h3>
        <p>After the base case is reached, each call returns its result to the caller — unwinding the stack. For drift detection, each call returns a list of findings. The caller extends its own list with these findings before returning to its caller.</p>
      </div>
    </div>
    <div id="card-m1-status" style="color:var(--text-dim); font-size:0.8em; margin-top:8px; letter-spacing:1px;">0 / 4 cards read</div>
  </div>

  <div class="panel" id="m1-question-panel" style="display:none">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Comprehension Check</div>
    <div class="quiz-question" id="q1-0">
      <p><strong>Q:</strong> In a recursive function, what MUST exist to prevent <code>RecursionError</code>?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">A try/except block wrapping the recursive call</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, true)">A base case that returns without making another recursive call</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">A counter variable that tracks the number of calls</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">A global variable storing all intermediate results</button>
      </div>
    </div>
    <div id="m1-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 02 — NESTED_JSON
// ===================================================
MISSION_RENDERERS[2] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Recursion for Nested JSON</div>
    <p>JSON configs are trees. Every node is either a container (dict or list — recurse into it) or a leaf (primitive — base case). The <code>isinstance()</code> check distinguishes them, directing the function to recurse or return.</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code>def traverse_config(config, path="root"):
    """Recursively visit every leaf node in a nested config."""

    if isinstance(config, dict):
        for key, value in config.items():
            traverse_config(value, path=f"{path}.{key}")   # recurse deeper

    elif isinstance(config, list):
        for i, item in enumerate(config):
            traverse_config(item, path=f"{path}[{i}]")     # recurse deeper

    else:
        # BASE CASE: primitive value — print the path and value
        print(f"{path} = {config!r}")


traverse_config({
    "firewall": {
        "enabled": True,
        "ports": [80, 443]
    }
})
# root.firewall.enabled = True
# root.firewall.ports[0] = 80
# root.firewall.ports[1] = 443</code></pre>
    </div>
    <div class="hint-box">
      <strong>Path tracking:</strong> Each recursive call passes a <code>path</code> string that accumulates dot-notation as it descends. When a drift is found at the base case, the path tells you exactly where in the config the change occurred — e.g., <code>"root.firewall.rules[0].action"</code>.
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">isinstance() — The Three-Way Branch</div>
    <p>The pattern <code>isinstance(config, dict) / isinstance(config, list) / else</code> appears in every JSON-recursive function. It is the core decision that makes recursion work for arbitrary nesting.</p>
    <table>
      <thead>
        <tr><th>Node type</th><th>isinstance check</th><th>Action</th></tr>
      </thead>
      <tbody>
        <tr><td><code>{"key": ...}</code></td><td><code>isinstance(config, dict)</code></td><td>Iterate keys, recurse into each value</td></tr>
        <tr><td><code>[item, ...]</code></td><td><code>isinstance(config, list)</code></td><td>Iterate indices, recurse into each item</td></tr>
        <tr><td><code>"text"</code>, <code>42</code>, <code>True</code></td><td><code>else</code></td><td>Base case — process the primitive value</td></tr>
      </tbody>
    </table>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Nested JSON Check</div>
    <div class="quiz-question" id="q2-0">
      <p><strong>Q:</strong> In <code>traverse_config(config)</code>, what acts as the base case that stops the recursion?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">When config is a dict with no keys</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">When the recursion depth exceeds 10</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, true)">When config is a primitive value (string, int, bool) — the else branch</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">When config is an empty list</button>
      </div>
    </div>
    <div id="m2-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 03 — DRIFT_RESULT
// ===================================================
MISSION_RENDERERS[3] = function() {
  return `
  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">The DriftResult Class</div>
    <p>Instead of returning raw tuples or dicts, the drift detector returns <code>DriftResult</code> objects. A class bundles data with behavior — each finding knows how to classify itself as critical and how to export itself for JSON reporting.</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code>class DriftResult:
    """Represents a single configuration drift finding."""

    def __init__(self, path, drift_type, baseline_value, current_value):
        self.path            = path           # "root.firewall.rules[0].action"
        self.drift_type      = drift_type     # "modified", "missing", "extra"
        self.baseline_value  = baseline_value # approved state
        self.current_value   = current_value  # actual state

    def is_critical(self):
        """True if path contains a security-sensitive keyword."""
        critical_keywords = ["firewall", "authentication", "encryption"]
        return any(kw in self.path.lower() for kw in critical_keywords)

    def to_dict(self):
        """Convert to dict for JSON export."""
        return {
            "path":     self.path,
            "type":     self.drift_type,
            "baseline": self.baseline_value,
            "current":  self.current_value,
            "critical": self.is_critical()
        }</code></pre>
    </div>
    <div class="hint-box">
      <strong>Why a class?</strong> Returning a plain dict works, but the caller must remember which keys exist and repeat the criticality logic everywhere. A class encapsulates both the data and the logic — <code>is_critical()</code> is defined once and works correctly on every finding automatically.
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">DriftResult Check — 4 Questions</div>
    <p>Answer all four correctly to unlock Mission 04.</p>

    <div class="quiz-question" id="q3-0">
      <p><strong>Q1:</strong> The three <code>drift_type</code> values that <code>compare_configs</code> produces are:</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">"added", "removed", "changed"</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, true)">"modified", "missing", "extra"</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">"new", "deleted", "updated"</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">"insert", "delete", "update"</button>
      </div>
    </div>

    <div class="quiz-question" id="q3-1">
      <p><strong>Q2:</strong> Which <code>DriftResult</code> method determines whether a finding involves a security-sensitive config area?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(3, 1, this, false)">to_dict()</button>
        <button class="quiz-option" onclick="answerQuiz(3, 1, this, false)">__str__()</button>
        <button class="quiz-option" onclick="answerQuiz(3, 1, this, true)">is_critical()</button>
        <button class="quiz-option" onclick="answerQuiz(3, 1, this, false)">__init__()</button>
      </div>
    </div>

    <div class="quiz-question" id="q3-2">
      <p><strong>Q3:</strong> A <code>DriftResult</code> with <code>path = "root.firewall.rules[0].action"</code>. What does <code>is_critical()</code> return?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(3, 2, this, false)">False — only top-level keys are checked</button>
        <button class="quiz-option" onclick="answerQuiz(3, 2, this, true)">True — "firewall" is in the critical keywords list</button>
        <button class="quiz-option" onclick="answerQuiz(3, 2, this, false)">None — the path contains list indices</button>
        <button class="quiz-option" onclick="answerQuiz(3, 2, this, false)">Raises an AttributeError</button>
      </div>
    </div>

    <div class="quiz-question" id="q3-3">
      <p><strong>Q4:</strong> <code>DriftResult.to_dict()</code> is useful because it:</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(3, 3, this, false)">Converts the finding to a printed string for terminal output</button>
        <button class="quiz-option" onclick="answerQuiz(3, 3, this, false)">Compresses the finding to save memory</button>
        <button class="quiz-option" onclick="answerQuiz(3, 3, this, true)">Returns a plain dict that can be serialized to JSON for automated reporting pipelines</button>
        <button class="quiz-option" onclick="answerQuiz(3, 3, this, false)">Validates that baseline and current values are different types</button>
      </div>
    </div>

    <div id="m3-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 04 — TRAVERSE_GATE
// ===================================================
window._m4StarterCode = [
  'def count_leaves(config):',
  '    """',
  '    Recursively count all primitive (leaf) values in a nested config.',
  '    Dicts and lists are containers — recurse into them.',
  '    Strings, ints, bools, None are leaves — count as 1.',
  '    """',
  '    if isinstance(config, dict):',
  '        return sum(count_leaves(v) for v in config.values())',
  '    elif isinstance(config, list):',
  '        return sum(count_leaves(item) for item in config)',
  '    else:',
  '        return 1  # base case: primitive value',
  '',
  '# Test config — count all leaf values manually to verify',
  '# version(1) + enabled(1) + max_rules(1) + 80(1) + 443(1) + 8080(1) = 6',
  'test_config = {',
  '    "version": "1.2",',
  '    "firewall": {',
  '        "enabled": True,',
  '        "max_rules": 100',
  '    },',
  '    "ports": [80, 443, 8080]',
  '}',
  '',
  'count = count_leaves(test_config)',
  'print(f"Leaf count: {count}")',
  'print(f"Correct (6): {count == 6}")',
  'print("count_leaves verified" if count == 6 else "FAILED")',
].join('\n');

MISSION_RENDERERS[4] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Recursive Leaf Counter</div>
    <p><code>count_leaves(config)</code> is a clean example of the three-way recursive pattern. It counts every primitive value in a nested structure — dicts and lists are transparent containers, primitives are what we're counting.</p>
    <p>This is the same structural pattern used by <code>compare_configs</code>. Master this and the full drift detector follows naturally.</p>
    <div class="hint-box">
      <strong>The three-branch pattern:</strong><br>
      <code>isinstance(config, dict)</code>  → recurse into each value<br>
      <code>isinstance(config, list)</code>  → recurse into each item<br>
      <code>else</code>                       → base case: return 1
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Code Gate — count_leaves</div>
    <p>The starter code is complete. Run it to verify the leaf count, then experiment — try adding a nested list of dicts and predict the count before running. The gate passes when the output confirms <strong>6</strong> and prints <code>count_leaves verified</code>.</p>
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
    <div class="panel-title">From Counting to Comparing</div>
    <p>The drift detector is the same three-branch pattern extended. Instead of returning <code>1</code> at the base case, it compares the baseline and current primitive values. If they differ, it appends a <code>DriftResult</code> to the findings list.</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <pre><code># count_leaves base case:
else:
    return 1

# compare_configs base case:
else:
    if baseline != current:
        drifts.append(DriftResult(path, "modified", baseline, current))</code></pre>
    </div>
  </div>
  `;
};

async function runM4() {
  const passed = await runCode('gate-m4', 'gate-m4-output', function(stdout) {
    return stdout.includes('Leaf count: 6') &&
           stdout.includes('Correct (6): True') &&
           stdout.includes('count_leaves verified');
  });
  const el = document.getElementById('m4-status');
  if (passed) {
    el.innerHTML = '<span class="status-pass">✓ All checks passed — MISSION 04 COMPLETE</span>';
    setTimeout(function() { completeMission(4); }, 800);
  } else {
    el.innerHTML = '<span class="status-fail">✗ Expected leaf count 6. Check that dicts and lists recurse and primitives return 1.</span>';
  }
}


// ===================================================
// MISSION 05 — DRIFT_SIM
// ===================================================
const driftSimState = { seenA: false, seenB: false, seenC: false };

function driftLog(text, cls) {
  const term = document.getElementById('drift-terminal');
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

function driftClear() {
  const term = document.getElementById('drift-terminal');
  if (term) term.innerHTML = '';
}

function runDriftScenario(key) {
  driftClear();

  if (key === 'A') {
    driftLog('>> Scenario A: Clean Config', 'info');
    driftLog('   Comparing baseline to current...', '');
    driftLog('', '');
    driftLog('   Checking root.version         ... match: "2.1" == "2.1"', 'success');
    driftLog('   Checking root.firewall.enabled  ... match: True == True', 'success');
    driftLog('   Checking root.firewall.action   ... match: "allow" == "allow"', 'success');
    driftLog('   Checking root.auth.mfa          ... match: True == True', 'success');
    driftLog('', '');
    driftLog('   Drifts found: 0', 'success');
    driftLog('   AUDIT RESULT: COMPLIANT', 'success');

  } else if (key === 'B') {
    driftLog('>> Scenario B: Modified Value', 'info');
    driftLog('   Comparing baseline to current...', '');
    driftLog('', '');
    driftLog('   Checking root.version              ... match', 'success');
    driftLog('   Checking root.firewall.enabled     ... match', 'success');
    driftLog('   Checking root.firewall.action      ... MISMATCH', 'error');
    driftLog('     baseline: "allow"', 'warn');
    driftLog('     current:  "deny"', 'error');
    driftLog('     path contains "firewall" -> CRITICAL', 'error');
    driftLog('   Checking root.auth.mfa             ... match', 'success');
    driftLog('', '');
    driftLog('   DriftResult(path="root.firewall.action", type="modified")', 'error');
    driftLog('   Drifts found: 1  (1 CRITICAL)', 'error');
    driftLog('   AUDIT RESULT: CRITICAL DRIFT DETECTED', 'error');

  } else if (key === 'C') {
    driftLog('>> Scenario C: Structural Changes', 'info');
    driftLog('   Comparing baseline to current...', '');
    driftLog('', '');
    driftLog('   Dict comparison at root.firewall:', 'info');
    driftLog('     baseline keys: {enabled, max_rules}', '');
    driftLog('     current keys:  {enabled}', '');
    driftLog('     missing keys:  {max_rules}', 'warn');
    driftLog('     -> DriftResult(path="root.firewall.max_rules", type="missing")', 'warn');
    driftLog('', '');
    driftLog('   Dict comparison at root.auth:', 'info');
    driftLog('     baseline keys: {method}', '');
    driftLog('     current keys:  {method, bypass}', '');
    driftLog('     extra keys:    {bypass}', 'error');
    driftLog('     -> DriftResult(path="root.auth.bypass", type="extra")', 'error');
    driftLog('   Checking root.auth.method          ... MISMATCH', 'error');
    driftLog('     baseline: "ldap"   current: "local"', 'error');
    driftLog('     -> DriftResult(path="root.auth.method", type="modified")', 'error');
    driftLog('     path contains "auth" -> NOT in critical keywords', 'warn');
    driftLog('', '');
    driftLog('   Drifts found: 3  (0 critical by keyword, all require review)', 'warn');
    driftLog('   AUDIT RESULT: DRIFT DETECTED', 'warn');
  }

  driftSimState['seen' + key] = true;
  const checkEl = document.getElementById('drift-check-' + key);
  if (checkEl) {
    checkEl.style.color = 'var(--green-primary)';
    checkEl.textContent = '✓ Scenario ' + key;
  }
  driftSimCheckComplete();
}

function driftSimCheckComplete() {
  if (driftSimState.seenA && driftSimState.seenB && driftSimState.seenC) {
    const statusEl = document.getElementById('m5-status');
    if (statusEl) statusEl.innerHTML = '<span class="status-pass">✓ ALL SCENARIOS ANALYZED — MISSION 05 COMPLETE</span>';
    setTimeout(function() { completeMission(5); }, 800);
  }
}

function initMission5() {
  driftSimState.seenA = false;
  driftSimState.seenB = false;
  driftSimState.seenC = false;
}

MISSION_RENDERERS[5] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Configuration Drift Simulator</div>
    <p>Run each scenario to see how <code>compare_configs</code> walks through the config tree and reports findings. Observe the path construction, the three-way branching, and how drift type is determined at each node. Analyze all three to unlock the final challenge.</p>
    <div class="concept-grid">
      <div class="concept-card">
        <h3>Scenario A</h3>
        <p><strong>Clean Config</strong><br>Baseline and current are identical. All recursive comparisons match. No DriftResult objects created. Audit passes.</p>
        <button class="btn-run" style="margin-top:14px; font-size:0.8em; padding:8px 16px;" onclick="runDriftScenario('A')">&#9654; COMPARE</button>
      </div>
      <div class="concept-card">
        <h3>Scenario B</h3>
        <p><strong>Modified Value</strong><br><code>firewall.action</code> changed from <code>"allow"</code> to <code>"deny"</code>. One leaf differs — one critical DriftResult generated.</p>
        <button class="btn-run" style="margin-top:14px; font-size:0.8em; padding:8px 16px;" onclick="runDriftScenario('B')">&#9654; COMPARE</button>
      </div>
      <div class="concept-card">
        <h3>Scenario C</h3>
        <p><strong>Structural Changes</strong><br>A key is missing, a key was added, and a value was modified — three DriftResult objects of different types at different depths.</p>
        <button class="btn-run" style="margin-top:14px; font-size:0.8em; padding:8px 16px;" onclick="runDriftScenario('C')">&#9654; COMPARE</button>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Comparison Terminal</div>
    <div id="drift-terminal" style="background:var(--bg-editor); border:1px solid var(--border); border-radius:3px; padding:16px; min-height:200px; font-family:var(--font); font-size:0.88em; overflow-y:auto; max-height:440px; white-space:pre-wrap;"></div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Scenarios Completed</div>
    <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:8px;">
      <div id="drift-check-A" style="color:var(--text-dim);">&#9744; Scenario A — Clean Config</div>
      <div id="drift-check-B" style="color:var(--text-dim);">&#9744; Scenario B — Modified Value</div>
      <div id="drift-check-C" style="color:var(--text-dim);">&#9744; Scenario C — Structural Changes</div>
    </div>
    <div id="m5-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 06 — FINAL_CHALLENGE
// ===================================================
window._c1StarterCode = [
  'def count_leaves(config):',
  '    """',
  '    Recursively count all primitive leaf values in a nested config.',
  '    Dicts and lists are containers. Primitives are leaves.',
  '    """',
  '    if isinstance(config, dict):',
  '        return sum(count_leaves(v) for v in config.values())',
  '    elif isinstance(config, list):',
  '        return sum(count_leaves(item) for item in config)',
  '    else:',
  '        return 1',
  '',
  '# Test config:',
  '# host(1) + method(1)+timeout(1)+mfa(1) + 2 IPs(2) + max_connections(1) = 8',
  'test_config = {',
  '    "host": "10.0.0.1",',
  '    "auth": {',
  '        "method": "ldap",',
  '        "timeout": 30,',
  '        "mfa": True',
  '    },',
  '    "allowed_ips": ["192.168.1.0", "10.0.0.0"],',
  '    "max_connections": 500',
  '}',
  'count = count_leaves(test_config)',
  'print(f"Leaf count: {count}")',
  'print(f"Count is 8: {count == 8}")',
  'print("count_leaves verified" if count == 8 else "FAILED")',
].join('\n');

window._c2StarterCode = [
  'class DriftResult:',
  '    """Represents a single configuration drift finding."""',
  '',
  '    def __init__(self, path, drift_type, baseline_value, current_value):',
  '        self.path           = path',
  '        self.drift_type     = drift_type',
  '        self.baseline_value = baseline_value',
  '        self.current_value  = current_value',
  '',
  '    def is_critical(self):',
  '        """True if path contains a security-sensitive keyword."""',
  '        critical_keywords = ["firewall", "authentication", "encryption"]',
  '        return any(kw in self.path.lower() for kw in critical_keywords)',
  '',
  '    def to_dict(self):',
  '        """Convert to dict for JSON export."""',
  '        return {',
  '            "path":     self.path,',
  '            "type":     self.drift_type,',
  '            "baseline": self.baseline_value,',
  '            "current":  self.current_value,',
  '            "critical": self.is_critical()',
  '        }',
  '',
  '# Test is_critical() and to_dict()',
  'r1 = DriftResult("root.firewall.action",       "modified", "allow", "deny")',
  'r2 = DriftResult("root.logging.level",          "modified", "INFO",  "DEBUG")',
  'r3 = DriftResult("root.authentication.method",  "modified", "ldap",  "local")',
  '',
  'print(f"firewall path critical: {r1.is_critical()}")',
  'print(f"logging path critical: {r2.is_critical()}")',
  'print(f"authentication path critical: {r3.is_critical()}")',
  'd = r1.to_dict()',
  'print(f"to_dict keys: {sorted(d.keys())}")',
  'print(f"to_dict critical: {d[\'critical\']}")',
  'print("DriftResult verified" if r1.is_critical() and not r2.is_critical() and r3.is_critical() and d["critical"] == True else "FAILED")',
].join('\n');

window._c3StarterCode = [
  'def find_modified(baseline, current, path="root"):',
  '    """',
  '    Recursively find all paths where primitive values have changed.',
  '    Returns list of (path, baseline_val, current_val) tuples.',
  '    Only reports modifications — does not detect missing/extra keys.',
  '    """',
  '    findings = []',
  '',
  '    if isinstance(baseline, dict) and isinstance(current, dict):',
  '        common_keys = set(baseline.keys()) & set(current.keys())',
  '        for key in common_keys:',
  '            findings.extend(find_modified(baseline[key], current[key], f"{path}.{key}"))',
  '',
  '    elif isinstance(baseline, list) and isinstance(current, list):',
  '        for i in range(min(len(baseline), len(current))):',
  '            findings.extend(find_modified(baseline[i], current[i], f"{path}[{i}]"))',
  '',
  '    else:',
  '        if baseline != current:',
  '            findings.append((path, baseline, current))',
  '',
  '    return findings',
  '',
  '# Test: two values changed at different nesting depths',
  'baseline = {',
  '    "server": {"host": "10.0.0.1", "port": 443},',
  '    "auth":   {"method": "ldap",   "timeout": 30}',
  '}',
  'current = {',
  '    "server": {"host": "10.0.0.1", "port": 80},',
  '    "auth":   {"method": "local",  "timeout": 30}',
  '}',
  'results = find_modified(baseline, current)',
  'paths = [r[0] for r in results]',
  'print(f"Modified count: {len(results)}")',
  'print(f"Port changed: {\'root.server.port\' in paths}")',
  'print(f"Auth method changed: {\'root.auth.method\' in paths}")',
  'print("find_modified verified" if len(results) == 2 and "root.server.port" in paths and "root.auth.method" in paths else "FAILED")',
].join('\n');

MISSION_RENDERERS[6] = function() {
  return `
  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Three Final Challenges</div>
    <p>Three functions form the core of your configuration drift detector. Each must pass its automated check. Pass all three to complete the operation.</p>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Challenge 1 — count_leaves</div>
    <p>Recursively count all primitive leaf values in a nested config. This test config has 8 leaves — trace through the nesting manually before running to confirm your understanding.</p>
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
    <div class="panel-title">Challenge 2 — DriftResult class</div>
    <p>Implement the full <code>DriftResult</code> class with <code>__init__</code>, <code>is_critical()</code>, and <code>to_dict()</code>. Firewall and authentication paths must be critical. Logging paths must not be.</p>
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
    <div class="panel-title">Challenge 3 — find_modified</div>
    <p>Implement the recursive <code>find_modified(baseline, current, path)</code> that returns a list of <code>(path, baseline_val, current_val)</code> tuples for every primitive that changed. The test has two changes at different nesting depths — both must be found.</p>
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
    if (el) el.innerHTML = '<div class="panel"><div class="panel-accent" style="background:var(--green-primary)"></div><div class="panel-title" style="color:var(--green-primary)">OPERATION COMPLETE</div><p>Configuration drift detector is fully operational. You can write recursive functions with correct base cases, traverse nested JSON of arbitrary depth, classify findings with the DriftResult class, and surface modified values at any nesting level. The compliance report is ready.</p></div>';
    setTimeout(function() { completeMission(6); }, 1000);
  }
}

async function runC1() {
  var passed = await runCode('gate-c1', 'gate-c1-output', function(stdout) {
    return stdout.includes('Leaf count: 8') &&
           stdout.includes('Count is 8: True') &&
           stdout.includes('count_leaves verified');
  });
  var el = document.getElementById('c1-status');
  if (passed) {
    el.innerHTML = '<span class="status-pass">✓ Challenge 1 passed</span>';
    challengesPassed.c1 = true;
    checkAllChallenges();
  } else {
    el.innerHTML = '<span class="status-fail">✗ Expected leaf count 8. Trace: host(1) + method+timeout+mfa(3) + 2 IPs(2) + max_connections(1) = 8.</span>';
  }
}

async function runC2() {
  var passed = await runCode('gate-c2', 'gate-c2-output', function(stdout) {
    return stdout.includes('firewall path critical: True') &&
           stdout.includes('logging path critical: False') &&
           stdout.includes('authentication path critical: True') &&
           stdout.includes('to_dict critical: True') &&
           stdout.includes('DriftResult verified');
  });
  var el = document.getElementById('c2-status');
  if (passed) {
    el.innerHTML = '<span class="status-pass">✓ Challenge 2 passed</span>';
    challengesPassed.c2 = true;
    checkAllChallenges();
  } else {
    el.innerHTML = '<span class="status-fail">✗ Check is_critical() keywords: ["firewall", "authentication", "encryption"]. to_dict() must include "critical" key.</span>';
  }
}

async function runC3() {
  var passed = await runCode('gate-c3', 'gate-c3-output', function(stdout) {
    return stdout.includes('Modified count: 2') &&
           stdout.includes('Port changed: True') &&
           stdout.includes('Auth method changed: True') &&
           stdout.includes('find_modified verified');
  });
  var el = document.getElementById('c3-status');
  if (passed) {
    el.innerHTML = '<span class="status-pass">✓ Challenge 3 passed</span>';
    challengesPassed.c3 = true;
    checkAllChallenges();
  } else {
    el.innerHTML = '<span class="status-fail">✗ Must find both root.server.port and root.auth.method changes. Check the three-branch isinstance pattern and path construction.</span>';
  }
}
