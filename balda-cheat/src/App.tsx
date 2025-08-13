import React, { useEffect, useMemo, useState, useCallback } from "react";
import { HeaderBar } from "./components/HeaderBar";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { PreviewPanel } from "./components/PreviewPanel";
import { BoardEditorPanel } from "./components/BoardEditorPanel";
import { VariantsPanel } from "./components/VariantsPanel";
import { Keyboard } from "./components/Keyboard";

import { emptyBoard, findAllMoves, cloneBoard } from "./solver";
import { makeTrie } from "./trie";
import type { Board, Move } from "./types";
import { norm } from "./letters";
import { getDictionary } from "./dicts";

type Phase = "welcome" | "play";
type ViewMode = "analyze" | "edit";

function parseBanned(input: string): string[] {
    return input
        .split(/\s*[,\n;]\s*|\s{2,}/)
        .map(norm)
        .filter(Boolean);
}
function joinBanned(arr: string[]): string {
    return Array.from(new Set(arr)).join(", ");
}
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
    const [dict, setDict] = useState<string[]>([]);
    const trie = useMemo(() => makeTrie(dict), [dict]);

    const [phase, setPhase] = useState<Phase>("welcome");
    const [viewMode, setViewMode] = useState<ViewMode>("analyze");

    const [board, setBoard] = useState<Board>(() => emptyBoard());
    const [startWord, setStartWord] = useState("ЛИЛИЯ");
    const [moves, setMoves] = useState<Move[]>([]);
    const [preview, setPreview] = useState<Move | null>(null);

    const [bannedInput, setBannedInput] = useState<string>("");
    const banned = useMemo(() => parseBanned(bannedInput), [bannedInput]);

    const [picked, setPicked] = useState<string | null>(null);
    const [deleteArmed, setDeleteArmed] = useState<boolean>(false);

    const [query, setQuery] = useState<string>("");

    const filteredMoves = useMemo(() => {
        const q = norm(query);
        if (!q) return moves;
        return moves.filter((m) => norm(m.word).includes(q));
    }, [moves, query]);

    useEffect(() => {
        getDictionary().then(setDict);
    }, []);

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

        if (dict.length > 0) {
            const res = findAllMoves(b, trie, [...parseBanned(bannedInput), s]);
            setMoves(res);
            setPreview(res[0] ?? null);
        }
    };

    const recalc = useCallback(
        (b: Board = board, bannedArr: string[] = banned) => {
            const res = findAllMoves(b, trie, bannedArr);
            setMoves(res);
            setPreview(res[0] ?? null);
        },
        [board, banned, trie]
    );

    const handleCellClick = (r: number, c: number) => {
        if (deleteArmed) {
            if (!board[r][c]) return;
            const b2 = cloneBoard(board);
            b2[r][c] = "";
            setBoard(b2);
            setDeleteArmed(false);
            setViewMode("analyze");
            recalc(b2);
            return;
        }
        if (viewMode === "edit") {
            if (!picked || board[r][c]) return;
            const b2 = cloneBoard(board);
            b2[r][c] = picked;
            setBoard(b2);
            setPicked(null);
            setViewMode("analyze");
            recalc(b2);
        }
    };

    const calc = () => {
        recalc();
        setQuery("");
    };

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

    if (phase === "welcome") {
        return (
            <WelcomeScreen
                startWord={startWord}
                onChangeStartWord={setStartWord}
                onStart={startGame}
                onCalc={calc}
                dictCount={dict.length || undefined}
            />
        );
    }

    return (
        <div className="container" style={{ maxWidth: 1200 }}>
            <HeaderBar
                startWord={startWord}
                onChangeStartWord={setStartWord}
                onRestart={() => {
                    setPhase("welcome");
                    setViewMode("analyze");
                }}
                totalMoves={moves.length}
            />

            {/* Левая колонка */}
            {viewMode === "edit" ? (
                <BoardEditorPanel
                    board={board}
                    onCellClick={handleCellClick}
                    onCancel={() => setViewMode("analyze")}
                />
            ) : (
                <PreviewPanel
                    board={board}
                    preview={preview}
                    onApply={applyMove}
                    onCellClick={handleCellClick}
                />
            )}

            {/* Правая колонка */}
            {viewMode === "edit" ? (
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
                    {/* твоя Keyboard уже поддерживает RU */}
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
                                setViewMode("edit");
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
            ) : (
                <VariantsPanel
                    moves={moves}
                    filteredMoves={filteredMoves}
                    query={query}
                    onChangeQuery={setQuery}
                    onNeedEdit={() => setViewMode("edit")}
                    onArmDelete={() => setDeleteArmed(true)}
                    deleteArmed={deleteArmed}
                    onRecalc={calc}
                    active={preview}
                    onPickPreview={setPreview}
                    onApply={applyMove}
                    highlight={highlightWord}
                />
            )}

            {/* Низ: чёрный список */}
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
