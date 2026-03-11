// ===== STATE =====
const STORAGE_KEY = 'cvnp2646_w4_progress';

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
  { id: 0, key: 'ORIENTATION', label: '00\nORIENT',   icon: '⬡' },
  { id: 1, key: 'FILE_OPS',    label: '01\nFILES',    icon: '⬡' },
  { id: 2, key: 'JSON_PARSE',  label: '02\nJSON',     icon: '⬡' },
  { id: 3, key: 'MODULES',     label: '03\nMODULES',  icon: '⬡' },
  { id: 4, key: 'GIT_BASICS',  label: '04\nGIT',      icon: '⬡' },
  { id: 5, key: 'THREAT_SIM',  label: '05\nSIMULATE', icon: '⬡' },
  { id: 6, key: 'FINAL_CHECK', label: '06\nFINAL',    icon: '⬡' },
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
    showBriefing('OPERATION FILED COMPLETE. Context managers protect file resources. JSON feeds are parsed and transformed. Code is organized in reusable modules. Changes are tracked in Git. You can now build and maintain professional security data pipelines. Outstanding work, Analyst.', null);
    renderMissionMap();
    updateProgress();
  }
}

// ===== COMMANDER ZHANG BRIEFINGS =====
const BRIEFINGS = [
  'Welcome to OPERATION: FILED. Real security work processes files \u2014 logs, scan results, threat intelligence feeds, configuration data. This week you learn to do it safely: context managers, JSON parsing, modular code, and version control. These are the patterns that separate scripts from professional tools.',
  'Orientation complete. Now master file operations. Context managers close files automatically even when errors occur. File modes determine what you can do \u2014 and \u201cw\u201d erases existing content. Know the difference between every mode before touching security evidence.',
  'File operations confirmed. Now parse JSON. Every security API returns JSON. Four functions cover everything: loads(), dumps(), load(), dump(). The \u201cs\u201d means string. No \u201cs\u201d means file. Memorize these four and you can work with any threat intelligence source.',
  'JSON mastered. Now organize code into modules. Security tools grow beyond one file. utils.py for utility functions. file_ops.py for I/O. main.py to orchestrate. Write once, import everywhere. Fix a bug in one module and every tool using it benefits.',
  'Modules confirmed. Now use Git for version control. Every change to a security tool is tracked, documented, and reversible. Git is not optional \u2014 it is the audit trail for your code.',
  'Security file operations established. Run the threat intel simulator. Watch a JSON feed get parsed, filtered by severity, and transformed into a firewall blocklist.',
  'Final checks stand between you and a complete file operations toolkit. Confirm every item to complete OPERATION: FILED.',
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
  const totalMap = { 0: 3, 1: 4, 2: 4, 3: 1, 4: 4, 5: 0, 6: 0 };
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
  document.title = 'MISSION ' + String(id).padStart(2, '0') + ' \u2014 ' + (MISSIONS[id] ? MISSIONS[id].key : '') + ' | OPERATION: FILED';
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
    <div class="panel-title">Professional File and Data Operations</div>
    <p>Security tools don't work in memory only — they read logs, write reports, exchange data. Every authentication log, every scan result, every threat feed is a file. Done incorrectly: resource leaks, locked files, corrupted evidence, lost data. Done correctly with context managers: automatic cleanup even when errors occur.</p>
  </div>

  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Week 4 Skill Stack</div>
    <ul style="list-style:none; padding:0; display:flex; flex-direction:column; gap:10px;">
      <li style="padding:10px 14px; background:var(--bg-deep); border:1px solid var(--border); border-radius:3px;"><code>with open()</code> &mdash; context manager, file always closes even if exception occurs</li>
      <li style="padding:10px 14px; background:var(--bg-deep); border:1px solid var(--border); border-radius:3px;">File modes: <code>'r'</code> read, <code>'w'</code> write (ERASES existing), <code>'a'</code> append, <code>'rb'</code> binary read</li>
      <li style="padding:10px 14px; background:var(--bg-deep); border:1px solid var(--border); border-radius:3px;">JSON: <code>json.loads()</code> parse string, <code>json.dumps()</code> serialize to string, <code>json.load()</code> from file, <code>json.dump()</code> to file</li>
      <li style="padding:10px 14px; background:var(--bg-deep); border:1px solid var(--border); border-radius:3px;">Modules: split code across files (<code>utils.py</code>, <code>file_ops.py</code>, <code>main.py</code>) for reuse and testing</li>
      <li style="padding:10px 14px; background:var(--bg-deep); border:1px solid var(--border); border-radius:3px;">Git: <code>init</code>, <code>add</code>, <code>commit</code>, <code>push</code> &mdash; the four commands that cover 90% of daily version control</li>
    </ul>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Orientation Check &mdash; 3 Questions</div>
    <p>Answer all three correctly to unlock Mission 01.</p>

    <div class="quiz-question" id="q0-0">
      <p><strong>Q1:</strong> What is the main advantage of using <code>with open()</code> over <code>open()</code> + <code>close()</code>?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">It is faster</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, true)">It automatically closes the file even if an error occurs</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">It can open multiple files at once</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">It prevents other programs from reading the file</button>
      </div>
    </div>

    <div class="quiz-question" id="q0-1">
      <p><strong>Q2:</strong> JSON stands for:</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">Java Syntax Object Notation</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, true)">JavaScript Object Notation</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">Just Standard Object Notation</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">JSON Standard Object Notation</button>
      </div>
    </div>

    <div class="quiz-question" id="q0-2">
      <p><strong>Q3:</strong> Which file mode ERASES existing file content?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)"><code>'r'</code> &mdash; read only, cannot write</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)"><code>'a'</code> &mdash; appends to end</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, true)"><code>'w'</code> &mdash; creates new or overwrites existing</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)"><code>'x'</code> &mdash; fails if file already exists</button>
      </div>
    </div>

    <div id="m0-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 01 — FILE_OPS
// ===================================================
MISSION_RENDERERS[1] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">File Operations with Context Managers</div>
    <p>Context managers guarantee your files close properly. Explore all four cards below to unlock the mission questions.</p>
    <p style="color:var(--text-dim); font-size:0.85em; margin-top:12px;">Click each card to read the explanation. All four must be reviewed before the questions unlock.</p>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Review All Four File Operations Components</div>
    <p style="color:var(--text-dim); font-size:0.85em;">Click each card to read the explanation. All four must be reviewed before the questions unlock.</p>
    <div class="concept-grid">

      <div class="concept-card" id="card-FILE_OPS-0" onclick="visitCard('FILE_OPS', 0, 4)">
        <h3>Context Managers (the with statement)</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">FOUNDATION</p>
        <div class="code-block" style="margin-top:10px;">
          <pre><code><span class="cm"># OLD WAY — dangerous</span>
f = <span class="fn">open</span>(<span class="str">'security.log'</span>, <span class="str">'r'</span>)
data = f.<span class="fn">read</span>()
<span class="cm"># If error occurs here, f.close() never runs!</span>
f.<span class="fn">close</span>()

<span class="cm"># NEW WAY — context manager</span>
<span class="kw">with</span> <span class="fn">open</span>(<span class="str">'security.log'</span>, <span class="str">'r'</span>) <span class="kw">as</span> f:
    data = f.<span class="fn">read</span>()
<span class="cm"># File automatically closed when block exits
# Guaranteed — even if exception occurs inside

# Multiple files in one with statement</span>
<span class="kw">with</span> <span class="fn">open</span>(<span class="str">'input.log'</span>, <span class="str">'r'</span>) <span class="kw">as</span> infile, \
     <span class="fn">open</span>(<span class="str">'report.txt'</span>, <span class="str">'w'</span>) <span class="kw">as</span> outfile:
    <span class="kw">for</span> line <span class="kw">in</span> infile:
        outfile.<span class="fn">write</span>(<span class="fn">process</span>(line))</code></pre>
        </div>
      </div>

      <div class="concept-card" id="card-FILE_OPS-1" onclick="visitCard('FILE_OPS', 1, 4)">
        <h3>File Modes Reference</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">CRITICAL KNOWLEDGE</p>
        <div class="code-block" style="margin-top:10px;">
          <pre><code><span class="cm"># 'r' — read only (default)</span>
<span class="kw">with</span> <span class="fn">open</span>(<span class="str">'auth.log'</span>, <span class="str">'r'</span>) <span class="kw">as</span> f:
    content = f.<span class="fn">read</span>()    <span class="cm"># reads entire file</span>

<span class="cm"># 'w' — write (CREATES new or OVERWRITES existing)</span>
<span class="kw">with</span> <span class="fn">open</span>(<span class="str">'report.txt'</span>, <span class="str">'w'</span>) <span class="kw">as</span> f:
    f.<span class="fn">write</span>(<span class="str">"=== Report ===\n"</span>)   <span class="cm"># erases previous!</span>

<span class="cm"># 'a' — append (adds to end, preserves existing)</span>
<span class="kw">with</span> <span class="fn">open</span>(<span class="str">'report.txt'</span>, <span class="str">'a'</span>) <span class="kw">as</span> f:
    f.<span class="fn">write</span>(<span class="str">"Additional finding\n"</span>)   <span class="cm"># safe for logs</span>

<span class="cm"># 'x' — exclusive create (fails if file exists)</span>
<span class="kw">with</span> <span class="fn">open</span>(<span class="str">'new_report.txt'</span>, <span class="str">'x'</span>) <span class="kw">as</span> f:
    f.<span class="fn">write</span>(<span class="str">"New report"</span>)   <span class="cm"># error if file exists</span>

<span class="cm"># 'rb' — read binary (for non-text files)</span>
<span class="kw">with</span> <span class="fn">open</span>(<span class="str">'malware.exe'</span>, <span class="str">'rb'</span>) <span class="kw">as</span> f:
    raw_bytes = f.<span class="fn">read</span>()</code></pre>
        </div>
      </div>

      <div class="concept-card" id="card-FILE_OPS-2" onclick="visitCard('FILE_OPS', 2, 4)">
        <h3>Reading Files Line by Line</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">MEMORY EFFICIENCY</p>
        <div class="code-block" style="margin-top:10px;">
          <pre><code><span class="cm"># Memory-efficient: read one line at a time
# Critical for large security logs (gigabytes)</span>
<span class="kw">with</span> <span class="fn">open</span>(<span class="str">'security.log'</span>, <span class="str">'r'</span>) <span class="kw">as</span> f:
    <span class="kw">for</span> line_num, line <span class="kw">in</span> <span class="fn">enumerate</span>(f, start=<span class="num">1</span>):
        line = line.<span class="fn">strip</span>()  <span class="cm"># remove newline</span>
        <span class="kw">if</span> <span class="str">'FAIL'</span> <span class="kw">in</span> line:
            <span class="fn">print</span>(<span class="str">f"Line {line_num}: {line}"</span>)

<span class="cm"># Read all lines into a list (careful with huge files)</span>
<span class="kw">with</span> <span class="fn">open</span>(<span class="str">'small_log.txt'</span>, <span class="str">'r'</span>) <span class="kw">as</span> f:
    lines = f.<span class="fn">readlines</span>()  <span class="cm"># list of strings</span>

<span class="cm"># Read entire file as one string</span>
<span class="kw">with</span> <span class="fn">open</span>(<span class="str">'config.json'</span>, <span class="str">'r'</span>) <span class="kw">as</span> f:
    content = f.<span class="fn">read</span>()  <span class="cm"># single string</span></code></pre>
        </div>
      </div>

      <div class="concept-card" id="card-FILE_OPS-3" onclick="visitCard('FILE_OPS', 3, 4)">
        <h3>Writing Reports Safely</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">SECURITY PATTERN</p>
        <div class="code-block" style="margin-top:10px;">
          <pre><code>failed_attempts = {<span class="str">'203.0.113.45'</span>: <span class="num">3</span>, <span class="str">'198.51.100.22'</span>: <span class="num">1</span>}

<span class="cm"># Write initial report (creates or overwrites)</span>
<span class="kw">with</span> <span class="fn">open</span>(<span class="str">'security_report.txt'</span>, <span class="str">'w'</span>) <span class="kw">as</span> f:
    f.<span class="fn">write</span>(<span class="str">"=== Security Alert Report ===\n"</span>)
    <span class="kw">for</span> ip, count <span class="kw">in</span> failed_attempts.<span class="fn">items</span>():
        <span class="kw">if</span> count >= <span class="num">3</span>:
            f.<span class="fn">write</span>(<span class="str">f"CRITICAL: Brute force from {ip} ({count} attempts)\n"</span>)

<span class="cm"># Append additional findings later</span>
<span class="kw">with</span> <span class="fn">open</span>(<span class="str">'security_report.txt'</span>, <span class="str">'a'</span>) <span class="kw">as</span> f:
    f.<span class="fn">write</span>(<span class="str">"\n--- Recommendations ---\n"</span>)
    f.<span class="fn">write</span>(<span class="str">"Block 203.0.113.45 at firewall level.\n"</span>)

<span class="cm"># CRITICAL RULE: Never use 'w' when you mean 'a'
# 'w' silently destroys all existing content</span></code></pre>
        </div>
      </div>

    </div>
    <div id="card-FILE_OPS-status" style="color:var(--text-dim); font-size:0.8em; margin-top:8px; letter-spacing:1px;">0 / 4 components reviewed</div>
  </div>

  <div class="panel" id="FILE_OPS-question-panel" style="display:none">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">File Operations Check &mdash; 4 Questions</div>
    <p>Answer all four correctly to unlock Mission 02.</p>

    <div class="quiz-question" id="q1-0">
      <p><strong>Q1:</strong> You need to add entries to an existing security log without erasing it. Which mode do you use?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)"><code>'w'</code> &mdash; erases existing content</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)"><code>'r'</code> &mdash; read only</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, true)"><code>'a'</code> &mdash; append to end</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)"><code>'x'</code> &mdash; fails if file exists</button>
      </div>
    </div>

    <div class="quiz-question" id="q1-1">
      <p><strong>Q2:</strong> What does iterating <code>for line in f:</code> do when <code>f</code> is an open file?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(1, 1, this, false)">Reads the entire file into memory then iterates</button>
        <button class="quiz-option" onclick="answerQuiz(1, 1, this, true)">Reads one line at a time &mdash; memory efficient for large logs</button>
        <button class="quiz-option" onclick="answerQuiz(1, 1, this, false)">Reads the file in 4KB chunks</button>
        <button class="quiz-option" onclick="answerQuiz(1, 1, this, false)">Requires calling f.readlines() first</button>
      </div>
    </div>

    <div class="quiz-question" id="q1-2">
      <p><strong>Q3:</strong> Which mode would you use to read a .pcap network capture file?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(1, 2, this, false)"><code>'r'</code> &mdash; text mode may corrupt binary data</button>
        <button class="quiz-option" onclick="answerQuiz(1, 2, this, true)"><code>'rb'</code> &mdash; binary read preserves all bytes exactly</button>
        <button class="quiz-option" onclick="answerQuiz(1, 2, this, false)"><code>'a'</code> &mdash; append mode</button>
        <button class="quiz-option" onclick="answerQuiz(1, 2, this, false)"><code>'w'</code> &mdash; write mode</button>
      </div>
    </div>

    <div class="quiz-question" id="q1-3">
      <p><strong>Q4:</strong> After the <code>with</code> block exits, what happens to the file?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(1, 3, this, false)">It stays open until the program ends</button>
        <button class="quiz-option" onclick="answerQuiz(1, 3, this, false)">You must call f.close() explicitly</button>
        <button class="quiz-option" onclick="answerQuiz(1, 3, this, true)">It is automatically closed, even if an exception occurred</button>
        <button class="quiz-option" onclick="answerQuiz(1, 3, this, false)">It depends on whether an error occurred</button>
      </div>
    </div>

    <div id="m1-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 02 — JSON_PARSE
// ===================================================
MISSION_RENDERERS[2] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">JSON &mdash; The Language of Security APIs</div>
    <p>Every security API returns JSON. Four functions cover everything. Click each card to learn the complete JSON toolkit.</p>
    <p style="color:var(--text-dim); font-size:0.85em; margin-top:12px;">Click each card to read the explanation. All four must be reviewed before the questions unlock.</p>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Review All Four JSON Components</div>
    <p style="color:var(--text-dim); font-size:0.85em;">Click each card to read the explanation. All four must be reviewed before the questions unlock.</p>
    <div class="concept-grid">

      <div class="concept-card" id="card-JSON_PARSE-0" onclick="visitCard('JSON_PARSE', 0, 4)">
        <h3>JSON Structure</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">DATA FORMAT</p>
        <div class="code-block" style="margin-top:10px;">
          <pre><code>{
  <span class="str">"ip"</span>: <span class="str">"203.0.113.45"</span>,
  <span class="str">"threat_score"</span>: <span class="num">85</span>,
  <span class="str">"categories"</span>: [<span class="str">"brute_force"</span>, <span class="str">"port_scan"</span>],
  <span class="str">"malicious"</span>: <span class="kw">true</span>,
  <span class="str">"first_seen"</span>: <span class="str">"2024-01-08"</span>,
  <span class="str">"source"</span>: {
    <span class="str">"name"</span>: <span class="str">"ThreatFeed"</span>,
    <span class="str">"confidence"</span>: <span class="num">0.95</span>
  }
}</code></pre>
        </div>
        <p style="font-size:0.82em; margin-top:10px; color:var(--text-dim);">JSON objects <code>{}</code> &rarr; Python <code>dict</code>. Arrays <code>[]</code> &rarr; <code>list</code>. <code>true</code>/<code>false</code> &rarr; <code>True</code>/<code>False</code>. <code>null</code> &rarr; <code>None</code>.</p>
      </div>

      <div class="concept-card" id="card-JSON_PARSE-1" onclick="visitCard('JSON_PARSE', 1, 4)">
        <h3>The Four JSON Functions</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">CORE TOOLKIT</p>
        <div class="code-block" style="margin-top:10px;">
          <pre><code><span class="kw">import</span> json

<span class="cm"># 1. loads() — JSON STRING → Python dict</span>
data = json.<span class="fn">loads</span>(json_string)

<span class="cm"># 2. dumps() — Python dict → JSON STRING</span>
json_string = json.<span class="fn">dumps</span>(data, indent=<span class="num">2</span>)

<span class="cm"># 3. load() — read JSON FROM FILE</span>
<span class="kw">with</span> <span class="fn">open</span>(<span class="str">'threat_feed.json'</span>, <span class="str">'r'</span>) <span class="kw">as</span> f:
    data = json.<span class="fn">load</span>(f)

<span class="cm"># 4. dump() — write Python dict TO FILE</span>
<span class="kw">with</span> <span class="fn">open</span>(<span class="str">'blocklist.json'</span>, <span class="str">'w'</span>) <span class="kw">as</span> f:
    json.<span class="fn">dump</span>(blocklist, f, indent=<span class="num">2</span>)</code></pre>
        </div>
        <p style="font-size:0.82em; margin-top:10px; color:var(--amber);">The 's' means string. No 's' means file. Memorize this.</p>
      </div>

      <div class="concept-card" id="card-JSON_PARSE-2" onclick="visitCard('JSON_PARSE', 2, 4)">
        <h3>Accessing Nested JSON</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">NAVIGATION</p>
        <div class="code-block" style="margin-top:10px;">
          <pre><code>feed = {
    <span class="str">"feed_name"</span>: <span class="str">"CyberThreat Daily"</span>,
    <span class="str">"threats"</span>: [
        {<span class="str">"ip"</span>: <span class="str">"203.0.113.45"</span>, <span class="str">"severity"</span>: <span class="str">"high"</span>}
    ]
}

<span class="cm"># Access top-level key</span>
feed[<span class="str">'feed_name'</span>]          <span class="cm"># "CyberThreat Daily"</span>

<span class="cm"># Access list element</span>
feed[<span class="str">'threats'</span>][<span class="num">0</span>][<span class="str">'ip'</span>]   <span class="cm"># "203.0.113.45"</span>

<span class="cm"># Iterate through list</span>
<span class="kw">for</span> threat <span class="kw">in</span> feed[<span class="str">'threats'</span>]:
    <span class="fn">print</span>(threat[<span class="str">'ip'</span>])

<span class="cm"># Safe access — no KeyError if key missing</span>
score = threat.<span class="fn">get</span>(<span class="str">'threat_score'</span>, <span class="num">0</span>)</code></pre>
        </div>
      </div>

      <div class="concept-card" id="card-JSON_PARSE-3" onclick="visitCard('JSON_PARSE', 3, 4)">
        <h3>Building and Writing Blocklists</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">FULL PIPELINE</p>
        <div class="code-block" style="margin-top:10px;">
          <pre><code><span class="kw">import</span> json

<span class="kw">with</span> <span class="fn">open</span>(<span class="str">'threat_feed.json'</span>, <span class="str">'r'</span>) <span class="kw">as</span> f:
    feed = json.<span class="fn">load</span>(f)

blocklist = {<span class="str">"name"</span>: <span class="str">"Critical Threats"</span>, <span class="str">"ips"</span>: []}

<span class="kw">for</span> threat <span class="kw">in</span> feed[<span class="str">'threats'</span>]:
    <span class="kw">if</span> threat[<span class="str">'severity'</span>] == <span class="str">'critical'</span>:
        blocklist[<span class="str">'ips'</span>].<span class="fn">append</span>({
            <span class="str">"ip"</span>: threat[<span class="str">'ip'</span>],
            <span class="str">"attacks"</span>: threat[<span class="str">'attacks_count'</span>]
        })

<span class="kw">with</span> <span class="fn">open</span>(<span class="str">'blocklist.json'</span>, <span class="str">'w'</span>) <span class="kw">as</span> f:
    json.<span class="fn">dump</span>(blocklist, f, indent=<span class="num">2</span>)

<span class="cm"># Display for verification</span>
<span class="fn">print</span>(json.<span class="fn">dumps</span>(blocklist, indent=<span class="num">2</span>))</code></pre>
        </div>
      </div>

    </div>
    <div id="card-JSON_PARSE-status" style="color:var(--text-dim); font-size:0.8em; margin-top:8px; letter-spacing:1px;">0 / 4 components reviewed</div>
  </div>

  <div class="panel" id="JSON_PARSE-question-panel" style="display:none">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">JSON Check &mdash; 4 Questions</div>
    <p>Answer all four correctly to unlock Mission 03.</p>

    <div class="quiz-question" id="q2-0">
      <p><strong>Q1:</strong> Which function converts a Python dictionary to a JSON-formatted string?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)"><code>json.load()</code> &mdash; reads from file</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)"><code>json.loads()</code> &mdash; parses a string to dict</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, true)"><code>json.dumps()</code> &mdash; dict to string</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)"><code>json.dump()</code> &mdash; writes to file</button>
      </div>
    </div>

    <div class="quiz-question" id="q2-1">
      <p><strong>Q2:</strong> You receive a JSON API response as a string. Which function do you use to access it as a Python dict?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, false)"><code>json.load()</code> &mdash; reads from a file</button>
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, true)"><code>json.loads()</code> &mdash; loads from a string</button>
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, false)"><code>json.dump()</code> &mdash; writes to file</button>
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, false)"><code>json.read()</code> &mdash; not a JSON function</button>
      </div>
    </div>

    <div class="quiz-question" id="q2-2">
      <p><strong>Q3:</strong> In JSON, <code>true</code> (lowercase) maps to which Python value?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, false)"><code>'true'</code> as a string</button>
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, false)"><code>1</code> as an integer</button>
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, true)"><code>True</code> &mdash; Python boolean</button>
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, false)"><code>'True'</code> as a string</button>
      </div>
    </div>

    <div class="quiz-question" id="q2-3">
      <p><strong>Q4:</strong> What does <code>json.dumps(data, indent=2)</code> produce compared to <code>json.dumps(data)</code>?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, false)">Exactly the same output</button>
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, false)">A smaller, compressed JSON string</button>
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, true)">A human-readable, indented JSON string</button>
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, false)">A binary representation</button>
      </div>
    </div>

    <div id="m2-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 03 — MODULES
// ===================================================
MISSION_RENDERERS[3] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Modular Code Organization</div>
    <p>Instead of one 500-line security_tool.py, split code into purpose-built modules. Each module has one job.</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code><span class="cm"># Instead of one 500-line security_tool.py:</span>

utils.py          <span class="cm">← IP validation, threat scoring, helper functions</span>
file_ops.py       <span class="cm">← load_blocklist(), save_report(), all I/O</span>
main.py           <span class="cm">← imports from both, orchestrates the workflow</span>

<span class="cm"># In main.py:</span>
<span class="kw">from</span> utils <span class="kw">import</span> validate_ip, calculate_threat_score
<span class="kw">from</span> file_ops <span class="kw">import</span> load_blocklist, save_report</code></pre>
    </div>
    <ul style="list-style:none; padding:0; display:flex; flex-direction:column; gap:8px; margin-top:16px;">
      <li style="padding:8px 14px; background:var(--bg-deep); border:1px solid var(--border); border-radius:3px; font-size:0.9em;">Write <code>validate_ip()</code> once in <code>utils.py</code>, use it in 10 different security tools</li>
      <li style="padding:8px 14px; background:var(--bg-deep); border:1px solid var(--border); border-radius:3px; font-size:0.9em;">Test <code>utils.py</code> independently &mdash; no I/O side effects to work around</li>
      <li style="padding:8px 14px; background:var(--bg-deep); border:1px solid var(--border); border-radius:3px; font-size:0.9em;">Fix a bug in <code>file_ops.py</code> and every tool that imports it gets the fix</li>
      <li style="padding:8px 14px; background:var(--bg-deep); border:1px solid var(--border); border-radius:3px; font-size:0.9em;">Teams can work on different modules simultaneously without conflicts</li>
    </ul>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Import Patterns</div>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code><span class="cm"># Import entire module (explicit namespace)</span>
<span class="kw">import</span> utils
result = utils.<span class="fn">validate_ip</span>(<span class="str">"192.168.1.1"</span>)

<span class="cm"># Import specific functions (most common for security tools)</span>
<span class="kw">from</span> utils <span class="kw">import</span> validate_ip
result = <span class="fn">validate_ip</span>(<span class="str">"192.168.1.1"</span>)

<span class="cm"># Import with alias (avoid name conflicts)</span>
<span class="kw">from</span> utils <span class="kw">import</span> calculate_threat_score <span class="kw">as</span> score_it
result = <span class="fn">score_it</span>(<span class="num">156</span>, <span class="str">'critical'</span>)

<span class="cm"># Import multiple functions at once</span>
<span class="kw">from</span> utils <span class="kw">import</span> validate_ip, calculate_threat_score

<span class="cm"># Import standard library modules</span>
<span class="kw">import</span> json, sys, os
<span class="kw">from</span> pathlib <span class="kw">import</span> <span class="tp">Path</span>
<span class="kw">from</span> collections <span class="kw">import</span> <span class="tp">Counter</span>

<span class="cm"># AVOID: import * (wildcard imports pollute the namespace)
# from utils import *   ← bad practice in security code</span></code></pre>
    </div>
    <div class="hint-box">
      <strong>Key principle:</strong> Use <code>from module import function</code> for clarity &mdash; it is explicit about what you are using.
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Modules Check</div>
    <div class="quiz-question" id="q3-0">
      <p><strong>Q1:</strong> You have <code>validate_ip()</code> in <code>utils.py</code>. How do you import ONLY that function into <code>main.py</code>?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)"><code>import utils.validate_ip</code> &mdash; invalid syntax</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, true)"><code>from utils import validate_ip</code></button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)"><code>import validate_ip from utils</code> &mdash; reversed syntax</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)"><code>include utils.validate_ip</code> &mdash; not Python syntax</button>
      </div>
    </div>
    <div id="m3-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 04 — GIT_BASICS
// ===================================================
MISSION_RENDERERS[4] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Git Version Control for Security Tools</div>
    <p>Git is not optional in professional security development. Every change is tracked, documented, and reversible.</p>
    <table>
      <thead><tr><th>Reason</th><th>Why Git Provides It</th></tr></thead>
      <tbody>
        <tr><td>Audit trail</td><td>Who changed what firewall rule, when, and why?</td></tr>
        <tr><td>Collaboration</td><td>Multiple analysts working on the same detection script</td></tr>
        <tr><td>Backup</td><td>Hard drive dies? Code is on GitHub/GitLab.</td></tr>
        <tr><td>Rollback</td><td>New detection algorithm breaks things? <code>git revert</code>.</td></tr>
        <tr><td>Compliance</td><td>SOC 2, PCI DSS, ISO 27001 all require change management</td></tr>
      </tbody>
    </table>
    <div class="hint-box" style="margin-top:16px;">
      <strong>"It was working before" is only useful if you can show the exact diff that broke it.</strong> Every professional security team uses Git for tool development.
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">The Five Core Git Commands</div>
    <div class="code-block">
      <span class="code-lang-tag">bash</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code><span class="cm"># 1. Initialize a new repository in current directory</span>
git init

<span class="cm"># 2. See what's changed (run this constantly)</span>
git status

<span class="cm"># 3. Stage files for commit</span>
git add utils.py          <span class="cm"># specific file</span>
git add .                 <span class="cm"># all changed files</span>

<span class="cm"># 4. Create a snapshot with a message</span>
git commit -m <span class="str">"Add IP validation to utils module"</span>
<span class="cm"># BAD message: "fixes" or "updates"
# GOOD message: "Fix IPv6 address rejection in validate_ip()"</span>

<span class="cm"># 5. Upload to remote (GitHub/GitLab)</span>
git remote add origin https://github.com/user/sec-tools.git
git push -u origin main   <span class="cm"># -u sets up tracking</span>

<span class="cm"># Bonus: see history</span>
git log --oneline         <span class="cm"># compact view</span></code></pre>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Git Check &mdash; 4 Questions</div>
    <p>Answer all four correctly to unlock Mission 05.</p>

    <div class="quiz-question" id="q4-0">
      <p><strong>Q1:</strong> What does <code>git status</code> show?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(4, 0, this, false)">The history of all commits &mdash; that's <code>git log</code></button>
        <button class="quiz-option" onclick="answerQuiz(4, 0, this, true)">Which files have changed since the last commit</button>
        <button class="quiz-option" onclick="answerQuiz(4, 0, this, false)">The current branch name only</button>
        <button class="quiz-option" onclick="answerQuiz(4, 0, this, false)">The remote repository URL</button>
      </div>
    </div>

    <div class="quiz-question" id="q4-1">
      <p><strong>Q2:</strong> You modified <code>utils.py</code> and <code>file_ops.py</code>. To commit ONLY <code>utils.py</code>, you run:</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(4, 1, this, false)"><code>git add . &amp;&amp; git commit</code> &mdash; adds both files</button>
        <button class="quiz-option" onclick="answerQuiz(4, 1, this, true)"><code>git add utils.py &amp;&amp; git commit -m "message"</code></button>
        <button class="quiz-option" onclick="answerQuiz(4, 1, this, false)"><code>git commit utils.py -m "message"</code> &mdash; must stage first</button>
        <button class="quiz-option" onclick="answerQuiz(4, 1, this, false)"><code>git push utils.py</code> &mdash; push uploads, doesn't commit</button>
      </div>
    </div>

    <div class="quiz-question" id="q4-2">
      <p><strong>Q3:</strong> Which commit message follows professional security development conventions?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(4, 2, this, false)"><code>"updates"</code> &mdash; meaningless</button>
        <button class="quiz-option" onclick="answerQuiz(4, 2, this, false)"><code>"bug fix"</code> &mdash; not specific</button>
        <button class="quiz-option" onclick="answerQuiz(4, 2, this, true)"><code>"Add brute force threshold validation to detect_port_scan()"</code></button>
        <button class="quiz-option" onclick="answerQuiz(4, 2, this, false)"><code>"WIP"</code> &mdash; not a final commit message</button>
      </div>
    </div>

    <div class="quiz-question" id="q4-3">
      <p><strong>Q4:</strong> What does <code>-u</code> do in <code>git push -u origin main</code>?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(4, 3, this, false)">Updates the remote repository</button>
        <button class="quiz-option" onclick="answerQuiz(4, 3, this, true)">Sets up tracking so future pushes can just use <code>git push</code></button>
        <button class="quiz-option" onclick="answerQuiz(4, 3, this, false)">Pushes to all branches</button>
        <button class="quiz-option" onclick="answerQuiz(4, 3, this, false)">Forces the push even if there are conflicts</button>
      </div>
    </div>

    <div id="m4-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 05 — THREAT_SIM (simulator)
// ===================================================
const threatSimState = { seenA: false, seenB: false, seenC: false };

function threatLog(text, cls) {
  const term = document.getElementById('threat-terminal');
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

function threatClear() {
  const term = document.getElementById('threat-terminal');
  if (term) term.innerHTML = '';
}

function runThreatScenario(key) {
  threatClear();

  if (key === 'A') {
    threatLog('> Loading scenario: FULL THREAT INTEL PIPELINE', 'info');
    threatLog('>', '');
    threatLog('> Step 1: Reading threat_feed.json', '');
    threatLog('> json.load(f) \u2192 Python dict loaded', 'success');
    threatLog('> Feed: "CyberThreat Daily" \u2014 3 threats', 'success');
    threatLog('>', '');
    threatLog('> Step 2: Filtering by severity', '');
    threatLog('> Checking threat 1: 203.0.113.45 \u2014 severity: high    \u2192 INCLUDE', 'success');
    threatLog('> Checking threat 2: 198.51.100.22 \u2014 severity: medium \u2192 SKIP', 'warn');
    threatLog('> Checking threat 3: 192.0.2.10   \u2014 severity: critical \u2192 INCLUDE', 'success');
    threatLog('>', '');
    threatLog('> Step 3: Building blocklist dict', '');
    threatLog('> blocklist = {', '');
    threatLog('>   "name": "Critical/High Threats",', '');
    threatLog('>   "ips": ["203.0.113.45", "192.0.2.10"]', '');
    threatLog('> }', '');
    threatLog('>', '');
    threatLog('> Step 4: Writing to blocklist.json', '');
    threatLog('> json.dump(blocklist, f, indent=2) \u2192 file written', 'success');
    threatLog('>', '');
    threatLog('> Step 5: Verification \u2014 reading back', '');
    threatLog('> json.load(f) \u2192 confirmed: 2 IPs in blocklist', 'success');
    threatLog('>', '');
    threatLog('> STATUS: PASS \u2014 pipeline complete', 'success');

  } else if (key === 'B') {
    threatLog('> Loading scenario: INVALID JSON INPUT', 'info');
    threatLog('>', '');
    threatLog('> Attempting to parse corrupted threat feed...', '');
    threatLog('>', '');
    threatLog('> Content: \'{"feed": "CyberThreat", "threats": [broken json\'', '');
    threatLog('>', '');
    threatLog('> json.loads(corrupted_string)', '');
    threatLog('>', '');
    threatLog('> Traceback (most recent call last):', 'error');
    threatLog('>   File "threat_intel_parser.py", line 18', 'error');
    threatLog('>     data = json.loads(feed_content)', 'error');
    threatLog('> json.JSONDecodeError: Expecting \',\' delimiter: line 1 column 47', 'error');
    threatLog('>', '');
    threatLog('> ROOT CAUSE: Feed was truncated during download', 'warn');
    threatLog('>', '');
    threatLog('> FIX:', 'warn');
    threatLog('> try:', '');
    threatLog('>     data = json.loads(feed_content)', '');
    threatLog('> except json.JSONDecodeError as e:', '');
    threatLog('>     print(f"Feed corrupted: {e}")', '');
    threatLog('>     sys.exit(1)', '');
    threatLog('>', '');
    threatLog('> Always wrap JSON parsing in try/except for production tools.', 'warn');
    threatLog('>', '');
    threatLog('> STATUS: HANDLED \u2014 error caught, not crash', 'success');

  } else if (key === 'C') {
    threatLog('> Loading scenario: NESTED JSON ACCESS', 'info');
    threatLog('>', '');
    threatLog('> Feed structure (nested):', '');
    threatLog('> {', '');
    threatLog('>   "threats": [', '');
    threatLog('>     {', '');
    threatLog('>       "ip": "203.0.113.45",', '');
    threatLog('>       "source": {', '');
    threatLog('>         "name": "ThreatFeed",', '');
    threatLog('>         "confidence": 0.95', '');
    threatLog('>       },', '');
    threatLog('>       "categories": ["brute_force", "port_scan"]', '');
    threatLog('>     }', '');
    threatLog('>   ]', '');
    threatLog('> }', '');
    threatLog('>', '');
    threatLog('> Accessing nested values:', '');
    threatLog('> feed[\'threats\'][0][\'ip\']              \u2192 "203.0.113.45"', 'success');
    threatLog('> feed[\'threats\'][0][\'source\'][\'name\']  \u2192 "ThreatFeed"', 'success');
    threatLog('> feed[\'threats\'][0][\'categories\'][0]   \u2192 "brute_force"', 'success');
    threatLog('>', '');
    threatLog('> Safe access pattern:', '');
    threatLog('> threat.get(\'threat_score\', 0)  \u2192 0 (key missing, no KeyError)', 'success');
    threatLog('>', '');
    threatLog('> STATUS: PASS \u2014 nested access confirmed', 'success');
  }

  threatSimState['seen' + key] = true;
  const checkEl = document.getElementById('threat-check-' + key);
  if (checkEl) {
    checkEl.style.color = 'var(--green-primary)';
    checkEl.textContent = '\u2713 Scenario ' + key + ' complete';
  }
  threatSimCheckComplete();
}

function threatSimCheckComplete() {
  if (threatSimState.seenA && threatSimState.seenB && threatSimState.seenC) {
    const statusEl = document.getElementById('m5-status');
    if (statusEl) statusEl.innerHTML = '<span class="status-pass">\u2713 ALL SCENARIOS COMPLETE \u2014 MISSION 05 COMPLETE</span>';
    setTimeout(function() { completeMission(5); }, 800);
  }
}

function initMission5() {
  threatSimState.seenA = false;
  threatSimState.seenB = false;
  threatSimState.seenC = false;
}

MISSION_RENDERERS[5] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Threat Intelligence Pipeline Simulator</div>
    <p>The threat intelligence pipeline: receive JSON feed &rarr; parse with <code>json.loads()</code> or <code>json.load()</code> &rarr; filter by severity &rarr; build blocklist &rarr; write with <code>json.dump()</code> &rarr; feed to firewall. Watch it execute below.</p>
    <div class="concept-grid">

      <div class="concept-card">
        <h3>Scenario A</h3>
        <p><strong>Full Pipeline</strong><br>End-to-end success</p>
        <p style="color:var(--text-dim); font-size:0.85em; margin-top:8px;">Watch a complete threat intel pipeline: load JSON feed, filter by severity, build blocklist, write to file, verify output.</p>
        <button class="btn-run" style="margin-top:14px; font-size:0.8em; padding:8px 16px;" onclick="runThreatScenario('A')">&#9654; RUN</button>
      </div>

      <div class="concept-card">
        <h3>Scenario B</h3>
        <p><strong>Invalid JSON Input</strong><br>Error handling</p>
        <p style="color:var(--text-dim); font-size:0.85em; margin-top:8px;">A corrupted threat feed triggers <code>json.JSONDecodeError</code>. See the proper try/except pattern for production tools.</p>
        <button class="btn-run" style="margin-top:14px; font-size:0.8em; padding:8px 16px;" onclick="runThreatScenario('B')">&#9654; RUN</button>
      </div>

      <div class="concept-card">
        <h3>Scenario C</h3>
        <p><strong>Nested JSON Access</strong><br>Navigation patterns</p>
        <p style="color:var(--text-dim); font-size:0.85em; margin-top:8px;">Access deeply nested threat feed data using bracket notation and the safe <code>.get()</code> pattern to avoid <code>KeyError</code>.</p>
        <button class="btn-run" style="margin-top:14px; font-size:0.8em; padding:8px 16px;" onclick="runThreatScenario('C')">&#9654; RUN</button>
      </div>

    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Threat Intel Pipeline Simulator</div>
    <div id="threat-terminal" style="background:var(--bg-editor); border:1px solid var(--border); border-radius:3px; padding:16px; min-height:200px; font-family:var(--font); font-size:0.88em; overflow-y:auto; max-height:520px; white-space:pre-wrap;"></div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Scenarios Completed</div>
    <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:8px;">
      <div id="threat-check-A" style="color:var(--text-dim);">&#9744; Scenario A &mdash; Full Pipeline</div>
      <div id="threat-check-B" style="color:var(--text-dim);">&#9744; Scenario B &mdash; Invalid JSON Input</div>
      <div id="threat-check-C" style="color:var(--text-dim);">&#9744; Scenario C &mdash; Nested JSON Access</div>
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
    if (finalEl) finalEl.innerHTML = '<span class="status-pass">\u2713 OPERATION FILED COMPLETE. Context managers protect file resources. JSON feeds are parsed and transformed. Code is organized in reusable modules. Changes are tracked in Git. You can now build and maintain professional security data pipelines. Outstanding work, Analyst.</span>';
    setTimeout(function() { completeMission(6); }, 800);
  }
}

MISSION_RENDERERS[6] = function() {
  return `
  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Week 4 Completion Checklist</div>
    <p>Seven concrete items &mdash; not plans, implementations. Click each item only after you have completed it. All seven must be confirmed before OPERATION: FILED is done.</p>
    <div class="hint-box">
      <strong>This is a completion checklist, not a planning list.</strong> Click each item only after you have actually done it. These skills form the foundation for every security tool you build going forward.
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Confirm All Seven Items</div>
    <p style="color:var(--text-dim); font-size:0.85em; margin-bottom:16px;">Click each item only after it is implemented and verified.</p>

    <div style="display:flex; flex-direction:column; gap:12px;">

      <div id="final-item-0" onclick="checkFinalItem(0)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="final-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>I always use <code>with open()</code> context managers instead of open() + close()</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">Every file operation in my code uses the <code>with</code> statement. Files are guaranteed to close even when exceptions occur. I have removed any bare <code>open()</code> calls that relied on manual <code>close()</code>.</p>
        </div>
      </div>

      <div id="final-item-1" onclick="checkFinalItem(1)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="final-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>I know that <code>'w'</code> mode erases existing content and <code>'a'</code> mode appends</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I understand the difference between all five file modes: <code>'r'</code>, <code>'w'</code>, <code>'a'</code>, <code>'x'</code>, <code>'rb'</code>. I know which to use for security logs, binary files, and audit trails. I never accidentally use <code>'w'</code> when I mean <code>'a'</code>.</p>
        </div>
      </div>

      <div id="final-item-2" onclick="checkFinalItem(2)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="final-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>I can name all four JSON functions and when to use each (loads/dumps/load/dump)</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I have used all four JSON functions in code: <code>json.loads()</code>, <code>json.dumps()</code>, <code>json.load()</code>, <code>json.dump()</code>. I know which ones work with strings and which work with files.</p>
        </div>
      </div>

      <div id="final-item-3" onclick="checkFinalItem(3)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="final-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>I know that the <code>'s'</code> in <code>loads()</code> and <code>dumps()</code> means 'string'</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">The memory hook is simple: 's' means string, no 's' means file. <code>loads()</code> parses a JSON string. <code>load()</code> reads from a file. I never confuse these in my code.</p>
        </div>
      </div>

      <div id="final-item-4" onclick="checkFinalItem(4)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="final-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>I understand why to split code into <code>utils.py</code>, <code>file_ops.py</code>, and <code>main.py</code></strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I have organized or refactored code into purpose-built modules. Each module has a clear responsibility. I can import functions from my modules using <code>from module import function</code>.</p>
        </div>
      </div>

      <div id="final-item-5" onclick="checkFinalItem(5)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="final-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>I have run the five core Git commands: init, status, add, commit, push</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I have initialized a repository, checked status, staged files, created a commit with a meaningful message, and pushed to a remote. I understand that <code>git push -u origin main</code> sets up tracking for future pushes.</p>
        </div>
      </div>

      <div id="final-item-6" onclick="checkFinalItem(6)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="final-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>I have built the threat intelligence parser that creates a blocklist.json output</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">My threat intel parser reads a JSON feed, filters threats by severity, builds a blocklist dictionary, and writes it to <code>blocklist.json</code> using <code>json.dump()</code> with <code>indent=2</code>. The output is verified by reading it back.</p>
        </div>
      </div>

    </div>

    <div id="m6-checklist-status" style="color:var(--text-dim); font-size:0.8em; margin-top:16px; letter-spacing:1px;">0 / 7 items confirmed</div>
    <div id="m6-status" class="gate-status" style="margin-top:8px;"></div>
  </div>
  `;
};
