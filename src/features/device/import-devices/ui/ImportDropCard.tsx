import { ITButton, ITCard, ITFlex, ITLoader, ITText } from "@axzydev/axzy_ui_system";
import { FaFileExcel, FaInfoCircle, FaTable, FaUpload } from "react-icons/fa";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { UseDeviceImport } from "../model/useDeviceImport";

export default function ImportDropCard({ fx }: { fx: UseDeviceImport }) {
  const { t: tt } = useTranslation(["device"]);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const selected = event.dataTransfer.files?.[0];
    if (selected) void fx.handleParse(selected);
  };

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

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`rounded-3xl border-2 border-dashed transition-colors p-8 flex flex-col items-center justify-center gap-3 text-center ${
            dragOver
              ? "border-emerald-400 bg-emerald-50/60"
              : "border-slate-300 bg-slate-50/60 hover:border-emerald-300"
          }`}
        >
          {fx.parsing ? (
            <ITFlex direction="column" align="center" gap={3}>
              <ITLoader variant="spinner" size="md" color="primary" />
              <ITText className="text-[11px] font-black uppercase tracking-widest text-emerald-700">
                {tt("import.reading")}
              </ITText>
            </ITFlex>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md">
                <FaFileExcel size={24} className="text-white" />
              </div>
              <ITFlex direction="column" align="center" gap={0.5}>
                <ITText className="text-[15px] font-black text-slate-800">
                  {tt("import.dropTitle")}
                </ITText>
                <ITText className="text-[11px] text-slate-500">
                  {tt("import.dropSubtitle")}
                </ITText>
                {fx.file && (
                  <ITText className="mt-1 text-[11px] font-bold text-emerald-700">
                    {tt("import.file", { name: fx.file.name })}
                  </ITText>
                )}
              </ITFlex>
              <ITButton
                variant="filled"
                color="primary"
                onClick={() => fx.inputRef.current?.click()}
              >
                <ITFlex align="center" gap={1}>
                  <FaUpload size={12} />
                  <ITText className="text-[11px] font-bold">
                    {fx.file ? tt("import.dropChange") : tt("import.chooseFile")}
                  </ITText>
                </ITFlex>
              </ITButton>
            </>
          )}
        </div>

        <ITCard className="border border-slate-200 bg-white p-5 rounded-2xl shadow-sm">
          <ITFlex direction="column" gap={3}>
            <ITFlex align="center" gap={2}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm">
                <FaTable size={16} className="text-white" />
              </div>
              <ITFlex direction="column" gap={0}>
                <ITText className="text-[12px] font-black uppercase tracking-widest text-slate-700">
                  {tt("import.schemaTitle")}
                </ITText>
                <ITText className="text-[10px] text-slate-400 font-bold">
                  {tt("import.schemaHint")}
                </ITText>
              </ITFlex>
            </ITFlex>

            <ITFlex gap={1.5} wrap="wrap">
              {(
                [
                  { key: "colModelo", required: true },
                  { key: "colDescripcion", required: true },
                  { key: "colCantidad", required: true },
                  { key: "colMarca", required: false },
                  { key: "colTipo", required: false },
                ] as const
              ).map((col) => (
                <span
                  key={col.key}
                  className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${
                    col.required
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-slate-50 border-slate-200 text-slate-500"
                  }`}
                >
                  {tt(`import.${col.key}`)}
                  {col.required && (
                    <span className="text-rose-500 text-[13px] leading-none align-top">*</span>
                  )}
                </span>
              ))}
            </ITFlex>

            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
              <ITText className="mb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                {tt("import.schemaExample")}
              </ITText>
              <ITText className="text-[12px] font-mono text-slate-700 leading-relaxed">
                <span className="font-black">{tt("import.colModelo")}:</span>{" "}
                Laptop Latitude 5420 ·{" "}
                <span className="font-black">{tt("import.colDescripcion")}:</span>{" "}
                Equipo para oficina ·{" "}
                <span className="font-black">{tt("import.colCantidad")}:</span> 3 ·{" "}
                <span className="font-black">{tt("import.colMarca")}:</span> Dell ·{" "}
                <span className="font-black">{tt("import.colTipo")}:</span> LAPTOP
              </ITText>
            </div>

            <ITFlex align="start" gap={1.5}>
              <FaInfoCircle size={12} className="text-emerald-500 mt-0.5 shrink-0" />
              <ITText className="text-[10px] text-slate-500 leading-relaxed">
                {tt("import.schemaNote")}
              </ITText>
            </ITFlex>
          </ITFlex>
        </ITCard>
      </ITFlex>
    </ITCard>
  );
}