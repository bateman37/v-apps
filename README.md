# v-apps — Vincle Apps

Vincle Apps es una plataforma web interna, todavía en fase inicial, que sustituirá progresivamente varias aplicaciones y ficheros Excel corporativos, compartiendo navegación, autenticación, datos maestros, seguridad, auditoría e integraciones.

## Estado actual

Esta entrega añade la **primera base técnica ejecutable**: un proyecto Next.js/React/TypeScript con PostgreSQL conectado mediante Prisma, un layout corporativo con menú lateral, la pantalla inicial del Gestor de Ofertas (con un estado vacío honesto) y una pantalla de consulta de los maestros de referencia. Ni el alta de ofertas ni el CRUD de clientes o personas forman parte todavía de esta entrega.

> ⚠️ **Aplicación únicamente apta para desarrollo local.** Todavía no implementa autenticación ni autorización (decisión temporal aprobada, ver [`docs/decisions/DECISIONS.md`](docs/decisions/DECISIONS.md)). No la expongas en una red accesible ni la uses con datos reales de clientes o empleados.

Para el detalle del estado y del próximo objetivo, ver [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md).

## Cómo navegar la documentación

El punto de entrada a toda la documentación es [`docs/INDEX.md`](docs/INDEX.md), que enlaza y ordena:

- La visión, el alcance y el roadmap del producto (`docs/product/`).
- La arquitectura propuesta, el modelo de datos conceptual y las reglas de seguridad (`docs/architecture/`).
- Los maestros compartidos por toda la plataforma (`docs/shared/`).
- La especificación funcional del primer módulo, el Gestor de Ofertas (`docs/offers/`).
- El registro de decisiones aprobadas y pendientes (`docs/decisions/DECISIONS.md`).

## Cómo se trabaja en este repositorio

Este proyecto se desarrolla mediante encargos entregados a Claude Code, conservados como prompts en [`prompts/`](prompts/README.md). Las reglas completas de colaboración —roles, ramas, Pull Requests, alcance, calidad e idioma— están fijadas en [`AGENTS.md`](AGENTS.md), con instrucciones específicas para Claude Code en [`CLAUDE.md`](CLAUDE.md).

En resumen:

- Cada entrega parte de `main` actualizado, se desarrolla en una rama propia y termina en una Pull Request abierta.
- El usuario (Product Owner) revisa, prueba manualmente y fusiona cada Pull Request; Claude Code nunca fusiona.
- Cada entrega se limita estrictamente a su alcance declarado.

## Guía de arranque local

Pensada para poder seguirse sin conocimientos técnicos previos.

### 1. Requisitos previos

- [Node.js](https://nodejs.org/) 22 (versión indicada en [`.nvmrc`](.nvmrc); si usas [nvm](https://github.com/nvm-sh/nvm), ejecuta `nvm use` en la carpeta del proyecto).
- [PostgreSQL](https://www.postgresql.org/) instalado y en marcha en tu máquina.
- Git.

### 2. Clonar o actualizar el repositorio

```bash
git clone https://github.com/bateman37/v-apps.git
cd v-apps
```

Si ya lo tenías clonado, simplemente actualiza tu copia con `git pull` en la rama correspondiente.

### 3. Instalar las dependencias

```bash
npm install
```

Este comando descarga, en la carpeta `node_modules`, exactamente las mismas versiones de librerías con las que se ha probado esta entrega (fijadas en `package-lock.json`).

### 4. Crear una base de datos PostgreSQL local para `v-apps`

Crea una base de datos separada, que no compartas con ningún otro proyecto. Por ejemplo, desde una consola con acceso a `psql`:

```sql
CREATE ROLE vapps LOGIN PASSWORD 'una_contrasena_local_a_tu_eleccion';
CREATE DATABASE vapps_dev OWNER vapps;
```

Usa una contraseña propia de tu máquina de desarrollo; no reutilices contraseñas reales ni las publiques en ningún sitio.

### 5. Configurar las variables de entorno

Copia el archivo de ejemplo:

```bash
cp .env.example .env
```

Abre `.env` y sustituye el valor de `DATABASE_URL` por la conexión a tu base de datos local, por ejemplo:

```
DATABASE_URL="postgresql://vapps:una_contrasena_local_a_tu_eleccion@localhost:5432/vapps_dev"
```

El archivo `.env` nunca se sube al repositorio (está en `.gitignore`): solo existe en tu máquina.

### 6. Generar el cliente Prisma

```bash
npm run db:generate
```

Genera, a partir de `prisma/schema.prisma`, el código que la aplicación usa para hablar con PostgreSQL.

### 7. Ejecutar la migración

```bash
npm run db:migrate
```

Crea, en tu base de datos local, las tablas de los maestros de referencia descritos en `prisma/schema.prisma`.

### 8. Cargar los maestros

```bash
npm run db:seed
```

Inserta (o actualiza si ya existían) los valores maestros aprobados: prioridades, orígenes, tipos de oferta, estados de oferta, segmentaciones y perfiles profesionales. Los idiomas y los motivos de cancelación se dejan intencionadamente vacíos, porque todavía no hay valores aprobados.

### 9. Arrancar la aplicación

```bash
npm run dev
```

### 10. Abrir la aplicación

Visita [http://localhost:3000](http://localhost:3000) en tu navegador. La raíz te llevará automáticamente a `/offers`.

### 11. Detener la aplicación

Vuelve a la terminal donde ejecutaste `npm run dev` y pulsa `Ctrl+C`.

### 12. Repetir el seed y comprobar que no duplica registros

Vuelve a ejecutar:

```bash
npm run db:seed
```

Los mensajes mostrarán el mismo número de registros verificados que la primera vez (por ejemplo, 3 prioridades, 14 perfiles profesionales, etc.). Ejecutarlo varias veces nunca duplica datos.

## Prueba manual de aceptación

1. Abre [http://localhost:3000](http://localhost:3000).
2. Confirma que ves el menú lateral con "Vincle Apps", la sección "Gestor de Ofertas" y el aviso "Entorno local · autenticación pendiente".
3. Entra en "Todas las ofertas" (`/offers`) y comprueba el mensaje de estado vacío: todavía no existen ofertas.
4. Confirma que "Nueva oferta" aparece marcada como no disponible en esta entrega y no permite crear nada.
5. Entra en "Administración > Maestros" (`/admin/master-data`).
6. Comprueba que se muestran, con su nombre, código técnico, estado y orden: prioridades (3), orígenes (3), tipos de oferta (3), estados de oferta (10), segmentaciones (10) y perfiles profesionales (14).
7. Confirma que idiomas y motivos de cancelación aparecen como listas vacías, sin ningún error.
8. Ejecuta de nuevo `npm run db:seed` y confirma en la terminal que los recuentos no aumentan.

## Comandos disponibles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Arranca la aplicación en modo desarrollo. |
| `npm run build` | Genera la build de producción (solo para validación local en esta entrega). |
| `npm run start` | Arranca la build de producción ya generada. |
| `npm run lint` | Revisa el estilo y errores comunes del código. |
| `npm run typecheck` | Comprueba los tipos de TypeScript sin generar archivos. |
| `npm run test` | Ejecuta las pruebas automatizadas mínimas del proyecto. |
| `npm run db:generate` | Genera el cliente Prisma a partir del esquema. |
| `npm run db:migrate` | Aplica las migraciones de base de datos en desarrollo. |
| `npm run db:seed` | Carga (de forma idempotente) los maestros de referencia. |

## Historial de entregas

Ver [`CHANGELOG.md`](CHANGELOG.md).
