// ===== STATE =====
const STORAGE_KEY = 'cvnp2646_w14_progress';

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
  { id: 0, key: 'ORIENTATION', label: '00\nORIENT',    icon: '⬡' },
  { id: 1, key: 'PROJ_SETUP',  label: '01\nSETUP',     icon: '⬡' },
  { id: 2, key: 'CORE_CLASS',  label: '02\nCLASS',     icon: '⬡' },
  { id: 3, key: 'AGGREGATOR',  label: '03\nAGGREG',    icon: '⬡' },
  { id: 4, key: 'JSON_IO',     label: '04\nJSON I/O',  icon: '⬡' },
  { id: 5, key: 'PIPELINE',    label: '05\nPIPELINE',  icon: '⬡' },
  { id: 6, key: 'MVP_CHECK',   label: '06\nCHECKLIST', icon: '⬡' },
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
    showBriefing('OPERATION CONSTRUCT COMPLETE. Your MVP is running end-to-end. Commit to GitHub before the deadline. Week 15 begins next \u2014 pytest, logging, and CLI polish. The hard part is done. Ship it.', null);
    renderMissionMap();
    updateProgress();
  }
}

// ===== COMMANDER ZHANG BRIEFINGS =====
const BRIEFINGS = [
  'Week 14. The proposal is approved. The planning is done. It is time to build. Twenty-five points. The MVP milestone is a working end-to-end pipeline \u2014 JSON in, your class processes it, JSON out. Nothing more. Nothing less. Start here.',
  'Orientation confirmed. Mission 01 is project structure. Before writing logic, your directories must exist and your files must be importable. Study all four structural components before proceeding.',
  'Structure confirmed. Mission 02 is your core model class \u2014 the object that represents one record from your input data. Study all four components of the class before answering the check.',
  'Core class confirmed. Mission 03 is the aggregator \u2014 the engine that owns the collection and drives processing. Two classes working together is the capstone architecture pattern.',
  'Aggregator confirmed. Mission 04 is JSON I/O. Reading your input file and writing your output report are the entry and exit points of your entire tool. Master both patterns.',
  'JSON I/O confirmed. Mission 05 is the pipeline demo. Watch how all three layers connect end-to-end. Run all three scenarios to see your MVP come to life.',
  'Pipeline complete. Final mission: confirm your MVP checklist. Seven concrete items \u2014 not plans, implementations. All seven confirmed before Week 14 is done.',
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
  document.title = 'MISSION ' + String(id).padStart(2, '0') + ' \u2014 ' + (MISSIONS[id] ? MISSIONS[id].key : '') + ' | OPERATION: CONSTRUCT';
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
    <div class="panel-title">Week 14 — Build the MVP</div>
    <p>The proposal is approved. This week you build. The Week 14 milestone is the <strong>MVP</strong> — Minimum Viable Product. That means minimum scope, maximum function. Every feature you include must work end-to-end. This week is worth <strong>25 points</strong>.</p>
    <p style="margin-top:12px;">The core deliverable is a working three-layer pipeline: your input JSON file gets loaded, your class processes each record, and your tool writes a valid output report JSON. That is the bar. Not polish. Not tests. Not documentation. A running pipeline.</p>
    <div class="concept-grid">
      <div class="concept-card">
        <h3>What MVP Means</h3>
        <p>MVP does not mean minimal effort — it means minimal scope. Every feature you include must fully work. A half-built feature is worth zero. A working core pipeline with no CLI polish is worth 25 points.</p>
      </div>
      <div class="concept-card">
        <h3>The Happy Path</h3>
        <p>Week 14 is the happy path only. Load input &rarr; process with class &rarr; write output. No edge case handling yet. No invalid data. No logging. No pytest. Those come in Week 15.</p>
      </div>
      <div class="concept-card">
        <h3>Week 14 Deliverables</h3>
        <p>A core model class with methods. A JSON reader that creates class instances. A JSON writer that calls <code>to_dict()</code>. A <code>main.py</code> entry point that runs the pipeline.</p>
      </div>
      <div class="concept-card">
        <h3>What Comes Next</h3>
        <p>Week 15 adds CLI polish with argparse, pytest test suite, Python logging module, and a clean-checkout README. Week 16 is the demo video and portfolio submission.</p>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">The Three-Layer Pipeline</div>
    <p>Every capstone project follows the same architecture: a JSON input file feeds a model class, the model class feeds an aggregator/processor, and the aggregator writes a JSON output report. Study this pipeline — it is the pattern for Mission 01 through Mission 05.</p>
    <div class="code-block">
      <span class="code-lang-tag">pipeline</span>
      <pre><code>  data/sample_input.json
         |
         | json.load()
         v
  [  LogAggregator.load_logs()  ]
         |
         | for record in records:
         |     event = ThreatEvent(**record)
         v
  [  List of ThreatEvent objects  ]
         |
         | aggregator.generate_report()
         v
  [  Report dict  ]
         |
         | json.dump(report, f, indent=2)
         v
  output/report.json</code></pre>
    </div>
    <div class="concept-grid">
      <div class="concept-card">
        <h3>Layer 1 — Input</h3>
        <p><code>json.load()</code> reads your sample JSON file and returns a Python list of dicts. One dict per record. This is your raw data.</p>
      </div>
      <div class="concept-card">
        <h3>Layer 2 — Model</h3>
        <p>Your model class converts raw dicts into typed objects. Each object stores attributes and can compute — <code>_calculate_risk()</code>, <code>is_critical()</code>, <code>to_dict()</code>.</p>
      </div>
      <div class="concept-card">
        <h3>Layer 3 — Output</h3>
        <p><code>generate_report()</code> builds a summary dict from all the objects. <code>json.dump()</code> writes it to file. The output report is the deliverable.</p>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Orientation Check &mdash; 3 Questions</div>
    <p>Answer all three correctly to unlock Mission 01.</p>

    <div class="quiz-question" id="q0-0">
      <p><strong>Q1:</strong> What does MVP stand for in the Week 14 milestone?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">Most Valuable Product</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, true)">Minimum Viable Product</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">Maximum Verified Program</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">Modular Versioned Package</button>
      </div>
    </div>

    <div class="quiz-question" id="q0-1">
      <p><strong>Q2:</strong> Which of the following best describes the Week 14 definition of done?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">Full argparse CLI with all flags implemented and documented</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, true)">python main.py runs without errors, reads the input JSON, and writes a valid output report</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">pytest tests passing for all normal and edge cases</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">README.md complete with installation and usage instructions</button>
      </div>
    </div>

    <div class="quiz-question" id="q0-2">
      <p><strong>Q3:</strong> What is the correct order of the MVP pipeline?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">Write output &rarr; Load JSON &rarr; Create class instances &rarr; Generate report</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">Create class instances &rarr; Load JSON &rarr; Generate report &rarr; Write output</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, true)">Load JSON &rarr; Create class instances &rarr; Generate report &rarr; Write output</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">Generate report &rarr; Load JSON &rarr; Write output &rarr; Create class instances</button>
      </div>
    </div>

    <div id="m0-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 01 — PROJ_SETUP
// ===================================================
MISSION_RENDERERS[1] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Project Structure First</div>
    <p>Before writing a single line of logic, set up your project structure. A clean layout makes Week 15 testing trivial. Create this once and never reorganize. The directory structure below is the standard layout for all capstone projects in this course.</p>
    <div class="hint-box">
      <strong>Rule:</strong> If <code>from src.your_class import YourClass</code> raises a <code>ModuleNotFoundError</code>, your <code>__init__.py</code> files are missing. Fix the structure before writing any logic.
    </div>
    <div class="code-block">
      <span class="code-lang-tag">directory</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code>capstone_project/
├── main.py              # Entry point — run this
├── src/
│   ├── __init__.py      # Makes src/ importable
│   ├── your_class.py    # Core model class
│   └── aggregator.py    # Processor class
├── data/
│   └── sample_input.json
├── output/
│   └── .gitkeep
└── tests/
    └── __init__.py</code></pre>
    </div>
    <p style="color:var(--text-dim); font-size:0.85em; margin-top:12px;">Click each component card below to understand why each piece exists. All four must be reviewed before the question unlocks.</p>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Review All Four Structural Components</div>
    <p style="color:var(--text-dim); font-size:0.85em;">Click each card to read the explanation. All four must be reviewed before the question unlocks.</p>
    <div class="concept-grid">

      <div class="concept-card" id="card-m1-0" onclick="visitCard('m1', 0, 4)">
        <h3>src/ Package</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">PYTHON MODULE</p>
        <p>Where your Python modules live. The <code>__init__.py</code> file makes <code>src/</code> importable as a Python package. Without it, <code>from src.your_class import YourClass</code> raises a <code>ModuleNotFoundError</code>.</p>
        <p style="margin-top:10px; font-size:0.85em;">Create it with: <code>touch src/__init__.py</code></p>
        <div class="code-block" style="margin-top:10px;">
          <span class="code-lang-tag">python</span>
          <pre><code># main.py — imports work because of __init__.py
from src.your_class import YourClass
from src.aggregator  import YourAggregator</code></pre>
        </div>
      </div>

      <div class="concept-card" id="card-m1-1" onclick="visitCard('m1', 1, 4)">
        <h3>data/ Directory</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">TEST FIXTURE</p>
        <p>Your sample input JSON goes here. Create realistic test data — at least 5 records. This file is your first test fixture and drives your class design. If you cannot fill 5 records with real-looking data, your schema needs more thought.</p>
        <p style="margin-top:10px; font-size:0.85em;">Make it realistic: use real-looking IPs, timestamps, severity labels. Not <code>"field": "value1"</code>.</p>
        <div class="code-block" style="margin-top:10px;">
          <span class="code-lang-tag">json</span>
          <pre><code>[
  {
    "source_ip":  "203.0.113.42",
    "event_type": "port_scan",
    "severity":   "HIGH",
    "timestamp":  "2024-01-15T10:30:00Z"
  },
  {
    "source_ip":  "10.0.1.33",
    "event_type": "malware_detected",
    "severity":   "CRITICAL",
    "timestamp":  "2024-01-15T10:31:00Z"
  }
]</code></pre>
        </div>
      </div>

      <div class="concept-card" id="card-m1-2" onclick="visitCard('m1', 2, 4)">
        <h3>output/ Directory</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">REPORT TARGET</p>
        <p>Generated reports go here. The <code>.gitkeep</code> file is an empty placeholder that keeps the empty folder tracked by git. Your code creates the actual report files at runtime — the output directory just needs to exist before the first run.</p>
        <p style="margin-top:10px; font-size:0.85em;">Use <code>Path("output/").mkdir(exist_ok=True)</code> to create it programmatically if it is missing.</p>
        <div class="code-block" style="margin-top:10px;">
          <span class="code-lang-tag">python</span>
          <pre><code>from pathlib import Path

output_path = Path("output/report.json")
# Create the directory if it doesn't exist
output_path.parent.mkdir(exist_ok=True)

with open(output_path, "w") as f:
    json.dump(report, f, indent=2)</code></pre>
        </div>
      </div>

      <div class="concept-card" id="card-m1-3" onclick="visitCard('m1', 3, 4)">
        <h3>main.py Entry Point</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">PIPELINE RUNNER</p>
        <p>The script users run with <code>python main.py</code>. Contains the <code>main()</code> function and the <code>if __name__ == "__main__": main()</code> guard. Imports from <code>src/</code>. Keeps orchestration logic here, business logic in <code>src/</code>.</p>
        <p style="margin-top:10px; font-size:0.85em;">The guard prevents <code>main()</code> from running when the file is imported as a module during testing.</p>
        <div class="code-block" style="margin-top:10px;">
          <span class="code-lang-tag">python</span>
          <pre><code>from src.aggregator import LogAggregator
import json

def main():
    agg = LogAggregator()
    agg.load_logs("data/sample_input.json")
    report = agg.generate_report()
    with open("output/report.json", "w") as f:
        json.dump(report, f, indent=2)
    print("Report written.")

if __name__ == "__main__":
    main()</code></pre>
        </div>
      </div>

    </div>
    <div id="card-m1-status" style="color:var(--text-dim); font-size:0.8em; margin-top:8px; letter-spacing:1px;">0 / 4 components reviewed</div>
  </div>

  <div class="panel" id="m1-question-panel" style="display:none">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Structure Check</div>
    <div class="quiz-question" id="q1-0">
      <p><strong>Q1:</strong> What file must exist inside <code>src/</code> to make it importable as a Python package?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">setup.py</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">requirements.txt</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, true)">__init__.py</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">module.py</button>
      </div>
    </div>
    <div id="m1-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 02 — CORE_CLASS
// ===================================================
MISSION_RENDERERS[2] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Your Core Model Class</div>
    <p>Your model class represents one record from your input JSON. It converts a raw dict into a typed Python object with attributes and behavior. This is the most important class in your capstone — it is where the business logic lives.</p>
    <p style="margin-top:12px;">Study this complete example. Your own class will follow the same four-method pattern — <code>__init__</code>, a private scoring method, a decision method, and <code>to_dict()</code>.</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code><span class="cm"># src/threat_event.py</span>

<span class="kw">class</span> <span class="tp">ThreatEvent</span>:
    <span class="cm">"""Represents one security event from the input log."""</span>

    <span class="cm"># Class-level constants — shared by all instances</span>
    RISK_SCORES = {
        <span class="str">"malware_detected"</span>: <span class="num">95</span>,
        <span class="str">"data_exfil"</span>:       <span class="num">90</span>,
        <span class="str">"port_scan"</span>:         <span class="num">70</span>,
        <span class="str">"failed_auth"</span>:       <span class="num">50</span>,
        <span class="str">"info_gather"</span>:       <span class="num">30</span>,
    }

    <span class="kw">def</span> <span class="fn">__init__</span>(<span class="kw">self</span>, source_ip, event_type, severity, details=<span class="str">""</span>):
        <span class="kw">self</span>.source_ip  = source_ip
        <span class="kw">self</span>.event_type = event_type
        <span class="kw">self</span>.severity   = severity
        <span class="kw">self</span>.details    = details
        <span class="kw">self</span>.risk_score = <span class="kw">self</span>.<span class="fn">_calculate_risk</span>()  <span class="cm"># always calculated on creation</span>

    <span class="kw">def</span> <span class="fn">_calculate_risk</span>(<span class="kw">self</span>):
        <span class="cm">"""Private helper. Returns risk score 0-100 based on event type."""</span>
        base = <span class="tp">ThreatEvent</span>.RISK_SCORES.<span class="fn">get</span>(<span class="kw">self</span>.event_type, <span class="num">20</span>)
        severity_boost = {<span class="str">"critical"</span>: <span class="num">5</span>, <span class="str">"high"</span>: <span class="num">2</span>, <span class="str">"medium"</span>: <span class="num">0</span>}
        boost = severity_boost.<span class="fn">get</span>(<span class="kw">self</span>.severity.<span class="fn">lower</span>(), <span class="num">0</span>)
        <span class="kw">return</span> <span class="fn">min</span>(<span class="num">100</span>, base + boost)

    <span class="kw">def</span> <span class="fn">is_critical</span>(<span class="kw">self</span>):
        <span class="cm">"""Returns True if this event requires immediate attention."""</span>
        <span class="kw">return</span> <span class="kw">self</span>.risk_score >= <span class="num">80</span> <span class="kw">or</span> <span class="kw">self</span>.severity.<span class="fn">lower</span>() == <span class="str">"critical"</span>

    <span class="kw">def</span> <span class="fn">to_dict</span>(<span class="kw">self</span>):
        <span class="cm">"""Serializes this event to a plain dict for json.dump()."""</span>
        <span class="kw">return</span> {
            <span class="str">"source_ip"</span>:   <span class="kw">self</span>.source_ip,
            <span class="str">"event_type"</span>:  <span class="kw">self</span>.event_type,
            <span class="str">"severity"</span>:    <span class="kw">self</span>.severity,
            <span class="str">"risk_score"</span>:  <span class="kw">self</span>.risk_score,
            <span class="str">"is_critical"</span>: <span class="kw">self</span>.<span class="fn">is_critical</span>(),
            <span class="str">"details"</span>:     <span class="kw">self</span>.details,
        }

    <span class="kw">def</span> <span class="fn">__repr__</span>(<span class="kw">self</span>):
        <span class="kw">return</span> (<span class="str">f'ThreatEvent("{self.source_ip}", "{self.event_type}", '</span>
                <span class="str">f'score={self.risk_score})'</span>)</code></pre>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Four Methods — Why Each Exists</div>
    <p>Every capstone model class needs these four components. Each serves a distinct purpose. Study all four before answering the quiz.</p>
    <div class="concept-grid">

      <div class="concept-card">
        <h3>__init__: Store and Score</h3>
        <p>Stores all data from the raw JSON record as typed attributes. Immediately calls <code>_calculate_risk()</code> so every instance has its score from the moment it is created. Never store raw dicts in production — convert to typed objects.</p>
        <div class="code-block" style="margin-top:10px;">
          <span class="code-lang-tag">python</span>
          <pre><code><span class="kw">def</span> <span class="fn">__init__</span>(<span class="kw">self</span>, source_ip, event_type, severity):
    <span class="kw">self</span>.source_ip  = source_ip
    <span class="kw">self</span>.event_type = event_type
    <span class="kw">self</span>.severity   = severity
    <span class="kw">self</span>.risk_score = <span class="kw">self</span>.<span class="fn">_calculate_risk</span>()</code></pre>
        </div>
      </div>

      <div class="concept-card">
        <h3>_calculate_risk: Business Logic</h3>
        <p>Leading underscore signals a private helper — not intended to be called from outside the class. Uses the class-level dict with <code>.get(key, default)</code> so unknown event types do not crash. Called once in <code>__init__</code> and stored as an attribute.</p>
        <div class="code-block" style="margin-top:10px;">
          <span class="code-lang-tag">python</span>
          <pre><code><span class="kw">def</span> <span class="fn">_calculate_risk</span>(<span class="kw">self</span>):
    <span class="cm"># .get() returns 20 if event_type unknown</span>
    base = <span class="tp">ThreatEvent</span>.RISK_SCORES.<span class="fn">get</span>(
        <span class="kw">self</span>.event_type, <span class="num">20</span>
    )
    <span class="kw">return</span> <span class="fn">min</span>(<span class="num">100</span>, base)</code></pre>
        </div>
      </div>

      <div class="concept-card">
        <h3>is_critical: Decision Method</h3>
        <p>Returns a bool combining two criteria with <code>or</code>. Method names starting with <code>is_</code> are a Python convention for boolean checks. Avoid <code>if ... return True else return False</code> — the expression itself is already a bool.</p>
        <div class="code-block" style="margin-top:10px;">
          <span class="code-lang-tag">python</span>
          <pre><code><span class="cm"># WRONG — redundant if/else</span>
<span class="kw">def</span> <span class="fn">is_critical</span>(<span class="kw">self</span>):
    <span class="kw">if</span> <span class="kw">self</span>.risk_score >= <span class="num">80</span>:
        <span class="kw">return</span> <span class="kw">True</span>
    <span class="kw">else</span>:
        <span class="kw">return</span> <span class="kw">False</span>

<span class="cm"># RIGHT — expression is already a bool</span>
<span class="kw">def</span> <span class="fn">is_critical</span>(<span class="kw">self</span>):
    <span class="kw">return</span> <span class="kw">self</span>.risk_score >= <span class="num">80</span></code></pre>
        </div>
      </div>

      <div class="concept-card">
        <h3>to_dict: Serialization</h3>
        <p><code>json.dump()</code> cannot serialize class instances — it only handles plain dicts, lists, strings, numbers, and booleans. <code>to_dict()</code> converts the object to a plain dict Python's JSON library can handle. Always include this method — output JSON is built by calling <code>to_dict()</code> on every object.</p>
        <div class="code-block" style="margin-top:10px;">
          <span class="code-lang-tag">python</span>
          <pre><code><span class="kw">def</span> <span class="fn">to_dict</span>(<span class="kw">self</span>):
    <span class="kw">return</span> {
        <span class="str">"source_ip"</span>:   <span class="kw">self</span>.source_ip,
        <span class="str">"risk_score"</span>:  <span class="kw">self</span>.risk_score,
        <span class="str">"is_critical"</span>: <span class="kw">self</span>.<span class="fn">is_critical</span>(),
    }

<span class="cm"># Usage in generate_report():</span>
critical_events = [
    e.<span class="fn">to_dict</span>() <span class="kw">for</span> e <span class="kw">in</span> <span class="kw">self</span>.events
    <span class="kw">if</span> e.<span class="fn">is_critical</span>()
]</code></pre>
        </div>
      </div>

    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Core Class Check &mdash; 4 Questions</div>
    <p>Answer all four correctly to unlock Mission 03.</p>

    <div class="quiz-question" id="q2-0">
      <p><strong>Q1:</strong> Why is <code>_calculate_risk()</code> called inside <code>__init__</code>?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">To make the method public so tests can call it directly</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, true)">So every ThreatEvent has its risk_score set the moment it is created</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">Because Python requires all methods to be called in __init__</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">To prevent the method from being called more than once</button>
      </div>
    </div>

    <div class="quiz-question" id="q2-1">
      <p><strong>Q2:</strong> What does the leading underscore in <code>_calculate_risk</code> signal?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, false)">The method is abstract and must be overridden by subclasses</button>
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, false)">The method is protected and can only be accessed from a subclass</button>
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, true)">It is an internal helper not intended to be called from outside the class</button>
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, false)">The method returns a private value that cannot be serialized</button>
      </div>
    </div>

    <div class="quiz-question" id="q2-2">
      <p><strong>Q3:</strong> Why must every capstone class have a <code>to_dict()</code> method?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, false)">Because Python classes cannot be printed without converting to a dict first</button>
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, false)">To satisfy the argparse interface requirement for CLI tools</button>
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, true)">Because json.dump() cannot serialize class instances — it only handles plain dicts</button>
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, false)">To make it easier to store the object in a database</button>
      </div>
    </div>

    <div class="quiz-question" id="q2-3">
      <p><strong>Q4:</strong> What should <code>is_critical()</code> return?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, false)">The string "CRITICAL" or "OK" depending on the score</button>
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, true)">A boolean (True or False) — never a string or number</button>
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, false)">The integer risk_score so callers can compare it themselves</button>
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, false)">None — it should print the result directly to the console</button>
      </div>
    </div>

    <div id="m2-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 03 — AGGREGATOR
// ===================================================
MISSION_RENDERERS[3] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">The Processor Class</div>
    <p>The aggregator is the engine. It owns the list of model objects, drives loading from files, and generates the final report. While your model class represents <em>one</em> record, the aggregator represents the <em>collection</em> and all the work done across it.</p>
    <p style="margin-top:12px;">Study this complete example. The pattern — <code>load_logs()</code> creates model instances, <code>generate_report()</code> builds the output dict — appears in every security tool ever built.</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code><span class="cm"># src/aggregator.py</span>
<span class="kw">import</span> json
<span class="kw">from</span> collections <span class="kw">import</span> Counter
<span class="kw">from</span> src.threat_event <span class="kw">import</span> <span class="tp">ThreatEvent</span>

<span class="kw">class</span> <span class="tp">LogAggregator</span>:
    <span class="cm">"""Owns the collection of ThreatEvent objects and drives processing."""</span>

    <span class="kw">def</span> <span class="fn">__init__</span>(<span class="kw">self</span>):
        <span class="kw">self</span>.events = []   <span class="cm"># list of ThreatEvent objects</span>

    <span class="kw">def</span> <span class="fn">load_logs</span>(<span class="kw">self</span>, file_path):
        <span class="cm">"""Reads JSON file and converts each record to a ThreatEvent."""</span>
        <span class="kw">with</span> <span class="fn">open</span>(file_path) <span class="kw">as</span> f:
            records = json.<span class="fn">load</span>(f)
        <span class="kw">for</span> record <span class="kw">in</span> records:
            event = <span class="tp">ThreatEvent</span>(
                source_ip  = record[<span class="str">"source_ip"</span>],
                event_type = record[<span class="str">"event_type"</span>],
                severity   = record[<span class="str">"severity"</span>],
                details    = record.<span class="fn">get</span>(<span class="str">"details"</span>, <span class="str">""</span>),
            )
            <span class="kw">self</span>.events.<span class="fn">append</span>(event)

    <span class="kw">def</span> <span class="fn">get_critical_events</span>(<span class="kw">self</span>):
        <span class="cm">"""Returns list of ThreatEvent objects where is_critical() is True."""</span>
        <span class="kw">return</span> [e <span class="kw">for</span> e <span class="kw">in</span> <span class="kw">self</span>.events <span class="kw">if</span> e.<span class="fn">is_critical</span>()]

    <span class="kw">def</span> <span class="fn">generate_report</span>(<span class="kw">self</span>):
        <span class="cm">"""Builds the output dict. Called once — result passed to json.dump()."""</span>
        critical = <span class="kw">self</span>.<span class="fn">get_critical_events</span>()
        source_counts = <span class="tp">Counter</span>(e.source_ip <span class="kw">for</span> e <span class="kw">in</span> <span class="kw">self</span>.events)
        top_source, top_count = source_counts.<span class="fn">most_common</span>(<span class="num">1</span>)[<span class="num">0</span>]

        <span class="kw">return</span> {
            <span class="str">"total_events"</span>:   <span class="fn">len</span>(<span class="kw">self</span>.events),
            <span class="str">"critical_count"</span>: <span class="fn">len</span>(critical),
            <span class="str">"top_sources"</span>:    <span class="str">f"{top_source} (\u00d7{top_count})"</span>,
            <span class="str">"critical_events"</span>: [e.<span class="fn">to_dict</span>() <span class="kw">for</span> e <span class="kw">in</span> critical],
        }</code></pre>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Two-Class Architecture</div>
    <p>The model class represents <strong>one item</strong>. The aggregator represents the <strong>collection</strong> and drives processing. This pattern appears in every security tool ever written — ThreatEvent+LogAggregator, Vulnerability+VulnScanner, Finding+ReportGenerator.</p>
    <div class="hint-box">
      <strong>The pattern in plain English:</strong> Your model class knows about one record. Your aggregator class knows about all the records and how to turn them into a report. They work together — the aggregator creates model instances and calls their methods.
    </div>
    <table style="width:100%; border-collapse:collapse; margin-top:16px; font-size:0.88em;">
      <thead>
        <tr style="border-bottom:1px solid var(--border);">
          <th style="text-align:left; padding:8px 12px; color:var(--text-dim); letter-spacing:1px; font-weight:600;">Class</th>
          <th style="text-align:left; padding:8px 12px; color:var(--text-dim); letter-spacing:1px; font-weight:600;">Role</th>
          <th style="text-align:left; padding:8px 12px; color:var(--text-dim); letter-spacing:1px; font-weight:600;">Key Methods</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom:1px solid var(--border);">
          <td style="padding:10px 12px;"><code>ThreatEvent</code></td>
          <td style="padding:10px 12px; color:var(--text-dim);">Model — one record</td>
          <td style="padding:10px 12px;"><code>_calculate_risk()</code>, <code>is_critical()</code>, <code>to_dict()</code></td>
        </tr>
        <tr>
          <td style="padding:10px 12px;"><code>LogAggregator</code></td>
          <td style="padding:10px 12px; color:var(--text-dim);">Manager — collection</td>
          <td style="padding:10px 12px;"><code>load_logs()</code>, <code>get_critical_events()</code>, <code>generate_report()</code></td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Aggregator Check</div>
    <div class="quiz-question" id="q3-0">
      <p><strong>Q1:</strong> What method in <code>LogAggregator</code> converts raw JSON dicts into <code>ThreatEvent</code> objects?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">generate_report()</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, true)">load_logs()</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">get_critical_events()</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">__init__()</button>
      </div>
    </div>
    <div id="m3-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 04 — JSON_IO
// ===================================================
MISSION_RENDERERS[4] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Reading JSON Input</div>
    <p>Reading your input file is the entry point of your entire tool. Get this pattern right and the rest of the pipeline flows naturally. Use <code>json.load()</code> with a context manager, use <code>pathlib.Path</code> for cross-platform paths, and distinguish between required and optional fields when building your objects.</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code><span class="kw">import</span> json
<span class="kw">from</span> pathlib <span class="kw">import</span> Path

<span class="cm"># Load a JSON array from file</span>
<span class="kw">with</span> <span class="fn">open</span>(<span class="tp">Path</span>(<span class="str">"data/sample_input.json"</span>)) <span class="kw">as</span> f:
    records = json.<span class="fn">load</span>(f)   <span class="cm"># returns a Python list</span>

<span class="cm"># Loop and create objects</span>
<span class="kw">for</span> record <span class="kw">in</span> records:
    event = <span class="tp">ThreatEvent</span>(
        source_ip  = record[<span class="str">"source_ip"</span>],    <span class="cm"># required — crashes if missing</span>
        event_type = record[<span class="str">"event_type"</span>],   <span class="cm"># required</span>
        severity   = record[<span class="str">"severity"</span>],     <span class="cm"># required</span>
        details    = record.<span class="fn">get</span>(<span class="str">"details"</span>, <span class="str">""</span>),  <span class="cm"># optional — safe default</span>
    )
    <span class="kw">self</span>.events.<span class="fn">append</span>(event)</code></pre>
    </div>
    <div class="concept-grid">
      <div class="concept-card">
        <h3>json.load() vs json.loads()</h3>
        <p><code>json.load(f)</code> reads from a file object. <code>json.loads(s)</code> parses a string. For reading files, always use <code>json.load()</code> inside a <code>with open()</code> block. The <code>with</code> statement closes the file automatically.</p>
      </div>
      <div class="concept-card">
        <h3>pathlib.Path</h3>
        <p><code>Path("data/sample_input.json")</code> works on Windows, macOS, and Linux — slash vs backslash is handled automatically. Prefer it over raw strings for all file paths in your capstone.</p>
      </div>
      <div class="concept-card">
        <h3>Required vs Optional Fields</h3>
        <p>Use <code>record["field"]</code> for required fields — it crashes loudly if missing, which is correct. Use <code>record.get("field", default)</code> for optional fields — it returns the default silently if the key is absent.</p>
      </div>
      <div class="concept-card">
        <h3>Validate Early</h3>
        <p>If a required field is missing, your tool should crash with a clear error — not silently produce wrong output. A <code>KeyError</code> with the field name is better than a tool that writes a report with zero events and no explanation.</p>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent" style="background:var(--green-primary);"></div>
    <div class="panel-title" style="color:var(--green-primary);">Writing JSON Output</div>
    <p>Writing your output report is the exit point of the pipeline. Use <code>json.dump()</code> with <code>indent=2</code> for readable output. Create the output directory automatically so the tool works from a clean checkout. Consider timestamped filenames to prevent overwriting previous reports.</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code><span class="kw">import</span> json
<span class="kw">from</span> pathlib <span class="kw">import</span> Path
<span class="kw">from</span> datetime <span class="kw">import</span> datetime

<span class="cm"># Basic output — fixed filename</span>
output_path = <span class="tp">Path</span>(<span class="str">"output/report.json"</span>)
output_path.parent.<span class="fn">mkdir</span>(exist_ok=<span class="kw">True</span>)  <span class="cm"># create output/ if missing</span>

<span class="kw">with</span> <span class="fn">open</span>(output_path, <span class="str">"w"</span>) <span class="kw">as</span> f:
    json.<span class="fn">dump</span>(report, f, indent=<span class="num">2</span>)

<span class="cm"># Timestamped version (prevents overwriting)</span>
ts = datetime.<span class="fn">now</span>().<span class="fn">strftime</span>(<span class="str">"%Y%m%d_%H%M%S"</span>)
output_path = <span class="tp">Path</span>(<span class="str">f"output/report_{ts}.json"</span>)

<span class="cm"># What json.dump() CAN handle:</span>
<span class="cm">#   dict, list, str, int, float, bool, None</span>
<span class="cm"># What json.dump() CANNOT handle:</span>
<span class="cm">#   class instances — must call .to_dict() first</span>
<span class="cm">#   datetime objects — convert with .isoformat()</span>
<span class="cm">#   set objects — convert with list()</span></code></pre>
    </div>
    <div class="concept-grid">
      <div class="concept-card">
        <h3>indent=2</h3>
        <p>Always use <code>indent=2</code>. Without it, <code>json.dump()</code> writes everything on one line. Human-readable output is always the right default for a CLI tool. The file size difference is negligible.</p>
      </div>
      <div class="concept-card">
        <h3>mkdir(exist_ok=True)</h3>
        <p>Creates the directory if it does not exist, and does nothing if it already exists. Without this, the first run on a clean checkout crashes with <code>FileNotFoundError</code>. Always include it before writing output.</p>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">JSON I/O Check</div>
    <div class="quiz-question" id="q4-0">
      <p><strong>Q1:</strong> Why should you use <code>record.get('details', '')</code> instead of <code>record['details']</code> for optional fields?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(4, 0, this, false)">Because .get() is faster than direct key access for large dicts</button>
        <button class="quiz-option" onclick="answerQuiz(4, 0, this, true)">.get() returns the default value if the key is missing, preventing a KeyError crash</button>
        <button class="quiz-option" onclick="answerQuiz(4, 0, this, false)">Because json.load() returns a special dict type that does not support bracket access</button>
        <button class="quiz-option" onclick="answerQuiz(4, 0, this, false)">Because optional fields must always be converted to strings before use</button>
      </div>
    </div>
    <div id="m4-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 05 — PIPELINE
// ===================================================
const pipelineSimState = { seenA: false, seenB: false, seenC: false };

function pipelineLog(text, cls) {
  const term = document.getElementById('pipeline-terminal');
  if (!term) return;
  const line = document.createElement('div');
  line.style.cssText = 'padding:2px 0; font-size:0.88em; font-family:var(--font);';
  if (cls === 'error')   line.style.color = 'var(--red-alert)';
  else if (cls === 'success') line.style.color = 'var(--green-primary)';
  else if (cls === 'warn')    line.style.color = 'var(--amber)';
  else if (cls === 'info')    line.style.color = 'var(--blue-info)';
  else if (cls === 'crit')    line.style.color = 'var(--red-alert)';
  line.textContent = text;
  term.appendChild(line);
  term.scrollTop = term.scrollHeight;
}

function pipelineClear() {
  const term = document.getElementById('pipeline-terminal');
  if (term) term.innerHTML = '';
}

function runPipelineScenario(key) {
  pipelineClear();

  if (key === 'A') {
    pipelineLog('>> Running: python main.py', 'info');
    pipelineLog('   Loading data/sample_input.json...', '');
    pipelineLog('   [OK]   json.load() \u2192 5 records parsed', 'success');
    pipelineLog('   [OK]   Creating ThreatEvent objects...', 'success');
    pipelineLog('   [OK]   ThreatEvent("203.0.113.42", "port_scan")    risk=70  critical=False', 'success');
    pipelineLog('   [OK]   ThreatEvent("198.51.100.7", "failed_auth")  risk=50  critical=False', 'success');
    pipelineLog('   [CRIT] ThreatEvent("10.0.1.33", "malware_detected") risk=95  critical=True  \u26a0', 'crit');
    pipelineLog('   [CRIT] ThreatEvent("10.0.1.44", "data_exfil")      risk=90  critical=True  \u26a0', 'crit');
    pipelineLog('   [OK]   ThreatEvent("198.51.100.7", "failed_auth")  risk=50  critical=False', 'success');
    pipelineLog('   ', '');
    pipelineLog('   Generating report...', '');
    pipelineLog('   [OK]   total_events:   5', 'success');
    pipelineLog('   [CRIT] critical_count: 2', 'crit');
    pipelineLog('   [OK]   top_sources:    198.51.100.7 (\u00d72)', 'success');
    pipelineLog('   ', '');
    pipelineLog('   Writing output/report.json...', '');
    pipelineLog('   [OK]   1,247 bytes written', 'success');
    pipelineLog('   ', '');
    pipelineLog('   MVP pipeline complete.', 'success');

  } else if (key === 'B') {
    pipelineLog('>> Running: python main.py --help', 'info');
    pipelineLog('   ', '');
    pipelineLog('   usage: main.py [-h] [--input INPUT] [--output OUTPUT] [--verbose]', '');
    pipelineLog('   ', '');
    pipelineLog('   Security log aggregator \u2014 reads JSON logs, outputs prioritized alerts', '');
    pipelineLog('   ', '');
    pipelineLog('   options:', '');
    pipelineLog('     -h, --help       show this help message and exit', '');
    pipelineLog('     --input  INPUT   Path to input JSON log file', '');
    pipelineLog('                      (default: data/sample_input.json)', '');
    pipelineLog('     --output OUTPUT  Path to write output report JSON', '');
    pipelineLog('                      (default: output/report.json)', '');
    pipelineLog('     --verbose        Print all events to console', '');
    pipelineLog('   ', '');
    pipelineLog('   [OK] argparse CLI working correctly', 'success');
    pipelineLog('   [OK] --help auto-generated from add_argument() descriptions', 'success');

  } else if (key === 'C') {
    pipelineLog('>> Running: python main.py --verbose', 'info');
    pipelineLog('   ', '');
    pipelineLog('   Loaded 5 events from sample_input.json', '');
    pipelineLog('   ', '');
    pipelineLog('   All events:', '');
    pipelineLog('     ThreatEvent("port_scan",         "203.0.113.42", score=70)', '');
    pipelineLog('     ThreatEvent("failed_auth",       "198.51.100.7", score=50)', '');
    pipelineLog('     ThreatEvent("malware_detected",  "10.0.1.33",    score=95) \u2190 CRITICAL', 'crit');
    pipelineLog('     ThreatEvent("data_exfil",        "10.0.1.44",    score=90) \u2190 CRITICAL', 'crit');
    pipelineLog('     ThreatEvent("failed_auth",       "198.51.100.7", score=50)', '');
    pipelineLog('   ', '');
    pipelineLog('   Results: 5 events | 2 critical', '');
    pipelineLog('   Report saved: output/report.json', '');
    pipelineLog('   ', '');
    pipelineLog('   [OK] __repr__ used for clean event printing', 'success');
    pipelineLog('   [OK] verbose flag passed args.verbose from argparse', 'success');
  }

  pipelineSimState['seen' + key] = true;
  const checkEl = document.getElementById('pipeline-check-' + key);
  if (checkEl) {
    checkEl.style.color = 'var(--green-primary)';
    checkEl.textContent = '\u2713 Scenario ' + key + ' complete';
  }
  pipelineSimCheckComplete();
}

function pipelineSimCheckComplete() {
  if (pipelineSimState.seenA && pipelineSimState.seenB && pipelineSimState.seenC) {
    const statusEl = document.getElementById('m5-status');
    if (statusEl) statusEl.innerHTML = '<span class="status-pass">\u2713 ALL SCENARIOS COMPLETE \u2014 MISSION 05 COMPLETE</span>';
    setTimeout(function() { completeMission(5); }, 800);
  }
}

function initMission5() {
  pipelineSimState.seenA = false;
  pipelineSimState.seenB = false;
  pipelineSimState.seenC = false;
}

MISSION_RENDERERS[5] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">End-to-End Pipeline Demo</div>
    <p>Watch how all three layers connect: the input JSON file, the ThreatEvent model class, and the LogAggregator processor. Run all three scenarios to see your MVP in action. Each scenario demonstrates a different aspect of the pipeline. Analyze all three to unlock the MVP checklist.</p>
    <div class="concept-grid">

      <div class="concept-card">
        <h3>Scenario A</h3>
        <p><strong>Happy Path</strong><br><code>python main.py</code></p>
        <p style="color:var(--text-dim); font-size:0.85em; margin-top:8px;">Five events loaded, two flagged as critical, report written. The core pipeline running end-to-end.</p>
        <button class="btn-run" style="margin-top:14px; font-size:0.8em; padding:8px 16px;" onclick="runPipelineScenario('A')">&#9654; RUN</button>
      </div>

      <div class="concept-card">
        <h3>Scenario B</h3>
        <p><strong>--help Flag</strong><br><code>python main.py --help</code></p>
        <p style="color:var(--text-dim); font-size:0.85em; margin-top:8px;">argparse generates clean help text from your <code>add_argument()</code> descriptions. Test this first — it confirms your CLI is wired correctly.</p>
        <button class="btn-run" style="margin-top:14px; font-size:0.8em; padding:8px 16px;" onclick="runPipelineScenario('B')">&#9654; RUN</button>
      </div>

      <div class="concept-card">
        <h3>Scenario C</h3>
        <p><strong>--verbose Flag</strong><br><code>python main.py --verbose</code></p>
        <p style="color:var(--text-dim); font-size:0.85em; margin-top:8px;"><code>__repr__</code> prints each event cleanly. The verbose flag is passed from <code>args.verbose</code> in your <code>main()</code> function.</p>
        <button class="btn-run" style="margin-top:14px; font-size:0.8em; padding:8px 16px;" onclick="runPipelineScenario('C')">&#9654; RUN</button>
      </div>

    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Pipeline Terminal</div>
    <div id="pipeline-terminal" style="background:var(--bg-editor); border:1px solid var(--border); border-radius:3px; padding:16px; min-height:200px; font-family:var(--font); font-size:0.88em; overflow-y:auto; max-height:520px; white-space:pre-wrap;"></div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Scenarios Completed</div>
    <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:8px;">
      <div id="pipeline-check-A" style="color:var(--text-dim);">&#9744; Scenario A &mdash; Happy Path</div>
      <div id="pipeline-check-B" style="color:var(--text-dim);">&#9744; Scenario B &mdash; --help Flag</div>
      <div id="pipeline-check-C" style="color:var(--text-dim);">&#9744; Scenario C &mdash; --verbose Flag</div>
    </div>
    <div id="m5-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 06 — MVP_CHECK
// ===================================================
const mvpCheckState = new Set();
const MVP_TOTAL = 7;

function checkMvpItem(idx) {
  mvpCheckState.add(idx);
  const item = document.getElementById('mvp-item-' + idx);
  if (item) {
    item.classList.add('checked');
    const box = item.querySelector('.mvp-check-box');
    if (box) {
      box.textContent = '\u2713';
      box.style.color = 'var(--green-primary)';
      box.style.borderColor = 'var(--green-primary)';
    }
  }
  const statusEl = document.getElementById('m6-checklist-status');
  if (statusEl) statusEl.textContent = mvpCheckState.size + ' / ' + MVP_TOTAL + ' items confirmed';
  if (mvpCheckState.size >= MVP_TOTAL) {
    const finalEl = document.getElementById('m6-status');
    if (finalEl) finalEl.innerHTML = '<span class="status-pass">\u2713 MVP CHECKLIST COMPLETE \u2014 MISSION 06 COMPLETE</span>';
    setTimeout(function() { completeMission(6); }, 800);
  }
}

MISSION_RENDERERS[6] = function() {
  return `
  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">MVP Checklist</div>
    <p>Seven concrete deliverables — not plans, implementations. Click each item only after you have completed it. All seven must be confirmed before Week 14 is done and before you begin Week 15 testing.</p>
    <div class="hint-box">
      <strong>This is a completion checklist, not a planning list.</strong> If you click an item you have not actually done, you are only deceiving yourself. The Week 15 grader will run your code from a clean checkout. If it does not work, it does not count.
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Confirm All Seven MVP Items</div>
    <p style="color:var(--text-dim); font-size:0.85em; margin-bottom:16px;">Click each item only after it is implemented and working.</p>

    <div style="display:flex; flex-direction:column; gap:12px;">

      <div id="mvp-item-0" class="proposal-item" onclick="checkMvpItem(0)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="mvp-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Project Structure Created</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I have created my capstone project directory with <code>src/</code>, <code>data/</code>, <code>output/</code>, and <code>tests/</code> subdirectories. Each directory that needs it has an <code>__init__.py</code> file. Running <code>from src.my_class import MyClass</code> does not raise a <code>ModuleNotFoundError</code>.</p>
        </div>
      </div>

      <div id="mvp-item-1" class="proposal-item" onclick="checkMvpItem(1)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="mvp-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Sample Input JSON</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I have a <code>data/sample_input.json</code> file with at least 5 realistic records using the JSON schema I designed in my Week 13 proposal. The file is valid JSON — it passes <code>json.load()</code> without errors. Field names are snake_case and values are realistic, not placeholder strings.</p>
        </div>
      </div>

      <div id="mvp-item-2" class="proposal-item" onclick="checkMvpItem(2)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="mvp-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Core Model Class</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I have implemented my core model class with: <code>__init__</code> storing all attributes, a private scoring or classification method called in <code>__init__</code>, an <code>is_critical()</code> or equivalent method returning a <code>bool</code>, and a <code>to_dict()</code> method returning a plain dict. The class lives in <code>src/</code>.</p>
        </div>
      </div>

      <div id="mvp-item-3" class="proposal-item" onclick="checkMvpItem(3)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="mvp-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Aggregator / Processor Class</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I have implemented a second class that: owns a list of model instances, has a <code>load_logs()</code> or equivalent method that reads my JSON file and creates model objects, and has a <code>generate_report()</code> method that builds the output dict by calling <code>to_dict()</code> on each object.</p>
        </div>
      </div>

      <div id="mvp-item-4" class="proposal-item" onclick="checkMvpItem(4)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="mvp-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Happy Path Runs</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">Running <code>python main.py</code> completes without any Python errors or tracebacks. The tool reads my input JSON, creates model instances, generates a report, and reaches the end of <code>main()</code>. No crashes, no unhandled exceptions.</p>
        </div>
      </div>

      <div id="mvp-item-5" class="proposal-item" onclick="checkMvpItem(5)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="mvp-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Output JSON Written</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">Running <code>python main.py</code> creates a valid <code>output/report.json</code> file. The file contains the correct keys from my <code>generate_report()</code> method, real data derived from my input records, and is parseable as valid JSON — confirmed by opening the file and inspecting it.</p>
        </div>
      </div>

      <div id="mvp-item-6" class="proposal-item" onclick="checkMvpItem(6)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="mvp-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Committed to GitHub</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I have committed my working MVP code to GitHub with a descriptive commit message (e.g., <code>"feat: add ThreatEvent class and LogAggregator MVP"</code>). The commit includes <code>src/</code>, <code>data/sample_input.json</code>, <code>main.py</code>, and a sample <code>output/report.json</code>.</p>
        </div>
      </div>

    </div>

    <div id="m6-checklist-status" style="color:var(--text-dim); font-size:0.8em; margin-top:16px; letter-spacing:1px;">0 / 7 items confirmed</div>
    <div id="m6-status" class="gate-status" style="margin-top:8px;"></div>
  </div>
  `;
};
