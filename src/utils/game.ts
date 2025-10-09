import { Card } from '../../types';

// 4-deck (n = 3 → 13 cards and 13 icons)
// 6-deck (n = 5 → 31 cards and 31 icons)
// 8-deck (n = 7 → 57 cards and 57 icons)
// 12-deck (n = 11 → 133 cards and 133 icons)
// 14-deck (n = 13 → 183 cards and 183 icons)
// 18-deck (n = 17 → 307 cards and 307 icons)
// 20-deck (n = 19 → 381 cards and 381 icons)

// It is possible to generate decks where n is NOT a prime number but will require a different algorithm

export const generateDobbleDeck = (n: number): Card[] => {
    const deck: Card[] = [];

    // 1. First card (symbols 0..n)
    deck.push(Array.from({ length: n + 1 }, (_, i) => i));

    // 2. Next n cards
    for (let j = 0; j < n; j++) {
        const card = [0];
        for (let k = 0; k < n; k++) {
            card.push(n + 1 + n * j + k);
        }
        deck.push(card);
    }

    // 3. Remaining n² cards
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            const card = [i + 1];
            for (let k = 0; k < n; k++) {
                card.push(n + 1 + n * k + ((i * k + j) % n));
            }
            deck.push(card);
        }
    }

    return deck;
};

// Fisher-Yates shuffle (returns a *new* array)
export const shuffle = <T>(arr: T[]): T[] => {
    const copy = [...arr];
    let currentIndex = copy.length;

    while (currentIndex > 0) {
        const randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [copy[currentIndex], copy[randomIndex]] = [copy[randomIndex], copy[currentIndex]];
    }

    return copy;
};
