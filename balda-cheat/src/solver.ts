import type { Board } from "./types";
import type { Move } from "./types";
import type { Pos } from "./types";
import { RU_ALPHABET, norm } from "./letters";
import type { Trie } from "./trie";
import { makeTrie, hasPrefix, isWord } from "./trie";

const N = 5;
const DIRS = [
    { r: 1, c: 0 },
    { r: -1, c: 0 },
    { r: 0, c: 1 },
    { r: 0, c: -1 },
];

const inb = (r: number, c: number) => r >= 0 && c >= 0 && r < N && c < N;

export function cloneBoard(b: Board): Board {
    return b.map((row) => row.slice());
}

function scoreWord(word: string): number {
    // базовая метрика: длина + лёгкий бонус за редкие буквы
    const rare = new Set(["Ф", "Щ", "Ъ", "Ь", "Ы", "Ж"]);
    const rareBonus = [...word].reduce(
        (s, ch) => s + (rare.has(ch) ? 0.5 : 0),
        0
    );
    return word.length + rareBonus;
}

function pathContains(path: Pos[], p: Pos): boolean {
    return path.some((q) => q.r === p.r && q.c === p.c);
}

function dfsFrom(
    b: Board,
    trie: Trie,
    start: Pos,
    mustInclude: Pos,
    used: boolean[][],
    cur: Pos[],
    curStr: string,
    out: Move[],
    banned: Set<string>
) {
    const ch = b[start.r][start.c];
    if (!ch) return;
    const nextStr = curStr + ch;
    if (!hasPrefix(trie, nextStr)) return;

    const nextPath = [...cur, start];
    const includesInsert = pathContains(nextPath, mustInclude);

    if (
        includesInsert &&
        isWord(trie, nextStr) &&
        nextStr.length >= 3 &&
        !banned.has(nextStr)
    ) {
        out.push({
            word: nextStr,
            path: nextPath,
            insert: {
                r: mustInclude.r,
                c: mustInclude.c,
                letter: b[mustInclude.r][mustInclude.c],
            },
            score: scoreWord(nextStr),
        });
    }

    used[start.r][start.c] = true;
    for (const d of DIRS) {
        const nr = start.r + d.r,
            nc = start.c + d.c;
        if (!inb(nr, nc)) continue;
        if (used[nr][nc]) continue;
        if (!b[nr][nc]) continue;
        dfsFrom(
            b,
            trie,
            { r: nr, c: nc },
            mustInclude,
            used,
            nextPath,
            nextStr,
            out,
            banned
        );
    }
    used[start.r][start.c] = false;
}

export function findAllMoves(
    board: Board,
    trie: Trie,
    bannedWords: string[],
    limitLetters?: string[] // можно ограничить алфавит
): Move[] {
    const banned = new Set(bannedWords.map(norm));
    const letters = (limitLetters?.length ? limitLetters : RU_ALPHABET).map(
        norm
    );

    const moves: Move[] = [];
    for (let r = 0; r < N; r++)
        for (let c = 0; c < N; c++) {
            if (board[r][c]) continue; // занято
            for (const L of letters) {
                const b2 = cloneBoard(board);
                b2[r][c] = L;
                // путь обязан включать (r,c). Запустим DFS из каждой непустой клетки,
                // требуя, чтобы по пути встретилась вставленная клетка.
                const used = Array.from({ length: N }, () =>
                    Array(N).fill(false)
                );
                const found: Move[] = [];
                for (let sr = 0; sr < N; sr++)
                    for (let sc = 0; sc < N; sc++) {
                        if (!b2[sr][sc]) continue;
                        dfsFrom(
                            b2,
                            trie,
                            { r: sr, c: sc },
                            { r, c },
                            used,
                            [],
                            "",
                            found,
                            banned
                        );
                    }
                for (const m of found) moves.push(m);
            }
        }
    // отсортируем: длиннее лучше, при равенстве — по алфавиту
    return moves.sort(
        (a, b) => b.score - a.score || a.word.localeCompare(b.word)
    );
}

export function emptyBoard(): Board {
    return Array.from({ length: N }, () => Array(N).fill(""));
}
