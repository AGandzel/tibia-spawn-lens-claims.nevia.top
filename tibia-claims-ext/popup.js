let autoInterval = null;
let isRunning = false;

async function runScript(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
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

      document.querySelectorAll("span.text-sm span.font-semibold").forEach(async el => {
        const parent = el.parentElement;
        if (!parent?.textContent.includes("claimed by")) return;
        if (parent.querySelector(".tibia-ext-badge")) return;

        const name = el.textContent.trim();
        try {
          const res = await fetch(`https://api.tibiadata.com/v4/character/${encodeURIComponent(name)}`);
          const data = await res.json();
          const char = data?.character?.character;
          if (!char) return;

          const voc = VOCATION_SHORT[char.vocation] || char.vocation;
          const color = VOC_COLORS[voc] || "#555";
          const textColor = ["RP", "P", "GMM", "MNK"].includes(voc) ? "#000" : "#fff";

          const badge = document.createElement("span");
          badge.className = "tibia-ext-badge";
          badge.style.cssText = "margin-left:8px;display:inline-flex;gap:3px;vertical-align:middle;";
          badge.innerHTML = `
            <span style="background:${color};color:${textColor};padding:1px 5px;border-radius:3px;font-size:10px;font-weight:700;">${voc}</span>
            <span style="background:rgba(255,255,255,0.15);color:inherit;padding:1px 5px;border-radius:3px;font-size:10px;font-weight:600;border:1px solid rgba(255,255,255,0.2);">${char.level}</span>
          `;
          parent.appendChild(badge);
        } catch (e) {}
      });
    }
  });
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

document.getElementById("btn").addEventListener("click", async () => {
  const tab = await getActiveTab();
  await runScript(tab.id);
  document.getElementById("status").textContent = "✓ Gotowe!";
  setTimeout(() => { document.getElementById("status").textContent = isRunning ? "🔄 Auto aktywne" : ""; }, 1500);
});

document.getElementById("auto-btn").addEventListener("click", async () => {
  const tab = await getActiveTab();
  const status = document.getElementById("status");
  const autoBtn = document.getElementById("auto-btn");

  if (isRunning) {
    clearInterval(autoInterval);
    autoInterval = null;
    isRunning = false;
    autoBtn.textContent = "▶ Auto (10s)";
    autoBtn.style.background = "#2980b9";
    status.textContent = "⏹ Zatrzymano";
    setTimeout(() => { status.textContent = ""; }, 1500);
  } else {
    isRunning = true;
    autoBtn.textContent = "⏹ Zatrzymaj auto";
    autoBtn.style.background = "#e67e22";
    status.textContent = "🔄 Auto aktywne";
    await runScript(tab.id);
    autoInterval = setInterval(async () => {
      const currentTab = await getActiveTab();
      await runScript(currentTab.id);
    }, 10000);
  }
});
