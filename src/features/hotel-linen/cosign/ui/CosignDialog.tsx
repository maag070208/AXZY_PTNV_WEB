import { useState } from "react";
import { ITAlert, ITButton, ITDialog, ITFlex, ITInput, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
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
    <ITDialog isOpen={isOpen} onClose={close} title={title}>
      <ITFlex direction="column" gap={3} className="min-w-[340px]">
        <ITText muted className="text-[12px]">
          {t("cosign.hint")}
        </ITText>
        {error && <ITAlert variant="error">{error}</ITAlert>}
        <ITInput name="cosignUser" label={t("cosign.username")} value={username} onChange={(e) => setUsername(e.target.value)} />
        <ITInput
          name="cosignPassword"
          type="password"
          label={t("cosign.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <ITFlex justify="end" gap={2}>
          <ITButton variant="outlined" color="secondary" label={t("common.cancel")} onClick={close} />
          <ITButton
            variant="filled"
            color="primary"
            label={t("cosign.confirm")}
            disabled={busy || !username.trim() || !password}
            onClick={() => void confirm()}
          />
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
}
