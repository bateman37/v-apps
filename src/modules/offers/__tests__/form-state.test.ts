import { describe, expect, it } from "vitest";
import { readOfferFormValues, profileDaysFieldName } from "@/modules/offers/validation";

const PROFILE_A = "profile-analista";
const PROFILE_B = "profile-backend";

/**
 * Regresión del bloque 1: tras un error del servidor (validación, conflicto
 * o base de datos), el formulario debe recuperar y volver a mostrar
 * exactamente todos los valores que el usuario había enviado, incluidos
 * todos los desplegables, fechas, decimales, motivo de cancelación, estado y
 * jornadas por perfil. Esta prueba reproduce el `FormData` real de un envío
 * completo y comprueba que ningún campo se pierde al leerlo de nuevo.
 */
describe("readOfferFormValues — conservación de valores tras un error (bloque 1)", () => {
  function buildFullFormData(): FormData {
    const formData = new FormData();
    formData.set("clientId", "client-1");
    formData.set("implantationText", "Implantación sintética");
    formData.set("priorityId", "priority-1");
    formData.set("originId", "origin-1");
    formData.set("commercialId", "person-1");
    formData.set("projectManagerId", "person-2");
    formData.set("offerDate", "2026-03-15");
    formData.set("description", "Descripción sintética completa");
    formData.set("offerTypeId", "offer-type-1");
    formData.set("segmentationId", "segmentation-1");
    formData.set("requesterName", "Solicitante sintético");
    formData.set("languageId", "language-1");
    formData.set("notes", "Observaciones sintéticas");
    formData.set("estimatedCommercialDeliveryDate", "2026-04-01");
    formData.set("estimatedClientDeliveryDate", "2026-04-15");
    formData.set("estimatedPortfolioDate", "2026-05-01");
    formData.set("commercialDays", "1,25");
    formData.set("totalAmount", "12345,67");
    formData.set("statusId", "status-sent");
    formData.set("cancellationReasonId", "reason-1");
    formData.set("navisionOrder", "NAV-0001");
    formData.set(profileDaysFieldName(PROFILE_A), "2,5");
    formData.set(profileDaysFieldName(PROFILE_B), "3");
    return formData;
  }

  it("recupera todos los campos de texto, fechas, decimales y selects", () => {
    const values = readOfferFormValues(buildFullFormData(), [PROFILE_A, PROFILE_B]);

    expect(values).toMatchObject({
      clientId: "client-1",
      implantationText: "Implantación sintética",
      priorityId: "priority-1",
      originId: "origin-1",
      commercialId: "person-1",
      projectManagerId: "person-2",
      offerDate: "2026-03-15",
      description: "Descripción sintética completa",
      offerTypeId: "offer-type-1",
      segmentationId: "segmentation-1",
      requesterName: "Solicitante sintético",
      languageId: "language-1",
      notes: "Observaciones sintéticas",
      estimatedCommercialDeliveryDate: "2026-04-01",
      estimatedClientDeliveryDate: "2026-04-15",
      estimatedPortfolioDate: "2026-05-01",
      commercialDays: "1,25",
      totalAmount: "12345,67",
      statusId: "status-sent",
      cancellationReasonId: "reason-1",
      navisionOrder: "NAV-0001",
    });
  });

  it("recupera las jornadas de todos los perfiles enviados, no solo el primero", () => {
    const values = readOfferFormValues(buildFullFormData(), [PROFILE_A, PROFILE_B]);

    expect(values.profileDays).toEqual({
      [PROFILE_A]: "2,5",
      [PROFILE_B]: "3",
    });
  });

  it("un perfil sin jornada enviada se recupera como cadena vacía, no se omite", () => {
    const formData = buildFullFormData();
    formData.delete(profileDaysFieldName(PROFILE_B));

    const values = readOfferFormValues(formData, [PROFILE_A, PROFILE_B]);

    expect(values.profileDays).toEqual({
      [PROFILE_A]: "2,5",
      [PROFILE_B]: "",
    });
  });

  it("un segundo envío con valores corregidos también se recupera por completo", () => {
    // Simula el "segundo intento" tras el primer error: cambia el estado y
    // conserva el resto exactamente como estaba.
    const formData = buildFullFormData();
    formData.set("statusId", "status-accepted");

    const values = readOfferFormValues(formData, [PROFILE_A, PROFILE_B]);

    expect(values.statusId).toBe("status-accepted");
    expect(values.clientId).toBe("client-1");
    expect(values.profileDays).toEqual({ [PROFILE_A]: "2,5", [PROFILE_B]: "3" });
  });
});
