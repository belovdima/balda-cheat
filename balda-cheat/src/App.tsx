import React, { useEffect, useMemo, useState } from "react";
import { BoardView } from "./components/BoardView";
import { Keyboard } from "./components/Keyboard";
import { emptyBoard } from "./solver";
import { loadLocalDict } from "./dicts";
import { makeTrie } from "./trie";
import type { Board, Move } from "./types";
import { norm } from "./letters";
import { findAllMoves, cloneBoard } from "./solver";
import { getDictionary } from "./dicts";

const N = 5;

export default function App() {
    const [board, setBoard] = useState<Board>(() => emptyBoard());
    const [dict, setDict] = useState<string[]>([]);
    const trie = useMemo(() => makeTrie(dict), [dict]);

    const [picked, setPicked] = useState<string | null>(null);
    const [bannedInput, setBannedInput] = useState<string>("");
    const banned = useMemo(
        () =>
            bannedInput
                .split(/\s*[,\n;]\s*|\s{2,}/)
                .map(norm)
                .filter(Boolean),
        [bannedInput]
    );

    const [startWord, setStartWord] = useState("ЛИЛИЯ");
    const [moves, setMoves] = useState<Move[]>([]);
    const [preview, setPreview] = useState<Move | null>(null);

    // загрузка словаря
    useEffect(() => {
        getDictionary().then(setDict);
    }, []);

    // поставить стартовое слово в центр (3-я строка)
    const putStart = () => {
        const s = norm(startWord);
        if (s.length !== 5) {
            alert("Стартовое слово должно быть из 5 букв.");
            return;
        }
        const b = emptyBoard();
        const r = 2; // третья строка (0..4)
        for (let i = 0; i < 5; i++) b[r][i] = s[i];
        setBoard(b);
        setMoves([]);
        setPreview(null);
    };

    // клик по ячейке: если выбрана буква — ставим
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
    };

    const clearCell = (r: number, c: number) => {
        const b2 = cloneBoard(board);
        b2[r][c] = "";
        setBoard(b2);
    };

    return (
        <div className="container">
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
                                // быстрый режим: удалим последнюю не пустую (для удобства)
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
                            <div className="badge">
                                оценка {preview.score.toFixed(1)}
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

            <div className="panel">
                <h1>Все варианты (клик — показать как превью)</h1>
                <div className="suggestions">
                    {moves.map((m, i) => (
                        <div
                            key={i}
                            className="suggestion"
                            onClick={() => setPreview(m)}>
                            <div>
                                <b>{m.word}</b>{" "}
                                <span className="badge">
                                    {m.path.length} букв
                                </span>
                            </div>
                            <div>
                                вставь [{m.insert.r + 1}:{m.insert.c + 1}] «
                                {m.insert.letter}»
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="panel">
                <h1>Исключить слова (чёрный список)</h1>
                <div className="row">
                    <textarea
                        placeholder="Перечисляй через запятую или с новой строки. Например: ЛИЛИЯ, ЛИС"
                        rows={4}
                        style={{ width: "100%" }}
                        value={bannedInput}
                        onChange={(e) => setBannedInput(e.target.value)}
                    />
                </div>
                <hr />
                <small className="badge">
                    Слова из этого списка не будут предлагаться. Стартовое слово
                    добавь сюда — чтобы не использовать его заново.
                </small>
            </div>
        </div>
    );
}
