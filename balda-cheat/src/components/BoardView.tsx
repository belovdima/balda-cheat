import React from "react";
import type { Board, Pos } from "../types";
import clsx from "clsx";

type Props = {
    board: Board;
    onCellClick?: (r: number, c: number) => void;
    path?: Pos[];
    insert?: Pos;
};

export const BoardView: React.FC<Props> = ({
    board,
    onCellClick,
    path,
    insert,
}) => {
    const isPath = (r: number, c: number) =>
        path?.some((p) => p.r === r && p.c === c);
    const isInsert = (r: number, c: number) =>
        insert && insert.r === r && insert.c === c;
    return (
        <div className="grid">
            {board.map((row, r) =>
                row.map((ch, c) => (
                    <div
                        key={`${r}-${c}`}
                        className={clsx(
                            "cell",
                            !ch && "empty",
                            isPath(r, c) && "path",
                            isInsert(r, c) && "insert"
                        )}
                        onClick={() => onCellClick?.(r, c)}
                        title={`${r + 1}:${c + 1}`}>
                        {ch}
                    </div>
                ))
            )}
        </div>
    );
};
