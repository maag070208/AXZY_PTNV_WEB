import { useState } from "react";
import { ITButton, ITFlex, ITGrid, ITStack, ITText } from "@axzydev/axzy_ui_system";
import {
  FaBuilding,
  FaTint,
  FaFileAlt,
  FaMicrochip,
  FaNetworkWired,
  FaVenusMars,
  FaEnvelope,
  FaTags,
  FaPlus,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { DepartamentosPanel } from "@widgets/catalog/departamentos";
import { SubareasPanel } from "@widgets/catalog/subareas";
import {
  TiposDispositivoTab,
  TiposDocumentoTab,
  GenerosTab,
  TiposSangreTab,
  CategoriasTicketTab,
} from "@features/catalog";
import { SysConfigTab } from "@features/sys-config";

export default function CatalogTabs() {
  const { t } = useTranslation("catalog");
  const [createSignal, setCreateSignal] = useState(0);
  const [active, setActive] = useState("departamentos");

  const items = [
    { id: "departamentos", label: t("tabs.departamentos"), icon: <FaBuilding size={12} />, canCreate: true, content: <DepartamentosPanel openCreateSignal={createSignal} /> },
    { id: "subareas", label: t("tabs.subareas"), icon: <FaNetworkWired size={12} />, canCreate: true, content: <SubareasPanel openCreateSignal={createSignal} /> },
    { id: "tiposDispositivo", label: t("tabs.tiposDispositivo"), icon: <FaMicrochip size={12} />, canCreate: true, content: <TiposDispositivoTab openCreateSignal={createSignal} /> },
    { id: "tiposDocumento", label: t("tabs.tiposDocumento"), icon: <FaFileAlt size={12} />, canCreate: true, content: <TiposDocumentoTab openCreateSignal={createSignal} /> },
    { id: "generos", label: t("tabs.generos"), icon: <FaVenusMars size={12} />, canCreate: true, content: <GenerosTab openCreateSignal={createSignal} /> },
    { id: "tiposSangre", label: t("tabs.tiposSangre"), icon: <FaTint size={12} />, canCreate: true, content: <TiposSangreTab openCreateSignal={createSignal} /> },
    { id: "categoriasTicket", label: t("tabs.categoriasTicket"), icon: <FaTags size={12} />, canCreate: true, content: <CategoriasTicketTab openCreateSignal={createSignal} /> },
    { id: "notificaciones", label: t("tabs.notificaciones"), icon: <FaEnvelope size={12} />, canCreate: false, content: <SysConfigTab /> },
  ];

  const groups = [
    { id: "organizacion", label: t("groups.organizacion"), ids: ["departamentos", "subareas"] },
    { id: "inventario", label: t("groups.inventario"), ids: ["tiposDispositivo"] },
    { id: "personal", label: t("groups.personal"), ids: ["tiposDocumento", "generos", "tiposSangre"] },
    { id: "tickets", label: t("groups.tickets"), ids: ["categoriasTicket"] },
    { id: "sistema", label: t("groups.sistema"), ids: ["notificaciones"] },
  ];

  const current = items.find((item) => item.id === active) ?? items[0];

  return (
    <ITGrid container columns={12} spacing={5} className="items-start">
      <ITGrid item xs={8} sm={9} md={9} className="flex min-w-0 flex-col gap-5">
        {current.content}
      </ITGrid>

      <ITGrid item xs={4} sm={3} md={3} className="min-w-0">
        <ITStack
          as="nav"
          direction="column"
          spacing={0}
          className="sticky top-24 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-200/50"
        >
          {current.canCreate && (
            <ITButton
              variant="filled"
              color="primary"
              size="lg"
              onClick={() => setCreateSignal((n) => n + 1)}
              className="mb-1 w-full"
            >
              <ITFlex align="center" justify="center" gap={1}>
                <FaPlus size={11} />
                <ITText className="font-bold text-[11px]">{t("new")}</ITText>
              </ITFlex>
            </ITButton>
          )}

          {groups.map((group) => (
            <ITStack key={group.id} direction="column" spacing={0}>
              <ITText
                as="p"
                className="px-2.5 pb-1 pt-3 text-[9px] font-black uppercase tracking-widest text-slate-400"
              >
                {group.label}
              </ITText>

              {group.ids.map((id) => {
                const item = items.find((i) => i.id === id);
                if (!item) return null;
                const isActive = item.id === active;
                return (
                  <ITFlex
                    key={item.id}
                    as="button"
                    align="center"
                    gap={2.5}
                    onClick={() => setActive(item.id)}
                    className={`group w-full rounded-lg px-2.5 py-2 text-left text-[12px] font-semibold transition-colors ${
                      isActive
                        ? "bg-[#0D5777]/10 text-[#0D5777]"
                        : "text-slate-600 hover:bg-[#0D5777]/5"
                    }`}
                  >
                    <ITFlex
                      align="center"
                      justify="center"
                      className={`h-6 w-6 shrink-0 rounded-md transition-colors ${
                        isActive
                          ? "bg-[#0D5777] text-white"
                          : "bg-slate-100 text-slate-500 group-hover:bg-[#0D5777]/10 group-hover:text-[#0D5777]"
                      }`}
                    >
                      {item.icon}
                    </ITFlex>
                    <ITText className="truncate">{item.label}</ITText>
                    {isActive && (
                      <ITFlex className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[#0D5777]" />
                    )}
                  </ITFlex>
                );
              })}
            </ITStack>
          ))}
        </ITStack>
      </ITGrid>
    </ITGrid>
  );
}
