import React from "react";

type Props = {
    startWord: string;
    onChangeStartWord: (v: string) => void;
    onRestart: () => void;
    totalMoves: number;
};

export const HeaderBar: React.FC<Props> = ({
    startWord,
    onChangeStartWord,
    onRestart,
    totalMoves,
}) => (
    <div className="panel" style={{ gridArea: "header" }}>
        <h1>Набалдажник</h1>
        <div className="row" style={{ gap: 8 }}>
            <label>
                Стартовое слово:&nbsp;
                <input
                    value={startWord}
                    onChange={(e) => onChangeStartWord(e.target.value)}
                    style={{ width: 160 }}
                />
            </label>
            <button onClick={onRestart}>Новый старт</button>
            <span className="badge">Найдено: {totalMoves}</span>
        </div>
    </div>
);
