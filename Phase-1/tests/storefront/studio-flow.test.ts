import { describe, expect, it } from "vitest";
import {
  STUDIO_ENTRY,
  STUDIO_FLOW,
  STUDIO_TABS,
  STUDIO_VIEWS,
  STUDIO_WHY,
  flowFromView,
  hrefForFlowStep,
  isStudioView,
  studioRoom,
  studioSurface,
  studioView
} from "../../apps/storefront/src/lib/studioFlow";

describe("studio MVP paths", () => {
  it("opens the room as the hang step, with an optional item", () => {
    expect(studioRoom()).toBe("/studio?view=room");
    expect(studioRoom("w-kurta-1")).toBe("/studio?view=room&item=w-kurta-1");
  });

  it("maps evaluator tabs onto the why surface", () => {
    expect(studioRoom("w-kurta-1", "keep")).toBe("/studio?view=room&step=keep&item=w-kurta-1");
    expect(flowFromView("room", "keep")).toBe("keep");
    expect(studioRoom(null, "hang")).toBe("/studio?view=room&step=hang");
    expect(flowFromView("room", "hang")).toBe("hang");
    expect(flowFromView("bet")).toBe("bet");
    expect(flowFromView("focus")).toBe("bet");
    expect(flowFromView("why")).toBe("bet");
    expect(isStudioView("listen")).toBe(true);
    expect(isStudioView("why")).toBe(true);
    expect(isStudioView("decide")).toBe(false);
    expect(studioSurface("listen")).toBe("why");
    expect(studioSurface("room")).toBe("room");
    expect(studioView("bet")).toBe("/studio?view=bet");
    expect(studioView("why")).toBe(STUDIO_WHY);
  });

  it("gives every flow chip a distinct destination", () => {
    const hrefs = STUDIO_FLOW.map((step) => hrefForFlowStep(step.id));
    expect(new Set(hrefs).size).toBe(STUDIO_FLOW.length);
    expect(hrefForFlowStep("save")).toBe("/wishlist");
    expect(hrefForFlowStep("hang")).toBe("/studio?view=room&step=hang");
    expect(hrefForFlowStep("keep")).not.toBe(hrefForFlowStep("hang"));
    expect(hrefForFlowStep("bet")).toBe(STUDIO_WHY);
    expect(studioView("room")).toBe(STUDIO_ENTRY);
    expect(STUDIO_FLOW.map((step) => step.id)).toEqual(["save", "hang", "keep", "bet"]);
    expect(STUDIO_VIEWS[0]?.id).toBe("room");
    expect(STUDIO_TABS.map((tab) => tab.id)).toEqual(["room", "why"]);
  });

  it("keeps occasion on hang and keep links", () => {
    expect(hrefForFlowStep("hang", null, { occ: "wedding" })).toBe(
      "/studio?view=room&step=hang&occ=wedding"
    );
    expect(hrefForFlowStep("keep", "w-kurta-1", { occ: "wedding", pile: "women::kurta-set" })).toContain(
      "occ=wedding"
    );
  });
});
