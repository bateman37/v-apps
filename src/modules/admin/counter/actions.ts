"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { toSafeErrorMessage } from "@/lib/db/errors";
import { readString } from "@/lib/validation";
import { recordAudit } from "@/modules/audit/audit";
import {
  adminError,
  adminSuccess,
  type AdminActionState,
} from "@/modules/admin/action-state";
import { requireAdmin } from "@/modules/auth/session";
import { OFFER_NUMBER_COUNTER_KEY } from "@/modules/offers/numbering";

/**
 * Administración protegida del contador (bloque 11, DEC-012).
 *
 * El contador nunca puede bajar ni reiniciarse: cada operación exige el
 * valor anterior visto por el administrador y falla si alguien lo cambió
 * entretanto, en lugar de sobrescribir en silencio.
 */

function parseNonNegativeInt(value: string): number | null {
  if (!/^\d{1,9}$/.test(value)) {
    return null;
  }
  return Number.parseInt(value, 10);
}

export async function initializeCounterAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const value = parseNonNegativeInt(readString(formData, "value"));

  if (value === null) {
    return adminError({ value: "Indica un número entero de 0 o superior." });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.systemCounter.findUnique({
        where: { key: OFFER_NUMBER_COUNTER_KEY },
      });
      if (existing) {
        return { alreadyExists: true as const };
      }

      await tx.systemCounter.create({
        data: { key: OFFER_NUMBER_COUNTER_KEY, value },
      });
      await recordAudit(tx, {
        entityType: "SystemCounter",
        entityId: OFFER_NUMBER_COUNTER_KEY,
        action: "COUNTER_INITIALIZED",
        actorId: admin.id,
        changes: { valor: { antes: null, despues: value } },
      });
      return { alreadyExists: false as const };
    });

    if (result.alreadyExists) {
      return adminError({ _form: "El contador ya existe. Usa el ajuste, no la inicialización." });
    }

    revalidatePath("/admin/counter");
    return adminSuccess(`Contador inicializado en ${value}.`);
  } catch (error) {
    return adminError({ _form: toSafeErrorMessage(error) });
  }
}

export async function increaseCounterAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const expectedCurrent = parseNonNegativeInt(readString(formData, "expectedCurrent"));
  const newValue = parseNonNegativeInt(readString(formData, "newValue"));

  if (expectedCurrent === null || newValue === null) {
    return adminError({ _form: "Datos no válidos." });
  }
  if (newValue <= expectedCurrent) {
    return adminError({
      newValue: "El nuevo valor debe ser mayor que el valor actual. El contador nunca puede reducirse.",
    });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.systemCounter.findUnique({
        where: { key: OFFER_NUMBER_COUNTER_KEY },
      });
      if (!current) {
        return { missing: true as const };
      }
      if (current.value !== expectedCurrent) {
        return { conflict: true as const, actual: current.value };
      }

      await tx.systemCounter.update({
        where: { key: OFFER_NUMBER_COUNTER_KEY },
        data: { value: newValue },
      });
      await recordAudit(tx, {
        entityType: "SystemCounter",
        entityId: OFFER_NUMBER_COUNTER_KEY,
        action: "COUNTER_ADJUSTED",
        actorId: admin.id,
        changes: { valor: { antes: current.value, despues: newValue } },
      });
      return { done: true as const };
    });

    if ("missing" in result) {
      return adminError({ _form: "El contador todavía no existe: inicialízalo primero." });
    }
    if ("conflict" in result) {
      return adminError({
        _form: `El valor actual ya no es ${expectedCurrent} (ahora es ${result.actual}). Recarga la página para ver el valor real antes de ajustarlo.`,
      });
    }

    revalidatePath("/admin/counter");
    return adminSuccess(`Contador actualizado a ${newValue}.`);
  } catch (error) {
    return adminError({ _form: toSafeErrorMessage(error) });
  }
}
