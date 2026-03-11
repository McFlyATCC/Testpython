// ===== STATE =====
const STORAGE_KEY = 'cvnp2646_w2_progress';

const state = {
  completedMissions: new Set(),
  currentMission: 0,
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
  { id: 0, key: 'ORIENTATION',  label: '00\nORIENT',   icon: '⬡' },
  { id: 1, key: 'EXEC_MODEL',   label: '01\nEXEC',     icon: '⬡' },
  { id: 2, key: 'VENV',         label: '02\nVENV',     icon: '⬡' },
  { id: 3, key: 'SYS_ARGV',     label: '03\nARGV',     icon: '⬡' },
  { id: 4, key: 'HASHLIB',      label: '04\nHASH',     icon: '⬡' },
  { id: 5, key: 'TOOL_SIM',     label: '05\nSIMULATE', icon: '⬡' },
  { id: 6, key: 'FINAL_CHECK',  label: '06\nFINAL',    icon: '⬡' },
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
      '<div class="mission-icon">' + (isCompleted ? '&#10003;' : String(mission.id).padStart(2, '0')) + '</div>' +
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
    showBriefing('OPERATION TOOLKIT COMPLETE. Development environment isolated. Scripts executable. Arguments parsed. Hashes verified. You have the tools to build and run professional command-line security utilities. Outstanding work, Analyst.', null);
    renderMissionMap();
    updateProgress();
  }
}

// ===== COMMANDER ZHANG BRIEFINGS =====
const BRIEFINGS = [
  'Welcome to OPERATION: TOOLKIT. A security analyst without a clean, isolated development environment is a security risk. This week you configure Python correctly, build executable tools, and write scripts that accept arguments like professional command-line utilities.',
  'Orientation complete. Now understand how Python actually executes your code. Source \u2192 bytecode \u2192 interpreter. No manual compilation. This hybrid model is why Python is both fast to develop and fast enough for security work.',
  'Execution model confirmed. Now master virtual environments. Every security project gets its own isolated Python installation. Dependencies never conflict. Tools never break each other. This is not optional for professional security development.',
  'Virtual environments locked. Now learn sys.argv \u2014 the command-line argument vector. Every production security tool accepts arguments: targets, thresholds, output paths. sys.argv is where those arguments live.',
  'sys.argv mastered. Now use hashlib for cryptographic hashing. SHA256 fingerprints files. MD5 checks quick integrity. Never trust a downloaded security tool without verifying its hash first.',
  'Security tool foundations complete. Run the tool simulator. See password checker and hash generator execute \u2014 real patterns from the lecture demos.',
  'Final checks stand between you and a complete development toolkit. Confirm every item to complete OPERATION: TOOLKIT.',
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
  const totalMap = { 0: 3, 1: 1, 2: 4, 3: 1, 4: 1, 5: 0, 6: 0 };
  const totalQuestions = totalMap[missionId] !== undefined ? totalMap[missionId] : 0;
  const answeredCount = Object.keys(answers).length;
  const allCorrect = Object.values(answers).every(Boolean);
  if (answeredCount < totalQuestions) return;
  if (totalQuestions === 0) return;
  const statusEl = document.getElementById('m' + missionId + '-status');
  if (!statusEl) return;
  if (allCorrect) {
    statusEl.innerHTML = '<span class="status-pass">\u2713 ALL CORRECT \u2014 MISSION 0' + missionId + ' COMPLETE</span>';
    setTimeout(function() { completeMission(missionId); }, 600);
  } else {
    statusEl.innerHTML = '<span class="status-fail">\u2717 Some answers were wrong. Re-read the panels above and refresh to try again.</span>';
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
  if (statusEl) statusEl.textContent = count + ' / ' + total + ' components reviewed';
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
  document.title = 'MISSION ' + String(id).padStart(2, '0') + ' \u2014 ' + (MISSIONS[id] ? MISSIONS[id].key : '') + ' | OPERATION: TOOLKIT';
  const container = document.getElementById('mission-content');
  const renderer = MISSION_RENDERERS[id];
  container.innerHTML = renderer ? renderer() : '<p style="color:var(--text-dim); padding:40px 0;">Mission ' + id + ' content loading...</p>';
  if (id === 5) { if (typeof initMission5 === 'function') initMission5(); }
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
});


// ===================================================
// MISSION 00 — ORIENTATION
// ===================================================
MISSION_RENDERERS[0] = function() {
  return `
  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Professional Security Development</div>
    <p>The difference between a student script and a professional security tool is not complexity \u2014 it is <strong>correctness</strong>. This week you build the foundation: a clean Python execution model, isolated environments, executable scripts, command-line arguments, and cryptographic hashing.</p>

    <div class="panel" style="margin-top:16px; background:var(--bg-deep);">
      <div class="panel-title blue">Python Execution Model</div>
      <div class="code-block">
        <pre><code>Source code (.py)
    &#8595;
Compile to bytecode (.pyc in __pycache__)
    &#8595;
Python interpreter executes bytecode</code></pre>
      </div>
      <ul style="margin-top:12px;">
        <li>&ldquo;Interpreted&rdquo; is a simplification &mdash; Python compiles to bytecode first, then interprets it</li>
        <li>You never see this compilation step &mdash; <code>python3 script.py</code> does it automatically</li>
        <li>The .pyc files in __pycache__ are the bytecode cache &mdash; Python reuses them for speed</li>
        <li>This is why Python is both convenient (no explicit compile step) and reasonably fast</li>
      </ul>
    </div>

    <div class="panel" style="margin-top:16px; background:var(--bg-deep);">
      <div class="panel-title">The Week 2 Skill Stack</div>
      <ul>
        <li><code>venv</code>: isolate each project&rsquo;s dependencies so tools don&rsquo;t interfere with each other</li>
        <li>Shebang line + <code>chmod +x</code>: make scripts run as native commands without typing <code>python3</code></li>
        <li><code>sys.argv</code>: accept command-line arguments so users can pass targets and options</li>
        <li><code>hashlib</code>: generate SHA256, MD5 hashes for file integrity verification</li>
        <li><code>password_checker</code>: validate passwords against security requirements (8+ chars, upper, lower, digit, special)</li>
      </ul>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Orientation Check &mdash; 3 Questions</div>
    <p>Answer all three correctly to unlock Mission 01.</p>

    <div class="quiz-question" id="q0-0">
      <p><strong>Q1:</strong> What happens to a .py file BEFORE the Python interpreter runs it?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">Nothing &mdash; it runs directly</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, true)">It is compiled to bytecode (.pyc) first</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">It is linked like a C program</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">It is validated for syntax errors only</button>
      </div>
    </div>

    <div class="quiz-question" id="q0-1">
      <p><strong>Q2:</strong> Where does Python store compiled bytecode files?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">The same folder as the script</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, true)">A __pycache__ directory</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">The system Python directory</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">Memory only &mdash; they are never written to disk</button>
      </div>
    </div>

    <div class="quiz-question" id="q0-2">
      <p><strong>Q3:</strong> Why do security professionals use virtual environments?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">They make Python run faster</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">They are required by Python 3</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, true)">They isolate project dependencies so different tools don&rsquo;t conflict</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">They encrypt your code</button>
      </div>
    </div>

    <div id="m0-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 01 — EXEC_MODEL
// ===================================================
MISSION_RENDERERS[1] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">The Execution Pipeline</div>
    <p>Python&rsquo;s execution model is the foundation of everything you will build this semester. Understanding how source code becomes running program explains bytecode caches, import performance, and why shebang lines work. Click all four cards to unlock the quiz.</p>
    <p style="color:var(--text-dim); font-size:0.85em; margin-top:8px;">Click each card to read the explanation. All four must be reviewed before the question unlocks.</p>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Review All Four Execution Model Components</div>
    <div class="concept-grid">

      <div class="concept-card" id="card-m1-0" onclick="visitCard('m1', 0, 4)">
        <h3>Source Code to Bytecode</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">STEP ONE</p>
        <p>When you run <code>python3 script.py</code>, Python first compiles your source to bytecode. Bytecode is a lower-level representation optimized for the interpreter &mdash; not machine code. You will see <code>.pyc</code> files appear in <code>__pycache__/</code> after running scripts. This step is automatic and invisible &mdash; you never run it manually.</p>
      </div>

      <div class="concept-card" id="card-m1-1" onclick="visitCard('m1', 1, 4)">
        <h3>The Python Interpreter</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">STEP TWO</p>
        <p>The interpreter reads bytecode instructions and executes them one by one. CPython is the standard interpreter (the one you install from python.org). This is why Python is called &ldquo;interpreted&rdquo; even though it compiles to bytecode. The practical benefit: write code, run it immediately &mdash; no compile-link-run cycle.</p>
      </div>

      <div class="concept-card" id="card-m1-2" onclick="visitCard('m1', 2, 4)">
        <h3>Shebang Lines</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">MAKING SCRIPTS RUNNABLE</p>
        <p>A shebang tells the OS which interpreter to use when the file is run directly. Standard Python shebang: <code>#!/usr/bin/env python3</code>. The <code>env python3</code> form finds Python 3 wherever it is installed &mdash; more portable than <code>/usr/bin/python3</code>. After adding shebang, run <code>chmod +x script.py</code> to make it executable, then run it as <code>./script.py</code>.</p>
      </div>

      <div class="concept-card" id="card-m1-3" onclick="visitCard('m1', 3, 4)">
        <h3>Making Scripts Executable</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">PROFESSIONAL WORKFLOW</p>
        <div class="code-block" style="margin-top:8px;">
          <pre><code><span class="cm"># Step 1: Add shebang as FIRST LINE of script</span>
<span class="cm">#!/usr/bin/env python3</span>

<span class="cm"># Step 2: Make it executable</span>
chmod +x port_checker.py

<span class="cm"># Step 3: Run directly</span>
./port_checker.py 443

<span class="cm"># Without shebang — works but requires python3 prefix</span>
python3 port_checker.py 443</code></pre>
        </div>
        <p style="margin-top:8px; font-size:0.85em;">The dot-slash (<code>./</code>) is required when running from the current directory.</p>
      </div>

    </div>
    <div id="card-m1-status" style="color:var(--text-dim); font-size:0.8em; margin-top:8px; letter-spacing:1px;">0 / 4 components reviewed</div>
  </div>

  <div class="panel" id="m1-question-panel" style="display:none">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Execution Model Check</div>
    <div class="quiz-question" id="q1-0">
      <p><strong>Q1:</strong> What does <code>#!/usr/bin/env python3</code> at the top of a script tell the operating system?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">To install Python 3</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, true)">To use Python 3 to execute this file when run directly</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">That this is a Python 3 comment</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">To compile the script before running</button>
      </div>
    </div>
    <div id="m1-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 02 — VENV
// ===================================================
MISSION_RENDERERS[2] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Virtual Environment Isolation</div>
    <p>A virtual environment is not optional for professional security development. Every tool you write gets its own isolated Python installation. Dependency conflicts disappear. Click all four cards to unlock the quiz.</p>
    <p style="color:var(--text-dim); font-size:0.85em; margin-top:8px;">Click each card to read the explanation. All four must be reviewed before the questions unlock.</p>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Review All Four venv Components</div>
    <div class="concept-grid">

      <div class="concept-card" id="card-m2-0" onclick="visitCard('m2', 0, 4)">
        <h3>Why Virtual Environments</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">THE PROBLEM</p>
        <p>Imagine two projects: Project A needs <code>scapy==2.4.5</code>, Project B needs <code>scapy==2.5.0</code>. Without venv, installing one breaks the other &mdash; only one version can be global. With venv, each project has a completely isolated Python installation. For security work: test malware analysis tools in one env, build detection tools in another.</p>
      </div>

      <div class="concept-card" id="card-m2-1" onclick="visitCard('m2', 1, 4)">
        <h3>Creating and Activating</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">SETUP</p>
        <div class="code-block" style="margin-top:8px;">
          <pre><code><span class="cm"># Create a virtual environment named cybersec_env</span>
python3 -m venv cybersec_env

<span class="cm"># Activate (macOS/Linux)</span>
source cybersec_env/bin/activate

<span class="cm"># Your prompt changes to show the active env</span>
(cybersec_env) $

<span class="cm"># Activate (Windows)</span>
cybersec_env\Scripts\activate</code></pre>
        </div>
        <p style="margin-top:8px; font-size:0.85em;">The <code>(cybersec_env)</code> prefix confirms you are inside the environment.</p>
      </div>

      <div class="concept-card" id="card-m2-2" onclick="visitCard('m2', 2, 4)">
        <h3>Installing and Tracking Packages</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">DEPENDENCIES</p>
        <div class="code-block" style="margin-top:8px;">
          <pre><code><span class="cm"># Install a security library</span>
(cybersec_env) $ pip install scapy

<span class="cm"># List installed packages</span>
(cybersec_env) $ pip list

<span class="cm"># Save the package list (requirements file)</span>
(cybersec_env) $ pip freeze > requirements.txt

<span class="cm"># Recreate environment from requirements</span>
pip install -r requirements.txt</code></pre>
        </div>
        <p style="margin-top:8px; font-size:0.85em;"><code>requirements.txt</code> is how you share project dependencies. Anyone cloning your security tool repo can recreate the exact environment.</p>
      </div>

      <div class="concept-card" id="card-m2-3" onclick="visitCard('m2', 3, 4)">
        <h3>Deactivating and Best Practices</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">HYGIENE</p>
        <div class="code-block" style="margin-top:8px;">
          <pre><code><span class="cm"># Deactivate — return to global environment</span>
(cybersec_env) $ deactivate
$

<span class="cm"># Check that scapy is NOT in global env</span>
$ pip list  <span class="cm"># scapy won't appear here</span></code></pre>
        </div>
        <ul style="margin-top:8px; font-size:0.85em;">
          <li>Always deactivate when switching projects</li>
          <li>Name environments after the project, not generic names like <code>env</code></li>
          <li>Do NOT commit the venv folder to Git &mdash; only commit <code>requirements.txt</code></li>
          <li>Add <code>cybersec_env/</code> to <code>.gitignore</code></li>
        </ul>
      </div>

    </div>
    <div id="card-m2-status" style="color:var(--text-dim); font-size:0.8em; margin-top:8px; letter-spacing:1px;">0 / 4 components reviewed</div>
  </div>

  <div class="panel" id="m2-question-panel" style="display:none">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Virtual Environment Check &mdash; 4 Questions</div>
    <p>Answer all four correctly to unlock Mission 03.</p>

    <div class="quiz-question" id="q2-0">
      <p><strong>Q1:</strong> What command creates a virtual environment named <code>sec_tools</code>?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">python3 venv sec_tools</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, true)">python3 -m venv sec_tools</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">pip install sec_tools</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">virtualenv sec_tools</button>
      </div>
    </div>

    <div class="quiz-question" id="q2-1">
      <p><strong>Q2:</strong> After activating a venv, you run <code>pip install requests</code>. Where does it install?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, false)">The global Python site-packages</button>
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, false)">Your home directory</button>
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, true)">Inside the active virtual environment only</button>
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, false)">It depends on system permissions</button>
      </div>
    </div>

    <div class="quiz-question" id="q2-2">
      <p><strong>Q3:</strong> What file should you commit to Git so others can recreate your environment?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, false)">The entire venv folder</button>
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, true)">requirements.txt</button>
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, false)">The __pycache__ folder</button>
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, false)">Nothing &mdash; they should figure it out</button>
      </div>
    </div>

    <div class="quiz-question" id="q2-3">
      <p><strong>Q4:</strong> How do you confirm you are inside a virtual environment?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, false)">Run <code>python3 --version</code></button>
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, true)">The environment name appears in parentheses in your terminal prompt</button>
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, false)">Check if the venv folder exists</button>
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, false)">Virtual environments don&rsquo;t show any indicator</button>
      </div>
    </div>

    <div id="m2-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 03 — SYS_ARGV
// ===================================================
MISSION_RENDERERS[3] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Command-Line Arguments with sys.argv</div>
    <p>Every production security tool accepts arguments. Targets, thresholds, output paths, modes &mdash; all come in through the command line. <code>sys.argv</code> is a list where those arguments live. Index 0 is always the script name.</p>

    <div class="panel" style="margin-top:16px; background:var(--bg-deep);">
      <div class="panel-title">What sys.argv Contains</div>
      <div class="code-block">
        <span class="code-lang-tag">python</span>
        <button class="copy-btn" onclick="copyCode(this)">COPY</button>
        <pre><code><span class="cm"># When you run: python3 port_checker.py 192.168.1.1 80</span>
<span class="kw">import</span> sys

<span class="fn">print</span>(sys.argv[<span class="num">0</span>])   <span class="cm"># 'port_checker.py'  (script name)</span>
<span class="fn">print</span>(sys.argv[<span class="num">1</span>])   <span class="cm"># '192.168.1.1'      (first argument)</span>
<span class="fn">print</span>(sys.argv[<span class="num">2</span>])   <span class="cm"># '80'               (second argument)</span>
<span class="fn">print</span>(<span class="fn">len</span>(sys.argv)) <span class="cm"># 3                  (total items)</span>

<span class="cm"># Always check length before accessing</span>
<span class="kw">if</span> <span class="fn">len</span>(sys.argv) &lt; <span class="num">2</span>:
    <span class="fn">print</span>(<span class="str">"Usage: ./port_checker.py &lt;port_number&gt;"</span>)
    sys.<span class="fn">exit</span>(<span class="num">1</span>)  <span class="cm"># Exit with error code 1</span></code></pre>
      </div>
      <ul style="margin-top:12px;">
        <li><code>sys.argv</code> is a list. Index 0 is always the script name itself.</li>
        <li>Arguments are always strings &mdash; convert with <code>int()</code> or <code>float()</code> for numeric args.</li>
        <li>Always validate <code>len(sys.argv)</code> before accessing indices &mdash; IndexError crashes the tool.</li>
      </ul>
    </div>

    <div class="panel" style="margin-top:16px; background:var(--bg-deep);">
      <div class="panel-title">The Port Checker Pattern</div>
      <div class="code-block">
        <span class="code-lang-tag">python</span>
        <button class="copy-btn" onclick="copyCode(this)">COPY</button>
        <pre><code><span class="cm">#!/usr/bin/env python3</span>
<span class="kw">import</span> sys

VULNERABLE_PORTS = [<span class="num">21</span>, <span class="num">23</span>, <span class="num">25</span>, <span class="num">80</span>, <span class="num">443</span>, <span class="num">3389</span>, <span class="num">8080</span>]

<span class="kw">if</span> <span class="fn">len</span>(sys.argv) &lt; <span class="num">2</span>:
    <span class="fn">print</span>(<span class="str">"Usage: ./port_checker.py &lt;port_number&gt;"</span>)
    sys.<span class="fn">exit</span>(<span class="num">1</span>)

port = <span class="fn">int</span>(sys.argv[<span class="num">1</span>])   <span class="cm"># convert string to int</span>

<span class="kw">if</span> port <span class="kw">in</span> VULNERABLE_PORTS:
    <span class="fn">print</span>(<span class="str">f"Port {port} is commonly targeted"</span>)
<span class="kw">else</span>:
    <span class="fn">print</span>(<span class="str">f"Port {port} not in common vulnerable list"</span>)</code></pre>
      </div>
      <ul style="margin-top:12px;">
        <li><code>sys.exit(1)</code> exits with error code 1 (Unix convention for error)</li>
        <li><code>sys.exit(0)</code> exits with success code 0</li>
        <li>Later in the course: <code>argparse</code> replaces <code>sys.argv</code> for production-quality CLIs with <code>--help</code>, flags, and validation</li>
      </ul>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">sys.argv Check</div>
    <div class="quiz-question" id="q3-0">
      <p><strong>Q1:</strong> You run: <code>python3 scanner.py 192.168.1.1 80 --verbose</code>. What is <code>sys.argv[2]</code>?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">'192.168.1.1'</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, true)">'80'</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">'--verbose'</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">80 as an integer</button>
      </div>
    </div>
    <div id="m3-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 04 — HASHLIB
// ===================================================
MISSION_RENDERERS[4] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Cryptographic Hashing with hashlib</div>
    <p>SHA256 fingerprints files. If two files have the same hash, they are byte-for-byte identical. This is how you verify a downloaded security tool has not been tampered with. <code>hashlib</code> is in Python&rsquo;s standard library &mdash; no pip install needed.</p>

    <div class="panel" style="margin-top:16px; background:var(--bg-deep);">
      <div class="panel-title">Why Hash Files</div>
      <div class="code-block">
        <span class="code-lang-tag">python</span>
        <button class="copy-btn" onclick="copyCode(this)">COPY</button>
        <pre><code><span class="kw">import</span> hashlib
<span class="kw">import</span> sys

<span class="kw">def</span> <span class="fn">generate_hash</span>(filename, algorithm=<span class="str">'sha256'</span>):
    <span class="kw">if</span> algorithm == <span class="str">'sha256'</span>:
        hasher = hashlib.<span class="fn">sha256</span>()
    <span class="kw">elif</span> algorithm == <span class="str">'md5'</span>:
        hasher = hashlib.<span class="fn">md5</span>()

    <span class="cm"># Open in BINARY mode — hashes work on bytes</span>
    <span class="kw">with</span> <span class="fn">open</span>(filename, <span class="str">'rb'</span>) <span class="kw">as</span> f:
        <span class="kw">while</span> chunk := f.<span class="fn">read</span>(<span class="num">8192</span>):  <span class="cm"># 8KB chunks</span>
            hasher.<span class="fn">update</span>(chunk)

    <span class="kw">return</span> hasher.<span class="fn">hexdigest</span>()

<span class="fn">print</span>(<span class="fn">generate_hash</span>(<span class="str">'malware_sample.exe'</span>))</code></pre>
      </div>
      <ul style="margin-top:12px;">
        <li>File integrity: if two files have the same SHA256 hash, they are byte-for-byte identical</li>
        <li>Verification: download a security tool, check its hash against the vendor&rsquo;s published hash</li>
        <li>The walrus operator <code>:=</code> assigns and tests in one expression &mdash; efficient for large file chunking</li>
        <li>Always open files in binary mode (<code>'rb'</code>) for hashing &mdash; text mode can alter line endings</li>
      </ul>
    </div>

    <div class="panel" style="margin-top:16px; background:var(--bg-deep);">
      <div class="panel-title">Algorithm Choices</div>
      <table>
        <thead>
          <tr>
            <th>Algorithm</th>
            <th>Output Length</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>MD5</code></td>
            <td>128 bits (32 hex chars)</td>
            <td style="color:var(--red-alert);">Weak &mdash; do not use for security</td>
          </tr>
          <tr>
            <td><code>SHA1</code></td>
            <td>160 bits (40 hex chars)</td>
            <td style="color:var(--amber);">Deprecated &mdash; avoid</td>
          </tr>
          <tr>
            <td><code>SHA256</code></td>
            <td>256 bits (64 hex chars)</td>
            <td style="color:var(--green-primary);">Current standard &#10003;</td>
          </tr>
          <tr>
            <td><code>SHA512</code></td>
            <td>512 bits (128 hex chars)</td>
            <td style="color:var(--green-primary);">Extra strong &#10003;</td>
          </tr>
        </tbody>
      </table>
      <ul style="margin-top:12px;">
        <li>MD5 has known collisions &mdash; two different files can produce the same MD5 hash</li>
        <li>For security tool verification: use SHA256 minimum</li>
        <li>For password storage: use specialized password hashing (bcrypt, Argon2) &mdash; not raw SHA256</li>
      </ul>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">hashlib Check</div>
    <div class="quiz-question" id="q4-0">
      <p><strong>Q1:</strong> Why should you open files in binary mode (<code>'rb'</code>) when generating hashes?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(4, 0, this, false)">Binary mode is required for hashlib to work</button>
        <button class="quiz-option" onclick="answerQuiz(4, 0, this, true)">Text mode can alter line endings, changing the hash result</button>
        <button class="quiz-option" onclick="answerQuiz(4, 0, this, false)">Binary mode is faster</button>
        <button class="quiz-option" onclick="answerQuiz(4, 0, this, false)">SHA256 only works on binary files</button>
      </div>
    </div>
    <div id="m4-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 05 — TOOL_SIM (simulator)
// ===================================================
const toolSimState = { seenA: false, seenB: false, seenC: false };

function toolLog(text, cls) {
  const term = document.getElementById('tool-terminal');
  if (!term) return;
  const line = document.createElement('div');
  line.style.cssText = 'padding:2px 0; font-size:0.88em; font-family:var(--font);';
  if (cls === 'error')        line.style.color = 'var(--red-alert)';
  else if (cls === 'success') line.style.color = 'var(--green-primary)';
  else if (cls === 'warn')    line.style.color = 'var(--amber)';
  else if (cls === 'info')    line.style.color = 'var(--blue-info)';
  else if (cls === 'fail')    line.style.color = 'var(--red-alert)';
  line.textContent = text;
  term.appendChild(line);
  term.scrollTop = term.scrollHeight;
}

function toolLogClear() {
  const term = document.getElementById('tool-terminal');
  if (term) term.innerHTML = '';
}

function runToolScenario(key) {
  toolLogClear();

  if (key === 'A') {
    toolLog('> Loading scenario: PASSWORD CHECKER \u2014 WEAK PASSWORD', 'info');
    toolLog('> Running: ./password_checker.py', '');
    toolLog('>', '');
    toolLog('> === Password Strength Checker ===', 'info');
    toolLog('>', '');
    toolLog('> Enter password to check: hello', '');
    toolLog('>', '');
    toolLog('> Checking 5 requirements:', '');
    toolLog('> Length >= 8: FAIL (5 chars)', 'fail');
    toolLog('> Contains uppercase: FAIL', 'fail');
    toolLog('> Contains lowercase: PASS', 'success');
    toolLog('> Contains digits: FAIL', 'fail');
    toolLog('> Contains special chars: FAIL', 'fail');
    toolLog('>', '');
    toolLog('> Password is WEAK', 'warn');
    toolLog('> Issues found:', 'warn');
    toolLog('>   Must be at least 8 characters', 'warn');
    toolLog('>   Must contain uppercase letters', 'warn');
    toolLog('>   Must contain numbers', 'warn');
    toolLog('>   Must contain special characters', 'warn');
    toolLog('>', '');
    toolLog('> Technique: any(c.isupper() for c in password)', '');
    toolLog('> The any() function returns True if ANY character passes the test.', '');
    toolLog('>', '');
    toolLog('> STATUS: WEAK \u2014 4 requirements failed', 'fail');

  } else if (key === 'B') {
    toolLog('> Loading scenario: PASSWORD CHECKER \u2014 STRONG PASSWORD', 'info');
    toolLog('> Running: ./password_checker.py', '');
    toolLog('>', '');
    toolLog('> Enter password to check: SecureP@ss123', '');
    toolLog('>', '');
    toolLog('> Checking 5 requirements:', '');
    toolLog('> Length >= 8: PASS (13 chars)', 'success');
    toolLog('> Contains uppercase: PASS (S, P)', 'success');
    toolLog('> Contains lowercase: PASS (ecure, ass)', 'success');
    toolLog('> Contains digits: PASS (1, 2, 3)', 'success');
    toolLog('> Contains special chars: PASS (@)', 'success');
    toolLog('>', '');
    toolLog('> Password is STRONG', 'success');
    toolLog('> All security requirements met.', 'success');
    toolLog('>', '');
    toolLog('> STATUS: STRONG \u2014 0 requirements failed', 'success');

  } else if (key === 'C') {
    toolLog('> Loading scenario: HASH GENERATOR', 'info');
    toolLog('> Running: ./hash_generator.py malware_sample.exe sha256', '');
    toolLog('>', '');
    toolLog('> === File Hash Generator ===', 'info');
    toolLog('> File: malware_sample.exe', '');
    toolLog('> Algorithm: SHA256', '');
    toolLog('>', '');
    toolLog('> Opening file in binary mode (\'rb\')', '');
    toolLog('> Reading in 8192-byte chunks', '');
    toolLog('> Updating hasher with each chunk', '');
    toolLog('> Calling hexdigest() for final hash', '');
    toolLog('>', '');
    toolLog('> Hash: a3f5b8c9d2e1f4a7b6c8d9e2f3a4b5c6...', 'success');
    toolLog('>', '');
    toolLog('> INTEGRITY CHECK:', '');
    toolLog('> Vendor published: a3f5b8c9d2e1f4a7b6c8d9e2f3a4b5c6...', '');
    toolLog('> Your hash:        a3f5b8c9d2e1f4a7b6c8d9e2f3a4b5c6...', '');
    toolLog('> MATCH: File is authentic and unmodified.', 'success');
    toolLog('>', '');
    toolLog('> STATUS: VERIFIED \u2014 hash matches vendor hash', 'success');
  }

  toolSimState['seen' + key] = true;
  const checkEl = document.getElementById('tool-check-' + key);
  if (checkEl) {
    checkEl.style.color = 'var(--green-primary)';
    checkEl.textContent = '\u2713 Scenario ' + key + ' complete';
  }
  toolSimCheckComplete();
}

function toolSimCheckComplete() {
  if (toolSimState.seenA && toolSimState.seenB && toolSimState.seenC) {
    const statusEl = document.getElementById('m5-status');
    if (statusEl) statusEl.innerHTML = '<span class="status-pass">\u2713 ALL SCENARIOS COMPLETE \u2014 MISSION 05 COMPLETE</span>';
    setTimeout(function() { completeMission(5); }, 800);
  }
}

function initMission5() {
  toolSimState.seenA = false;
  toolSimState.seenB = false;
  toolSimState.seenC = false;
}

MISSION_RENDERERS[5] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Security Tool Execution Simulator</div>
    <p>Two tools built in Week 2: a password strength checker (validates against 5 security requirements) and a hash generator (SHA256/MD5 with chunked binary reading). Watch them execute below.</p>
    <div class="concept-grid">

      <div class="concept-card">
        <h3>Scenario A</h3>
        <p><strong>Password Checker: Weak</strong></p>
        <p style="color:var(--text-dim); font-size:0.85em; margin-top:8px;">Input: <code>hello</code>. Fails 4 of 5 requirements. See how each check fails and how the <code>any()</code> function is used for character class validation.</p>
        <button class="btn-run" style="margin-top:14px; font-size:0.8em; padding:8px 16px;" onclick="runToolScenario('A')">&#9654; RUN</button>
      </div>

      <div class="concept-card">
        <h3>Scenario B</h3>
        <p><strong>Password Checker: Strong</strong></p>
        <p style="color:var(--text-dim); font-size:0.85em; margin-top:8px;">Input: <code>SecureP@ss123</code>. Passes all 5 requirements. Shows exactly which characters satisfy each rule.</p>
        <button class="btn-run" style="margin-top:14px; font-size:0.8em; padding:8px 16px;" onclick="runToolScenario('B')">&#9654; RUN</button>
      </div>

      <div class="concept-card">
        <h3>Scenario C</h3>
        <p><strong>Hash Generator</strong></p>
        <p style="color:var(--text-dim); font-size:0.85em; margin-top:8px;">Generates SHA256 hash of a file using 8KB chunked reading. Demonstrates the integrity check comparison against a vendor-published hash.</p>
        <button class="btn-run" style="margin-top:14px; font-size:0.8em; padding:8px 16px;" onclick="runToolScenario('C')">&#9654; RUN</button>
      </div>

    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Tool Execution Simulator</div>
    <div id="tool-terminal" style="background:var(--bg-editor); border:1px solid var(--border); border-radius:3px; padding:16px; min-height:200px; font-family:var(--font); font-size:0.88em; overflow-y:auto; max-height:520px; white-space:pre-wrap;"></div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Scenarios Completed</div>
    <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:8px;">
      <div id="tool-check-A" style="color:var(--text-dim);">&#9744; Scenario A &mdash; Password Checker: Weak</div>
      <div id="tool-check-B" style="color:var(--text-dim);">&#9744; Scenario B &mdash; Password Checker: Strong</div>
      <div id="tool-check-C" style="color:var(--text-dim);">&#9744; Scenario C &mdash; Hash Generator</div>
    </div>
    <div id="m5-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 06 — FINAL_CHECK
// ===================================================
const finalCheckState = new Set();
const FINAL_TOTAL = 7;

function checkFinalItem(idx) {
  finalCheckState.add(idx);
  const item = document.getElementById('final-item-' + idx);
  if (item) {
    item.classList.add('checked');
    const box = item.querySelector('.final-check-box');
    if (box) {
      box.textContent = '\u2713';
      box.style.color = 'var(--green-primary)';
      box.style.borderColor = 'var(--green-primary)';
    }
  }
  const statusEl = document.getElementById('m6-checklist-status');
  if (statusEl) statusEl.textContent = finalCheckState.size + ' / ' + FINAL_TOTAL + ' items confirmed';
  if (finalCheckState.size >= FINAL_TOTAL) {
    const finalEl = document.getElementById('m6-status');
    if (finalEl) finalEl.innerHTML = '<span class="status-pass">\u2713 OPERATION TOOLKIT COMPLETE \u2014 MISSION 06 COMPLETE</span>';
    setTimeout(function() { completeMission(6); }, 800);
  }
}

MISSION_RENDERERS[6] = function() {
  return `
  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Week 2 Completion Checklist</div>
    <p>Seven concrete skills &mdash; not plans, implementations. Click each item only after you have confirmed it. All seven must be confirmed to complete OPERATION: TOOLKIT.</p>
    <div class="hint-box">
      <strong>This is a completion checklist, not a planning list.</strong> Each item represents a real skill from the Week 2 lectures and labs. If you click an item you have not actually practiced, you are only shortchanging yourself.
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Confirm All Seven Toolkit Items</div>
    <p style="color:var(--text-dim); font-size:0.85em; margin-bottom:16px;">Click each item only after you have practiced or confirmed it.</p>

    <div style="display:flex; flex-direction:column; gap:12px;">

      <div id="final-item-0" class="proposal-item" onclick="checkFinalItem(0)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="final-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Python Execution Model</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I can explain Python&rsquo;s execution model: source &rarr; bytecode &rarr; interpreter. I know that .pyc files in __pycache__ are the bytecode cache and that Python creates them automatically.</p>
        </div>
      </div>

      <div id="final-item-1" class="proposal-item" onclick="checkFinalItem(1)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="final-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Virtual Environment Created and Activated</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I have created and activated a virtual environment with <code>python3 -m venv</code>. I confirmed the environment name appeared in my terminal prompt.</p>
        </div>
      </div>

      <div id="final-item-2" class="proposal-item" onclick="checkFinalItem(2)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="final-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Packages Installed and requirements.txt Created</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I know how to install packages inside a venv with <code>pip install</code> and freeze them to <code>requirements.txt</code> with <code>pip freeze &gt; requirements.txt</code>.</p>
        </div>
      </div>

      <div id="final-item-3" class="proposal-item" onclick="checkFinalItem(3)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="final-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Shebang Line and chmod +x</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I can add a shebang line (<code>#!/usr/bin/env python3</code>) and use <code>chmod +x</code> to make a script executable so it runs directly with <code>./script.py</code> instead of <code>python3 script.py</code>.</p>
        </div>
      </div>

      <div id="final-item-4" class="proposal-item" onclick="checkFinalItem(4)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="final-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>sys.argv Index Mapping</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I know that <code>sys.argv[0]</code> is always the script name and <code>sys.argv[1]</code> is the first argument. I always check <code>len(sys.argv)</code> before accessing an index to prevent IndexError.</p>
        </div>
      </div>

      <div id="final-item-5" class="proposal-item" onclick="checkFinalItem(5)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="final-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>sys.argv Always Contains Strings</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I understand that <code>sys.argv</code> always contains strings and I must convert with <code>int()</code> or <code>float()</code> before using values as numbers. Passing a port number in argv still arrives as a string.</p>
        </div>
      </div>

      <div id="final-item-6" class="proposal-item" onclick="checkFinalItem(6)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="final-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Password Checker and Hash Generator Executed</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I have run the password checker and hash generator from the lecture demos (or completed the simulator in Mission 05). I understand how <code>any(c.isupper() for c in password)</code> works and why binary mode is required for hashing.</p>
        </div>
      </div>

    </div>

    <div id="m6-checklist-status" style="color:var(--text-dim); font-size:0.8em; margin-top:16px; letter-spacing:1px;">0 / 7 items confirmed</div>
    <div id="m6-status" class="gate-status" style="margin-top:8px;"></div>
  </div>
  `;
};
