// ===== STATE =====
const STORAGE_KEY = 'cvnp2646_w5_progress';

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
  { id: 0, key: 'ORIENTATION', title: 'MISSION 00 — ORIENTATION', subtitle: 'OPERATION BRIEFING',    label: '00\nORIENT',  icon: '⬡' },
  { id: 1, key: 'PATHLIB',     title: 'MISSION 01 — PATHLIB',     subtitle: 'OBJECT-ORIENTED PATHS', label: '01\nPATHLIB', icon: '⬡' },
  { id: 2, key: 'SHUTIL',      title: 'MISSION 02 — SHUTIL',      subtitle: 'FILE OPERATIONS',       label: '02\nSHUTIL',  icon: '⬡' },
  { id: 3, key: 'ENUMERATE',   title: 'MISSION 03 — ENUMERATE',   subtitle: 'LINE TRACKING',         label: '03\nENUM',    icon: '⬡' },
  { id: 4, key: 'FORENSICS',   title: 'MISSION 04 — FORENSICS SIM', subtitle: 'EVIDENCE PRESERVATION', label: '04\nFORENSIC', icon: '⬡' },
  { id: 5, key: 'ORGANIZER',   title: 'MISSION 05 — ORGANIZER SIM', subtitle: 'FILE CLASSIFIER',     label: '05\nORGANIZE', icon: '⬡' },
  { id: 6, key: 'FINAL_CHECK', title: 'MISSION 06 — FINAL CHECK', subtitle: 'DEBRIEF',               label: '06\nFINAL',   icon: '⬡' },
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
    showBriefing('OPERATION PATHFINDER COMPLETE. pathlib, shutil, and enumerate are now part of your toolkit. Your file organizer script handles real investigative work. Commit everything and move to Week 6.', null);
    renderMissionMap();
    updateProgress();
  }
}

// ===== COMMANDER ZHANG BRIEFINGS =====
const BRIEFINGS = [
  'OPERATIVE — pathlib turns file paths into objects with properties. shutil.copy2() preserves timestamps — critical for forensic evidence integrity. enumerate() gives you line numbers. These tools make you a precise investigator, not a guesser. GOOD LUCK.',
  'Orientation confirmed. Mission 01 is pathlib. Paths are objects with properties — name, stem, suffix, parent. Treat them like data, not raw strings.',
  'pathlib confirmed. Mission 02 is shutil. copy2() is the forensic standard. copy() loses timestamps. That difference matters in court.',
  'shutil confirmed. Mission 03 is enumerate. Line numbers are not optional when parsing logs. enumerate(f, start=1) gives you the line number alongside every line.',
  'enumerate confirmed. Mission 04 is the forensics simulator. Run all three scenarios to see what timestamp preservation actually looks like in practice.',
  'Forensics complete. Mission 05 is the organizer simulator. Three phases: scan, sort, archive. Walk through each one.',
  'Organizer complete. Final mission: confirm the Week 5 checklist. Six items. Every one is a concrete deliverable in your script — not a plan, an implementation.',
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
  document.title = 'MISSION ' + String(id).padStart(2, '0') + ' \u2014 ' + (MISSIONS[id] ? MISSIONS[id].key : '') + ' | OPERATION: PATHFINDER';
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
    <div class="panel-title">Week 5: File Operations for Forensic Investigators</div>
    <p>This week you build tools that work with the filesystem like a professional investigator. pathlib gives you object-oriented paths. shutil gives you safe file operations. enumerate gives you line numbers when parsing logs. Together they make your scripts precise and forensically sound.</p>
    <p style="margin-top:12px;">By the end of this week you will have a file organizer that scans a directory, categorizes files by extension, copies evidence with timestamp preservation, and generates a report.</p>
    <div class="concept-grid">
      <div class="concept-card" id="card-ORIENT-0" onclick="visitCard('ORIENT', 0, 3)">
        <h3>pathlib</h3>
        <p>Object-oriented file paths — <code>path.name</code>, <code>path.stem</code>, <code>path.suffix</code>, <code>path.parent</code>, <code>path.exists()</code>, <code>path.iterdir()</code></p>
      </div>
      <div class="concept-card" id="card-ORIENT-1" onclick="visitCard('ORIENT', 1, 3)">
        <h3>shutil</h3>
        <p>High-level file operations — <code>copy()</code>, <code>copy2()</code> preserves metadata, <code>make_archive()</code>, <code>move()</code></p>
      </div>
      <div class="concept-card" id="card-ORIENT-2" onclick="visitCard('ORIENT', 2, 3)">
        <h3>enumerate</h3>
        <p>Add counters to iterables — <code>enumerate(lines, start=1)</code> gives <code>(line_num, line)</code> tuples</p>
      </div>
    </div>
    <div id="card-ORIENT-status" style="color:var(--text-dim); font-size:0.8em; margin-top:8px; letter-spacing:1px;">0 / 3 components reviewed</div>
  </div>

  <div class="panel" id="ORIENT-question-panel" style="display:none">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Orientation Check &mdash; 3 Questions</div>
    <p>Answer all three correctly to unlock Mission 01.</p>

    <div class="quiz-question" id="q0-0">
      <p><strong>Q1:</strong> Which pathlib property returns just the filename with extension?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, true)">.name</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">.stem</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">.suffix</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">.parent</button>
      </div>
    </div>

    <div class="quiz-question" id="q0-1">
      <p><strong>Q2:</strong> Why use <code>shutil.copy2()</code> instead of <code>shutil.copy()</code> for forensic evidence?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">It's faster</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, true)">It preserves file timestamps and metadata</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">It compresses files</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">It creates checksums</button>
      </div>
    </div>

    <div class="quiz-question" id="q0-2">
      <p><strong>Q3:</strong> What does <code>enumerate(lines, start=1)</code> return for the first item?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">(0, first_line)</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, true)">(1, first_line)</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">(first_line, 1)</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">just the line number</button>
      </div>
    </div>

    <div id="m0-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 01 — PATHLIB
// ===================================================
MISSION_RENDERERS[1] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">pathlib: Object-Oriented File Paths</div>
    <p>pathlib replaces string-based path manipulation with proper objects. Instead of splitting strings on slashes, you access <code>.name</code>, <code>.stem</code>, <code>.suffix</code>, and <code>.parent</code> as properties. Review all four cards to unlock the question.</p>
    <p style="color:var(--text-dim); font-size:0.85em; margin-top:8px;">Click each card to mark it reviewed. All four must be reviewed before the question unlocks.</p>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Review All Four pathlib Components</div>
    <div class="concept-grid">

      <div class="concept-card" id="card-m1-0" onclick="visitCard('m1', 0, 4)">
        <h3>path.name</h3>
        <div class="code-block"><pre><code><span class="kw">from</span> pathlib <span class="kw">import</span> <span class="tp">Path</span>
p = <span class="tp">Path</span>(<span class="str">'/logs/auth.log'</span>)
<span class="fn">print</span>(p.name)   <span class="cm"># auth.log</span></code></pre></div>
      </div>

      <div class="concept-card" id="card-m1-1" onclick="visitCard('m1', 1, 4)">
        <h3>path.stem / path.suffix</h3>
        <div class="code-block"><pre><code><span class="fn">print</span>(p.stem)   <span class="cm"># auth</span>
<span class="fn">print</span>(p.suffix) <span class="cm"># .log</span></code></pre></div>
      </div>

      <div class="concept-card" id="card-m1-2" onclick="visitCard('m1', 2, 4)">
        <h3>path.parent / path.exists()</h3>
        <div class="code-block"><pre><code><span class="fn">print</span>(p.parent) <span class="cm"># /logs</span>
<span class="fn">print</span>(p.<span class="fn">exists</span>())  <span class="cm"># True or False</span></code></pre></div>
      </div>

      <div class="concept-card" id="card-m1-3" onclick="visitCard('m1', 3, 4)">
        <h3>path.iterdir() / path.glob()</h3>
        <div class="code-block"><pre><code><span class="kw">for</span> f <span class="kw">in</span> <span class="tp">Path</span>(<span class="str">'.'</span>).<span class="fn">iterdir</span>():
    <span class="fn">print</span>(f)
<span class="kw">for</span> f <span class="kw">in</span> <span class="tp">Path</span>(<span class="str">'.'</span>).<span class="fn">glob</span>(<span class="str">'*.log'</span>):
    <span class="fn">print</span>(f)</code></pre></div>
      </div>

    </div>
    <div id="card-m1-status" style="color:var(--text-dim); font-size:0.8em; margin-top:8px; letter-spacing:1px;">0 / 4 components reviewed</div>
  </div>

  <div class="panel" id="m1-question-panel" style="display:none">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">pathlib Check</div>
    <div class="quiz-question" id="q1-0">
      <p><strong>Q1:</strong> A Path object points to <code>/data/evidence/capture.pcap</code>. What does <code>path.stem</code> return?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">capture.pcap</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, true)">capture</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">.pcap</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">/data/evidence</button>
      </div>
    </div>
    <div id="m1-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 02 — SHUTIL
// ===================================================
MISSION_RENDERERS[2] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">shutil: High-Level File Operations</div>
    <p>shutil provides file copying, moving, and archiving functions. For forensic work, the distinction between <code>copy()</code> and <code>copy2()</code> is critical — one preserves timestamps, the other does not. Review all four cards then answer the questions.</p>
    <p style="color:var(--text-dim); font-size:0.85em; margin-top:8px;">Click each card to mark it reviewed. All four must be reviewed before the questions unlock.</p>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Review All Four shutil Components</div>
    <div class="concept-grid">

      <div class="concept-card" id="card-m2-0" onclick="visitCard('m2', 0, 4)">
        <h3>shutil.copy()</h3>
        <p>Copies file content only. Does <strong>NOT</strong> preserve metadata or timestamps.</p>
        <div class="code-block"><pre><code><span class="kw">import</span> shutil
shutil.<span class="fn">copy</span>(<span class="str">'src.log'</span>, <span class="str">'backup/'</span>)</code></pre></div>
      </div>

      <div class="concept-card" id="card-m2-1" onclick="visitCard('m2', 1, 4)">
        <h3>shutil.copy2()</h3>
        <p>Copies content AND preserves timestamps. <strong>USE FOR FORENSICS.</strong></p>
        <div class="code-block"><pre><code>shutil.<span class="fn">copy2</span>(<span class="str">'evidence.pcap'</span>, <span class="str">'backup/'</span>)</code></pre></div>
      </div>

      <div class="concept-card" id="card-m2-2" onclick="visitCard('m2', 2, 4)">
        <h3>shutil.move()</h3>
        <p>Moves or renames a file. Works across filesystems.</p>
        <div class="code-block"><pre><code>shutil.<span class="fn">move</span>(<span class="str">'temp.log'</span>, <span class="str">'archive/temp.log'</span>)</code></pre></div>
      </div>

      <div class="concept-card" id="card-m2-3" onclick="visitCard('m2', 3, 4)">
        <h3>shutil.make_archive()</h3>
        <p>Creates a zip or tar archive of a directory.</p>
        <div class="code-block"><pre><code>shutil.<span class="fn">make_archive</span>(<span class="str">'backup_2024'</span>, <span class="str">'zip'</span>, <span class="str">'evidence/'</span>)</code></pre></div>
      </div>

    </div>
    <div id="card-m2-status" style="color:var(--text-dim); font-size:0.8em; margin-top:8px; letter-spacing:1px;">0 / 4 components reviewed</div>
  </div>

  <div class="panel" id="m2-question-panel" style="display:none">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">shutil Check &mdash; 4 Questions</div>

    <div class="quiz-question" id="q2-0">
      <p><strong>Q1:</strong> You need to copy evidence files preserving timestamps. Which function do you use?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">shutil.copy</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, true)">shutil.copy2()</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">shutil.move</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">shutil.archive</button>
      </div>
    </div>

    <div class="quiz-question" id="q2-1">
      <p><strong>Q2:</strong> <code>shutil.make_archive('report', 'zip', 'logs/')</code> creates what filename?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, false)">logs.zip</button>
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, true)">report.zip</button>
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, false)">report.tar</button>
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, false)">archive.zip</button>
      </div>
    </div>

    <div class="quiz-question" id="q2-2">
      <p><strong>Q3:</strong> Which shutil function can rename a file?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, false)">shutil.copy2</button>
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, false)">shutil.rename</button>
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, true)">shutil.move()</button>
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, false)">shutil.copy</button>
      </div>
    </div>

    <div class="quiz-question" id="q2-3">
      <p><strong>Q4:</strong> For forensic evidence backup, <code>shutil.copy2()</code> matters because it preserves:</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, false)">File size</button>
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, true)">Timestamps and metadata</button>
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, false)">File permissions</button>
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, false)">Directory structure</button>
      </div>
    </div>

    <div id="m2-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 03 — ENUMERATE
// ===================================================
MISSION_RENDERERS[3] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">enumerate: Line Numbers When Parsing Logs</div>
    <p>When you parse a log file looking for suspicious entries, you need to know which line a match came from. enumerate() adds a counter to any iterable without maintaining a separate variable. Review all three cards then answer the question.</p>
    <p style="color:var(--text-dim); font-size:0.85em; margin-top:8px;">Click each card to mark it reviewed. All three must be reviewed before the question unlocks.</p>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Review All Three enumerate Components</div>
    <div class="concept-grid">

      <div class="concept-card" id="card-m3-0" onclick="visitCard('m3', 0, 3)">
        <h3>Basic enumerate</h3>
        <div class="code-block"><pre><code><span class="kw">for</span> i, line <span class="kw">in</span> <span class="fn">enumerate</span>(lines):
    <span class="fn">print</span>(i, line)  <span class="cm"># 0-indexed</span></code></pre></div>
      </div>

      <div class="concept-card" id="card-m3-1" onclick="visitCard('m3', 1, 3)">
        <h3>enumerate with start=1</h3>
        <div class="code-block"><pre><code><span class="kw">for</span> num, line <span class="kw">in</span> <span class="fn">enumerate</span>(lines, start=<span class="num">1</span>):
    <span class="fn">print</span>(<span class="str">f"Line {num}: {line}"</span>)</code></pre></div>
      </div>

      <div class="concept-card" id="card-m3-2" onclick="visitCard('m3', 2, 3)">
        <h3>Real use case</h3>
        <div class="code-block"><pre><code><span class="kw">with</span> <span class="fn">open</span>(<span class="str">'auth.log'</span>) <span class="kw">as</span> f:
    <span class="kw">for</span> num, line <span class="kw">in</span> <span class="fn">enumerate</span>(f, start=<span class="num">1</span>):
        <span class="kw">if</span> <span class="str">'FAILED'</span> <span class="kw">in</span> line:
            <span class="fn">print</span>(<span class="str">f"Line {num}: {line.strip()}"</span>)</code></pre></div>
      </div>

    </div>
    <div id="card-m3-status" style="color:var(--text-dim); font-size:0.8em; margin-top:8px; letter-spacing:1px;">0 / 3 components reviewed</div>
  </div>

  <div class="panel" id="m3-question-panel" style="display:none">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">enumerate Check</div>
    <div class="quiz-question" id="q3-0">
      <p><strong>Q1:</strong> You want line numbers starting at 1, not 0. What's the correct call?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">enumerate(lines)</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, true)">enumerate(lines, 1)</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">enumerate(lines, 0)</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">index(lines, 1)</button>
      </div>
    </div>
    <div id="m3-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 04 — FORENSICS SIM
// ===================================================

let forensicsSimState = { copy: false, copy2: false, archive: false };

function runForensicsScenario(key) {
  const terminal = document.getElementById('forensics-terminal');
  if (!terminal) return;

  let lines = [];

  if (key === 'copy') {
    lines = [
      'WARNING: shutil.copy() used — original timestamps LOST',
      'File copied but atime/mtime reset to now',
      'FORENSIC INTEGRITY: COMPROMISED',
    ];
    forensicsSimState.copy = true;
  } else if (key === 'copy2') {
    lines = [
      'Using shutil.copy2()...',
      'File content copied',
      'Original timestamps preserved: atime=2024-01-15 03:47:22 mtime=2024-01-15 03:47:22',
      'FORENSIC INTEGRITY: MAINTAINED \u2713',
    ];
    forensicsSimState.copy2 = true;
  } else if (key === 'archive') {
    lines = [
      'Creating timestamped evidence archive...',
      "shutil.make_archive('evidence_20240115', 'zip', 'evidence/')",
      'Archive created: evidence_20240115.zip (2.3 MB)',
      'Hash: sha256:a4f2b8c9...',
      'ARCHIVE COMPLETE \u2713',
    ];
    forensicsSimState.archive = true;
  }

  const existing = terminal.textContent ? terminal.textContent + '\n\n' : '';
  terminal.textContent = existing + '> RUN: ' + key.toUpperCase() + '\n' + lines.join('\n');
  terminal.scrollTop = terminal.scrollHeight;

  if (forensicsSimState.copy && forensicsSimState.copy2 && forensicsSimState.archive) {
    setTimeout(function() {
      terminal.textContent += '\n\n\u2713 ALL SCENARIOS COMPLETE — FORENSICS SIM PASSED';
      completeMission(4);
    }, 600);
  }
}

function resetForensicsSim() {
  forensicsSimState = { copy: false, copy2: false, archive: false };
  const terminal = document.getElementById('forensics-terminal');
  if (terminal) terminal.textContent = '';
}

MISSION_RENDERERS[4] = function() {
  return `
  <div class="panel">
    <div class="panel-accent red"></div>
    <div class="panel-title red">Forensics Simulator — Evidence Preservation</div>
    <p>Run all three scenarios to see what each shutil function does to file timestamps. Forensic investigators must understand this distinction — evidence copied incorrectly may be inadmissible.</p>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Run All Three Scenarios</div>
    <p>Click each button to simulate running the corresponding command on evidence files. Run all three to complete the mission.</p>
    <div class="gate-controls">
      <button class="btn-run" onclick="runForensicsScenario('copy')">RUN: shutil.copy()</button>
      <button class="btn-run" onclick="runForensicsScenario('copy2')">RUN: shutil.copy2()</button>
      <button class="btn-run" onclick="runForensicsScenario('archive')">RUN: make_archive()</button>
      <button class="btn-reset" onclick="resetForensicsSim()">RESET</button>
    </div>
    <div class="gate-output" id="forensics-terminal"></div>
  </div>
  `;
};


// ===================================================
// MISSION 05 — ORGANIZER SIM
// ===================================================

let organizerSimState = { scan: false, sort: false, archive: false };

function runOrganizerScenario(key) {
  const terminal = document.getElementById('organizer-terminal');
  if (!terminal) return;

  let lines = [];

  if (key === 'scan') {
    lines = [
      'Scanning /uploads/ ...',
      'Found: malware_sample.exe (.exe)',
      'Found: network_capture.pcap (.pcap)',
      'Found: access_log.log (.log)',
      'Found: report.pdf (.pdf)',
      'Found: config_backup.json (.json)',
      'Scan complete: 5 files found',
    ];
    organizerSimState.scan = true;
  } else if (key === 'sort') {
    lines = [
      'Organizing by extension...',
      'Moving malware_sample.exe \u2192 executables/',
      'Moving network_capture.pcap \u2192 captures/',
      'Moving access_log.log \u2192 logs/',
      'Moving report.pdf \u2192 reports/',
      'Moving config_backup.json \u2192 configs/',
      'Organization complete \u2713',
    ];
    organizerSimState.sort = true;
  } else if (key === 'archive') {
    lines = [
      'Creating archive of organized evidence...',
      'Archiving executables/ \u2192 executables_20240115.zip',
      'Archiving captures/ \u2192 captures_20240115.zip',
      'Archiving logs/ \u2192 logs_20240115.zip',
      'All evidence archived and ready for analysis \u2713',
    ];
    organizerSimState.archive = true;
  }

  const existing = terminal.textContent ? terminal.textContent + '\n\n' : '';
  terminal.textContent = existing + '> RUN: ' + key.toUpperCase() + '\n' + lines.join('\n');
  terminal.scrollTop = terminal.scrollHeight;

  if (organizerSimState.scan && organizerSimState.sort && organizerSimState.archive) {
    setTimeout(function() {
      terminal.textContent += '\n\n\u2713 ALL SCENARIOS COMPLETE — ORGANIZER SIM PASSED';
      completeMission(5);
    }, 600);
  }
}

function resetOrganizerSim() {
  organizerSimState = { scan: false, sort: false, archive: false };
  const terminal = document.getElementById('organizer-terminal');
  if (terminal) terminal.textContent = '';
}

MISSION_RENDERERS[5] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Organizer Simulator — File Classifier</div>
    <p>Walk through the three phases of a file organizer: scan the directory, sort files by extension into category folders, and create an archive. Run all three in order to complete the mission.</p>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Run All Three Phases</div>
    <div class="gate-controls">
      <button class="btn-run" onclick="runOrganizerScenario('scan')">RUN: SCAN DIRECTORY</button>
      <button class="btn-run" onclick="runOrganizerScenario('sort')">RUN: SORT BY TYPE</button>
      <button class="btn-run" onclick="runOrganizerScenario('archive')">RUN: CREATE ARCHIVE</button>
      <button class="btn-reset" onclick="resetOrganizerSim()">RESET</button>
    </div>
    <div class="gate-output" id="organizer-terminal"></div>
  </div>
  `;
};


// ===================================================
// MISSION 06 — FINAL CHECK
// ===================================================

const FINAL_CHECKLIST_W5 = [
  'pathlib Path objects created and properties accessed (name, stem, suffix, parent)',
  'Directory created with Path.mkdir(exist_ok=True)',
  'Files listed with Path.iterdir() or Path.glob()',
  'Evidence copied with shutil.copy2() preserving timestamps',
  'Log file parsed with enumerate(f, start=1) for line numbers',
  'File organizer script working: reads dir, copies by extension, creates archive',
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
    if (statusEl) statusEl.innerHTML = '<span class="status-pass">\u2713 ALL ITEMS CONFIRMED \u2014 WEEK 5 COMPLETE</span>';
    setTimeout(function() { completeMission(6); }, 600);
  }
}

MISSION_RENDERERS[6] = function() {
  const items = FINAL_CHECKLIST_W5.map(function(text, i) {
    return `
    <div style="display:flex; align-items:flex-start; gap:12px; padding:10px 0; border-bottom:1px solid var(--border);">
      <button id="final-cb-${i}" class="quiz-option" style="min-width:36px; text-align:center; flex-shrink:0;" onclick="toggleFinalCheck(${i})">[ ]</button>
      <span style="font-size:0.9em; line-height:1.5;">${text}</span>
    </div>`;
  }).join('');

  return `
  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Mission 06 — Final Check: Week 5 Debrief</div>
    <p>Confirm each item is complete in your Week 5 script. Click each checkbox when done. All six must be confirmed to complete the week.</p>
    ${items}
    <div id="final-count" style="color:var(--text-dim); font-size:0.8em; margin-top:12px; letter-spacing:1px;">0 / ${FINAL_TOTAL} confirmed</div>
    <div id="m6-status" class="gate-status" style="margin-top:12px;"></div>
  </div>
  `;
};
