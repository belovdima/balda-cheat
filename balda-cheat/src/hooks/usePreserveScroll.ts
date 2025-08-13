import { useRef, RefObject } from "react";

export function usePreserveScroll<T extends HTMLElement>(): {
    ref: RefObject<T>;
    rememberBeforeClick: () => void;
    restoreNextTick: () => void;
} {
    const ref = useRef<T>(null);
    const lastScroll = useRef(0);

    const rememberBeforeClick = () => {
        const el = ref.current;
        if (el) lastScroll.current = el.scrollTop;
    };

    const restoreNextTick = () => {
        requestAnimationFrame(() => {
            const el = ref.current;
            if (el) el.scrollTop = lastScroll.current;
        });
    };

    return { ref, rememberBeforeClick, restoreNextTick };
}
