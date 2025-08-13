import React, { useEffect, useMemo, useRef, useState } from "react";

type Props = {
    startWord: string;
    onChangeStartWord: (v: string) => void;
    onStart: () => void;
    dictCount?: number;
};

const CELLS = 5;

// нормализуем ввод (кириллица в верхнем регистре, Ё → Е)
function normRuUpper(s: string) {
    return s
        .toUpperCase()
        .replace(/Ё/g, "Е")
        .replace(/[^А-Я]/g, "");
}

export const WelcomeScreen: React.FC<Props> = ({
    startWord,
    onChangeStartWord,
    onStart,
    dictCount,
}) => {
    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
    const [shake, setShake] = useState(false);

    // для автозаполнения пустых ячеек при монтировании
    useEffect(() => {
        // очищаем слово при загрузке экрана
        onChangeStartWord("");
        inputsRef.current[0]?.focus();
    }, []);

    const letters = useMemo(() => {
        const arr = new Array(CELLS).fill("");
        for (let i = 0; i < CELLS; i++) arr[i] = startWord[i] ?? "";
        return arr;
    }, [startWord]);

    const setCell = (idx: number, ch: string) => {
        const wordArr = startWord.split("");
        wordArr[idx] = ch;
        const joined = wordArr.join("").slice(0, CELLS);
        onChangeStartWord(joined);
    };

    const handleChange = (value: string, idx: number) => {
        const v = normRuUpper(value).slice(-1);
        if (!v) return;
        setCell(idx, v);
        if (idx < CELLS - 1) inputsRef.current[idx + 1]?.focus();
    };

    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>,
        idx: number
    ) => {
        const key = e.key;
        if (key === "Backspace") {
            if (letters[idx]) {
                // очистим текущую, но не прыгаем назад
                setCell(idx, "");
            } else if (idx > 0) {
                // прыжок назад и очистка
                inputsRef.current[idx - 1]?.focus();
                setCell(idx - 1, "");
            }
            e.preventDefault();
            return;
        }

        if (key === "ArrowLeft" && idx > 0) {
            inputsRef.current[idx - 1]?.focus();
            e.preventDefault();
            return;
        }
        if (key === "ArrowRight" && idx < CELLS - 1) {
            inputsRef.current[idx + 1]?.focus();
            e.preventDefault();
            return;
        }
        if (key === "Enter") {
            if (startWord.length === CELLS && /^[А-Я]{5}$/.test(startWord)) {
                onStart();
            } else {
                // лёгкий шейк, если не 5 корректных букв
                setShake(true);
                setTimeout(() => setShake(false), 320);
            }
        }
    };

    const handlePaste: React.ClipboardEventHandler<HTMLInputElement> = (e) => {
        const raw = e.clipboardData.getData("text");
        const cleaned = normRuUpper(raw).slice(0, CELLS);
        if (!cleaned) return;
        const padded = cleaned.padEnd(CELLS, "");
        onChangeStartWord(padded);
        // сфокусируем след. после последней непустой
        const last = Math.min(cleaned.length, CELLS) - 1;
        inputsRef.current[Math.max(last, 0)]?.focus();
        e.preventDefault();
    };

    const canStart = startWord.length === CELLS && /^[А-Я]{5}$/.test(startWord);

    const tryStart = () => {
        if (canStart) onStart();
        else {
            setShake(true);
            setTimeout(() => setShake(false), 320);
        }
    };

    return (
        <div className="container" style={{ maxWidth: 720 }}>
            <div className="panel" style={{ padding: 20, textAlign: "center" }}>
                <h1 style={{ fontSize: 26, marginBottom: 8 }}>Набалдажник</h1>
                <p style={{ color: "var(--muted)", marginTop: 0 }}>
                    Введите стартовое слово из 5 букв
                </p>

                <div className={`start-cells ${shake ? "shake" : ""}`}>
                    {Array.from({ length: CELLS }).map((_, i) => (
                        <input
                            key={i}
                            ref={(el) => {
                                inputsRef.current[i] = el; // ← важное исправление: ничего не возвращаем
                            }}
                            value={letters[i] || ""}
                            onChange={(e) => handleChange(e.target.value, i)}
                            onKeyDown={(e) => handleKeyDown(e, i)}
                            onPaste={handlePaste}
                            maxLength={1}
                            inputMode="text"
                            autoComplete="off"
                            className={`start-cell ${
                                letters[i] ? "filled" : ""
                            }`}
                        />
                    ))}
                </div>

                <button
                    onClick={tryStart}
                    disabled={!canStart}
                    className={`start-button ${canStart ? "ok" : ""}`}>
                    Начать игру
                </button>
            </div>

            <div className="panel" style={{ padding: 16 }}>
                <div className="row" style={{ gap: 10 }}>
                    <span className="badge">
                        Максимальная длина слов из словаря: 10 букв
                    </span>
                    <small className="badge">
                        Слов в словаре: {dictCount ?? "…"}
                    </small>
                    <span className="badge">Ё = Е</span>
                </div>
            </div>
        </div>
    );
};
