// Конфигурация категорий песен
export const SONG_CATEGORIES_ORDER = [
    'Быстрые (вертикаль)',
    'Быстрые (горизонталь)',
    'Поклонение (вертикаль)',
    'Поклонение (горизонталь)'
];

// Маркеры для разбора структуры песни
export const structureMarkers = [
    "куплет", "припев", "бридж", "мостик", 
    "проигрыш", "интро", "вступление", 
    "аутро", "окончание", "кода", 
    "запев", "соло", "куплет 1", "куплет 2", "куплет 3", "куплет 4",
    "припев 1", "припев 2", "предприпев", "прехорус"
];

// Музыкальные константы
export const chords = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "H"];
export const DEFAULT_FONT_SIZE = 8;
export const MIN_FONT_SIZE = 2;
export const MAX_SHARED_SONGS = 8;

// Константы для режима презентации
export const CONTROLS_HIDE_DELAY = 3000; // 3 секунды

// Константы для свайпов
export const SWIPE_THRESHOLD = 100; // Минимальная длина свайпа (увеличено для предотвращения случайных закрытий)
export const SWIPE_VERTICAL_LIMIT = 75; // Макс. отклонение по вертикали
export const SWIPE_TIME_LIMIT = 500; // Максимальное время свайпа в мс
export const SWIPE_RATIO = 2; // Минимальное соотношение основной оси к второстепенной 