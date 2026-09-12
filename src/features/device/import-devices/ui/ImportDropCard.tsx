import { ITButton, ITCard, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaFileExcel } from "react-icons/fa";
import type { UseDeviceImport } from "../model/useDeviceImport";

export default function ImportDropCard({ fx }: { fx: UseDeviceImport }) {
  return (
    <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px] mb-6">
      <ITFlex direction="column" gap={4}>
        <input
          ref={fx.inputRef}
          type="file"
          accept=".xls,.xlsx"
          className="hidden"
          onChange={(event) => {
            const selected = event.target.files?.[0];
            if (selected) void fx.handleParse(selected);
          }}
        />
        <ITButton
          variant="outlined"
          color="secondary"
          onClick={() => fx.inputRef.current?.click()}
          disabled={fx.parsing}
        >
          <ITFlex align="center" gap={1}>
            <FaFileExcel size={12} />
            <ITText className="text-[11px] font-bold">
              {fx.parsing ? "Leyendo archivo…" : "Elegir Excel"}
            </ITText>
          </ITFlex>
        </ITButton>
        {fx.file && (
          <ITText className="text-[11px] font-bold text-slate-500">
            Archivo: {fx.file.name}
          </ITText>
        )}
        <ITCard className="border border-blue-100 bg-blue-50/50 p-4 rounded-2xl">
          <ITFlex direction="column" gap={2}>
            <ITText className="text-[11px] font-black uppercase tracking-widest text-blue-800">
              Schema esperado
            </ITText>
            <ITText className="text-[11px] text-slate-600">
              La primera hoja debe tener estas columnas, en cualquier orden:
            </ITText>
            <div className="overflow-x-auto rounded-xl border border-blue-100 bg-white">
              <table className="w-full min-w-[520px] border-collapse text-left">
                <thead className="bg-blue-50 text-[10px] font-black uppercase tracking-wider text-blue-800">
                  <tr>
                    <th className="px-3 py-2">Modelo *</th>
                    <th className="px-3 py-2">Descripción *</th>
                    <th className="px-3 py-2">Cantidad *</th>
                    <th className="px-3 py-2">Marca</th>
                    <th className="px-3 py-2">Tipo</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] text-slate-600">
                  <tr>
                    <td className="px-3 py-2">Laptop Latitude 5420</td>
                    <td className="px-3 py-2">Equipo para oficina</td>
                    <td className="px-3 py-2">3</td>
                    <td className="px-3 py-2">Dell</td>
                    <td className="px-3 py-2">LAPTOP</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <ITText className="text-[10px] text-slate-500">
              Se aceptan `DESCRIPCIÓN` con acento. También puedes incluir
              `Marca` y `Tipo`; el tipo debe coincidir con código o nombre
              existente.
            </ITText>
          </ITFlex>
        </ITCard>
      </ITFlex>
    </ITCard>
  );
}