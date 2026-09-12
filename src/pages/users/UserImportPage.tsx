import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITFlex,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaCheckCircle, FaExclamationTriangle, FaFileExcel, FaUpload, FaUserShield } from "react-icons/fa";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usersApi } from "@entities/user";

interface ImportResult {
  creados: number;
  omitidos: { fila: number; username: string; motivo: string }[];
}

export default function UserImportPage() {
  const navigate = useNavigate();
  const { t: tt } = useTranslation(["users", "common"]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleImport = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      const res = await usersApi.import(file);
      setResult(res);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ITPage
      title={tt("import.title")}
      description={tt("import.description")}
      backAction={() => navigate(-1)}
      breadcrumbs={[
        { label: tt("list.breadcrumb"), onClick: () => navigate("/usuarios") },
        { label: tt("import.breadcrumb") },
      ]}
      icon={<FaUserShield size={20} />}
    >
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px] mb-6">
        <ITFlex direction="column" gap={4}>
          <div>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <ITFlex align="center" gap={3}>
              <ITButton variant="outlined" color="secondary" onClick={() => inputRef.current?.click()}>
                <ITFlex align="center" gap={1}>
                  <FaFileExcel size={12} />
                  <ITText className="text-[11px] font-bold">{tt("import.browse")}</ITText>
                </ITFlex>
              </ITButton>
              <ITText className="text-[11px] font-bold text-slate-500">
                {file ? file.name : "Ningún archivo seleccionado"}
              </ITText>
            </ITFlex>
          </div>

          <ITFlex justify="end">
            <ITButton
              variant="filled"
              color="primary"
              onClick={handleImport}
              disabled={!file || uploading}
            >
              <ITFlex align="center" gap={1}>
                <FaUpload size={12} />
                <ITText className="text-[11px] font-bold">
                  {uploading ? tt("import.importing") : tt("import.importBtn")}
                </ITText>
              </ITFlex>
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITCard>

      {result && (
        <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px]">
          <ITFlex align="center" gap={2} className="mb-4">
            <FaCheckCircle size={14} className="text-emerald-600" />
            <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              Resultado de la carga
            </ITText>
          </ITFlex>

          <ITFlex gap={4} wrap="wrap" className="mb-4">
            <ITBadget color="success" size="small">{tt("import.imported", { count: result.creados })}</ITBadget>
            {result.omitidos.length > 0 && (
              <ITBadget color="warning" size="small">{`${result.omitidos.length} omitido(s)`}</ITBadget>
            )}
          </ITFlex>

          {result.omitidos.length > 0 && (
            <div className="mt-2">
              <ITFlex align="center" gap={2} className="mb-2">
                <FaExclamationTriangle size={12} className="text-amber-500" />
                <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Filas omitidas
                </ITText>
              </ITFlex>
              {result.omitidos.map((o, i) => (
                <ITText key={i} className="text-[11px] text-slate-500">
                  Fila {o.fila} ({o.username}): {o.motivo}
                </ITText>
              ))}
            </div>
          )}

          <ITFlex justify="end" className="mt-5">
            <ITButton variant="filled" color="primary" onClick={() => navigate("/usuarios")}>
              {tt("import.goToList")}
            </ITButton>
          </ITFlex>
        </ITCard>
      )}
    </ITPage>
  );
}
