// Agape Worship App - State: App State Module

// --- GLOBAL STATE ---
export let allSongs = [];
export let songsBySheet = {};
export let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
export let currentVocalistId = null;
export let currentVocalistName = null;
export let currentFontSize = 10; // DEFAULT_FONT_SIZE
export let areChordsVisible = true;
export let isChordsOnlyMode = false;
export let currentRepertoireSongsData = [];
export let currentRepertoireViewMode = 'byKey';

// Functions to update state
export function setAllSongs(newSongs) { 
    allSongs = newSongs; 
    // Инвалидируем кэш поиска при загрузке новых данных
    if (typeof invalidateAllSongsCache === 'function') {
        invalidateAllSongsCache();
    }
}
export function setSongsBySheet(newSongsBySheet) { songsBySheet = newSongsBySheet; }
export function setFavorites(newFavorites) { favorites = newFavorites; }
export function setCurrentVocalistId(id) { currentVocalistId = id; }
export function setCurrentVocalistName(name) { currentVocalistName = name; }
export function setCurrentFontSize(size) { currentFontSize = size; }
export function setAreChordsVisible(visible) {
    areChordsVisible = visible;
}
export function setIsChordsOnlyMode(onlyMode) {
    isChordsOnlyMode = onlyMode;
    // При включении режима "только аккорды" отключаем скрытие аккордов
    if (onlyMode) {
        areChordsVisible = true;
    }
}
export function setCurrentRepertoireSongsData(data) { currentRepertoireSongsData = data; }
export function setCurrentRepertoireViewMode(mode) { currentRepertoireViewMode = mode; } 