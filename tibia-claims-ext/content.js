const cache = {};

const VOCATION_SHORT = {
  "Elite Knight": "EK", "Royal Paladin": "RP", "Master Sorcerer": "MS",
  "Elder Druid": "ED", "Knight": "K", "Paladin": "P", "Sorcerer": "S",
  "Druid": "D", "Grand Master Monk": "GMM", "Monk": "MNK",
};
const VOC_COLORS = {
  "EK": "#c0392b", "K": "#e74c3c",
  "RP": "#27ae60", "P": "#2ecc71",
  "MS": "#8e44ad", "S": "#9b59b6",
  "ED": "#16a085", "D": "#1abc9c",
  "GMM": "#d4a017", "MNK": "#f0c040",
};

async function fetchCharacter(name) {
  if (cache[name] !== undefined) return cache[name];
  cache[name] = null;
  try {
    const res = await fetch(`https://api.tibiadata.com/v4/character/${encodeURIComponent(name)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const char = data?.character?.character;
    if (!char) return null;
    cache[name] = { level: char.level, vocation: char.vocation, vocationShort: VOCATION_SHORT[char.vocation] || char.vocation };
    return cache[name];
  } catch { return null; }
}

async function processAll() {
  document.querySelectorAll("span.text-sm span.font-semibold").forEach(async el => {
    const parent = el.parentElement;
    if (!parent?.textContent.includes("claimed by")) return;
    if (parent.querySelector(".tibia-ext-badge")) return;

    const name = el.textContent.trim();
    const info = await fetchCharacter(name);
    if (!info) return;

    const voc = info.vocationShort;
    const color = VOC_COLORS[voc] || "#555";
    const textColor = ["RP", "P", "GMM", "MNK"].includes(voc) ? "#000" : "#fff";

    const badge = document.createElement("span");
    badge.className = "tibia-ext-badge";
    badge.style.cssText = "margin-left:8px;display:inline-flex;gap:3px;vertical-align:middle;";
    badge.innerHTML = `<span style="background:${color};color:${textColor};padding:1px 5px;border-radius:3px;font-size:10px;font-weight:700;">${voc}</span><span style="background:rgba(255,255,255,0.15);color:inherit;padding:1px 5px;border-radius:3px;font-size:10px;font-weight:600;border:1px solid rgba(255,255,255,0.2);">${info.level}</span>`;
    parent.appendChild(badge);
  });
}

// Czekaj aż React wyrenderuje dane — odpala się gdy DOM się zmienia
let timer;
const observer = new MutationObserver(() => {
  clearTimeout(timer);
  timer = setTimeout(processAll, 800);
});
observer.observe(document.body, { childList: true, subtree: true });

// Też próbuj co 2 sekundy przez pierwsze 30s na wypadek gdyby MutationObserver nie złapał
let attempts = 0;
const interval = setInterval(() => {
  processAll();
  attempts++;
  if (attempts >= 15) clearInterval(interval);
}, 2000);
