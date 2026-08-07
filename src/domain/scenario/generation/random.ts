export type SeededRandom = () => number;

export function createSeededRandom(seed: number): SeededRandom {
  let value = seed >>> 0;

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export function randomInt(random: SeededRandom, min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}
