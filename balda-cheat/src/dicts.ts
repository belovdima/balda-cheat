import { norm } from "./letters";

// --- нормализация и парсинг ---
function cleanWord(w: string): string {
    const s = norm(w);
    if (s.length < 3) return "";
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
    const raw = text.split(/\r?\n|[\s,;]+/);
    const cleaned = raw.map(cleanWord).filter(Boolean);
    return dedupe(cleaned);
}

// --- кэш в localStorage ---
function saveCache(key: string, words: string[]) {
    try {
        localStorage.setItem(key, JSON.stringify(words));
    } catch {
        console.warn("[DICT] не удалось сохранить кэш в localStorage");
    }
}
function loadCache(key: string): string[] | null {
    try {
        const s = localStorage.getItem(key);
        if (!s) return null;
        const arr = JSON.parse(s);
        if (Array.isArray(arr) && arr.length) return arr as string[];
    } catch {
        console.warn("[DICT] не удалось загрузить кэш из localStorage");
    }
    return null;
}

// --- источники загрузки ---
export async function loadDictFromPublic(
    path: string,
    cacheKey = "dict_ru_words_v1"
): Promise<string[]> {
    const cached = loadCache(cacheKey);
    if (cached) {
        console.log("[DICT] cache hit:", cacheKey, "count:", cached.length);
        return cached;
    }

    const text = await fetchText(path);
    const words = parseWords(text);
    console.log("[DICT] fetched from public:", path, "count:", words.length);
    saveCache(cacheKey, words);
    return words;
}

export async function loadDictFromUrl(
    url: string,
    cacheKey = "dict_remote_v1"
): Promise<string[]> {
    const cached = loadCache(cacheKey);
    if (cached) {
        console.log("[DICT] cache hit:", cacheKey, "count:", cached.length);
        return cached;
    }

    const text = await fetchText(url);
    const words = parseWords(text);
    console.log("[DICT] fetched from url:", url, "count:", words.length);
    saveCache(cacheKey, words);
    return words;
}

// fallback-словарик
export async function loadLocalDict(): Promise<string[]> {
    const seed = `ЛИЛИЯ ЛИС МИР МИРА САЛАТ СЕТЬ ЛЕСТНИЦА ЛИРА ЛИМОН СОН НОС ЛИСА ЛИСТ ТОН НИТЬ`;
    const words = parseWords(seed);
    console.log("[DICT] fallback local seed, count:", words.length);
    return words;
}

// --- универсальная обёртка ---
export async function getDictionary(): Promise<string[]> {
    try {
        const words = await loadDictFromPublic(
            "/dicts/ru_words.txt",
            "dict_ru_words_v2"
        ); // v2 чтобы инвалидировать кэш
        console.log("[DICT] using public file, total:", words.length);
        return words;
    } catch (err) {
        console.warn("[DICT] public load failed, using fallback.", err);
        return await loadLocalDict();
    }
}
