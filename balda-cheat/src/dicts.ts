import { norm } from "./letters";

export async function loadLocalDict(): Promise<string[]> {
    // минималка (замени/дополни — или подключим файл/URL позже)
    const seed = `
    ЛИЛИЯ
    ЛИС
    МИР
    МИРА
    САЛАТ
    СЕТЬ
    ЛЕСТНИЦА
    ЛИРА
    ЛИМОН
    СОН
    НОС
    ЛИСА
    ЛИСТ
    ТОН
    НИТЬ
  `;
    const arr = seed.split(/\s+/).map(norm).filter(Boolean);
    // фильтруем повторы
    return Array.from(new Set(arr));
}

// сюда можно будет прикрутить загрузку большого словаря:
// export async function loadFromUrl(url: string): Promise<string[]> { ... }
