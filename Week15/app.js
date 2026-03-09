// ===== STATE =====
const STORAGE_KEY = 'cvnp2646_w15_progress';

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
  { id: 0, key: 'ORIENTATION',   label: '00\nORIENT',   icon: '⬡' },
  { id: 1, key: 'TEST_STRATEGY', label: '01\nSTRATEGY', icon: '⬡' },
  { id: 2, key: 'PYTEST',        label: '02\nPYTEST',   icon: '⬡' },
  { id: 3, key: 'VALIDATION',    label: '03\nVALIDATE', icon: '⬡' },
  { id: 4, key: 'LOGGING',       label: '04\nLOGGING',  icon: '⬡' },
  { id: 5, key: 'README',        label: '05\nREADME',   icon: '⬡' },
  { id: 6, key: 'FINAL_CHECK',   label: '06\nFINAL',    icon: '⬡' },
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
    showBriefing('OPERATION HARDEN COMPLETE. Your capstone is tested, validated, logged, and documented. Commit everything and run the clean checkout one final time. Week 16 is the demo and portfolio. You are almost done.', null);
    renderMissionMap();
    updateProgress();
  }
}

// ===== COMMANDER ZHANG BRIEFINGS =====
const BRIEFINGS = [
  'Week 15. Your MVP runs. Now it needs to be trustworthy. Testing, validation, logging, and documentation are not extras. They are what makes code believable. Start here.',
  'Orientation confirmed. Mission 01 is test strategy. Good tests are not random. They target the parts of your tool where bugs matter most. Identify those before writing a single test.',
  'Strategy confirmed. Mission 02 is pytest. Three categories matter: normal cases, boundary cases, and invalid input. All three must exist in your test suite before Week 15 is complete.',
  'Tests written. Mission 03 is validation. If your tool crashes on bad input, it is not production-ready. Validate at the entry point \u2014 missing files, invalid JSON, missing required fields.',
  'Validation complete. Mission 04 is logging. Print statements are not acceptable in a professional tool. Replace them with the logging module \u2014 INFO for progress, WARNING for suspicious data, ERROR for failures.',
  'Logging complete. Mission 05 is README and clean checkout. A README that promises features the code does not have hurts more than it helps. Then prove it works from scratch.',
  'README complete. Final mission: confirm the Week 15 checklist. Ten concrete items. Every one represents a real deliverable in your repository \u2014 not a plan, an implementation.',
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
  document.title = 'MISSION ' + String(id).padStart(2, '0') + ' \u2014 ' + (MISSIONS[id] ? MISSIONS[id].key : '') + ' | OPERATION: HARDEN';
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
    <div class="panel-title">Week 15: From MVP to Professional Tool</div>
    <p>Your MVP runs. That was Week 14. Week 15 is about making it <strong>trustworthy</strong>. An MVP that only works in your environment is a prototype. A professional tool works everywhere, handles bad input gracefully, and proves it with tests. This week is worth <strong>25 points</strong>.</p>
    <p style="margin-top:12px;">The process of hardening a tool means closing the gap between "it works on my machine" and "it works for anyone who clones the repo." You will add four layers of quality: tests, validation, logging, and documentation.</p>
    <div class="concept-grid">
      <div class="concept-card">
        <h3>Meaningful Tests</h3>
        <p>pytest coverage for normal, edge, and invalid input cases. AI can draft test skeletons &mdash; you refine the assertions to actually catch bugs. A test that passes when the function is broken is worse than no test at all.</p>
      </div>
      <div class="concept-card">
        <h3>Input Validation</h3>
        <p>Catch missing files, invalid JSON, and missing required fields at the entry point. User-friendly error messages, not Python tracebacks. Every professional tool validates before processing.</p>
      </div>
      <div class="concept-card">
        <h3>Logging (not print)</h3>
        <p>Replace <code>print()</code> with the logging module. INFO for progress milestones, WARNING for suspicious data, ERROR for failures. A file handler captures logs for forensic review when the tool runs as a scheduled job.</p>
      </div>
      <div class="concept-card">
        <h3>README + Clean Checkout</h3>
        <p>Documentation is part of the software. A README that promises features the code does not have hurts more than it helps. Prove the project runs from a fresh clone using only the README instructions.</p>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">What Week 15 Is NOT</div>
    <p>Hardening is not the same as expanding. Keep these boundaries clearly in mind as you work this week:</p>
    <ul class="list">
      <li><strong>NOT adding major new features</strong> &mdash; stabilize and verify what already exists. New features without tests make the project harder to defend, not better.</li>
      <li><strong>NOT writing tests that only pass on your machine</strong> &mdash; hardcoded absolute paths, missing fixtures, or environment-specific assumptions will cause the clean-checkout test to fail.</li>
      <li><strong>NOT leaving <code>print()</code> calls in the production code path</strong> &mdash; debug prints are fine during development, but the submitted code should use <code>logger</code> consistently.</li>
    </ul>
    <div class="hint-box">
      <strong>A project that works reliably is more impressive than a project that only works in a demo environment.</strong> Week 16 is the demo. If you harden properly in Week 15, the demo in Week 16 will go smoothly. If you skip Week 15 quality work, Week 16 will be stressful.
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Orientation Check &mdash; 3 Questions</div>
    <p>Answer all three correctly to unlock Mission 01.</p>

    <div class="quiz-question" id="q0-0">
      <p><strong>Q1:</strong> What is the primary goal of Week 15?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">Add new features to the capstone tool</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, true)">Transform the MVP into a reliable, documented, testworthy project</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">Rewrite the architecture using a web framework</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">Create a web dashboard for the output report</button>
      </div>
    </div>

    <div class="quiz-question" id="q0-1">
      <p><strong>Q2:</strong> Which Python standard library module replaces <code>print()</code> for professional logging?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">sys.stdout</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, true)">logging</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">print_log</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">traceback</button>
      </div>
    </div>

    <div class="quiz-question" id="q0-2">
      <p><strong>Q3:</strong> What does the clean-checkout test verify?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">That all pytest tests pass locally on the developer's machine</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">That the code is fully commented and documented inline</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, true)">That someone can clone the repo, follow the README, and run the tool from scratch without extra setup</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">That GitHub Actions CI passes on the main branch</button>
      </div>
    </div>

    <div id="m0-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 01 — TEST_STRATEGY
// ===================================================
MISSION_RENDERERS[1] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Identify What Must Be Tested First</div>
    <p>Do not start Week 15 by asking AI for twenty tests. Start by identifying the core logic that cannot be allowed to fail. Every capstone has a main promise &mdash; "I analyze X and produce Y." The tests for that promise are written first. Everything else is secondary.</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code><span class="cm"># Test priorities for your capstone
# 1. Core loading/parsing logic — does load_logs() correctly create class instances?
# 2. Core scoring/classification logic — does _calculate_risk() return correct values?
# 3. Boundary cases — what happens at exactly the threshold (score == 80)?
# 4. Invalid input — missing file, bad JSON, missing required fields
# 5. End-to-end happy path — does main() run without errors on sample_input.json?</span></code></pre>
    </div>
    <p style="color:var(--text-dim); font-size:0.85em; margin-top:12px;">Click each strategy card below to understand the reasoning behind each test priority. All four must be reviewed before the question unlocks.</p>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Review All Four Test Strategy Components</div>
    <p style="color:var(--text-dim); font-size:0.85em;">Click each card to read the explanation. All four must be reviewed before the question unlocks.</p>
    <div class="concept-grid">

      <div class="concept-card" id="card-m1-0" onclick="visitCard('m1', 0, 4)">
        <h3>Test the Promise First</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">PRIORITY ONE</p>
        <p>Your capstone has one main promise &mdash; "I analyze X and produce Y." The tests for that promise are tests 1 and 2. If those fail, nothing else matters. Test helpers and utility functions only after the core is covered. Starting with easy tests gives false confidence.</p>
        <p style="margin-top:10px; font-size:0.85em;">Ask yourself: "If this test fails, does my tool produce wrong output?" If yes, write it first.</p>
      </div>

      <div class="concept-card" id="card-m1-1" onclick="visitCard('m1', 1, 4)">
        <h3>Boundary Cases Catch Real Bugs</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">PRIORITY TWO</p>
        <p>If your <code>is_critical()</code> threshold is <code>&gt;= 80</code>, test with scores of 79, 80, and 81. These three tests catch off-by-one errors that only appear at exactly the boundary. Bugs hide at the edges, not in the middle.</p>
        <p style="margin-top:10px; font-size:0.85em;">A test with score 50 tells you the happy path works. A test with score 80 tells you the threshold logic is correct.</p>
      </div>

      <div class="concept-card" id="card-m1-2" onclick="visitCard('m1', 2, 4)">
        <h3>Invalid Input Tests Are Required</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">PRIORITY THREE</p>
        <p>Every capstone must handle: missing input file (<code>FileNotFoundError</code>), invalid JSON (<code>json.JSONDecodeError</code>), and missing required fields (<code>KeyError</code> or custom validation). These tests verify your error handling &mdash; not crash the test suite.</p>
        <p style="margin-top:10px; font-size:0.85em;">Use <code>pytest.raises(FileNotFoundError)</code> as a context manager to assert the exception is raised correctly.</p>
      </div>

      <div class="concept-card" id="card-m1-3" onclick="visitCard('m1', 3, 4)">
        <h3>AI for Test Categories, Not Test Code</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">EFFECTIVE AI USE</p>
        <p>Prompt AI to generate test category ideas first: "What categories of tests should I write for a function that loads JSON and creates ThreatEvent objects?" Use AI to think in categories, then write the specific assertions yourself. AI-generated assertions are often too weak to catch real bugs.</p>
        <p style="margin-top:10px; font-size:0.85em;">Review every AI-generated assertion. Replace <code>assert result is not None</code> with a real expected value.</p>
      </div>

    </div>
    <div id="card-m1-status" style="color:var(--text-dim); font-size:0.8em; margin-top:8px; letter-spacing:1px;">0 / 4 components reviewed</div>
  </div>

  <div class="panel">
    <div class="panel-accent" style="background:var(--green-primary);"></div>
    <div class="panel-title" style="color:var(--green-primary);">Good Test Names Signal Good Tests</div>
    <p>A well-named test tells you exactly what it checks and what should happen. When a test fails, the name should tell you where to look. Study these example names:</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code><span class="kw">def</span> <span class="fn">test_load_logs_returns_correct_count</span>(): ...
<span class="kw">def</span> <span class="fn">test_calculate_risk_returns_95_for_malware</span>(): ...
<span class="kw">def</span> <span class="fn">test_is_critical_returns_true_at_threshold_80</span>(): ...
<span class="kw">def</span> <span class="fn">test_is_critical_returns_false_below_threshold</span>(): ...
<span class="kw">def</span> <span class="fn">test_load_logs_raises_on_missing_file</span>(): ...
<span class="kw">def</span> <span class="fn">test_load_logs_raises_on_invalid_json</span>(): ...
<span class="kw">def</span> <span class="fn">test_generate_report_with_empty_events</span>(): ...</code></pre>
    </div>
    <div class="hint-box">
      <strong>Pattern:</strong> <code>test_[function]_[expected_behavior]_[condition]</code>. The test name is documentation. It tells the next developer (and the grader) exactly what contract is being verified.
    </div>
  </div>

  <div class="panel" id="m1-question-panel" style="display:none">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Strategy Check</div>
    <div class="quiz-question" id="q1-0">
      <p><strong>Q1:</strong> Which tests should you write FIRST in Week 15?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">Tests for the easiest helper functions to build confidence</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, true)">Tests for the core scoring or classification logic that carries your capstone's main promise</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">Tests for argparse argument parsing and CLI flags</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">Tests for the README examples to verify documentation accuracy</button>
      </div>
    </div>
    <div id="m1-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 02 — PYTEST
// ===================================================
MISSION_RENDERERS[2] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Writing Meaningful Tests</div>
    <p>A meaningful test has three parts: setup (create the object or state), action (call the function), and assertion (verify the exact expected value). The assertion is what separates a meaningful test from a meaningless one. Study this complete test file:</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code><span class="cm"># tests/test_threat_event.py</span>
<span class="kw">import</span> pytest
<span class="kw">import</span> json
<span class="kw">from</span> pathlib <span class="kw">import</span> Path
<span class="kw">from</span> src.threat_event <span class="kw">import</span> <span class="tp">ThreatEvent</span>
<span class="kw">from</span> src.aggregator <span class="kw">import</span> <span class="tp">LogAggregator</span>

<span class="cm"># ── Normal Case ─────────────────────────────────────</span>
<span class="kw">def</span> <span class="fn">test_malware_risk_score_is_95</span>():
    event = <span class="tp">ThreatEvent</span>(<span class="str">"10.0.1.1"</span>, <span class="str">"malware_detected"</span>, <span class="str">"2024-01-01T00:00:00Z"</span>, <span class="str">"high"</span>)
    <span class="kw">assert</span> event.risk_score == <span class="num">95</span>

<span class="kw">def</span> <span class="fn">test_port_scan_risk_score_is_70</span>():
    event = <span class="tp">ThreatEvent</span>(<span class="str">"10.0.1.1"</span>, <span class="str">"port_scan"</span>, <span class="str">"2024-01-01T00:00:00Z"</span>, <span class="str">"medium"</span>)
    <span class="kw">assert</span> event.risk_score == <span class="num">70</span>

<span class="kw">def</span> <span class="fn">test_unknown_event_type_defaults_to_20</span>():
    event = <span class="tp">ThreatEvent</span>(<span class="str">"10.0.1.1"</span>, <span class="str">"unknown_event"</span>, <span class="str">"2024-01-01T00:00:00Z"</span>, <span class="str">"low"</span>)
    <span class="kw">assert</span> event.risk_score == <span class="num">20</span>

<span class="cm"># ── Boundary Case ────────────────────────────────────</span>
<span class="kw">def</span> <span class="fn">test_is_critical_true_at_score_80</span>():
    event = <span class="tp">ThreatEvent</span>(<span class="str">"10.0.1.1"</span>, <span class="str">"port_scan"</span>, <span class="str">"2024-01-01T00:00:00Z"</span>, <span class="str">"medium"</span>)
    event.risk_score = <span class="num">80</span>  <span class="cm"># set directly for boundary test</span>
    <span class="kw">assert</span> event.<span class="fn">is_critical</span>() <span class="kw">is</span> <span class="kw">True</span>

<span class="kw">def</span> <span class="fn">test_is_critical_false_below_80</span>():
    event = <span class="tp">ThreatEvent</span>(<span class="str">"10.0.1.1"</span>, <span class="str">"port_scan"</span>, <span class="str">"2024-01-01T00:00:00Z"</span>, <span class="str">"medium"</span>)
    event.risk_score = <span class="num">79</span>
    <span class="kw">assert</span> event.<span class="fn">is_critical</span>() <span class="kw">is</span> <span class="kw">False</span>

<span class="cm"># ── to_dict Serialization ────────────────────────────</span>
<span class="kw">def</span> <span class="fn">test_to_dict_contains_required_keys</span>():
    event = <span class="tp">ThreatEvent</span>(<span class="str">"10.0.1.1"</span>, <span class="str">"port_scan"</span>, <span class="str">"2024-01-01T00:00:00Z"</span>, <span class="str">"medium"</span>)
    d = event.<span class="fn">to_dict</span>()
    <span class="kw">assert</span> <span class="str">"source_ip"</span> <span class="kw">in</span> d
    <span class="kw">assert</span> <span class="str">"risk_score"</span> <span class="kw">in</span> d
    <span class="kw">assert</span> <span class="str">"event_type"</span> <span class="kw">in</span> d

<span class="cm"># ── Invalid Input / Error Handling ──────────────────</span>
<span class="kw">def</span> <span class="fn">test_load_logs_raises_on_missing_file</span>():
    agg = <span class="tp">LogAggregator</span>()
    <span class="kw">with</span> pytest.<span class="fn">raises</span>(<span class="tp">FileNotFoundError</span>):
        agg.<span class="fn">load_logs</span>(<span class="tp">Path</span>(<span class="str">"data/nonexistent.json"</span>))

<span class="kw">def</span> <span class="fn">test_generate_report_handles_empty_events</span>():
    agg = <span class="tp">LogAggregator</span>()
    report = agg.<span class="fn">generate_report</span>()
    <span class="kw">assert</span> report[<span class="str">"total_events"</span>] == <span class="num">0</span>
    <span class="kw">assert</span> report[<span class="str">"critical_count"</span>] == <span class="num">0</span></code></pre>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">AI-Generated Tests Are Often Too Polite</div>
    <p>When you ask AI to write tests, it tends to write tests that pass easily and catch nothing. The most common pattern is the "not None" assertion. This is a warning sign:</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <pre><code><span class="cm"># WEAK — passes even when the function is broken</span>
<span class="kw">def</span> <span class="fn">test_generate_report</span>():
    agg = <span class="tp">LogAggregator</span>()
    result = agg.<span class="fn">generate_report</span>()
    <span class="kw">assert</span> result <span class="kw">is not</span> <span class="kw">None</span>  <span class="cm"># passes even if result is {}</span>

<span class="cm"># STRONG — catches actual bugs in the count logic</span>
<span class="kw">def</span> <span class="fn">test_generate_report_counts_correctly</span>():
    agg = <span class="tp">LogAggregator</span>()
    agg.events = [
        <span class="tp">ThreatEvent</span>(<span class="str">"1.1.1.1"</span>, <span class="str">"malware_detected"</span>, <span class="str">"2024-01-01"</span>, <span class="str">"high"</span>),
        <span class="tp">ThreatEvent</span>(<span class="str">"1.1.1.2"</span>, <span class="str">"port_scan"</span>, <span class="str">"2024-01-01"</span>, <span class="str">"low"</span>),
    ]
    report = agg.<span class="fn">generate_report</span>()
    <span class="kw">assert</span> report[<span class="str">"total_events"</span>] == <span class="num">2</span>
    <span class="kw">assert</span> report[<span class="str">"critical_count"</span>] == <span class="num">1</span></code></pre>
    </div>
    <p style="color:var(--text-dim); font-size:0.85em; margin-top:12px;">When reviewing AI-generated tests, check every <code>assert</code> statement. If the assertion does not specify an exact expected value, it is not testing anything meaningful.</p>
  </div>

  <div class="panel">
    <div class="panel-accent" style="background:var(--green-primary);"></div>
    <div class="panel-title" style="color:var(--green-primary);">Running pytest</div>
    <p>pytest discovers and runs all test files matching <code>test_*.py</code> or <code>*_test.py</code> automatically. No test runner configuration is required for basic usage:</p>
    <div class="code-block">
      <span class="code-lang-tag">bash</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code><span class="cm"># Run all tests</span>
pytest

<span class="cm"># Verbose output (shows each test name)</span>
pytest -v

<span class="cm"># Run one file</span>
pytest tests/test_threat_event.py -v

<span class="cm"># Run tests matching a name pattern</span>
pytest -k "critical" -v

<span class="cm"># Stop on first failure</span>
pytest -x -v</code></pre>
    </div>
    <div class="hint-box">
      <strong>Run pytest from your project root</strong>, not from inside the <code>tests/</code> directory. Running from the root ensures Python can find <code>src/</code> imports. If you get <code>ModuleNotFoundError</code>, check that <code>src/__init__.py</code> exists and that you are running from the project root.
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">pytest Check &mdash; 4 Questions</div>
    <p>Answer all four correctly to unlock Mission 03.</p>

    <div class="quiz-question" id="q2-0">
      <p><strong>Q1:</strong> What is wrong with the assertion <code>assert result is not None</code>?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">It raises a SyntaxError in Python 3</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, true)">It passes even if the function returns a wrong value &mdash; it only checks that something was returned</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">It cannot be used with custom class instances</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">It is not a recognized pytest assertion format</button>
      </div>
    </div>

    <div class="quiz-question" id="q2-1">
      <p><strong>Q2:</strong> Why should you test with <code>risk_score</code> values of 79, 80, and 81 (not just 80)?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, false)">Because pytest requires at least three test cases per function</button>
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, true)">Boundary tests catch off-by-one errors that hide at exactly the threshold</button>
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, false)">To maximize test coverage percentage reported by pytest</button>
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, false)">Because Python integer comparison only works correctly at multiples of three</button>
      </div>
    </div>

    <div class="quiz-question" id="q2-2">
      <p><strong>Q3:</strong> Which pytest feature is used to verify that a function raises a specific exception?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, false)">pytest.expect_error() used as a decorator</button>
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, false)">assert raises(FileNotFoundError) as a standalone statement</button>
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, true)">pytest.raises() used as a context manager with <code>with</code></button>
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, false)">try/except AssertionError wrapped around the function call</button>
      </div>
    </div>

    <div class="quiz-question" id="q2-3">
      <p><strong>Q4:</strong> What is the minimum test coverage required by the capstone rubric?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, false)">100% line coverage measured by pytest-cov</button>
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, false)">At least 10 passing tests regardless of what they cover</button>
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, false)">One test per method in the core model class</button>
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, true)">Tests covering normal cases, at least one edge/boundary case, and at least one invalid-input case</button>
      </div>
    </div>

    <div id="m2-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 03 — VALIDATION
// ===================================================
MISSION_RENDERERS[3] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Validate at the Entry Point</div>
    <p>Validation logic belongs in <code>load_logs()</code> or a dedicated <code>validate_input()</code> function &mdash; not scattered through the codebase. When validation is centralized, tests are easier to write, errors are easier to find, and the production code stays clean.</p>
    <p style="margin-top:12px;">Every capstone must handle three categories of failure before processing begins:</p>

    <p style="margin-top:20px; font-weight:600; color:var(--blue-info);">Failure 1 &mdash; Missing File</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code><span class="kw">def</span> <span class="fn">load_logs</span>(<span class="kw">self</span>, file_path):
    path = <span class="tp">Path</span>(file_path)
    <span class="kw">if not</span> path.<span class="fn">exists</span>():
        <span class="kw">raise</span> <span class="tp">FileNotFoundError</span>(<span class="str">f"Input file not found: {path}"</span>)
    <span class="kw">with</span> <span class="fn">open</span>(path) <span class="kw">as</span> f:
        records = json.<span class="fn">load</span>(f)
    ...</code></pre>
    </div>

    <p style="margin-top:20px; font-weight:600; color:var(--blue-info);">Failure 2 &mdash; Invalid JSON</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code>    <span class="kw">try</span>:
        records = json.<span class="fn">load</span>(f)
    <span class="kw">except</span> json.<span class="tp">JSONDecodeError</span> <span class="kw">as</span> e:
        <span class="kw">raise</span> <span class="tp">ValueError</span>(<span class="str">f"Invalid JSON in {path}: {e}"</span>)</code></pre>
    </div>

    <p style="margin-top:20px; font-weight:600; color:var(--blue-info);">Failure 3 &mdash; Missing Required Fields</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code>REQUIRED_FIELDS = {<span class="str">"source_ip"</span>, <span class="str">"event_type"</span>, <span class="str">"severity"</span>, <span class="str">"timestamp"</span>}

<span class="kw">for</span> i, record <span class="kw">in</span> <span class="fn">enumerate</span>(records):
    missing = REQUIRED_FIELDS - record.<span class="fn">keys</span>()
    <span class="kw">if</span> missing:
        <span class="kw">raise</span> <span class="tp">ValueError</span>(<span class="str">f"Record {i} missing required fields: {missing}"</span>)</code></pre>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent" style="background:var(--green-primary);"></div>
    <div class="panel-title" style="color:var(--green-primary);">Graceful Failures in main()</div>
    <p>The validation functions raise exceptions with clear messages. The <code>main()</code> function catches them and shows the user a friendly error, not a Python traceback. This is the boundary between your library code and your user-facing code:</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code><span class="kw">def</span> <span class="fn">main</span>():
    args = <span class="fn">parse_args</span>()
    <span class="kw">try</span>:
        aggregator = <span class="tp">LogAggregator</span>()
        aggregator.<span class="fn">load_logs</span>(args.input)
        report = aggregator.<span class="fn">generate_report</span>()
        <span class="fn">write_report</span>(report, args.output)
    <span class="kw">except</span> <span class="tp">FileNotFoundError</span> <span class="kw">as</span> e:
        <span class="fn">print</span>(<span class="str">f"Error: {e}"</span>)
        <span class="kw">raise</span> <span class="tp">SystemExit</span>(<span class="num">1</span>)
    <span class="kw">except</span> <span class="tp">ValueError</span> <span class="kw">as</span> e:
        <span class="fn">print</span>(<span class="str">f"Validation error: {e}"</span>)
        <span class="kw">raise</span> <span class="tp">SystemExit</span>(<span class="num">1</span>)</code></pre>
    </div>
    <div class="hint-box">
      <strong>Why <code>raise SystemExit(1)</code> instead of <code>sys.exit(1)</code>?</strong> Both work the same way &mdash; they exit the process with a non-zero status code that signals failure to the shell. <code>SystemExit</code> is preferred in tests because pytest can catch it without killing the test runner.
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent" style="background:var(--red-alert);"></div>
    <div class="panel-title" style="color:var(--red-alert);">What NOT to Do</div>
    <p>These three patterns appear frequently in Week 14 code and must be fixed in Week 15:</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <pre><code><span class="cm"># WRONG 1 — silently swallows all errors, tool appears to succeed</span>
<span class="kw">except</span> <span class="tp">Exception</span>:
    <span class="kw">pass</span>

<span class="cm"># WRONG 2 — prints but continues processing on broken data</span>
<span class="kw">except</span> <span class="tp">Exception</span> <span class="kw">as</span> e:
    <span class="fn">print</span>(e)
    <span class="cm"># then continues as if nothing happened</span>

<span class="cm"># WRONG 3 — validating in the middle of the loop</span>
<span class="kw">for</span> record <span class="kw">in</span> records:
    event = <span class="tp">ThreatEvent</span>(
        source_ip=record[<span class="str">"source_ip"</span>],  <span class="cm"># crashes here with unhandled KeyError</span>
        event_type=record[<span class="str">"event_type"</span>],
    )</code></pre>
    </div>
    <p style="color:var(--text-dim); font-size:0.85em; margin-top:12px;">The third pattern is the most common. It means validation is happening at the point of use instead of the entry point. Fix it by checking required fields before the loop.</p>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Validation Check</div>
    <div class="quiz-question" id="q3-0">
      <p><strong>Q1:</strong> Where should input validation logic live in a well-structured capstone project?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">Scattered throughout the model class methods where each field is first used</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">In main() using a long if/elif chain before the try/except block</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, true)">In <code>load_logs()</code> or a dedicated validation function called before processing begins</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">In the pytest tests only &mdash; validation is a testing concern, not a production concern</button>
      </div>
    </div>
    <div id="m3-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 04 — LOGGING
// ===================================================
MISSION_RENDERERS[4] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Replace print() with logging</div>
    <p><code>print()</code> has no level, no timestamp, no file output, and no way to disable it selectively. It is fine for debugging during development but unacceptable in a production tool. The Python <code>logging</code> module provides all of these capabilities with no external dependencies.</p>

    <table style="width:100%; border-collapse:collapse; margin-top:16px; font-size:0.88em;">
      <thead>
        <tr style="border-bottom:1px solid var(--border);">
          <th style="text-align:left; padding:8px 12px; color:var(--text-dim); letter-spacing:1px; font-weight:600;">Level</th>
          <th style="text-align:left; padding:8px 12px; color:var(--text-dim); letter-spacing:1px; font-weight:600;">Use for</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom:1px solid var(--border);">
          <td style="padding:10px 12px;"><code>DEBUG</code></td>
          <td style="padding:10px 12px; color:var(--text-dim);">Detailed traces (disabled in production)</td>
        </tr>
        <tr style="border-bottom:1px solid var(--border);">
          <td style="padding:10px 12px;"><code>INFO</code></td>
          <td style="padding:10px 12px; color:var(--text-dim);">Progress milestones ("Loaded 5 events")</td>
        </tr>
        <tr style="border-bottom:1px solid var(--border);">
          <td style="padding:10px 12px;"><code>WARNING</code></td>
          <td style="padding:10px 12px; color:var(--text-dim);">Suspicious but non-fatal ("Unknown event type: xyz")</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;"><code>ERROR</code></td>
          <td style="padding:10px 12px; color:var(--text-dim);">Failures that stop processing</td>
        </tr>
      </tbody>
    </table>

    <p style="margin-top:20px;">Add this <code>setup_logging()</code> function to your project &mdash; typically in a <code>src/logger.py</code> file or at the top of <code>main.py</code>:</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code><span class="kw">import</span> logging

<span class="kw">def</span> <span class="fn">setup_logging</span>(log_file=<span class="str">"app.log"</span>, level=<span class="str">"INFO"</span>):
    <span class="str">"""Configure console + file logging."""</span>
    numeric_level = <span class="fn">getattr</span>(logging, level.<span class="fn">upper</span>(), logging.INFO)

    logging.<span class="fn">basicConfig</span>(
        level=numeric_level,
        format=<span class="str">"%(asctime)s %(levelname)-8s %(message)s"</span>,
        datefmt=<span class="str">"%Y-%m-%d %H:%M:%S"</span>,
        handlers=[
            logging.<span class="tp">StreamHandler</span>(),               <span class="cm"># console</span>
            logging.<span class="tp">FileHandler</span>(log_file),         <span class="cm"># file</span>
        ]
    )
    <span class="kw">return</span> logging.<span class="fn">getLogger</span>(__name__)

logger = <span class="fn">setup_logging</span>()</code></pre>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent" style="background:var(--green-primary);"></div>
    <div class="panel-title" style="color:var(--green-primary);">Using the Logger</div>
    <p>The difference between Week 14 code and Week 15 code is the transition from <code>print()</code> to structured logging calls. Study this before/after comparison:</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code><span class="cm"># BEFORE — Week 14 style (not professional)</span>
<span class="fn">print</span>(<span class="str">f"Loaded {len(records)} events"</span>)
<span class="fn">print</span>(<span class="str">f"ERROR: file not found"</span>)
<span class="fn">print</span>(<span class="str">f"Processing event: {event}"</span>)

<span class="cm"># AFTER — Week 15 style (professional)</span>
logger.<span class="fn">info</span>(<span class="str">"Loaded %d events from %s"</span>, <span class="fn">len</span>(records), file_path)
logger.<span class="fn">error</span>(<span class="str">"Input file not found: %s"</span>, file_path)
logger.<span class="fn">debug</span>(<span class="str">"Processing event: %s"</span>, event)</code></pre>
    </div>
    <p style="color:var(--text-dim); font-size:0.85em; margin-top:12px;">Note the use of <code>%s</code> / <code>%d</code> format strings instead of f-strings in logger calls. This is a performance optimization &mdash; the string is only formatted if the message will actually be emitted at the current log level.</p>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Logging Rules</div>
    <ul class="list">
      <li><strong>Use <code>logger.info()</code> not <code>logging.info()</code></strong> &mdash; the module-level functions use the root logger and can cause message duplication when multiple loggers are configured.</li>
      <li><strong>Never log passwords, API keys, or user data</strong> &mdash; security tools must not create new exposure. Logging sensitive values defeats the purpose of building a security tool.</li>
      <li><strong>File handler captures everything for forensic review</strong> &mdash; useful when the tool runs as a scheduled job or cron task. The <code>app.log</code> file becomes an audit trail.</li>
      <li><strong>Add <code>app.log</code> to <code>.gitignore</code></strong> &mdash; log files should not be committed to the repository. They are runtime artifacts, not source code.</li>
    </ul>
    <div class="hint-box">
      <strong>Quick test:</strong> Search your entire project for <code>print(</code> after completing Mission 04. Every result in the production code path (<code>src/</code> and <code>main.py</code>) should be replaced with an appropriate <code>logger</code> call. Debug prints in a scratch file are fine &mdash; but not in committed code.
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Logging Check</div>
    <div class="quiz-question" id="q4-0">
      <p><strong>Q1:</strong> Which logging level is correct for reporting a progress milestone like "Loaded 5 events from file"?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(4, 0, this, false)">DEBUG</button>
        <button class="quiz-option" onclick="answerQuiz(4, 0, this, true)">INFO</button>
        <button class="quiz-option" onclick="answerQuiz(4, 0, this, false)">WARNING</button>
        <button class="quiz-option" onclick="answerQuiz(4, 0, this, false)">ERROR</button>
      </div>
    </div>
    <div id="m4-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 05 — README (simulator)
// ===================================================
const readmeSimState = { seenA: false, seenB: false, seenC: false };

function readmeLog(text, cls) {
  const term = document.getElementById('readme-terminal');
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

function readmeClear() {
  const term = document.getElementById('readme-terminal');
  if (term) term.innerHTML = '';
}

function runReadmeScenario(key) {
  readmeClear();

  if (key === 'A') {
    readmeLog('>> Evaluating README quality...', 'info');
    readmeLog('', '');
    readmeLog('   [CHECKING] Overview and description', '');
    readmeLog('   [OK]    Project name: "Security Event Analyzer"', 'success');
    readmeLog('   [OK]    One-sentence description present', 'success');
    readmeLog('   [OK]    Target user identified: SOC analysts', 'success');
    readmeLog('', '');
    readmeLog('   [CHECKING] Installation section', '');
    readmeLog('   [OK]    pip install -r requirements.txt', 'success');
    readmeLog('   [OK]    Python 3.10+ requirement stated', 'success');
    readmeLog('   [OK]    requirements.txt committed to repo', 'success');
    readmeLog('', '');
    readmeLog('   [CHECKING] Usage examples', '');
    readmeLog('   [OK]    python main.py --input data/sample_input.json', 'success');
    readmeLog('   [OK]    python main.py --help documented', 'success');
    readmeLog('   [OK]    Sample output shown in README', 'success');
    readmeLog('', '');
    readmeLog('   [CHECKING] Testing instructions', '');
    readmeLog('   [OK]    pytest -v command documented', 'success');
    readmeLog('   [OK]    Expected test count: 8 tests', 'success');
    readmeLog('', '');
    readmeLog('   [CHECKING] Clean checkout simulation', '');
    readmeLog('   [OK]    git clone \u2192 install \u2192 run \u2192 test: all pass', 'success');
    readmeLog('', '');
    readmeLog('   [VERDICT] READY \u2014 Week 15 README complete', 'success');

  } else if (key === 'B') {
    readmeLog('>> Evaluating README quality...', 'info');
    readmeLog('', '');
    readmeLog('   [CHECKING] Overview', '');
    readmeLog('   [WARN]  Description is generic: "This is a Python project"', 'warn');
    readmeLog('   [FAIL]  Target user not mentioned', 'fail');
    readmeLog('', '');
    readmeLog('   [CHECKING] Installation section', '');
    readmeLog('   [FAIL]  requirements.txt not committed to repo', 'fail');
    readmeLog('   [FAIL]  No Python version specified', 'fail');
    readmeLog('', '');
    readmeLog('   [CHECKING] Usage examples', '');
    readmeLog('   [FAIL]  Command: python analyzer.py --input logs.json', 'fail');
    readmeLog('           File "analyzer.py" does not exist \u2014 main.py is the entry point', 'fail');
    readmeLog('   [FAIL]  Promises feature "real-time alerting" \u2014 not implemented', 'fail');
    readmeLog('', '');
    readmeLog('   [CHECKING] Testing', '');
    readmeLog('   [FAIL]  No pytest instructions', 'fail');
    readmeLog('   [FAIL]  "Tests coming soon" \u2014 Week 15 deadline has passed', 'fail');
    readmeLog('', '');
    readmeLog('   [CHECKING] Clean checkout simulation', '');
    readmeLog('   [FAIL]  Fresh clone fails: ModuleNotFoundError: No module named \'src\'', 'fail');
    readmeLog('           Missing __init__.py not committed', 'fail');
    readmeLog('', '');
    readmeLog('   [VERDICT] NOT READY \u2014 5 critical issues found', 'fail');
    readmeLog('   [ACTION] Fix commands, commit requirements.txt, add __init__.py', 'warn');

  } else if (key === 'C') {
    readmeLog('>> Running clean checkout simulation...', 'info');
    readmeLog('', '');
    readmeLog('   $ git clone https://github.com/student/capstone', '');
    readmeLog('   [OK]    Cloned successfully', 'success');
    readmeLog('', '');
    readmeLog('   $ cd capstone', '');
    readmeLog('   $ pip install -r requirements.txt', '');
    readmeLog('   [OK]    All dependencies installed', 'success');
    readmeLog('', '');
    readmeLog('   $ python main.py --help', '');
    readmeLog('   [OK]    Help text displayed cleanly', 'success');
    readmeLog('   [OK]    All arguments documented', 'success');
    readmeLog('', '');
    readmeLog('   $ python main.py --input data/sample_input.json --output output/report.json', '');
    readmeLog('   [OK]    Loaded 5 events', 'success');
    readmeLog('   [OK]    2 critical events found', 'success');
    readmeLog('   [OK]    output/report.json written', 'success');
    readmeLog('', '');
    readmeLog('   $ pytest -v', '');
    readmeLog('   [OK]    test_calculate_risk_malware PASSED', 'success');
    readmeLog('   [OK]    test_is_critical_at_threshold PASSED', 'success');
    readmeLog('   [OK]    test_load_logs_missing_file PASSED', 'success');
    readmeLog('   [OK]    test_generate_report_empty PASSED', 'success');
    readmeLog('   [OK]    8 passed in 0.42s', 'success');
    readmeLog('', '');
    readmeLog('   [VERDICT] CLEAN CHECKOUT PASSES \u2014 project is ready for Week 16', 'success');
  }

  readmeSimState['seen' + key] = true;
  const checkEl = document.getElementById('readme-check-' + key);
  if (checkEl) {
    checkEl.style.color = 'var(--green-primary)';
    checkEl.textContent = '\u2713 Scenario ' + key + ' complete';
  }
  readmeSimCheckComplete();
}

function readmeSimCheckComplete() {
  if (readmeSimState.seenA && readmeSimState.seenB && readmeSimState.seenC) {
    const statusEl = document.getElementById('m5-status');
    if (statusEl) statusEl.innerHTML = '<span class="status-pass">\u2713 ALL SCENARIOS COMPLETE \u2014 MISSION 05 COMPLETE</span>';
    setTimeout(function() { completeMission(5); }, 800);
  }
}

function initMission5() {
  readmeSimState.seenA = false;
  readmeSimState.seenB = false;
  readmeSimState.seenC = false;
}

MISSION_RENDERERS[5] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">README and Clean Checkout</div>
    <p>A README is not a formality &mdash; it is a contract between you and anyone who clones your repository. It must be accurate. A README that documents a wrong command, a missing file, or a feature that does not exist is worse than no README at all. It sends the wrong person in the wrong direction.</p>
    <p style="margin-top:12px;">The clean checkout test is how you verify the README is honest. Clone your own repo into a new directory. Follow only the README. If anything fails, the README is wrong &mdash; not the reader. Run all three scenarios below to see what a good README verification looks like in practice.</p>
    <div class="concept-grid">

      <div class="concept-card">
        <h3>Scenario A</h3>
        <p><strong>Good README</strong><br>Clean checkout passes</p>
        <p style="color:var(--text-dim); font-size:0.85em; margin-top:8px;">A properly structured README with accurate commands, committed requirements.txt, and a working clean checkout from scratch.</p>
        <button class="btn-run" style="margin-top:14px; font-size:0.8em; padding:8px 16px;" onclick="runReadmeScenario('A')">&#9654; ANALYZE</button>
      </div>

      <div class="concept-card">
        <h3>Scenario B</h3>
        <p><strong>Bad README</strong><br>Five critical problems</p>
        <p style="color:var(--text-dim); font-size:0.85em; margin-top:8px;">Common README failures: wrong entry point, missing requirements.txt, promised-but-missing features, and a broken clean checkout.</p>
        <button class="btn-run" style="margin-top:14px; font-size:0.8em; padding:8px 16px;" onclick="runReadmeScenario('B')">&#9654; ANALYZE</button>
      </div>

      <div class="concept-card">
        <h3>Scenario C</h3>
        <p><strong>Clean Checkout Test</strong><br>Full simulation</p>
        <p style="color:var(--text-dim); font-size:0.85em; margin-top:8px;">git clone &rarr; pip install &rarr; python main.py &rarr; pytest. All four steps must pass for the Week 15 clean checkout requirement to be satisfied.</p>
        <button class="btn-run" style="margin-top:14px; font-size:0.8em; padding:8px 16px;" onclick="runReadmeScenario('C')">&#9654; ANALYZE</button>
      </div>

    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">README Terminal</div>
    <div id="readme-terminal" style="background:var(--bg-editor); border:1px solid var(--border); border-radius:3px; padding:16px; min-height:200px; font-family:var(--font); font-size:0.88em; overflow-y:auto; max-height:520px; white-space:pre-wrap;"></div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Scenarios Completed</div>
    <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:8px;">
      <div id="readme-check-A" style="color:var(--text-dim);">&#9744; Scenario A &mdash; Good README</div>
      <div id="readme-check-B" style="color:var(--text-dim);">&#9744; Scenario B &mdash; Bad README</div>
      <div id="readme-check-C" style="color:var(--text-dim);">&#9744; Scenario C &mdash; Clean Checkout Test</div>
    </div>
    <div id="m5-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 06 — FINAL_CHECK
// ===================================================
const hardenCheckState = new Set();
const HARDEN_TOTAL = 10;

function checkHardenItem(idx) {
  hardenCheckState.add(idx);
  const item = document.getElementById('harden-item-' + idx);
  if (item) {
    item.classList.add('checked');
    const box = item.querySelector('.harden-check-box');
    if (box) {
      box.textContent = '\u2713';
      box.style.color = 'var(--green-primary)';
      box.style.borderColor = 'var(--green-primary)';
    }
  }
  const statusEl = document.getElementById('m6-checklist-status');
  if (statusEl) statusEl.textContent = hardenCheckState.size + ' / ' + HARDEN_TOTAL + ' items confirmed';
  if (hardenCheckState.size >= HARDEN_TOTAL) {
    const finalEl = document.getElementById('m6-status');
    if (finalEl) finalEl.innerHTML = '<span class="status-pass">\u2713 HARDEN CHECKLIST COMPLETE \u2014 MISSION 06 COMPLETE</span>';
    setTimeout(function() { completeMission(6); }, 800);
  }
}

MISSION_RENDERERS[6] = function() {
  return `
  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Week 15 Final Checklist</div>
    <p>Ten concrete deliverables &mdash; not plans, implementations. Click each item only after you have completed it. All ten must be confirmed before Week 15 is done and before your Week 16 demo.</p>
    <div class="hint-box">
      <strong>This is a completion checklist, not a planning list.</strong> If you click an item you have not actually done, you are only deceiving yourself. The Week 16 grader will run your code from a clean checkout. If it does not work, it does not count.
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Confirm All Ten Harden Items</div>
    <p style="color:var(--text-dim); font-size:0.85em; margin-bottom:16px;">Click each item only after it is implemented, committed, and verified.</p>

    <div style="display:flex; flex-direction:column; gap:12px;">

      <div id="harden-item-0" class="proposal-item" onclick="checkHardenItem(0)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="harden-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Meaningful Tests Exist</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I have at least 3 meaningful pytest tests. They test core logic, not just import checks or trivial helpers. Each test has a specific assertion about a real expected value &mdash; not <code>assert result is not None</code>.</p>
        </div>
      </div>

      <div id="harden-item-1" class="proposal-item" onclick="checkHardenItem(1)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="harden-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Normal Case Tests</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I have tests covering the normal happy-path behavior: loading valid JSON, creating correct class instances, and generating an accurate report from known input. Each test asserts a specific expected value.</p>
        </div>
      </div>

      <div id="harden-item-2" class="proposal-item" onclick="checkHardenItem(2)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="harden-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Edge / Boundary Tests</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I have at least one boundary test &mdash; for example, testing <code>is_critical()</code> with scores at exactly the threshold (e.g., 79, 80, 81). Edge cases live at the boundary, not in the middle of the normal range.</p>
        </div>
      </div>

      <div id="harden-item-3" class="proposal-item" onclick="checkHardenItem(3)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="harden-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Invalid Input Tests</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I have tests verifying that missing files, invalid JSON, and missing required fields are handled with clear errors rather than Python tracebacks. These tests use <code>pytest.raises()</code> as a context manager.</p>
        </div>
      </div>

      <div id="harden-item-4" class="proposal-item" onclick="checkHardenItem(4)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="harden-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Input Validation in Code</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">My <code>load_logs()</code> or validation function checks for: file existence (<code>FileNotFoundError</code>), valid JSON (<code>json.JSONDecodeError</code>), and required fields (<code>ValueError</code>). Validation happens before processing begins. These checks are covered by tests.</p>
        </div>
      </div>

      <div id="harden-item-5" class="proposal-item" onclick="checkHardenItem(5)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="harden-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Logging Configured</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I have replaced <code>print()</code> statements in the production code path with <code>logger.info()</code>, <code>logger.warning()</code>, and <code>logger.error()</code>. A <code>setup_logging()</code> function configures both console and file handlers. <code>app.log</code> is in <code>.gitignore</code>.</p>
        </div>
      </div>

      <div id="harden-item-6" class="proposal-item" onclick="checkHardenItem(6)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="harden-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>README Is Accurate</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">My README.md contains: a real project description, working installation instructions, at least two real CLI usage examples copied from actual terminal runs, and <code>pytest</code> instructions. Every command I documented actually works.</p>
        </div>
      </div>

      <div id="harden-item-7" class="proposal-item" onclick="checkHardenItem(7)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="harden-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>requirements.txt Works</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">Running <code>pip install -r requirements.txt</code> in a fresh virtual environment installs all dependencies without errors. The file is committed to the repo and is not empty. If the only dependency is pytest, that is fine &mdash; it must still be listed.</p>
        </div>
      </div>

      <div id="harden-item-8" class="proposal-item" onclick="checkHardenItem(8)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="harden-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Clean Checkout Passes</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I have cloned my own repo into a new directory, followed only the README instructions, and confirmed that install &rarr; run &rarr; pytest all succeed without extra configuration. No manual steps were needed that are not documented in the README.</p>
        </div>
      </div>

      <div id="harden-item-9" class="proposal-item" onclick="checkHardenItem(9)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="harden-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>AI_USAGE.md Updated</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">My AI_USAGE.md includes entries for Week 15 testing and documentation sessions. Each entry logs the prompt used, what I accepted, what I changed, and how I verified the result. AI-generated tests that I kept without modification are noted explicitly.</p>
        </div>
      </div>

    </div>

    <div id="m6-checklist-status" style="color:var(--text-dim); font-size:0.8em; margin-top:16px; letter-spacing:1px;">0 / 10 items confirmed</div>
    <div id="m6-status" class="gate-status" style="margin-top:8px;"></div>
  </div>
  `;
};
