import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../App";
import { ToastProvider } from "../../hooks/useToast";

// Mock crypto.randomUUID
vi.stubGlobal("crypto", { randomUUID: () => "test-uuid-" + Math.random().toString(36).slice(2) });

function renderApp() {
  return render(
    <ToastProvider>
      <App />
    </ToastProvider>,
  );
}

describe("App integration", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders the landing page with trip creation form", () => {
    renderApp();
    expect(screen.getByText("Travel Split")).toBeInTheDocument();
    expect(screen.getByText("Start a Trip")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Where are you going?")).toBeInTheDocument();
  });

  it("shows empty state when no trips exist", () => {
    renderApp();
    expect(screen.getByText("Ready to explore?")).toBeInTheDocument();
  });

  it("creates a trip and navigates to it", async () => {
    const user = userEvent.setup();
    renderApp();

    const input = screen.getByPlaceholderText("Where are you going?");
    await user.type(input, "Tokyo Trip");
    await user.click(screen.getByText("Create"));

    // Should navigate to the trip view
    expect(screen.getByText("Tokyo Trip")).toBeInTheDocument();
    expect(screen.getByText("Summary")).toBeInTheDocument();
  });

  it("creates a trip and shows it in the list", async () => {
    const user = userEvent.setup();
    renderApp();

    const input = screen.getByPlaceholderText("Where are you going?");
    await user.type(input, "My Trip");
    await user.click(screen.getByText("Create"));

    // Go back to trips list
    await user.click(screen.getByTitle("Back to trips"));
    expect(screen.getByText("My Trip")).toBeInTheDocument();
  });

  it("adds a member via the manage tab", async () => {
    const user = userEvent.setup();
    renderApp();

    // Create a trip
    await user.type(screen.getByPlaceholderText("Where are you going?"), "Test Trip");
    await user.click(screen.getByText("Create"));

    // Switch to manage tab
    await user.click(screen.getByLabelText("Manage tab"));

    // Find the member input and add a member
    const memberInput = screen.getByPlaceholderText("Add member");
    await user.type(memberInput, "Alice");
    await user.click(screen.getByRole("button", { name: "Add member" }));

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument(); // member count badge
  });

  it("adds an expense and shows it in the expenses tab", async () => {
    const user = userEvent.setup();
    renderApp();

    // Create trip
    await user.type(screen.getByPlaceholderText("Where are you going?"), "Test Trip");
    await user.click(screen.getByText("Create"));

    // Add member
    await user.click(screen.getByLabelText("Manage tab"));
    await user.type(screen.getByPlaceholderText("Add member"), "Alice");
    await user.click(screen.getByRole("button", { name: "Add member" }));
    await user.type(screen.getByPlaceholderText("Add member"), "Bob");
    await user.click(screen.getByRole("button", { name: "Add member" }));

    // Switch to expenses tab
    await user.click(screen.getByLabelText("Expenses tab"));
    expect(screen.getByText("No expenses yet")).toBeInTheDocument();

    // Open expense form
    await user.click(screen.getByLabelText("Add expense"));

    // Fill the form
    await user.type(screen.getByPlaceholderText("e.g. Hotel, Dinner"), "Dinner");
    const amountInput = screen.getByPlaceholderText("Amount");
    await user.type(amountInput, "200");

    // Select payer
    const payerSelect = screen.getByDisplayValue("Who paid?");
    await user.selectOptions(payerSelect, "Alice");

    // Submit
    await user.click(screen.getByRole("button", { name: "Add Expense" }));

    // Should appear in expenses list
    expect(screen.getByText("Dinner")).toBeInTheDocument();
    expect(screen.getByText("HK$200.00")).toBeInTheDocument();
  });

  it("tabs switch correctly", async () => {
    const user = userEvent.setup();
    renderApp();

    // Create trip
    await user.type(screen.getByPlaceholderText("Where are you going?"), "Tab Test");
    await user.click(screen.getByText("Create"));

    // Default is overview
    expect(screen.getByLabelText("Overview tab")).toHaveAttribute("aria-selected", "true");

    // Switch to expenses
    await user.click(screen.getByLabelText("Expenses tab"));
    expect(screen.getByLabelText("Expenses tab")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText("Overview tab")).toHaveAttribute("aria-selected", "false");

    // Switch to stats
    await user.click(screen.getByLabelText("Stats tab"));
    expect(screen.getByLabelText("Stats tab")).toHaveAttribute("aria-selected", "true");

    // Switch to manage
    await user.click(screen.getByLabelText("Manage tab"));
    expect(screen.getByLabelText("Manage tab")).toHaveAttribute("aria-selected", "true");
  });

  it("can delete a trip from the list", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderApp();

    // Create trip
    await user.type(screen.getByPlaceholderText("Where are you going?"), "Delete Me");
    await user.click(screen.getByText("Create"));

    // Go back
    await user.click(screen.getByTitle("Back to trips"));

    // Find and click the delete button (X icon in the trip card)
    const tripCard = screen.getByText("Delete Me").closest(".card") as HTMLElement;
    const deleteBtn = within(tripCard).getByRole("button");
    await user.click(deleteBtn);

    // Should be empty state again
    expect(screen.getByText("Ready to explore?")).toBeInTheDocument();
    vi.mocked(window.confirm).mockRestore();
  });
});
