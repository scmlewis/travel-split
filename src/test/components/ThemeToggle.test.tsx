import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ThemeToggle from "../../components/ThemeToggle";

describe("ThemeToggle", () => {
  it("renders current theme label", () => {
    render(<ThemeToggle theme="dark" onChange={vi.fn()} />);
    expect(screen.getByText("Dark")).toBeInTheDocument();
  });

  it("cycles to next theme on click", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ThemeToggle theme="dark" onChange={onChange} />);
    await user.click(screen.getByRole("button"));
    expect(onChange).toHaveBeenCalledWith("system");
  });

  it("cycles from system to light", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ThemeToggle theme="system" onChange={onChange} />);
    await user.click(screen.getByRole("button"));
    expect(onChange).toHaveBeenCalledWith("light");
  });

  it("cycles from light to dark", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ThemeToggle theme="light" onChange={onChange} />);
    await user.click(screen.getByRole("button"));
    expect(onChange).toHaveBeenCalledWith("dark");
  });
});
