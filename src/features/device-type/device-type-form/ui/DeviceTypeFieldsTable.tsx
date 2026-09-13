import { useTranslation } from "react-i18next";
import { DEVICE_FIELD_KEYS } from "@entities/device-type";
import type { UseDeviceTypeForm } from "../model/useDeviceTypeForm";

export default function DeviceTypeFieldsTable({ fx }: { fx: UseDeviceTypeForm }) {
  const { t: tt } = useTranslation(["device-types"]);
  const fieldLabel = (key: (typeof DEVICE_FIELD_KEYS)[number]) =>
    tt(`form.fieldLabels.${key}`);
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100">
      <table className="w-full min-w-[620px] border-collapse text-left">
        <thead className="bg-slate-50">
          <tr className="text-[10px] font-black uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3">{tt("form.colField")}</th>
            <th className="px-4 py-3 w-32 text-center">{tt("form.colShow")}</th>
            <th className="px-4 py-3 w-32 text-center">{tt("form.colRequired")}</th>
          </tr>
        </thead>
        <tbody>
          {DEVICE_FIELD_KEYS.map((key) => {
            const setting = fx.form.fieldConfig[key];
            return (
              <tr key={key} className="border-t border-slate-100">
                <td className="px-4 py-3 text-[11px] font-bold text-slate-700">
                  {fieldLabel(key)}
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    aria-label={`${tt("form.colShow")} ${fieldLabel(key)}`}
                    checked={setting.enabled}
                    onChange={(e) =>
                      fx.setForm((current) => ({
                        ...current,
                        fieldConfig: {
                          ...current.fieldConfig,
                          [key]: {
                            enabled: e.target.checked,
                            required:
                              e.target.checked && setting.required,
                          },
                        },
                      }))
                    }
                    className="h-4 w-4 accent-slate-700"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    aria-label={`${tt("form.colRequired")} ${fieldLabel(key)}`}
                    checked={setting.required}
                    disabled={!setting.enabled}
                    onChange={(e) =>
                      fx.setForm((current) => ({
                        ...current,
                        fieldConfig: {
                          ...current.fieldConfig,
                          [key]: { ...setting, required: e.target.checked },
                        },
                      }))
                    }
                    className="h-4 w-4 accent-slate-700 disabled:opacity-30"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}