import React, { useEffect, useMemo, useState, useCallback } from "react";
import { BoardView } from "./components/BoardView";
import { Keyboard } from "./components/Keyboard";
import { emptyBoard, findAllMoves, cloneBoard } from "./solver";
import { makeTrie } from "./trie";
import type { Board, Move } from "./types";
import { norm } from "./letters";
import { getDictionary } from "./dicts";

type Phase = "welcome" | "play";
type ViewMode = "analyze" | "edit"; // анализ (превью+список) / редактирование (поле+клавиатура)

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

// Подсветка совпадений (используется в списке вариантов)
function highlightWord(word: string, query: string) {
    const q = norm(query);
    if (!q) return word;
    const src = word;
    const srcNorm = norm(word);
    const res: React.ReactNode[] = [];
    let i = 0;
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
    // Словарь/три
    const [dict, setDict] = useState<string[]>([]);
    const trie = useMemo(() => makeTrie(dict), [dict]);

    // Фазы и режим
    const [phase, setPhase] = useState<Phase>("welcome");
    const [viewMode, setViewMode] = useState<ViewMode>("analyze");

    // Данные игры
    const [board, setBoard] = useState<Board>(() => emptyBoard());
    const [startWord, setStartWord] = useState("ЛИЛИЯ");
    const [moves, setMoves] = useState<Move[]>([]);
    const [preview, setPreview] = useState<Move | null>(null);

    // Блэклист
    const [bannedInput, setBannedInput] = useState<string>("");
    const banned = useMemo(() => parseBanned(bannedInput), [bannedInput]);

    // Редактирование
    const [picked, setPicked] = useState<string | null>(null); // выбранная буква на клавиатуре
    const [deleteArmed, setDeleteArmed] = useState<boolean>(false); // режим удаления буквы кликом

    // Поиск по вариантам
    const [query, setQuery] = useState<string>("");

    const filteredMoves = useMemo(() => {
        const q = norm(query);
        if (!q) return moves;
        return moves.filter((m) => norm(m.word).includes(q));
    }, [moves, query]);

    // Загрузка словаря
    useEffect(() => {
        getDictionary().then(setDict);
    }, []);

    // Ripple для клавиш (ставит CSS-переменные --x/--y)
    useEffect(() => {
        const handler = (e: PointerEvent) => {
            const t = e.target as HTMLElement | null;
            if (!t?.classList?.contains("key")) return;
            const r = t.getBoundingClientRect();
            const x = ((e.clientX - r.left) / r.width) * 100;
            const y = ((e.clientY - r.top) / r.height) * 100;
            t.style.setProperty("--x", x + "%");
            t.style.setProperty("--y", y + "%");
        };
        document.addEventListener("pointerdown", handler);
        return () => document.removeEventListener("pointerdown", handler);
    }, []);

    // Утилиты блэклиста
    const addToBlacklist = useCallback(
        (words: string | string[]) => {
            const list = Array.isArray(words) ? words : [words];
            const next = new Set([
                ...parseBanned(bannedInput),
                ...list.map(norm),
            ]);
            setBannedInput(joinBanned(Array.from(next)));
        },
        [bannedInput]
    );

    // Запуск игры со стартовым словом (из welcome-экрана)
    const startGame = () => {
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
        setPhase("play");
        setViewMode("analyze");
        setPicked(null);
        setDeleteArmed(false);

        // Если словарь уже загружен — сразу посчитаем
        if (dict.length > 0) {
            const res = findAllMoves(b, trie, [...parseBanned(bannedInput), s]);
            setMoves(res);
            setPreview(res[0] ?? null);
        }
    };

    // Пересчёт вариантов для текущего board/banned
    const recalc = useCallback(
        (b: Board = board, bannedArr: string[] = banned) => {
            const res = findAllMoves(b, trie, bannedArr);
            setMoves(res);
            setPreview(res[0] ?? null);
        },
        [board, banned, trie]
    );

    // Клик по клетке (поведение зависит от режима)
    const handleCellClick = (r: number, c: number) => {
        // Режим удаления — удаляем, если в клетке есть буква
        if (deleteArmed) {
            if (!board[r][c]) return; // пустая — игнор
            const b2 = cloneBoard(board);
            b2[r][c] = "";
            setBoard(b2);
            setDeleteArmed(false);
            setViewMode("analyze");
            recalc(b2);
            return;
        }

        // Режим редактирования — ставим выбранную букву
        if (viewMode === "edit") {
            if (!picked) return;
            if (board[r][c]) return;
            const b2 = cloneBoard(board);
            b2[r][c] = picked;
            setBoard(b2);
            setPicked(null);
            setViewMode("analyze"); // сразу возвращаем в анализ
            recalc(b2);
            return;
        }

        // В режиме анализа клики по полю не делают ничего особого
    };

    // Явный пересчёт (кнопка)
    const calc = () => {
        recalc();
        setQuery("");
    };

    // Применить предложенный ход (как раньше)
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

    // UI: левая половина (анализ/редактирование)
    const LeftPane = () => {
        if (viewMode === "edit") {
            return (
                <div className="panel">
                    <h1>Текущее поле</h1>
                    <BoardView board={board} onCellClick={handleCellClick} />
                    <div style={{ height: 8 }} />
                    <div
                        className="row"
                        style={{ justifyContent: "space-between" }}>
                        <small className="badge">
                            Режим редактирования: выбери букву справа и кликни
                            пустую клетку
                        </small>
                        <button onClick={() => setViewMode("analyze")}>
                            Не ставить букву
                        </button>
                    </div>
                </div>
            );
        }

        // Анализ: предпросмотр лучшего хода
        return (
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
                            onCellClick={handleCellClick}
                        />
                    </>
                ) : (
                    <div className="badge">Нажми «Просчитать…»</div>
                )}
            </div>
        );
    };

    // UI: правая половина (анализ: список; редактирование: QWERTY)
    const RightPane = () => {
        if (viewMode === "edit") {
            return (
                <div className="panel">
                    <h1>Клавиатура</h1>
                    <div className="row" style={{ gap: 8 }}>
                        <span className="badge">
                            Выбрано: {picked ? `«${picked}»` : "—"}
                        </span>
                        <button onClick={() => setPicked(null)}>
                            Сбросить выбор
                        </button>
                    </div>
                    <div style={{ height: 8 }} />
                    <Keyboard
                        value={picked}
                        onPick={setPicked}
                        layout="qwerty-ru"
                    />
                    <hr />
                    <div className="row" style={{ gap: 8 }}>
                        <button onClick={() => setViewMode("analyze")}>
                            Не ставить букву
                        </button>
                        <button
                            onClick={() => {
                                setDeleteArmed(true);
                                setViewMode("edit"); // остаёмся в редакторе
                            }}>
                            Удалить букву на поле
                        </button>
                        {deleteArmed && (
                            <small className="badge">
                                Кликни по букве на поле для удаления
                            </small>
                        )}
                    </div>
                </div>
            );
        }

        // Анализ: список вариантов + быстрый поиск + действия
        return (
            <div className="panel">
                <h1>Все варианты</h1>
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
                <div className="row" style={{ gap: 8, marginTop: 8 }}>
                    <button onClick={() => setViewMode("edit")}>
                        Нет нужного слова
                    </button>
                    <button
                        onClick={() => {
                            setDeleteArmed(true);
                            setViewMode("analyze"); // остаёмся в анализе, но ждём клика по букве
                        }}>
                        Удалить букву
                    </button>
                    {deleteArmed && (
                        <small className="badge">
                            Кликни по букве на поле для удаления
                        </small>
                    )}
                    <button onClick={calc}>
                        Просчитать всевозможные слова
                    </button>
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
        );
    };

    // WELCOME-экран
    if (phase === "welcome") {
        const onEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") startGame();
        };
        return (
            <div className="container" style={{ maxWidth: 720 }}>
                <div className="panel" style={{ padding: 20 }}>
                    <h1 style={{ fontSize: 22, marginBottom: 12 }}>
                        Набалдажник
                    </h1>
                    <p style={{ color: "var(--muted)", marginTop: 0 }}>
                        Напишите стартовое слово (ровно 5 букв), затем начните
                        игру.
                    </p>
                    <div className="row" style={{ gap: 12 }}>
                        <input
                            value={startWord}
                            onChange={(e) => setStartWord(e.target.value)}
                            onKeyDown={onEnter}
                            placeholder="Например: ЛИЛИЯ"
                            style={{ flex: 1, minWidth: 220 }}
                        />
                        <button onClick={startGame}>Начать</button>
                    </div>
                    <div style={{ height: 10 }} />
                    <small className="badge">
                        Подсказка: можно нажать Enter вместо кнопки
                    </small>
                </div>

                {/* Опционально: быстрый просчёт и настройки */}
                <div className="panel" style={{ padding: 16 }}>
                    <div className="row" style={{ gap: 10 }}>
                        <button onClick={calc}>
                            Просчитать всевозможные слова
                        </button>
                        <span className="badge">
                            Слов в словаре: {dict.length || "…"}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // Экран игры: две колонки (левая/правая)
    return (
        <div className="container" style={{ maxWidth: 1200 }}>
            <div className="panel" style={{ gridArea: "header" }}>
                <h1>Набалдажник</h1>
                <div className="row" style={{ gap: 8 }}>
                    <label>
                        Стартовое слово:&nbsp;
                        <input
                            value={startWord}
                            onChange={(e) => setStartWord(e.target.value)}
                            style={{ width: 160 }}
                        />
                    </label>
                    <button
                        onClick={() => {
                            // перезапустить с новым словом
                            setPhase("welcome");
                            setViewMode("analyze");
                        }}>
                        Новый старт
                    </button>
                    <span className="badge">Найдено: {moves.length}</span>
                </div>
            </div>

            {/* Левая панель */}
            <LeftPane />

            {/* Правая панель */}
            <RightPane />

            {/* Низ: чёрный список — оставим на всю ширину */}
            <div className="panel" style={{ gridArea: "black" }}>
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
                <div style={{ height: 6 }} />
                <div className="row" style={{ gap: 8 }}>
                    <button onClick={() => recalc()}>Пересчитать</button>
                    <button
                        onClick={() => {
                            setBannedInput("");
                            recalc(board, []);
                        }}>
                        Очистить список
                    </button>
                </div>
            </div>
        </div>
    );
}
