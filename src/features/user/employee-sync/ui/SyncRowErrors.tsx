import { ITFlex, ITText } from "@axzydev/axzy_ui_system";
import type { EmployeeSyncInvalidRow } from "@entities/user";

interface Props {
  errors: EmployeeSyncInvalidRow[];
  /** Traduce el código del error de la API. */
  label: (code: string) => string;
}

/**
 * Errores por fila que devuelve el 422 `USER_SYNC_INVALID_ROWS`. Van bajo la
 * celda que los provocó para que se corrijan sin salir de la pestaña.
 */
export default function SyncRowErrors({ errors, label }: Props) {
  if (errors.length === 0) return null;
  return (
    <ITFlex direction="column" gap={0.5}>
      {errors.map((rowError, index) => (
        <ITText key={`${rowError.field}-${rowError.code}-${index}`} className="!text-[10px] leading-tight text-rose-600">
          {label(rowError.code)}
        </ITText>
      ))}
    </ITFlex>
  );
}
