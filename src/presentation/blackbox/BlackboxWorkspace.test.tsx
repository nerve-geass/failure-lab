import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { blackboxActions, createBlackboxSession, observe } from "@/domain/blackbox/blackboxEngine";
import { createObservationPolicy } from "@/domain/blackbox/observationPolicy";
import { BlackboxWorkspace } from "./BlackboxWorkspace";

const session = createBlackboxSession(42, createObservationPolicy("intermediate"));
const observation = observe(session);

describe("BlackboxWorkspace", () => {
  it("renders only surfaces present in the observation", () => {
    render(<BlackboxWorkspace observation={observation} actions={blackboxActions} onAction={vi.fn()} />);

    expect(screen.getByText("Checkout dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Hidden causal chain")).not.toBeInTheDocument();
  });

  it("shows consequences after an attempted action", async () => {
    const onAction = vi.fn();
    render(<BlackboxWorkspace observation={observation} actions={blackboxActions} onAction={onAction} />);

    await userEvent.click(screen.getByRole("button", { name: /probe checkout/i }));

    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ id: "probe-checkout" }));
  });

  it("offers a way back to the catalog", () => {
    render(<BlackboxWorkspace observation={observation} actions={blackboxActions} onAction={vi.fn()} onExit={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Back to catalog" })).toBeInTheDocument();
  });
});
