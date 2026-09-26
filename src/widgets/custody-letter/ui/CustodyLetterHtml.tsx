import { useTranslation } from "react-i18next";
import type { Loan } from "@entities/inventory";
import { formatDate } from "@shared/utils/dates";
import { LOGO_PUERTO_NUEVO_BASE64 } from "@shared/assets/logoPuertoNuevo";
import { resolveAreaName } from "../model/custodyLetter";

/**
 * Vista previa HTML de la carta responsiva (sin PDFViewer para evitar
 * re-renderizados/parpadeos al escribir en vivo).
 */
export default function CustodyLetterHtml({ loan }: { loan: Loan }) {
  const { t: tt } = useTranslation("custody-letters");

  const dateTxt = formatDate(loan.date) || tt("doc.dateLetters");
  const firstItem = loan.items?.[0] ?? null;
  const areaName = resolveAreaName(loan);

  const custodianName = loan.custodian?.name ?? "";
  const observableTxt = loan.department?.name
    ? `${loan.department.name}${loan.subarea ? ` — ${loan.subarea.name}` : ""}`
    : "";
  const custodianTxt = observableTxt || custodianName || "";

  const totalPieces = loan.items.length
    ? loan.items.reduce((sum, d) => sum + d.quantity, 0)
    : 0;
  const pieces = `${totalPieces} ${tt(totalPieces === 1 ? "doc.piece" : "doc.pieces")}`;
  const descriptionWithQuantity =
    (firstItem?.device?.name || tt("doc.sampleDevice")) + (totalPieces > 0 ? ` (${pieces})` : "");
  const officialDocument = "SIS-001";
  const assetTag = firstItem?.units?.[0]?.deviceUnit?.assetTag ?? "TBE-0001";
  const serialNumber = firstItem?.units?.[0]?.deviceUnit?.serialNumber;
  const hostname = firstItem?.units?.[0]?.deviceUnit?.hostname;

  const commitments = [
    tt("doc.commitment1"),
    tt("doc.commitment2"),
    tt("doc.commitment3"),
    tt("doc.commitment4"),
    tt("doc.commitment5"),
  ];

  const resourceRows: Array<{ label: string; value: string; testId?: string }> = [
    { label: tt("doc.descriptionGeneral"), value: descriptionWithQuantity },
    { label: tt("doc.brand"), value: firstItem?.device?.brand || "STEREN" },
    { label: tt("doc.model"), value: firstItem?.device?.model || "RM-115" },
  ];
  if (serialNumber) resourceRows.push({ label: tt("doc.serialNumber"), value: serialNumber });
  if (hostname) resourceRows.push({ label: tt("doc.hostname"), value: hostname });
  resourceRows.push({ label: tt("doc.assetTag"), value: assetTag });
  resourceRows.push({ label: tt("doc.area"), value: areaName, testId: "custody-letter-area" });

  return (
    <div className="mx-auto max-w-[210mm] rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex aspect-[612/792] flex-col rounded-md border border-slate-300 bg-white text-[10px] leading-[1.35] text-black">
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-300 p-3 pt-4">
          <img src={LOGO_PUERTO_NUEVO_BASE64} alt="Puerto Nuevo" className="h-16 w-16 object-contain" />
          <div className="w-52 border border-black">
            <div className="flex items-end px-1.5 py-1">
              <span className="w-[74px] font-bold">{tt("doc.date")}</span>
              <span className="flex-1 border-b border-black text-center">{dateTxt}</span>
            </div>
            <div className="flex items-end px-1.5 py-1">
              <span className="w-[74px] font-bold">
                {loan.departmentId ? tt("doc.department") : tt("doc.employeeNo")}
              </span>
              <span className="flex-1 border-b border-black text-center">
                {loan.departmentId ? custodianTxt : loan.custodian?.employeeNumber || "N/A"}
              </span>
            </div>
            <div className="flex items-end px-1.5 py-1">
              <span className="w-12 font-bold">{tt("doc.page")}</span>
              <span className="flex-1 border-b border-black text-center">
                {tt("doc.pageOf", { current: 1, total: 1 })}
              </span>
            </div>
          </div>
        </div>

        {/* Barra de título */}
        <div className="border-b border-slate-300 bg-[#b4c6e7] px-2 py-1.5 text-left font-bold">
          {tt("doc.folioBar")}
        </div>

        {/* Cuerpo principal */}
        <div className="p-3">
          <p className="text-justify">
            {tt("doc.para1a")} <strong>{tt("doc.resourceTic")}</strong> {tt("doc.para1b")}{" "}
            <strong>{"Puerto Nuevo Hotel y Villas."}</strong> {tt("doc.para1c")}
          </p>

          <ul className="my-1 ml-6 list-disc space-y-0.5">
            {commitments.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>

          <p className="mt-1 font-bold">{tt("doc.resourceTitle")}</p>
          <div className="mt-0.5">
            {resourceRows.map((r) => (
              <div key={r.label} className="flex items-end">
                <span className="w-[96px] shrink-0">{r.label}</span>
                <span
                  data-testid={r.testId}
                  className="flex-1 border-b border-black pl-1 font-bold uppercase"
                >
                  {r.value || " "}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-2 text-justify">
            {tt("doc.para2a")}{" "}
            <strong>
              {tt("doc.departmentRegulations")} {areaName}
            </strong>{" "}
            {tt("doc.para2b")} <strong>{tt("doc.strictlyProhibited")}</strong> {tt("doc.para2c")}{" "}
            <strong>{tt("doc.interiorRegulations")}</strong>
          </p>
        </div>

        {/* Seguimiento */}
        <div className="m-3 border border-slate-300">
          <div className="border-b border-slate-300 bg-[#d9d9d9] px-2 py-1 font-bold">
            {tt("doc.followUpBar")}
          </div>
          <div className="p-3">
            <div className="flex items-end pb-1">
              <span className="w-32 shrink-0">{tt("doc.loanReturnDate")}</span>
              <span className="h-2 flex-1 border-b border-black" />
            </div>
            <div className="flex items-end pb-1">
              <span className="w-32 shrink-0">{tt("doc.nameKeeper")}</span>
              <span className="h-2 flex-1 border-b border-black" />
            </div>
            <div className="flex items-end pb-1">
              <span className="w-32 shrink-0">{tt("doc.conditionsReturns")}</span>
              <span className="h-2 flex-1 border-b border-black" />
            </div>
            <div className="h-2 border-b border-black" />
            <div className="h-2 border-b border-black" />
            <p className="pt-1">
              <strong>{tt("doc.noteRh1")}</strong> {tt("doc.noteRh2")}
            </p>
          </div>
        </div>

        {/* Firmas */}
        <div className="mt-auto flex justify-around px-6 pb-6 pt-8 text-center">
          <div className="w-28">
            <div className="border-t border-black" />
            <p className="font-bold">{custodianTxt || " "}</p>
            <p>{tt("doc.signatureCustodian")}</p>
          </div>
          <div className="w-28">
            <div className="border-t border-black" />
            <p className="font-bold">{" "}</p>
            <p>{tt("doc.signatureHeadArea")}</p>
          </div>
          <div className="w-28">
            <div className="border-t border-black" />
            <p className="font-bold">{tt("doc.systemsDepartment")}</p>
            <p>{tt("doc.signatureDelivery")}</p>
          </div>
        </div>
      </div>

      <p className="pb-1 pt-2 text-center text-[10px] text-slate-400">{officialDocument}</p>
    </div>
  );
}