import { ITBadget, ITCard, ITFlex, ITGrid, ITText } from "@axzydev/axzy_ui_system";
import { FaChevronRight, FaFileSignature } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatFecha } from "@shared/utils/dates";
import type { LocationCarta } from "@entities/location";

function initials(name?: string) {
  if (!name) return "—";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

const AVATAR_GRADIENTS = [
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-violet-500 to-purple-600",
  "from-blue-500 to-indigo-600",
  "from-rose-500 to-pink-600",
];

function CartaRow({ carta, index }: { carta: LocationCarta; index: number }) {
  const navigate = useNavigate();
  const { t } = useTranslation(["locations"]);
  const responsable: string | undefined =
    carta.responsable?.name ?? carta.encargado?.name ?? undefined;
  const devuelta = !!carta.returnDate;
  const grad = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];

  return (
    <ITGrid item xs={12}>
      <div
        onClick={() => navigate(`/cartas/${carta.id}`)}
        className="group cursor-pointer hover:bg-gradient-to-r hover:from-indigo-50/70 hover:to-transparent dark:hover:from-slate-800 rounded-xl px-3 py-3 -mx-3 transition-all"
      >
        <ITGrid container columns={12} spacing={1}>
          <ITGrid item xs={12} sm={3}>
            <ITFlex align="center" gap={2}>
              <div
                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm shrink-0`}
              >
                <FaFileSignature size={12} className="text-white" />
              </div>
              <ITFlex direction="column" gap={0}>
                <ITText className="font-mono font-bold text-[12px] text-blue-600 leading-none">
                  {carta.consecutive}
                </ITText>
                <ITText className="text-[10px] text-slate-400 mt-0.5">
                  {formatFecha(carta.fecha)}
                </ITText>
              </ITFlex>
            </ITFlex>
          </ITGrid>
          <ITGrid item xs={6} sm={3}>
            <ITFlex align="center" gap={2}>
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center truncate">
                <ITText className="text-[8px] font-black text-slate-600 dark:text-slate-200">
                  {initials(responsable)}
                </ITText>
              </div>
              <ITText className="font-medium text-[12px] text-slate-700 dark:text-slate-200 truncate">
                {responsable ?? "—"}
              </ITText>
            </ITFlex>
          </ITGrid>
          <ITGrid item xs={6} sm={3}>
            <ITFlex wrap="wrap" gap={1}>
              {carta.items.slice(0, 3).map((it) => (
                <span
                  key={it.id}
                  className="font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700"
                >
                  {it.device?.controlActivos ?? it.controlActivos}
                </span>
              ))}
              {carta.items.length > 3 && (
                <span className="font-black text-[10px] text-slate-400 px-1">
                  +{carta.items.length - 3}
                </span>
              )}
            </ITFlex>
          </ITGrid>
          <ITGrid item xs={6} sm={2}>
            <ITFlex justify="end" className="sm:justify-start">
              <ITBadget color={devuelta ? "gray" : "success"} size="small">
                {devuelta ? t("detail.returned") : t("detail.active")}
              </ITBadget>
            </ITFlex>
          </ITGrid>
          <ITGrid item xs={6} sm={1}>
            <ITFlex justify="end">
              <FaChevronRight
                size={11}
                className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all"
              />
            </ITFlex>
          </ITGrid>
        </ITGrid>
      </div>
    </ITGrid>
  );
}

export default function LocationCartasCard({ cartas }: { cartas: LocationCarta[] }) {
  const { t } = useTranslation(["locations", "device"]);
  return (
    <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px]">
      <ITFlex justify="between" align="center" gap={3} wrap="wrap">
        <ITFlex align="center" gap={2}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-200">
            <FaFileSignature size={14} className="text-white" />
          </div>
          <ITText className="font-black uppercase tracking-widest text-[12px] text-slate-700">
            {t("detail.cartasTitle")}
          </ITText>
        </ITFlex>
        <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-600 text-[11px] font-black">
          {cartas.length}
        </span>
      </ITFlex>

      {!cartas.length ? (
        <ITText className="text-[12px] font-bold text-slate-400 mt-4">
          {t("detail.noCartas")}
        </ITText>
      ) : (
        <ITGrid container columns={12} spacing={2} className="mt-4">
          {cartas.map((c, i) => (
            <CartaRow key={c.id} carta={c} index={i} />
          ))}
        </ITGrid>
      )}
    </ITCard>
  );
}