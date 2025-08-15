# Резервная копия модуля событий

**Дата создания**: 2025-08-15 09:18:05

## Содержимое backup:

1. `/events/` - полная копия модуля событий
   - eventsOverlay.js - оверлей со списком событий
   - eventsList.js - компонент списка карточек
   - eventModal.js - модальное окно создания/редактирования
   - eventsApi.js - API для работы с событиями
   - participantsSelector.js - выбор участников
   - eventsSync.js - синхронизация событий

2. `/event/` - страница просмотра события (public)
   - index.html
   - event-page.js

3. Стили событий:
   - event-page.css
   - event-player.css

## Причина создания:

Резервная копия перед внедрением календарного вида событий вместо карточек.
Изменения критические - полная замена UI/UX модуля событий.

## Как восстановить:

```bash
# Восстановить модуль событий
cp -r backups/events_backup_20250815_091805/events/* src/modules/events/

# Восстановить public страницу
cp -r backups/events_backup_20250815_091805/event/* public/event/

# Восстановить стили
cp backups/events_backup_20250815_091805/*.css styles/
```