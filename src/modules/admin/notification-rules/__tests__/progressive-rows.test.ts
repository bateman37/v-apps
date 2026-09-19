import { describe, expect, it } from "vitest";
import { nextProgressiveRowValues } from "@/modules/admin/notification-rules/notification-rules-screen";

/**
 * Regresión del hotfix DEV-005 (bloque 8): comportamiento esencial del
 * helper puro de filas progresivas de los constructores de reglas de
 * notificación (condiciones y destinatarios).
 */
describe("nextProgressiveRowValues", () => {
  it("completar la única fila vacía añade una nueva fila vacía", () => {
    expect(nextProgressiveRowValues(["STATUS"], 4)).toEqual(["STATUS", ""]);
  });

  it("vaciar la única fila deja una única fila vacía", () => {
    expect(nextProgressiveRowValues([""], 4)).toEqual([""]);
  });

  it("vaciar una fila intermedia compacta las siguientes sin perder valores", () => {
    expect(nextProgressiveRowValues(["STATUS", "", "CLIENT", ""], 4)).toEqual([
      "STATUS",
      "CLIENT",
      "",
    ]);
  });

  it("al alcanzar el máximo no añade una fila vacía adicional", () => {
    expect(
      nextProgressiveRowValues(["STATUS", "CLIENT", "CREATOR", "COMMERCIAL"], 4),
    ).toEqual(["STATUS", "CLIENT", "CREATOR", "COMMERCIAL"]);
  });

  it("nunca supera el máximo aunque lleguen más valores de los esperados", () => {
    expect(
      nextProgressiveRowValues(["A", "B", "C", "D", "E"], 4),
    ).toEqual(["A", "B", "C", "D"]);
  });
});
