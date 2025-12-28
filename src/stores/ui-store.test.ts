import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "./ui-store";

describe("UI Store", () => {
  beforeEach(() => {
    // Reset store state before each test
    useUIStore.setState({ sidebarOpen: true });
  });

  it("should have sidebar open by default", () => {
    const state = useUIStore.getState();
    expect(state.sidebarOpen).toBe(true);
  });

  it("should toggle sidebar state", () => {
    const { toggleSidebar } = useUIStore.getState();

    toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(false);

    toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it("should set sidebar state directly", () => {
    const { setSidebarOpen } = useUIStore.getState();

    setSidebarOpen(false);
    expect(useUIStore.getState().sidebarOpen).toBe(false);

    setSidebarOpen(true);
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });
});
