// ===== STATE =====
const STORAGE_KEY = 'cvnp2646_w3_progress';

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
  { id: 1, key: 'INDENTATION',  label: '01\nINDENT',   icon: '⬡' },
  { id: 2, key: 'DATA_DEPTH',   label: '02\nTYPES',    icon: '⬡' },
  { id: 3, key: 'TYPE_CONV',    label: '03\nCONVERT',  icon: '⬡' },
  { id: 4, key: 'CALCULATIONS', label: '04\nCALCS',    icon: '⬡' },
  { id: 5, key: 'ENTROPY_SIM',  label: '05\nENTROPY',  icon: '⬡' },
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
    showBriefing('OPERATION CORE COMPLETE. Indentation is syntax. Data types are precise. Type conversions are explicit. Calculations are weighted and readable. You now build security tools on a solid Python foundation. Outstanding work, Analyst.', null);
    renderMissionMap();
    updateProgress();
  }
}

// ===== COMMANDER ZHANG BRIEFINGS =====
const BRIEFINGS = [
  'Welcome to OPERATION: CORE. Week 3 is where Python fundamentals become second nature. Indentation, data types, type conversion, calculations, formatted output. These are the tools you use in every single security script you will ever write. Master them here.',
  'Orientation complete. Now understand indentation. In Python, indentation IS syntax \u2014 not style, not preference. Four spaces. Consistent. Every block defined by indentation, not curly braces. Get this wrong and nothing runs.',
  'Indentation confirmed. Now go deep on data types in their security context. int for port numbers and counts. float for CVSS scores and rates. str for IP addresses and log entries. bool for access decisions. Know which type each security concept belongs in.',
  'Data types confirmed. Now master type conversion. input() always returns str. int() converts to integer. float() to float. bool() has truthiness rules. The most common beginner crash in Python is forgetting to convert input \u2014 eliminate that mistake now.',
  'Type conversion locked. Now perform professional calculations. Weighted threat scoring. UPPERCASE constants for thresholds. Multi-line expressions with parentheses. f-string formatting with decimal precision. This is how production security tools compute and display risk.',
  'Calculations mastered. Run the entropy simulator. See how password character pool, length, and entropy bits determine cracking time. This is the calculation behind every password policy you will ever enforce.',
  'Final checks stand between you and a complete Python fundamentals toolkit. Confirm every item to complete OPERATION: CORE.',
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
  document.title = 'MISSION ' + String(id).padStart(2, '0') + ' \u2014 ' + (MISSIONS[id] ? MISSIONS[id].key : '') + ' | OPERATION: CORE';
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
    <div class="panel-title">WHY FUNDAMENTALS MATTER FOR SECURITY CODE</div>
    <p>Week 3 is not about adding new tools. It is about making every tool you write from this point forward <strong>correct, readable, and predictable</strong>. Indentation, data types, type conversion, and f-string formatting appear in every security script you will ever write. If you skip this foundation, every project after it is built on unstable ground.</p>

    <div class="concept-grid">
      <div class="concept-card">
        <h3>The Cost of Skipping Fundamentals</h3>
        <ul style="margin-top:8px; padding-left:18px;">
          <li>Security tools that crash on malformed input create vulnerabilities of their own</li>
          <li>A tool that silently produces wrong results because of a type error is worse than a tool that crashes</li>
          <li>Unreadable code with inconsistent indentation fails code reviews and cannot be maintained</li>
          <li>Professional security code is readable, predictable, and correct &mdash; fundamentals are what make that possible</li>
        </ul>
      </div>
      <div class="concept-card">
        <h3>What Week 3 Establishes</h3>
        <ul style="margin-top:8px; padding-left:18px;">
          <li><strong>Indentation:</strong> Python uses 4-space indentation as syntax &mdash; consistent or it will not run</li>
          <li><strong>Data types:</strong> int, float, str, bool &mdash; each has a specific role in security programming</li>
          <li><strong>Type conversion:</strong> input() returns str; always convert before doing math</li>
          <li><strong>Calculations:</strong> weighted scoring, UPPERCASE constants, multi-line expressions, f-string precision</li>
          <li>All four Python data types map directly to security concepts (ports, scores, IPs, access flags)</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Orientation Check &mdash; 3 Questions</div>
    <p>Answer all three correctly to unlock Mission 01.</p>

    <div class="quiz-question" id="q0-0">
      <p><strong>Q1:</strong> In Python, what defines a code block (like an if statement body)?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">Curly braces <code>{}</code></button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, true)">Consistent indentation</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">A colon at the end of the line</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">A <code>begin</code>/<code>end</code> keyword pair</button>
      </div>
    </div>

    <div class="quiz-question" id="q0-1">
      <p><strong>Q2:</strong> What is PEP 8?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">A Python error code</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, true)">Python's official style guide</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">A Python testing framework</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">A version of Python</button>
      </div>
    </div>

    <div class="quiz-question" id="q0-2">
      <p><strong>Q3:</strong> Which variable name follows both Python syntax rules AND PEP 8 conventions?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)"><code>failed-attempts</code></button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)"><code>FailedAttempts</code></button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, true)"><code>failed_attempts</code></button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)"><code>failedAttempts</code></button>
      </div>
    </div>

    <div id="m0-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 01 — INDENTATION
// ===================================================
MISSION_RENDERERS[1] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">INDENTATION IS SYNTAX</div>
    <p>In most programming languages, indentation is a style choice. In Python, it is the language itself. Four spaces per level, consistent throughout the file. Python raises <code>IndentationError</code> if you get it wrong. Click all four cards below to understand every dimension of this rule.</p>
    <p style="color:var(--text-dim); font-size:0.85em; margin-top:8px;">Click each card to read the explanation. All four must be reviewed before the question unlocks.</p>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Review All Four Indentation Components</div>
    <div class="concept-grid">

      <div class="concept-card" id="card-m1-0" onclick="visitCard('m1', 0, 4)">
        <h3>Indentation Defines Code Blocks</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">THE RULE</p>
        <div class="code-block" style="margin-top:10px;">
          <pre><code><span class="cm"># Python uses indentation — no curly braces</span>
<span class="kw">def</span> <span class="fn">check_port</span>(port):
    <span class="kw">if</span> port &lt; <span class="num">1024</span>:              <span class="cm"># 4 spaces</span>
        <span class="fn">print</span>(<span class="str">"System port"</span>)    <span class="cm"># 8 spaces (nested)</span>
        <span class="kw">if</span> port == <span class="num">22</span>:           <span class="cm"># 8 spaces</span>
            <span class="fn">print</span>(<span class="str">"SSH"</span>)         <span class="cm"># 12 spaces (double nested)</span>
    <span class="kw">else</span>:                        <span class="cm"># back to 4 spaces</span>
        <span class="fn">print</span>(<span class="str">"User port"</span>)       <span class="cm"># 8 spaces</span></code></pre>
        </div>
        <ul style="margin-top:10px; padding-left:18px; font-size:0.88em;">
          <li>Each level of nesting adds exactly 4 spaces</li>
          <li>The <code>else</code> is at the same level as its <code>if</code></li>
          <li>Python raises <code>IndentationError</code> if indentation is inconsistent</li>
          <li>This is not optional &mdash; it is how Python understands your program's structure</li>
        </ul>
      </div>

      <div class="concept-card" id="card-m1-1" onclick="visitCard('m1', 1, 4)">
        <h3>The 4-Space Standard</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">PEP 8</p>
        <ul style="margin-top:8px; padding-left:18px; font-size:0.88em;">
          <li>PEP 8 (Python's official style guide) specifies 4 spaces per indentation level</li>
          <li>Do not use tabs in Python &mdash; mixing tabs and spaces causes <code>TabError</code></li>
          <li>Set your editor to insert 4 spaces when you press Tab (most editors do this automatically)</li>
          <li>Consistency is mandatory &mdash; you cannot mix 2-space and 4-space indentation within one file</li>
        </ul>
      </div>

      <div class="concept-card" id="card-m1-2" onclick="visitCard('m1', 2, 4)">
        <h3>Common IndentationError</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">WHAT GOES WRONG</p>
        <div class="code-block" style="margin-top:10px;">
          <pre><code><span class="cm"># This will cause IndentationError</span>
<span class="kw">def</span> <span class="fn">broken_function</span>():
    <span class="fn">print</span>(<span class="str">"First line"</span>)    <span class="cm"># 4 spaces</span>
  <span class="fn">print</span>(<span class="str">"Second line"</span>)     <span class="cm"># 2 spaces — ERROR</span>

<span class="cm"># This will also fail</span>
<span class="kw">if</span> <span class="kw">True</span>:
<span class="fn">print</span>(<span class="str">"No indent"</span>)  <span class="cm"># IndentationError: expected an indented block</span></code></pre>
        </div>
        <ul style="margin-top:10px; padding-left:18px; font-size:0.88em;">
          <li>Python will tell you exactly which line caused the error</li>
          <li>The fix is always: make the indentation consistent and correct for the nesting level</li>
          <li>IDEs like VS Code highlight indentation issues before you run the code</li>
        </ul>
      </div>

      <div class="concept-card" id="card-m1-3" onclick="visitCard('m1', 3, 4)">
        <h3>Comments and Docstrings</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">DOCUMENTATION</p>
        <div class="code-block" style="margin-top:10px;">
          <pre><code><span class="cm"># Single-line comment — starts with hash</span>
<span class="cm"># Python ignores everything after the hash</span>

<span class="kw">def</span> <span class="fn">check_password</span>(password):
    <span class="str">"""
    Docstring: describes what this function does.
    Appears in help() and IDE tooltips.
    This is the professional way to document functions.
    """</span>
    <span class="kw">pass</span>  <span class="cm"># pass is a placeholder — does nothing but is syntactically required</span></code></pre>
        </div>
      </div>

    </div>
    <div id="card-m1-status" style="color:var(--text-dim); font-size:0.8em; margin-top:8px; letter-spacing:1px;">0 / 4 components reviewed</div>
  </div>

  <div class="panel" id="m1-question-panel" style="display:none">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Indentation Check</div>
    <div class="quiz-question" id="q1-0">
      <p><strong>Q1:</strong> What Python error is raised when indentation is inconsistent or wrong?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)"><code>SyntaxError</code></button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, true)"><code>IndentationError</code></button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)"><code>TabError</code></button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)"><code>ValueError</code></button>
      </div>
    </div>
    <div id="m1-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 02 — DATA_DEPTH
// ===================================================
MISSION_RENDERERS[2] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">DATA TYPES IN SECURITY CONTEXT</div>
    <p>Python has four primitive data types that you will use in every security script: <strong>int</strong>, <strong>float</strong>, <strong>str</strong>, and <strong>bool</strong>. Each one maps directly to a category of security data. Knowing which type to use &mdash; and why &mdash; is what separates readable professional code from code that confuses the next analyst who reads it.</p>
    <p style="color:var(--text-dim); font-size:0.85em; margin-top:8px;">Click each card to read the explanation. All four must be reviewed before the questions unlock.</p>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Review All Four Data Type Components</div>
    <div class="concept-grid">

      <div class="concept-card" id="card-m2-0" onclick="visitCard('m2', 0, 4)">
        <h3>Integer in Security</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">INT</p>
        <div class="code-block" style="margin-top:10px;">
          <pre><code><span class="cm"># Integers: whole numbers, no size limit in Python 3</span>
ssh_port = <span class="num">22</span>
rdp_port = <span class="num">3389</span>
failed_attempts = <span class="num">5</span>
total_packets = <span class="num">1_048_576</span>  <span class="cm"># underscores for readability</span>

<span class="cm"># Arithmetic operators</span>
total_ports = ssh_port + rdp_port    <span class="cm"># 3411</span>
is_even = rdp_port % <span class="num">2</span> == <span class="num">0</span>          <span class="cm"># False (3389 is odd)</span>
doubled = ssh_port * <span class="num">2</span>                <span class="cm"># 44</span>
power_of_two = <span class="num">2</span> ** <span class="num">10</span>                <span class="cm"># 1024</span>

<span class="cm"># Division ALWAYS returns float in Python 3</span>
<span class="fn">print</span>(<span class="num">10</span> / <span class="num">5</span>)   <span class="cm"># 2.0 (not 2)</span>
<span class="fn">print</span>(<span class="num">10</span> // <span class="num">5</span>)  <span class="cm"># 2   (floor division — integer result)</span>
<span class="fn">print</span>(<span class="num">10</span> % <span class="num">3</span>)   <span class="cm"># 1   (modulus — remainder)</span></code></pre>
        </div>
      </div>

      <div class="concept-card" id="card-m2-1" onclick="visitCard('m2', 1, 4)">
        <h3>Float in Security</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">FLOAT</p>
        <div class="code-block" style="margin-top:10px;">
          <pre><code><span class="cm"># Floats: decimal numbers</span>
cvss_score = <span class="num">7.5</span>
packet_loss = <span class="num">0.023</span>
failure_rate = <span class="num">0.583</span>
response_time = <span class="num">0.125</span>

<span class="cm"># Float formatting</span>
<span class="fn">print</span>(<span class="str">f"CVSS: {cvss_score:.1f}"</span>)        <span class="cm"># 7.5</span>
<span class="fn">print</span>(<span class="str">f"Loss: {packet_loss * 100:.2f}%"</span>) <span class="cm"># 2.30%</span>

<span class="cm"># CRITICAL: Float precision trap</span>
a = <span class="num">0.1</span> + <span class="num">0.2</span>
<span class="fn">print</span>(a)          <span class="cm"># 0.30000000000000004</span>
<span class="fn">print</span>(a == <span class="num">0.3</span>)   <span class="cm"># False !</span>

<span class="cm"># Fix: compare with tolerance</span>
<span class="fn">print</span>(<span class="fn">abs</span>(a - <span class="num">0.3</span>) &lt; <span class="num">0.0001</span>)  <span class="cm"># True</span></code></pre>
        </div>
        <p style="font-size:0.85em; margin-top:10px; color:var(--amber);">Binary floating point cannot represent some decimal fractions exactly. Never use <code>==</code> to compare floats in security-critical threshold logic.</p>
      </div>

      <div class="concept-card" id="card-m2-2" onclick="visitCard('m2', 2, 4)">
        <h3>String in Security</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">STR</p>
        <div class="code-block" style="margin-top:10px;">
          <pre><code><span class="cm"># Strings: immutable text</span>
ip_address = <span class="str">"192.168.1.100"</span>
username = <span class="str">"admin"</span>
log_entry = <span class="str">"FAILED LOGIN user=root ip=203.0.113.45"</span>

<span class="cm"># Key string methods for security work</span>
<span class="fn">print</span>(ip_address.<span class="fn">split</span>(<span class="str">'.'</span>))          <span class="cm"># ['192', '168', '1', '100']</span>
<span class="fn">print</span>(log_entry.<span class="fn">startswith</span>(<span class="str">'FAILED'</span>)) <span class="cm"># True</span>
<span class="fn">print</span>(username.<span class="fn">upper</span>())               <span class="cm"># 'ADMIN'</span>
<span class="fn">print</span>(log_entry.<span class="fn">split</span>(<span class="str">'ip='</span>)[<span class="num">1</span>])      <span class="cm"># '203.0.113.45'</span>

<span class="cm"># Strings are immutable — you create new strings, never modify</span>
new_log = log_entry.<span class="fn">replace</span>(<span class="str">"FAILED"</span>, <span class="str">"BLOCKED"</span>)

<span class="cm"># F-string formatting</span>
alert = <span class="str">f"[ALERT] {username} from {ip_address}: {log_entry}"</span></code></pre>
        </div>
      </div>

      <div class="concept-card" id="card-m2-3" onclick="visitCard('m2', 3, 4)">
        <h3>Boolean in Security</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">BOOL</p>
        <div class="code-block" style="margin-top:10px;">
          <pre><code><span class="cm"># Booleans: True or False (capital T and F required)</span>
is_admin = <span class="kw">True</span>
account_locked = <span class="kw">False</span>
port_open = <span class="kw">True</span>
mfa_enabled = <span class="kw">False</span>

<span class="cm"># Boolean logic</span>
<span class="kw">if</span> is_admin <span class="kw">and not</span> account_locked:
    <span class="fn">print</span>(<span class="str">"Access granted"</span>)

<span class="kw">if</span> port_open <span class="kw">or</span> mfa_enabled:
    <span class="fn">print</span>(<span class="str">"At least one security check passes"</span>)

<span class="cm"># Truthiness: what is False?</span>
<span class="fn">bool</span>(<span class="num">0</span>)      <span class="cm"># False</span>
<span class="fn">bool</span>(<span class="str">""</span>)     <span class="cm"># False  (empty string)</span>
<span class="fn">bool</span>([])     <span class="cm"># False  (empty list)</span>
<span class="fn">bool</span>(<span class="kw">None</span>)   <span class="cm"># False</span>
<span class="cm"># Everything else is True</span>
<span class="fn">bool</span>(<span class="num">1</span>)      <span class="cm"># True</span>
<span class="fn">bool</span>(<span class="str">"x"</span>)   <span class="cm"># True</span>
<span class="fn">bool</span>([<span class="num">1</span>])    <span class="cm"># True</span></code></pre>
        </div>
      </div>

    </div>
    <div id="card-m2-status" style="color:var(--text-dim); font-size:0.8em; margin-top:8px; letter-spacing:1px;">0 / 4 components reviewed</div>
  </div>

  <div class="panel" id="m2-question-panel" style="display:none">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Data Types Check &mdash; 4 Questions</div>
    <p>Answer all four correctly to unlock Mission 03.</p>

    <div class="quiz-question" id="q2-0">
      <p><strong>Q1:</strong> What does <code>10 // 3</code> return?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">3.333...</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, true)">3</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">1</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">Error</button>
      </div>
    </div>

    <div class="quiz-question" id="q2-1">
      <p><strong>Q2:</strong> You have <code>failure_rate = 0.583</code>. What does <code>f'{failure_rate:.1%}'</code> produce?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, false)">'0.583'</button>
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, true)">'58.3%'</button>
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, false)">'58%'</button>
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, false)">Error</button>
      </div>
    </div>

    <div class="quiz-question" id="q2-2">
      <p><strong>Q3:</strong> Which value is falsy in Python?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, false)"><code>1</code></button>
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, false)"><code>'False'</code></button>
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, true)"><code>0</code></button>
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, false)"><code>[0]</code></button>
      </div>
    </div>

    <div class="quiz-question" id="q2-3">
      <p><strong>Q4:</strong> An IP address like '192.168.1.1' should be stored as a string because:</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, false)">Python does not have an IP type</button>
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, true)">IP addresses contain dots which are not valid in numbers &mdash; you need string operations like <code>split('.')</code></button>
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, false)">Integers cannot store enough digits</button>
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, false)">Strings are faster than integers</button>
      </div>
    </div>

    <div id="m2-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 03 — TYPE_CONV
// ===================================================
MISSION_RENDERERS[3] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">TYPE CONVERSION</div>
    <p>Python is strongly typed: <code>"7" + 1</code> raises <code>TypeError</code>. You must explicitly convert between types. This is a feature, not a limitation &mdash; it forces you to think clearly about what kind of data you are working with at every step of your script.</p>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">The Four Conversion Functions</div>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code><span class="cm"># int() — convert to integer</span>
port_str = <span class="str">"443"</span>
port = <span class="fn">int</span>(port_str)    <span class="cm"># "443" → 443</span>
attempts = <span class="fn">int</span>(<span class="num">3.9</span>)     <span class="cm"># 3.9 → 3 (truncates, does not round)</span>
flag = <span class="fn">int</span>(<span class="kw">True</span>)        <span class="cm"># True → 1, False → 0</span>

<span class="cm"># float() — convert to decimal</span>
score_str = <span class="str">"7.5"</span>
score = <span class="fn">float</span>(score_str)  <span class="cm"># "7.5" → 7.5</span>
score2 = <span class="fn">float</span>(<span class="num">5</span>)         <span class="cm"># 5 → 5.0</span>

<span class="cm"># str() — convert to string</span>
count = <span class="num">5</span>
message = <span class="str">"Attempts: "</span> + <span class="fn">str</span>(count)  <span class="cm"># must convert to concat with string</span>
ip_parts = [<span class="num">192</span>, <span class="num">168</span>, <span class="num">1</span>, <span class="num">1</span>]
ip = <span class="str">'.'</span>.<span class="fn">join</span>(<span class="fn">str</span>(p) <span class="kw">for</span> p <span class="kw">in</span> ip_parts)  <span class="cm"># "192.168.1.1"</span>

<span class="cm"># bool() — convert to boolean</span>
<span class="fn">bool</span>(<span class="num">0</span>)    <span class="cm"># False    </span><span class="fn">bool</span>(<span class="num">1</span>)    <span class="cm"># True</span>
<span class="fn">bool</span>(<span class="str">""</span>)   <span class="cm"># False    </span><span class="fn">bool</span>(<span class="str">"x"</span>)  <span class="cm"># True</span>
<span class="fn">bool</span>(<span class="kw">None</span>) <span class="cm"># False    </span><span class="fn">bool</span>([])   <span class="cm"># False</span></code></pre>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">The Critical Rule: input() Always Returns str</div>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code><span class="cm"># WRONG — type error waiting to happen</span>
failed = <span class="fn">input</span>(<span class="str">"Failed attempts: "</span>)    <span class="cm"># user types "7"</span>
risk = <span class="num">100</span> / failed                    <span class="cm"># TypeError: str / str</span>

<span class="cm"># RIGHT — always convert</span>
failed = <span class="fn">int</span>(<span class="fn">input</span>(<span class="str">"Failed attempts: "</span>))   <span class="cm"># "7" → 7</span>
risk = <span class="num">100</span> / failed                         <span class="cm"># works: 100 / 7</span>

<span class="cm"># Combining on one line</span>
port = <span class="fn">int</span>(<span class="fn">input</span>(<span class="str">"Enter port: "</span>))
score = <span class="fn">float</span>(<span class="fn">input</span>(<span class="str">"Enter CVSS score: "</span>))

<span class="cm"># What if user enters non-numeric input?</span>
<span class="cm"># int("seven") raises ValueError</span>
<span class="cm"># We handle this with try/except (covered in later weeks)</span></code></pre>
    </div>
    <div class="danger-box">
      <strong>Every piece of user input is a string, every time, with no exceptions.</strong> <code>int("443")</code> succeeds. <code>int("ssh")</code> raises <code>ValueError</code>. Type conversion errors are the most common beginner crash in Python security scripts.
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Type Conversion Check</div>
    <div class="quiz-question" id="q3-0">
      <p><strong>Q1:</strong> What does <code>int(7.9)</code> return?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">8</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, true)">7</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">7.9</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">ValueError</button>
      </div>
    </div>
    <div id="m3-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 04 — CALCULATIONS
// ===================================================
MISSION_RENDERERS[4] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">WEIGHTED THREAT SCORE CALCULATIONS</div>
    <p>Production security tools do not produce raw numbers &mdash; they produce <strong>weighted, formatted, readable results</strong>. This mission covers UPPERCASE constants, multi-line expressions, and f-string formatting. These are the exact patterns you will use in your threat score calculator this week.</p>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">The Threat Score Calculator Pattern</div>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code><span class="cm"># threat_score_calculator.py</span>
<span class="cm"># UPPERCASE constants for values that never change</span>
VULN_WEIGHT    = <span class="num">0.4</span>
EXPLOIT_WEIGHT = <span class="num">0.3</span>
ASSET_WEIGHT   = <span class="num">0.2</span>
EXPOSURE_WEIGHT = <span class="num">0.1</span>
<span class="cm"># Weights must sum to 1.0</span>

<span class="cm"># Input scores (0-100 scale)</span>
vulnerability_score  = <span class="num">85</span>
exploit_availability = <span class="num">90</span>
asset_criticality    = <span class="num">75</span>
current_exposure     = <span class="num">60</span>

<span class="cm"># Multi-line expression with parentheses — readable</span>
threat_score = (
    vulnerability_score  * VULN_WEIGHT    +
    exploit_availability * EXPLOIT_WEIGHT +
    asset_criticality    * ASSET_WEIGHT   +
    current_exposure     * EXPOSURE_WEIGHT
)
<span class="cm"># Result: 80.0</span>

<span class="cm"># f-string with decimal precision</span>
<span class="fn">print</span>(<span class="str">f"Threat Score: {threat_score:.1f}/100"</span>)  <span class="cm"># 80.0/100</span></code></pre>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">F-String Formatting Reference</div>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code>score = <span class="num">87.654</span>
count = <span class="num">1234567</span>
name  = <span class="str">"CRITICAL"</span>

<span class="cm"># Decimal places</span>
<span class="fn">print</span>(<span class="str">f"{score:.0f}"</span>)     <span class="cm"># 88      (0 decimal places — rounds)</span>
<span class="fn">print</span>(<span class="str">f"{score:.2f}"</span>)     <span class="cm"># 87.65   (2 decimal places)</span>
<span class="fn">print</span>(<span class="str">f"{score:.4f}"</span>)     <span class="cm"># 87.6540 (4 decimal places)</span>

<span class="cm"># Width and alignment</span>
<span class="fn">print</span>(<span class="str">f"{score:>10.2f}"</span>)  <span class="cm"># "     87.65" (right-aligned in 10 chars)</span>
<span class="fn">print</span>(<span class="str">f"{score:&lt;10.2f}"</span>)  <span class="cm"># "87.65     " (left-aligned in 10 chars)</span>

<span class="cm"># Thousands separator</span>
<span class="fn">print</span>(<span class="str">f"{count:,}"</span>)       <span class="cm"># 1,234,567</span>

<span class="cm"># Percentage</span>
rate = <span class="num">0.583</span>
<span class="fn">print</span>(<span class="str">f"{rate:.1%}"</span>)      <span class="cm"># 58.3%</span>

<span class="cm"># String repetition in f-strings</span>
<span class="fn">print</span>(<span class="str">f"{'=' * 40}"</span>)      <span class="cm"># ========================================</span></code></pre>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Calculations Check</div>
    <div class="quiz-question" id="q4-0">
      <p><strong>Q1:</strong> What does <code>f'{0.583:.1%}'</code> produce?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(4, 0, this, false)">'0.6%'</button>
        <button class="quiz-option" onclick="answerQuiz(4, 0, this, true)">'58.3%'</button>
        <button class="quiz-option" onclick="answerQuiz(4, 0, this, false)">'58%'</button>
        <button class="quiz-option" onclick="answerQuiz(4, 0, this, false)">'0.583%'</button>
      </div>
    </div>
    <div id="m4-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 05 — ENTROPY_SIM (simulator)
// ===================================================
const entropySimState = { seenA: false, seenB: false, seenC: false };

function entropyLog(text, cls) {
  const term = document.getElementById('entropy-terminal');
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

function entropyClear() {
  const term = document.getElementById('entropy-terminal');
  if (term) term.innerHTML = '';
}

function runEntropyScenario(key) {
  entropyClear();

  if (key === 'A') {
    entropyLog('> Loading scenario: WEAK PASSWORD ANALYSIS', 'info');
    entropyLog('> Analyzing: "password123"', '');
    entropyLog('>', '');
    entropyLog('> Character pool analysis:', '');
    entropyLog('> Lowercase letters: YES (+26)', 'success');
    entropyLog('> Uppercase letters: NO', 'warn');
    entropyLog('> Digits:            YES (+10)', 'success');
    entropyLog('> Special chars:     NO', 'warn');
    entropyLog('>', '');
    entropyLog('> Pool size: 36 characters', '');
    entropyLog('> Password length: 11 characters', '');
    entropyLog('>', '');
    entropyLog('> Entropy = 11 \u00d7 log\u2082(36)', '');
    entropyLog('> Entropy = 11 \u00d7 5.17', '');
    entropyLog('> Entropy = 56.87 bits', '');
    entropyLog('>', '');
    entropyLog('> Classification:', '');
    entropyLog('>  < 28 bits:   VERY WEAK \u2014 crackable instantly', '');
    entropyLog('>  28-36 bits:  WEAK \u2014 crackable in hours', '');
    entropyLog('>  36-60 bits:  MODERATE \u2014 crackable in days/weeks  \u2190 HERE', 'warn');
    entropyLog('>  60-80 bits:  STRONG \u2014 crackable in years', '');
    entropyLog('>  > 80 bits:   VERY STRONG \u2014 crackable in centuries', '');
    entropyLog('>', '');
    entropyLog('> Result: MODERATE \u2014 crackable in days/weeks', 'warn');
    entropyLog('> Fix: Add uppercase + special characters', 'warn');
    entropyLog('>', '');
    entropyLog('> STATUS: MODERATE \u2014 not production ready', 'warn');

  } else if (key === 'B') {
    entropyLog('> Loading scenario: STRONG PASSWORD ANALYSIS', 'info');
    entropyLog('> Analyzing: "C0mpl3x!P@ssw0rd"', '');
    entropyLog('>', '');
    entropyLog('> Character pool analysis:', '');
    entropyLog('> Lowercase letters: YES (+26)', 'success');
    entropyLog('> Uppercase letters: YES (+26)', 'success');
    entropyLog('> Digits:            YES (+10)', 'success');
    entropyLog('> Special chars:     YES (+32)', 'success');
    entropyLog('>', '');
    entropyLog('> Pool size: 94 characters', '');
    entropyLog('> Password length: 16 characters', '');
    entropyLog('>', '');
    entropyLog('> Entropy = 16 \u00d7 log\u2082(94)', '');
    entropyLog('> Entropy = 16 \u00d7 6.55', '');
    entropyLog('> Entropy = 104.80 bits', '');
    entropyLog('>', '');
    entropyLog('> Result: VERY STRONG \u2014 crackable in centuries', 'success');
    entropyLog('>', '');
    entropyLog('> Pool size matters: 36-char pool (lowercase+digits) vs', '');
    entropyLog('>                    94-char pool (all types) at same length:', '');
    entropyLog('>', '');
    entropyLog('> 11-char password with pool 36:  56.87 bits  (days)', 'warn');
    entropyLog('> 11-char password with pool 94:  71.98 bits  (years)', 'success');
    entropyLog('>', '');
    entropyLog('> STATUS: PASS \u2014 production grade entropy', 'success');

  } else if (key === 'C') {
    entropyLog('> Loading scenario: LENGTH vs COMPLEXITY', 'info');
    entropyLog('>', '');
    entropyLog('> Comparing password strategies at equal effort:', '');
    entropyLog('>', '');
    entropyLog('> Short + complex: "X9@mQ" (5 chars, pool=94)', '');
    entropyLog('>   Entropy = 5 \u00d7 log\u2082(94) = 32.75 bits', '');
    entropyLog('>   Crackable in: hours', 'fail');
    entropyLog('>', '');
    entropyLog('> Long + simple: "correcthorsebatterystaple" (25 chars, pool=26)', '');
    entropyLog('>   Entropy = 25 \u00d7 log\u2082(26) = 117.69 bits', '');
    entropyLog('>   Crackable in: millions of years', 'success');
    entropyLog('>', '');
    entropyLog('> CONCLUSION:', '');
    entropyLog('> Length contributes to entropy multiplicatively.', '');
    entropyLog('> Every additional character multiplies possibilities by pool_size.', '');
    entropyLog('>', '');
    entropyLog('> Industry guidance (NIST SP 800-63B):', '');
    entropyLog('> Length matters more than complexity.', '');
    entropyLog('> A 20-char passphrase beats a complex 8-char password.', '');
    entropyLog('>', '');
    entropyLog('> STATUS: PASS \u2014 entropy model verified', 'success');
  }

  entropySimState['seen' + key] = true;
  const checkEl = document.getElementById('entropy-check-' + key);
  if (checkEl) {
    checkEl.style.color = 'var(--green-primary)';
    checkEl.textContent = '\u2713 Scenario ' + key + ' complete';
  }
  entropySimCheckComplete();
}

function entropySimCheckComplete() {
  if (entropySimState.seenA && entropySimState.seenB && entropySimState.seenC) {
    const statusEl = document.getElementById('m5-status');
    if (statusEl) statusEl.innerHTML = '<span class="status-pass">\u2713 ALL SCENARIOS COMPLETE \u2014 MISSION 05 COMPLETE</span>';
    setTimeout(function() { completeMission(5); }, 800);
  }
}

function initMission5() {
  entropySimState.seenA = false;
  entropySimState.seenB = false;
  entropySimState.seenC = false;
}

MISSION_RENDERERS[5] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">PASSWORD ENTROPY CALCULATOR</div>
    <p>Password entropy measures unpredictability in bits. The formula: <code>length &times; log&#8322;(character_pool_size)</code>. A 16-character password using all character types has 105 bits of entropy &mdash; centuries to crack. "password123" uses only lowercase + digits &mdash; 36 character pool &mdash; 56 bits &mdash; crackable in days/weeks.</p>
    <p style="margin-top:12px;">Run all three scenarios below to see the entropy model in action. This is the calculation behind every password policy you will ever enforce.</p>

    <div class="concept-grid">

      <div class="concept-card">
        <h3>Scenario A</h3>
        <p><strong>Weak Password</strong><br>"password123"</p>
        <p style="color:var(--text-dim); font-size:0.85em; margin-top:8px;">Lowercase + digits only. Pool size 36. Entropy 56.87 bits. See the classification and fix recommendation.</p>
        <button class="btn-run" style="margin-top:14px; font-size:0.8em; padding:8px 16px;" onclick="runEntropyScenario('A')">&#9654; RUN</button>
      </div>

      <div class="concept-card">
        <h3>Scenario B</h3>
        <p><strong>Strong Password</strong><br>"C0mpl3x!P@ssw0rd"</p>
        <p style="color:var(--text-dim); font-size:0.85em; margin-top:8px;">All character types. Pool size 94. Entropy 104.80 bits. Plus a pool size comparison at same length.</p>
        <button class="btn-run" style="margin-top:14px; font-size:0.8em; padding:8px 16px;" onclick="runEntropyScenario('B')">&#9654; RUN</button>
      </div>

      <div class="concept-card">
        <h3>Scenario C</h3>
        <p><strong>Length vs Complexity</strong><br>Tradeoff analysis</p>
        <p style="color:var(--text-dim); font-size:0.85em; margin-top:8px;">Short + complex vs long + simple. NIST SP 800-63B guidance. Why passphrases beat complex short passwords.</p>
        <button class="btn-run" style="margin-top:14px; font-size:0.8em; padding:8px 16px;" onclick="runEntropyScenario('C')">&#9654; RUN</button>
      </div>

    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">ENTROPY CALCULATOR SIMULATOR</div>
    <div id="entropy-terminal" style="background:var(--bg-editor); border:1px solid var(--border); border-radius:3px; padding:16px; min-height:200px; font-family:var(--font); font-size:0.88em; overflow-y:auto; max-height:520px; white-space:pre-wrap;"></div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Scenarios Completed</div>
    <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:8px;">
      <div id="entropy-check-A" style="color:var(--text-dim);">&#9744; Scenario A &mdash; Weak Password Analysis</div>
      <div id="entropy-check-B" style="color:var(--text-dim);">&#9744; Scenario B &mdash; Strong Password Analysis</div>
      <div id="entropy-check-C" style="color:var(--text-dim);">&#9744; Scenario C &mdash; Length vs Complexity Tradeoff</div>
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
    if (finalEl) finalEl.innerHTML = '<span class="status-pass">\u2713 OPERATION CORE COMPLETE \u2014 MISSION 06 COMPLETE</span>';
    setTimeout(function() { completeMission(6); }, 800);
  }
}

MISSION_RENDERERS[6] = function() {
  return `
  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">WEEK 3 COMPLETION CHECKLIST</div>
    <p>Seven concrete items &mdash; not plans, understandings. Click each item only after you can honestly confirm it. All seven must be confirmed before OPERATION: CORE is complete.</p>
    <div class="hint-box">
      <strong>This is a knowledge checklist, not a planning list.</strong> If you click an item you cannot actually explain or demonstrate, you are only deceiving yourself. The skills here appear in every future week of the course.
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Confirm All Seven Core Items</div>
    <p style="color:var(--text-dim); font-size:0.85em; margin-bottom:16px;">Click each item only after you can genuinely confirm it.</p>

    <div style="display:flex; flex-direction:column; gap:12px;">

      <div id="final-item-0" class="proposal-item" onclick="checkFinalItem(0)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="final-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Indentation as Syntax</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I know that Python uses 4-space indentation as syntax, not just style. I understand that inconsistent indentation raises <code>IndentationError</code> and that mixing tabs and spaces raises <code>TabError</code>.</p>
        </div>
      </div>

      <div id="final-item-1" class="proposal-item" onclick="checkFinalItem(1)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="final-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Four Data Types and Security Use Cases</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I understand the four data types and can name a security use case for each: int (port numbers, counts), float (CVSS scores, rates), str (IP addresses, log entries), bool (access flags, lock state).</p>
        </div>
      </div>

      <div id="final-item-2" class="proposal-item" onclick="checkFinalItem(2)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="final-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Float Precision Trap</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I know that <code>0.1 + 0.2</code> is not exactly <code>0.3</code> due to binary float representation. I know to use tolerance comparison (<code>abs(a - b) &lt; 0.0001</code>) instead of <code>==</code> for floats in threshold logic.</p>
        </div>
      </div>

      <div id="final-item-3" class="proposal-item" onclick="checkFinalItem(3)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="final-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Type Conversion Rule</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I can explain why <code>input()</code> always returns a string and when to convert it. I know that <code>int("443")</code> succeeds and <code>int("ssh")</code> raises <code>ValueError</code>. I always convert before doing math on user input.</p>
        </div>
      </div>

      <div id="final-item-4" class="proposal-item" onclick="checkFinalItem(4)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="final-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>UPPERCASE Constant Convention</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I understand the UPPERCASE naming convention for Python constants (e.g., <code>VULN_WEIGHT = 0.4</code>). I know why constants are defined at the top of a file and why they are named differently from variables.</p>
        </div>
      </div>

      <div id="final-item-5" class="proposal-item" onclick="checkFinalItem(5)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="final-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>F-String Formatting</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I can write an f-string with decimal formatting (<code>:.2f</code>), a percentage (<code>:.1%</code>), a thousands separator (<code>:,</code>), and string repetition (<code>f"{'=' * 40}"</code>). I know the difference between these format specifiers.</p>
        </div>
      </div>

      <div id="final-item-6" class="proposal-item" onclick="checkFinalItem(6)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="final-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Ran the Week 3 Scripts</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I have run the threat score calculator and password entropy calculator from the lecture. I observed the weighted score calculation output and the entropy bit values for the example passwords.</p>
        </div>
      </div>

    </div>

    <div id="m6-checklist-status" style="color:var(--text-dim); font-size:0.8em; margin-top:16px; letter-spacing:1px;">0 / 7 items confirmed</div>
    <div id="m6-status" class="gate-status" style="margin-top:8px;"></div>
  </div>
  `;
};
