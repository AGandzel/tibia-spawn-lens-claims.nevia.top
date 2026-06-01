# Tibia Claims Info — Chrome Extension

Rozszerzenie do Chrome, które automatycznie pobiera i wyświetla **profesję** oraz **poziom** postaci z gry Tibia obok ich nazw na stronie [claims.nevia.top](https://claims.nevia.top).

![preview](https://i.imgur.com/UTozWKP.png)
> *Przykład: `claimed by Heetsen` → `claimed by Heetsen [RP] [509]`*

---

## Funkcje

- Automatycznie uruchamia się po wejściu na `claims.nevia.top`
- Pobiera dane postaci z [TibiaData API v4](https://tibiadata.com/)
- Wyświetla skrót profesji z kolorowym badge'em i poziom postaci
- Cache — nie odpytuje API wielokrotnie dla tej samej postaci
- Obsługuje wszystkie profesje w tym **Monk / Grand Master Monk**
- Działa z dynamicznie renderowaną stroną (Next.js / React)
- Popup z przyciskiem do ręcznego uruchomienia jako backup

---

## Obsługiwane profesje

| Profesja | Skrót | Kolor |
|---|---|---|
| Elite Knight | `EK` | 🔴 Czerwony |
| Knight | `K` | 🔴 Jasny czerwony |
| Royal Paladin | `RP` | 🟢 Zielony |
| Paladin | `P` | 🟢 Jasny zielony |
| Master Sorcerer | `MS` | 🟣 Fioletowy |
| Sorcerer | `S` | 🟣 Jasny fioletowy |
| Elder Druid | `ED` | 🩵 Turkusowy |
| Druid | `D` | 🩵 Jasny turkusowy |
| Grand Master Monk | `GMM` | 🟡 Ciemnozłoty |
| Monk | `MNK` | 🟡 Złoty |

---

## Architektura projektu

```
tibia-claims-ext/
├── manifest.json      # Konfiguracja rozszerzenia (Manifest V3)
├── content.js         # Główny skrypt wstrzykiwany na stronę
├── popup.html         # UI popupu rozszerzenia
├── popup.js           # Logika popupu (ręczne uruchomienie)
├── style.css          # Style dla badge'y (używane przez content.js)
└── icon.png           # Ikona rozszerzenia
```

### Przepływ danych

```
claims.nevia.top (Next.js/React)
        │
        ▼
  content.js ładuje się automatycznie
        │
        ├── MutationObserver — wykrywa gdy React wyrenderuje listę claimów
        │
        └── Polling co 2s przez 30s — fallback
                │
                ▼
        Szuka elementów: span.text-sm > span.font-semibold
        zawierających tekst "claimed by"
                │
                ▼
        fetchCharacter(name)
        GET https://api.tibiadata.com/v4/character/{name}
                │
                ├── Cache hit → zwraca od razu
                │
                └── Cache miss → odpytuje API → zapisuje do cache
                        │
                        ▼
                Wstrzykuje badge [VOC] [LVL] obok nazwy postaci
```

---

## Technologie

| Technologia | Zastosowanie |
|---|---|
| **Chrome Extensions API — Manifest V3** | Podstawa rozszerzenia, deklaracja uprawnień i content scripts |
| **Content Scripts** | Automatyczne wstrzykiwanie JS na docelową stronę |
| **Chrome Scripting API** (`chrome.scripting`) | Ręczne uruchamianie skryptu z poziomu popupu |
| **MutationObserver API** | Wykrywanie dynamicznych zmian DOM renderowanych przez React |
| **Fetch API** | Asynchroniczne zapytania do TibiaData API |
| **TibiaData API v4** | Zewnętrzne REST API dostarczające dane postaci z gry Tibia |
| **Vanilla JavaScript (ES2020+)** | Cała logika rozszerzenia bez zewnętrznych zależności |
| **HTML / CSS** | UI popupu i stylowanie badge'y |
| **Tailwind CSS** (strona docelowa) | Selektory CSS (`span.text-sm`, `span.font-semibold`) dopasowane do klas Tailwind używanych przez claims.nevia.top |

---

## Instalacja

> Rozszerzenie nie jest opublikowane w Chrome Web Store — instalacja wymaga trybu dewelopera.

1. Pobierz lub sklonuj to repozytorium
2. Otwórz Chrome i wejdź na `chrome://extensions`
3. Włącz **Tryb dewelopera** (przełącznik w prawym górnym rogu)
4. Kliknij **Załaduj rozpakowane** i wskaż folder `tibia-claims-ext`
5. Wejdź na [claims.nevia.top](https://claims.nevia.top) — badge'e pojawią się automatycznie

---

## Jak działa content.js

Strona `claims.nevia.top` jest zbudowana w **Next.js** i renderuje listę claimów dynamicznie po załadowaniu strony (client-side React). Z tego powodu standardowe `document_idle` nie wystarczy — DOM w momencie uruchomienia skryptu zawiera tylko szkielet strony.

Rozwiązanie dwutorowe:

1. **MutationObserver** — nasłuchuje na zmiany w `document.body` i odpala `processAll()` z debounce 800ms gdy React doda nowe elementy do DOM.
2. **Polling co 2 sekundy przez 30 sekund** — fallback na wypadek gdyby observer przeoczył renderowanie.

`processAll()` szuka elementów pasujących do selektora `span.text-sm span.font-semibold`, sprawdza czy ich rodzic zawiera tekst `"claimed by"`, i dla każdego nowego nicku odpytuje TibiaData API. Wynik jest cachowany w pamięci sesji żeby ograniczyć liczbę zapytań.

---

## API

Rozszerzenie korzysta z publicznego, darmowego [TibiaData API](https://tibiadata.com/) — nie wymaga klucza API.

Endpoint:
```
GET https://api.tibiadata.com/v4/character/{name}
```

Używane pola z odpowiedzi:
- `character.character.level` — poziom postaci
- `character.character.vocation` — profesja postaci

---

## Możliwe rozszerzenia w przyszłości

- Wyświetlanie gildii postaci
- Kolorowanie całego wiersza claimu zależnie od profesji
- Tooltip z pełnymi danymi postaci po najechaniu myszką
- Auto-odświeżanie badge'y co X sekund
- Obsługa innych stron ze spawnami

---

## Licencja

MIT
