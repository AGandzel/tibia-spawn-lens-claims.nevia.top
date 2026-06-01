const mainBtn = document.getElementById("main-btn");
const optionsPanel = document.getElementById("options-panel");
const applyBtn = document.getElementById("apply-btn");
const status = document.getElementById("status");

// Załaduj zapisane opcje
chrome.storage.local.get(["optVoc", "optLvl", "optGuild", "guildName"], (res) => {
  if (res.optVoc !== undefined) document.getElementById("opt-voc").checked = res.optVoc;
  if (res.optLvl !== undefined) document.getElementById("opt-lvl").checked = res.optLvl;
  if (res.optGuild !== undefined) document.getElementById("opt-guild").checked = res.optGuild;
  if (res.guildName !== undefined) document.getElementById("guild-name").value = res.guildName;
});

// Toggle panelu opcji
mainBtn.addEventListener("click", () => {
  const isOpen = optionsPanel.classList.toggle("visible");
  mainBtn.classList.toggle("open", isOpen);
  if (!isOpen) runScript(); // zamknięcie = uruchom z aktualnymi opcjami
});

// Zastosuj i uruchom
applyBtn.addEventListener("click", () => {
  saveAndRun();
});

async function saveAndRun() {
  const optVoc = document.getElementById("opt-voc").checked;
  const optLvl = document.getElementById("opt-lvl").checked;
  const optGuild = document.getElementById("opt-guild").checked;
  const guildName = document.getElementById("guild-name").value.trim();

  await chrome.storage.local.set({ optVoc, optLvl, optGuild, guildName });

  optionsPanel.classList.remove("visible");
  mainBtn.classList.remove("open");

  await runScript({ optVoc, optLvl, optGuild, guildName });
}

async function runScript(opts) {
  if (!opts) {
    const res = await chrome.storage.local.get(["optVoc", "optLvl", "optGuild", "guildName"]);
    opts = {
      optVoc: res.optVoc !== undefined ? res.optVoc : true,
      optLvl: res.optLvl !== undefined ? res.optLvl : true,
      optGuild: res.optGuild !== undefined ? res.optGuild : true,
      guildName: res.guildName || "Rebels",
    };
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (options) => {
      const { optVoc, optLvl, optGuild, guildName } = options;

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

      // Usuń stare badge przed odświeżeniem
      document.querySelectorAll(".tibia-ext-badge").forEach(el => el.remove());

      document.querySelectorAll("span.text-sm span.font-semibold").forEach(async el => {
        const parent = el.parentElement;
        if (!parent?.textContent.includes("claimed by")) return;

        const name = el.textContent.trim();
        try {
          const res = await fetch(`https://api.tibiadata.com/v4/character/${encodeURIComponent(name)}`);
          const data = await res.json();
          const char = data?.character?.character;
          if (!char) return;

          const badge = document.createElement("span");
          badge.className = "tibia-ext-badge";
          badge.style.cssText = "margin-left:8px;display:inline-flex;gap:3px;vertical-align:middle;flex-wrap:wrap;";

          // Profesja
          if (optVoc) {
            const voc = VOCATION_SHORT[char.vocation] || char.vocation;
            const color = VOC_COLORS[voc] || "#555";
            const textColor = ["RP", "P", "GMM", "MNK"].includes(voc) ? "#000" : "#fff";
            badge.innerHTML += `<span style="background:${color};color:${textColor};padding:1px 5px;border-radius:3px;font-size:10px;font-weight:700;">${voc}</span>`;
          }

          // Poziom
          if (optLvl) {
            badge.innerHTML += `<span style="background:rgba(255,255,255,0.15);color:inherit;padding:1px 5px;border-radius:3px;font-size:10px;font-weight:600;border:1px solid rgba(255,255,255,0.2);">${char.level}</span>`;
          }

          // Gildia — tylko jeśli nazwa gildii pasuje
          if (optGuild && char.guild?.name) {
            const charGuild = char.guild.name.toLowerCase();
            const tracked = guildName.toLowerCase();
            if (charGuild === tracked) {
              const rank = char.guild.rank || "";
              badge.innerHTML += `<span style="background:#7d5a00;color:#ffd700;padding:1px 5px;border-radius:3px;font-size:10px;font-weight:700;border:1px solid #b8860b;">${char.guild.name}${rank ? " · " + rank : ""}</span>`;
            }
          }

          if (badge.innerHTML) parent.appendChild(badge);
        } catch (e) {}
      });
    },
    args: [opts],
  });

  showStatus("✓ Gotowe!");
}

function showStatus(msg) {
  status.textContent = msg;
  setTimeout(() => { status.textContent = ""; }, 2000);
}
