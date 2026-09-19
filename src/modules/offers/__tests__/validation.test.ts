import { describe, expect, it } from "vitest";
import {
  emptyOfferFormValues,
  profileDaysFieldName,
  totalProfileDays,
  validateOfferInput,
  type OfferFormValues,
  type OfferValidationContext,
} from "@/modules/offers/validation";

const PROFILE_A = "profile-analista";
const PROFILE_B = "profile-backend";
const STATUS_SENT = "status-sent";
const STATUS_CANCELLED = "status-cancelled";
const STATUS_ACCEPTED = "status-accepted";

const CONTEXT: OfferValidationContext = {
  cancelledStatusIds: [STATUS_CANCELLED],
  acceptedStatusIds: [STATUS_ACCEPTED],
  professionalProfileIds: [PROFILE_A, PROFILE_B],
  hasSelectableCancellationReasons: true,
};

/** Oferta mínima válida, con datos inequívocamente sintéticos. */
function validValues(overrides: Partial<OfferFormValues> = {}): OfferFormValues {
  return {
    ...emptyOfferFormValues(),
    clientId: "client-1",
    priorityId: "priority-1",
    commercialId: "person-1",
    projectManagerId: "person-2",
    originId: "origin-1",
    offerTypeId: "offer-type-1",
    statusId: STATUS_SENT,
    offerDate: "2026-09-19",
    description: "Oferta de prueba sintética",
    requesterName: "Solicitante de prueba",
    totalAmount: "1000,00",
    profileDays: {},
    ...overrides,
  };
}

describe("validateOfferInput — campos obligatorios", () => {
  it("acepta una oferta con todos los campos obligatorios", () => {
    const result = validateOfferInput(validValues(), CONTEXT);
    expect(result.ok).toBe(true);
  });

  it("señala cada campo obligatorio que falta, sin detenerse en el primero", () => {
    const result = validateOfferInput(emptyOfferFormValues(), CONTEXT);
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(Object.keys(result.errors).sort()).toEqual(
      [
        "clientId",
        "commercialId",
        "description",
        "offerDate",
        "offerTypeId",
        "originId",
        "priorityId",
        "projectManagerId",
        "requesterName",
        "statusId",
        "totalAmount",
      ].sort(),
    );
  });
});

describe("validateOfferInput — importe total (DEC-020)", () => {
  it("acepta 0 como importe explícito", () => {
    const result = validateOfferInput(validValues({ totalAmount: "0" }), CONTEXT);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.totalAmount).toBe("0.00");
    }
  });

  it("acepta 0,00 escrito con coma decimal", () => {
    const result = validateOfferInput(validValues({ totalAmount: "0,00" }), CONTEXT);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.totalAmount).toBe("0.00");
    }
  });

  it("rechaza el importe vacío", () => {
    const result = validateOfferInput(validValues({ totalAmount: "" }), CONTEXT);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.totalAmount).toMatch(/obligatorio/i);
    }
  });

  it("rechaza un importe negativo", () => {
    const result = validateOfferInput(validValues({ totalAmount: "-1,00" }), CONTEXT);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.totalAmount).toMatch(/negativo/i);
    }
  });

  it("normaliza el separador de millares español", () => {
    const result = validateOfferInput(
      validValues({ totalAmount: "12.345,67" }),
      CONTEXT,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.totalAmount).toBe("12345.67");
    }
  });
});

describe("validateOfferInput — jornadas", () => {
  it("rechaza jornadas negativas por perfil y jornadas comerciales negativas", () => {
    const result = validateOfferInput(
      validValues({
        commercialDays: "-2",
        profileDays: { [PROFILE_A]: "-1" },
      }),
      CONTEXT,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.commercialDays).toMatch(/negativ/i);
      expect(result.errors[profileDaysFieldName(PROFILE_A)]).toMatch(/negativ/i);
    }
  });

  it("no crea registros para jornadas vacías ni a cero", () => {
    const result = validateOfferInput(
      validValues({ profileDays: { [PROFILE_A]: "", [PROFILE_B]: "0" } }),
      CONTEXT,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.profileDays).toEqual([]);
    }
  });

  it("conserva solo los perfiles con jornadas mayores que cero", () => {
    const result = validateOfferInput(
      validValues({ profileDays: { [PROFILE_A]: "2,5", [PROFILE_B]: "0" } }),
      CONTEXT,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.profileDays).toEqual([
        { professionalProfileId: PROFILE_A, days: "2.50" },
      ]);
    }
  });

  it("mantiene las jornadas comerciales separadas del detalle por perfil", () => {
    const result = validateOfferInput(
      validValues({ commercialDays: "3", profileDays: { [PROFILE_A]: "2" } }),
      CONTEXT,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.commercialDays).toBe("3.00");
      expect(totalProfileDays(result.data.profileDays)).toBe("2.00");
    }
  });
});

describe("validateOfferInput — motivo de cancelación", () => {
  it("exige el motivo cuando el estado es CANCELLED", () => {
    const result = validateOfferInput(
      validValues({ statusId: STATUS_CANCELLED }),
      CONTEXT,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.cancellationReasonId).toMatch(/obligatorio/i);
    }
  });

  it("acepta el motivo informado cuando el estado es CANCELLED", () => {
    const result = validateOfferInput(
      validValues({ statusId: STATUS_CANCELLED, cancellationReasonId: "reason-1" }),
      CONTEXT,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.cancellationReasonId).toBe("reason-1");
    }
  });

  it("avisa, sin inventar un motivo, cuando no hay motivos disponibles", () => {
    const result = validateOfferInput(validValues({ statusId: STATUS_CANCELLED }), {
      ...CONTEXT,
      hasSelectableCancellationReasons: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.cancellationReasonId).toMatch(/Administración/);
    }
  });

  it("descarta un motivo antiguo cuando el estado ya no es CANCELLED", () => {
    const result = validateOfferInput(
      validValues({ statusId: STATUS_SENT, cancellationReasonId: "reason-1" }),
      CONTEXT,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.cancellationReasonId).toBeNull();
    }
  });
});

describe("totalProfileDays", () => {
  it("suma el detalle con decimal exacto y sin error de coma flotante", () => {
    expect(
      totalProfileDays([{ days: "0.10" }, { days: "0.20" }, { days: "0.30" }]),
    ).toBe("0.60");
  });

  it("devuelve cero cuando no hay detalle", () => {
    expect(totalProfileDays([])).toBe("0.00");
  });

  it("suma valores grandes sin perder precisión", () => {
    expect(totalProfileDays([{ days: "1234.56" }, { days: "8765.44" }])).toBe(
      "10000.00",
    );
  });
});
