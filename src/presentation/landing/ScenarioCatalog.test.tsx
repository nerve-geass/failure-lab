import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ScenarioCatalog } from "./ScenarioCatalog";

describe("ScenarioCatalog practice modes", () => {
  it("exposes the beginner Checkout Blackbox separately from the learning path", async () => {
    const onSelectBlackbox = vi.fn();
    render(<ScenarioCatalog onSelectScenario={vi.fn()} onSelectBlackbox={onSelectBlackbox} />);

    expect(screen.getByText("Practice modes")).toBeInTheDocument();
    expect(screen.getByText("Checkout Blackbox")).toBeInTheDocument();
    expect(within(screen.getByRole("button", { name: "Enter Checkout Blackbox" })).getByText("Beginner")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Enter Checkout Blackbox" }));
    expect(onSelectBlackbox).toHaveBeenCalledOnce();
  });
});
