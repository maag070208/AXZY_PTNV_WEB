# Puerto Nuevo — Web (Cartas Responsivas)

Mapa de módulos y funcionalidades del frontend web.

## Stack

| Capa | Tecnología |
|------|------------|
| UI | React 19 |
| Build | Vite 6 + TypeScript 5.7 |
| Estado | Redux Toolkit 2 (`react-redux`) |
| Rutas | React Router 7 |
| Design system | `@axzydev/axzy_ui_system` 1.2.16 |
| i18n | i18next + react-i18next (es + en) |
| Realtime | Ably 2.27 |
| PDF | `@react-pdf/renderer` 4 |
| Validación | yup |
| HTTP | axios (`shared/api/client`) |
| Tests E2E | Playwright |

## Arquitectura

Feature-Sliced Design (FSD):

```
src/
  app/        # bootstrap, store, router (App.tsx), guards
  entities/   # API + modelos + slices por dominio
  features/   # casos de uso (model/use*.ts + ui/)
  widgets/    # composición compleja (PDFs, paneles, kanban)
  pages/      # rutas
  shared/     # api, ui, lib, i18n, pdf, utils, validation
```

- Entidades: `user`, `department`, `subarea`, `personal`, `inventario`, `salida`, `report`, `ticket`, `notification`, `dashboard`, `audit-log`, `sys-config`.
- Estado global Redux: `auth`, `notifications`, `tickets` (+ slices por entidad).

## Roles y permisos

| Rol | Descripción |
|-----|-------------|
| `ADMIN` | Acceso total |
| `GERENTE` | Admin dashboard, tickets/admin tareas, inventario NO |
| `JEFE_DE_AREA` | `canManage` (tickets/gestión) sin expediente RRHH completo |
| `RECURSOS_HUMANOS` | Expediente completo de personal (`canManageHR`) |
| `EMPLEADO` | Solo tickets (mis tareas), notificaciones |

Derivados en `app/guards/PrivateRoutes.tsx`:
- `isAdmin = ADMIN || GERENTE`
- `canManage = isAdmin || JEFE_DE_AREA`
- `canManageHR = ADMIN || RECURSOS_HUMANOS` (expediente médico/documentos NO para GERENTE)

## Módulos

### 1. Auth
- Rutas: `/login`
- `pages/auth/LoginPage`, `features/auth/login`
- Login usuario/password, token + sesión (`shared/api/session`), `me`, logout. Guard `PrivateRoutes` redirige sin token.

### 2. Inicio / Dashboard
- Rutas: `/`
- `pages/home/HomePage`, `features/home/admin-dashboard`
- Home vacío para empleados. Dashboard admin (ADMIN+GERENTE): resumen, stats, donut chart, feed de actividad reciente con links a ticket/préstamo/dispositivo (`activityLinks.ts`).

### 3. Inventario (solo ADMIN)
- Rutas: `/inventario`, `/inventario/dispositivos`, `/inventario/tipos`, `/inventario/movimientos`, `/inventario/prestamos`, `/inventario/devoluciones`
- Dashboard: KPIs de inventario (`/inventario/dashboard`).
- Dispositivos: CRUD, tipos, existencias, unidades físicas (serie/MAC/IP/equipo), kardex, detalle.
- Movimientos: alta, filtros por tipo/dispositivo, revertir.
- Préstamos: crear, editar, cancelar, detalle (cartas responsivas).
- Devoluciones: registrar con condición por ítem.
- Endpoints: `/inventario/tipos`, `/inventario/dispositivos`, `/inventario/unidades-fisicas`, `/inventario/movimientos`, `/inventario/prestamos`, `/inventario/devoluciones`, `/inventario/dashboard`.

### 4. Tareas / Tickets (todos)
- Rutas: `/tickets`, `/tickets/kanban`, `/tickets/mis-tareas`, `/tickets/tareas`, `/tickets/nuevo`, `/tickets/:id`, `/tickets/:id/editar`
- Lista, crear, editar, detalle.
- Kanban board.
- Mis tareas (EMPLEADO), Admin tareas (ADMIN/GERENTE).
- Detalle: comentarios, asignaciones con comentarios/adjuntos, historial, grafo de tareas, panel manager, PDF.
- Endpoints: `/tickets`, `/tickets/kanban`, `/tickets/:id/attachments`, `/tickets/:id/assignments`, `/tickets/:id/comments`.

### 5. Recursos Humanos / Empleados (ADMIN + RECURSOS_HUMANOS)
- Rutas: `/empleados`, `/empleados/:id`, `/empleados/:id/editar`, `/empleados/reportes`, `/empleados/reportes/:id`, `/empleados/catalogos/documentos`
- Lista de empleados, detalle, edición de perfil (foto, datos).
- Documentos por empleado + catálogo de tipos de documento.
- Actas administrativas: crear, ver detalle, borrar, PDF.
- Reportes de personal.
- Endpoints: `/personal/stats`, `/personal/:id`, `/personal/:id/perfil`, `/personal/:id/foto`, `/personal/:id/documentos`, `/personal/catalogos/*`, `/personal/actas/*`.

### 6. Departamentos
- Rutas: `/departamentos`, `/departamentos/:id`
- `pages/departments`, `features/department`
- CRUD, soft-delete, detalle con info + aside.
- Endpoints: `/departments`.

### 7. Subáreas
- Rutas: `/subareas`
- `pages/subareas`, `features/subarea`
- CRUD, soft-delete.
- Endpoints: `/subareas`.

### 8. Reportes (solo ADMIN)
- Rutas: `/reportes`
- `pages/reports/ReportesPage`, `features/report/*`
- Tabs: Asignados, Dispositivos, Salidas. Cada uno con export PDF (`widgets/reports`).
- Endpoints: `/reports`, `/reports/asignados`, `/reports/devices`.

### 9. Usuarios (solo ADMIN)
- Rutas: `/usuarios`, `/usuarios/nuevo`, `/usuarios/:id/editar`, `/usuarios/:id/historial`, `/usuarios/importar`
- Lista, crear/editar, cambio password, activar/desactivar, historial (timeline + audit-log), importación (panel + resultado).
- Endpoints: `/users`, `/users/:id/password`, `/users/:id/deactivate`, `/users/:id/reactivate`, `/users/empleados`, `/auth/login`, `/auth/me`.

### 10. Catálogos (solo ADMIN)
- Rutas: `/catalogos`
- `pages/catalog/CatalogPage`, `widgets/catalog/tabs`
- Tabs:
  - Departamentos
  - Subáreas
  - Tipos de dispositivo (serie/MAC/IP/equipo/folio)
  - Tipos de documento
  - Géneros
  - Tipos de sangre
  - Notificaciones (sys-config)

### 11. Notificaciones (todos)
- Rutas: `/notificaciones`
- `pages/notifications`, `features/notification/list`
- Lista, no leídas, marcar leída/todas, borrar. Realtime vía Ably (`useAblyNotifications`) + toast.
- Endpoints: `/notifications`, `/notifications/unread-count`, `/notifications/:id/read`, `/notifications/read-all`.

### 12. Salidas (sin página propia)
- Entidad `entities/salida` con CRUD completo (`/salidas`, `/salidas/batch`, `/salidas/suggestions`).
- Se consume desde Reportes; no tiene ruta dedicada.

## Widgets PDF / render (`widgets/`)

| Widget | Función |
|--------|---------|
| `carta-responsiva` | Preview HTML + PDF de carta responsiva |
| `acta-administrativa` | Preview + PDF de acta administrativa |
| `credencial-empleado` | Render PNG/QR (`buildQrPayload`, DPI, cardSpec) |
| `movimiento-pdf` | PDF de movimientos + reporte |
| `reports` | PDFs: Asignados, Device, Report, Salidas |
| `tickets` | ticket-pdf, attachments, detail modal, kanban-ui |
| `catalog` | Paneles de departamentos/subáreas + tabs |

## Entidades (capa API/modelo)

`user`, `department`, `subarea`, `personal`, `inventario`, `salida`, `report`, `ticket`, `notification`, `dashboard`, `audit-log`, `sys-config`.

Cada entidad: `api/*.ts` (cliente axios), `model/types.ts`, `index.ts` (barrel). Slices Redux en `model/*.slice.ts` para auth, notifications, tickets.

## Convenciones

- Feature: `features/<dominio>/<caso-uso>/{model/use*.ts, ui/*.tsx, index.ts}`.
- Página: `pages/<dominio>/*Page.tsx` que compone feature(s).
- Imports por alias: `@app`, `@entities`, `@features`, `@pages`, `@widgets`, `@shared`.
- i18n namespaces por dominio en `shared/i18n/locales/{es,en}/`.
- Sin comentarios en código salvo casos no obvios.
