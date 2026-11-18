import { useState } from "react";
import { ITAlert, ITDialog, ITFlex, ITInput } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { LuPenLine } from "react-icons/lu";
import { DialogHeader } from "@shared/ui/dialog-header";
import { DialogFooter } from "@shared/ui/dialog-footer";
import { hotelLinenApi, type HotelCosignResult } from "@entities/hotel-linen";

interface Props {
  isOpen: boolean;
  /** Título del diálogo, p. ej. "Firma de quien recibe". */
  title: string;
  onClose: () => void;
  onSigned: (result: HotelCosignResult) => void;
}

/** Co-firma: otra persona confirma con su usuario y contraseña; devuelve el `cosignToken`. */
export default function CosignDialog({ isOpen, title, onClose, onSigned }: Props) {
  const { t } = useTranslation("hotel-linen");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setUsername("");
    setPassword("");
    setError(null);
    onClose();
  };

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await hotelLinenApi.cosign({ username: username.trim(), password });
      setUsername("");
      setPassword("");
      onSigned(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ITDialog isOpen={isOpen} onClose={close}>
      <DialogHeader icon={<LuPenLine />} title={title} subtitle={t("cosign.subtitle")} />
      <ITFlex direction="column" gap={3} className="min-w-[340px]">
        <ITAlert variant="info">{t("cosign.hint")}</ITAlert>
        {error && <ITAlert variant="error">{error}</ITAlert>}
        <ITInput name="cosignUser" label={t("cosign.username")} value={username} onChange={(e) => setUsername(e.target.value)} />
        <ITInput
          name="cosignPassword"
          type="password"
          label={t("cosign.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <DialogFooter onCancel={close} onConfirm={() => void confirm()} confirmLabel={t("cosign.confirm")} busy={busy} disabled={!username.trim() || !password} />
      </ITFlex>
    </ITDialog>
  );
}
