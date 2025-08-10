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
    // строки типа "1", "2" — номера лексем, пропускаем
    return /^\d+$/.test(s.trim());
}

function ensureDirForFile(filePath) {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
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

    for await (const raw of rl) {
        lines++;
        const line = raw.trim();
        if (!line) continue;
        if (isNumericLine(line)) continue;

        // берём первое поле до пробела/табуляции
        const first = line.split(/\s+/)[0];
        if (!first) continue;

        const w = normWord(first);

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

    // сортировка: по длине убыв., затем по алфавиту
    const words = Array.from(uniq);
    words.sort((a, b) => b.length - a.length || a.localeCompare(b, "ru"));

    ensureDirForFile(outputPath);
    fs.writeFileSync(outputPath, words.join("\n"), "utf8");

    const sec = ((Date.now() - start) / 1000).toFixed(2);
    console.log(
        `Готово: ${kept} уникальных слов из ${lines} строк. Время: ${sec}s`
    );
    console.log(
        `Отфильтровано: коротких(<${MIN_LEN})=${tooShort}, длинных(>${MAX_LEN})=${tooLong}, некирилл=${badChars}`
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
