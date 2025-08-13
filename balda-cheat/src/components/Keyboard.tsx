import React from "react";
import clsx from "clsx";

type Props = {
    value: string | null;
    onPick: (ch: string) => void;
};

// RU QWERTY (стандартная раскладка)
const ROWS: string[][] = [
    ["Й", "Ц", "У", "К", "Е", "Н", "Г", "Ш", "Щ", "З", "Х", "Ъ"],
    ["Ф", "Ы", "В", "А", "П", "Р", "О", "Л", "Д", "Ж", "Э"],
    ["Я", "Ч", "С", "М", "И", "Т", "Ь", "Б", "Ю"],
];

export const Keyboard: React.FC<Props> = ({ value, onPick }) => {
    return (
        <div className="keyboard keyboard-qwerty">
            {ROWS.map((row, i) => (
                <div key={i} className={clsx("kb-row", `row-${i + 1}`)}>
                    {row.map((ch) => (
                        <div
                            key={ch}
                            className={clsx("key", value === ch && "active")}
                            onClick={() => onPick(ch)}>
                            {ch}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};
