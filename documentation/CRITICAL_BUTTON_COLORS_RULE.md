# ⚠️ КРИТИЧЕСКОЕ ПРАВИЛО: Цвета кнопок в темной теме

## 🔴 ПРОБЛЕМА
В темной теме постоянно возникает проблема с невидимыми элементами кнопок из-за темного текста/иконок на темном фоне.

## ✅ СТРОГИЕ ПРАВИЛА ЦВЕТОВ

### 1. Кнопки на темном фоне (secondary)
```css
background: var(--bg-tertiary, #1a1f2e);
border: 1px solid var(--border-color, #374151);
color: #9ca3af !important;  /* СВЕТЛЫЙ текст */
```

**Иконки и текст внутри:**
```css
i, span {
    color: #9ca3af !important;  /* ОБЯЗАТЕЛЬНО СВЕТЛЫЙ */
}
```

### 2. Кнопки на голубом фоне (primary)
```css
background: var(--primary-color, #22d3ee);
color: #111827 !important;  /* ТЕМНЫЙ текст */
```

**Иконки и текст внутри:**
```css
i, span {
    color: #111827 !important;  /* ОБЯЗАТЕЛЬНО ТЕМНЫЙ */
}
```

## 🛠️ КАК ИСПРАВЛЯТЬ

### В JavaScript (создание элементов):
```javascript
// ❌ НЕПРАВИЛЬНО
editBtn.innerHTML = `
    <i class="fas fa-edit"></i>
    <span>Текст</span>
`;

// ✅ ПРАВИЛЬНО - явно указываем цвета
// Для темной кнопки:
editBtn.innerHTML = `
    <i class="fas fa-edit" style="color: #9ca3af !important;"></i>
    <span style="color: #9ca3af !important;">Текст</span>
`;

// Для голубой кнопки:
editBtn.innerHTML = `
    <i class="fas fa-edit" style="color: #111827 !important;"></i>
    <span style="color: #111827 !important;">Текст</span>
`;
```

### В CSS (стили):
```css
/* ✅ ПРАВИЛЬНО - всегда с !important и специфичностью */
#setlists-panel .card-action-btn.secondary i,
#setlists-panel .card-action-btn.secondary span {
    color: #9ca3af !important;  /* СВЕТЛЫЙ на темном */
}

#setlists-panel .card-action-btn.primary i,
#setlists-panel .card-action-btn.primary span {
    color: #111827 !important;  /* ТЕМНЫЙ на голубом */
}
```

## ⚡ ЧАСТЫЕ ОШИБКИ

1. **Забыли !important** - другие стили перебивают
2. **Недостаточная специфичность** - используйте ID родителя
3. **Полагаетесь только на класс** - добавляйте inline styles для гарантии
4. **Не проверили вложенные элементы** - i и span нужно стилизовать отдельно

## 📋 ЧЕКЛИСТ ПРОВЕРКИ

- [ ] Темная кнопка → светлые иконки/текст (#9ca3af)
- [ ] Голубая кнопка → темные иконки/текст (#111827)
- [ ] Все цвета с !important
- [ ] Inline styles в JS для критических элементов
- [ ] CSS с высокой специфичностью (#parent .class)

## 🎯 МЕСТА ДЛЯ ПРОВЕРКИ

1. Панель сет-листов - кнопки в карточках
2. Модальные окна - кнопки Сохранить/Отмена
3. Dropdown меню - все кнопки действий
4. Оверлеи - кнопки управления

## 💡 ЗАПОМНИТЕ
**Темный фон = Светлый контент**
**Светлый/голубой фон = Темный контент**

Это правило НИКОГДА не должно нарушаться!