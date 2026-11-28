import { describe, expect, it } from "vitest";
import {
  applicationRoutes,
  routePreparationProgress,
  setRouteStep,
} from "@/lib/studio/application-routes";
import { emptyState, parseStoredData } from "@/lib/storage/state";
import { blankProfile } from "@/types/domain";

describe("application route preparation", () => {
  const [ucas, uc] = applicationRoutes;

  it("starts each route with an independent, empty checklist for existing workspaces", () => {
    const state = { ...emptyState(), preparation: { "improve:writing": true } };
    const saved = setRouteStep(state, ucas, "account", true);
    const reloaded = parseStoredData(JSON.stringify(saved)).state;
    expect(routePreparationProgress(ucas, reloaded)).toEqual({
      done: 1,
      total: 6,
      percent: 17,
    });
    expect(routePreparationProgress(uc, reloaded).done).toBe(0);
    expect(reloaded.preparation?.["improve:writing"]).toBe(true);
    expect(setRouteStep(reloaded, ucas, "foreign-step", true)).toBe(reloaded);
  });

  it("keeps each entry year's marks when changing intake, and supports undo", () => {
    let state = setRouteStep(emptyState(), uc, "account", true);
    state = { ...state, profile: { ...blankProfile, entryYear: 2028 } };
    expect(routePreparationProgress(uc, state).percent).toBe(0);
    for (const step of uc.steps) state = setRouteStep(state, uc, step.id, true);
    expect(routePreparationProgress(uc, state).percent).toBe(100);
    state = setRouteStep(state, uc, "account", false);
    expect(routePreparationProgress(uc, state).done).toBe(5);
    expect(routePreparationProgress(uc, { ...state, profile: null }).done).toBe(
      1,
    );
  });
});
