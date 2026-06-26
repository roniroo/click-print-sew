import { describe, it, expect } from "vitest";
import {
  generateRecoveryCode,
  hashRecoveryCode,
  verifyRecoveryCode,
} from "./recovery";

describe("recovery codes", () => {
  it("generates a formatted, unambiguous 16-character code", () => {
    const code = generateRecoveryCode();
    expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(generateRecoveryCode()).not.toBe(generateRecoveryCode());
  });

  it("hashes and verifies, ignoring dashes and case", async () => {
    const code = generateRecoveryCode();
    const hash = await hashRecoveryCode(code);
    expect(await verifyRecoveryCode(code, hash)).toBe(true);
    expect(await verifyRecoveryCode(code.toLowerCase().replace(/-/g, ""), hash)).toBe(true);
    expect(await verifyRecoveryCode("WRON-GCOD-EXXX-XYYY", hash)).toBe(false);
  });
});
