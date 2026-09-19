import { EmptyState } from "@/components/ui/empty-state";

/**
 * Pantalla "Todas las ofertas" del Gestor de Ofertas.
 *
 * Esta entrega (DEV-002) no incluye todavía el modelo `Offer` ni el alta de
 * ofertas (ver docs/architecture/DATA_MODEL.md): el estado vacío es honesto,
 * no simula datos ni contadores.
 */
export function OffersScreen() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">
            Gestor de Ofertas
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Todas las ofertas
          </p>
        </div>

        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Disponible en una próxima entrega"
          className="inline-flex cursor-not-allowed items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-muted)]"
        >
          Nueva oferta
          <span className="rounded bg-[var(--color-surface)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            Próxima entrega
          </span>
        </button>
      </div>

      <EmptyState
        title="Todavía no existen ofertas"
        description={
          <>
            <p>
              Esta primera entrega deja preparada la base técnica, la
              navegación y los maestros de referencia del Gestor de Ofertas,
              pero no incluye todavía el modelo de datos de la oferta ni la
              posibilidad de crearlas o consultarlas.
            </p>
            <p className="mt-2">
              La siguiente entrega incorporará la gestión de clientes y
              personas, y después el alta y el listado de ofertas.
            </p>
          </>
        }
      />
    </div>
  );
}
