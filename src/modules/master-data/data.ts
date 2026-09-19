import { prisma } from "@/lib/db/prisma";
import { CATALOG_KEYS, type CatalogKey } from "@/modules/master-data/catalogs";

export type MasterDataRecord = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
};

export type MasterDataGroup = {
  key: CatalogKey;
  records: MasterDataRecord[];
};

const SELECT = {
  id: true,
  code: true,
  name: true,
  isActive: true,
  sortOrder: true,
} as const;

const ORDER_BY = [{ sortOrder: "asc" as const }, { name: "asc" as const }];

/**
 * Lee los siete catálogos del Gestor de Ofertas, activos e inactivos: en
 * Administración un registro desactivado sigue siendo visible y editable.
 *
 * Puede lanzar si PostgreSQL no está disponible; la pantalla que la invoca es
 * responsable de mostrar un mensaje en español sin detalles técnicos.
 */
export async function getMasterDataGroups(): Promise<MasterDataGroup[]> {
  const [
    priorities,
    origins,
    offerTypes,
    offerStatuses,
    segmentations,
    professionalProfiles,
    cancellationReasons,
  ] = await Promise.all([
    prisma.priority.findMany({ select: SELECT, orderBy: ORDER_BY }),
    prisma.origin.findMany({ select: SELECT, orderBy: ORDER_BY }),
    prisma.offerType.findMany({ select: SELECT, orderBy: ORDER_BY }),
    prisma.offerStatus.findMany({ select: SELECT, orderBy: ORDER_BY }),
    prisma.segmentation.findMany({ select: SELECT, orderBy: ORDER_BY }),
    prisma.professionalProfile.findMany({ select: SELECT, orderBy: ORDER_BY }),
    prisma.cancellationReason.findMany({ select: SELECT, orderBy: ORDER_BY }),
  ]);

  const byKey: Record<CatalogKey, MasterDataRecord[]> = {
    priorities,
    origins,
    offerTypes,
    offerStatuses,
    segmentations,
    professionalProfiles,
    cancellationReasons,
  };

  return CATALOG_KEYS.map((key) => ({ key, records: byKey[key] }));
}
