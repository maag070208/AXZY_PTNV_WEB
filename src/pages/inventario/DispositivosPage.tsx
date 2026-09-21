import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ITBadget, ITButton, ITDataTable, ITFlex, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaPlus } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { inventarioApi, type Dispositivo, type TipoDispositivo } from "@entities/inventario";

export default function DispositivosPage() {
  const { t } = useTranslation(["inventario", "common"]);
  const navigate = useNavigate();
  const [tipos, setTipos] = useState<TipoDispositivo[]>([]);

  useEffect(() => {
    inventarioApi.tipos().then(setTipos);
  }, []);

  const fetchData = useMemo(
    () => makeClientTableFetch<Dispositivo>(() => inventarioApi.dispositivos({ existencias: true })),
    []
  );
  const tiposActivos = useMemo(() => tipos.filter((x) => x.active), [tipos]);

  const columns: any[] = [
    {
      type: "string",
      key: "nombre",
      label: t("dispositivos.colNombre"),
      sortable: false,
      filter: true,
      render: (d: Dispositivo) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[11px] font-bold text-slate-800">{d.nombre}</ITText>
          <ITText className="text-[10px] text-slate-400">{d.marca} {d.modelo}</ITText>
        </ITFlex>
      ),
    },
    {
      type: "string",
      key: "tipoId",
      label: t("dispositivos.colTipo"),
      filter: "catalog" as const,
      catalogOptions: {
        data: tiposActivos,
        loading: false,
        error: false,
      },
      render: (d: Dispositivo) => <ITBadget color="gray" size="lg">{d.tipo?.name ?? ""}</ITBadget>,
    },
    {
      type: "number",
      key: "disp",
      label: t("dispositivos.colDisp"),
      sortable: false,
      render: (d: Dispositivo) => <ITText className="text-[11px] font-bold text-emerald-600">{d.existencias?.DISPONIBLE ?? 0}</ITText>,
    },
    {
      type: "number",
      key: "prest",
      label: t("dispositivos.colPrest"),
      sortable: false,
      render: (d: Dispositivo) => <ITText className="text-[11px] font-bold text-amber-600">{d.existencias?.PRESTADO ?? 0}</ITText>,
    },
    {
      type: "number",
      key: "baja",
      label: t("dispositivos.colBaja"),
      sortable: false,
      render: (d: Dispositivo) => <ITText className="text-[11px] font-bold text-red-500">{d.existencias?.BAJA ?? 0}</ITText>,
    },
    {
      type: "number",
      key: "total",
      label: t("dispositivos.colTotal"),
      sortable: false,
      render: (d: Dispositivo) => <ITText className="text-[11px] font-black text-slate-800">{d.existencias?.total ?? 0}</ITText>,
    },
    {
      type: "string",
      key: "accion",
      label: "",
      render: (d: Dispositivo) => (
        <ITButton variant="outlined" color="primary" size="lg" onClick={() => navigate(`/inventario/dispositivos/${d.id}`)}>
          <ITText className="font-bold text-[10px]">{t("common:actions.view")}</ITText>
        </ITButton>
      ),
    },
  ];

  return (
    <ITPage
      title={t("dispositivos.title")}
      description={t("dispositivos.description")}
      icon={<FaBoxOpen size={20} />}
      breadcrumbs={[{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("dashboard.title"), onClick: () => navigate("/inventario") }, { label: t("dispositivos.title") }]}
      backAction={() => navigate("/inventario")}
      actions={
        <ITButton variant="filled" color="primary" onClick={() => navigate("/inventario/dispositivos/nuevo")}>
          <ITFlex align="center" gap={1}>
            <FaPlus size={12} />
            <ITText className="font-bold text-[11px]">{t("dispositivos.new")}</ITText>
          </ITFlex>
        </ITButton>
      }
    >
      <ITDataTable
        columns={columns as any}
        fetchData={fetchData as any}
        defaultItemsPerPage={10}
        itemsPerPageOptions={[5, 10, 50]}
        size="lg"
      />
    </ITPage>
  );
}