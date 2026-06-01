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

async function getOptions() {
  return new Promise(resolve => {
    chrome.storage.local.get(["optVoc", "optLvl", "optGuild", "guildName"], res => {
      resolve({
        optVoc: res.optVoc !== undefined ? res.optVoc : true,
        optLvl: res.optLvl !== undefined ? res.optLvl : true,
        optGuild: res.optGuild !== undefined ? res.optGuild : true,
        guildName: res.guildName || "Rebels",
      });
    });
  });
}

async function fetchCharacter(name) {
  if (cache[name] !== undefined) return cache[name];
  cache[name] = null;
  try {
    const res = await fetch(`https://api.tibiadata.com/v4/character/${encodeURIComponent(name)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const char = data?.character?.character;
    if (!char) return null;
    cache[name] = {
      level: char.level,
      vocation: char.vocation,
      vocationShort: VOCATION_SHORT[char.vocation] || char.vocation,
      guild: char.guild || null,
    };
    return cache[name];
  } catch { return null; }
}

async function processAll() {
  const opts = await getOptions();

  document.querySelectorAll("span.text-sm span.font-semibold").forEach(async el => {
    const parent = el.parentElement;
    if (!parent?.textContent.includes("claimed by")) return;
    if (parent.querySelector(".tibia-ext-badge")) return;

    const name = el.textContent.trim();
    const info = await fetchCharacter(name);
    if (!info) return;

    const badge = document.createElement("span");
    badge.className = "tibia-ext-badge";
    badge.style.cssText = "margin-left:8px;display:inline-flex;gap:3px;vertical-align:middle;flex-wrap:wrap;";

    // Profesja
    if (opts.optVoc) {
      const voc = info.vocationShort;
      const color = VOC_COLORS[voc] || "#555";
      const textColor = ["RP", "P", "GMM", "MNK"].includes(voc) ? "#000" : "#fff";
      badge.innerHTML += `<span style="background:${color};color:${textColor};padding:1px 5px;border-radius:3px;font-size:10px;font-weight:700;">${voc}</span>`;
    }

    // Poziom
    if (opts.optLvl) {
      badge.innerHTML += `<span style="background:rgba(255,255,255,0.15);color:inherit;padding:1px 5px;border-radius:3px;font-size:10px;font-weight:600;border:1px solid rgba(255,255,255,0.2);">${info.level}</span>`;
    }

    // Gildia
    if (opts.optGuild && info.guild?.name) {
      const charGuild = info.guild.name.toLowerCase();
      const tracked = opts.guildName.toLowerCase();
      if (charGuild === tracked) {
        const rank = info.guild.rank || "";
        badge.innerHTML += `<span style="background:#7d5a00;color:#ffd700;padding:1px 5px;border-radius:3px;font-size:10px;font-weight:700;border:1px solid #b8860b;">${info.guild.name}${rank ? " · " + rank : ""}</span>`;
      }
    }

    if (badge.innerHTML) parent.appendChild(badge);
  });
}

let timer;
const observer = new MutationObserver(() => {
  clearTimeout(timer);
  timer = setTimeout(processAll, 800);
});
observer.observe(document.body, { childList: true, subtree: true });

let attempts = 0;
const interval = setInterval(() => {
  processAll();
  attempts++;
  if (attempts >= 15) clearInterval(interval);
}, 2000);
