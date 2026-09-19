import { describe, expect, it } from "vitest";
import { requiredExactText } from "@/lib/validation";

describe("requiredExactText (código de cliente y similares)", () => {
  const schema = requiredExactText("El código", 20);

  it("es obligatorio", () => {
    const result = schema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("recorta solo los espacios exteriores", () => {
    const result = schema.safeParse("  CLI 01  ");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("CLI 01");
    }
  });

  it("conserva exactamente la capitalización escrita por el usuario", () => {
    const result = schema.safeParse("cliente-Mixto");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("cliente-Mixto");
    }
  });

  it("rechaza un valor que supera la longitud máxima", () => {
    const result = schema.safeParse("0".repeat(21));
    expect(result.success).toBe(false);
  });
});
