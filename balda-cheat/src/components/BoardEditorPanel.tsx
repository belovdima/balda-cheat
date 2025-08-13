import React from "react";
import type { Board } from "../types";
import { BoardView } from "./BoardView";

type Props = {
    board: Board;
    onCellClick: (r: number, c: number) => void;
    onCancel: () => void;
};

export const BoardEditorPanel: React.FC<Props> = ({
    board,
    onCellClick,
    onCancel,
}) => (
    <div className="panel">
        <h1>Текущее поле</h1>
        <BoardView board={board} onCellClick={onCellClick} />
        <div style={{ height: 8 }} />
        <div className="row" style={{ justifyContent: "space-between" }}>
            <small className="badge">
                Режим редактирования: выбери букву справа и кликни пустую клетку
            </small>
            <button onClick={onCancel}>Не ставить букву</button>
        </div>
    </div>
);
