import { describe, expect, it } from "vitest";
import {
  resolveRecipients,
  ruleMatches,
  type EvaluableRule,
  type OfferEventSubject,
} from "@/modules/notifications/rules";

const STATUS_ACCEPTED = "status-accepted";
const STATUS_SENT = "status-sent";
const CLIENT_A = "client-a";
const CLIENT_B = "client-b";
const PM_PERSON = "person-pm";
const COMMERCIAL_PERSON = "person-commercial";
const CREATOR_PERSON = "person-creator";

function buildOffer(overrides: Partial<OfferEventSubject> = {}): OfferEventSubject {
  return {
    id: "offer-1",
    number: "VI202603-00001",
    statusId: STATUS_SENT,
    statusName: "Enviado",
    clientId: CLIENT_A,
    clientName: "Cliente Sintético",
    description: "Oferta sintética",
    commercialPersonId: COMMERCIAL_PERSON,
    projectManagerPersonId: PM_PERSON,
    createdByUserId: "user-creator",
    createdByPersonId: CREATOR_PERSON,
    isArchived: false,
    ...overrides,
  };
}

function buildRule(overrides: Partial<EvaluableRule> = {}): EvaluableRule {
  return {
    id: "rule-1",
    name: "Regla sintética",
    isActive: true,
    trigger: "OFFER_STATUS_CHANGED",
    channel: "INTERNAL",
    conditions: [],
    actions: [{ kind: "PROJECT_MANAGER", personId: null }],
    ...overrides,
  };
}

describe("ruleMatches", () => {
  it("no coincide si la regla está inactiva", () => {
    const rule = buildRule({ isActive: false });
    expect(ruleMatches(rule, "OFFER_STATUS_CHANGED", buildOffer())).toBe(false);
  });

  it("no coincide si el disparador no es el mismo", () => {
    const rule = buildRule({ trigger: "OFFER_CREATED" });
    expect(ruleMatches(rule, "OFFER_STATUS_CHANGED", buildOffer())).toBe(false);
  });

  it("una regla sin condiciones coincide con cualquier oferta del disparador", () => {
    const rule = buildRule({ conditions: [] });
    expect(ruleMatches(rule, "OFFER_STATUS_CHANGED", buildOffer())).toBe(true);
  });

  it("bloque TODAS: deben cumplirse todas las condiciones", () => {
    const rule = buildRule({
      conditions: [
        { group: "ALL", field: "STATUS", operator: "IS", statusId: STATUS_ACCEPTED, personId: null, clientId: null, booleanValue: null },
        { group: "ALL", field: "CLIENT", operator: "IS", statusId: null, personId: null, clientId: CLIENT_A, booleanValue: null },
      ],
    });
    expect(ruleMatches(rule, "OFFER_STATUS_CHANGED", buildOffer({ statusId: STATUS_ACCEPTED, clientId: CLIENT_A }))).toBe(true);
    expect(ruleMatches(rule, "OFFER_STATUS_CHANGED", buildOffer({ statusId: STATUS_ACCEPTED, clientId: CLIENT_B }))).toBe(false);
  });

  it("bloque CUALQUIERA: basta con que se cumpla una condición", () => {
    const rule = buildRule({
      conditions: [
        { group: "ANY", field: "CLIENT", operator: "IS", statusId: null, personId: null, clientId: CLIENT_A, booleanValue: null },
        { group: "ANY", field: "CLIENT", operator: "IS", statusId: null, personId: null, clientId: CLIENT_B, booleanValue: null },
      ],
    });
    expect(ruleMatches(rule, "OFFER_STATUS_CHANGED", buildOffer({ clientId: CLIENT_A }))).toBe(true);
    expect(ruleMatches(rule, "OFFER_STATUS_CHANGED", buildOffer({ clientId: CLIENT_B }))).toBe(true);
    expect(ruleMatches(rule, "OFFER_STATUS_CHANGED", buildOffer({ clientId: "client-c" }))).toBe(false);
  });

  it("un bloque CUALQUIERA vacío no invalida la regla por sí solo", () => {
    const rule = buildRule({
      conditions: [
        { group: "ALL", field: "CLIENT", operator: "IS", statusId: null, personId: null, clientId: CLIENT_A, booleanValue: null },
      ],
    });
    expect(ruleMatches(rule, "OFFER_STATUS_CHANGED", buildOffer({ clientId: CLIENT_A }))).toBe(true);
  });

  it("el operador IS_NOT invierte la comparación", () => {
    const rule = buildRule({
      conditions: [
        { group: "ALL", field: "CLIENT", operator: "IS_NOT", statusId: null, personId: null, clientId: CLIENT_A, booleanValue: null },
      ],
    });
    expect(ruleMatches(rule, "OFFER_STATUS_CHANGED", buildOffer({ clientId: CLIENT_A }))).toBe(false);
    expect(ruleMatches(rule, "OFFER_STATUS_CHANGED", buildOffer({ clientId: CLIENT_B }))).toBe(true);
  });

  it("la condición ARCHIVED compara contra un booleano, no contra un identificador", () => {
    const rule = buildRule({
      conditions: [
        { group: "ALL", field: "ARCHIVED", operator: "IS", statusId: null, personId: null, clientId: null, booleanValue: true },
      ],
    });
    expect(ruleMatches(rule, "OFFER_STATUS_CHANGED", buildOffer({ isArchived: true }))).toBe(true);
    expect(ruleMatches(rule, "OFFER_STATUS_CHANGED", buildOffer({ isArchived: false }))).toBe(false);
  });
});

describe("resolveRecipients", () => {
  it("resuelve PM y comercial a sus personas asignadas", () => {
    const rule = buildRule({
      actions: [
        { kind: "PROJECT_MANAGER", personId: null },
        { kind: "COMMERCIAL", personId: null },
      ],
    });
    expect(resolveRecipients(rule, buildOffer())).toEqual([
      { kind: "PERSON", personId: PM_PERSON },
      { kind: "PERSON", personId: COMMERCIAL_PERSON },
    ]);
  });

  it("no duplica destinatarios cuando dos acciones apuntan a la misma persona", () => {
    // Por ejemplo, la misma persona es comercial y PM de la oferta.
    const rule = buildRule({
      actions: [
        { kind: "PROJECT_MANAGER", personId: null },
        { kind: "COMMERCIAL", personId: null },
      ],
    });
    const offer = buildOffer({ projectManagerPersonId: PM_PERSON, commercialPersonId: PM_PERSON });
    expect(resolveRecipients(rule, offer)).toEqual([{ kind: "PERSON", personId: PM_PERSON }]);
  });

  it("el creador no genera destinatario si la oferta no tiene creador conocido", () => {
    const rule = buildRule({ actions: [{ kind: "CREATOR", personId: null }] });
    const offer = buildOffer({ createdByPersonId: null });
    expect(resolveRecipients(rule, offer)).toEqual([]);
  });

  it("una persona concreta se resuelve por su identificador fijo en la acción", () => {
    const rule = buildRule({ actions: [{ kind: "SPECIFIC_PERSON", personId: "person-fija" }] });
    expect(resolveRecipients(rule, buildOffer())).toEqual([
      { kind: "PERSON", personId: "person-fija" },
    ]);
  });

  it("todos los administradores se resuelven como un destinatario especial, no por persona", () => {
    const rule = buildRule({ actions: [{ kind: "ALL_ADMINS", personId: null }] });
    expect(resolveRecipients(rule, buildOffer())).toEqual([{ kind: "ALL_ADMINS" }]);
  });
});
