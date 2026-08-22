import type { BlackboxAction, BlackboxDifficulty } from "@/domain/blackbox/types";

export type BlackboxSnapshot = { version: 1; seed: number; difficulty: BlackboxDifficulty; actionSequence: BlackboxAction["id"][] };
export type BlackboxPersistence = { load: () => BlackboxSnapshot | null; save: (snapshot: BlackboxSnapshot) => void; clear: () => void };
const key = "failure-lab.blackbox.v1";
export function createBlackboxPersistence(storage: Storage | undefined = typeof window === "undefined" ? undefined : window.localStorage): BlackboxPersistence {
  return { load: () => { if (!storage) return null; const raw = storage.getItem(key); if (!raw) return null; try { const value = JSON.parse(raw) as BlackboxSnapshot; return value?.version === 1 && Array.isArray(value.actionSequence) ? value : null; } catch { return null; } }, save: (snapshot) => storage?.setItem(key, JSON.stringify(snapshot)), clear: () => storage?.removeItem(key) };
}
export const blackboxPersistence = createBlackboxPersistence();
