import type { ComponentProps } from "react";
import { createPortal } from "react-dom";
import { ITConfirmDialog } from "@axzydev/axzy_ui_system";

/**
 * `ITConfirmDialog` montado en `document.body`. El de la librería se pinta en
 * su lugar del árbol, y el contenedor del contenido (`relative z-0`) lo deja
 * atrapado DEBAJO de la barra superior aunque tenga z-[60].
 */
export default function ConfirmDialog(props: ComponentProps<typeof ITConfirmDialog>) {
  if (!props.isOpen || typeof document === "undefined") return null;
  return createPortal(<ITConfirmDialog {...props} />, document.body);
}
