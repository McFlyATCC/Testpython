// ===== STATE =====
const STORAGE_KEY = 'cvnp2646_w8_progress';

const state = {
  completedMissions: new Set(),
  currentMission: 0,
  pyodide: null,
  pyodideReady: false,
  editors: {},
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
  { id: 0, key: 'ORIENTATION',     label: '00\nORIENT',    icon: '⬡' },
  { id: 1, key: 'INTEL_BRIEFING',  label: '01\nINTEL',     icon: '⬡' },
  { id: 2, key: 'HTTP_BASICS',     label: '02\nHTTP',      icon: '⬡' },
  { id: 3, key: 'SECURE_CREDS',    label: '03\nCREDS',     icon: '⬡' },
  { id: 4, key: 'ERROR_HANDLING',  label: '04\nERRORS',    icon: '⬡' },
  { id: 5, key: 'API_SIMULATOR',   label: '05\nSIMULATE',  icon: '⬡' },
  { id: 6, key: 'FINAL_CHALLENGE', label: '06\nCHALLENGE', icon: '⬡' },
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
    showBriefing('OPERATION COMPLETE. Threat intelligence aggregator is online. The SOC has the data it needs. Outstanding work, Analyst.', null);
    renderMissionMap();
    updateProgress();
  }
}

// ===== COMMANDER ZHANG BRIEFINGS =====
const BRIEFINGS = [
  'Welcome to CVNP Security Operations. Threat feeds are pouring in from multiple vendors. Before you can aggregate anything, you need to understand APIs. Complete this orientation.',
  'Good. Now learn why live threat intelligence APIs matter — and why a leaked API key is as dangerous as a leaked password.',
  'Solid groundwork. Now master the requests library. You will need it to pull live data from AbuseIPDB.',
  'HTTP basics locked in. Before you write a single API call, you must learn how to handle credentials securely. Never hardcode a key.',
  'Credentials secured. Now write the error handling layer. APIs fail. Networks drop. Your tool must survive both.',
  'Error handling verified. Run the API simulator. Test every scenario: success, bad key, rate limit, timeout.',
  'Three final challenges stand between you and a working threat intelligence aggregator. Pass all three.',
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

// ===== PYODIDE INIT =====
async function initPyodide() {
  const loader = document.getElementById('pyodide-loader');
  if (loader) loader.classList.remove('hidden');
  try {
    state.pyodide = await loadPyodide();
    state.pyodideReady = true;
    console.log('Pyodide ready');
    if (loader) {
      loader.textContent = '✓ Python engine ready';
      setTimeout(function() { loader.classList.add('hidden'); }, 2000);
    }
  } catch (e) {
    console.error('Pyodide failed to load:', e);
    if (loader) {
      loader.textContent = '⚠ Python engine failed to load';
      loader.style.color = 'var(--red-alert)';
    }
  }
}

// ===== CODEMIRROR HELPER =====
function createEditor(textareaId, initialCode) {
  const ta = document.getElementById(textareaId);
  if (!ta) return null;
  const editor = CodeMirror.fromTextArea(ta, {
    mode: 'python',
    theme: 'dracula',
    lineNumbers: true,
    indentUnit: 4,
    tabSize: 4,
    indentWithTabs: false,
    extraKeys: { Tab: function(cm) { cm.execCommand('indentMore'); } },
    viewportMargin: Infinity,
  });
  if (initialCode) editor.setValue(initialCode);
  state.editors[textareaId] = editor;
  return editor;
}

// ===== PYODIDE RUNNER =====
async function runCode(editorId, outputId, validator) {
  if (!state.pyodideReady) {
    document.getElementById(outputId).textContent = 'Python is still loading. Please wait a moment and try again.';
    return false;
  }
  const editor = state.editors[editorId];
  const code = editor ? editor.getValue() : '';
  const outputEl = document.getElementById(outputId);
  outputEl.textContent = 'Running...';
  outputEl.className = 'gate-output';
  try {
    state.pyodide.runPython(
      'import sys, io\n' +
      '_old_stdout = sys.stdout\n' +
      'sys.stdout = io.StringIO()\n'
    );
    state.pyodide.runPython(code);
    const stdout = state.pyodide.runPython('sys.stdout.getvalue()');
    state.pyodide.runPython('sys.stdout = _old_stdout');
    outputEl.textContent = stdout || '(no output)';
    const passed = validator(stdout, code);
    outputEl.className = 'gate-output ' + (passed ? 'pass' : 'fail');
    return passed;
  } catch (err) {
    try { state.pyodide.runPython('sys.stdout = _old_stdout'); } catch(e2) {}
    outputEl.textContent = '⚠ ERROR:\n' + err.message;
    outputEl.className = 'gate-output fail';
    return false;
  }
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

// ===== HELPERS =====
function toggleHint(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('hidden');
}

function resetEditor(editorId, code) {
  const editor = state.editors[editorId];
  if (editor) editor.setValue(code);
}

function escapeForAttr(str) {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '&quot;').replace(/\n/g, '&#10;');
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
  // totalMap: number of quiz questions per mission (0 = no quiz gate)
  const totalMap = { 0: 3, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0 };
  const totalQuestions = totalMap[missionId] !== undefined ? totalMap[missionId] : 0;
  const answeredCount = Object.keys(answers).length;
  const allCorrect = Object.values(answers).every(Boolean);
  if (answeredCount < totalQuestions) return;
  if (totalQuestions === 0) return;
  const statusEl = document.getElementById('m' + missionId + '-status');
  if (!statusEl) return;
  if (allCorrect) {
    statusEl.innerHTML = '<span class="status-pass">✓ ALL CORRECT — MISSION 0' + missionId + ' COMPLETE</span>';
    setTimeout(function() { completeMission(missionId); }, 600);
  } else {
    statusEl.innerHTML = '<span class="status-fail">✗ Some answers were wrong. Re-read the panels above and refresh to try again.</span>';
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
  if (statusEl) statusEl.textContent = count + ' / ' + total + ' cards read';
  if (count >= total) {
    const qPanel = document.getElementById('m1-question-panel');
    if (qPanel) {
      qPanel.style.display = 'block';
      qPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

// ===== RENDER MISSION (dispatcher) =====
function renderMission(id) {
  document.title = 'MISSION ' + String(id).padStart(2,'0') + ' — ' + (MISSIONS[id] ? MISSIONS[id].key : '') + ' | OPERATION: THREAT INTEL';
  const container = document.getElementById('mission-content');
  const renderer = MISSION_RENDERERS[id];
  container.innerHTML = renderer ? renderer() : '<p style="color:var(--text-dim); padding:40px 0;">Mission ' + id + ' content loading...</p>';
  container.querySelectorAll('textarea[data-codemirror]').forEach(function(ta) {
    const initial = ta.dataset.initial || '';
    const decoded = initial.replace(/&#10;/g, '\n').replace(/&quot;/g, '"').replace(/\\\\/g, '\\');
    createEditor(ta.id, decoded);
  });
  if (id === 3) { if (typeof initMission3 === 'function') initMission3(); }
  if (id === 5) { if (typeof initMission5 === 'function') initMission5(); }
  var starterCodes = {
    4: function() {
      var ed = state.editors['gate-m4'];
      if (ed && window._m4StarterCode) ed.setValue(window._m4StarterCode);
    },
    6: function() {
      var starters = { 'gate-c1': window._c1StarterCode, 'gate-c2': window._c2StarterCode, 'gate-c3': window._c3StarterCode };
      Object.keys(starters).forEach(function(edId) {
        var ed = state.editors[edId];
        if (ed && starters[edId]) ed.setValue(starters[edId]);
      });
    }
  };
  if (starterCodes[id]) setTimeout(starterCodes[id], 50);
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
  const loader = document.createElement('div');
  loader.id = 'pyodide-loader';
  loader.textContent = '⟳ Loading Python engine...';
  document.body.appendChild(loader);
  initPyodide();
});


// ===================================================
// MISSION 00 — ORIENTATION
// ===================================================
MISSION_RENDERERS[0] = function() {
  return `
  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">What Is an API?</div>
    <p>An <strong>API</strong> (Application Programming Interface) lets your code talk to remote servers over the internet. Instead of downloading files manually, you send a request and receive structured data — usually JSON — in response.</p>
    <p>Security teams use APIs to pull live threat intelligence from services like AbuseIPDB, VirusTotal, and AlienVault. The data arrives fresh every time you call it — not from a file that was current last week.</p>
    <div class="concept-grid">
      <div class="concept-card">
        <h3>A Request</h3>
        <p>Your code sends an HTTP GET request to a URL. Like typing a URL in a browser, but from Python and with authentication headers.</p>
      </div>
      <div class="concept-card">
        <h3>A Response</h3>
        <p>The server replies with a status code (<code>200</code> = success) and a JSON body containing the data you asked for.</p>
      </div>
      <div class="concept-card">
        <h3>An API Key</h3>
        <p>A secret string that proves you have permission to use the API. Passed in request headers. Must never appear in your source code.</p>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">What Is HTTP?</div>
    <p>HTTP is the protocol web browsers (and Python scripts) use to talk to servers. Every API call is an HTTP request.</p>
    <div class="code-block">
      <span class="code-lang-tag">http</span>
      <pre><code>GET /api/v2/blacklist HTTP/1.1
Host: api.abuseipdb.com
Key: your-api-key-here
Accept: application/json</code></pre>
    </div>
    <p>The server responds with a <strong>status code</strong> telling you what happened, plus the data (if successful).</p>
    <table>
      <thead><tr><th>Code</th><th>Meaning</th></tr></thead>
      <tbody>
        <tr><td><code>200</code></td><td>Success — data is in the response body</td></tr>
        <tr><td><code>401</code></td><td>Unauthorized — bad or missing API key</td></tr>
        <tr><td><code>429</code></td><td>Rate limited — you made too many requests</td></tr>
        <tr><td><code>500</code></td><td>Server error — the API is broken right now</td></tr>
      </tbody>
    </table>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Orientation Check — 3 Questions</div>
    <p>Answer all three correctly to unlock Mission 01.</p>

    <div class="quiz-question" id="q0-0">
      <p><strong>Q1:</strong> What Python library is the standard way to make HTTP requests?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">urllib</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, true)">requests</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">httplib</button>
        <button class="quiz-option" onclick="answerQuiz(0, 0, this, false)">socket</button>
      </div>
    </div>

    <div class="quiz-question" id="q0-1">
      <p><strong>Q2:</strong> What does HTTP status code <code>200</code> mean?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">Rate limited</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">Unauthorized</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, true)">Success</button>
        <button class="quiz-option" onclick="answerQuiz(0, 1, this, false)">Server error</button>
      </div>
    </div>

    <div class="quiz-question" id="q0-2">
      <p><strong>Q3:</strong> What format do most APIs use to return data?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">XML</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">CSV</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, true)">JSON</button>
        <button class="quiz-option" onclick="answerQuiz(0, 2, this, false)">YAML</button>
      </div>
    </div>

    <div id="m0-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 01 — INTEL_BRIEFING
// ===================================================
MISSION_RENDERERS[1] = function() {
  return `
  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Why Live Threat Intelligence?</div>
    <p>Security teams subscribe to multiple threat intelligence feeds: VirusTotal, AlienVault, MISP, AbuseIPDB. Each uses different field names and schemas. Your job this week: normalize these feeds into a common schema and pull live data from AbuseIPDB's API.</p>
    <p>A static file of malicious IPs is outdated the moment it is saved. AbuseIPDB has reports submitted by the community every minute. Your tool will pull fresh data on every run.</p>
    <div class="danger-box">
      <strong>THE INCIDENT:</strong> A junior analyst hardcoded their AbuseIPDB API key directly in a Python script and pushed it to a public GitHub repo. Within 4 minutes, an automated bot had found the key, used it to exhaust their 1,000 daily API calls, and flagged the key as compromised. Keys live in <code>.env</code> files. Not in code. Ever.
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Read All Four Intel Cards</div>
    <p style="color:var(--text-dim); font-size:0.85em;">Click each card to read it. All four must be reviewed before the question unlocks.</p>
    <div class="concept-grid">
      <div class="concept-card" id="card-m1-0" onclick="visitCard('m1', 0, 4)">
        <h3>The Problem</h3>
        <p>Multiple vendors export threat data in incompatible formats. VendorA calls it <code>confidence</code>. VendorB calls it <code>score</code>. AbuseIPDB calls it <code>abuseConfidenceScore</code>. You cannot compare them without normalizing to a common schema.</p>
      </div>
      <div class="concept-card" id="card-m1-1" onclick="visitCard('m1', 1, 4)">
        <h3>What Is AbuseIPDB?</h3>
        <p>A community-driven threat intelligence platform. Users report IP addresses involved in attacks. The API returns a <strong>confidence score</strong> (0-100) based on how many reports an IP has received. Free tier: 1,000 API calls per day.</p>
      </div>
      <div class="concept-card" id="card-m1-2" onclick="visitCard('m1', 2, 4)">
        <h3>What You Will Build</h3>
        <p><code>secure_threat_aggregator.py</code> — reads local JSON vendor feeds, fetches live data from AbuseIPDB, normalizes everything to a common schema, deduplicates, and generates output files for a firewall blocklist and SIEM feed.</p>
      </div>
      <div class="concept-card" id="card-m1-3" onclick="visitCard('m1', 3, 4)">
        <h3>API Key Security</h3>
        <p>Your AbuseIPDB API key goes in a <code>.env</code> file, never in your Python file. Use <code>python-dotenv</code> to load it. Add <code>.env</code> to <code>.gitignore</code>. Commit <code>.env.example</code> as a template. This is non-negotiable.</p>
      </div>
    </div>
    <div id="card-m1-status" style="color:var(--text-dim); font-size:0.8em; margin-top:8px; letter-spacing:1px;">0 / 4 cards read</div>
  </div>

  <div class="panel" id="m1-question-panel" style="display:none">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Comprehension Check</div>
    <div class="quiz-question" id="q1-0">
      <p><strong>Q:</strong> What is the main advantage of fetching threat data from a live API instead of using a static file?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">API data is smaller and faster to process</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, true)">API data is real-time — it reflects threats reported in the last minutes, not last week</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">Static files require an internet connection to read</button>
        <button class="quiz-option" onclick="answerQuiz(1, 0, this, false)">APIs do not require authentication so they are easier to use</button>
      </div>
    </div>
    <div id="m1-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 02 — HTTP_BASICS
// ===================================================
MISSION_RENDERERS[2] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">The Requests Library</div>
    <p>Python's <code>requests</code> library is the standard way to make HTTP calls. Install it with:</p>
    <div class="code-block">
      <span class="code-lang-tag">bash</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code>pip install requests python-dotenv</code></pre>
    </div>
    <p>A basic GET request:</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code>import requests

response = requests.get("https://api.example.com/data")

if response.status_code == 200:
    data = response.json()   # parse JSON response
    print(data)
else:
    print(f"Error: {response.status_code}")</code></pre>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Authenticated Requests</div>
    <p>Most APIs require authentication. You pass your API key in the request <strong>headers</strong>. You pass filter options in <strong>params</strong>. Always set a <strong>timeout</strong> so your script does not hang forever if the server is slow.</p>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code>url = "https://api.abuseipdb.com/api/v2/blacklist"
headers = {
    "Key": api_key,           # your API key
    "Accept": "application/json"
}
params = {
    "confidenceMinimum": 90,  # only high-confidence IPs
    "limit": 50               # max results to return
}

response = requests.get(url, headers=headers, params=params, timeout=30)
data = response.json()</code></pre>
    </div>
    <div class="hint-box">
      <strong>Key Concepts:</strong>
      <ul>
        <li><strong>headers</strong> — authentication and content-type preferences</li>
        <li><strong>params</strong> — query string filters (appended to the URL automatically)</li>
        <li><strong>timeout</strong> — max seconds to wait before raising <code>Timeout</code> exception</li>
      </ul>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">HTTP Basics Check</div>
    <div class="quiz-question" id="q2-0">
      <p><strong>Q:</strong> Which <code>requests.get()</code> parameter prevents your script from hanging forever if the server is slow?</p>
      <div class="quiz-options">
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">headers</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">params</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, true)">timeout</button>
        <button class="quiz-option" onclick="answerQuiz(2, 0, this, false)">verify</button>
      </div>
    </div>
    <div id="m2-status" class="gate-status"></div>
  </div>
  `;
};


// ===================================================
// MISSION 03 — SECURE_CREDS
// ===================================================
MISSION_RENDERERS[3] = function() {
  return `
  <div class="panel danger-panel">
    <div class="panel-accent red"></div>
    <div class="panel-title red">NEVER Hardcode Credentials</div>
    <p>This is the number-one security mistake beginners make. If you commit an API key to GitHub, automated bots will find it within minutes and abuse it.</p>
    <div class="danger-box">
      <strong>WRONG — automatic zero and key revocation:</strong>
      <div class="code-block" style="margin-top:10px;">
        <pre><code>API_KEY = "a1b2c3d4e5f6g7h8i9j0"   # key visible in source!

response = requests.get(url, headers={"Key": API_KEY})</code></pre>
      </div>
    </div>
    <div class="hint-box">
      <strong>CORRECT — use environment variables:</strong>
      <div class="code-block" style="margin-top:10px;">
        <pre><code>import os
from dotenv import load_dotenv

load_dotenv()                                  # read .env file

API_KEY = os.getenv("ABUSEIPDB_API_KEY")       # read from environment

if not API_KEY:
    print("Error: ABUSEIPDB_API_KEY not set")
    sys.exit(1)</code></pre>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">The Three-File Pattern</div>
    <p>Three files work together to keep credentials safe:</p>
    <div class="concept-grid">
      <div class="concept-card">
        <h3 style="color:var(--red-alert);">.env — NEVER commit</h3>
        <div class="code-block" style="margin-top:8px;"><pre><code>ABUSEIPDB_API_KEY=a1b2c3d4e5f6...</code></pre></div>
        <p>Contains your actual key. Add to <code>.gitignore</code>.</p>
      </div>
      <div class="concept-card">
        <h3 style="color:var(--green-primary);">.env.example — safe to commit</h3>
        <div class="code-block" style="margin-top:8px;"><pre><code>ABUSEIPDB_API_KEY=your_api_key_here</code></pre></div>
        <p>Template showing what variables are needed. No real values.</p>
      </div>
      <div class="concept-card">
        <h3 style="color:var(--amber);">.gitignore</h3>
        <div class="code-block" style="margin-top:8px;"><pre><code>.env
.env.local
*.key</code></pre></div>
        <p>Prevents accidental commits of sensitive files.</p>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent red"></div>
    <div class="panel-title red">Find The 3 Security Problems</div>
    <p>This code has <strong>3 security mistakes</strong>. Identify all three to unlock the next mission.</p>
    <div id="creds-inspector-container"></div>
    <div id="creds-found-list" style="margin-top:12px; font-size:0.85em; color:var(--text-dim); letter-spacing:1px;">Problems found: 0 / 3</div>
    <div id="m3-status" class="gate-status"></div>
  </div>
  `;
};

function initMission3() {
  const container = document.getElementById('creds-inspector-container');
  if (!container) return;

  const problemsFound = new Set();

  const lines = [
    'import requests',
    '',
    'API_KEY = "a1b2c3d4e5f6g7h8i9j0"   # hardcoded key',
    '',
    'def fetch_threats():',
    '    response = requests.get(',
    '        "https://api.abuseipdb.com/api/v2/blacklist",',
    '        headers={"Key": API_KEY},',
    '        params={"confidenceMinimum": 90}',
    '    )',
    '    return response.json()["data"]',
  ];

  const codeBlock = document.createElement('div');
  codeBlock.className = 'code-block';
  codeBlock.style.cursor = 'default';
  const pre = document.createElement('pre');

  lines.forEach(function(line, idx) {
    const span = document.createElement('span');
    span.style.display = 'block';
    span.style.padding = '2px 4px';
    span.style.borderRadius = '2px';
    span.style.fontFamily = 'var(--font)';
    span.textContent = line;

    if (idx === 2) {
      span.style.cursor = 'pointer';
      span.style.color = 'var(--amber)';
      span.title = 'Click if you think this line contains a security problem';
      span.addEventListener('click', function() {
        if (problemsFound.has('hardcoded_key')) return;
        problemsFound.add('hardcoded_key');
        span.style.background = 'rgba(255,60,60,0.2)';
        span.style.color = 'var(--red-alert)';
        span.style.cursor = 'default';
        span.title = 'Found: API key hardcoded in source code';
        updateM3Count();
      });
    }
    pre.appendChild(span);
  });

  codeBlock.appendChild(pre);
  container.appendChild(codeBlock);

  const missingNote = document.createElement('div');
  missingNote.style.marginTop = '14px';
  missingNote.style.fontSize = '0.88em';

  const label = document.createElement('span');
  label.style.color = 'var(--text-dim)';
  label.textContent = 'Missing security measures (click to flag): ';
  missingNote.appendChild(label);

  [
    { key: 'no_dotenv',    label: 'load_dotenv() is never called' },
    { key: 'no_gitignore', label: '.env is not in .gitignore' },
  ].forEach(function(item) {
    const btn = document.createElement('button');
    btn.textContent = item.label;
    btn.style.cssText = 'background:var(--bg-editor);border:1px solid var(--amber);color:var(--amber);padding:4px 12px;cursor:pointer;font-family:var(--font);font-size:0.85em;margin:4px 6px;border-radius:2px;transition:all 0.2s;';
    btn.addEventListener('click', function() {
      if (problemsFound.has(item.key)) return;
      problemsFound.add(item.key);
      btn.style.background = 'rgba(255,60,60,0.2)';
      btn.style.color = 'var(--red-alert)';
      btn.style.borderColor = 'var(--red-alert)';
      btn.disabled = true;
      updateM3Count();
    });
    missingNote.appendChild(btn);
  });

  container.appendChild(missingNote);

  function updateM3Count() {
    const countEl = document.getElementById('creds-found-list');
    if (countEl) countEl.textContent = 'Problems found: ' + problemsFound.size + ' / 3';
    if (problemsFound.size >= 3) {
      const statusEl = document.getElementById('m3-status');
      if (statusEl) statusEl.innerHTML = '<span class="status-pass">\u2713 ALL 3 PROBLEMS IDENTIFIED \u2014 MISSION 03 COMPLETE</span>';
      setTimeout(function() { completeMission(3); }, 800);
    }
  }
}


// ===================================================
// MISSION 04 — ERROR_HANDLING
// ===================================================
window._m4StarterCode = `import requests

def fetch_abuseipdb_feed(api_key, confidence_min=90, limit=50):
    """Fetch threat data with comprehensive error handling."""
    url = "https://api.abuseipdb.com/api/v2/blacklist"
    headers = {"Key": api_key, "Accept": "application/json"}
    params = {"confidenceMinimum": confidence_min, "limit": limit}

    try:
        response = requests.get(url, headers=headers, params=params, timeout=30)
        response.raise_for_status()
        return response.json()["data"]

    except requests.exceptions.Timeout:
        print("Request timed out after 30 seconds")
        return None

    except requests.exceptions.ConnectionError:
        print("Could not connect to API")
        return None

    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            print("Invalid API key")
        elif e.response.status_code == 429:
            print("Rate limit exceeded")
        else:
            print(f"HTTP error: {e.response.status_code}")
        return None

# Verify structure
print("fetch_abuseipdb_feed function defined")
print("Returns None on Timeout, ConnectionError, and HTTPError")
print("Uses raise_for_status() to catch 4xx/5xx automatically")
`;

MISSION_RENDERERS[4] = function() {
  return `
  <div class="panel">
    <div class="panel-accent red"></div>
    <div class="panel-title red">APIs Fail — Your Code Must Not</div>
    <p>Networks go down. Servers time out. Rate limits get hit. If your aggregator crashes whenever the API is unavailable, it becomes useless in production. Every API call must be wrapped in error handling that returns <code>None</code> on failure and lets the rest of the tool keep running.</p>
    <div class="hint-box">
      <strong>Key Principle:</strong> Return <code>None</code> on any failure. Check for <code>None</code> before using the result. Never let an API error crash your entire tool. This is called <strong>graceful degradation</strong>.
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">The Exception Hierarchy</div>
    <p>The <code>requests</code> library raises specific exceptions for different failure modes. Catch each one separately:</p>
    <table>
      <thead><tr><th>Exception</th><th>When It Fires</th><th>Action</th></tr></thead>
      <tbody>
        <tr><td><code>requests.exceptions.Timeout</code></td><td>Server took too long to respond</td><td>Print warning, return None</td></tr>
        <tr><td><code>requests.exceptions.ConnectionError</code></td><td>DNS failure, network down</td><td>Print warning, return None</td></tr>
        <tr><td><code>requests.exceptions.HTTPError</code></td><td>4xx/5xx status code (after raise_for_status)</td><td>Check status code, print message, return None</td></tr>
      </tbody>
    </table>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <pre><code>response.raise_for_status()  # raises HTTPError for 4xx/5xx</code></pre>
    </div>
    <p>Call <code>raise_for_status()</code> immediately after <code>requests.get()</code>. It converts bad status codes into catchable exceptions, so you do not need to check <code>response.status_code</code> manually for every error case.</p>
  </div>

  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Graceful Degradation Pattern</div>
    <div class="code-block">
      <span class="code-lang-tag">python</span>
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre><code># Main aggregation — keeps working even if API fails
all_indicators = []

# Local files always work
for feed_file in ["vendor_a.json", "vendor_b.json"]:
    indicators = load_and_normalize(feed_file)
    all_indicators.extend(indicators)

# API may fail gracefully
api_data = fetch_abuseipdb_feed(api_key)
if api_data:
    normalized = [normalize_abuseipdb(i) for i in api_data]
    all_indicators.extend(normalized)
    print(f"Added {len(normalized)} indicators from API")
else:
    print("API unavailable — continuing with local files only")

# Processing continues regardless
deduplicated = deduplicate_indicators(all_indicators)</code></pre>
    </div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Code Gate — Write the Error Handler</div>
    <p>The starter code shows a complete <code>fetch_abuseipdb_feed()</code> with proper error handling. Read it, understand the pattern, then run it to verify the structure is correct.</p>
    <p style="color:var(--text-dim); font-size:0.85em;">The gate passes when your output confirms the function is defined with all three exception types handled.</p>
    <textarea id="gate-m4" data-codemirror data-initial=""></textarea>
    <div class="btn-row" style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
      <button class="btn-run" onclick="runM4()">&#9654; RUN CODE</button>
      <button class="btn-reset" onclick="resetEditor('gate-m4', window._m4StarterCode)">&#x21BA; RESET</button>
    </div>
    <div id="gate-m4-output" class="gate-output"></div>
    <div id="m4-status" class="gate-status"></div>
  </div>
  `;
};

async function runM4() {
  const passed = await runCode('gate-m4', 'gate-m4-output', function(stdout, code) {
    const hasTimeout = code.includes('requests.exceptions.Timeout');
    const hasConnection = code.includes('requests.exceptions.ConnectionError');
    const hasHTTPError = code.includes('requests.exceptions.HTTPError');
    const hasRaiseForStatus = code.includes('raise_for_status');
    const hasReturnNone = (code.match(/return None/g) || []).length >= 3;
    return hasTimeout && hasConnection && hasHTTPError && hasRaiseForStatus && hasReturnNone;
  });
  const statusEl = document.getElementById('m4-status');
  if (passed) {
    statusEl.innerHTML = '<span class="status-pass">\u2713 ERROR HANDLING COMPLETE \u2014 MISSION 04 COMPLETE</span>';
    setTimeout(function() { completeMission(4); }, 800);
  } else {
    statusEl.innerHTML = '<span class="status-fail">\u2717 Make sure your function catches all three exception types, calls raise_for_status(), and returns None in each except block.</span>';
  }
}


// ===================================================
// MISSION 05 — API_SIMULATOR
// ===================================================
MISSION_RENDERERS[5] = function() {
  return `
  <div class="panel">
    <div class="panel-accent blue"></div>
    <div class="panel-title blue">Interactive API Simulator</div>
    <p>This simulator mimics AbuseIPDB's behavior safely — no real API calls, no key required. Practice reading responses and understanding what your error handler would receive in each scenario.</p>
    <p style="color:var(--text-dim); font-size:0.85em;">To unlock Mission 06, you must trigger all three scenarios: a successful 200 response, a 401 Unauthorized, and a 429 Rate Limit.</p>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Simulate a Request</div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
      <div>
        <label style="display:block; margin-bottom:6px; color:var(--text-dim); font-size:0.85em;">API KEY</label>
        <input type="text" id="sim-api-key" placeholder="Try: valid_key_123 or invalid_key"
          style="width:100%; padding:10px; background:var(--bg-editor); border:1px solid var(--border); color:var(--text-primary); font-family:var(--font); font-size:0.85em; border-radius:2px;">
        <p style="margin-top:6px; color:var(--text-dim); font-size:0.78em;">Enter "valid_key_123" for success, "rate_limited" for 429, anything else for 401</p>
      </div>
      <div>
        <label style="display:block; margin-bottom:6px; color:var(--text-dim); font-size:0.85em;">CONFIDENCE MIN</label>
        <input type="number" id="sim-confidence" value="90" min="0" max="100"
          style="width:80px; padding:10px; background:var(--bg-editor); border:1px solid var(--border); color:var(--text-primary); font-family:var(--font);">
      </div>
    </div>
    <div style="display:flex; gap:10px; flex-wrap:wrap;">
      <button class="btn-run" onclick="simMakeRequest()">&#127760; MAKE REQUEST</button>
      <button class="btn-reset" onclick="simTimeout()">&#9201; SIMULATE TIMEOUT</button>
    </div>
    <div id="sim-terminal" class="gate-output" style="margin-top:16px; min-height:120px;"></div>
  </div>

  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Scenarios Seen</div>
    <div id="sim-checklist" style="display:flex; gap:16px; flex-wrap:wrap; font-size:0.9em;">
      <div id="sim-check-200" style="color:var(--text-dim);">&#9744; 200 Success</div>
      <div id="sim-check-401" style="color:var(--text-dim);">&#9744; 401 Unauthorized</div>
      <div id="sim-check-429" style="color:var(--text-dim);">&#9744; 429 Rate Limited</div>
    </div>
    <div id="m5-status" class="gate-status" style="margin-top:12px;"></div>
  </div>
  `;
};

const simState = { seen200: false, seen401: false, seen429: false };

const simSampleIPs = [
  {ipAddress: "185.220.101.1", abuseConfidenceScore: 100},
  {ipAddress: "45.148.10.85",  abuseConfidenceScore: 98},
  {ipAddress: "194.26.29.120", abuseConfidenceScore: 95},
  {ipAddress: "171.25.193.77", abuseConfidenceScore: 92},
  {ipAddress: "185.100.87.174",abuseConfidenceScore: 90},
];

function simLog(text, cls) {
  const term = document.getElementById('sim-terminal');
  if (!term) return;
  const line = document.createElement('div');
  line.style.cssText = 'padding:2px 0; font-size:0.88em;';
  if (cls === 'error') line.style.color = 'var(--red-alert)';
  else if (cls === 'success') line.style.color = 'var(--green-primary)';
  else if (cls === 'warn') line.style.color = 'var(--amber)';
  else if (cls === 'info') line.style.color = 'var(--blue-info)';
  line.textContent = '>>> ' + text;
  term.appendChild(line);
  term.scrollTop = term.scrollHeight;
}

function simClear() {
  const term = document.getElementById('sim-terminal');
  if (term) term.innerHTML = '';
}

function simCheckComplete() {
  const c200 = document.getElementById('sim-check-200');
  const c401 = document.getElementById('sim-check-401');
  const c429 = document.getElementById('sim-check-429');
  if (simState.seen200 && c200) { c200.style.color = 'var(--green-primary)'; c200.textContent = '\u2713 200 Success'; }
  if (simState.seen401 && c401) { c401.style.color = 'var(--green-primary)'; c401.textContent = '\u2713 401 Unauthorized'; }
  if (simState.seen429 && c429) { c429.style.color = 'var(--green-primary)'; c429.textContent = '\u2713 429 Rate Limited'; }

  if (simState.seen200 && simState.seen401 && simState.seen429) {
    const statusEl = document.getElementById('m5-status');
    if (statusEl) statusEl.innerHTML = '<span class="status-pass">\u2713 ALL SCENARIOS TESTED \u2014 MISSION 05 COMPLETE</span>';
    setTimeout(function() { completeMission(5); }, 800);
  }
}

function simMakeRequest() {
  simClear();
  const apiKey = document.getElementById('sim-api-key').value.trim();
  const confidence = parseInt(document.getElementById('sim-confidence').value) || 90;

  simLog('Making request to api.abuseipdb.com/api/v2/blacklist...', 'info');
  simLog('Headers: {"Key": "' + (apiKey ? apiKey.substring(0, 8) + '...' : '(empty)') + '", "Accept": "application/json"}', '');
  simLog('Params: {"confidenceMinimum": ' + confidence + ', "limit": 50}', '');

  setTimeout(function() {
    if (apiKey === 'rate_limited') {
      simLog('HTTP 429 Too Many Requests', 'error');
      simLog('Daily limit of 1,000 calls exceeded. Retry-After: 3600s', 'warn');
      simLog('Your handler: print("Rate limit exceeded"); return None', 'warn');
      simState.seen429 = true;
    } else if (apiKey === 'valid_key_123') {
      const filtered = simSampleIPs.filter(function(ip) { return ip.abuseConfidenceScore >= confidence; });
      simLog('HTTP 200 OK', 'success');
      simLog('Received ' + filtered.length + ' indicators:', 'success');
      filtered.forEach(function(ip) {
        simLog('  ' + ip.ipAddress + ' — confidence: ' + ip.abuseConfidenceScore, 'success');
      });
      simLog('response.json()["data"] returned successfully', 'success');
      simState.seen200 = true;
    } else {
      simLog('HTTP 401 Unauthorized', 'error');
      simLog('Invalid or missing API key', 'error');
      simLog('Your handler: print("Invalid API key"); return None', 'warn');
      simState.seen401 = true;
    }
    simCheckComplete();
  }, 800);
}

function simTimeout() {
  simClear();
  simLog('Making request to api.abuseipdb.com...', 'info');
  simLog('Waiting for response... (30s timeout)', '');
  setTimeout(function() {
    simLog('requests.exceptions.Timeout raised after 30 seconds', 'error');
    simLog('Your handler: print("Request timed out after 30 seconds"); return None', 'warn');
    simLog('(Timeout does not count toward the 3 required scenarios)', 'info');
  }, 2000);
}

function initMission5() {
  simState.seen200 = false;
  simState.seen401 = false;
  simState.seen429 = false;
}


// ===================================================
// MISSION 06 — FINAL_CHALLENGE
// ===================================================
window._c1StarterCode = `# Challenge 1: Normalize an AbuseIPDB indicator
# Map from AbuseIPDB format to the standard schema.
#
# Input format:
#   {"ipAddress": "185.220.101.1", "abuseConfidenceScore": 100}
#
# Output format:
#   {"id": "AIPDB-0000", "type": "ip", "value": "...", "confidence": ..., "source": "AbuseIPDB"}

def normalize_abuseipdb(indicator, index):
    return {
        "id": f"AIPDB-{index:04d}",
        "type": "ip",
        "value": indicator["ipAddress"],
        "confidence": indicator["abuseConfidenceScore"],
        "source": "AbuseIPDB"
    }

# Test it
test_input = {"ipAddress": "185.220.101.1", "abuseConfidenceScore": 100}
result = normalize_abuseipdb(test_input, 0)
print(f"id: {result['id']}")
print(f"type: {result['type']}")
print(f"value: {result['value']}")
print(f"confidence: {result['confidence']}")
print(f"source: {result['source']}")
`;
window._c2StarterCode = `# Challenge 2: Safe API request wrapper
# Write a function that makes a GET request and returns None on ANY error.
# Must handle: Timeout, ConnectionError, HTTPError.
import requests

def safe_api_request(url, headers, params):
    'Make API request - returns parsed JSON or None on any failure.'
    try:
        response = requests.get(url, headers=headers, params=params, timeout=30)
        response.raise_for_status()
        return response.json()

    except requests.exceptions.Timeout:
        print("Request timed out")
        return None

    except requests.exceptions.ConnectionError:
        print("Connection failed")
        return None

    except requests.exceptions.HTTPError as e:
        print(f"HTTP error: {e.response.status_code}")
        return None

# Verify structure
import inspect
src = inspect.getsource(safe_api_request)
has_timeout = "exceptions.Timeout" in src
has_conn = "exceptions.ConnectionError" in src
has_http = "exceptions.HTTPError" in src
has_raise = "raise_for_status" in src

print(f"Handles Timeout: {has_timeout}")
print(f"Handles ConnectionError: {has_conn}")
print(f"Handles HTTPError: {has_http}")
print(f"Calls raise_for_status: {has_raise}")
print("All checks passed!" if all([has_timeout, has_conn, has_http, has_raise]) else "Missing exception handler")
`;
window._c3StarterCode = `# Challenge 3: Threat level mapper
# Map a confidence score (0-100) to a threat level string.
#
# 90-100 -> "critical"
# 70-89  -> "high"
# 50-69  -> "medium"
# 0-49   -> "low"

def get_threat_level(confidence):
    if confidence >= 90:
        return "critical"
    elif confidence >= 70:
        return "high"
    elif confidence >= 50:
        return "medium"
    else:
        return "low"

# Test all boundaries
tests = [(100, "critical"), (90, "critical"), (89, "high"), (70, "high"),
         (69, "medium"), (50, "medium"), (49, "low"), (0, "low")]

all_pass = True
for score, expected in tests:
    result = get_threat_level(score)
    status = "\u2713" if result == expected else "\u2717"
    if result != expected: all_pass = False
    print(f"{status} get_threat_level({score}) = '{result}' (expected '{expected}')")

print()
print("All tests passed!" if all_pass else "Some tests failed - check your boundaries")
`;
MISSION_RENDERERS[6] = function() {
  return `
  <div class="panel">
    <div class="panel-accent amber"></div>
    <div class="panel-title amber">Three Final Challenges</div>
    <p>Three functions stand between you and a working threat intelligence aggregator. Each one must pass its automated check before you can move on. Pass all three to complete the operation.</p>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Challenge 1 — Normalize AbuseIPDB Indicator</div>
    <p>AbuseIPDB returns indicators like <code>{"ipAddress": "1.2.3.4", "abuseConfidenceScore": 100}</code>. Write <code>normalize_abuseipdb(indicator, index)</code> to map it to the standard schema with keys: <code>id</code>, <code>type</code>, <code>value</code>, <code>confidence</code>, <code>source</code>.</p>
    <textarea id="gate-c1" data-codemirror data-initial=""></textarea>
    <div class="btn-row" style="margin-top:12px; display:flex; gap:10px;">
      <button class="btn-run" onclick="runC1()">&#9654; RUN</button>
      <button class="btn-reset" onclick="resetEditor('gate-c1', window._c1StarterCode)">&#x21BA; RESET</button>
    </div>
    <div id="gate-c1-output" class="gate-output"></div>
    <div id="c1-status" class="gate-status"></div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Challenge 2 — Safe API Request</div>
    <p>Write <code>safe_api_request(url, headers, params)</code> that makes a GET request and returns <code>None</code> on any failure. Must handle <code>Timeout</code>, <code>ConnectionError</code>, and <code>HTTPError</code>.</p>
    <textarea id="gate-c2" data-codemirror data-initial=""></textarea>
    <div class="btn-row" style="margin-top:12px; display:flex; gap:10px;">
      <button class="btn-run" onclick="runC2()">&#9654; RUN</button>
      <button class="btn-reset" onclick="resetEditor('gate-c2', window._c2StarterCode)">&#x21BA; RESET</button>
    </div>
    <div id="gate-c2-output" class="gate-output"></div>
    <div id="c2-status" class="gate-status"></div>
  </div>

  <div class="panel">
    <div class="panel-accent"></div>
    <div class="panel-title">Challenge 3 — Threat Level Mapper</div>
    <p>Write <code>get_threat_level(confidence)</code> that maps a 0-100 confidence score to <code>"critical"</code> (&ge;90), <code>"high"</code> (&ge;70), <code>"medium"</code> (&ge;50), or <code>"low"</code> (below 50).</p>
    <textarea id="gate-c3" data-codemirror data-initial=""></textarea>
    <div class="btn-row" style="margin-top:12px; display:flex; gap:10px;">
      <button class="btn-run" onclick="runC3()">&#9654; RUN</button>
      <button class="btn-reset" onclick="resetEditor('gate-c3', window._c3StarterCode)">&#x21BA; RESET</button>
    </div>
    <div id="gate-c3-output" class="gate-output"></div>
    <div id="c3-status" class="gate-status"></div>
  </div>

  <div id="m6-overall-status"></div>
  `;
};

const challengesPassed = { c1: false, c2: false, c3: false };

function checkAllChallenges() {
  if (challengesPassed.c1 && challengesPassed.c2 && challengesPassed.c3) {
    const el = document.getElementById('m6-overall-status');
    if (el) el.innerHTML = '<div class="panel"><div class="panel-accent" style="background:var(--green-primary)"></div><div class="panel-title" style="color:var(--green-primary)">OPERATION COMPLETE</div><p>Threat intelligence aggregator is fully operational. You can make authenticated API calls, handle every failure mode gracefully, normalize vendor data to a common schema, and classify threats by severity. The SOC is ready.</p></div>';
    setTimeout(function() { completeMission(6); }, 1000);
  }
}

async function runC1() {
  const passed = await runCode('gate-c1', 'gate-c1-output', function(stdout, code) {
    return stdout.includes('id: AIPDB-0000') &&
           stdout.includes('type: ip') &&
           stdout.includes('value: 185.220.101.1') &&
           stdout.includes('confidence: 100') &&
           stdout.includes('source: AbuseIPDB');
  });
  const el = document.getElementById('c1-status');
  if (passed) {
    el.innerHTML = '<span class="status-pass">\u2713 Challenge 1 passed</span>';
    challengesPassed.c1 = true;
    checkAllChallenges();
  } else {
    el.innerHTML = '<span class="status-fail">\u2717 Output must include id AIPDB-0000, type ip, correct value, confidence 100, source AbuseIPDB.</span>';
  }
}

async function runC2() {
  const passed = await runCode('gate-c2', 'gate-c2-output', function(stdout, code) {
    return stdout.includes('Handles Timeout: True') &&
           stdout.includes('Handles ConnectionError: True') &&
           stdout.includes('Handles HTTPError: True') &&
           stdout.includes('Calls raise_for_status: True') &&
           stdout.includes('All checks passed!');
  });
  const el = document.getElementById('c2-status');
  if (passed) {
    el.innerHTML = '<span class="status-pass">\u2713 Challenge 2 passed</span>';
    challengesPassed.c2 = true;
    checkAllChallenges();
  } else {
    el.innerHTML = '<span class="status-fail">\u2717 Make sure you handle all 3 exception types and call raise_for_status().</span>';
  }
}

async function runC3() {
  const passed = await runCode('gate-c3', 'gate-c3-output', function(stdout, code) {
    return stdout.includes('All tests passed!') &&
           !stdout.includes('Some tests failed');
  });
  const el = document.getElementById('c3-status');
  if (passed) {
    el.innerHTML = '<span class="status-pass">\u2713 Challenge 3 passed</span>';
    challengesPassed.c3 = true;
    checkAllChallenges();
  } else {
    el.innerHTML = '<span class="status-fail">\u2717 Check your boundary conditions: 90 \u2192 critical, 70 \u2192 high, 50 \u2192 medium, 49 \u2192 low.</span>';
  }
}
