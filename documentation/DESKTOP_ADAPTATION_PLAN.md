# Desktop Adaptation Plan (Non-Invasive)

Goal: Add desktop-only styles without changing existing mobile design, markup, or base CSS. All changes are gated under media queries and can be toggled off by removing a single link.

Principles
- No edits to HTML structure; no renaming classes.
- No overrides of existing tokens/variables; only additive rules.
- Desktop CSS isolated in styles/desktop.css and applied only for min-width breakpoints.
- Preserve all current colors/spacing for mobile; desktop adds layout enhancements only.

Breakpoints
- Desktop base: @media (min-width: 1280px)
- Large desktop: @media (min-width: 1440px)

Checklist by Stages

Stage 0 — Scaffolding (no risk)
- [ ] Create styles/desktop.css with empty sections and media queries
- [ ] Do NOT link the file yet

Stage 1 — Main App Layout (safe, additive)
- [ ] Two-/three-column grid wrapper for main app when width ≥1280px
- [ ] Side panels (setlists/repertoire) pinned in columns; main content fluid
- [ ] Max-width containers and centered content for large screens
- [ ] Ensure buttons retain current look/behavior; only positioning adapts

Stage 2 — Overlays/Modals
- [ ] Constrain max-width/height for desktop, add balanced paddings
- [ ] Keep mobile sizes unchanged; desktop only in media queries
- [ ] Verify: add-songs overlay, datePickerModal, event creation/edit

Stage 3 — Events Page
- [ ] Increase calendar grid breathing space and typography for ≥1280px
- [ ] Maintain current colors/indicators; add desktop spacing only
- [ ] List view: readable widths, section spacing

Stage 4 — Archive Page
- [ ] Wider list/cards layout with max-width and improved spacing
- [ ] Ensure filters/controls align and don’t wrap awkwardly

Stage 5 — Settings/Login
- [ ] Centered forms with sensible max-width (e.g., 520–640px)
- [ ] Keep button visuals intact; only container widths/paddings

Stage 6 — Accessibility & Contrast
- [ ] Re-check contrast respects dark theme rules (text/icons #e5e7eb/#9ca3af on dark, #111827 on #22d3ee)
- [ ] Keyboard focus outlines remain visible

Stage 7 — Cross-Browser & Performance
- [ ] Test Chrome/Firefox/Edge @ 1280/1440/1920 widths
- [ ] Verify no layout shifts, no CLS regressions

Stage Gate — Activation
- [ ] Link styles/desktop.css after base styles
- [ ] Smoke test entire app; roll back by removing link if any issue

Rollback Plan
- Remove <link rel="stylesheet" href="styles/desktop.css"> to revert instantly

Notes
- This plan adds only media-query-scoped rules. Mobile remains the source of truth; desktop enhances layout and spacing without changing the design system or interactions.

Scope Matrix (Pages & Overlays)

Pages (Top-level)
- [ ] Главная страница (root `index.html`)
- [ ] Страница событий (`/events/index.html`, `events/events-page.css`, `events/events-calendar.js`)
- [ ] Страница архива (`/archive/index.html`, `archive/archive-page.css`, `archive/archive.js`)
- [ ] Страница настроек (`/settings.html`, `css/settings.css`)
- [ ] Страница входа (`/public/login.html`, `css/auth.css`)

Overlays / Modals (Global/UI)
- [ ] Overlay добавления песен (`#add-songs-overlay`, styles in `styles/add-songs-overlay-compact.css`)
- [ ] Overlay выбора сет-листа (`#setlist-select-overlay`)
- [ ] Редактор песен (`#song-editor-overlay`)
- [ ] Полноэкранный preview тональностей (`#key-selection-modal`)
- [ ] Метроном (`#metronome-overlay`)
- [ ] Глобальные оверлеи интеграции с событиями:
  - [ ] Выбор даты (DatePickerModal) (`src/modules/integration/datePickerModal.js`, `src/modules/integration/calendarStyles.css`)
  - [ ] Создание/редактирование события (`src/modules/events/eventCreationModal.js`, `styles/event-creation-modal-complete.css`)
  - [ ] Выбор события (EventSelectorModal) (`src/modules/integration/eventSelectorModal.js`, `src/modules/integration/eventSelectorStyles.css`)
  - [ ] Список/календарь событий в оверлее (`src/modules/events/eventsOverlay.js`, `styles/events-overlay.css`)

Side Panels
- [ ] `#setlists-panel` (панель сет-листов)
- [ ] `#my-list-panel` (панель «Мои»)
- [ ] `#repertoire-panel` (панель репертуара)

Desktop-only Stylesheet
- File: `styles/desktop.css`
- Load strategy: conditional JS injection only when `(min-width: 1280px)` to avoid mobile downloads

