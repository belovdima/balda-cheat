export const RU_ALPHABET = Array.from("АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ");
export function norm(s: string): string {
    return s
        .toUpperCase()
        .replace(/[Ё]/g, "Е")
        .replace(/[^А-Я]/g, "");
}
