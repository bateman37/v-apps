# Visión — Vincle Apps

## Qué es Vincle Apps

Vincle Apps es una plataforma web interna que sustituirá progresivamente varias aplicaciones y ficheros Excel corporativos hoy dispersos, unificando:

- Navegación (un menú lateral común a todos los módulos).
- Autenticación.
- Datos maestros compartidos.
- Seguridad y control de acceso.
- Auditoría.
- Integraciones con sistemas externos.

El nombre **Vincle Apps** (repositorio `v-apps`) es provisional.

## Módulos previstos

Vincle Apps se concibe como una plataforma modular. Los módulos siguientes forman parte de la visión a largo plazo; **solo el Gestor de Ofertas se documenta funcionalmente en profundidad en esta entrega** (ver [`../offers/OVERVIEW.md`](../offers/OVERVIEW.md)). El resto se describe únicamente a nivel de visión, sin diseño funcional ni técnico todavía.

### 1. Gestor de Ofertas

Alta, consulta y modificación de ofertas comerciales; estimación inicial de jornadas por perfil; estado y seguimiento de cada oferta. Primer módulo a implementar. Especificación funcional en [`../offers/`](../offers/OVERVIEW.md).

### 2. ESM

Estimaciones de proyectos y de precios recurrentes; costes, precios, márgenes y descuentos; jornadas comerciales con coste interno cero y valor comercial.

### 3. FACT

Registro de jornadas ejecutadas mensualmente; relación entre jornadas vendidas, ejecutadas, reconocidas y facturadas; seguimiento del consumo pendiente.

### 4. Budget Comercial y Revenue Control

Venta y recurrencia por cliente; presupuesto frente a venta y facturación real; incrementos configurados por cliente; mantenimiento por usuario en on-premise; licencias por usuario o licencia activa en SaaS; Customer Service; infraestructura; proyectos y otros servicios recurrentes o no recurrentes.

### 5. License Manager e integraciones

Consulta mediante API de usuarios y licencias activas; comparación entre lo contratado, lo activo y lo facturado; detección de licencias activas no facturadas y otras discrepancias.

### 6. Administración común

Usuarios y permisos; maestros compartidos; tarifas, cuando se diseñen; parámetros de sistema; auditoría.

## Alcance de esta visión

Esta visión describe la dirección del producto, no un compromiso de calendario ni de diseño detallado para los módulos 2 a 6. Ver [`ROADMAP.md`](ROADMAP.md) para las fases previstas y [`SCOPE.md`](SCOPE.md) para lo que está efectivamente en alcance en el momento actual.
