import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Avatar from "../../components/Avatar";

describe("Avatar", () => {
  it("renders the first initial", () => {
    render(<Avatar name="Alice" />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("capitalizes the initial", () => {
    render(<Avatar name="bob" />);
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("applies sm size classes", () => {
    const { container } = render(<Avatar name="Alice" size="sm" />);
    expect(container.firstChild).toHaveClass("w-5", "h-5");
  });

  it("applies md size classes by default", () => {
    const { container } = render(<Avatar name="Alice" />);
    expect(container.firstChild).toHaveClass("w-7", "h-7");
  });

  it("applies lg size classes", () => {
    const { container } = render(<Avatar name="Alice" size="lg" />);
    expect(container.firstChild).toHaveClass("w-9", "h-9");
  });

  it("has consistent color for same name", () => {
    const { container: c1 } = render(<Avatar name="Alice" />);
    const { container: c2 } = render(<Avatar name="Alice" />);
    const bg1 = (c1.firstChild as HTMLElement).style.background;
    const bg2 = (c2.firstChild as HTMLElement).style.background;
    expect(bg1).toBe(bg2);
  });

  it("sets title attribute", () => {
    render(<Avatar name="Alice" />);
    expect(screen.getByTitle("Alice")).toBeInTheDocument();
  });
});
