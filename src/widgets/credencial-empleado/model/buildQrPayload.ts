import type { PersonalProfile } from "@entities/personal";

export const buildQrPayload = (profile: PersonalProfile) => ({
  t: "credencial",
  no: profile.numeroEmpleado ?? null,
  nombre: profile.name,
  puesto: profile.puesto ?? null,
  depto: profile.department?.name ?? null,
});
