export type ScenarioDifficulty = "Beginner" | "Intermediate" | "Advanced";
export type ScenarioAvailability = "available" | "planned";

export type ScenarioCatalogEntry = {
  id: string;
  title: string;
  order: number;
  difficulty: ScenarioDifficulty;
  status: ScenarioAvailability;
  summary: string;
  estimatedMinutes: number;
  prerequisites: string[];
  concepts: string[];
};
