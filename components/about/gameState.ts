// Tiny shared state so other parts of the about page know when someone is
// playing Snake (the "Hello?" poster waits until the game is over).

let playing = false;
let lastGameEnd = 0; // when the last game ended (ms timestamp)
const listeners = new Set<() => void>();

export const gameState = {
  setPlaying(value: boolean) {
    if (playing === value) return;
    playing = value;
    if (!value) lastGameEnd = Date.now();
    listeners.forEach((listener) => listener());
  },
  isPlaying: () => playing,
  lastGameEnd: () => lastGameEnd,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  serverSnapshot: () => false,
};