export function createSeed(): number {
  return Math.floor(Math.random() * 2147483647);
}

export function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function selectWithSeed<T>(items: T[], seed: number): T {
  const rng = seededRandom(seed);
  const index = Math.floor(rng() * items.length);
  return items[index];
}
