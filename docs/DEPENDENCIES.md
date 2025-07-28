# Dependencies Map

## 🔗 Current Dependency Graph

### Legacy Files (Root Level)
```
script.js (MAIN ENTRY)
├── state.js
├── constants.js
├── api.js
├── core.js
├── ui.js
├── metronome.js
├── src/js/api/songs.js
├── src/js/workers/workerManager.js
└── src/js/core/transposition.js

ui.js
├── constants.js
├── state.js
└── api.js

api.js
├── src/js/api/index.js
├── firebase-config.js
└── state.js

core.js
└── constants.js

metronome.js
└── core.js
```

### Modular Files (src/)
```
src/js/ui/
├── domReferences.js (pure)
├── dom.js → domReferences.js
├── themes.js → dom.js
├── utils.js → domReferences.js
├── chordBlocks.js → domReferences.js
├── songDisplay.js → state.js, chordBlocks.js, utils.js, songEditor.js
├── songEditor.js
└── general.js → state.js, core.js

src/js/api/
├── songs.js → firebase-config.js, state.js
├── repertoire.js → firebase-config.js, state.js
├── setlists.js → firebase-config.js
├── favorites.js → firebase-config.js
└── songEditing.js → firebase-config.js

src/js/core/
├── songParser.js → constants.js
├── transposition.js → constants.js
├── metronome.js (pure)
└── index.js → songParser.js
```

## 🚨 Circular Dependencies Detected

### Problem 1: script.js ↔ modules via window.*
```
script.js → imports modules
modules → access window.* variables set by script.js
```

### Problem 2: ui.js ↔ api.js ↔ state.js
```
ui.js → api.js → state.js
ui.js → state.js
```

### Problem 3: Global window.* variables (30+)
```javascript
// Set by script.js, used everywhere
window.activeOverlayMode
window.activeSetlistId
window.activeSetlistName
window.metronomeUI
window.searchWorkerManager
window.searchEngine
window.fallbackSearchEngine
window.invalidateAllSongsCache
window.getNormalizedTitle
window.getNormalizedLyrics
window.getCleanedLyrics
// ... and more
```

## ✅ Target Dependency Structure

### Clean Architecture
```
main.js (entry point)
├── app.js (application controller)
├── config/
│   └── firebase.js
└── modules/
    ├── state/ (pure state management)
    ├── api/ (Firebase services)
    ├── ui/ (components)
    ├── core/ (business logic)
    └── utils/ (pure functions)
```

### Dependency Rules
1. **No circular dependencies**
2. **One-way data flow**: state → ui → actions → api → state
3. **No global variables**
4. **Clear module boundaries**
5. **Pure functions where possible**