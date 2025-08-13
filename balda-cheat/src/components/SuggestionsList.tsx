import React from "react";
import type { Move } from "../types";
import { usePreserveScroll } from "../hooks/usePreserveScroll";

type Props = {
    moves: Move[];
    query: string;
    highlight: (w: string, q: string) => React.ReactNode;
    active?: Move | null;
    onPickPreview: (m: Move) => void;
    onApply: (m: Move) => void;
    className?: string; // можно передать "suggestions" для твоих стилей
};

export const SuggestionsList: React.FC<Props> = (props) => {
    const {
        moves,
        query,
        highlight,
        active,
        onPickPreview,
        onApply,
        className = "suggestions",
    } = props;
    const { ref, rememberBeforeClick, restoreNextTick } =
        usePreserveScroll<HTMLDivElement>();

    const isSame = (a?: Move | null, b?: Move | null) =>
        !!a &&
        !!b &&
        a.word === b.word &&
        a.insert.r === b.insert.r &&
        a.insert.c === b.insert.c;

    // чтобы даже при одинаковом пути был уникальный суффикс
    const seen = new Map<string, number>();

    return (
        <div ref={ref} className={className}>
            {moves.map((m) => {
                const pathSig = m.path.map((p) => `${p.r}-${p.c}`).join(".");
                const base = `${m.word}-${m.insert.letter}-${m.insert.r}-${m.insert.c}-${pathSig}`;
                const n = (seen.get(base) ?? 0) + 1;
                seen.set(base, n);
                const k = `${base}#${n}`;

                const activeNow = isSame(active, m);

                return (
                    <div
                        key={k}
                        className="suggestion"
                        onMouseDown={rememberBeforeClick}
                        onClick={() => {
                            onPickPreview(m);
                            restoreNextTick();
                        }}
                        style={{ cursor: "pointer" }}>
                        <div>
                            <b>{highlight(m.word, query)}</b>{" "}
                            <span className="badge">{m.path.length} букв</span>
                        </div>
                        <div>
                            {activeNow ? (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onApply(m);
                                    }}>
                                    Применить
                                </button>
                            ) : (
                                <>
                                    вставь [{m.insert.r + 1}:{m.insert.c + 1}] «
                                    {m.insert.letter}»
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
            {moves.length === 0 && (
                <div className="badge" style={{ margin: 8 }}>
                    Ничего не найдено
                </div>
            )}
        </div>
    );
};
