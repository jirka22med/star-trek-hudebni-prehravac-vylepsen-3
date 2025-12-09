# 🚀 STAR TREK: HUDEBNÍ PŘEHRÁVAČ 🖖

<div align="center">

![Star Trek](https://img.shields.io/badge/Star_Trek-LCARS-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Live-brightgreen?style=for-the-badge)
![License](https://img.shields.io/badge/License-GPL--3.0-orange?style=for-the-badge)

**"Dnešní mise: Přehrát hudbu tak, jak to Federace ještě neviděla!"**

*– Více admirál Jiřík*

[![🚀 SPUSTIT APLIKACI](https://img.shields.io/badge/🚀_SPUSTIT_APLIKACI-red?style=for-the-badge)](https://jirka22med.github.io/star-trek-hudebni-prehravac-vylepsen/)

</div>

---

## 🌟 O Projektu

Tento projekt není jen hudební přehrávač – je to **Komunikační stanice 5. generace** pro tvou hudební flotilu! Špičkový, **Star Trek: LCARS** inspirovaný audio přehrávač kombinující robustní JavaScript moduly s nejmodernějšími webovými technologiemi.

### 🎯 **Hlavní Mise:**
- 🎤 **Hlasové ovládání v češtině** - "Počítači, další skladba!"
- 🎨 **LCARS Design** - Autentický Star Trek interface
- 💡 **LED & Světelné Efekty** - Synchronizace s hudbou
- 📱 **Media Session API** - Ovládání z uzamčené obrazovky
- ⚡ **60+ FPS Výkon** - Plynulé animace

---

## ✨ Klíčové Vlastnosti

### 🎤 **Interakce a Ovládání**

#### 🗣️ Hlasové Příkazy "Počítači, Engage!"
```javascript
// Podporované příkazy:
"Počítači, další"      → Další skladba
"Počítači, předchozí"  → Předchozí skladba
"Počítači, pauza"      → Pozastavení
"Počítači, play"       → Přehrávání
"Počítači, hlasitost 50" → Nastavení hlasitosti
```

#### 📱 Media Session API
- ✅ Ovládání z notifikací (Android)
- ✅ Ovládání z uzamčené obrazovky
- ✅ Integrace s Bluetooth ovladači
- ✅ Displej v autě

#### 🎚️ Mini Přehrávač
- ✅ Plovoucí okno
- ✅ Drag & Drop pozice
- ✅ Kompaktní ovládání
- ✅ Vždy navrchu

---

### 🎼 **Správa Playlistu**

| Funkce | Popis |
|:-------|:------|
| 🔀 **Drag & Drop** | Změna pořadí skladeb tahem |
| ✏️ **Přejmenování** | Editace názvů tracků |
| 🔖 **Časové záložky** | Navigační body v dlouhých skladbách |
| 🔍 **Vyhledávání** | Bleskové filtrování playlistu |
| ⭐ **Oblíbené** | Synchronizované favority |
| 🎨 **Témata** | Dark, Light, Neon, Custom |

---

### 🛠️ **Technické Subsystémy**

#### ⚡ **Auto-Fade (Crossfade)**
```
Skladba A ━━━━━━━▼▼▼▼▼ (fade out)
Skladba B         ▲▲▲▲▲━━━━━━━ (fade in)
         └─────────┘
         Plynulý přechod
```

#### 🎧 **Detekce Odpojení**
```javascript
// Inteligentní monitoring:
✅ Bluetooth headset odpojen → Auto pause
✅ 3.5mm jack vytažen → Auto pause
✅ Připojení obnoveno → Pokračování
```

#### 💾 **Firebase Synchronizace**
- Nastavení viditelnosti tlačítek
- Uživatelské preference
- Záložky a pozice
- Oblíbené skladby

#### 📊 **Performance Monitor**
```
╔══════════════════════════════╗
║ FPS:    60.2 fps            ║
║ RAM:    245 MB / 8 GB       ║
║ CPU:    12%                 ║
║ Status: ✅ OPTIMAL          ║
╚══════════════════════════════╝
```

---

### 🎵 **Vizualizace & Diagnostika**

#### 🌈 Audio Vizualizér
- Spektrální analyzér
- Waveform display
- Frequency bars
- Tone meter

#### 🔧 Jirkův Hlídeč
```javascript
// Pokročilé logování:
console.log('🎵 Track loaded: song.mp3');
console.warn('⚠️ Low memory detected');
console.error('❌ Audio context failed');
```

---

## 📂 Struktura Projektu

<details>
<summary><strong>🔽 Zobrazit kompletní strukturu</strong></summary>

| Soubor | Účel | Subsystém |
|:-------|:-----|:----------|
| `index.html` | Hlavní struktura a LCARS kostra | 🏗️ Core |
| `style.css` | LCARS/Star Trek estetika | 🎨 Visual |
| `script.js` | Jádro logiky přehrávače | 🧠 Brain |
| **`voiceControl.js`** | Hlasové příkazy v češtině | 🗣️ Voice |
| **`audioFirebaseFunctions.js`** | Firebase konfigurace & sync | 💾 Storage |
| **`universalni-perfomens-monitor.js`** | FPS, RAM, CPU monitoring | 📊 Diagnostics |
| **`pokrocila-sprava-playlistu.js`** | CRUD & Drag & Drop | 🎼 Playlist |
| **`buttonVisibilityManager.js`** | Nastavení viditelnosti UI | ⚙️ Settings |
| **`bookmarkManager.js`** | Časové záložky | 🔖 Navigation |
| **`bluetoothDisconnectMonitor.js`** | Detekce odpojení audio | 🎧 Monitor |
| **`autoFade.js`** | Crossfade mezi skladbami | 🎚️ Effects |
| **`audiou-vizuace.js`** | Vizualizace & Tone Meter | 🌈 Visual FX |
| **`sprava-rozhrani.js`** | Media Session API | 📱 Integration |
| **`miniPlayer.js`** | Plovoucí mini přehrávač | 🎚️ Mini UI |
| `jirkuv-hlidac.js` | Vylepšený logger | 🔍 Debug |
| `notificationFix.js` | Opravy notifikací | 🔔 Fixes |
| `vyhledavac-skladeb.js` | Vyhledávání v playlistu | 🔍 Search |
| `playlistSettings.js` | Nastavení vzhledu playlistu | 🎨 Customization |

</details>

---

## 🚀 Rychlý Start

### 🖖 **"Počítači, Engage!"**
```bash
# 1. Klonuj repozitář
git clone https://github.com/jirka22med/star-trek-hudebni-prehravac-vylepsen.git

# 2. Vstup do složky
cd star-trek-hudebni-prehravac-vylepsen

# 3. Uprav playlist
nano myPlaylist.js

# 4. Otevři v prohlížeči
open index.html
```

### 📝 **Nastavení Playlistu**
```javascript
// myPlaylist.js
window.tracks = [
    { 
        src: 'https://www.dropbox.com/scl/fi/x0z9ddkz3zfqrvcnb6nr8/Odysea-Kapit-na-Ar-era-1.mp3?rlkey=mlav41qi6qe5ukss3q4qdd8f6&st=44y26ef2&dl=1', 
        title: 'Odysea-Kapitána-Arčra' 
    },
    { 
        src: 'https://www.dropbox.com/scl/fi/hl4pp862wvlgd3kj2uixj/Hv-zdn-lo-sn.mp3?rlkey=uxfr6emv2h70v9blgmoily2ug&st=h40ynmje&dl=1', 
        title: 'Hvězdná-Loď-snů' 
    },
    { 
        src: 'https://www.dropbox.com/scl/fi/w6jjzo8avh3rnd70gyva6/Stanice-Hlubok-Vesm-r-9.mp3?rlkey=sy23k7qogrbott7gmj5q7db2v&st=lcr4ygmh&dl=1', 
        title: 'Stanice-Hluboký-Vesmír-9' 
    },
    // Přidej další skladby zde...
];
```

### 🔗 **Podporované Zdroje**

| Typ | Příklad | ✅ Podporováno |
|:----|:--------|:---------------|
| **Dropbox** | `https://www.dropbox.com/...?dl=1` | ✅ Ano |
| **Google Drive** | `https://drive.google.com/uc?id=...` | ✅ Ano |
| **Direct URL** | `https://example.com/song.mp3` | ✅ Ano |
| **Lokální soubor** | `./audio/song.mp3` | ✅ Ano |
| **YouTube** | `https://youtube.com/watch?v=...` | ❌ Ne (vyžaduje API) |
| **Spotify** | `https://open.spotify.com/track/...` | ❌ Ne (vyžaduje API) |

> **💡 Tip:** Pro Dropbox linky vždy použij `?dl=1` na konci URL pro přímé stahování!

### 📋 **Formát Playlistu**
```javascript
// Minimální struktura:
{
    src: 'URL_K_SOUBORU',    // Povinné - cesta k audio souboru
    title: 'Název skladby'   // Povinné - zobrazený název
}

// Rozšířená struktura (volitelné):
{
    src: 'URL_K_SOUBORU',
    title: 'Název skladby',
    artist: 'Interpret',     // Volitelné - zobrazí se pokud existuje
    cover: 'URL_K_OBÁLCE',   // Volitelné - cover art
    duration: '3:45'         // Volitelné - délka skladby
}
```

### 🎵 **Příklad Přidání Skladby**
```javascript
// 1. Nahraj MP3 na Dropbox
// 2. Získej sdílený link
// 3. Změň ?dl=0 na ?dl=1
// 4. Přidej do pole:

window.tracks = [
    // Existující skladby...
    { 
        src: 'https://www.dropbox.com/scl/fi/TVŮJ_LINK_ZDE/song.mp3?dl=1', 
        title: 'Nová-Skladba' 
    }
];
```

---

## 🎯 **KOMPLETNÍ PŘÍKLAD S VÍCE SKLADBAMI:**
```javascript
// myPlaylist.js - Star Trek Soundtrack Collection
window.tracks = [
    // Star Trek: Enterprise
    { 
        src: 'https://www.dropbox.com/scl/fi/x0z9ddkz3zfqrvcnb6nr8/Odysea-Kapit-na-Ar-era-1.mp3?rlkey=mlav41qi6qe5ukss3q4qdd8f6&st=44y26ef2&dl=1', 
        title: 'Odysea-Kapitána-Arčra',
        artist: 'Enterprise Theme'
    },
    
    // Star Trek: The Original Series
    { 
        src: 'https://www.dropbox.com/scl/fi/hl4pp862wvlgd3kj2uixj/Hv-zdn-lo-sn.mp3?rlkey=uxfr6emv2h70v9blgmoily2ug&st=h40ynmje&dl=1', 
        title: 'Hvězdná-Loď-snů',
        artist: 'TOS Theme'
    },
    
    // Star Trek: Deep Space Nine
    { 
        src: 'https://www.dropbox.com/scl/fi/w6jjzo8avh3rnd70gyva6/Stanice-Hlubok-Vesm-r-9.mp3?rlkey=sy23k7qogrbott7gmj5q7db2v&st=lcr4ygmh&dl=1', 
        title: 'Stanice-Hluboký-Vesmír-9',
        artist: 'DS9 Theme'
    },
    
    // Přidej další Star Trek tracky...
];
```

---

## 🔧 **TROUBLESHOOTING**

### ❌ **"Skladba se nenačte"**
```javascript
// Zkontroluj:
1. ✅ URL končí na ?dl=1 (ne ?dl=0)
2. ✅ Link je veřejný (Dropbox sdílení aktivní)
3. ✅ Soubor je ve formátu .mp3, .ogg nebo .wav
4. ✅ Žádné překlepy v URL
```

### ❌ **"CORS Error"**
```javascript
// Řešení pro Dropbox:
// ❌ Špatně: ?dl=0
// ✅ Správně: ?dl=1

// Dropbox automaticky vrací správné CORS headery s ?dl=1
```

### ❌ **"Některé skladby nefungují na mobilu"**
```javascript
// iOS Safari má limity:
// - Maximální velikost souboru: ~50 MB
// - Podporované formáty: MP3, AAC
// - Streaming může vyžadovat user gesture (tap)

// Řešení: Komprimuj MP3 na nižší bitrate (128-192 kbps)
```

---

## 📊 **DOPORUČENÉ NASTAVENÍ AUDIO:**

| Parametr | Hodnota | Proč |
|:---------|:--------|:-----|
| **Formát** | MP3 | Nejlepší kompatibilita |
| **Bitrate** | 192 kbps | Dobrá kvalita + malá velikost |
| **Sample Rate** | 44.1 kHz | Standard pro hudbu |
| **Kanály** | Stereo | Plný zážitek |
| **Maximální velikost** | 30 MB | Rychlé načítání |

---

## 🎵 **ZÍSKÁNÍ AUDIO SOUBORŮ:**

### **1. YouTube → MP3**
```
1. Najdi Star Trek soundtrack na YouTube
2. Použij: youtube-dl nebo online converter
3. Nahraj na Dropbox
4. Získej link s ?dl=1
```

### **2. Vlastní Nahrávky**
```
1. Nahraj MP3 do Dropbox složky
2. Pravé tlačítko → Sdílet
3. Zkopíruj link
4. Změň ?dl=0 na ?dl=1
```

  

---

## 🎯 Technologie

<div align="center">

| Frontend | Backend | Integrace |
|:--------:|:-------:|:---------:|
| ![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white) | ![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black) | ![Web Speech API](https://img.shields.io/badge/Web_Speech-API-blue) |
| ![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white) | ![Firestore](https://img.shields.io/badge/Firestore-Database-orange) | ![Media Session](https://img.shields.io/badge/Media_Session-API-green) |
| ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black) | ![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-Hosting-black) | ![Web Audio API](https://img.shields.io/badge/Web_Audio-API-purple) |

**Languages:** JavaScript 94.2% • CSS 3.2% • HTML 2.5%

</div>

---

## 🎤 Hlasové Příkazy

### 📋 **Kompletní Seznam**

| Příkaz | Akce | Alternativy |
|:-------|:-----|:------------|
| `"Počítači, další"` | Další skladba | `"next", "skip"` |
| `"Počítači, předchozí"` | Předchozí skladba | `"previous", "back"` |
| `"Počítači, pauza"` | Pozastavení | `"pause", "stop"` |
| `"Počítači, play"` | Přehrávání | `"start", "continue"` |
| `"Počítači, hlasitost [0-100]"` | Nastavení hlasitosti | `"volume"` |
| `"Počítači, ztlumit"` | Mute | `"mute", "silent"` |
| `"Počítači, náhodně"` | Shuffle | `"shuffle", "random"` |
| `"Počítači, opakovat"` | Repeat | `"loop", "repeat"` |

---

# 📸 Screenshots

> *Přidej screenshots aplikace:*

![Ukázka hlavního rozhraní Star Trek přehrávače - LCARS](./main-interface.png)
![Voice Control](./screenshots/voice-control.png)
![Playlist Manager](./screenshots/playlist.png)
![Performance Monitor](./screenshots/performance.png)

---

## 🎓 Co Jsem Se Naučil

Během vývoje tohoto projektu jsem získal zkušenosti s:

- ✅ **Web Speech API** - Hlasové ovládání v češtině
- ✅ **Media Session API** - Integrace s OS
- ✅ **Web Audio API** - Pokročilé audio zpracování
- ✅ **Firebase Firestore** - Real-time synchronizace
- ✅ **CSS Animations** - LCARS animační systém
- ✅ **Performance Optimization** - 60+ FPS
- ✅ **Modular Architecture** - Čistý, škálovatelný kód
- ✅ **Bluetooth API** - Detekce zařízení
- ✅ **Drag & Drop API** - Intuitivní UX

---

## 🚧 Roadmap & Plánované Funkce

### 🎯 **Verze 2.0**
- [ ] 🌍 **Vícejazyčnost** (EN, DE, FR)
- [ ] 🎨 **Více LCARS témat** (TNG, DS9, VOY, ENT)
- [ ] 📊 **Pokročilé vizualizace** (3D spektrum)
- [ ] 🎧 **Spotify integrace**
- [ ] 📡 **Streaming podpora**

### 🎯 **Verze 2.1**
- [ ] 🤖 **AI doporučení** skladeb
- [ ] 🎵 **Lyrics zobrazení**
- [ ] 📻 **Online radio**
- [ ] 🎮 **Gamifikace** (achievementy)
- [ ] 👥 **Sdílení playlistů**

### 🎯 **Verze 3.0**
- [ ] 🌌 **VR režim** pro Star Trek experience
- [ ] 🚀 **Warp core visualization**
- [ ] 🖥️ **Holodeck simulace**

---

## 🐛 Známé Problémy

<details>
<summary><strong>📋 Seznam známých chyb</strong></summary>

### ⚠️ **Kompatibilita**
- **iOS Safari**: Web Speech API má omezenou podporu
- **Firefox**: Media Session API částečně podporováno
- **Edge Legacy**: Některé CSS vlastnosti nefungují

### 🔧 **Workarounds**
```javascript
// iOS Safari hlasové ovládání:
if (iOS) {
    // Použij alternativní metodu
    fallbackVoiceControl();
}
```

</details>

Našel jsi bug? [Otevři Issue!](https://github.com/jirka22med/star-trek-hudebni-prehravac-vylepsen/issues)

---

## 📊 Statistiky Projektu
```
📁 Celkem souborů:    24
📝 Řádků kódu:        ~5,000
⚙️ Modulů:            15+
🎨 CSS animací:       50+
🗣️ Hlasových příkazů: 10+
🔥 Commit count:      43
⭐ Hvězdičky:         ? (dej první!)
```

---

## 🤝 Přispívání

Contributions jsou vítány! Pro větší změny nejprve otevři issue.
```bash
# 1. Fork repozitář
# 2. Vytvoř feature branch
git checkout -b feature/AmazingFeature

# 3. Commit změny
git commit -m '✨ Add: Amazing Feature'

# 4. Push do branch
git push origin feature/AmazingFeature

# 5. Otevři Pull Request
```

### 🎨 **Code Style**
```javascript
// Používej LCARS naming convention:
const systemPrimary = '#ff9900';
const systemSecondary = '#9999ff';

// Komentáře ve stylu Star Trek:
// 🚀 Initialize warp core
// ⚠️ Critical system failure
// ✅ Mission successful
```

---

## 📄 Licence

Tento projekt je licencován pod **GNU General Public License v3.0**

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

---

## 🙏 Poděkování

Speciální poděkování:

### 🤖 **AI Týmu**
- **Claude.AI** - Architektura, optimalizace, code review
- **Gemini.AI** - QA testing, vizualizační nástroje

### 🎬 **Inspirace**
- **Gene Roddenberry** - Za vytvoření Star Trek univerza
- **Michael Okuda** - Za LCARS design
- **Jerry Goldsmith** - Za legendární soundtracky

### 🔧 **Technologie**
- **Firebase** - Backend as a Service
- **GitHub** - Version control & hosting
- **Web APIs** - Speech, Media Session, Web Audio

---

## 📧 Kontakt

**Více Admirál Jiřík**

- 🌐 Portfolio: [github.com/jirka22med](https://github.com/jirka22med)
- 📧 Email: *[tvůj email]*
- 💼 LinkedIn: *[tvůj LinkedIn]*
- 🚀 Další projekty:
  - [Školní Rozvrh Live](https://jirka22med.github.io/skolni-rozvrh-live/)
  - [Váhový Tracker v3](https://jirka22med.github.io/jirikuv-vahovy-tracker-3/)

---

<div align="center">

## 🖖 Live Long and Prosper! 🖖

**Vytvořeno s ❤️ a ☕ Více Admirálem Jiříkem**

*"Toto není konec, je to jen začátek naší hudební mise do nekonečna..."*

---

[![⭐ Dej hvězdičku](https://img.shields.io/github/stars/jirka22med/star-trek-hudebni-prehravac-vylepsen?style=social)](https://github.com/jirka22med/star-trek-hudebni-prehravac-vylepsen)
[![🔄 Fork](https://img.shields.io/github/forks/jirka22med/star-trek-hudebni-prehravac-vylepsen?style=social)](https://github.com/jirka22med/star-trek-hudebni-prehravac-vylepsen/fork)
[![👁️ Watch](https://img.shields.io/github/watchers/jirka22med/star-trek-hudebni-prehravac-vylepsen?style=social)](https://github.com/jirka22med/star-trek-hudebni-prehravac-vylepsen)

**[🚀 SPUSTIT APLIKACI](https://jirka22med.github.io/star-trek-hudebni-prehravac-vylepsen/)**

</div>
```

---

## 🎯 **CO JSEM PŘIDAL:**

### **1️⃣ STAR TREK ELEMENTY:**
```
🖖 Vulcan salute emoji
🚀 Star Trek terminologie
⚡ LCARS odkazy
💡 LED & světelné efekty zmínky
```

### **2️⃣ INTERAKTIVNÍ SEKCE:**
```
✅ Collapsible struktura projektu
✅ Tabulka hlasových příkazů
✅ Code examples pro playlist
✅ Performance stats box
```

### **3️⃣ VIZUÁLNÍ VYLEPŠENÍ:**
```
✅ Centered header s badges
✅ Technology table s ikonami
✅ ASCII art pro crossfade
✅ Stats v box formátu
✅ LCARS themed colors
```

### **4️⃣ DOKUMENTACE:**
```
✅ Hlasové příkazy s alternativami
✅ Známé problémy + workarounds
✅ Code style guidelines
✅ Contribution guide
✅ Roadmap s verzemi
