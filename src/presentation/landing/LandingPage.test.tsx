import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createInitialIncident } from "@/domain/incident/createInitialIncident";
import { retryStormDefinition } from "@/domain/scenario/retry-storm/definition";
import type { IncidentState } from "@/domain/incident/types";
import { LandingPage } from "./LandingPage";

const callbacks = {
  onStart: vi.fn(),
  onResume: vi.fn(),
  onAbandon: vi.fn(),
  onSelectScenario: vi.fn(),
};

function props(incident: IncidentState, hasSavedIncident = true) {
  return { incident, hasSavedIncident, scenario: retryStormDefinition, ...callbacks };
}

describe("LandingPage", () => {
  it("shows resume and abandon controls for an active investigation", () => {
    render(<LandingPage {...props(createInitialIncident(retryStormDefinition))} />);

    expect(screen.getByRole("button", { name: "Resume investigation" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Abandon and choose another" })).toBeVisible();
  });

  it("shows report review and a new investigation action after completion", () => {
    const completed = { ...createInitialIncident(retryStormDefinition), status: "resolved" as const, outcome: "excellent-containment" as const };
    render(<LandingPage {...props(completed)} />);

    expect(screen.getByRole("button", { name: "Review report" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Start another investigation" })).toBeVisible();
  });

  it("uses generic hero copy and hides continuation when there is no saved incident", () => {
    render(<LandingPage {...props(createInitialIncident(retryStormDefinition), false)} />);

    expect(screen.getByRole("heading", { name: /train your instincts.*learn from failure/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Resume investigation" })).not.toBeInTheDocument();
  });
});
