import type { BlackboxDifficulty, ObservationPolicy } from "./types";

const policies: Record<BlackboxDifficulty, ObservationPolicy> = {
  beginner: { difficulty: "beginner", visibleSurfaces: ["dashboard", "alert-feed"], revealHints: true, allowTentativeActions: false, feedbackFidelity: "explicit" },
  intermediate: { difficulty: "intermediate", visibleSurfaces: ["dashboard", "service-console", "alert-feed"], revealHints: false, allowTentativeActions: false, feedbackFidelity: "partial" },
  advanced: { difficulty: "advanced", visibleSurfaces: ["dashboard", "service-console", "endpoint", "trace-explorer"], revealHints: false, allowTentativeActions: true, feedbackFidelity: "minimal" },
  blackbox: { difficulty: "blackbox", visibleSurfaces: ["endpoint", "service-console"], revealHints: false, allowTentativeActions: true, feedbackFidelity: "minimal" },
};

export function createObservationPolicy(difficulty: BlackboxDifficulty): ObservationPolicy {
  return { ...policies[difficulty], visibleSurfaces: [...policies[difficulty].visibleSurfaces] };
}
