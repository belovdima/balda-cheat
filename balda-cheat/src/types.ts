export type Board = string[][]; // 5x5, "" = пусто
export type Pos = { r: number; c: number };
export type Move = {
    word: string;
    path: Pos[]; // клетки слова (включая нововставленную)
    insert: Pos & { letter: string }; // куда и какую букву ставим
    score: number; // чем больше — тем лучше (длина и бонусы)
};
