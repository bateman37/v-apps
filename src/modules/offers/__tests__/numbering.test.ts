import { describe, expect, it } from "vitest";
import { formatOfferNumber } from "@/modules/offers/numbering";

/**
 * Formato de la numeración global (DEC-010). Se comprueba especialmente el
 * crecimiento más allá de cinco dígitos, porque el contador nunca se reinicia
 * y acabará superándolos.
 */
describe("formatOfferNumber", () => {
  it("usa el año y el mes del momento de creación, con contador de cinco dígitos", () => {
    const createdAt = new Date(2026, 8, 19, 10, 30); // septiembre de 2026
    expect(formatOfferNumber(createdAt, 1)).toBe("VI202609-00001");
  });

  it("rellena con ceros hasta cinco dígitos", () => {
    const createdAt = new Date(2026, 0, 5);
    expect(formatOfferNumber(createdAt, 1019)).toBe("VI202601-01019");
    expect(formatOfferNumber(createdAt, 99999)).toBe("VI202601-99999");
  });

  it("crece a seis dígitos o más sin truncar el contador", () => {
    const createdAt = new Date(2031, 11, 31);
    expect(formatOfferNumber(createdAt, 100000)).toBe("VI203112-100000");
    expect(formatOfferNumber(createdAt, 1234567)).toBe("VI203112-1234567");
  });

  it("no reinicia el contador al cambiar de mes o de año", () => {
    const december = formatOfferNumber(new Date(2026, 11, 31), 40);
    const january = formatOfferNumber(new Date(2027, 0, 1), 41);
    expect(december).toBe("VI202612-00040");
    expect(january).toBe("VI202701-00041");
  });
});
