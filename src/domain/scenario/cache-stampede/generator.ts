import { createSeededRandom, randomInt } from "../generation/random";
import type { ScenarioFamily } from "../generation/types";
import { createCacheStampedeDefinition } from "./definition";

export const cacheStampedeFamily: ScenarioFamily = {
  id: "cache-stampede",
  generate(seed) {
    const random = createSeededRandom(seed);

    return createCacheStampedeDefinition({
      startMinute: randomInt(random, 20, 90),
      cacheHitRate: randomInt(random, 62, 78),
      databaseLatency: randomInt(random, 140, 240),
      databaseConnections: randomInt(random, 55, 78),
      requestRate: randomInt(random, 4200, 5200),
      cacheMisses: randomInt(random, 1000, 1800),
      pressureMultiplier: randomInt(random, 6, 10),
    }, seed);
  },
};
