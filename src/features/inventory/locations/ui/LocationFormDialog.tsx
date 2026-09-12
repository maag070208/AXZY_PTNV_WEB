import { ITButton, ITDialog, ITFlex, ITInput, ITText } from "@axzydev/axzy_ui_system";
import type { UseLocations } from "../model/useLocations";

export default function LocationFormDialog({ fx }: { fx: UseLocations }) {
  return (
    <ITDialog
      isOpen={fx.showForm}
      onClose={() => fx.setShowForm(false)}
      className="it-dialog-panel"
      title={
        fx.editingLoc
          ? fx.t("locations.editDialog")
          : fx.t("locations.newDialog")
      }
    >
      <ITFlex direction="column" gap={3}>
        <ITInput
          name="lugar"
          label={fx.t("locations.lugar")}
          value={fx.form.lugar}
          onChange={(e) => fx.setForm((f) => ({ ...f, lugar: e.target.value }))}
          placeholder={fx.t("locations.lugarPlaceholder")}
        />
        <ITInput
          name="subLugar"
          label={fx.t("locations.subLugar")}
          value={fx.form.subLugar}
          onChange={(e) =>
            fx.setForm((f) => ({ ...f, subLugar: e.target.value }))
          }
          placeholder={fx.t("locations.subLugarPlaceholder")}
        />
        <ITInput
          name="numero"
          label={fx.t("locations.numero")}
          value={fx.form.numero}
          onChange={(e) => fx.setForm((f) => ({ ...f, numero: e.target.value }))}
          placeholder={fx.t("locations.numeroPlaceholder")}
        />
        <ITInput
          name="descripcion"
          label={fx.t("locations.descripcion")}
          value={fx.form.descripcion}
          onChange={(e) =>
            fx.setForm((f) => ({ ...f, descripcion: e.target.value }))
          }
          placeholder={fx.t("locations.descripcionPlaceholder")}
        />
        <ITFlex justify="end" gap={2}>
          <ITButton variant="outlined" onClick={() => fx.setShowForm(false)}>
            {fx.t("common:actions.cancel")}
          </ITButton>
          <ITButton
            variant="filled"
            color="primary"
            onClick={fx.handleSave}
            disabled={fx.saving}
          >
            <ITText className="font-bold text-[11px]">
              {fx.saving ? fx.t("new.saving") : fx.t("common:actions.save")}
            </ITText>
          </ITButton>
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
}