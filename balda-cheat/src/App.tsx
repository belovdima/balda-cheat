import React, { useEffect, useMemo, useState } from "react";
import { BoardView } from "./components/BoardView";
import { Keyboard } from "./components/Keyboard";
import { emptyBoard, findAllMoves, cloneBoard } from "./solver";
import { makeTrie } from "./trie";
import type { Board, Move } from "./types";
import { norm } from "./letters";
import { getDictionary } from "./dicts";

const N = 5;

function parseBanned(input: string): string[] {
    return input
        .split(/\s*[,\n;]\s*|\s{2,}/)
        .map(norm)
        .filter(Boolean);
}
function joinBanned(arr: string[]): string {
    return Array.from(new Set(arr)).join(", ");
}

// Подсветка совпадений: возвращает массив React-нodels с <mark className="hl">
function highlightWord(word: string, query: string) {
    const q = norm(query);
    if (!q) return word;

    const src = word;
    const srcNorm = norm(word);
    const res: React.ReactNode[] = [];
    let i = 0;

    // Найдём ВСЕ вхождения q в нормализованной строке
    while (i < srcNorm.length) {
        const idx = srcNorm.indexOf(q, i);
        if (idx === -1) {
            res.push(src.slice(i));
            break;
        }
        if (idx > i) res.push(src.slice(i, idx));
        res.push(
            <mark key={idx} className="hl">
                {src.slice(idx, idx + q.length)}
            </mark>
        );
        i = idx + q.length;
    }
    return res;
}

export default function App() {
    const [board, setBoard] = useState<Board>(() => emptyBoard());
    const [dict, setDict] = useState<string[]>([]);
    const trie = useMemo(() => makeTrie(dict), [dict]);

    const [picked, setPicked] = useState<string | null>(null);
    const [bannedInput, setBannedInput] = useState<string>("");
    const banned = useMemo(() => parseBanned(bannedInput), [bannedInput]);

    const [startWord, setStartWord] = useState("ЛИЛИЯ");
    const [moves, setMoves] = useState<Move[]>([]);
    const [preview, setPreview] = useState<Move | null>(null);

    // Быстрый поиск по словам
    const [query, setQuery] = useState<string>("");

    const filteredMoves = useMemo(() => {
        const q = norm(query);
        if (!q) return moves;
        return moves.filter((m) => norm(m.word).includes(q));
    }, [moves, query]);

    useEffect(() => {
        getDictionary().then(setDict);
    }, []);

    // Ripple для клавиш: вычисляем --x/--y при pointerdown
    useEffect(() => {
        const handler = (e: PointerEvent) => {
            const t = e.target as HTMLElement | null;
            if (!t || !t.classList || !t.classList.contains("key")) return;
            const r = t.getBoundingClientRect();
            const x = ((e.clientX - r.left) / r.width) * 100;
            const y = ((e.clientY - r.top) / r.height) * 100;
            t.style.setProperty("--x", x + "%");
            t.style.setProperty("--y", y + "%");
        };
        document.addEventListener("pointerdown", handler);
        return () => document.removeEventListener("pointerdown", handler);
    }, []);

    // добавить слова в чёрный список (без дублей)
    const addToBlacklist = (words: string | string[]) => {
        const list = Array.isArray(words) ? words : [words];
        const next = new Set([...parseBanned(bannedInput), ...list.map(norm)]);
        setBannedInput(joinBanned(Array.from(next)));
    };

    // поставить стартовое слово + в ч/с
    const putStart = () => {
        const s = norm(startWord);
        if (s.length !== 5) {
            alert("Стартовое слово должно быть из 5 букв.");
            return;
        }
        const b = emptyBoard();
        const r = 2;
        for (let i = 0; i < 5; i++) b[r][i] = s[i];
        setBoard(b);
        setMoves([]);
        setPreview(null);
        addToBlacklist(s);
    };

    // ручная постановка буквы
    const onCellClick = (r: number, c: number) => {
        if (!picked) return;
        if (board[r][c]) return;
        const b2 = cloneBoard(board);
        b2[r][c] = picked;
        setBoard(b2);
    };

    const calc = () => {
        const res = findAllMoves(board, trie, banned);
        setMoves(res);
        setPreview(res[0] ?? null);
        setQuery(""); // сброс фильтра
    };

    const clearCell = (r: number, c: number) => {
        const b2 = cloneBoard(board);
        b2[r][c] = "";
        setBoard(b2);
    };

    // применить предложенный ход
    const applyMove = (m: Move) => {
        const b2 = cloneBoard(board);
        b2[m.insert.r][m.insert.c] = m.insert.letter;
        const bannedNext = Array.from(new Set([...banned, norm(m.word)]));
        const res = findAllMoves(b2, trie, bannedNext);
        setBoard(b2);
        setMoves(res);
        setPreview(res[0] ?? null);
        setBannedInput(joinBanned(bannedNext));
        setQuery("");
    };

    return (
        <div className="container">
            {/* Хедер */}
            <div className="panel">
                <h1>Балда — помощник</h1>
                <div className="row" style={{ gap: 12 }}>
                    <label>
                        Стартовое слово (5):&nbsp;
                        <input
                            value={startWord}
                            onChange={(e) => setStartWord(e.target.value)}
                            style={{ width: 160 }}
                        />
                    </label>
                    <button onClick={putStart}>Поставить старт</button>
                    <button onClick={calc}>
                        Просчитать всевозможные слова
                    </button>
                    <span className="badge">Найдено: {moves.length}</span>
                </div>
            </div>

            {/* Текущее поле */}
            <div className="panel">
                <h1>Текущее поле</h1>
                <BoardView board={board} onCellClick={onCellClick} />
                <div style={{ height: 8 }} />
                <div className="row">
                    <div style={{ flex: 1 }}>
                        <label>
                            Клавиатура (сначала выбери букву, затем кликни в
                            пустую клетку):
                        </label>
                        <div style={{ height: 6 }} />
                        <Keyboard value={picked} onPick={setPicked} />
                    </div>
                    <div style={{ minWidth: 220 }}>
                        <label>Удалить букву из клетки:</label>
                        <div style={{ height: 6 }} />
                        <div className="row">
                            <small className="badge">
                                Клик по пустой клетке с выбранной буквой —
                                ставит её
                            </small>
                        </div>
                        <div style={{ height: 6 }} />
                        <button
                            onClick={() => {
                                for (let r = N - 1; r >= 0; r--)
                                    for (let c = N - 1; c >= 0; c--) {
                                        if (board[r][c]) {
                                            clearCell(r, c);
                                            return;
                                        }
                                    }
                            }}>
                            Удалить последнюю букву
                        </button>
                    </div>
                </div>
            </div>

            {/* Предпросмотр */}
            <div className="panel">
                <h1>Предпросмотр лучшего хода</h1>
                {preview ? (
                    <>
                        <div
                            className="row"
                            style={{ justifyContent: "space-between" }}>
                            <div>
                                <div>
                                    <b>Слово:</b> {preview.word}
                                </div>
                                <div>
                                    <b>Вставка:</b> [{preview.insert.r + 1}:
                                    {preview.insert.c + 1}] «
                                    {preview.insert.letter}»
                                </div>
                            </div>
                            <div className="row" style={{ gap: 8 }}>
                                <div className="badge">
                                    оценка {preview.score.toFixed(1)}
                                </div>
                                <button onClick={() => applyMove(preview)}>
                                    Применить
                                </button>
                            </div>
                        </div>
                        <div style={{ height: 8 }} />
                        <BoardView
                            board={(() => {
                                const b2 = cloneBoard(board);
                                b2[preview.insert.r][preview.insert.c] =
                                    preview.insert.letter;
                                return b2;
                            })()}
                            path={preview.path}
                            insert={preview.insert}
                        />
                    </>
                ) : (
                    <div className="badge">Нажми «Просчитать…»</div>
                )}
            </div>

            {/* Список вариантов + быстрый поиск */}
            <div className="panel">
                <h1>Все варианты (клик — выбрать)</h1>
                <div className="row" style={{ gap: 8 }}>
                    <input
                        placeholder="Быстрый поиск по словам…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        style={{ flex: 1, minWidth: 160 }}
                    />
                    <span className="badge">
                        Показано: {filteredMoves.length} / {moves.length}
                    </span>
                </div>
                <div className="suggestions" style={{ marginTop: 8 }}>
                    {filteredMoves.map((m, i) => {
                        const isActive =
                            preview &&
                            m.word === preview.word &&
                            m.insert.r === preview.insert.r &&
                            m.insert.c === preview.insert.c;
                        return (
                            <div
                                key={i}
                                className="suggestion"
                                onClick={() => setPreview(m)}
                                style={{ cursor: "pointer" }}>
                                <div>
                                    <b>{highlightWord(m.word, query)}</b>{" "}
                                    <span className="badge">
                                        {m.path.length} букв
                                    </span>
                                </div>
                                <div>
                                    {isActive ? (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                applyMove(m);
                                            }}>
                                            Применить
                                        </button>
                                    ) : (
                                        <>
                                            вставь [{m.insert.r + 1}:
                                            {m.insert.c + 1}] «{m.insert.letter}
                                            »
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {filteredMoves.length === 0 && (
                        <div className="badge" style={{ margin: 8 }}>
                            Ничего не найдено
                        </div>
                    )}
                </div>
            </div>

            {/* Чёрный список */}
            <div className="panel">
                <h1>Использованные слова</h1>
                <div className="row">
                    <textarea
                        placeholder="Через запятую или с новой строки"
                        rows={4}
                        style={{ width: "100%" }}
                        value={bannedInput}
                        onChange={(e) => setBannedInput(e.target.value)}
                    />
                </div>
                <hr />
                <small className="badge">
                    Слова из этого списка не будут предлагаться. Стартовое слово
                    добавляется сюда автоматически.
                </small>
            </div>
        </div>
    );
}
