const MAX_WEEK_SCAN = 30;
const CARD_TONES = [
  "#63d5ff",
  "#5de8d2",
  "#86d54f",
  "#ffe26a",
  "#ffb85c",
  "#ff7b8e",
  "#b595ff"
];

const weekGrid = document.getElementById("week-grid");
const heroCta = document.querySelector(".hero-cta");

function roleFromBadge(badgeText) {
  if (!badgeText) {
    return "Student Mission";
  }

  const parts = badgeText
    .split("//")
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.length >= 3 ? parts[2] : "Student Mission";
}

function parseWeekPage(html, weekNumber, path) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const title =
    doc.querySelector("#site-title")?.textContent?.trim() ||
    doc.title?.split("—")[0]?.trim() ||
    `Week ${weekNumber}`;
  const role = roleFromBadge(doc.querySelector(".terminal-badge")?.textContent?.trim());
  const mission =
    doc.querySelector("#site-subtitle")?.textContent?.trim() ||
    "Open this week's operation.";

  return {
    week: weekNumber,
    path,
    title,
    role,
    mission,
    tone: CARD_TONES[(weekNumber - 1) % CARD_TONES.length]
  };
}

async function loadWeek(weekNumber) {
  const path = `Week${weekNumber}/index.html`;

  try {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }
    const html = await response.text();
    return parseWeekPage(html, weekNumber, path);
  } catch (error) {
    return null;
  }
}

function createWeekCard(item, index) {
  const card = document.createElement("article");
  card.className = "week-card";
  card.style.setProperty("--delay", `${index * 70}ms`);
  card.style.setProperty("--tone", item.tone);

  const number = document.createElement("p");
  number.className = "week-number";
  number.textContent = `WEEK ${item.week}`;

  const title = document.createElement("h3");
  title.className = "week-title";
  title.textContent = item.title;

  const role = document.createElement("p");
  role.className = "week-role";
  role.textContent = item.role;

  const mission = document.createElement("p");
  mission.className = "week-mission";
  mission.textContent = item.mission;

  const link = document.createElement("a");
  link.className = "week-link";
  link.href = item.path;
  link.textContent = `Open Week ${item.week}`;

  card.append(number, title, role, mission, link);
  return card;
}

async function renderWeeks() {
  if (!weekGrid) {
    return;
  }

  weekGrid.textContent = "Scanning available weeks...";
  const requestedWeeks = Array.from({ length: MAX_WEEK_SCAN }, (_, index) => index + 1);
  const loadedWeeks = await Promise.all(requestedWeeks.map(loadWeek));
  const weeks = loadedWeeks.filter(Boolean).sort((a, b) => a.week - b.week);

  weekGrid.innerHTML = "";

  if (weeks.length === 0) {
    weekGrid.textContent = "No week pages were detected.";
    if (heroCta) {
      heroCta.style.display = "none";
    }
    return;
  }

  weeks.forEach((item, index) => {
    weekGrid.appendChild(createWeekCard(item, index));
  });

  if (heroCta) {
    heroCta.href = weeks[0].path;
    heroCta.textContent = `Begin at Week ${weeks[0].week}`;
  }
}

renderWeeks();
