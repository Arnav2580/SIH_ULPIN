// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import request from "supertest";
import { createStore } from "../server/store";
import { createApp } from "../server/app";
import App from "./App";

// Rendering a WebGL canvas requires device/browser QA. Keep the actual UI, API
// handlers and SQLite store in these tests; replace only the GPU surface.
vi.mock("./components/CityScene", () => ({
  default: () => <div data-testid="city-scene">3D canvas test surface</div>,
}));
let store: ReturnType<typeof createStore>;
beforeEach(() => {
  store = createStore(":memory:");
  const app = createApp(store, "ui-test-officer");
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    let req =
      init?.method === "POST" ? request(app).post(url) : request(app).get(url);
    if (init?.headers) req = req.set(init.headers as Record<string, string>);
    if (init?.body) req = req.send(JSON.parse(String(init.body)));
    const res = await req;
    return {
      ok: res.status >= 200 && res.status < 300,
      status: res.status,
      json: async () => res.body,
    };
  });
});
afterEach(() => {
  cleanup();
  store.close();
  vi.unstubAllGlobals();
});
async function open() {
  render(<App />);
  await screen.findByRole("heading", { name: "One city. Every dimension." });
  return userEvent.setup();
}

describe("city workspace through API and database", () => {
  it("links 2D selection to the parcel record and filters the registry", async () => {
    const user = await open();
    await user.click(screen.getByRole("button", { name: "2D" }));
    await user.click(
      screen.getByRole("button", {
        name: /Select Orion Business Park, P-9472/,
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Orion Business Park" }),
    ).toBeTruthy();
    await user.click(
      screen.getByRole("button", { name: "Parcel registry" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "Search parcels" }),
      "P-9472",
    );
    expect(screen.getAllByRole("row")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "Inspect" }));
    expect(
      screen.getByRole("heading", { name: "Orion Business Park" }),
    ).toBeTruthy();
  });
  it("retains the land identity through vacancy and reports redevelopment reviews", async () => {
    const user = await open();
    await user.click(screen.getByRole("button", { name: /2029 Vacant site/ }));
    expect(screen.getByText("No structure")).toBeTruthy();
    expect(screen.getByText("DEMO9471000000")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /2031 Redeveloped/ }));
    await user.click(screen.getByRole("button", { name: "Validate parcel" }));
    const dialog = screen.getByRole("dialog");
    await within(dialog).findByText(
      /3 replacement units require an authoritative rights instrument/,
    );
  });
  it("authenticates an officer and persists a review with an audit event", async () => {
    const user = await open();
    await user.click(screen.getByRole("button", { name: /Guest viewer/ }));
    await user.type(
      screen.getByLabelText("Officer access token"),
      "ui-test-officer",
    );
    await user.click(
      screen.getByRole("button", { name: "Enable officer access" }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await user.click(screen.getByRole("button", { name: "Raise a review" }));
    await user.type(
      screen.getByLabelText("Observation"),
      "Verify the north boundary against field survey.",
    );
    await user.click(screen.getByRole("button", { name: "Submit review" }));
    await waitFor(() => expect(store.reviews()).toHaveLength(1));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await user.click(screen.getByRole("button", { name: /Review queue/ }));
    await user.click(screen.getByRole("button", { name: "Resolve review" }));
    await waitFor(() => expect(store.reviews()[0].status).toBe("Resolved"));
    expect(store.integrity()).toMatchObject({ valid: true, events: 3 });
  });
});
