import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <EmptyState
      title="No se ha encontrado la página"
      description={
        <p>
          El identificador solicitado no existe o el registro ya no está
          disponible. Es posible que se haya introducido mal la dirección.
        </p>
      }
    >
      <Link className="v-btn v-btn-primary" href="/offers">
        Ir al listado de ofertas
      </Link>
    </EmptyState>
  );
}
