import fs from "fs";
import path from "path";
import readline from "readline";
import zlib from "zlib";

/**
 * Использование:
 *   node scripts/build-dict.mjs <input.txt|.gz> <output.txt>
 *
 * Пример:
 *   node scripts/build-dict.mjs ./opencorpora.txt ./public/dicts/ru_words.txt
 */

const MIN_LEN = 3;
const MAX_LEN = 8;

// --- утилиты ---
function normWord(s) {
    return s
        .toUpperCase()
        .replace(/Ё/g, "Е")
        .replace(/[^А-Я]/g, "");
}

function isNumericLine(s) {
    return /^\d+$/.test(s.trim());
}

function ensureDirForFile(filePath) {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
}

// разбор: слово = первое поле; теги = всё остальное
function splitWordAndTags(line) {
    const m = line.match(/^(\S+)\s+(.+)$/);
    if (!m) return { word: line.trim(), tagsRaw: "" };
    return { word: m[1], tagsRaw: m[2] };
}

// привести теги к массиву: запятые/пробелы → разделители
function parseTags(tagsRaw) {
    return tagsRaw.replace(/\s+/g, ",").split(",").filter(Boolean);
}

function hasSingNomnNoun(tags) {
    const set = new Set(tags.map((t) => t.toLowerCase()));
    return set.has("noun") && set.has("sing") && set.has("nomn");
}

function isProperName(tags) {
    // Отсеиваем имена/фамилии/отчества/топонимы/организации/бренды
    const bad = new Set(["name", "surn", "patr", "geox"]);
    for (const t of tags) if (bad.has(t.toLowerCase())) return true;
    return false;
}

// --- основная логика ---
async function buildDict(inputPath, outputPath) {
    const start = Date.now();
    const ext = path.extname(inputPath).toLowerCase();

    let inputStream = fs.createReadStream(inputPath);
    if (ext === ".gz") {
        inputStream = inputStream.pipe(zlib.createGunzip());
    }

    const rl = readline.createInterface({
        input: inputStream,
        crlfDelay: Infinity,
    });

    const uniq = new Set();
    let lines = 0;
    let kept = 0;
    let tooShort = 0;
    let tooLong = 0;
    let badChars = 0;
    let notNounSingNomn = 0;
    let removedProper = 0;

    for await (const raw of rl) {
        lines++;
        const line = raw.trim();
        if (!line) continue;
        if (isNumericLine(line)) continue;

        const { word, tagsRaw } = splitWordAndTags(line);
        if (!word) continue;

        const tags = parseTags(tagsRaw);
        if (!hasSingNomnNoun(tags)) {
            notNounSingNomn++;
            continue;
        }
        if (isProperName(tags)) {
            removedProper++;
            continue;
        }

        const w = normWord(word);

        if (!/^[А-Я]+$/.test(w)) {
            badChars++;
            continue;
        }
        if (w.length < MIN_LEN) {
            tooShort++;
            continue;
        }
        if (w.length > MAX_LEN) {
            tooLong++;
            continue;
        }

        if (!uniq.has(w)) {
            uniq.add(w);
            kept++;
        }
    }

    const words = Array.from(uniq);
    words.sort((a, b) => b.length - a.length || a.localeCompare(b, "ru"));

    ensureDirForFile(outputPath);
    fs.writeFileSync(outputPath, words.join("\n"), "utf8");

    const sec = ((Date.now() - start) / 1000).toFixed(2);
    console.log(
        `Готово: ${kept} уникальных слов из ${lines} строк. Время: ${sec}s`
    );
    console.log(
        `Отфильтровано: не NOUN+sing+nomn=${notNounSingNomn}, имена/топонимы/организации=${removedProper}, коротких(<${MIN_LEN})=${tooShort}, длинных(>${MAX_LEN})=${tooLong}, некирилл=${badChars}`
    );
    console.log(`Сохранено в: ${outputPath}`);
}

// --- запуск ---
const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
    console.error(
        "Usage: node scripts/build-dict.mjs <input.txt|.gz> <output.txt>"
    );
    process.exit(1);
}

buildDict(inPath, outPath).catch((err) => {
    console.error("Ошибка:", err);
    process.exit(1);
});
