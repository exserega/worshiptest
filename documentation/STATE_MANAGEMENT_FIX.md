# Исправление управления состоянием (State Management)

## Проблема
При попытке загрузить список филиалов возникала ошибка:
```
TypeError: Cannot add property branches, object is not extensible
at loadBranches (branchSelector.js:55:35)
```

Объект `window.state` был защищен от изменений (не extensible).

## Причина
Модульная система экспортирует только определенные свойства из `appState.js`, и попытка добавить новое свойство напрямую (`window.state.branches = ...`) не работает.

## Решение

### 1. Добавлено свойство в appState.js
```javascript
// src/js/state/appState.js
export let branches = []; // Список филиалов
export function setBranches(newBranches) { branches = newBranches; }
```

### 2. Использование функции вместо прямой записи
```javascript
// src/modules/branches/branchSelector.js
import { setBranches } from '../../js/state/appState.js';

// Вместо: window.state.branches = branches;
// Теперь: setBranches(branches);
```

### 3. Правильный импорт для чтения
```javascript
// src/ui/setlist-cards.js
import { branches } from '../js/state/appState.js';

// Используем импортированную переменную branches
const branchList = branches || [];
```

## Важные принципы

1. **Не модифицировать state напрямую** - всегда использовать setter функции
2. **Импортировать нужные части state** - не полагаться на window.state
3. **Все свойства должны быть определены заранее** - в appState.js

## Service Worker
Версия: v604