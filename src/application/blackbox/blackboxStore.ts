import { create } from "zustand";
import { applyBlackboxAction, blackboxActions, createBlackboxSession, observe, type BlackboxSession } from "@/domain/blackbox/blackboxEngine";
import { createObservationPolicy } from "@/domain/blackbox/observationPolicy";
import type { BlackboxAction, BlackboxDifficulty, BlackboxObservation } from "@/domain/blackbox/types";

export type BlackboxStore = {
  session: BlackboxSession;
  observation: BlackboxObservation;
  actions: BlackboxAction[];
  start: () => void;
  performAction: (actionId: BlackboxAction["id"]) => void;
};

export function createBlackboxStore(seed = 42, difficulty: BlackboxDifficulty = "intermediate") {
  const policy = createObservationPolicy(difficulty);
  const createSession = () => createBlackboxSession(seed, policy);
  const initialSession = createSession();
  return create<BlackboxStore>((set, get) => ({
    session: initialSession,
    observation: observe(initialSession),
    actions: blackboxActions.map((action) => ({ ...action })),
    start: () => {
      const session = createSession();
      set({ session, observation: observe(session) });
    },
    performAction: (actionId) => {
      const action = get().actions.find((candidate) => candidate.id === actionId);
      if (!action) return;
      const result = applyBlackboxAction(get().session, action);
      set({ observation: result.observation });
    },
  }));
}

export const useBlackboxStore = createBlackboxStore();
