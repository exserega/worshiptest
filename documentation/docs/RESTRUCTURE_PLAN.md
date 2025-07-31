# 🏗️ Agape Worship - Restructure Plan

## 📋 Overview
Safe, incremental migration from legacy monolithic structure to clean modular architecture optimized for AI/Cursor efficiency.

**Safety First**: Each stage can be rolled back to commit `fc781d0`

## 🎯 Goals
1. **Reduce file sizes** to max 200 lines for better Cursor understanding
2. **Eliminate circular dependencies** 
3. **Remove global window.* variables**
4. **Add JSDoc types** for better AI comprehension
5. **Create clear module boundaries**
6. **Maintain 100% functionality**

---

## 📅 STAGE 1: PREPARATION & ANALYSIS ✅
**Branch**: `cursor-restructure-stage1`
**Duration**: 1-2 hours
**Risk**: ⭐ (Very Low)

### Tasks
- [x] Create architecture documentation
- [x] Map current dependencies  
- [x] Create restructure plan
- [ ] Create backup testing strategy
- [ ] Set up module template structure

### Rollback Point
```bash
git checkout fc781d0
```

---

## 📅 STAGE 2: FOUNDATION SETUP
**Branch**: `cursor-restructure-stage2`  
**Duration**: 2-3 hours
**Risk**: ⭐⭐ (Low)

### 2.1 Create New Module Structure
```
src/
├── core/
│   ├── index.js (main exports)
│   ├── state-manager.js (centralized state)
│   ├── event-bus.js (replace window.* globals)
│   └── app-controller.js (main app logic)
├── services/
│   ├── firebase.js (consolidated config)
│   ├── songs-service.js (song CRUD)
│   ├── setlist-service.js (setlist CRUD)
│   └── search-service.js (search logic)
├── components/
│   ├── song-display.js
│   ├── metronome.js  
│   ├── search.js
│   └── setlist-manager.js
└── utils/
    ├── dom-helpers.js
    ├── formatters.js
    └── validators.js
```

### 2.2 Create Event Bus (Replace window.*)
```javascript
// src/core/event-bus.js
class EventBus {
  constructor() {
    this.events = new Map();
    this.state = new Map();
  }
  
  emit(event, data) { /* ... */ }
  on(event, callback) { /* ... */ }
  setState(key, value) { /* ... */ }
  getState(key) { /* ... */ }
}
```

### 2.3 Create Testing Utilities
- Unit test helpers
- Integration test framework
- Regression test suite

### Tests
- [ ] All existing functionality works
- [ ] No console errors
- [ ] Performance unchanged

### Rollback Point
```bash
git checkout cursor-restructure-stage1
```

---

## 📅 STAGE 3: CORE MIGRATION
**Branch**: `cursor-restructure-stage3`
**Duration**: 4-5 hours  
**Risk**: ⭐⭐⭐ (Medium)

### 3.1 Migrate State Management
- Extract all state from global variables
- Create centralized state manager
- Implement state reactivity

### 3.2 Migrate Core Business Logic
- Split `core.js` into focused modules
- Extract pure functions
- Add comprehensive JSDoc

### 3.3 Replace Global Functions
```javascript
// OLD: window.getNormalizedTitle = function(song) { ... }
// NEW: export function getNormalizedTitle(song) { ... }
```

### Tests
- [ ] Song parsing works correctly
- [ ] Search functionality intact
- [ ] Transposition working
- [ ] No global pollution

### Rollback Point
```bash
git checkout cursor-restructure-stage2
```

---

## 📅 STAGE 4: API LAYER REFACTOR
**Branch**: `cursor-restructure-stage4`
**Duration**: 3-4 hours
**Risk**: ⭐⭐⭐ (Medium)

### 4.1 Consolidate Firebase Config
- Remove duplicate firebase configs
- Create single service layer
- Add error handling & retry logic

### 4.2 Migrate API Functions
- Refactor `api.js` into service modules
- Add type validation
- Implement caching layer

### 4.3 Create Service Abstraction
```javascript
// services/songs-service.js
export class SongsService {
  async getAllSongs() { /* ... */ }
  async updateSong(id, data) { /* ... */ }
  async createSong(data) { /* ... */ }
}
```

### Tests
- [ ] Firebase connection works
- [ ] All CRUD operations functional
- [ ] Data integrity maintained
- [ ] Error handling robust

### Rollback Point
```bash
git checkout cursor-restructure-stage3
```

---

## 📅 STAGE 5: UI COMPONENT MIGRATION
**Branch**: `cursor-restructure-stage5`
**Duration**: 5-6 hours
**Risk**: ⭐⭐⭐⭐ (High)

### 5.1 Break Down ui.js (1355 lines)
Split into focused components:
- SongDisplayComponent
- SearchComponent  
- MetronomeComponent
- SetlistComponent
- ModalComponent

### 5.2 Implement Component Pattern
```javascript
// components/song-display.js
export class SongDisplayComponent {
  constructor(container, eventBus) {
    this.container = container;
    this.eventBus = eventBus;
    this.state = {};
  }
  
  render() { /* ... */ }
  bindEvents() { /* ... */ }
  update(newState) { /* ... */ }
}
```

### 5.3 Remove DOM Manipulation from Business Logic
- Pure render functions
- Event delegation
- State-driven updates

### Tests
- [ ] All UI components render correctly
- [ ] Event handling works
- [ ] State updates properly
- [ ] Mobile responsive
- [ ] Theme switching functional

### Rollback Point
```bash
git checkout cursor-restructure-stage4
```

---

## 📅 STAGE 6: MAIN ENTRY POINT REFACTOR
**Branch**: `cursor-restructure-stage6`
**Duration**: 3-4 hours
**Risk**: ⭐⭐⭐⭐ (High)

### 6.1 Break Down script.js (2445 lines)
Create focused entry points:
- `main.js` (initialization only)
- `app-controller.js` (main logic)
- `event-handlers.js` (user interactions)

### 6.2 Implement Clean Bootstrap
```javascript
// main.js
import { AppController } from './src/core/app-controller.js';

document.addEventListener('DOMContentLoaded', async () => {
  const app = new AppController();
  await app.initialize();
});
```

### 6.3 Remove Global Dependencies
- Replace all window.* usage
- Use dependency injection
- Implement module loader

### Tests
- [ ] App initializes correctly
- [ ] All features functional
- [ ] No global leaks
- [ ] Performance maintained

### Rollback Point
```bash
git checkout cursor-restructure-stage5
```

---

## 📅 STAGE 7: CSS OPTIMIZATION
**Branch**: `cursor-restructure-stage7`
**Duration**: 2-3 hours
**Risk**: ⭐⭐ (Low)

### 7.1 Optimize styles.css (4973 lines)
- Better CSS organization
- Remove unused styles
- Optimize selectors

### 7.2 Improve Modularity
- Component-specific styles
- Better CSS custom properties
- Consistent naming

### Tests
- [ ] Visual appearance unchanged
- [ ] Responsive design intact
- [ ] Theme switching works
- [ ] Performance improved

---

## 📅 STAGE 8: FINALIZATION
**Branch**: `cursor-restructure-final`
**Duration**: 2-3 hours
**Risk**: ⭐ (Very Low)

### 8.1 Documentation
- Update README.md
- Create component docs
- Add usage examples

### 8.2 Performance Optimization
- Bundle size analysis
- Load time optimization
- Memory usage review

### 8.3 Final Testing
- Complete regression test
- Cross-browser testing
- Mobile device testing

---

## 🚨 Emergency Rollback
If any stage fails critically:
```bash
git checkout fc781d0
git branch -D cursor-restructure-*
```

## ✅ Success Criteria
1. **File sizes**: No file > 200 lines
2. **Dependencies**: Zero circular dependencies
3. **Globals**: Zero window.* variables
4. **Types**: 100% JSDoc coverage
5. **Tests**: 100% functionality preserved
6. **Performance**: No regression
7. **Cursor efficiency**: Improved AI understanding

## 📊 Progress Tracking
- [ ] Stage 1: Preparation ✅
- [ ] Stage 2: Foundation
- [ ] Stage 3: Core Migration  
- [ ] Stage 4: API Refactor
- [ ] Stage 5: UI Components
- [ ] Stage 6: Entry Point
- [ ] Stage 7: CSS Optimization
- [ ] Stage 8: Finalization