import { ITBadget, ITCard, ITFlex, ITGrid, ITInput, ITText } from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaSearch } from "react-icons/fa";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DeviceStatusBadge, type Device } from "@entities/device";

function CartaChip({ device }: { device: Device }) {
  const { t } = useTranslation(["locations"]);
  const active = device.cartaItems?.[0];
  if (!active) {
    return (
      <ITBadget color="gray" size="small">
        {t("detail.withoutCarta")}
      </ITBadget>
    );
  }
  const responsable: string | undefined =
    active.carta.responsable?.name ?? active.carta.encargado?.name ?? undefined;
  return (
    <ITFlex gap={2} wrap="wrap" align="center">
      <ITBadget color="success" size="small">
        {t("detail.withCarta")}
      </ITBadget>
      {responsable && (
        <span
          className="text-[11px] font-bold text-emerald-700 truncate max-w-[110px]"
          title={active.carta.consecutive}
        >
          {responsable}
        </span>
      )}
    </ITFlex>
  );
}

function DeviceRow({ device }: { device: Device }) {
  const navigate = useNavigate();
  return (
    <ITGrid item xs={12}>
      <div
        onClick={() => navigate(`/dispositivos/${device.id}`)}
        className="group cursor-pointer hover:bg-gradient-to-r hover:from-indigo-50/70 hover:to-transparent dark:hover:from-slate-800 rounded-xl px-3 py-2.5 -mx-3 transition-all"
      >
        <ITGrid container columns={12} spacing={1}>
          <ITGrid item xs={12} sm={2}>
            <ITFlex align="center" gap={1.5}>
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              <ITText className="font-mono font-bold text-[12px] text-blue-600">
                {device.controlActivos}
              </ITText>
            </ITFlex>
          </ITGrid>
          <ITGrid item xs={12} sm={2}>
            <ITText className="font-medium text-[12px] text-slate-700 dark:text-slate-200 leading-snug truncate block">
              {device.descripcion}
            </ITText>
          </ITGrid>
          <ITGrid item xs={6} sm={2}>
            <ITFlex align="center" gap={1}>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-300" />
              <ITText className="font-medium text-[12px] text-slate-500 truncate block">
                {device.type?.name ?? "—"}
              </ITText>
            </ITFlex>
          </ITGrid>
          <ITGrid item xs={6} sm={2}>
            <ITText className="font-mono text-[11px] text-slate-400 truncate block">
              {device.numeroSerie ?? "—"}
            </ITText>
          </ITGrid>
          <ITGrid item xs={6} sm={2}>
            <ITFlex justify="end" className="sm:justify-start">
              <DeviceStatusBadge estado={device.estado} loteCount={device.loteCount} />
            </ITFlex>
          </ITGrid>
          <ITGrid item xs={6} sm={2}>
            <ITFlex justify="end" className="sm:justify-start">
              <CartaChip device={device} />
            </ITFlex>
          </ITGrid>
        </ITGrid>
      </div>
    </ITGrid>
  );
}

export default function LocationDevicesCard({ devices }: { devices: Device[] }) {
  const { t } = useTranslation(["locations", "device"]);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return devices;
    return devices.filter((d) =>
      [
        d.controlActivos,
        d.descripcion,
        d.marca,
        d.modelo,
        d.numeroSerie,
        d.type?.name,
      ]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(term))
    );
  }, [devices, q]);

  const withCarta = devices.filter((d) => (d.cartaItems ?? []).length > 0).length;

  return (
    <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px]">
      <ITFlex justify="between" align="center" gap={3} wrap="wrap">
        <ITFlex align="center" gap={2}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200">
            <FaBoxOpen size={14} className="text-white" />
          </div>
          <ITText className="font-black uppercase tracking-widest text-[12px] text-slate-700">
            {t("detail.devicesTitle")}
          </ITText>
        </ITFlex>
        <ITFlex align="center" gap={3}>
          <span className="hidden sm:inline text-[11px] font-bold text-emerald-600">
            {withCarta} {t("detail.withCarta").toLowerCase()}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 text-slate-600 text-[11px] font-black">
            {q ? t("detail.devicesFound", { count: filtered.length, total: devices.length }) : devices.length}
          </span>
        </ITFlex>
      </ITFlex>

      <div className="mt-4 relative">
        <FaSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <ITInput
          name="deviceSearch"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("detail.searchDevices")}
          className="pl-9 w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40"
        />
      </div>

      {!filtered.length ? (
        <ITText className="text-[12px] font-bold text-slate-400 mt-4">
          {t("detail.noDevices")}
        </ITText>
      ) : (
        <ITGrid container columns={12} spacing={2} className="mt-4">
          <ITGrid item xs={12} container columns={12} className="px-3 hidden sm:grid">
            <ITGrid item xs={2}>
              <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {t("device:table.columnAsset")}
              </ITText>
            </ITGrid>
            <ITGrid item xs={2}>
              <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {t("device:table.columnDescription")}
              </ITText>
            </ITGrid>
            <ITGrid item xs={2}>
              <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {t("device:table.columnType")}
              </ITText>
            </ITGrid>
            <ITGrid item xs={2}>
              <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {t("detail.colSerie")}
              </ITText>
            </ITGrid>
            <ITGrid item xs={2}>
              <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {t("device:table.columnStatus")}
              </ITText>
            </ITGrid>
            <ITGrid item xs={2}>
              <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {t("detail.colCarta")}
              </ITText>
            </ITGrid>
          </ITGrid>
          {filtered.map((d) => (
            <DeviceRow key={d.id} device={d} />
          ))}
        </ITGrid>
      )}
    </ITCard>
  );
}