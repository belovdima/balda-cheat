import React from "react";
import { RU_ALPHABET } from "../letters";
import clsx from "clsx";

type Props = {
    value: string | null;
    onPick: (ch: string) => void;
};

export const Keyboard: React.FC<Props> = ({ value, onPick }) => {
    return (
        <div className="keyboard">
            {RU_ALPHABET.map((ch) => (
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
