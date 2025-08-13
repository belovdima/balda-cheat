import React from "react";
import type { Move } from "../types";
import { SuggestionsList } from "./SuggestionsList";

type Props = {
    moves: Move[];
    filteredMoves: Move[];
    query: string;
    onChangeQuery: (v: string) => void;
    onNeedEdit: () => void;
    onArmDelete: () => void;
    deleteArmed: boolean;
    onRecalc: () => void;
    active: Move | null;
    onPickPreview: (m: Move) => void;
    onApply: (m: Move) => void;
    highlight: (w: string, q: string) => React.ReactNode;
};

export const VariantsPanel: React.FC<Props> = ({
    moves,
    filteredMoves,
    query,
    onChangeQuery,
    onNeedEdit,
    onArmDelete,
    deleteArmed,
    onRecalc,
    active,
    onPickPreview,
    onApply,
    highlight,
}) => (
    <div className="panel">
        <h1>Все варианты</h1>
        <div className="row" style={{ gap: 8 }}>
            <input
                placeholder="Быстрый поиск по словам…"
                value={query}
                onChange={(e) => onChangeQuery(e.target.value)}
                style={{ flex: 1, minWidth: 160 }}
            />
            <span className="badge">
                Показано: {filteredMoves.length} / {moves.length}
            </span>
        </div>

        <div className="row option-buttons" style={{ gap: 8, marginTop: 8 }}>
            <button className="no-word" onClick={onNeedEdit}>
                Нет нужного слова
            </button>
            <button className="delete-letter" onClick={onArmDelete}>
                Удалить букву
            </button>
            {deleteArmed && (
                <small className="badge">
                    Кликни по букве на поле для удаления
                </small>
            )}
            {/* <button onClick={onRecalc}>Просчитать всевозможные слова</button> */}
        </div>

        <SuggestionsList
            className="suggestions suggestions-10rows"
            moves={filteredMoves}
            query={query}
            highlight={highlight}
            active={active}
            onPickPreview={onPickPreview}
            onApply={onApply}
        />
    </div>
);
