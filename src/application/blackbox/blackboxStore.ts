import { create } from "zustand";
import { applyBlackboxAction, blackboxActions, createBlackboxSession, observe, type BlackboxSession } from "@/domain/blackbox/blackboxEngine";
import { createObservationPolicy } from "@/domain/blackbox/observationPolicy";
import type { BlackboxAction, BlackboxDifficulty, BlackboxObservation } from "@/domain/blackbox/types";
import { blackboxPersistence, type BlackboxPersistence } from "@/infrastructure/persistence/blackboxPersistence";

export type BlackboxStore = {
  session: BlackboxSession;
  observation: BlackboxObservation;
  actions: BlackboxAction[];
  hasSavedSession: boolean;
  start: () => void;
  resume: () => void;
  abandon: () => void;
  performAction: (actionId: BlackboxAction["id"]) => void;
};

export function createBlackboxStore(seed = 42, difficulty: BlackboxDifficulty = "intermediate", persistence: BlackboxPersistence = blackboxPersistence) {
  const policy = createObservationPolicy(difficulty);
  const createSession = () => createBlackboxSession(seed, policy);
  const initialSession = createSession();
  const replay = (snapshot: ReturnType<BlackboxPersistence["load"]>) => { const session = createSession(); if (!snapshot) return session; for (const id of snapshot.actionSequence) { const action = blackboxActions.find((candidate) => candidate.id === id); if (action) applyBlackboxAction(session, action); } return session; };
  const saved = persistence.load();
  return create<BlackboxStore>((set, get) => ({
    session: initialSession,
    observation: observe(initialSession),
    actions: blackboxActions.map((action) => ({ ...action })),
    hasSavedSession: Boolean(saved),
    start: () => {
      const session = createSession();
      persistence.save({ version: 1, seed, difficulty, actionSequence: [] });
      set({ session, observation: observe(session), hasSavedSession: true });
    },
    resume: () => { const snapshot = persistence.load(); const session = replay(snapshot); set({ session, observation: observe(session), hasSavedSession: Boolean(snapshot) }); },
    abandon: () => { persistence.clear(); const session = createSession(); set({ session, observation: observe(session), hasSavedSession: false }); },
    performAction: (actionId) => {
      const action = get().actions.find((candidate) => candidate.id === actionId);
      if (!action) return;
      const result = applyBlackboxAction(get().session, action);
      const snapshot = persistence.load() ?? { version: 1 as const, seed, difficulty, actionSequence: [] };
      if (result.accepted) persistence.save({ ...snapshot, actionSequence: [...snapshot.actionSequence, actionId] });
      set({ observation: result.observation, hasSavedSession: true });
    },
  }));
}

export const useBlackboxStore = createBlackboxStore();
