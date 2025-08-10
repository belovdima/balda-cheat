import { norm } from "./letters";

// Базовая нормализация и фильтры для "Балды"
function cleanWord(w: string): string {
    const s = norm(w);
    // минимальная длина: 3 (можно 2, если ваши правила разрешают)
    if (s.length < 3) return "";
    // только кириллица
    if (!/^[А-Я]+$/.test(s)) return "";
    return s;
}

async function fetchText(url: string): Promise<string> {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(`Не удалось загрузить словарь: ${res.status}`);
    return await res.text();
}

function dedupe(arr: string[]): string[] {
    return Array.from(new Set(arr));
}

function parseWords(text: string): string[] {
    // поддержим форматы: одна строка — одно слово, или список, разделённый пробелами
    const raw = text.split(/\r?\n|[\s,;]+/);
    const cleaned = raw.map(cleanWord).filter(Boolean);
    return dedupe(cleaned);
}

// Кэш в localStorage (по ключу)
function saveCache(key: string, words: string[]) {
    try {
        localStorage.setItem(key, JSON.stringify(words));
    } catch {}
}
function loadCache(key: string): string[] | null {
    try {
        const s = localStorage.getItem(key);
        if (!s) return null;
        const arr = JSON.parse(s);
        if (Array.isArray(arr) && arr.length) return arr as string[];
    } catch {}
    return null;
}

/**
 * Грузит словарь из /public, кэширует в localStorage.
 * @param path пример: "/dicts/ru_words.txt"
 * @param cacheKey ключ кэша: "dict_ru_words_v1"
 */
export async function loadDictFromPublic(
    path: string,
    cacheKey = "dict_ru_words_v1"
): Promise<string[]> {
    const cached = loadCache(cacheKey);
    if (cached) return cached;

    const text = await fetchText(path);
    const words = parseWords(text);
    saveCache(cacheKey, words);
    return words;
}

/**
 * Загрузка из внешнего URL (если захочешь тянуть с GitHub RAW или CDN).
 * Лучше ставить свой cacheKey с версией, чтобы можно было инвалидировать.
 */
export async function loadDictFromUrl(
    url: string,
    cacheKey = "dict_remote_v1"
): Promise<string[]> {
    const cached = loadCache(cacheKey);
    if (cached) return cached;

    const text = await fetchText(url);
    const words = parseWords(text);
    saveCache(cacheKey, words);
    return words;
}

// Твой прежний мини-словарь оставим как fallback
export async function loadLocalDict(): Promise<string[]> {
    const seed = `
    ЛИЛИЯ ЛИС МИР МИРА САЛАТ СЕТЬ ЛЕСТНИЦА ЛИРА ЛИМОН СОН НОС ЛИСА ЛИСТ ТОН НИТЬ
  `;
    return parseWords(seed);
}

/**
 * Универсальная функция: пробует большой словарь из /public,
 * если не получилось — возвращает mini.
 */
export async function getDictionary(): Promise<string[]> {
    try {
        return await loadDictFromPublic(
            "/dicts/ru_words.txt",
            "dict_ru_words_v1"
        );
    } catch {
        return await loadLocalDict();
    }
}
