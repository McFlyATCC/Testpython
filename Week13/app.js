// ===== STATE =====
const STORAGE_KEY = 'cvnp2646_w13_progress';

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
  { id: 1, key: 'SEC_PROJECTS', label: '01\nSECURITY', icon: '⬡' },
  { id: 2, key: 'ALT_PROJECTS', label: '02\nALT OPS',  icon: '⬡' },
  { id: 3, key: 'DATA_DESIGN',  label: '03\nDATA',     icon: '⬡' },
  { id: 4, key: 'ARCHITECTURE', label: '04\nARCH',     icon: '⬡' },
  { id: 5, key: 'SCOPE_CHECK',  label: '05\nSCOPE',    icon: '⬡' },
  { id: 6, key: 'PROPOSAL',     label: '06\nPROPOSAL', icon: '⬡' },
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
    showBriefing('OPERATION BLUEPRINT COMPLETE. Capstone is planned. Project selected, data schemas designed, architecture sketched, proposal checklist signed off. Week 14 begins now — build the MVP. Make it work before you make it perfect.', null);
    renderMissionMap();
    updateProgress();
  }
}

// ===== COMMANDER ZHANG BRIEFINGS =====
const BRIEFINGS = [
  'Welcome to capstone planning operations. 135 points. Four weeks. One portfolio piece. This week you plan — no coding. Scoping your project correctly is the most important decision you will make this semester.',
  'Orientation confirmed. Now explore four security project options. Each has complete specifications: class design, CLI interface, and JSON schemas. Study all four before choosing.',
  'Security projects reviewed. Now explore five alternative project tracks — IT operations, finance, and sports analytics. Same Python skills, different domains. All four must be reviewed here as well.',
  'All nine project options explored. Now study data design principles. Your JSON input and output schemas drive everything else. Design data before writing a single line of code.',
  'Data design principles confirmed. Now study architecture — class design and CLI interface patterns. A meaningful class bundles data with behavior. A good CLI makes your tool usable by others.',
  'Architecture principles confirmed. Now run the scope checker. Three scenarios show the difference between too simple, too complex, and well-scoped. Identify the pattern before writing your proposal.',
  'Scope analysis complete. Final mission: sign off on each section of your proposal. All seven items must be confirmed before you are cleared to begin Week 14 implementation.',
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
  const totalMap = { 0: 3, 1: 1, 2: 1, 3: 1, 4: 4, 5: 0, 6: 0 };
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
  if (statusEl) statusEl.textContent = count + ' / ' + total + ' projects reviewed';
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
  document.title = 'MISSION ' + String(id).padStart(2,'0') + ' \u2014 ' + (MISSIONS[id] ? MISSIONS[id].key : '') + ' | OPERATION: BLUEPRINT';
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
    <div class="panel-title">Capstone Project — Four-Week Structure</div>
    <p>The capstone spans Weeks 13-16 and is worth <strong>135 points</strong>. It is your portfolio piece — a real, demonstrable security or IT tool built entirely by you. Every week has a specific milestone that builds toward the final demo and submission.</p>
    <div class="concept-grid">
      <div class="concept-card">
        <h3>Week 13 — Plan (20 pts)</h3>
        <p>Design before coding. Write a project proposal, define JSON schemas, sketch your class architecture, and create a timeline for Weeks 14-16. <strong>No code this week.</strong></p>
      </div>
      <div class="concept-card">
        <h3>Week 14 — Build MVP (25 pts)</h3>
        <p>Minimum Viable Product: the core functionality running end-to-end. Not polished, not perfect — just working. Get JSON in, get JSON out, demonstrate the key behavior.</p>
      </div>
      <div class="concept-card">
        <h3>Week 15 — Test &amp; Document (25 pts)</h3>
        <p>Write unit tests (normal, edge, and invalid cases), add logging, complete the README, and pass the clean checkout test — clone to a new directory and confirm it runs from scratch.</p>
      </div>
      <div class="concept-card">
        <h3>Week 16 — Demo &amp; Portfolio (65 pts)</h3>
        <p>Polished GitHub repository, 3-5 minute demo video, <code>AI_USAGE.md</code> tracking all AI assistance, and four-question reflection. This is what you show in interviews.</p>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Technical Requirements</div>
    <p>Every capstone project must demonstrate all six skills from the semester. These are checked requirements, not suggestions.</p>
    <div class="concept-grid">
      <div class="concept-card">
        <h3>JSON I/O</h3>
        <p>At least one JSON input file and at least one JSON output file. Design realistic schemas with proper field names. Input drives processing; output is the deliverable.</p>
      </div>
      <div class="concept-card">
        <h3>CLI Interface</h3>
        <p>Command-line arguments using <code>argparse</code>. Include <code>--input</code>, <code>--output</code>, and at least two filtering/configuration flags. Auto-generated <code>--help</code> text required.</p>
      </div>
      <div class="concept-card">
        <h3>At Least One Class</h3>
        <p>Not a dict wrapper — a class with meaningful methods. Example: <code>ThreatEvent</code> with <code>calculate_risk()</code>, <code>is_critical()</code>, and <code>to_dict()</code>. Data plus behavior.</p>
      </div>
      <div class="concept-card">
        <h3>Unit Tests</h3>
        <p>pytest tests covering normal cases, edge cases (empty data, boundary values), and invalid input. Write tests during Week 14 as you build each function — do not wait for Week 15.</p>
      </div>
      <div class="concept-card">
        <h3>Logging</h3>
        <p>Python's <code>logging</code> module, not <code>print()</code>. Use DEBUG for detailed traces, INFO for progress, WARNING for suspicious data, ERROR for failures. FileHandler to capture output.</p>
      </div>
      <div class="concept-card">
        <h3>AI_USAGE.md</h3>
        <p>Track all AI assistance from Day 1. Document prompts used, code accepted and rejected, and how you verified AI output. Failure to document AI use is an academic integrity violation.</p>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Orientation Check &mdash; 3 Questions</div>
    <p>Answer all three correctly to unlock Mission 01.</p>

    <div class="quiz-question" id="q0-0">
      <p><strong>Q1:</strong> How many total points is the capstone project worth across all four weeks?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">100 points</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, true)">135 points</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">150 points</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">200 points</button>
      </div>
    </div>

    <div class="quiz-question" id="q0-1">
      <p><strong>Q2:</strong> What is the primary deliverable for Week 13?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">A working Python script</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, true)">A project proposal with data design — no production code</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">A complete demo video</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">A full test suite with pytest</button>
      </div>
    </div>

    <div class="quiz-question" id="q0-2">
      <p><strong>Q3:</strong> What does MVP stand for in the Week 14 milestone?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">Most Valuable Product</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">Maximum Version Program</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, true)">Minimum Viable Product</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">Managed Verification Protocol</button>
      </div>
    </div>

    <div id="m0-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 01 — SEC_PROJECTS
// ===================================================
MISSION_RENDERERS[1] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Security Project Options</div>
    <p>Four security-focused project options, each with complete specifications. Every project meets all technical requirements and is scoped for three weeks of solo development. Click each card to review the full spec. All four must be reviewed before the comprehension check unlocks.</p>
    <div class="hint-box">
      <strong>Choosing tip:</strong> Pick the project that uses the week (W9-W12) whose skills you feel most confident with. The best capstone is one you can explain completely in an interview — not the most impressive on paper.
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Review All Four Security Projects</div>
    <p style="color:var(--text-dim); font-size:0.85em;">Click each card to read the full specification. All four must be reviewed before the question unlocks.</p>
    <div class="concept-grid">

      <div class="concept-card" id="card-m1-0" onclick="visitCard('m1', 0, 4)">
        <h3>Security Event Analyzer</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">SOC OPERATIONS</p>
        <p>Reads JSON log files from multiple security sources (firewall, auth, IDS), normalizes events into a common schema, applies multi-factor risk scoring, and outputs a prioritized alert JSON with a threat summary report.</p>
        <p style="margin-top:10px; font-size:0.85em;"><strong>Skills:</strong> W9 risk scoring &amp; datetime, W10 dict lookups (IP-to-user mapping), W12 pure functions &amp; extract function</p>
        <div class="code-block" style="margin-top:10px;">
          <span class="code-lang-tag">class</span>
          <pre><code>SecurityEvent(source_ip, event_type,
              timestamp, severity)
  .calculate_risk() -> int
  .is_critical()    -> bool
  .to_dict()        -> dict</code></pre>
        </div>
        <div class="code-block" style="margin-top:8px;">
          <span class="code-lang-tag">cli</span>
          <pre><code>python analyzer.py \
  --input logs.json \
  --output report.json \
  --min-severity HIGH \
  --start-date 2024-01-01</code></pre>
        </div>
        <div class="code-block" style="margin-top:8px;">
          <span class="code-lang-tag">json i/o</span>
          <pre><code>IN:  [{source_ip, event_type,
       timestamp, severity}]
OUT: {total_events, critical_count,
     top_threats: [...], summary: {}}</code></pre>
        </div>
      </div>

      <div class="concept-card" id="card-m1-1" onclick="visitCard('m1', 1, 4)">
        <h3>Infrastructure Compliance Reporter</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">CONFIGURATION MANAGEMENT</p>
        <p>Reads baseline and current system configs as nested JSON, recursively traverses to any nesting depth, classifies each finding as MODIFIED / MISSING / EXTRA, and outputs a drift report sorted by criticality. Extends W11 skills into a full CLI tool.</p>
        <p style="margin-top:10px; font-size:0.85em;"><strong>Skills:</strong> W11 recursion &amp; nested JSON traversal, W12 named constants for critical path keywords</p>
        <div class="code-block" style="margin-top:10px;">
          <span class="code-lang-tag">class</span>
          <pre><code>DriftFinding(path, drift_type,
             baseline_val, current_val)
  .is_critical()    -> bool
  .severity_label() -> str
  .to_dict()        -> dict</code></pre>
        </div>
        <div class="code-block" style="margin-top:8px;">
          <span class="code-lang-tag">cli</span>
          <pre><code>python reporter.py \
  --baseline baseline.json \
  --current current.json \
  --output findings.json \
  --critical-only</code></pre>
        </div>
        <div class="code-block" style="margin-top:8px;">
          <span class="code-lang-tag">json i/o</span>
          <pre><code>IN:  two nested config JSONs
     (baseline + current)
OUT: {total_drifts, critical_count,
     findings: [{path, type,
     baseline, current, critical}]}</code></pre>
        </div>
      </div>

      <div class="concept-card" id="card-m1-2" onclick="visitCard('m1', 2, 4)">
        <h3>Patch Priority Orchestrator</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">VULNERABILITY MANAGEMENT</p>
        <p>Reads host inventory and vulnerability data as separate JSON files, joins them by host ID using dict lookups, applies a priority formula (severity &times; age &times; exposure factor), and outputs a patch queue sorted by urgency with an overdue report.</p>
        <p style="margin-top:10px; font-size:0.85em;"><strong>Skills:</strong> W9 datetime &amp; scoring formula, W10 dict joins &amp; defaultdict (host &rarr; vulnerabilities), W12 extract function</p>
        <div class="code-block" style="margin-top:10px;">
          <span class="code-lang-tag">class</span>
          <pre><code>PatchJob(host_id, cve_id, severity,
         discovered_date, is_external)
  .calculate_priority() -> int
  .is_overdue(days)     -> bool
  .to_dict()            -> dict</code></pre>
        </div>
        <div class="code-block" style="margin-top:8px;">
          <span class="code-lang-tag">cli</span>
          <pre><code>python orchestrator.py \
  --hosts hosts.json \
  --vulns vulns.json \
  --output queue.json \
  --days-overdue 30</code></pre>
        </div>
        <div class="code-block" style="margin-top:8px;">
          <span class="code-lang-tag">json i/o</span>
          <pre><code>IN:  hosts.json + vulns.json
OUT: {overdue_count,
     queue: [{host_id, cve_id,
     priority_score, is_overdue}]}</code></pre>
        </div>
      </div>

      <div class="concept-card" id="card-m1-3" onclick="visitCard('m1', 3, 4)">
        <h3>IAM Access Auditor</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">IDENTITY &amp; ACCESS MANAGEMENT</p>
        <p>Reads current user list, approved role assignments, and access policies as JSON. Uses set operations to detect orphaned accounts, unauthorized role assignments, and missing required access. Outputs a structured compliance audit report.</p>
        <p style="margin-top:10px; font-size:0.85em;"><strong>Skills:</strong> W10 set operations for drift, defaultdict for role grouping, W12 pure functions &amp; named constants</p>
        <div class="code-block" style="margin-top:10px;">
          <span class="code-lang-tag">class</span>
          <pre><code>AccessViolation(user_id,
                violation_type, details)
  .is_critical() -> bool
  .to_dict()     -> dict</code></pre>
        </div>
        <div class="code-block" style="margin-top:8px;">
          <span class="code-lang-tag">cli</span>
          <pre><code>python auditor.py \
  --users users.json \
  --policy policy.json \
  --output audit.json \
  --include-warnings</code></pre>
        </div>
        <div class="code-block" style="margin-top:8px;">
          <span class="code-lang-tag">json i/o</span>
          <pre><code>IN:  users.json + policy.json
OUT: {total_violations,
     orphaned_accounts: [...],
     over_privileged: [...],
     violations: [...]}</code></pre>
        </div>
      </div>

    </div>
    <div id="card-m1-status" style="color:var(--text-dim); font-size:0.8em; margin-top:8px; letter-spacing:1px;">0 / 4 projects reviewed</div>
  </div>

  <div class="panel" id="m1-question-panel" style="display:none">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Comprehension Check</div>
    <div class="quiz-question" id="q1-0">
      <p><strong>Q1:</strong> Which of the following is the best-scoped capstone project?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">A password strength checker that validates one password string</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">A full SIEM platform with ML anomaly detection and a real-time web dashboard</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, true)">A security log aggregator that reads JSON logs, scores events, and outputs a prioritized alert report with CLI filtering</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">A tool that monitors 1000 production servers simultaneously in real time</button>
      </div>
    </div>
    <div id="m1-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 02 — ALT_PROJECTS
// ===================================================
MISSION_RENDERERS[2] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Alternative Project Options</div>
    <p>Five non-security project tracks covering IT operations, finance, and analytics. Every project uses the same Python skills — JSON I/O, classes, CLI, and course techniques from W9-W12. The domain is different; the technical requirements are identical. Click each card to review the spec. All five must be reviewed.</p>
    <div class="hint-box">
      <strong>Who these are for:</strong> Students interested in IT service management, data analysis, or personal projects. Any of these is just as valid a portfolio piece as the security options — employers care about the skills demonstrated, not the domain.
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Review All Five Alternative Projects</div>
    <p style="color:var(--text-dim); font-size:0.85em;">Click each card to read the full specification. All five must be reviewed before the question unlocks.</p>
    <div class="concept-grid">

      <div class="concept-card" id="card-m2-0" onclick="visitCard('m2', 0, 5)">
        <h3>IT Help Desk Ticket Prioritizer</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">IT SERVICE MANAGEMENT</p>
        <p>Reads support ticket JSON data, scores each ticket by urgency and impact using named threshold constants, uses datetime to identify SLA-at-risk tickets, and outputs a prioritized work queue JSON with an aging report by category.</p>
        <p style="margin-top:10px; font-size:0.85em;"><strong>Skills:</strong> W9 datetime for SLA calculations, W10 dict grouping by category, W12 pure functions &amp; named constants (SLA_HOURS thresholds)</p>
        <div class="code-block" style="margin-top:10px;">
          <span class="code-lang-tag">class</span>
          <pre><code>Ticket(ticket_id, category,
       created_at, priority, description)
  .calculate_urgency_score() -> int
  .is_sla_at_risk()          -> bool
  .to_dict()                 -> dict</code></pre>
        </div>
        <div class="code-block" style="margin-top:8px;">
          <span class="code-lang-tag">cli</span>
          <pre><code>python tickets.py \
  --tickets tickets.json \
  --output queue.json \
  --department IT \
  --sla-hours 8</code></pre>
        </div>
        <div class="code-block" style="margin-top:8px;">
          <span class="code-lang-tag">json i/o</span>
          <pre><code>IN:  [{ticket_id, category,
       submitter, created_at,
       description, priority}]
OUT: {sla_at_risk_count,
     queue: [{ticket_id,
     urgency_score, hours_remaining}],
     by_category: {...}}</code></pre>
        </div>
      </div>

      <div class="concept-card" id="card-m2-1" onclick="visitCard('m2', 1, 5)">
        <h3>Server Resource Monitor</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">IT OPERATIONS / SRE</p>
        <p>Reads server metrics JSON snapshots (CPU%, memory%, disk%, uptime), compares each metric against named threshold constants, identifies servers needing immediate attention, and outputs a health status report with detailed alerts. Capacity planning — not security monitoring.</p>
        <p style="margin-top:10px; font-size:0.85em;"><strong>Skills:</strong> W12 named constants (CPU_THRESHOLD = 85), W9 threshold scoring, W10 defaultdict for grouping by health status</p>
        <div class="code-block" style="margin-top:10px;">
          <span class="code-lang-tag">class</span>
          <pre><code>ServerSnapshot(hostname, cpu_pct,
               memory_pct, disk_pct,
               timestamp)
  .get_status()  -> str
  .get_alerts()  -> list
  .to_dict()     -> dict</code></pre>
        </div>
        <div class="code-block" style="margin-top:8px;">
          <span class="code-lang-tag">cli</span>
          <pre><code>python monitor.py \
  --metrics metrics.json \
  --output report.json \
  --cpu-threshold 85 \
  --disk-threshold 90</code></pre>
        </div>
        <div class="code-block" style="margin-top:8px;">
          <span class="code-lang-tag">json i/o</span>
          <pre><code>IN:  [{hostname, cpu_pct,
       memory_pct, disk_pct,
       timestamp}]
OUT: {healthy: [...],
     warning: [...],
     critical: [...],
     alerts: [{hostname,
     metric, value, threshold}]}</code></pre>
        </div>
      </div>

      <div class="concept-card" id="card-m2-2" onclick="visitCard('m2', 2, 5)">
        <h3>Software License Auditor</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">IT ASSET MANAGEMENT</p>
        <p>Reads installed software JSON and license entitlement JSON, uses dict joins and set operations to match installations to licenses, detects over-deployment (more installs than purchased seats), unlicensed software, and licenses expiring within a named constant threshold window.</p>
        <p style="margin-top:10px; font-size:0.85em;"><strong>Skills:</strong> W10 dict joins &amp; set operations, W12 named constants (EXPIRY_WARNING_DAYS = 30), W9 datetime for expiry calculations</p>
        <div class="code-block" style="margin-top:10px;">
          <span class="code-lang-tag">class</span>
          <pre><code>LicenseViolation(software_name,
                 violation_type,
                 install_count, seat_count)
  .severity()    -> str
  .is_critical() -> bool
  .to_dict()     -> dict</code></pre>
        </div>
        <div class="code-block" style="margin-top:8px;">
          <span class="code-lang-tag">cli</span>
          <pre><code>python license_audit.py \
  --installed apps.json \
  --licenses licenses.json \
  --output violations.json</code></pre>
        </div>
        <div class="code-block" style="margin-top:8px;">
          <span class="code-lang-tag">json i/o</span>
          <pre><code>IN:  apps.json
     [{hostname, software, version}]
     licenses.json
     [{software, seats, expiry_date}]
OUT: {violations: [...],
     expiring_soon: [...],
     unlicensed: [...],
     over_deployed: [...]}</code></pre>
        </div>
      </div>

      <div class="concept-card" id="card-m2-3" onclick="visitCard('m2', 3, 5)">
        <h3>Personal Finance Tracker</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">PERSONAL FINANCE</p>
        <p>Reads transaction JSON data and a budget JSON file, uses defaultdict to group spending by category, uses datetime to filter by month, compares category totals against budget limits, flags overspend, and outputs a monthly summary report with personalized alerts.</p>
        <p style="margin-top:10px; font-size:0.85em;"><strong>Skills:</strong> W10 defaultdict for category grouping, W9 datetime for month filtering, W12 pure functions &amp; extract function</p>
        <div class="code-block" style="margin-top:10px;">
          <span class="code-lang-tag">class</span>
          <pre><code>Transaction(date, amount,
            category, description)
  .month()               -> str
  .is_valid()            -> bool
  .to_dict()             -> dict</code></pre>
        </div>
        <div class="code-block" style="margin-top:8px;">
          <span class="code-lang-tag">cli</span>
          <pre><code>python finance.py \
  --transactions data.json \
  --budget budget.json \
  --output summary.json \
  --month 2024-01</code></pre>
        </div>
        <div class="code-block" style="margin-top:8px;">
          <span class="code-lang-tag">json i/o</span>
          <pre><code>IN:  transactions.json
     [{date, amount, category,
       description}]
     budget.json
     [{category, monthly_limit}]
OUT: {month, total_spent,
     by_category: {food: 450, ...},
     overspend_alerts: [...]}</code></pre>
        </div>
      </div>

      <div class="concept-card" id="card-m2-4" onclick="visitCard('m2', 4, 5)">
        <h3>Sports Statistics Aggregator</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">SPORTS ANALYTICS</p>
        <p>Reads game results JSON (teams, scores, player stats per game), uses defaultdict to accumulate team wins/losses and player stat totals across a season, computes standings and per-game averages, and outputs a leaderboard JSON with individual team and player reports.</p>
        <p style="margin-top:10px; font-size:0.85em;"><strong>Skills:</strong> W10 defaultdict for stat accumulation, W12 extract function (separate parsing from aggregating), W12 pure functions for averages</p>
        <div class="code-block" style="margin-top:10px;">
          <span class="code-lang-tag">class</span>
          <pre><code>GameResult(date, home_team,
           away_team, home_score,
           away_score, player_stats)
  .winner()           -> str
  .margin()           -> int
  .to_dict()          -> dict</code></pre>
        </div>
        <div class="code-block" style="margin-top:8px;">
          <span class="code-lang-tag">cli</span>
          <pre><code>python stats.py \
  --games games.json \
  --output standings.json \
  --team "Lakers" \
  --season 2024</code></pre>
        </div>
        <div class="code-block" style="margin-top:8px;">
          <span class="code-lang-tag">json i/o</span>
          <pre><code>IN:  [{date, home_team, away_team,
       home_score, away_score,
       players: [{name, points,
       assists, rebounds}]}]
OUT: {standings: [{team, wins,
     losses}], top_scorers: [...],
     team_report: {...}}</code></pre>
        </div>
      </div>

    </div>
    <div id="card-m2-status" style="color:var(--text-dim); font-size:0.8em; margin-top:8px; letter-spacing:1px;">0 / 5 projects reviewed</div>
  </div>

  <div class="panel" id="m2-question-panel" style="display:none">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Comprehension Check</div>
    <div class="quiz-question" id="q2-0">
      <p><strong>Q1:</strong> Which file must document all AI tool usage throughout your capstone project?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">README.md</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">requirements.txt</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">CHANGELOG.md</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, true)">AI_USAGE.md</button>
      </div>
    </div>
    <div id="m2-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 03 — DATA_DESIGN
// ===================================================
MISSION_RENDERERS[3] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Design Data First</div>
    <p>The single most important planning decision is your JSON schema. Design your input and output structures before writing any code. The schema defines what your tool consumes, what it produces, and implicitly — what your classes need to do.</p>
    <div class="hint-box">
      <strong>Rule:</strong> If you cannot describe your tool as "reads X, produces Y," your scope is not well-defined. The proposal is not approved until X and Y are concrete JSON examples, not abstract descriptions.
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Input JSON — Design Principles</div>
    <p>Input JSON represents the real-world data your tool processes. Design it to be realistic — data that could actually come from a log source, a configuration system, or an export file. Use snake_case field names, ISO 8601 timestamps, and consistent types.</p>
    <div class="code-block">
      <span class="code-lang-tag">json</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code>[
  {
    "event_id":    "EVT-001",
    "source_ip":   "203.0.113.42",
    "event_type":  "auth_failure",
    "timestamp":   "2024-01-15T10:30:00Z",
    "severity":    "HIGH",
    "username":    "admin",
    "destination": "web-server-01"
  },
  {
    "event_id":    "EVT-002",
    "source_ip":   "10.0.0.5",
    "event_type":  "port_scan",
    "timestamp":   "2024-01-15T10:31:15Z",
    "severity":    "MEDIUM",
    "username":    null,
    "destination": "internal-range"
  }
]</code></pre>
    </div>
    <div class="concept-grid">
      <div class="concept-card">
        <h3>snake_case Fields</h3>
        <p>Use <code>source_ip</code> not <code>sourceIp</code> or <code>SourceIP</code>. Consistent naming makes your Python code cleaner — <code>event["source_ip"]</code> reads like a sentence.</p>
      </div>
      <div class="concept-card">
        <h3>ISO 8601 Timestamps</h3>
        <p><code>"2024-01-15T10:30:00Z"</code> — not <code>"Jan 15 2024"</code>. Python's <code>datetime.fromisoformat()</code> parses this directly. Design for the code you will write.</p>
      </div>
      <div class="concept-card">
        <h3>Required vs Optional Fields</h3>
        <p>Know which fields are always present and which can be <code>null</code>. Your parsing code must handle both. Validate early — fail with a clear error if a required field is missing.</p>
      </div>
      <div class="concept-card">
        <h3>Realistic Test Data</h3>
        <p>Create a <code>data/sample_input.json</code> with 5-10 realistic records before writing code. This drives your class design and becomes your first test fixture.</p>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Output JSON — Design Principles</div>
    <p>Output JSON is what your tool delivers — the report, the prioritized queue, the audit findings. Design it to be immediately useful to whoever reads it. A security analyst should be able to act on your output without opening the source code.</p>
    <div class="code-block">
      <span class="code-lang-tag">json</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code>{
  "report_generated": "2024-01-15T15:00:00Z",
  "total_events":     1523,
  "critical_count":   12,
  "summary": {
    "auth_failures":  200,
    "port_scans":     123,
    "malware_alerts": 8
  },
  "top_threats": [
    {
      "source_ip":   "203.0.113.42",
      "event_type":  "port_scan",
      "event_count": 78,
      "risk_score":  85,
      "first_seen":  "2024-01-15T08:15:00Z",
      "last_seen":   "2024-01-15T14:45:00Z",
      "is_critical": true
    }
  ],
  "recommendations": [
    "Block 203.0.113.42 — persistent port scanning detected"
  ]
}</code></pre>
    </div>
    <div class="concept-grid">
      <div class="concept-card">
        <h3>Include Metadata</h3>
        <p><code>report_generated</code> timestamp, total counts, and summary stats at the top. Analysts scan the summary before reading details. Put the most important numbers first.</p>
      </div>
      <div class="concept-card">
        <h3>to_dict() Drives Output</h3>
        <p>Every class in your project should have a <code>to_dict()</code> method. Your output JSON is built by calling <code>to_dict()</code> on each object and writing the list with <code>json.dump()</code>.</p>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Comprehension Check</div>
    <div class="quiz-question" id="q3-0">
      <p><strong>Q1:</strong> What is the recommended first step when designing a capstone project?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">Install all required Python packages and set up the virtual environment</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">Create the GitHub repository and write the initial README</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, true)">Design your JSON input and output schemas with realistic example data</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">Write the main() function stub and argparse configuration</button>
      </div>
    </div>
    <div id="m3-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 04 — ARCHITECTURE
// ===================================================
MISSION_RENDERERS[4] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Class Design</div>
    <p>Classes bundle data with behavior. A class that is just a dictionary wrapper fails the requirement. A class with methods that compute, classify, and export passes. The minimum requirement is one meaningful class — but most capstone projects naturally need two: one for individual records and one for the collection or processor.</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code># WRONG — just a dict wrapper (fails requirement)
class ThreatEvent:
    def __init__(self, data):
        self.data = data  # no behavior added

# RIGHT — data plus meaningful behavior
class ThreatEvent:
    def __init__(self, source_ip, event_type, timestamp, severity):
        self.source_ip  = source_ip
        self.event_type = event_type
        self.timestamp  = timestamp
        self.severity   = severity
        self.risk_score = self._calculate_risk()

    def _calculate_risk(self):
        """Pure: score based on event type and severity."""
        base = {"port_scan": 70, "auth_failure": 50,
                "malware": 95}.get(self.event_type, 20)
        multiplier = {"CRITICAL": 1.5, "HIGH": 1.2,
                      "MEDIUM": 1.0}.get(self.severity, 0.8)
        return min(100, int(base * multiplier))

    def is_critical(self):
        """Pure: threshold check, no side effects."""
        return self.risk_score >= CRITICAL_THRESHOLD

    def to_dict(self):
        """Pure: serialize for JSON output."""
        return {
            "source_ip":  self.source_ip,
            "event_type": self.event_type,
            "risk_score": self.risk_score,
            "is_critical": self.is_critical()
        }</code></pre>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">CLI Design with argparse</div>
    <p>Every capstone tool needs a CLI interface built with <code>argparse</code>. Design your CLI before writing processing code — it defines how analysts interact with the tool. Include <code>--input</code>, <code>--output</code>, and at least two filtering or configuration flags.</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code>import argparse

def build_parser():
    parser = argparse.ArgumentParser(
        prog="analyzer",
        description="Security event analyzer — reads JSON logs, outputs prioritized alerts"
    )
    parser.add_argument("--input",        required=True,
                        help="Path to input JSON log file")
    parser.add_argument("--output",       required=True,
                        help="Path to write output report JSON")
    parser.add_argument("--min-severity", default="MEDIUM",
                        choices=["LOW", "MEDIUM", "HIGH", "CRITICAL"],
                        help="Minimum severity level to include (default: MEDIUM)")
    parser.add_argument("--start-date",   default=None,
                        help="Filter events on or after this date (YYYY-MM-DD)")
    parser.add_argument("--verbose",      action="store_true",
                        help="Enable detailed DEBUG logging")
    return parser

def main():
    args = build_parser().parse_args()
    # args.input, args.output, args.min_severity, etc.
    ...</code></pre>
    </div>
    <div class="hint-box">
      <strong>Test with --help first:</strong> <code>python analyzer.py --help</code> should print clean, descriptive usage text before you write a single line of processing logic. If the help text is confusing, your CLI design needs work.
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Architecture Check &mdash; 4 Questions</div>
    <p>Answer all four correctly to unlock Mission 05.</p>

    <div class="quiz-question" id="q4-0">
      <p><strong>Q1:</strong> What makes a class "meaningful" rather than just a dictionary wrapper?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(4, 0, this, false)">It is defined in its own separate file</button>
        <button class="quiz-option" onclick="answerQuiz(4, 0, this, false)">It stores more data fields than a dictionary</button>
        <button class="quiz-option" onclick="answerQuiz(4, 0, this, true)">It has methods that add behavior — like calculate_risk(), is_critical(), and to_dict()</button>
        <button class="quiz-option" onclick="answerQuiz(4, 0, this, false)">It uses inheritance from a base class</button>
      </div>
    </div>

    <div class="quiz-question" id="q4-1">
      <p><strong>Q2:</strong> Which Python library is required for the capstone CLI interface?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(4, 1, this, false)">Parse sys.argv manually with array indexing</button>
        <button class="quiz-option" onclick="answerQuiz(4, 1, this, false)">The click third-party library</button>
        <button class="quiz-option" onclick="answerQuiz(4, 1, this, true)">argparse from the Python standard library</button>
        <button class="quiz-option" onclick="answerQuiz(4, 1, this, false)">optparse (deprecated in Python 3)</button>
      </div>
    </div>

    <div class="quiz-question" id="q4-2">
      <p><strong>Q3:</strong> What is the correct target for the Week 14 MVP milestone?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(4, 2, this, false)">Perfectly polished code with full docstrings and 100% test coverage</button>
        <button class="quiz-option" onclick="answerQuiz(4, 2, this, true)">A working end-to-end demo: JSON in, JSON out, core behavior demonstrated</button>
        <button class="quiz-option" onclick="answerQuiz(4, 2, this, false)">A complete GUI interface with interactive visualization</button>
        <button class="quiz-option" onclick="answerQuiz(4, 2, this, false)">The README and documentation — code comes in Week 15</button>
      </div>
    </div>

    <div class="quiz-question" id="q4-3">
      <p><strong>Q4:</strong> When is the best time to start writing unit tests during the capstone?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(4, 3, this, false)">Only in Week 15 — that is the dedicated testing week</button>
        <button class="quiz-option" onclick="answerQuiz(4, 3, this, false)">Only after all features are complete and working</button>
        <button class="quiz-option" onclick="answerQuiz(4, 3, this, true)">During Week 14 as you write each function — test alongside implementation</button>
        <button class="quiz-option" onclick="answerQuiz(4, 3, this, false)">Week 16, just before the final submission deadline</button>
      </div>
    </div>

    <div id="m4-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 05 — SCOPE_CHECK
// ===================================================
const scopeSimState = { seenA: false, seenB: false, seenC: false };

function scopeLog(text, cls) {
  const term = document.getElementById('scope-terminal');
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

function scopeClear() {
  const term = document.getElementById('scope-terminal');
  if (term) term.innerHTML = '';
}

function runScopeScenario(key) {
  scopeClear();

  if (key === 'A') {
    scopeLog('>> Scope Analysis: Password Strength Checker', 'info');
    scopeLog('   "Validates if a password meets complexity requirements."', '');
    scopeLog('', '');
    scopeLog('   [ANALYZE] Evaluating technical scope...', '');
    scopeLog('', '');
    scopeLog('   [FINDING] JSON I/O:            NO  -- takes a string, no files', 'error');
    scopeLog('   [FINDING] Meaningful class:    NO  -- could be a single function', 'error');
    scopeLog('   [FINDING] Real-world data:     NO  -- no actual data processing', 'error');
    scopeLog('   [FINDING] Course skills shown: 2 of 6 required', 'error');
    scopeLog('   [FINDING] Demo value:          LOW -- "I made a password checker"', 'warn');
    scopeLog('   [FINDING] Realistic timeline:  20 minutes, not 3 weeks', 'error');
    scopeLog('', '');
    scopeLog('   [VERDICT] TOO SIMPLE', 'error');
    scopeLog('', '');
    scopeLog('   [SUGGEST] Expand to: Security Policy Enforcer', 'success');
    scopeLog('     - Reads users.json and policy.json', 'success');
    scopeLog('     - Validates all users against all policy rules', 'success');
    scopeLog('     - Outputs compliance_report.json with violations', 'success');
    scopeLog('     - Class: PolicyViolation with is_critical(), to_dict()', 'success');
    scopeLog('     - Now demonstrates JSON I/O, classes, scoring, CLI', 'success');

  } else if (key === 'B') {
    scopeLog('>> Scope Analysis: Real-Time SIEM Platform', 'info');
    scopeLog('   "Ingests live streams from 50+ sources via APIs, ML anomaly', '');
    scopeLog('    detection, web dashboard with real-time alerts, Slack/PagerDuty', '');
    scopeLog('    integration, multi-tenant environments."', '');
    scopeLog('', '');
    scopeLog('   [ANALYZE] Evaluating technical scope...', '');
    scopeLog('', '');
    scopeLog('   [FINDING] Live data ingestion:   requires networking expertise (+2 weeks)', 'error');
    scopeLog('   [FINDING] ML anomaly detection:  outside course scope (+4 weeks)', 'error');
    scopeLog('   [FINDING] Web dashboard:         HTML/CSS/JS/Flask -- not covered (+4 weeks)', 'error');
    scopeLog('   [FINDING] API integrations:      each requires separate study (+1 week each)', 'error');
    scopeLog('   [FINDING] Multi-tenant design:   advanced architecture (+3 weeks)', 'error');
    scopeLog('', '');
    scopeLog('   [ESTIMATE] Realistic build time: 6-12 months, team of 3-4', 'error');
    scopeLog('   [ESTIMATE] Solo 3-week estimate: 5-10% of this scope complete', 'error');
    scopeLog('', '');
    scopeLog('   [VERDICT] TOO COMPLEX', 'error');
    scopeLog('', '');
    scopeLog('   [SUGGEST] Simplify to: Security Event Analyzer', 'success');
    scopeLog('     - Reads JSON log files (not live streams)', 'success');
    scopeLog('     - Scores events by formula (not ML)', 'success');
    scopeLog('     - Outputs JSON report (not web dashboard)', 'success');
    scopeLog('     - CLI interface (not multi-tenant API)', 'success');
    scopeLog('     - Realistic timeline: 3 weeks, 1 developer', 'success');

  } else if (key === 'C') {
    scopeLog('>> Scope Analysis: Patch Priority Orchestrator', 'info');
    scopeLog('   "Reads host inventory JSON and vulnerability JSON, joins by host ID,', '');
    scopeLog('    scores patches by severity x age x exposure, outputs prioritized', '');
    scopeLog('    patch queue JSON and overdue report."', '');
    scopeLog('', '');
    scopeLog('   [ANALYZE] Evaluating technical scope...', '');
    scopeLog('', '');
    scopeLog('   [FINDING] JSON I/O:            YES -- two inputs, two outputs', 'success');
    scopeLog('   [FINDING] Meaningful class:    YES -- PatchJob with calculate_priority()', 'success');
    scopeLog('   [FINDING] Real-world data:     YES -- CVEs and host inventories', 'success');
    scopeLog('   [FINDING] Course skills shown: W9 scoring, W10 joins, W12 extract', 'success');
    scopeLog('   [FINDING] CLI design:          YES -- --hosts --vulns --output flags', 'success');
    scopeLog('   [FINDING] Demo value:          HIGH -- "I built a patch prioritization tool"', 'success');
    scopeLog('', '');
    scopeLog('   [TIMELINE] Week 14: core scoring logic + dict join + basic output', 'info');
    scopeLog('   [TIMELINE] Week 15: tests + CLI + logging + clean checkout', 'info');
    scopeLog('   [TIMELINE] Week 16: polish + demo video + README + AI_USAGE.md', 'info');
    scopeLog('', '');
    scopeLog('   [VERDICT] WELL SCOPED', 'success');
    scopeLog('   [STATUS] APPROVED -- proceed to proposal', 'success');
  }

  scopeSimState['seen' + key] = true;
  const checkEl = document.getElementById('scope-check-' + key);
  if (checkEl) {
    checkEl.style.color = 'var(--green-primary)';
    checkEl.textContent = '\u2713 Scenario ' + key + ' analyzed';
  }
  scopeSimCheckComplete();
}

function scopeSimCheckComplete() {
  if (scopeSimState.seenA && scopeSimState.seenB && scopeSimState.seenC) {
    const statusEl = document.getElementById('m5-status');
    if (statusEl) statusEl.innerHTML = '<span class="status-pass">\u2713 ALL SCENARIOS ANALYZED \u2014 MISSION 05 COMPLETE</span>';
    setTimeout(function() { completeMission(5); }, 800);
  }
}

function initMission5() {
  scopeSimState.seenA = false;
  scopeSimState.seenB = false;
  scopeSimState.seenC = false;
}

MISSION_RENDERERS[5] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Scope Checker</div>
    <p>Run each scenario to see the difference between too simple, too complex, and well-scoped. Each shows an actual scope analysis with findings and a verdict. The pattern from Scenario C is what your proposal needs to match. Analyze all three to unlock the proposal checklist.</p>
    <div class="concept-grid">
      <div class="concept-card">
        <h3>Scenario A</h3>
        <p><strong>Password Strength Checker</strong><br>Validates if a password meets complexity requirements. Single function, no files, minimal scope.</p>
        <button class="btn-run" style="margin-top:14px; font-size:0.8em; padding:8px 16px;" onclick="runScopeScenario('A')">&#9654; ANALYZE</button>
      </div>
      <div class="concept-card">
        <h3>Scenario B</h3>
        <p><strong>Real-Time SIEM Platform</strong><br>Live API ingestion, ML anomaly detection, web dashboard, Slack/PagerDuty integration, multi-tenant environments.</p>
        <button class="btn-run" style="margin-top:14px; font-size:0.8em; padding:8px 16px;" onclick="runScopeScenario('B')">&#9654; ANALYZE</button>
      </div>
      <div class="concept-card">
        <h3>Scenario C</h3>
        <p><strong>Patch Priority Orchestrator</strong><br>Reads two JSON files, joins by host ID, applies scoring formula, outputs prioritized queue and overdue report.</p>
        <button class="btn-run" style="margin-top:14px; font-size:0.8em; padding:8px 16px;" onclick="runScopeScenario('C')">&#9654; ANALYZE</button>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Scope Analysis Terminal</div>
    <div id="scope-terminal" style="background:var(--bg-editor); border:1px solid var(--border); border-radius:3px; padding:16px; min-height:200px; font-family:var(--font); font-size:0.88em; overflow-y:auto; max-height:480px; white-space:pre-wrap;"></div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Scenarios Completed</div>
    <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:8px;">
      <div id="scope-check-A" style="color:var(--text-dim);">&#9744; Scenario A &mdash; Too Simple</div>
      <div id="scope-check-B" style="color:var(--text-dim);">&#9744; Scenario B &mdash; Too Complex</div>
      <div id="scope-check-C" style="color:var(--text-dim);">&#9744; Scenario C &mdash; Well Scoped</div>
    </div>
    <div id="m5-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 06 — PROPOSAL
// ===================================================
const proposalState = new Set();
const PROPOSAL_TOTAL = 7;

function checkProposalItem(idx) {
  proposalState.add(idx);
  const item = document.getElementById('proposal-item-' + idx);
  if (item) {
    item.classList.add('checked');
    const box = item.querySelector('.proposal-check-box');
    if (box) {
      box.textContent = '\u2713';
      box.style.color = 'var(--green-primary)';
      box.style.borderColor = 'var(--green-primary)';
    }
  }
  const statusEl = document.getElementById('m6-checklist-status');
  if (statusEl) statusEl.textContent = proposalState.size + ' / ' + PROPOSAL_TOTAL + ' sections confirmed';
  if (proposalState.size >= PROPOSAL_TOTAL) {
    const finalEl = document.getElementById('m6-status');
    if (finalEl) finalEl.innerHTML = '<span class="status-pass">\u2713 PROPOSAL COMPLETE \u2014 MISSION 06 COMPLETE</span>';
    setTimeout(function() { completeMission(6); }, 800);
  }
}

MISSION_RENDERERS[6] = function() {
  return `
  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Proposal Checklist</div>
    <p>Your Week 13 deliverable is a written proposal covering all seven sections below. Click each item to confirm you have completed that section. All seven must be confirmed before you are cleared to begin Week 14 implementation.</p>
    <div class="hint-box">
      <strong>This is your contract with yourself.</strong> The proposal defines what you build. If Week 14 scope creep tempts you, your proposal is the reference. Must-have features get built first. Nice-to-have features only if you finish ahead of schedule.
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Confirm All Seven Proposal Sections</div>
    <p style="color:var(--text-dim); font-size:0.85em; margin-bottom:16px;">Click each item to confirm you have completed that section of your proposal document.</p>

    <div style="display:flex; flex-direction:column; gap:12px;">

      <div id="proposal-item-0" class="proposal-item" onclick="checkProposalItem(0)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="proposal-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Project Title &amp; Problem Statement</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I have written a clear project title and a one-paragraph problem statement identifying the real-world IT or security problem my tool addresses and who benefits from it.</p>
        </div>
      </div>

      <div id="proposal-item-1" class="proposal-item" onclick="checkProposalItem(1)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="proposal-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Target Users</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I have identified who will use this tool (SOC analyst, sysadmin, IT manager, personal use) and why the current manual process is insufficient.</p>
        </div>
      </div>

      <div id="proposal-item-2" class="proposal-item" onclick="checkProposalItem(2)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="proposal-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Input JSON Schema</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I have designed my input JSON structure with realistic field names, correct types, and at least one complete example record showing what the data looks like.</p>
        </div>
      </div>

      <div id="proposal-item-3" class="proposal-item" onclick="checkProposalItem(3)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="proposal-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Output JSON Schema</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I have designed my output JSON structure with summary statistics, a details array, and an example showing what the report will look like after processing.</p>
        </div>
      </div>

      <div id="proposal-item-4" class="proposal-item" onclick="checkProposalItem(4)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="proposal-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>CLI Interface Design</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I have listed all argparse arguments my tool will accept, including required flags (--input, --output) and at least two optional filtering or configuration flags with descriptions.</p>
        </div>
      </div>

      <div id="proposal-item-5" class="proposal-item" onclick="checkProposalItem(5)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="proposal-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Class Design Sketch</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I have sketched at least one class with its <code>__init__</code> parameters, at least two methods with meaningful names (not just getters), and a brief description of what each method does.</p>
        </div>
      </div>

      <div id="proposal-item-6" class="proposal-item" onclick="checkProposalItem(6)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="proposal-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Week 14-16 Timeline</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I have written a timeline listing what I will build in Week 14 (MVP features), Week 15 (tests, logging, documentation), and Week 16 (polish, demo, portfolio), with specific deliverables for each week.</p>
        </div>
      </div>

    </div>

    <div id="m6-checklist-status" style="color:var(--text-dim); font-size:0.8em; margin-top:16px; letter-spacing:1px;">0 / 7 sections confirmed</div>
    <div id="m6-status" class="gate-status" style="margin-top:8px;"></div>
  </div>
  `;
};
