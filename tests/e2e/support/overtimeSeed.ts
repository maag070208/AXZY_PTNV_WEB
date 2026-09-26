import { execFileSync } from "node:child_process";
import { API_ROOT } from "./env";

/**
 * Siembra del tiempo extra para las suites de navegador. La base la posee
 * `api/`, así que se delega en su CLI de pruebas (`seed-overtime`), que crea
 * checadas + vínculo reloj ↔ usuario (las checadas no tienen endpoint HTTP).
 */
export interface OvertimeSeedUser {
  id: string;
  name: string;
  number: string;
  date: string;
  role: string;
  username: string;
}

const runCli = (action: string, runId: string): string =>
  execFileSync("npx", ["ts-node", "tests/e2e/support/cli.ts", action, runId], {
    cwd: API_ROOT,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  });

export const seedOvertime = (runId: string): OvertimeSeedUser[] => {
  const output = runCli("seed-overtime", runId);
  const line = output.split("\n").find((l) => l.startsWith("__E2E_SEED__"));
  if (!line) throw new Error(`No se pudo sembrar el tiempo extra:\n${output}`);
  return (JSON.parse(line.replace("__E2E_SEED__", "")) as { users: OvertimeSeedUser[] }).users;
};

export const clearOvertime = (runId: string): void => {
  runCli("clean-overtime", runId);
};
