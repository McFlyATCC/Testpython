// ===== STATE =====
const STORAGE_KEY = 'cvnp2646_w6_progress';

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
  { id: 0, key: 'ORIENTATION',  title: 'MISSION 00 — ORIENTATION',     subtitle: 'OPERATION BRIEFING',   label: '00\nORIENT',  icon: '⬡' },
  { id: 1, key: 'LOG_FORMAT',   title: 'MISSION 01 — LOG FORMAT',       subtitle: 'READING AUTH LOGS',    label: '01\nLOG FMT', icon: '⬡' },
  { id: 2, key: 'LOG_PARSER',   title: 'MISSION 02 — LOG PARSER',       subtitle: 'PARSING FUNCTIONS',    label: '02\nPARSER',  icon: '⬡' },
  { id: 3, key: 'COUNTER',      title: 'MISSION 03 — COUNTER',          subtitle: 'FREQUENCY ANALYSIS',   label: '03\nCOUNTER', icon: '⬡' },
  { id: 4, key: 'BRUTE_FORCE',  title: 'MISSION 04 — BRUTE FORCE SIM',  subtitle: 'ATTACK DETECTION',     label: '04\nBRUTE',   icon: '⬡' },
  { id: 5, key: 'DETECT_SIM',   title: 'MISSION 05 — DETECT SIM',       subtitle: 'LOG ANALYZER DEMO',    label: '05\nDETECT',  icon: '⬡' },
  { id: 6, key: 'FINAL_CHECK',  title: 'MISSION 06 — FINAL CHECK',      subtitle: 'DEBRIEF',              label: '06\nFINAL',   icon: '⬡' },
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
    showBriefing('OPERATION LOGWATCH COMPLETE. Your log parser detects brute force attacks. Counter turns raw log lines into threat intelligence. Commit your analyzer and move to Week 7.', null);
    renderMissionMap();
    updateProgress();
  }
}

// ===== COMMANDER ZHANG BRIEFINGS =====
const BRIEFINGS = [
  'OPERATIVE — auth logs are your primary intelligence source. Every failed login is a signal. Counter from collections turns raw log lines into actionable threat data. Parse first, analyze second, detect third. Don\'t let the noise hide the attacks. GOOD LUCK.',
  'Orientation confirmed. Mission 01 is log format. Know the structure before you parse. timestamp, hostname, service, user, IP, status. These fields are your intelligence.',
  'Log format confirmed. Mission 02 is the parser function. parse_log_line() is the core of your tool. Detect event type first, then extract IP and username.',
  'Parser confirmed. Mission 03 is Counter. collections.Counter is frequency analysis in one line. Most common IPs, most targeted users — all from a single call.',
  'Counter confirmed. Mission 04 is the brute force simulator. Three scenarios: normal activity, credential spray, targeted attack. Each has a different signature.',
  'Brute force detection confirmed. Mission 05 is the full detection pipeline. Parse, analyze, report. Three phases, one coherent tool.',
  'Detection sim complete. Final mission: confirm the Week 6 checklist. Six items. Your log analyzer must be working before you submit.',
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

const totalMap = { 0: 3, 1: 1, 2: 4, 3: 1, 4: 0, 5: 0, 6: 0 };

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
  document.title = 'MISSION ' + String(id).padStart(2, '0') + ' \u2014 ' + (MISSIONS[id] ? MISSIONS[id].key : '') + ' | OPERATION: LOGWATCH';
  const container = document.getElementById('mission-content');
  const renderer = MISSION_RENDERERS[id];
  container.innerHTML = renderer ? renderer() : '<p style="color:var(--text-dim); padding:40px 0;">Mission ' + id + ' content loading...</p>';
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
    <div class="panel-title">Week 6: Authentication Log Analysis</div>
    <p>This week you build a log scanner that detects brute force attacks. auth.log is the primary intelligence source on any Linux system. Every failed login is a data point. Counter from collections turns hundreds of log lines into a ranked list of threats in one function call.</p>
    <p style="margin-top:12px;">By the end of this week you will have a script that parses auth.log, uses Counter to find the top offending IPs, flags any IP with 3 or more failures, and prints a threat report.</p>
    <div class="concept-grid">
      <div class="concept-card" id="card-ORIENT-0" onclick="visitCard('ORIENT', 0, 3)">
        <h3>Auth Logs</h3>
        <p>System authentication records — timestamp, hostname, service, user, IP, status (<code>Accepted</code>/<code>Failed</code>)</p>
      </div>
      <div class="concept-card" id="card-ORIENT-1" onclick="visitCard('ORIENT', 1, 3)">
        <h3>Counter</h3>
        <p><code>collections.Counter</code> — frequency analysis in one line. <code>Counter(items)</code> builds a dict of counts automatically</p>
      </div>
      <div class="concept-card" id="card-ORIENT-2" onclick="visitCard('ORIENT', 2, 3)">
        <h3>Brute Force Detection</h3>
        <p>3+ failed logins from same IP = suspicious. Track <code>(ip, user)</code> pairs to find targeted attacks</p>
      </div>
    </div>
    <div id="card-ORIENT-status" style="color:var(--text-dim); font-size:0.8em; margin-top:8px; letter-spacing:1px;">0 / 3 components reviewed</div>
  </div>

  <div class="panel" id="ORIENT-question-panel" style="display:none">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Orientation Check &mdash; 3 Questions</div>
    <p>Answer all three correctly to unlock Mission 01.</p>

    <div class="quiz-question" id="q0-0">
      <p><strong>Q1:</strong> Where do SSH authentication events typically appear on Linux?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">/var/log/syslog</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, true)">/var/log/auth.log</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">/etc/passwd</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">/var/log/kern.log</button>
      </div>
    </div>

    <div class="quiz-question" id="q0-1">
      <p><strong>Q2:</strong> What does <code>Counter(['a','b','a','c','a']).most_common(1)</code> return?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, true)">[('a', 3)]</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">[('c', 1)]</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">{'a': 3}</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">3</button>
      </div>
    </div>

    <div class="quiz-question" id="q0-2">
      <p><strong>Q3:</strong> What threshold defines a brute force attempt in this week's tool?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">1 failed login</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">2 failed logins</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, true)">3+ failed logins from same IP</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">Any failed login</button>
      </div>
    </div>

    <div id="m0-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 01 — LOG FORMAT
// ===================================================
MISSION_RENDERERS[1] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Reading Authentication Logs</div>
    <p>Before you can parse a log, you must understand its structure. Every field has a position and a meaning. Review all four cards to unlock the question.</p>
    <p style="color:var(--text-dim); font-size:0.85em; margin-top:8px;">Click each card to mark it reviewed. All four must be reviewed before the question unlocks.</p>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Review All Four Log Format Components</div>
    <div class="concept-grid">

      <div class="concept-card" id="card-m1-0" onclick="visitCard('m1', 0, 4)">
        <h3>Log Line Structure</h3>
        <div class="code-block"><pre><code>Jan 15 03:47:22 server sshd[1234]: Failed password for admin from 192.168.1.100 port 54321 ssh2</code></pre></div>
      </div>

      <div class="concept-card" id="card-m1-1" onclick="visitCard('m1', 1, 4)">
        <h3>Key Fields</h3>
        <p><strong>timestamp</strong> / <strong>hostname</strong> / <strong>service</strong> / <strong>message</strong></p>
        <p style="font-size:0.85em; color:var(--text-dim);">The message field contains the event type, username, source IP, and port.</p>
      </div>

      <div class="concept-card" id="card-m1-2" onclick="visitCard('m1', 2, 4)">
        <h3>Accepted vs Failed</h3>
        <div class="code-block"><pre><code><span class="cm"># Successful</span>
... Accepted password for alice from 10.0.0.5 ...

<span class="cm"># Failed</span>
... Failed password for root from 203.0.113.5 ...</code></pre></div>
      </div>

      <div class="concept-card" id="card-m1-3" onclick="visitCard('m1', 3, 4)">
        <h3>Invalid User</h3>
        <div class="code-block"><pre><code>... Invalid user hacker from 198.51.100.1 port 12345 ssh2
<span class="cm"># Also triggers authentication failure</span></code></pre></div>
      </div>

    </div>
    <div id="card-m1-status" style="color:var(--text-dim); font-size:0.8em; margin-top:8px; letter-spacing:1px;">0 / 4 components reviewed</div>
  </div>

  <div class="panel" id="m1-question-panel" style="display:none">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Log Format Check</div>
    <div class="quiz-question" id="q1-0">
      <p><strong>Q1:</strong> In a <code>Failed password</code> log line, where does the source IP appear?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">After 'for'</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, true)">After 'from'</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">After 'port'</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">At the start of the line</button>
      </div>
    </div>
    <div id="m1-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 02 — LOG PARSER
// ===================================================
MISSION_RENDERERS[2] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">parse_log_line(): The Core Function</div>
    <p>Your entire log analyzer rests on one function: <code>parse_log_line()</code>. It takes a raw string and returns a dict with the event type, IP, and username — or <code>None</code> if the line is not an auth event. Review all four cards then answer all four questions.</p>
    <p style="color:var(--text-dim); font-size:0.85em; margin-top:8px;">Click each card to mark it reviewed. All four must be reviewed before the questions unlock.</p>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Review All Four Parser Components</div>
    <div class="concept-grid">

      <div class="concept-card" id="card-m2-0" onclick="visitCard('m2', 0, 4)">
        <h3>parse_log_line() — signature</h3>
        <div class="code-block"><pre><code><span class="kw">def</span> <span class="fn">parse_log_line</span>(line):
    <span class="str">"""Parse one auth log line.
    Returns dict or None if not auth event."""</span></code></pre></div>
      </div>

      <div class="concept-card" id="card-m2-1" onclick="visitCard('m2', 1, 4)">
        <h3>Detect event type</h3>
        <div class="code-block"><pre><code><span class="kw">if</span> <span class="str">'Failed password'</span> <span class="kw">in</span> line:
    event_type = <span class="str">'failed'</span>
<span class="kw">elif</span> <span class="str">'Accepted password'</span> <span class="kw">in</span> line:
    event_type = <span class="str">'accepted'</span>
<span class="kw">else</span>:
    <span class="kw">return</span> <span class="kw">None</span></code></pre></div>
      </div>

      <div class="concept-card" id="card-m2-2" onclick="visitCard('m2', 2, 4)">
        <h3>Extract IP with split()</h3>
        <div class="code-block"><pre><code><span class="cm"># 'from 192.168.1.100 port'</span>
parts = line.<span class="fn">split</span>()
from_idx = parts.<span class="fn">index</span>(<span class="str">'from'</span>)
ip = parts[from_idx + <span class="num">1</span>]</code></pre></div>
      </div>

      <div class="concept-card" id="card-m2-3" onclick="visitCard('m2', 3, 4)">
        <h3>Extract username</h3>
        <div class="code-block"><pre><code>for_idx = parts.<span class="fn">index</span>(<span class="str">'for'</span>)
user = parts[for_idx + <span class="num">1</span>]
<span class="kw">return</span> {<span class="str">'type'</span>: event_type, <span class="str">'ip'</span>: ip, <span class="str">'user'</span>: user}</code></pre></div>
      </div>

    </div>
    <div id="card-m2-status" style="color:var(--text-dim); font-size:0.8em; margin-top:8px; letter-spacing:1px;">0 / 4 components reviewed</div>
  </div>

  <div class="panel" id="m2-question-panel" style="display:none">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Parser Check &mdash; 4 Questions</div>

    <div class="quiz-question" id="q2-0">
      <p><strong>Q1:</strong> What should <code>parse_log_line()</code> return for a non-auth log line?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">''</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">False</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, true)">None</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">{}</button>
      </div>
    </div>

    <div class="quiz-question" id="q2-1">
      <p><strong>Q2:</strong> After splitting a log line, how do you find the IP after 'from'?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, false)">Use regex only</button>
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, true)">parts[parts.index('from') + 1]</button>
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, false)">parts[-1]</button>
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, false)">line.find('from')</button>
      </div>
    </div>

    <div class="quiz-question" id="q2-2">
      <p><strong>Q3:</strong> A log line contains <code>Invalid user bob</code>. What does <code>parts.index('for')</code> give you?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, false)">Index of 'user'</button>
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, true)">Error — 'for' not in Invalid user lines</button>
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, false)">Index of 'bob'</button>
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, false)">0</button>
      </div>
    </div>

    <div class="quiz-question" id="q2-3">
      <p><strong>Q4:</strong> Why return <code>None</code> instead of raising an exception for non-auth lines?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, false)">None is faster</button>
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, true)">Lets callers filter with 'if result:' pattern</button>
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, false)">Exceptions break loops</button>
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, false)">None is the default</button>
      </div>
    </div>

    <div id="m2-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 03 — COUNTER
// ===================================================
MISSION_RENDERERS[3] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">collections.Counter: Frequency Analysis</div>
    <p><code>Counter</code> is the fastest path from a list of values to a ranked frequency table. One line turns a list of IPs into a sorted count of offenders. Review all four cards then answer the question.</p>
    <p style="color:var(--text-dim); font-size:0.85em; margin-top:8px;">Click each card to mark it reviewed. All four must be reviewed before the question unlocks.</p>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Review All Four Counter Components</div>
    <div class="concept-grid">

      <div class="concept-card" id="card-m3-0" onclick="visitCard('m3', 0, 4)">
        <h3>Counter basics</h3>
        <div class="code-block"><pre><code><span class="kw">from</span> collections <span class="kw">import</span> <span class="tp">Counter</span>
fails = [<span class="str">'192.168.1.1'</span>, <span class="str">'10.0.0.1'</span>, <span class="str">'192.168.1.1'</span>, <span class="str">'192.168.1.1'</span>]
c = <span class="tp">Counter</span>(fails)
<span class="fn">print</span>(c)  <span class="cm"># Counter({'192.168.1.1': 3, '10.0.0.1': 1})</span></code></pre></div>
      </div>

      <div class="concept-card" id="card-m3-1" onclick="visitCard('m3', 1, 4)">
        <h3>most_common()</h3>
        <div class="code-block"><pre><code><span class="cm"># Top 3 offenders</span>
c.<span class="fn">most_common</span>(<span class="num">3</span>)
<span class="cm"># [('192.168.1.1', 3), ('10.0.0.1', 1)]</span></code></pre></div>
      </div>

      <div class="concept-card" id="card-m3-2" onclick="visitCard('m3', 2, 4)">
        <h3>Build from log events</h3>
        <div class="code-block"><pre><code>failed_ips = []
<span class="kw">for</span> line <span class="kw">in</span> log_lines:
    result = <span class="fn">parse_log_line</span>(line)
    <span class="kw">if</span> result <span class="kw">and</span> result[<span class="str">'type'</span>] == <span class="str">'failed'</span>:
        failed_ips.<span class="fn">append</span>(result[<span class="str">'ip'</span>])
ip_counts = <span class="tp">Counter</span>(failed_ips)</code></pre></div>
      </div>

      <div class="concept-card" id="card-m3-3" onclick="visitCard('m3', 3, 4)">
        <h3>Multi-dimensional analysis</h3>
        <div class="code-block"><pre><code><span class="cm"># Track (ip, user) pairs</span>
failed_pairs = [(r[<span class="str">'ip'</span>], r[<span class="str">'user'</span>]) <span class="kw">for</span> r <span class="kw">in</span> results
                <span class="kw">if</span> r <span class="kw">and</span> r[<span class="str">'type'</span>] == <span class="str">'failed'</span>]
pair_counts = <span class="tp">Counter</span>(failed_pairs)</code></pre></div>
      </div>

    </div>
    <div id="card-m3-status" style="color:var(--text-dim); font-size:0.8em; margin-top:8px; letter-spacing:1px;">0 / 4 components reviewed</div>
  </div>

  <div class="panel" id="m3-question-panel" style="display:none">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Counter Check</div>
    <div class="quiz-question" id="q3-0">
      <p><strong>Q1:</strong> You have <code>Counter({'10.0.0.1': 5, '192.168.1.1': 3})</code>. What does <code>.most_common(1)</code> return?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">{'10.0.0.1': 5}</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, true)">[('10.0.0.1', 5)]</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">('10.0.0.1', 5)</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">5</button>
      </div>
    </div>
    <div id="m3-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 04 — BRUTE FORCE SIM
// ===================================================

let bruteSimState = { low: false, scan: false, targeted: false };

function runBruteScenario(key) {
  const terminal = document.getElementById('brute-terminal');
  if (!terminal) return;

  let lines = [];

  if (key === 'low') {
    lines = [
      'Analyzing auth.log...',
      'Total login attempts: 47',
      'Failed attempts: 3',
      'Failure rate: 6.4%',
      'IP Analysis:',
      '  203.0.113.5 \u2014 2 failures (NORMAL)',
      '  10.0.0.3 \u2014 1 failure (NORMAL)',
      'VERDICT: No brute force detected \u2713',
    ];
    bruteSimState.low = true;
  } else if (key === 'scan') {
    lines = [
      'Analyzing auth.log...',
      'Total login attempts: 312',
      'Failed attempts: 287',
      'Failure rate: 92.0%',
      'IP Analysis:',
      '  198.51.100.1 \u2014 145 failures (ALERT: BRUTE FORCE)',
      '  203.0.113.50 \u2014 89 failures (ALERT: BRUTE FORCE)',
      '  10.0.0.99 \u2014 53 failures (ALERT: BRUTE FORCE)',
      'VERDICT: BRUTE FORCE ATTACK DETECTED \u2014 3 IPs flagged',
    ];
    bruteSimState.scan = true;
  } else if (key === 'targeted') {
    lines = [
      'Analyzing auth.log...',
      'Total login attempts: 28',
      'Failed attempts: 19',
      'Failure rate: 67.9%',
      'IP Analysis:',
      "  203.0.113.1 \u2014 19 failures targeting 'admin' (ALERT: BRUTE FORCE)",
      'User Analysis:',
      "  admin \u2014 19 failed attempts (HIGH VALUE TARGET)",
      'VERDICT: TARGETED ACCOUNT ATTACK \u2014 credentials likely compromised',
    ];
    bruteSimState.targeted = true;
  }

  const existing = terminal.textContent ? terminal.textContent + '\n\n' : '';
  terminal.textContent = existing + '> RUN: ' + key.toUpperCase() + '\n' + lines.join('\n');
  terminal.scrollTop = terminal.scrollHeight;

  if (bruteSimState.low && bruteSimState.scan && bruteSimState.targeted) {
    setTimeout(function() {
      terminal.textContent += '\n\n\u2713 ALL SCENARIOS COMPLETE \u2014 BRUTE FORCE SIM PASSED';
      completeMission(4);
    }, 600);
  }
}

function resetBruteSim() {
  bruteSimState = { low: false, scan: false, targeted: false };
  const terminal = document.getElementById('brute-terminal');
  if (terminal) terminal.textContent = '';
}

MISSION_RENDERERS[4] = function() {
  return `
  <div class="panel">
    <div class="panel-accent red"></div>
    <div class="panel-title red">Brute Force Simulator — Attack Detection</div>
    <p>Three attack scenarios. Each has a different signature in the log data. Run all three to understand what normal activity, a credential spray, and a targeted attack look like in Counter output.</p>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Run All Three Scenarios</div>
    <p>Click each button to simulate analyzing a different auth.log profile. Run all three to complete the mission.</p>
    <div class="gate-controls">
      <button class="btn-run" onclick="runBruteScenario('low')">RUN: LOW ACTIVITY</button>
      <button class="btn-run" onclick="runBruteScenario('scan')">RUN: CREDENTIAL SPRAY</button>
      <button class="btn-run" onclick="runBruteScenario('targeted')">RUN: TARGETED ATTACK</button>
      <button class="btn-reset" onclick="resetBruteSim()">RESET</button>
    </div>
    <div class="gate-output" id="brute-terminal"></div>
  </div>
  `;
};


// ===================================================
// MISSION 05 — DETECT SIM
// ===================================================

let detectSimState = { parse: false, analyze: false, report: false };

function runDetectScenario(key) {
  const terminal = document.getElementById('detect-terminal');
  if (!terminal) return;

  let lines = [];

  if (key === 'parse') {
    lines = [
      'Loading auth.log (1,247 lines)...',
      'parse_log_line() processing...',
      '  Line 47: Failed password for root from 198.51.100.1',
      '  Line 48: Failed password for root from 198.51.100.1',
      '  Line 89: Accepted password for alice from 10.0.0.5',
      'Parsed: 312 auth events (287 failed, 25 accepted)',
    ];
    detectSimState.parse = true;
  } else if (key === 'analyze') {
    lines = [
      'Building Counter from failed events...',
      'Top 5 offending IPs:',
      '  1. 198.51.100.1 \u2014 145 failures',
      '  2. 203.0.113.50 \u2014 89 failures',
      '  3. 192.0.2.17 \u2014 53 failures',
      '  4. 10.0.0.99 \u2014 7 failures (below threshold)',
      '  5. 172.16.0.3 \u2014 3 failures (at threshold)',
      'Counter analysis complete',
    ];
    detectSimState.analyze = true;
  } else if (key === 'report') {
    lines = [
      '=== THREAT REPORT ===',
      'Scan window: Jan 15 00:00 \u2014 Jan 15 23:59',
      'Total events: 312 | Failed: 287 | Accepted: 25',
      'Brute force threshold: 3 failures',
      'FLAGGED IPs (3):',
      '  198.51.100.1 \u2014 145 failures \u2014 CRITICAL',
      '  203.0.113.50 \u2014 89 failures \u2014 HIGH',
      '  192.0.2.17 \u2014 53 failures \u2014 HIGH',
      'Recommended action: Block flagged IPs at firewall',
      'Report saved: threat_report_20240115.txt',
    ];
    detectSimState.report = true;
  }

  const existing = terminal.textContent ? terminal.textContent + '\n\n' : '';
  terminal.textContent = existing + '> RUN: ' + key.toUpperCase() + '\n' + lines.join('\n');
  terminal.scrollTop = terminal.scrollHeight;

  if (detectSimState.parse && detectSimState.analyze && detectSimState.report) {
    setTimeout(function() {
      terminal.textContent += '\n\n\u2713 ALL PHASES COMPLETE \u2014 DETECTION SIM PASSED';
      completeMission(5);
    }, 600);
  }
}

function resetDetectSim() {
  detectSimState = { parse: false, analyze: false, report: false };
  const terminal = document.getElementById('detect-terminal');
  if (terminal) terminal.textContent = '';
}

MISSION_RENDERERS[5] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Detection Simulator — Full Log Analyzer Pipeline</div>
    <p>Three phases of a complete log analyzer: parse the raw log, analyze with Counter, generate the threat report. Run all three phases in order to see how the tool flows from raw data to actionable intelligence.</p>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Run All Three Phases</div>
    <div class="gate-controls">
      <button class="btn-run" onclick="runDetectScenario('parse')">RUN: PARSE PHASE</button>
      <button class="btn-run" onclick="runDetectScenario('analyze')">RUN: ANALYZE PHASE</button>
      <button class="btn-run" onclick="runDetectScenario('report')">RUN: GENERATE REPORT</button>
      <button class="btn-reset" onclick="resetDetectSim()">RESET</button>
    </div>
    <div class="gate-output" id="detect-terminal"></div>
  </div>
  `;
};


// ===================================================
// MISSION 06 — FINAL CHECK
// ===================================================

const FINAL_CHECKLIST_W6 = [
  'parse_log_line() function written and tested with sample auth log lines',
  "Function correctly identifies 'Failed password', 'Accepted password', and returns None for non-auth lines",
  'Counter built from list of failed IPs using collections.Counter',
  'most_common() used to identify top offending IPs',
  'Brute force detection: threshold of 3+ failures flags an IP as suspicious',
  'Full log analyzer script runs on auth.log and prints threat report to console',
];

const FINAL_TOTAL = 6;

let finalChecked = new Set();

function toggleFinalCheck(idx) {
  const cb = document.getElementById('final-cb-' + idx);
  if (!cb) return;
  if (finalChecked.has(idx)) {
    finalChecked.delete(idx);
    cb.classList.remove('correct');
    cb.textContent = '[ ]';
  } else {
    finalChecked.add(idx);
    cb.classList.add('correct');
    cb.textContent = '[x]';
  }
  const countEl = document.getElementById('final-count');
  if (countEl) countEl.textContent = finalChecked.size + ' / ' + FINAL_TOTAL + ' confirmed';
  if (finalChecked.size >= FINAL_TOTAL) {
    const statusEl = document.getElementById('m6-status');
    if (statusEl) statusEl.innerHTML = '<span class="status-pass">\u2713 ALL ITEMS CONFIRMED \u2014 WEEK 6 COMPLETE</span>';
    setTimeout(function() { completeMission(6); }, 600);
  }
}

MISSION_RENDERERS[6] = function() {
  const items = FINAL_CHECKLIST_W6.map(function(text, i) {
    return `
    <div style="display:flex; align-items:flex-start; gap:12px; padding:10px 0; border-bottom:1px solid var(--border);">
      <button id="final-cb-${i}" class="quiz-option" style="min-width:36px; text-align:center; flex-shrink:0;" onclick="toggleFinalCheck(${i})">[ ]</button>
      <span style="font-size:0.9em; line-height:1.5;">${text}</span>
    </div>`;
  }).join('');

  return `
  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Mission 06 — Final Check: Week 6 Debrief</div>
    <p>Confirm each item is complete in your Week 6 log analyzer script. Click each checkbox when done. All six must be confirmed to complete the week.</p>
    ${items}
    <div id="final-count" style="color:var(--text-dim); font-size:0.8em; margin-top:12px; letter-spacing:1px;">0 / ${FINAL_TOTAL} confirmed</div>
    <div id="m6-status" class="gate-status" style="margin-top:12px;"></div>
  </div>
  `;
};
