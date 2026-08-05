import type { IncidentAction } from "@/domain/incident/types";

export type ActionAvailability = { available: true } | { available: false; reason: string };

function actionTitle(actionId: string, actions: IncidentAction[]) {
  return actions.find((action) => action.id === actionId)?.title ?? actionId;
}

export function getActionAvailability(action: IncidentAction, actions: IncidentAction[], completedActionIds: string[], actionPoints: number, prerequisitePolicy: "hard" | "soft" = "hard"): ActionAvailability {
  if (completedActionIds.includes(action.id)) return { available: false, reason: "Action already completed" };

  const prerequisites = action.prerequisites ?? [];
  const completedPrerequisites = prerequisites.filter((id) => completedActionIds.includes(id));
  const prerequisitesMet = action.prerequisiteMode === "any"
    ? completedPrerequisites.length > 0
    : completedPrerequisites.length === prerequisites.length;
  if (prerequisitePolicy === "hard" && !prerequisitesMet) {
    const titles = prerequisites.map((id) => actionTitle(id, actions));
    return { available: false, reason: `Requires: ${titles.join(action.prerequisiteMode === "any" ? " or " : " and ")}` };
  }

  if (actionPoints < action.actionPointCost) return { available: false, reason: `Requires ${action.actionPointCost} action point${action.actionPointCost === 1 ? "" : "s"}` };
  return { available: true };
}
