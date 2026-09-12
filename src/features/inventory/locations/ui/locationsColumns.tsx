import { ITBadget, ITButton, ITCard, ITFlex, ITStack, ITText } from "@axzydev/axzy_ui_system";
import { FaEdit, FaEye, FaMapMarkerAlt, FaTrash } from "react-icons/fa";
import { formatLocation } from "@entities/location";
import type { Location } from "@entities/location";
import type { UseLocations } from "../model/useLocations";

export const buildLocationsColumns = (fx: UseLocations) => [
  {
    type: "string" as const,
    key: "ubicacion",
    label: fx.t("locations.colUbicacion"),
    sortable: false,
    filter: true,
    render: (row: Location) => (
      <ITFlex align="center" gap={2}>
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
          <FaMapMarkerAlt size={12} className="text-blue-500" />
        </div>
        <ITText className="text-[12px] font-bold text-slate-800">
          {formatLocation(row)}
        </ITText>
      </ITFlex>
    ),
  },
  {
    type: "string" as const,
    key: "descripcion",
    label: fx.t("locations.colDescripcion"),
    sortable: false,
    render: (row: Location) => (
      <ITText className="text-[11px] text-slate-500">
        {row.descripcion || "—"}
      </ITText>
    ),
  },
  {
    type: "string" as const,
    key: "lugar",
    label: fx.t("locations.colLugar"),
    sortable: false,
    filter: true,
    render: (row: Location) =>
      row.lugar ? (
        <ITBadget color="primary" size="small">
          {row.lugar}
        </ITBadget>
      ) : (
        <ITText className="text-[11px] text-slate-400">—</ITText>
      ),
  },
  {
    type: "string" as const,
    key: "subLugar",
    label: fx.t("locations.colSubLugar"),
    sortable: false,
    render: (row: Location) =>
      row.subLugar ? (
        <ITBadget color="info" size="small">
          {row.subLugar}
        </ITBadget>
      ) : (
        <ITText className="text-[11px] text-slate-400">—</ITText>
      ),
  },
  {
    type: "string" as const,
    key: "numero",
    label: fx.t("locations.colNumero"),
    sortable: false,
    render: (row: Location) =>
      row.numero ? (
        <ITBadget color="secondary" size="small">
          #{row.numero}
        </ITBadget>
      ) : (
        <ITText className="text-[11px] text-slate-400">—</ITText>
      ),
  },
  {
    type: "string" as const,
    key: "devices",
    label: fx.t("locations.colDevices"),
    sortable: false,
    render: (row: Location) => (
      <ITFlex align="center" gap={1}>
        <ITText className="text-[12px] font-bold text-slate-700">
          {row._count?.devices ?? 0}
        </ITText>
      </ITFlex>
    ),
  },
  {
    type: "actions" as const,
    key: "actions",
    label: "",
    align: "right" as const,
    render: (row: Location) => (
      <ITFlex gap={1}>
        <ITButton
          size="small"
          variant="outlined"
          color="secondary"
          onClick={() => fx.openDevicesDialog(row)}
          title={fx.t("locations.viewDevices")}
        >
          <FaEye size={12} />
        </ITButton>
        {fx.isAdmin && (
          <>
            <ITButton
              size="small"
              variant="outlined"
              onClick={() => fx.openEdit(row)}
              title={fx.t("locations.edit")}
            >
              <FaEdit size={12} />
            </ITButton>
            <ITButton
              size="small"
              variant="outlined"
              color="danger"
              onClick={() => fx.setLocToDelete(row)}
              title={fx.t("locations.remove")}
            >
              <FaTrash size={12} />
            </ITButton>
          </>
        )}
      </ITFlex>
    ),
  },
];

export const buildLocationCard = (fx: UseLocations) => (row: Location) => (
  <ITCard className="p-4">
    <ITStack direction="column" spacing={2}>
      <ITFlex align="center" justify="between">
        <ITFlex align="center" gap={2}>
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <FaMapMarkerAlt size={12} className="text-blue-500" />
          </div>
          <ITText className="font-bold text-slate-800">{formatLocation(row)}</ITText>
        </ITFlex>
        <ITFlex gap={1}>
          <ITButton
            size="small"
            variant="outlined"
            color="secondary"
            onClick={() => fx.openDevicesDialog(row)}
            title={fx.t("locations.viewDevices")}
          >
            <FaEye size={12} />
          </ITButton>
          {fx.isAdmin && (
            <>
              <ITButton size="small" variant="outlined" onClick={() => fx.openEdit(row)}>
                <FaEdit size={12} />
              </ITButton>
              <ITButton
                size="small"
                variant="outlined"
                color="danger"
                onClick={() => fx.setLocToDelete(row)}
              >
                <FaTrash size={12} />
              </ITButton>
            </>
          )}
        </ITFlex>
      </ITFlex>
      {row.descripcion && (
        <ITText className="text-[11px] text-slate-500">{row.descripcion}</ITText>
      )}
      <ITFlex align="center" gap={1}>
        <ITText className="text-[11px] text-slate-400">
          {fx.t("locations.deviceCount", { count: row._count?.devices ?? 0 })}
        </ITText>
      </ITFlex>
      <ITFlex gap={1} wrap="wrap">
        {row.lugar && (
          <ITBadget color="primary" size="small">
            {row.lugar}
          </ITBadget>
        )}
        {row.subLugar && (
          <ITBadget color="info" size="small">
            {row.subLugar}
          </ITBadget>
        )}
        {row.numero && (
          <ITBadget color="secondary" size="small">
            #{row.numero}
          </ITBadget>
        )}
      </ITFlex>
    </ITStack>
  </ITCard>
);