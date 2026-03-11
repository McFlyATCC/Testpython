// ===== STATE =====
const STORAGE_KEY = 'cvnp2646_w1_progress';

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
  { id: 1, key: 'PYTHON_WHY',   label: '01\nWHY PY',   icon: '⬡' },
  { id: 2, key: 'DATA_TYPES',   label: '02\nTYPES',    icon: '⬡' },
  { id: 3, key: 'VARIABLES',    label: '03\nVARS',     icon: '⬡' },
  { id: 4, key: 'IO_BASICS',    label: '04\nI/O',      icon: '⬡' },
  { id: 5, key: 'RISK_CALC',    label: '05\nCALC',     icon: '⬡' },
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
    showBriefing('OPERATION ZERO-IN COMPLETE. Python foundation established. Four data types understood. Security risk calculator operational. You have the foundation to build any interactive security tool in this course. Outstanding work, Analyst.', null);
    renderMissionMap();
    updateProgress();
  }
}

// ===== COMMANDER ZHANG BRIEFINGS =====
const BRIEFINGS = [
  'Welcome to OPERATION: ZERO-IN. Python was designed as executable pseudocode \u2014 readable by humans, actionable by machines. This is why every major SOC, red team, and threat intel platform runs on Python. Your mission starts here.',
  'Orientation complete. Now understand why Python dominates cybersecurity. Rapid development, massive security library ecosystem, industry standard for automation. Know this, and you know why every tool you will build this semester runs on Python.',
  'Python\'s dominance confirmed. Now master the four core data types: int, float, str, bool. Every security variable you declare, every port number you check, every threshold you set \u2014 it all starts with understanding types.',
  'Data types locked in. Now learn variable naming and the rules that make Python code maintainable. snake_case for variables. UPPERCASE for constants. Descriptive names over short ones. These are not suggestions \u2014 they are professional standards.',
  'Variables confirmed. Now master input and output. input() always returns a string. f-strings format output. print() is a function, not a statement. These are the building blocks of interactive security tools.',
  'I/O mastered. Run the risk calculator simulator. See how input, type conversion, calculations, and formatted output combine into a working security tool.',
  'Final checks stand between you and a complete Python foundation. Confirm every item to complete OPERATION: ZERO-IN.',
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
  document.title = 'MISSION ' + String(id).padStart(2, '0') + ' \u2014 ' + (MISSIONS[id] ? MISSIONS[id].key : '') + ' | OPERATION: ZERO-IN';
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
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">What Is Python For Cybersecurity</div>

    <div class="panel" style="border-left: 3px solid var(--blue-info); margin-bottom:16px;">
      <div class="panel-title blue">Python's Origin</div>
      <ul style="padding-left:20px; margin-bottom:0;">
        <li>Created by Guido van Rossum, Christmas 1989, first released 1991</li>
        <li>Named after Monty Python's Flying Circus &mdash; not the snake</li>
        <li>Design philosophy: "executable pseudocode" &mdash; readable by humans, runnable by machines</li>
        <li>Python 2 reached end of life January 1, 2020 &mdash; this course uses Python 3.x only</li>
      </ul>
    </div>

    <div class="panel" style="border-left: 3px solid var(--blue-info); margin-bottom:0;">
      <div class="panel-title blue">The Four Reasons Python Dominates Security</div>
      <ul style="padding-left:20px; margin-bottom:0;">
        <li><strong>Rapid Development:</strong> build a working security tool in hours, not days. Speed matters when responding to incidents.</li>
        <li><strong>Library Ecosystem:</strong> Scapy for packet manipulation, hashlib for cryptographic hashing, re for log parsing, Volatility for memory forensics</li>
        <li><strong>Industry Standard:</strong> MITRE ATT&amp;CK detection scripts, SIEM integrations, threat hunting tools &mdash; all Python</li>
        <li><strong>Automation Power:</strong> parsing logs, checking configurations, generating reports &mdash; Python automates the repetitive analyst work</li>
      </ul>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Orientation Check &mdash; 3 Questions</div>
    <p>Answer all three correctly to unlock Mission 01.</p>

    <div class="quiz-question" id="q0-0">
      <p><strong>Q1:</strong> Python was named after:</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">The snake</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, true)">Monty Python's Flying Circus</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">Guido's favorite reptile</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">The Python programming paradigm</button>
      </div>
    </div>

    <div class="quiz-question" id="q0-1">
      <p><strong>Q2:</strong> Which Python version is used in this course?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">Python 2</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">Python 1</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, true)">Python 3</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">Any version works the same</button>
      </div>
    </div>

    <div class="quiz-question" id="q0-2">
      <p><strong>Q3:</strong> What is Python's core design philosophy?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">Maximum performance</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">Strict type enforcement</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, true)">Executable pseudocode &mdash; readable by humans</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">Object-oriented only</button>
      </div>
    </div>

    <div id="m0-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 01 — PYTHON_WHY
// ===================================================
MISSION_RENDERERS[1] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Why Python Owns Cybersecurity</div>
    <p>Click each card below to review why Python is the dominant language in cybersecurity. All four must be visited before the question unlocks.</p>
    <div class="concept-grid">

      <div class="concept-card" id="card-m1-0" onclick="visitCard('m1', 0, 4)">
        <h3>Rapid Development</h3>
        <p>A working port scanner in 20 lines. A password checker in 15. A log parser in 30.</p>
        <p style="margin-top:8px;">In cybersecurity, speed of response matters. Python's readable syntax reduces time from idea to working tool.</p>
        <p style="margin-top:8px;">Compare: a C equivalent of a Python log parser requires 10x more code and a compile step.</p>
        <p style="margin-top:8px; font-size:0.85em; color:var(--text-dim);">SOC analysts and red teamers reach for Python first because it gets to working code fastest.</p>
      </div>

      <div class="concept-card" id="card-m1-1" onclick="visitCard('m1', 1, 4)">
        <h3>The Security Library Ecosystem</h3>
        <p><code>scapy</code> &mdash; craft and analyze network packets at the byte level</p>
        <p style="margin-top:6px;"><code>hashlib</code> &mdash; MD5, SHA1, SHA256, SHA512 hashing built into Python standard library</p>
        <p style="margin-top:6px;"><code>socket</code> &mdash; raw network connections, port scanning, banner grabbing</p>
        <p style="margin-top:6px;"><code>re</code> &mdash; regular expressions for log parsing and pattern matching</p>
        <p style="margin-top:6px;"><code>pathlib</code> / <code>shutil</code> &mdash; file system operations for evidence handling and tool organization</p>
      </div>

      <div class="concept-card" id="card-m1-2" onclick="visitCard('m1', 2, 4)">
        <h3>Industry Standard</h3>
        <p>The MITRE ATT&amp;CK framework's detection tools are written in Python</p>
        <p style="margin-top:8px;">Volatility (memory forensics) is Python. Impacket (network protocols) is Python. sqlmap (SQL injection) is Python.</p>
        <p style="margin-top:8px;">When a new vulnerability drops, the PoC is almost always Python first</p>
        <p style="margin-top:8px; font-size:0.85em; color:var(--text-dim);">Security teams hire analysts who can read, write, and extend Python tools</p>
      </div>

      <div class="concept-card" id="card-m1-3" onclick="visitCard('m1', 3, 4)">
        <h3>High-Level = Focus on Logic</h3>
        <p>Python handles memory allocation automatically &mdash; no pointers, no manual cleanup</p>
        <p style="margin-top:8px;">Interpreted = no separate compile step. Run <code>python3 script.py</code> and it executes immediately.</p>
        <p style="margin-top:8px;">Dynamically typed = variables can hold any type. <code>x = 10</code> then <code>x = "hello"</code> is valid.</p>
        <p style="margin-top:8px; font-size:0.85em; color:var(--text-dim);">This flexibility speeds prototyping &mdash; the cost is that testing is essential (type errors appear at runtime, not compile time)</p>
      </div>

    </div>
    <div id="card-m1-status" style="color:var(--text-dim); font-size:0.8em; margin-top:8px; letter-spacing:1px;">0 / 4 components reviewed</div>
  </div>

  <div class="panel" id="m1-question-panel" style="display:none">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Python Why Check</div>
    <div class="quiz-question" id="q1-0">
      <p><strong>Q1:</strong> Which Python library handles cryptographic hashing (SHA256, MD5) and is part of the standard library?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">scapy</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">cryptography</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, true)">hashlib</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">socket</button>
      </div>
    </div>
    <div id="m1-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 02 — DATA_TYPES
// ===================================================
MISSION_RENDERERS[2] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">The Four Core Data Types</div>
    <p>Click each card to learn about each core Python data type and its security applications. All four must be visited before the questions unlock.</p>
    <div class="concept-grid">

      <div class="concept-card" id="card-m2-0" onclick="visitCard('m2', 0, 4)">
        <h3>Integer (<code>int</code>)</h3>
        <p>Whole numbers with no decimal. No size limit in Python 3.</p>
        <p style="margin-top:8px; font-size:0.85em; color:var(--blue-info);">Security uses: <code>ssh_port = 22</code>, <code>failed_attempts = 5</code>, <code>rdp_port = 3389</code></p>
        <p style="margin-top:8px; font-size:0.85em;">Arithmetic: <code>+</code>, <code>-</code>, <code>*</code>, <code>//</code> (floor division), <code>%</code> (modulus), <code>**</code> (exponentiation)</p>
        <p style="margin-top:8px; font-size:0.85em; color:var(--amber);">Division: <code>10 / 5</code> returns <code>2.0</code> (a float). Use <code>//</code> for integer result: <code>10 // 5</code> returns <code>2</code></p>
      </div>

      <div class="concept-card" id="card-m2-1" onclick="visitCard('m2', 1, 4)">
        <h3>Float (<code>float</code>)</h3>
        <p>Numbers with decimal points. Stored in binary floating point.</p>
        <p style="margin-top:8px; font-size:0.85em; color:var(--blue-info);">Security uses: <code>cvss_score = 7.5</code>, <code>failure_rate = 0.023</code>, <code>response_time = 0.125</code></p>
        <p style="margin-top:8px; font-size:0.85em; color:var(--amber);">Warning: <code>0.1 + 0.2</code> is NOT <code>0.3</code> &mdash; it's <code>0.30000000000000004</code> due to binary float representation</p>
        <p style="margin-top:8px; font-size:0.85em; color:var(--red-alert);">Never use <code>==</code> to compare floats in security-critical code &mdash; use threshold comparison with tolerance</p>
      </div>

      <div class="concept-card" id="card-m2-2" onclick="visitCard('m2', 2, 4)">
        <h3>String (<code>str</code>)</h3>
        <p>Text in single or double quotes. Strings are immutable &mdash; you create new ones, never modify in place.</p>
        <p style="margin-top:8px; font-size:0.85em; color:var(--blue-info);">Security uses: <code>ip_address = "192.168.1.100"</code>, <code>username = "admin"</code>, <code>log_entry = "FAILED LOGIN"</code></p>
        <p style="margin-top:8px; font-size:0.85em;">Key methods: <code>.upper()</code>, <code>.lower()</code>, <code>.strip()</code>, <code>.split()</code>, <code>.startswith()</code>, <code>.endswith()</code></p>
        <p style="margin-top:8px; font-size:0.85em; color:var(--green-primary);">F-strings (Python 3.6+): <code>f"User {username} from {ip_address}"</code> &mdash; embed variables directly</p>
      </div>

      <div class="concept-card" id="card-m2-3" onclick="visitCard('m2', 3, 4)">
        <h3>Boolean (<code>bool</code>)</h3>
        <p><code>True</code> or <code>False</code> &mdash; capital T and F required. This is not optional.</p>
        <p style="margin-top:8px; font-size:0.85em; color:var(--blue-info);">Security uses: <code>is_admin = True</code>, <code>account_locked = False</code>, <code>port_open = True</code></p>
        <p style="margin-top:8px; font-size:0.85em;">Boolean logic: <code>and</code>, <code>or</code>, <code>not</code>. Example: <code>if is_admin and not account_locked: grant_access()</code></p>
        <p style="margin-top:8px; font-size:0.85em; color:var(--amber);">Truthiness: <code>0</code>, <code>""</code>, <code>None</code>, <code>[]</code> are falsy. Everything else is truthy.</p>
      </div>

    </div>
    <div id="card-m2-status" style="color:var(--text-dim); font-size:0.8em; margin-top:8px; letter-spacing:1px;">0 / 4 components reviewed</div>
  </div>

  <div class="panel" id="m2-question-panel" style="display:none">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Data Types Check &mdash; 4 Questions</div>
    <p>Answer all four correctly to unlock Mission 03.</p>

    <div class="quiz-question" id="q2-0">
      <p><strong>Q1:</strong> What does <code>10 / 3</code> return in Python 3?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">3</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, true)">3.3333... (always returns a float)</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">Error</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">Depends on the context</button>
      </div>
    </div>

    <div class="quiz-question" id="q2-1">
      <p><strong>Q2:</strong> Which statement about booleans is correct?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, false)">You can write <code>true</code> or <code>True</code> interchangeably</button>
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, false)"><code>bool(0)</code> is <code>True</code></button>
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, true)"><code>True</code> and <code>False</code> must be capitalized</button>
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, false)">Booleans can only be used in if statements</button>
      </div>
    </div>

    <div class="quiz-question" id="q2-2">
      <p><strong>Q3:</strong> An IP address like '192.168.1.1' should be stored as:</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, false)">int</button>
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, false)">float</button>
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, true)">str</button>
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, false)">bool</button>
      </div>
    </div>

    <div class="quiz-question" id="q2-3">
      <p><strong>Q4:</strong> What is <code>0.1 + 0.2 == 0.3</code> in Python?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, false)">True</button>
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, true)">False (binary float representation)</button>
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, false)">Error</button>
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, false)">True only in Python 3</button>
      </div>
    </div>

    <div id="m2-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 03 — VARIABLES
// ===================================================
MISSION_RENDERERS[3] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Variable Naming and Conventions</div>

    <div class="panel" style="border-left: 3px solid var(--blue-info); margin-bottom:16px;">
      <div class="panel-title blue">Naming Rules (what Python requires)</div>
      <div class="code-block">
        <span class="code-lang-tag">python</span>
        <button class="copy-btn" onclick="copyCode(this)">COPY</button>
        <pre><code><span class="cm"># VALID variable names</span>
<span class="kw">port_number</span> = <span class="num">443</span>
<span class="kw">user_count</span> = <span class="num">5</span>
<span class="kw">cvss_score</span> = <span class="num">7.5</span>
<span class="kw">is_admin</span> = <span class="kw">True</span>       <span class="cm"># boolean convention: is_ prefix</span>

<span class="cm"># INVALID - will cause errors</span>
<span class="num">2</span>fast = <span class="num">100</span>           <span class="cm"># cannot start with a number</span>
user-name = <span class="str">"admin"</span>   <span class="cm"># hyphens not allowed</span>
<span class="kw">class</span> = <span class="str">"firewall"</span>    <span class="cm"># reserved keyword</span></code></pre>
      </div>
      <ul style="padding-left:20px; margin-top:8px; margin-bottom:0;">
        <li>Must start with a letter or underscore</li>
        <li>Can contain letters, numbers, underscores only &mdash; no hyphens, spaces, or special chars</li>
        <li>Cannot use Python reserved keywords: <code>if</code>, <code>for</code>, <code>class</code>, <code>def</code>, <code>import</code>, <code>return</code>, <code>True</code>, <code>False</code></li>
      </ul>
    </div>

    <div class="panel" style="border-left: 3px solid var(--green-primary); margin-bottom:0;">
      <div class="panel-title">Naming Conventions (professional standards)</div>
      <div class="code-block">
        <span class="code-lang-tag">python</span>
        <button class="copy-btn" onclick="copyCode(this)">COPY</button>
        <pre><code><span class="cm"># snake_case for variables and functions (PEP 8 standard)</span>
failed_login_count = <span class="num">5</span>
source_ip_address = <span class="str">"192.168.1.100"</span>

<span class="cm"># UPPERCASE for constants that never change</span>
MAX_LOGIN_ATTEMPTS = <span class="num">3</span>
DEFAULT_PORT_SCAN_THRESHOLD = <span class="num">25</span>
BRUTE_FORCE_WINDOW_SECONDS = <span class="num">300</span>

<span class="cm"># Descriptive beats short</span>
<span class="cm"># BAD:</span>
i = <span class="str">"192.168.1.100"</span>
<span class="cm"># GOOD:</span>
attacker_ip = <span class="str">"192.168.1.100"</span></code></pre>
      </div>
      <ul style="padding-left:20px; margin-top:8px; margin-bottom:0;">
        <li>PEP 8 is Python's official style guide &mdash; professional Python code follows it</li>
        <li><code>snake_case</code>: lowercase with underscores between words</li>
        <li><code>UPPER_SNAKE_CASE</code>: constants that represent fixed values (thresholds, timeouts, limits)</li>
        <li>Names like <code>x</code> or <code>tmp</code> are acceptable in a 5-line script; unacceptable in production security code</li>
      </ul>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Variables Check</div>
    <div class="quiz-question" id="q3-0">
      <p><strong>Q1:</strong> Which variable name follows Python naming conventions for a constant threshold value?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">maxLoginAttempts</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">max-login-attempts</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, true)">MAX_LOGIN_ATTEMPTS</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">3maxAttempts</button>
      </div>
    </div>
    <div id="m3-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 04 — IO_BASICS
// ===================================================
MISSION_RENDERERS[4] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Input and Output Fundamentals</div>

    <div class="panel" style="border-left: 3px solid var(--blue-info); margin-bottom:16px;">
      <div class="panel-title blue">The input() Function</div>
      <div class="code-block">
        <span class="code-lang-tag">python</span>
        <button class="copy-btn" onclick="copyCode(this)">COPY</button>
        <pre><code><span class="cm"># input() always returns a string — always</span>
username = <span class="fn">input</span>(<span class="str">"Enter username: "</span>)    <span class="cm"># returns str</span>
port_str = <span class="fn">input</span>(<span class="str">"Enter port number: "</span>) <span class="cm"># returns "443", not 443</span>

<span class="cm"># Must convert for math</span>
port = <span class="fn">int</span>(port_str)           <span class="cm"># "443" → 443</span>
score = <span class="fn">float</span>(<span class="fn">input</span>(<span class="str">"Score: "</span>)) <span class="cm"># "7.5" → 7.5</span>

<span class="cm"># This will crash if user types non-numeric input</span>
failed = <span class="fn">int</span>(<span class="fn">input</span>(<span class="str">"Failed attempts: "</span>))
<span class="cm"># Solution: wrap in try/except (covered in later weeks)</span></code></pre>
      </div>
      <ul style="padding-left:20px; margin-top:8px; margin-bottom:0;">
        <li><code>input()</code> displays the prompt, waits for Enter, returns everything typed as a <code>str</code></li>
        <li>Even if the user types a number, you get a string back</li>
        <li>Type errors happen at runtime if you forget to convert &mdash; Python will not warn you before execution</li>
      </ul>
    </div>

    <div class="panel" style="border-left: 3px solid var(--green-primary); margin-bottom:0;">
      <div class="panel-title">F-String Formatting</div>
      <div class="code-block">
        <span class="code-lang-tag">python</span>
        <button class="copy-btn" onclick="copyCode(this)">COPY</button>
        <pre><code>username = <span class="str">"admin"</span>
port = <span class="num">443</span>
risk_score = <span class="num">87.654</span>

<span class="cm"># Basic f-string</span>
<span class="fn">print</span>(<span class="str">f"User {username} connected on port {port}"</span>)

<span class="cm"># Number formatting</span>
<span class="fn">print</span>(<span class="str">f"Risk score: {risk_score:.2f}"</span>)     <span class="cm"># 87.65 (2 decimal places)</span>
<span class="fn">print</span>(<span class="str">f"Score: {risk_score:>8.1f}"</span>)        <span class="cm"># right-aligned 8 chars</span>
<span class="fn">print</span>(<span class="str">f"Attempts: {1234:,}"</span>)               <span class="cm"># 1,234 (thousands separator)</span>

<span class="cm"># Expressions inside f-strings</span>
<span class="fn">print</span>(<span class="str">f"Double score: {risk_score * 2:.1f}"</span>)
<span class="fn">print</span>(<span class="str">f"Separator: {'=' * 40}"</span>)</code></pre>
      </div>
      <ul style="padding-left:20px; margin-top:8px; margin-bottom:0;">
        <li>F-strings require Python 3.6+. Put <code>f</code> before the opening quote.</li>
        <li><code>:.2f</code> = 2 decimal places. <code>:&gt;8</code> = right-align in 8 chars. <code>:,</code> = thousands separator.</li>
        <li>Anything valid as a Python expression can go inside the <code>{}</code></li>
        <li><code>print()</code> is a function in Python 3 &mdash; parentheses required. Not optional.</li>
      </ul>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">I/O Check</div>
    <div class="quiz-question" id="q4-0">
      <p><strong>Q1:</strong> You run: <code>attempts = input('Failed attempts: ')</code> and the user types 7. What is the type of <code>attempts</code>?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(4, 0, this, false)">int</button>
        <button class="quiz-option" onclick="answerQuiz(4, 0, this, false)">float</button>
        <button class="quiz-option" onclick="answerQuiz(4, 0, this, true)">str (input() always returns a string)</button>
        <button class="quiz-option" onclick="answerQuiz(4, 0, this, false)">It depends on what the user types</button>
      </div>
    </div>
    <div id="m4-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 05 — RISK_CALC (simulator)
// ===================================================
const riskSimState = { seenA: false, seenB: false, seenC: false };

function riskLog(text, cls) {
  const term = document.getElementById('risk-terminal');
  if (!term) return;
  const line = document.createElement('div');
  line.style.cssText = 'padding:2px 0; font-size:0.88em; font-family:var(--font);';
  if (cls === 'error')   line.style.color = 'var(--red-alert)';
  else if (cls === 'success') line.style.color = 'var(--green-primary)';
  else if (cls === 'warn')    line.style.color = 'var(--amber)';
  else if (cls === 'info')    line.style.color = 'var(--blue-info)';
  else if (cls === 'fail')    line.style.color = 'var(--red-alert)';
  line.textContent = text;
  term.appendChild(line);
  term.scrollTop = term.scrollHeight;
}

function riskClear() {
  const term = document.getElementById('risk-terminal');
  if (term) term.innerHTML = '';
}

function runRiskScenario(key) {
  riskClear();

  if (key === 'A') {
    riskLog('> Loading scenario: CORRECT EXECUTION', 'info');
    riskLog('> Running security_risk_calculator.py', '');
    riskLog('>', '');
    riskLog('> === Security Risk Calculator ===', 'success');
    riskLog('>', '');
    riskLog('> Enter username: jdoe', '');
    riskLog('> Enter number of failed login attempts: 7', '');
    riskLog('>', '');
    riskLog('> Executing type conversion: int("7") \u2192 7', 'info');
    riskLog('> Applying risk logic: 7 > 5 \u2192 HIGH risk', 'info');
    riskLog('>', '');
    riskLog('> User: jdoe', 'success');
    riskLog('> Failed Attempts: 7', 'success');
    riskLog('> Risk Score: 100', 'success');
    riskLog('> Risk Level: HIGH', 'success');
    riskLog('> Risk Percentage: 100.0%', 'success');
    riskLog('>', '');
    riskLog('> KEY CONCEPTS DEMONSTRATED:', 'info');
    riskLog('> input() \u2192 always returns str', '');
    riskLog('> int() \u2192 converts "7" to 7', '');
    riskLog('> if/elif/else \u2192 classifies risk level', '');
    riskLog('> f-strings \u2192 formats final output', '');
    riskLog('> Division in Python 3 always returns float \u2192 100.0%', '');
    riskLog('>', '');
    riskLog('> STATUS: PASS \u2014 FIRST SCRIPT COMPLETE', 'success');

  } else if (key === 'B') {
    riskLog('> Loading scenario: TYPE ERROR', 'info');
    riskLog('> Running broken_calculator.py', '');
    riskLog('>', '');
    riskLog('> Enter failed attempts: 7', '');
    riskLog('>', '');
    riskLog('> Executing: risk_score = 100 / failed_attempts', '');
    riskLog('> where failed_attempts is still a STRING "7"', 'warn');
    riskLog('>', '');
    riskLog('> Traceback (most recent call last):', 'error');
    riskLog('>   File "broken_calculator.py", line 12', 'error');
    riskLog('>     risk_score = 100 / failed_attempts', 'error');
    riskLog('> TypeError: unsupported operand type(s) for /: \'int\' and \'str\'', 'error');
    riskLog('>', '');
    riskLog('> ROOT CAUSE: forgot int() conversion', 'warn');
    riskLog('> The user typed "7" \u2014 input() returned the string "7"', '');
    riskLog('> Dividing 100 by "7" fails because you cannot divide by a string', '');
    riskLog('>', '');
    riskLog('> FIX: failed_attempts = int(input("Enter attempts: "))', 'success');
    riskLog('>', '');
    riskLog('> STATUS: FAIL \u2014 TYPE ERROR', 'fail');

  } else if (key === 'C') {
    riskLog('> Loading scenario: BOUNDARY TEST', 'info');
    riskLog('>', '');
    riskLog('> Testing risk thresholds:', '');
    riskLog('>', '');
    riskLog('> Input: 2 \u2192 2 <= 2 \u2192 risk_score = 10 \u2192 LOW \u2713', 'success');
    riskLog('> Input: 3 \u2192 3 > 2, 3 <= 5 \u2192 risk_score = 50 \u2192 MEDIUM \u2713', 'success');
    riskLog('> Input: 5 \u2192 5 <= 5 \u2192 risk_score = 50 \u2192 MEDIUM \u2713', 'success');
    riskLog('> Input: 6 \u2192 6 > 5 \u2192 risk_score = 100 \u2192 HIGH \u2713', 'success');
    riskLog('>', '');
    riskLog('> BOUNDARY: Exactly at threshold uses <=, not <', 'warn');
    riskLog('> 5 <= 5 is True \u2192 MEDIUM (not HIGH)', '');
    riskLog('> 6 > 5 is True \u2192 HIGH', '');
    riskLog('>', '');
    riskLog('> This is why boundary testing matters.', '');
    riskLog('> The condition determines which side of the threshold counts.', '');
    riskLog('>', '');
    riskLog('> STATUS: PASS \u2014 BOUNDARY LOGIC VERIFIED', 'success');
  }

  riskSimState['seen' + key] = true;
  const checkEl = document.getElementById('risk-check-' + key);
  if (checkEl) {
    checkEl.style.color = 'var(--green-primary)';
    checkEl.textContent = '\u2713 Scenario ' + key + ' complete';
  }
  riskSimCheckComplete();
}

function riskSimCheckComplete() {
  if (riskSimState.seenA && riskSimState.seenB && riskSimState.seenC) {
    const statusEl = document.getElementById('m5-status');
    if (statusEl) statusEl.innerHTML = '<span class="status-pass">\u2713 ALL SCENARIOS COMPLETE \u2014 MISSION 05 COMPLETE</span>';
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
    <div class="panel-title blue">Security Risk Calculator</div>
    <p>The security risk calculator is the canonical first security Python script. It takes user input, converts types, applies if/elif/else logic, and produces formatted output. This pattern &mdash; input, process, output &mdash; appears in every security tool you will build.</p>
    <div class="concept-grid">

      <div class="concept-card">
        <h3>Scenario A</h3>
        <p><strong>Correct Execution</strong><br>Successful run</p>
        <p style="color:var(--text-dim); font-size:0.85em; margin-top:8px;">A correctly written calculator: input() returns str, int() converts it, if/elif/else classifies risk, f-strings format output.</p>
        <button class="btn-run" style="margin-top:14px; font-size:0.8em; padding:8px 16px;" onclick="runRiskScenario('A')">&#9654; RUN</button>
      </div>

      <div class="concept-card">
        <h3>Scenario B</h3>
        <p><strong>Type Error</strong><br>Missing conversion</p>
        <p style="color:var(--text-dim); font-size:0.85em; margin-top:8px;">What happens when you forget int() conversion and try to do math on a string. Common beginner mistake with a clear fix.</p>
        <button class="btn-run" style="margin-top:14px; font-size:0.8em; padding:8px 16px;" onclick="runRiskScenario('B')">&#9654; RUN</button>
      </div>

      <div class="concept-card">
        <h3>Scenario C</h3>
        <p><strong>Boundary Test</strong><br>Threshold logic</p>
        <p style="color:var(--text-dim); font-size:0.85em; margin-top:8px;">Testing at the exact threshold values. Why 5 stays MEDIUM but 6 becomes HIGH. Boundary conditions determine correctness.</p>
        <button class="btn-run" style="margin-top:14px; font-size:0.8em; padding:8px 16px;" onclick="runRiskScenario('C')">&#9654; RUN</button>
      </div>

    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Risk Calculator Simulator</div>
    <div id="risk-terminal" style="background:var(--bg-editor); border:1px solid var(--border); border-radius:3px; padding:16px; min-height:200px; font-family:var(--font); font-size:0.88em; overflow-y:auto; max-height:520px; white-space:pre-wrap;"></div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Scenarios Completed</div>
    <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:8px;">
      <div id="risk-check-A" style="color:var(--text-dim);">&#9744; Scenario A &mdash; Correct Execution</div>
      <div id="risk-check-B" style="color:var(--text-dim);">&#9744; Scenario B &mdash; Type Error</div>
      <div id="risk-check-C" style="color:var(--text-dim);">&#9744; Scenario C &mdash; Boundary Test</div>
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
    if (finalEl) finalEl.innerHTML = '<span class="status-pass">\u2713 OPERATION ZERO-IN COMPLETE. Python foundation established. Four data types understood. Security risk calculator operational. You have the foundation to build any interactive security tool in this course. Outstanding work, Analyst.</span>';
    setTimeout(function() { completeMission(6); }, 800);
  }
}

MISSION_RENDERERS[6] = function() {
  return `
  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Week 1 Completion Checklist</div>
    <p>Seven concrete items &mdash; not plans, confirmations. Click each item only after you have actually done it. All seven must be confirmed to complete OPERATION: ZERO-IN.</p>
    <div class="hint-box">
      <strong>This is a completion checklist, not a planning list.</strong> Click each item only when it is genuinely true. Your Python foundation is what carries you through every week that follows.
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Confirm All Seven Items</div>
    <p style="color:var(--text-dim); font-size:0.85em; margin-bottom:16px;">Click each item only after it is genuinely true for you.</p>

    <div style="display:flex; flex-direction:column; gap:12px;">

      <div id="final-item-0" onclick="checkFinalItem(0)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="final-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Python 3 is installed and <code>python3 --version</code> runs without error</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">Open a terminal. Type <code>python3 --version</code>. You should see a version number like Python 3.11.x. If you see an error, Python 3 is not installed or not on your PATH.</p>
        </div>
      </div>

      <div id="final-item-1" onclick="checkFinalItem(1)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="final-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>I can explain why Python is used for cybersecurity</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">Three reasons: rapid development (hours, not days), massive security library ecosystem (scapy, hashlib, socket, re), and industry standard (MITRE ATT&amp;CK, Volatility, Impacket are all Python).</p>
        </div>
      </div>

      <div id="final-item-2" onclick="checkFinalItem(2)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="final-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>I know the four core data types: int, float, str, bool &mdash; and a security example of each</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;"><code>int</code>: port numbers like 443. <code>float</code>: CVSS scores like 7.5. <code>str</code>: IP addresses like "192.168.1.1". <code>bool</code>: flags like <code>is_admin = True</code>.</p>
        </div>
      </div>

      <div id="final-item-3" onclick="checkFinalItem(3)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="final-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>I understand that division always returns a float in Python 3</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;"><code>10 / 5</code> returns <code>2.0</code>, not <code>2</code>. Use <code>//</code> for integer (floor) division: <code>10 // 5</code> returns <code>2</code>. This matters when you calculate percentages or risk scores.</p>
        </div>
      </div>

      <div id="final-item-4" onclick="checkFinalItem(4)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="final-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>I know that <code>input()</code> always returns a string and must be converted for math</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">Even if the user types 7, <code>input()</code> returns the string <code>"7"</code>. You must call <code>int()</code> or <code>float()</code> before doing arithmetic. Forgetting this causes a TypeError at runtime.</p>
        </div>
      </div>

      <div id="final-item-5" onclick="checkFinalItem(5)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="final-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>I can write an f-string with a variable, a decimal format, and a separator</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">Example: <code>f"Risk: {score:.2f} {'=' * 30}"</code> &mdash; embeds a variable, formats it to 2 decimal places, and creates a separator line. F-strings require Python 3.6+ and the <code>f</code> prefix.</p>
        </div>
      </div>

      <div id="final-item-6" onclick="checkFinalItem(6)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="final-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>I have built and run <code>security_risk_calculator.py</code> with at least three test inputs</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">Run with a LOW case (2 or fewer attempts), a MEDIUM case (3&ndash;5 attempts), and a HIGH case (6 or more). Verify the output labels match the expected thresholds. Boundary test: input exactly 5 (should be MEDIUM, not HIGH).</p>
        </div>
      </div>

    </div>

    <div id="m6-checklist-status" style="color:var(--text-dim); font-size:0.8em; margin-top:16px; letter-spacing:1px;">0 / 7 items confirmed</div>
    <div id="m6-status" class="gate-status" style="margin-top:8px;"></div>
  </div>
  `;
};
