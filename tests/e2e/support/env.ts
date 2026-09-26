import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";

// El paquete es ESM ("type": "module"), así que no hay __dirname.
const here = path.dirname(fileURLToPath(import.meta.url));

/** Raíz del paquete `web/`. */
export const WEB_ROOT = path.resolve(here, "../../..");
/** Raíz del paquete `api/`, dueño de la base y de su provisión/limpieza. */
export const API_ROOT = path.resolve(WEB_ROOT, "../api");

// Mismo .env que consume la app, para que los tests apunten a donde apunta ella.
const vars = loadEnv("development", WEB_ROOT, "");

/** Prefijo de todo lo que crea la suite; la limpieza corre por aquí. */
export const E2E_PREFIX = "E2E";

export const E2E = {
  /** La app servida por Vite. */
  webUrl: process.env.E2E_WEB_URL ?? "http://localhost:5006",
  /** La API real contra la que habla la app. */
  apiUrl: process.env.E2E_API_URL ?? vars.VITE_API_URL ?? "http://localhost:4001/api/v1",
  prefix: E2E_PREFIX,
  password: process.env.E2E_PASSWORD ?? "e2e-Test-2026!",
  admin: { username: "e2e_admin", name: "E2E Admin" },
  employee: { username: "e2e_empleado", name: "E2E Empleado" },
  guard: { username: "e2e_guard", name: "E2E Guard" },
  /** Sitio demo persistente del módulo de acceso (mismo que provisiona `api/`). */
  demoSite: { name: "E2E Portería Principal", code: "E2E-SITE" },
  /** Dónde el store de la app persiste la sesión. */
  storageKey: "ptnv_auth_v1",
  /** Sesión ya iniciada, reutilizada por todos los tests. */
  storageState: "tests/e2e/.auth/admin.json",
} as const;

export const apiBase = `${E2E.apiUrl.replace(/\/+$/, "")}/`;
export const healthUrl = `${E2E.apiUrl.replace(/\/+$/, "")}/health`;

/** HashRouter: todas las rutas de la app cuelgan de `#`. */
export const route = (path: string): string => `/#${path.startsWith("/") ? path : `/${path}`}`;

/** Sufijo único por corrida, para nombres y folios que no choquen. */
export const newRunId = (): string =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`.toUpperCase();
