import { describe, expect, it } from "vitest";
import { parseJsonResponse } from "../../../tools/discovery-pipeline/src/llm.ts";

describe("llm utils", () => {
  it("parses JSON wrapped in prose", () => {
    const payload = parseJsonResponse<{ themes: Array<{ id: string }> }>(
      'Here is the result:\n{"themes":[{"id":"fit-size-anxiety"}]}'
    );
    expect(payload.themes[0].id).toBe("fit-size-anxiety");
  });
});
