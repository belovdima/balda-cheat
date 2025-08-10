export type Trie = { end?: boolean; children: Record<string, Trie> };

export function makeTrie(words: string[]): Trie {
    const root: Trie = { children: {} };
    for (const w of words) {
        let node = root;
        for (const ch of w) {
            node = node.children[ch] ??= { children: {} };
        }
        node.end = true;
    }
    return root;
}

export function hasPrefix(trie: Trie, s: string): boolean {
    let node: Trie | undefined = trie;
    for (const ch of s) {
        node = node?.children[ch];
        if (!node) return false;
    }
    return true;
}

export function isWord(trie: Trie, s: string): boolean {
    let node: Trie | undefined = trie;
    for (const ch of s) {
        node = node?.children[ch];
        if (!node) return false;
    }
    return !!node?.end;
}
