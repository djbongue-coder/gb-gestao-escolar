import { describe, expect, it } from "vitest";
import { periodLabels } from "./atasDb";

describe("atas module", () => {
  it("has Portuguese labels for all period values", () => {
    expect(periodLabels["1trimestre"]).toBe("1.º Trimestre");
    expect(periodLabels["2trimestre"]).toBe("2.º Trimestre");
    expect(periodLabels["3trimestre"]).toBe("3.º Trimestre");
    expect(periodLabels.epoca).toBe("Época Especial");
    expect(periodLabels.final).toBe("Avaliação Final");
  });
});
