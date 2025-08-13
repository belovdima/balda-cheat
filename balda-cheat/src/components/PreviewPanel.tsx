import React from "react";
import type { Board, Move } from "../types";
import { BoardView } from "./BoardView";
import { cloneBoard } from "../solver";

type Props = {
    board: Board;
    preview: Move | null;
    onApply: (m: Move) => void;
    onCellClick: (r: number, c: number) => void;
};

export const PreviewPanel: React.FC<Props> = ({
    board,
    preview,
    onApply,
    onCellClick,
}) => (
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
                            {preview.insert.c + 1}] «{preview.insert.letter}»
                        </div>
                    </div>
                    <div className="row" style={{ gap: 8 }}>
                        <div className="badge">
                            оценка {preview.score.toFixed(1)}
                        </div>
                        <button onClick={() => onApply(preview)}>
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
                    onCellClick={onCellClick}
                />
            </>
        ) : (
            <div className="badge">Нажми «Просчитать…»</div>
        )}
    </div>
);
