# Agape Worship - Architecture Documentation

## 📁 Project Structure

### Current Architecture (Legacy + Modular Mix)

```
/
├── 🔴 LEGACY FILES (To be migrated)
│   ├── script.js (2445 lines) - Main entry point
│   ├── ui.js (1355 lines) - UI logic
│   ├── api.js (141 lines) - API wrapper
│   ├── core.js (233 lines) - Core utilities
│   ├── metronome.js (444 lines) - Metronome feature
│   ├── state.js (3 lines) - State wrapper
│   └── firebase-config.js (23 lines) - Firebase config
│
├── ✅ MODULAR STRUCTURE (Target architecture)
│   └── src/
│       ├── js/
│       │   ├── api/ - Firebase API modules
│       │   ├── core/ - Core business logic
│       │   ├── ui/ - UI components
│       │   ├── state/ - State management
│       │   ├── utils/ - Utility functions
│       │   └── workers/ - Web Workers
│       └── config/ - Configuration files
│
└── 📄 ASSETS
    ├── styles/ - Modular CSS
    ├── images/ - Images
    └── index.html - Main HTML
```

## 🔄 Data Flow

### Current Problems
1. **Circular Dependencies**: script.js ↔ modules via window.*
2. **Global State**: 30+ window.* variables
3. **Mixed Import Styles**: ES6 + CommonJS + global scripts

### Target Flow
```
index.html
    ↓
main.js (entry point)
    ↓
app.js (application controller)
    ↓
├── state/appState.js (centralized state)
├── ui/components/* (UI modules)
├── api/services/* (Firebase services)
└── core/business-logic/* (pure functions)
```

## 🎯 Key Features

### 1. Song Management
- **Search**: Web Worker + Fuzzy matching
- **Display**: Chord transposition, lyrics formatting
- **Editing**: Real-time Firebase sync

### 2. Setlist Management
- **Creation**: Interactive overlay
- **Management**: CRUD operations
- **Presentation**: Full-screen mode

### 3. Metronome
- **Integration**: Firebase BPM sync
- **UI**: Overlay + persistent panel
- **Controls**: Play/stop, BPM adjustment

### 4. Presentation Mode
- **Full-screen**: Optimized for projection
- **Navigation**: Swipe + keyboard
- **Formatting**: Large text, chord highlighting

## 🔧 Technical Stack

- **Frontend**: Vanilla JavaScript (ES6 modules)
- **Backend**: Firebase Firestore
- **Styling**: Modular CSS with CSS variables
- **Performance**: Web Workers for search
- **PWA**: Service Worker + Manifest

## 🚨 Current Issues for AI/Cursor

1. **File Size**: Massive files are hard to understand
2. **Dependencies**: Circular and unclear imports
3. **Globals**: Too many window.* variables
4. **Mixed Patterns**: Legacy + modern code
5. **No Types**: No TypeScript or JSDoc
6. **Side Effects**: Functions modify global state unpredictably

## ✅ Restructuring Goals

1. **Modular**: Small, focused files (max 200 lines)
2. **Clear Dependencies**: One-way imports, no cycles
3. **Typed**: JSDoc comments for all functions
4. **Pure Functions**: Minimal side effects
5. **Testable**: Each module can be tested independently
6. **Documented**: Clear purpose and usage examples