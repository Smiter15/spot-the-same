// const cards = 55;
// const symbols = Array.from({ length: 57 }, (_, i) => i);

// could be more performant as is hash map but has issues like shuffling and looping
// const deck: Record<string, number[]> = { card0: [0, 1, 2, 3, 4, 5, 6, 7] };

// deck of 31 cards, 31 symbols, 6 cards per symbol
const deck = [
  [25, 26, 27, 28, 29, 30],
  [0, 1, 2, 3, 4, 25],
  [5, 6, 7, 8, 9, 25],
  [10, 11, 12, 13, 14, 25],
  [15, 16, 17, 18, 19, 25],
  [20, 21, 22, 23, 24, 25],
  [0, 5, 10, 15, 20, 26],
  [1, 6, 11, 16, 21, 26],
  [2, 7, 12, 17, 22, 26],
  [3, 8, 13, 18, 23, 26],
  [4, 9, 14, 19, 24, 26],
  [0, 6, 12, 18, 24, 27],
  [1, 7, 13, 19, 20, 27],
  [2, 8, 14, 15, 21, 27],
  [3, 9, 10, 16, 22, 27],
  [4, 5, 11, 17, 23, 27],
  [0, 7, 14, 16, 23, 28],
  [1, 8, 10, 17, 24, 28],
  [2, 9, 11, 18, 20, 28],
  [3, 5, 12, 19, 21, 28],
  [4, 6, 13, 15, 22, 28],
  [0, 8, 11, 19, 22, 29],
  [1, 9, 12, 15, 23, 29],
  [2, 5, 13, 16, 24, 29],
  [3, 6, 14, 17, 20, 29],
  [4, 7, 10, 18, 21, 29],
  [0, 9, 13, 17, 21, 30],
  [1, 5, 14, 18, 22, 30],
  [2, 6, 10, 19, 23, 30],
  [3, 7, 11, 15, 24, 30],
  [4, 8, 12, 16, 20, 30],
];

export const shuffle = (arr: any[]) => {
  let currentIndex: number = arr.length,
    randomIndex;

  while (currentIndex > 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [arr[currentIndex], arr[randomIndex]] = [
      arr[randomIndex],
      arr[currentIndex],
    ];
  }

  return arr;
};

export const deal = (noExpectedPlayers: number) => {
  const shuffledDeck = shuffle(deck);
  const activeCard = shuffledDeck.shift();
  const noOfCardsPerPlayer = Math.floor(
    shuffledDeck.length / noExpectedPlayers
  );

  const dealtCards = Array.from({ length: noExpectedPlayers }, () =>
    shuffledDeck.splice(0, noOfCardsPerPlayer)
  );

  return { activeCard, dealtCards };
};
