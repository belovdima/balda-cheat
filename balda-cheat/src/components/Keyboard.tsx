import React from "react";
import clsx from "clsx";

// Русская QWERTY (йцукен)
const QWERTY_RU_ROWS: string[][] = [
    ["Й", "Ц", "У", "К", "Е", "Н", "Г", "Ш", "Щ", "З", "Х", "Ъ"],
    ["Ф", "Ы", "В", "А", "П", "Р", "О", "Л", "Д", "Ж", "Э"],
    ["Я", "Ч", "С", "М", "И", "Т", "Ь", "Б", "Ю"],
    // При желании можно добавить отдельную клавишу Ё:
    // ["Ё"]
];

type Props = {
    value: string | null;
    onPick: (ch: string) => void;
    layout?: "alphabet" | "qwerty-ru";
    // Если layout="alphabet", можно прокинуть произвольный список:
    letters?: string[];
};

// Базовый алфавит (fallback), если нужен
const RU_ALPHABET = [
    "А",
    "Б",
    "В",
    "Г",
    "Д",
    "Е",
    "Ё",
    "Ж",
    "З",
    "И",
    "Й",
    "К",
    "Л",
    "М",
    "Н",
    "О",
    "П",
    "Р",
    "С",
    "Т",
    "У",
    "Ф",
    "Х",
    "Ц",
    "Ч",
    "Ш",
    "Щ",
    "Ъ",
    "Ы",
    "Ь",
    "Э",
    "Ю",
    "Я",
];

export const Keyboard: React.FC<Props> = ({
    value,
    onPick,
    layout = "alphabet",
    letters,
}) => {
    if (layout === "qwerty-ru") {
        // Рисуем рядами. Чтобы сработали текущие стили, используем grid с «разрывами строк».
        return (
            <div
                className="keyboard"
                style={{ gridTemplateColumns: "repeat(12, 1fr)" }}>
                {QWERTY_RU_ROWS.map((row, i) => (
                    <React.Fragment key={i}>
                        {row.map((ch) => (
                            <div
                                key={ch}
                                className={clsx(
                                    "key",
                                    value === ch && "active"
                                )}
                                onClick={() => onPick(ch)}>
                                {ch}
                            </div>
                        ))}
                        {/* перенос строки внутри CSS grid */}
                        <div
                            key={`br-${i}`}
                            style={{ gridColumn: "1 / -1", height: 6 }}
                        />
                    </React.Fragment>
                ))}
            </div>
        );
    }

    // Алфавитный режим (как раньше)
    const source = letters?.length ? letters : RU_ALPHABET;
    return (
        <div className="keyboard">
            {source.map((ch) => (
                <div
                    key={ch}
                    className={clsx("key", value === ch && "active")}
                    onClick={() => onPick(ch)}>
                    {ch}
                </div>
            ))}
        </div>
    );
};
