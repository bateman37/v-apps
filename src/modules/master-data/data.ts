import { prisma } from "@/lib/db/prisma";

export type MasterDataRecord = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
};

export type MasterDataGroup = {
  key: string;
  label: string;
  records: MasterDataRecord[];
};

const GROUP_LABELS = {
  priorities: "Prioridades",
  origins: "Orígenes",
  offerTypes: "Tipos de oferta",
  offerStatuses: "Estados de oferta",
  segmentations: "Segmentaciones",
  professionalProfiles: "Perfiles profesionales",
  languages: "Idiomas",
  cancellationReasons: "Motivos de cancelación",
} as const;

const SELECT = {
  id: true,
  code: true,
  name: true,
  isActive: true,
  sortOrder: true,
} as const;

const ORDER_BY = { sortOrder: "asc" } as const;

/**
 * Lee, únicamente para consulta, los maestros de referencia del Gestor de
 * Ofertas ya disponibles en esta entrega. No incluye clientes, personas ni
 * ninguna entidad transaccional (ver docs/architecture/DATA_MODEL.md).
 *
 * Puede lanzar si PostgreSQL no está disponible; la pantalla que la invoca
 * es responsable de mostrar un mensaje de error en español sin detalles
 * técnicos sensibles.
 */
export async function getMasterDataGroups(): Promise<MasterDataGroup[]> {
  const [
    priorities,
    origins,
    offerTypes,
    offerStatuses,
    segmentations,
    professionalProfiles,
    languages,
    cancellationReasons,
  ] = await Promise.all([
    prisma.priority.findMany({ select: SELECT, orderBy: ORDER_BY }),
    prisma.origin.findMany({ select: SELECT, orderBy: ORDER_BY }),
    prisma.offerType.findMany({ select: SELECT, orderBy: ORDER_BY }),
    prisma.offerStatus.findMany({ select: SELECT, orderBy: ORDER_BY }),
    prisma.segmentation.findMany({ select: SELECT, orderBy: ORDER_BY }),
    prisma.professionalProfile.findMany({
      select: SELECT,
      orderBy: ORDER_BY,
    }),
    prisma.language.findMany({ select: SELECT, orderBy: ORDER_BY }),
    prisma.cancellationReason.findMany({
      select: SELECT,
      orderBy: ORDER_BY,
    }),
  ]);

  return [
    { key: "priorities", label: GROUP_LABELS.priorities, records: priorities },
    { key: "origins", label: GROUP_LABELS.origins, records: origins },
    {
      key: "offerTypes",
      label: GROUP_LABELS.offerTypes,
      records: offerTypes,
    },
    {
      key: "offerStatuses",
      label: GROUP_LABELS.offerStatuses,
      records: offerStatuses,
    },
    {
      key: "segmentations",
      label: GROUP_LABELS.segmentations,
      records: segmentations,
    },
    {
      key: "professionalProfiles",
      label: GROUP_LABELS.professionalProfiles,
      records: professionalProfiles,
    },
    { key: "languages", label: GROUP_LABELS.languages, records: languages },
    {
      key: "cancellationReasons",
      label: GROUP_LABELS.cancellationReasons,
      records: cancellationReasons,
    },
  ];
}
