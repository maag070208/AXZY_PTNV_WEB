import { TimeClockEmployeesTab, useTimeClockEmployees } from "@features/access/time-clock-employees";

/** Empleados del reloj: vincular cada número con su usuario. */
export default function EmployeesTab({ onSeeReport }: { onSeeReport: () => void }) {
  const fx = useTimeClockEmployees();
  return <TimeClockEmployeesTab fx={fx} onSeeReport={onSeeReport} />;
}
