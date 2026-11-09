import { useCallback, useRef, useState, type ReactNode } from "react";
import CosignDialog from "../ui/CosignDialog";

/**
 * Pide una co-firma como promesa: `request(título)` abre el diálogo y resuelve con el
 * `cosignToken` (o `null` si se cancela). Renderiza `dialog` una vez en la pantalla.
 */
export const useCosign = (): {
  request: (title: string) => Promise<string | null>;
  dialog: ReactNode;
} => {
  const [title, setTitle] = useState<string | null>(null);
  const resolver = useRef<((token: string | null) => void) | null>(null);

  const finish = useCallback((token: string | null) => {
    resolver.current?.(token);
    resolver.current = null;
    setTitle(null);
  }, []);

  const request = useCallback(
    (label: string) =>
      new Promise<string | null>((resolve) => {
        resolver.current = resolve;
        setTitle(label);
      }),
    []
  );

  const dialog = (
    <CosignDialog
      isOpen={title !== null}
      title={title ?? ""}
      onClose={() => finish(null)}
      onSigned={(r) => finish(r.cosignToken)}
    />
  );
  return { request, dialog };
};
