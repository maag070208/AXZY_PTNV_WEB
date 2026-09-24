import { execFileSync } from "node:child_process";
import { RAIZ_API } from "./env";

/**
 * Siembra del tiempo extra para las suites de navegador. La base la posee
 * `api/`, así que se delega en su CLI de pruebas (`seed-overtime`), que crea
 * checadas + vínculo reloj ↔ usuario (las checadas no tienen endpoint HTTP).
 */
export interface OvertimeSeedUser {
  id: string;
  name: string;
  numero: string;
  date: string;
  role: string;
  username: string;
}

const correrCli = (accion: string, runId: string): string =>
  execFileSync("npx", ["ts-node", "tests/e2e/support/cli.ts", accion, runId], {
    cwd: RAIZ_API,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  });

export const sembrarOvertime = (runId: string): OvertimeSeedUser[] => {
  const salida = correrCli("seed-overtime", runId);
  const linea = salida.split("\n").find((l) => l.startsWith("__E2E_SEED__"));
  if (!linea) throw new Error(`No se pudo sembrar el tiempo extra:\n${salida}`);
  return (JSON.parse(linea.replace("__E2E_SEED__", "")) as { users: OvertimeSeedUser[] }).users;
};

export const limpiarOvertime = (runId: string): void => {
  correrCli("clean-overtime", runId);
};
