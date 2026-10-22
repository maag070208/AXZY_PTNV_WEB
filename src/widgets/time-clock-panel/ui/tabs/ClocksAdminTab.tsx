import { TimeClocksTab, useTimeClocks } from "@features/access/time-clocks";

/** Administrar relojes (alta, edición y baja del registro). */
export default function ClocksAdminTab() {
  const fx = useTimeClocks();
  return <TimeClocksTab fx={fx} />;
}
