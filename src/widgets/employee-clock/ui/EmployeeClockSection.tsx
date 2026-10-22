import { useState } from "react";
import { EmployeeClockCard } from "@features/hr/employee-clock";
import { PersonDetailDialog } from "@features/access/time-clock-people";

/** Sección de reloj checador de una persona: alta, huellas, resumen y ficha completa en modal. */
export default function EmployeeClockSection({ userId, userName }: { userId: string; userName: string }) {
  const [openSerial, setOpenSerial] = useState<string | null>(null);
  const [number, setNumber] = useState<string | null>(null);
  return (
    <>
      <EmployeeClockCard
        userId={userId}
        userName={userName}
        onOpenFicha={(serial) => {
          setOpenSerial(serial);
        }}
        onNumber={setNumber}
      />
      {openSerial && number && (
        <PersonDetailDialog
          clockSerial={openSerial}
          employeeNumber={number}
          editable={false}
          onClose={() => setOpenSerial(null)}
        />
      )}
    </>
  );
}
