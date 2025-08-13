import React from "react";

type Props = {
    startWord: string;
    onChangeStartWord: (v: string) => void;
    onStart: () => void;
    onCalc?: () => void;
    dictCount?: number;
};

export const WelcomeScreen: React.FC<Props> = ({
    startWord,
    onChangeStartWord,
    onStart,
    onCalc,
    dictCount,
}) => {
    const onEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") onStart();
    };
    return (
        <div className="container" style={{ maxWidth: 720 }}>
            <div className="panel" style={{ padding: 20 }}>
                <h1 style={{ fontSize: 22, marginBottom: 12 }}>Набалдажник</h1>
                <p style={{ color: "var(--muted)", marginTop: 0 }}>
                    Напишите стартовое слово (ровно 5 букв), затем начните игру.
                </p>
                <div className="row" style={{ gap: 12 }}>
                    <input
                        value={startWord}
                        onChange={(e) => onChangeStartWord(e.target.value)}
                        onKeyDown={onEnter}
                        placeholder="Например: ЛИЛИЯ"
                        style={{ flex: 1, minWidth: 220 }}
                    />
                    <button onClick={onStart}>Начать</button>
                </div>
                <div style={{ height: 10 }} />
                <small className="badge">
                    Подсказка: можно нажать Enter вместо кнопки
                </small>
            </div>

            <div className="panel" style={{ padding: 16 }}>
                <div className="row" style={{ gap: 10 }}>
                    <span className="badge">
                        Слов в словаре: {dictCount ?? "…"}
                    </span>
                    <span className="badge">
                        Максимальная длина слов из словаря: 10 букв
                    </span>
                    <span className="badge">Ë = Е</span>
                </div>
            </div>
        </div>
    );
};
