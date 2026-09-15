import { ITBadget, ITFlex, ITStack, ITText } from "@axzydev/axzy_ui_system";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaFileSignature } from "react-icons/fa";
import type { DeviceCartaItem } from "@entities/device";
import { formatFecha } from "@shared/utils/dates";

interface Props {
  item: DeviceCartaItem;
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <ITStack direction="column" spacing={0.5}>
      <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
        {label}
      </ITText>
      <ITText className="text-[12px] font-bold text-slate-700">{value}</ITText>
    </ITStack>
  );
}

/**
 * Tarjeta de préstamo vigente: cuando el dispositivo está ASIGNADO muestra a
 * qué carta responsiva pertenece (folio, a quién, desde cuándo, jefe de área).
 */
export default function ActiveLoanCard({ item }: Props) {
  const { t } = useTranslation("device");
  const carta = item.carta;
  const esDepartamento = !!carta.department;
  const asignadoA = esDepartamento
    ? carta.department?.name
    : carta.responsable?.name;

  return (
    <ITFlex className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-[24px] shadow-xl shadow-amber-100/60 border border-amber-200 p-6 md:p-8">
      <ITStack direction="column" spacing={4} className="w-full">
        <ITFlex justify="between" align="center" gap={2} wrap="wrap">
          <ITFlex align="center" gap={2}>
            <ITBadget color="warning" size="sm">
              {t("loan.title")}
            </ITBadget>
            <Link
              to={`/cartas/${carta.id}`}
              className="inline-flex items-center gap-1 text-[12px] font-black text-amber-800 hover:underline"
            >
              <FaFileSignature size={12} />
              {carta.consecutive}
            </Link>
          </ITFlex>
          <ITBadget
            color={esDepartamento ? "purple" : "primary"}
            size="sm"
            variant={esDepartamento ? "outlined" : "filled"}
          >
            {esDepartamento ? t("loan.departamento") : t("loan.personal")}
          </ITBadget>
        </ITFlex>

        <Fields
          rows={[
            { label: t("loan.assignedTo"), value: asignadoA },
            { label: t("loan.since"), value: formatFecha(carta.fecha) },
            ...(esDepartamento
              ? [{ label: t("loan.employeeNo"), value: carta.numeroEmpleado || null }]
              : []),
            { label: t("loan.department"), value: carta.departamento },
            { label: t("loan.encargado"), value: carta.encargado?.name },
            { label: t("loan.deliveryBy"), value: carta.deliveryBy },
          ]}
        />
      </ITStack>
    </ITFlex>
  );
}

function Fields({ rows }: { rows: { label: string; value?: string | null }[] }) {
  return (
    <ITFlex direction="column" gap={4} className="w-full">
      {rows.map((f) => (
        <Field key={f.label} label={f.label} value={f.value} />
      ))}
    </ITFlex>
  );
}