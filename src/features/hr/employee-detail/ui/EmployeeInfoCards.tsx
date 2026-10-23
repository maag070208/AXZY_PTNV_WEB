import { useTranslation } from "react-i18next";
import { FaFileInvoiceDollar, FaHeartbeat, FaMapMarkerAlt, FaPhoneAlt, FaUser } from "react-icons/fa";
import { ITProgress } from "@axzydev/axzy_ui_system";
import type { PersonalProfile } from "@entities/hr";

const formatDateOnly = (iso?: string | null): string => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

type Item = { label: string; value?: string | null; wide?: boolean };

function Cell({ item }: { item: Item }) {
  const { t: tt } = useTranslation(["employees"]);
  const has = !!item.value?.trim();
  return (
    <div className={item.wide ? "sm:col-span-2" : ""}>
      <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</dt>
      <dd className={`mt-0.5 break-words text-sm ${has ? "font-semibold text-slate-900" : "italic text-slate-300"}`}>
        {has ? item.value : tt("detail.noData")}
      </dd>
    </div>
  );
}

function InfoCard({ icon, tone, title, items }: { icon: React.ReactNode; tone: string; title: string; items: Item[] }) {
  const filled = items.filter((i) => i.value?.trim()).length;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>{icon}</span>
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-700">{title}</h3>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${filled === items.length ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
          {filled}/{items.length}
        </span>
      </header>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        {items.map((i) => (
          <Cell key={i.label} item={i} />
        ))}
      </dl>
    </section>
  );
}

interface Props {
  profile: PersonalProfile;
}

/**
 * Datos del empleado por tema. No repite lo que ya muestra el encabezado (nombre, número, puesto,
 * departamento, rol, ingreso): aquí va solo lo que falta para tener el expediente completo.
 */
export default function EmployeeInfoCards({ profile }: Props) {
  const { t: tt } = useTranslation(["employees"]);
  const f = tt("detail.fields", { returnObjects: true }) as Record<string, string>;
  const sg = tt("detail.subGroups", { returnObjects: true }) as Record<string, string>;

  const groups = [
    { icon: <FaUser size={14} />, tone: "bg-indigo-50 text-indigo-600", title: sg.identification, items: [
      { label: f.secondName, value: profile.middleName },
      { label: f.paternalSurname, value: profile.paternalSurname },
      { label: f.maternalSurname, value: profile.maternalSurname },
      { label: f.birthDate, value: formatDateOnly(profile.birthDate) },
      { label: f.gender, value: profile.gender?.name },
    ] },
    { icon: <FaPhoneAlt size={14} />, tone: "bg-sky-50 text-sky-600", title: sg.contact, items: [
      { label: f.personalCell, value: profile.personalPhone },
      { label: f.companyCell, value: profile.workPhone },
      { label: f.email, value: profile.email, wide: true },
      { label: f.emergencyContact, value: profile.emergencyContactName },
      { label: f.emergencyPhone, value: profile.emergencyContactPhone },
      { label: f.emergencyRelation, value: profile.emergencyContactRelationship },
    ] },
    { icon: <FaMapMarkerAlt size={14} />, tone: "bg-orange-50 text-orange-600", title: sg.address, items: [
      { label: f.street, value: profile.streetAddress, wide: true },
      { label: f.colony, value: profile.neighborhood },
      { label: f.zip, value: profile.postalCode },
      { label: f.city, value: profile.city },
      { label: f.state, value: profile.addressState },
      { label: f.country, value: profile.country },
    ] },
    { icon: <FaFileInvoiceDollar size={14} />, tone: "bg-emerald-50 text-emerald-600", title: sg.fiscal, items: [
      { label: f.rfc, value: profile.rfc },
      { label: f.curp, value: profile.curp },
      { label: f.nss, value: profile.nss },
    ] },
    { icon: <FaHeartbeat size={14} />, tone: "bg-rose-50 text-rose-600", title: tt("detail.medicalTitle"), items: [
      { label: f.bloodType, value: profile.bloodType?.name },
      { label: f.condition, value: profile.medicalConditions },
      { label: f.allergies, value: profile.allergies, wide: true },
    ] },
  ];
  const all = groups.flatMap((g) => g.items);
  const filled = all.filter((i) => i.value?.trim()).length;
  const percent = Math.round((filled / all.length) * 100);

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-wrap items-center gap-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="min-w-[240px] flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{tt("detail.completeness")}</p>
          <p className="mt-1 text-3xl font-black text-slate-900">
            {filled}
            <span className="text-lg font-semibold text-slate-400"> / {all.length}</span>
          </p>
          <ITProgress value={percent} color={percent === 100 ? "success" : "primary"} size="lg" className="mt-3" />
        </div>
        <p className="max-w-sm text-sm text-slate-500">{tt("detail.completenessHint")}</p>
      </section>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {groups.map((g) => (
          <InfoCard key={g.title} icon={g.icon} tone={g.tone} title={g.title} items={g.items} />
        ))}
      </div>
    </div>
  );
}
