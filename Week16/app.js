// ===== STATE =====
const STORAGE_KEY = 'cvnp2646_w16_progress';

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
  { id: 1, key: 'REPO_AUDIT',   label: '01\nREPO',     icon: '⬡' },
  { id: 2, key: 'README_FINAL', label: '02\nREADME',   icon: '⬡' },
  { id: 3, key: 'AI_LOG',       label: '03\nAI LOG',   icon: '⬡' },
  { id: 4, key: 'DEMO_PLAN',    label: '04\nDEMO',     icon: '⬡' },
  { id: 5, key: 'REFLECTION',   label: '05\nREFLECT',  icon: '⬡' },
  { id: 6, key: 'SUBMIT_CHECK', label: '06\nSUBMIT',   icon: '⬡' },
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
    showBriefing('OPERATION LAUNCH COMPLETE. Repository is clean. Documentation is honest. Demo is recorded. Reflection sounds like an engineer. Your capstone is a portfolio artifact. Outstanding work, Analyst.', null);
    renderMissionMap();
    updateProgress();
  }
}

// ===== COMMANDER ZHANG BRIEFINGS =====
const BRIEFINGS = [
  'Welcome to OPERATION: LAUNCH. Four weeks of work end here. Week 16 is not just submission \u2014 it is packaging. Your repository, demo video, AI log, and reflection must tell one coherent story: you built something real, you understand it, and you used AI responsibly.',
  'Orientation complete. Now audit your repository. The repo is the foundation. Do not record a single frame of video until the repo is clean, organized, and passing tests.',
  'Repository audit complete. Time to tighten the README. AI can review it for clarity, but only you can verify the commands are real. That check is yours.',
  'README locked. Now finalize the AI Usage Log. A strong AI log is engineering notes, not marketing. Specific prompts. Real decisions. Evidence of judgment.',
  'AI log complete. Now plan the demo video. The video is a structured proof \u2014 not a code walkthrough. Five minutes. Five sections. One rehearsal minimum.',
  'Demo plan locked. Write the reflection. Four questions. Engineering tone. Specific examples from your own project. No generic statements allowed.',
  'Final checks stand between you and a complete portfolio package. Confirm every item to complete OPERATION: LAUNCH.',
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
  const totalMap = { 0: 3, 1: 1, 2: 4, 3: 1, 4: 0, 5: 0, 6: 0 };
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
  document.title = 'MISSION ' + String(id).padStart(2, '0') + ' \u2014 ' + (MISSIONS[id] ? MISSIONS[id].key : '') + ' | OPERATION: LAUNCH';
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
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">What Week 16 Really Is</div>
    <p>Week 16 is where your project stops being a class assignment and becomes something you could show to an employer, recruiter, or technical interviewer. Four deliverables define this week: a final GitHub repository, a demo video (3-5 min), AI_USAGE.md, and a technical reflection.</p>
    <p style="margin-top:12px;">The question is not <strong>"does it run?"</strong> The question is <strong>"does it tell a coherent story?"</strong></p>

    <div class="concept-grid">
      <div class="concept-card">
        <h3>Portfolio Week, Not Just Submission Week</h3>
        <p>Week 16 is not about adding features or fixing bugs. It is about <strong>packaging</strong>. A tool that runs but has no documentation, no tests, and no context is not a portfolio artifact. It is homework.</p>
        <ul style="margin-top:10px; padding-left:18px; color:var(--text-dim); font-size:0.88em;">
          <li>Final GitHub repository</li>
          <li>Demo video (3-5 min)</li>
          <li>AI_USAGE.md with all four weeks documented</li>
          <li>Technical reflection answering four engineering questions</li>
        </ul>
      </div>

      <div class="concept-card">
        <h3>What the Story Must Prove</h3>
        <p>Every element of your submission should contribute to one coherent story:</p>
        <ul style="margin-top:10px; padding-left:18px; color:var(--text-dim); font-size:0.88em;">
          <li>You built something real (working code, passing tests, real sample data)</li>
          <li>You understand it (reflection with specific examples)</li>
          <li>You used AI responsibly (documented prompts, edits, rejections in AI_USAGE.md)</li>
          <li>Another person could run it from scratch (README commands work)</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Orientation Check &mdash; 3 Questions</div>
    <p>Answer all three correctly to unlock Mission 01.</p>

    <div class="quiz-question" id="q0-0">
      <p><strong>Q1:</strong> What is the primary goal of Week 16?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">Adding new features to the capstone tool</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, true)">Packaging the project as a professional portfolio artifact</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">Fixing all remaining bugs before the deadline</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">Writing more tests to improve coverage</button>
      </div>
    </div>

    <div class="quiz-question" id="q0-1">
      <p><strong>Q2:</strong> Which should you complete FIRST in Week 16?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">Record the demo video</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">Write the technical reflection</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, true)">Finalize the GitHub repository</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">Update AI_USAGE.md</button>
      </div>
    </div>

    <div class="quiz-question" id="q0-2">
      <p><strong>Q3:</strong> A strong Week 16 submission proves three things. Which is NOT one of them?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">You built something real</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">You understand the important parts</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">You used AI responsibly</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, true)">You added new features after Week 15</button>
      </div>
    </div>

    <div id="m0-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 01 — REPO_AUDIT
// ===================================================
MISSION_RENDERERS[1] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Repository Readiness</div>
    <p>The repo is the foundation. Do not record a single frame of video until the repository is clean, organized, and passing tests. Review all six components below, then answer the question to unlock Mission 02.</p>
    <p style="color:var(--text-dim); font-size:0.85em; margin-top:12px;">Click each card to read the explanation. All six must be reviewed before the question unlocks.</p>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Review All Six Repository Components</div>
    <p style="color:var(--text-dim); font-size:0.85em;">Click each card to read the explanation. All six must be reviewed before the question unlocks.</p>
    <div class="concept-grid">

      <div class="concept-card" id="card-m1-0" onclick="visitCard('m1', 0, 6)">
        <h3>Source Code Organization</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">STRUCTURE</p>
        <p>Root directory is clean &mdash; no loose test files, debugging scripts, or temp artifacts. Main entry point is obvious (<code>main.py</code> or equivalent). Folders are logically named: <code>tests/</code>, <code>data/</code>, <code>src/</code> if used. File names are consistent and readable.</p>
      </div>

      <div class="concept-card" id="card-m1-1" onclick="visitCard('m1', 1, 6)">
        <h3>Tests Must Pass</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">VERIFICATION</p>
        <p>Run <code>pytest -v</code> one final time before recording anything. All tests should be green &mdash; if one is broken, fix it now, not after the video. Tests folder exists and contains real test files (not placeholder stubs). Sample data that tests use is committed to the repo.</p>
      </div>

      <div class="concept-card" id="card-m1-2" onclick="visitCard('m1', 2, 6)">
        <h3>README Is Runnable</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">DOCUMENTATION</p>
        <p>Installation steps work on a clean machine. Every command shown in README has been run and confirmed to work. Sample input file exists at the path mentioned in the README. <code>python3 main.py --help</code> output matches what README describes.</p>
      </div>

      <div class="concept-card" id="card-m1-3" onclick="visitCard('m1', 3, 6)">
        <h3>requirements.txt Works</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">DEPENDENCIES</p>
        <p>Run <code>pip install -r requirements.txt</code> in a fresh environment or virtualenv. If it fails, the project is not submittable. All third-party imports must be in the file. Standard library modules (<code>json</code>, <code>logging</code>, <code>os</code>) do NOT go in requirements.txt.</p>
      </div>

      <div class="concept-card" id="card-m1-4" onclick="visitCard('m1', 4, 6)">
        <h3>Sample Data Is Committed</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">DATA FILES</p>
        <p><code>sample_input.json</code> (or equivalent) is in the repo. <code>sample_output.json</code> (or equivalent) is committed, OR the README explains how to generate it. The demo video needs this data to exist at the exact path shown. Missing sample data is the most common reason demos fail to reproduce.</p>
      </div>

      <div class="concept-card" id="card-m1-5" onclick="visitCard('m1', 5, 6)">
        <h3>AI_USAGE.md Exists and Is Current</h3>
        <p style="color:var(--blue-info); font-size:0.78em; letter-spacing:1px; margin-bottom:8px;">AI LOG</p>
        <p>File is at the repo root (not buried in a folder). Has at minimum one entry per week (Weeks 13-16). Each entry contains: prompt used, what was accepted/modified/rejected, how it was verified. Does not contain generic filler &mdash; "I used AI for help" is not an entry.</p>
      </div>

    </div>
    <div id="card-m1-status" style="color:var(--text-dim); font-size:0.8em; margin-top:8px; letter-spacing:1px;">0 / 6 components reviewed</div>
  </div>

  <div class="panel" id="m1-question-panel" style="display:none">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Repository Audit Check</div>
    <div class="quiz-question" id="q1-0">
      <p><strong>Q1:</strong> What is the most common reason a demo video cannot be reproduced by someone cloning the repo?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">The README is too short</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, true)">Sample data is missing or at the wrong path</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">The reflection is incomplete</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">Too many commits in the repository</button>
      </div>
    </div>
    <div id="m1-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 02 — README_FINAL
// ===================================================
MISSION_RENDERERS[2] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Tightening the README</div>
    <p>The README is a contract between you and anyone who clones your repository. It must be accurate. A README that documents a wrong command, a missing file, or a feature that does not exist is worse than no README at all.</p>
  </div>

  <div class="panel">
    <div class="panel-accent" style="border-left-color: var(--blue-info)"></div>
    <div class="panel-title blue">What a Final README Must Contain</div>
    <ul class="list" style="color:var(--text-primary);">
      <li><strong>Overview</strong> (1-3 sentences: what the tool does, who it helps)</li>
      <li><strong>Features</strong> (what it actually does &mdash; no promised but unbuilt features)</li>
      <li><strong>Installation:</strong> <code>pip install -r requirements.txt</code></li>
      <li><strong>Usage:</strong> real CLI command with real paths, show <code>--help</code> output</li>
      <li><strong>Sample input/output:</strong> what goes in, what comes out</li>
      <li><strong>Testing:</strong> <code>pytest -v</code> with expected result</li>
      <li><strong>Project structure:</strong> tree of important files</li>
    </ul>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Using AI to Review, Not to Invent</div>
    <p>AI can help you improve the README for clarity, but the verification step is yours alone.</p>
    <div class="hint-box">
      <strong>Prompt to use:</strong> "Review this README for clarity. Check for: clear overview, runnable installation steps, real usage examples, testing instructions. Do NOT add features that do not exist."
    </div>
    <p style="margin-top:12px;">After AI review: manually verify every command by running it. Never accept README prose that describes features the code does not have. The README is documentation, not marketing.</p>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">README Check &mdash; 4 Questions</div>
    <p>Answer all four correctly to unlock Mission 03.</p>

    <div class="quiz-question" id="q2-0">
      <p><strong>Q1:</strong> Which README section is most critical for another person to reproduce your results?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">Features list</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, true)">Usage examples with real commands</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">Project history</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">Author bio</button>
      </div>
    </div>

    <div class="quiz-question" id="q2-1">
      <p><strong>Q2:</strong> You ask AI to improve your README and it adds a "Web Dashboard" section your project doesn't have. What do you do?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, false)">Keep it &mdash; it sounds impressive</button>
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, true)">Delete it &mdash; only document what exists</button>
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, false)">Plan to build it before submission</button>
        <button class="quiz-option" onclick="answerQuiz(2, 1, this, false)">Move it to a "Future Work" section</button>
      </div>
    </div>

    <div class="quiz-question" id="q2-2">
      <p><strong>Q3:</strong> What is the right way to verify README commands after AI reviews them?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, false)">Read them carefully for typos</button>
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, true)">Run each command in a clean terminal and confirm the output</button>
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, false)">Ask AI to verify them</button>
        <button class="quiz-option" onclick="answerQuiz(2, 2, this, false)">Submit and see if the grader can run them</button>
      </div>
    </div>

    <div class="quiz-question" id="q2-3">
      <p><strong>Q4:</strong> requirements.txt should contain:</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, false)">Every Python file you import from anywhere</button>
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, true)">Only third-party packages not included with Python</button>
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, false)">All Python standard library modules too</button>
        <button class="quiz-option" onclick="answerQuiz(2, 3, this, false)">Only packages you used this week</button>
      </div>
    </div>

    <div id="m2-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 03 — AI_LOG
// ===================================================
MISSION_RENDERERS[3] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">The AI Usage Log</div>
    <p>A strong AI_USAGE.md is engineering notes, not marketing. Specific prompts. Real decisions. Evidence of judgment. It is not a summary of what AI did &mdash; it is documentation of how you directed it, evaluated its output, and took responsibility for what you kept.</p>
  </div>

  <div class="panel">
    <div class="panel-accent" style="border-left-color: var(--green-primary)"></div>
    <div class="panel-title" style="color:var(--green-primary);">What a Strong AI_USAGE.md Looks Like</div>
    <p>A good entry contains the prompt, what was accepted, what was modified, what was rejected, and how the result was verified:</p>
    <div class="code-block">
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code>## Week 15 — Testing Session
- Tool: GitHub Copilot Chat
- Goal: Generate pytest test ideas for load_events() and generate_report()
- Prompt: "Generate pytest test ideas for a function that loads JSON and one
  that generates a report. Include normal input, edge cases, and invalid input."
- Accepted: Test category structure (normal / edge / invalid grouping)
- Modified: Renamed test functions to match my actual function names;
  changed assertions to test real return values not just non-None
- Rejected: Two tests that only checked if the result was not None — too weak
- Verification: Ran pytest -v, all 8 tests pass; manually checked boundary
  cases are actually testing threshold behavior</code></pre>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent" style="border-left-color: var(--red-alert)"></div>
    <div class="panel-title" style="color:var(--red-alert);">What a Weak Entry Looks Like (and Why It Fails)</div>
    <p>Compare the strong entry above to this weak entry:</p>
    <div class="code-block">
      <pre><code>## Week 15
- Used AI to help write tests
- AI suggested some tests
- I used them</code></pre>
    </div>
    <p style="margin-top:12px;">Why this fails:</p>
    <ul class="list">
      <li>No prompt documented &mdash; cannot verify what was actually asked</li>
      <li>No distinction between accepted, modified, rejected</li>
      <li>No verification &mdash; how do you know the tests work?</li>
      <li>Provides zero evidence of engineering judgment</li>
      <li>This is the entry that gets flagged as undocumented AI use</li>
    </ul>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">AI Log Check</div>
    <div class="quiz-question" id="q3-0">
      <p><strong>Q1:</strong> Which AI_USAGE.md entry demonstrates responsible AI use?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">'Used Copilot for the testing section'</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">'AI wrote my tests and I ran them'</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, true)">An entry with the specific prompt, what was accepted/modified/rejected, and how results were verified</button>
        <button class="quiz-option" onclick="answerQuiz(3, 0, this, false)">'Did not use AI this week' when you did</button>
      </div>
    </div>
    <div id="m3-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 04 — DEMO_PLAN (simulator)
// ===================================================
const demoSimState = { seenA: false, seenB: false, seenC: false };

function demoLog(text, cls) {
  const term = document.getElementById('demo-terminal');
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

function demoClear() {
  const term = document.getElementById('demo-terminal');
  if (term) term.innerHTML = '';
}

function runDemoScenario(key) {
  demoClear();

  if (key === 'A') {
    demoLog('> Loading demo scenario: STRONG DEMO', 'info');
    demoLog('> Analyst opens README.md first', '');
    demoLog('> Runs: python3 main.py --help', '');
    demoLog('> Output matches README description exactly', 'success');
    demoLog('> Runs: python3 main.py --input data/sample_input.json --output data/sample_output.json', '');
    demoLog('> Tool runs cleanly, output file generated', 'success');
    demoLog('> Opens output \u2014 explains one key design decision', '');
    demoLog('> Runs: pytest -v \u2014 all tests pass', 'success');
    demoLog('> Closes with: "Future improvement would be X \u2014 here\'s why that matters"', '');
    demoLog('> ', '');
    demoLog('> RESULT: Employer can reproduce this in 5 minutes.', 'success');
    demoLog('> Evidence: tool works, you understand it, documentation is honest.', 'success');
    demoLog('> STATUS: PASS \u2014 DEMO READY', 'success');

  } else if (key === 'B') {
    demoLog('> Loading demo scenario: MISSING SAMPLE DATA', 'info');
    demoLog('> Analyst starts recording without repo check', '');
    demoLog('> Runs: python3 main.py --input data/sample_input.json', '');
    demoLog('> ERROR: FileNotFoundError: data/sample_input.json not found', 'fail');
    demoLog('> Analyst searches for the file...', 'warn');
    demoLog('> Discovers sample data was never committed to repo', 'fail');
    demoLog('> Recording must restart', 'fail');
    demoLog('> ', '');
    demoLog('> ROOT CAUSE: Skipped repo audit before recording', 'warn');
    demoLog('> FIX: Commit sample_input.json and sample_output.json', 'warn');
    demoLog('>      Verify the path in README matches the actual file location', 'warn');
    demoLog('>      Run the full demo command BEFORE recording', 'warn');
    demoLog('> STATUS: FAIL \u2014 DO NOT SUBMIT', 'fail');

  } else if (key === 'C') {
    demoLog('> Loading demo scenario: NO SCRIPT IMPROVISED DEMO', 'info');
    demoLog('> Analyst starts recording, no outline prepared', '');
    demoLog('> 0:30 \u2014 Still explaining what the project is', 'warn');
    demoLog('> 1:30 \u2014 Runs tool but forgot which command to use', 'warn');
    demoLog('> 2:00 \u2014 Opens wrong file, gets confused', 'warn');
    demoLog('> 3:00 \u2014 "Let me just show you the code real quick..."', 'warn');
    demoLog('> 4:30 \u2014 Demo runs out of time, no reflection on design decisions', 'warn');
    demoLog('> 5:00 \u2014 Recording ends with "...yeah so that\'s basically it"', 'warn');
    demoLog('> ', '');
    demoLog('> RESULT: Technically working demo, professionally weak.', 'warn');
    demoLog('> An improvised demo wastes the evidence your code provides.', 'warn');
    demoLog('> FIX: Write a 5-section outline before recording (see above).', 'warn');
    demoLog('>      Rehearse once. Time it. Use large terminal font.', 'warn');
    demoLog('> STATUS: WEAK \u2014 REVISE BEFORE SUBMITTING', 'warn');
  }

  demoSimState['seen' + key] = true;
  const checkEl = document.getElementById('demo-check-' + key);
  if (checkEl) {
    checkEl.style.color = 'var(--green-primary)';
    checkEl.textContent = '\u2713 Scenario ' + key + ' complete';
  }
  demoSimCheckComplete();
}

function demoSimCheckComplete() {
  if (demoSimState.seenA && demoSimState.seenB && demoSimState.seenC) {
    const statusEl = document.getElementById('m4-status');
    if (statusEl) statusEl.innerHTML = '<span class="status-pass">\u2713 ALL SCENARIOS COMPLETE \u2014 MISSION 04 COMPLETE</span>';
    setTimeout(function() { completeMission(4); }, 800);
  }
}

MISSION_RENDERERS[4] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Planning the Demo Video</div>
    <p>The goal is a 3-5 minute demo that proves three things: the tool works, you understand it, it was built with professional practices. A demo video is not a code walkthrough. It is a structured proof.</p>

    <div class="panel" style="margin-top:16px; background:var(--bg-deep); border-color:var(--green-dim);">
      <div class="panel-accent" style="background:var(--green-dim)"></div>
      <div class="panel-title" style="color:var(--green-dim);">Five-Section Demo Structure</div>
      <table>
        <thead>
          <tr><th>Timestamp</th><th>Section</th></tr>
        </thead>
        <tbody>
          <tr><td>0:00 &ndash; 0:30</td><td>Problem statement &mdash; what problem does this tool solve?</td></tr>
          <tr><td>0:30 &ndash; 1:00</td><td>Quick repo overview &mdash; show the folder structure, README</td></tr>
          <tr><td>1:00 &ndash; 3:30</td><td>Live demo with real sample data &mdash; run the actual command from README</td></tr>
          <tr><td>3:30 &ndash; 4:30</td><td>Explain 2-3 key implementation decisions</td></tr>
          <tr><td>4:30 &ndash; 5:00</td><td>Wrap-up and realistic future improvements</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Demo Scenario Simulator</div>
    <p>Run all three scenarios to see what separates a strong demo from a weak one. All three must be completed to unlock Mission 05.</p>
    <div style="display:flex; gap:12px; flex-wrap:wrap; margin:16px 0;">
      <button class="btn-run" onclick="runDemoScenario('A')">STRONG DEMO</button>
      <button class="btn-run" onclick="runDemoScenario('B')">MISSING DATA</button>
      <button class="btn-run" onclick="runDemoScenario('C')">NO SCRIPT</button>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Demo Terminal</div>
    <div id="demo-terminal" style="background:var(--bg-editor); border:1px solid var(--border); border-radius:3px; padding:16px; min-height:200px; font-family:var(--font); font-size:0.88em; overflow-y:auto; max-height:520px; white-space:pre-wrap;"></div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Scenarios Completed</div>
    <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:8px;">
      <div id="demo-check-A" style="color:var(--text-dim);">&#9744; Scenario A &mdash; Strong Demo</div>
      <div id="demo-check-B" style="color:var(--text-dim);">&#9744; Scenario B &mdash; Missing Sample Data</div>
      <div id="demo-check-C" style="color:var(--text-dim);">&#9744; Scenario C &mdash; No Script Improvised Demo</div>
    </div>
    <div id="m4-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 05 — REFLECTION (simulator)
// ===================================================
const reflectSimState = { seenA: false, seenB: false, seenC: false };

function reflectLog(text, cls) {
  const term = document.getElementById('reflect-terminal');
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

function reflectClear() {
  const term = document.getElementById('reflect-terminal');
  if (term) term.innerHTML = '';
}

function runReflectScenario(key) {
  reflectClear();

  if (key === 'A') {
    reflectLog('> Loading reflection scenario: STRONG REFLECTION', 'info');
    reflectLog('> ', '');
    reflectLog('> Q1 - Technical growth:', 'info');
    reflectLog('> "My understanding of pure functions deepened significantly.', '');
    reflectLog('>  Before this project, I mixed I/O and logic without thinking about it.', '');
    reflectLog('>  Extracting detect_port_scan() forced me to see the boundary clearly."', '');
    reflectLog('> ', '');
    reflectLog('> Q2 - Real debugging:', 'info');
    reflectLog('> "My recursive compare_configs() silently skipped nested lists.', '');
    reflectLog('>  I isolated it with a minimal test case: two lists, one changed element.', '');
    reflectLog('>  The bug was a missing else branch in the list handler."', '');
    reflectLog('> ', '');
    reflectLog('> Q3 - AI collaboration:', 'info');
    reflectLog('> "AI generated test skeletons quickly, but the assertions were weak.', '');
    reflectLog('>  Example: it wrote \'assert result is not None\' when I needed threshold testing.', '');
    reflectLog('>  I learned to always check what AI is actually asserting, not just that it runs."', '');
    reflectLog('> ', '');
    reflectLog('> Q4 - Future improvements:', 'info');
    reflectLog('> "Real-time monitoring via inotify would make the tool production-ready.', '');
    reflectLog('>  I\'d also add a --watch flag for continuous comparison against baseline."', '');
    reflectLog('> ', '');
    reflectLog('> STATUS: PASS \u2014 SOUNDS LIKE AN ENGINEER', 'success');

  } else if (key === 'B') {
    reflectLog('> Loading reflection scenario: GENERIC REFLECTION', 'info');
    reflectLog('> ', '');
    reflectLog('> Q1: "I learned a lot about Python and got better at coding."', 'warn');
    reflectLog('> Q2: "I had some bugs but I fixed them by reading the error messages."', 'warn');
    reflectLog('> Q3: "AI was very helpful and saved me a lot of time."', 'warn');
    reflectLog('> Q4: "I would add more features and make it more user friendly."', 'warn');
    reflectLog('> ', '');
    reflectLog('> ANALYSIS: No specific functions named.', 'fail');
    reflectLog('>           No specific bugs described.', 'fail');
    reflectLog('>           No specific AI interaction documented.', 'fail');
    reflectLog('>           No realistic technical improvements named.', 'fail');
    reflectLog('> ', '');
    reflectLog('> This reflection tells the reader nothing they couldn\'t assume by default.', 'fail');
    reflectLog('> It provides zero evidence of engineering judgment.', 'fail');
    reflectLog('> ', '');
    reflectLog('> STATUS: FAIL \u2014 REVISE WITH SPECIFIC EXAMPLES', 'fail');

  } else if (key === 'C') {
    reflectLog('> Loading reflection scenario: AI-GENERATED REFLECTION', 'info');
    reflectLog('> ', '');
    reflectLog('> "This capstone project was an incredible journey of growth and discovery.', '');
    reflectLog('>  I developed proficiency in numerous Python paradigms and learned to leverage', '');
    reflectLog('>  cutting-edge AI tools to accelerate my development workflow. The challenges', '');
    reflectLog('>  I encountered were valuable learning opportunities that strengthened my', '');
    reflectLog('>  problem-solving capabilities and prepared me for real-world scenarios."', '');
    reflectLog('> ', '');
    reflectLog('> ANALYSIS: This is AI marketing language, not engineering notes.', 'fail');
    reflectLog('>           No specific project details.', 'fail');
    reflectLog('>           No functions, bugs, or decisions referenced.', 'fail');
    reflectLog('>           Indistinguishable from a reflection about any project.', 'fail');
    reflectLog('> ', '');
    reflectLog('> An unmodified AI reflection is an integrity problem \u2014 not a time saver.', 'fail');
    reflectLog('> Use AI to outline structure, then replace every sentence with your real words.', 'warn');
    reflectLog('> ', '');
    reflectLog('> STATUS: FAIL \u2014 ACADEMIC INTEGRITY RISK', 'fail');
  }

  reflectSimState['seen' + key] = true;
  const checkEl = document.getElementById('reflect-check-' + key);
  if (checkEl) {
    checkEl.style.color = 'var(--green-primary)';
    checkEl.textContent = '\u2713 Scenario ' + key + ' complete';
  }
  reflectSimCheckComplete();
}

function reflectSimCheckComplete() {
  if (reflectSimState.seenA && reflectSimState.seenB && reflectSimState.seenC) {
    const statusEl = document.getElementById('m5-status');
    if (statusEl) statusEl.innerHTML = '<span class="status-pass">\u2713 ALL SCENARIOS COMPLETE \u2014 MISSION 05 COMPLETE</span>';
    setTimeout(function() { completeMission(5); }, 800);
  }
}

MISSION_RENDERERS[5] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">The Technical Reflection</div>
    <p>The reflection is not a thank-you note. It answers four engineering questions with specific examples from your own project. Generic statements are not evidence of understanding &mdash; specific function names, bugs, and decisions are.</p>

    <div class="panel" style="margin-top:16px; background:var(--bg-deep); border-color:var(--blue-info);">
      <div class="panel-accent blue"></div>
      <div class="panel-title blue">Four Reflection Questions</div>
      <ol style="padding-left:22px; color:var(--text-primary);">
        <li style="margin-bottom:10px;"><strong>What technical skills improved most during this project?</strong></li>
        <li style="margin-bottom:10px;"><strong>What challenge forced the most real debugging and how did you solve it?</strong></li>
        <li style="margin-bottom:10px;"><strong>What did you learn about working with AI as a collaborator?</strong></li>
        <li style="margin-bottom:10px;"><strong>What realistic improvements would you make with more time?</strong></li>
      </ol>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Reflection Scenario Simulator</div>
    <p>Run all three scenarios to understand what strong and weak reflections look like. All three must be completed to unlock Mission 06.</p>
    <div style="display:flex; gap:12px; flex-wrap:wrap; margin:16px 0;">
      <button class="btn-run" onclick="runReflectScenario('A')">STRONG REFLECTION</button>
      <button class="btn-run" onclick="runReflectScenario('B')">GENERIC REFLECTION</button>
      <button class="btn-run" onclick="runReflectScenario('C')">AI-GENERATED</button>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Reflection Terminal</div>
    <div id="reflect-terminal" style="background:var(--bg-editor); border:1px solid var(--border); border-radius:3px; padding:16px; min-height:200px; font-family:var(--font); font-size:0.88em; overflow-y:auto; max-height:520px; white-space:pre-wrap;"></div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Scenarios Completed</div>
    <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:8px;">
      <div id="reflect-check-A" style="color:var(--text-dim);">&#9744; Scenario A &mdash; Strong Reflection</div>
      <div id="reflect-check-B" style="color:var(--text-dim);">&#9744; Scenario B &mdash; Generic Reflection</div>
      <div id="reflect-check-C" style="color:var(--text-dim);">&#9744; Scenario C &mdash; AI-Generated Reflection</div>
    </div>
    <div id="m5-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 06 — SUBMIT_CHECK
// ===================================================
const submitCheckState = new Set();
const SUBMIT_TOTAL = 9;

function checkSubmitItem(idx) {
  submitCheckState.add(idx);
  const item = document.getElementById('submit-item-' + idx);
  if (item) {
    item.classList.add('checked');
    const box = item.querySelector('.submit-check-box');
    if (box) {
      box.textContent = '\u2713';
      box.style.color = 'var(--green-primary)';
      box.style.borderColor = 'var(--green-primary)';
    }
  }
  const statusEl = document.getElementById('m6-checklist-status');
  if (statusEl) statusEl.textContent = submitCheckState.size + ' / ' + SUBMIT_TOTAL + ' items confirmed';
  if (submitCheckState.size >= SUBMIT_TOTAL) {
    const finalEl = document.getElementById('m6-status');
    if (finalEl) finalEl.innerHTML = '<span class="status-pass">\u2713 SUBMIT CHECKLIST COMPLETE \u2014 MISSION 06 COMPLETE</span>';
    setTimeout(function() { completeMission(6); }, 800);
  }
}

MISSION_RENDERERS[6] = function() {
  return `
  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Final Submission Checklist</div>
    <p>Nine concrete deliverables &mdash; not plans, implementations. Click each item only after you have completed it. All nine must be confirmed to complete OPERATION: LAUNCH.</p>
    <div class="hint-box">
      <strong>This is a completion checklist, not a planning list.</strong> If you click an item you have not actually done, you are only deceiving yourself. Every link you submit will be opened and tested.
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Confirm All Nine Submission Items</div>
    <p style="color:var(--text-dim); font-size:0.85em; margin-bottom:16px;">Click each item only after it is implemented, committed, and verified.</p>

    <div style="display:flex; flex-direction:column; gap:12px;">

      <div id="submit-item-0" class="proposal-item" onclick="checkSubmitItem(0)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="submit-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>GitHub repository is organized, clean, and up to date</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">No loose debugging scripts, temp files, or uncommitted changes. Folder structure is logical. All code that runs the tool is committed. The latest commit is the version being submitted.</p>
        </div>
      </div>

      <div id="submit-item-1" class="proposal-item" onclick="checkSubmitItem(1)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="submit-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>README is complete with runnable installation, usage, and testing commands</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">Every command documented in the README has been run in a terminal and confirmed to work. No promised but unbuilt features are mentioned. The project structure section shows the important files.</p>
        </div>
      </div>

      <div id="submit-item-2" class="proposal-item" onclick="checkSubmitItem(2)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="submit-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>All tests pass with pytest -v</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I have run <code>pytest -v</code> from the project root and all tests pass with no errors. The test suite covers normal cases, at least one boundary case, and at least one invalid input case. Tests use specific assertions, not <code>assert result is not None</code>.</p>
        </div>
      </div>

      <div id="submit-item-3" class="proposal-item" onclick="checkSubmitItem(3)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="submit-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Sample input and output files are committed to the repo</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;"><code>sample_input.json</code> (or equivalent) is committed and at the exact path shown in the README. <code>sample_output.json</code> (or equivalent) is committed or the README explains how to generate it. The demo video uses these exact files.</p>
        </div>
      </div>

      <div id="submit-item-4" class="proposal-item" onclick="checkSubmitItem(4)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="submit-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>requirements.txt installs all dependencies cleanly</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I have run <code>pip install -r requirements.txt</code> in a fresh environment and it completes without errors. All third-party packages are listed. Standard library modules (<code>json</code>, <code>logging</code>, <code>os</code>) are NOT listed.</p>
        </div>
      </div>

      <div id="submit-item-5" class="proposal-item" onclick="checkSubmitItem(5)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="submit-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>AI_USAGE.md has specific entries for all four weeks with prompts and verification</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">File is at the repo root. Each weekly entry includes: the specific prompt used, what was accepted, what was modified, what was rejected, and how the result was verified. No generic filler entries like "used AI for help."</p>
        </div>
      </div>

      <div id="submit-item-6" class="proposal-item" onclick="checkSubmitItem(6)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="submit-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Demo video is recorded, 3-5 minutes, shows live run with real sample data</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">Video follows the five-section structure: problem statement, repo overview, live demo, key decisions, future improvements. The actual <code>python3 main.py</code> command runs during the recording. The video is hosted and the link works.</p>
        </div>
      </div>

      <div id="submit-item-7" class="proposal-item" onclick="checkSubmitItem(7)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="submit-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>Reflection answers all four questions with specific project examples</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">Each answer names specific functions, bugs, or decisions from my actual project. No generic statements like "I learned a lot." Every answer sounds like an engineer writing about their own code, not a student summarizing the course.</p>
        </div>
      </div>

      <div id="submit-item-8" class="proposal-item" onclick="checkSubmitItem(8)" style="display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border:1px solid var(--border); border-radius:3px; cursor:pointer; background:var(--bg-panel); transition:border-color 0.2s;">
        <div class="submit-check-box" style="width:22px; height:22px; border:2px solid var(--text-dim); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; font-weight:700;"></div>
        <div>
          <strong>All submission links (repo, video, reflection) have been tested and work</strong>
          <p style="color:var(--text-dim); font-size:0.85em; margin-top:4px;">I have opened each submission link in a private/incognito browser window and confirmed it loads correctly. The GitHub repo is public or accessible to the instructor. The video link does not require a login to view. All links resolve without errors.</p>
        </div>
      </div>

    </div>

    <div id="m6-checklist-status" style="color:var(--text-dim); font-size:0.8em; margin-top:16px; letter-spacing:1px;">0 / 9 items confirmed</div>
    <div id="m6-status" class="gate-status" style="margin-top:8px;"></div>
  </div>
  `;
};
