import {
  ITBadget,
  ITCard,
  ITDialog,
  ITFlex,
  ITLoader,
  ITStack,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaArrowRight, FaMapMarkerAlt } from "react-icons/fa";
import { formatLocation } from "@entities/location";
import type { UseLocations } from "../model/useLocations";

export default function LocationDevicesDialog({ fx }: { fx: UseLocations }) {
  return (
    <ITDialog
      isOpen={fx.showDevicesDialog}
      onClose={() => fx.setShowDevicesDialog(false)}
      title={fx.t("locations.devicesIn", {
        loc: fx.devicesLocation ? formatLocation(fx.devicesLocation) : "",
      })}
    >
      {fx.loadingDevices ? (
        <ITFlex justify="center" align="center" className="py-8">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      ) : fx.locationDevices.length === 0 ? (
        <ITFlex direction="column" align="center" gap={2} className="py-8">
          <FaMapMarkerAlt size={32} className="text-slate-300" />
          <ITText className="text-slate-500 text-sm">
            {fx.t("locations.noDevices")}
          </ITText>
        </ITFlex>
      ) : (
        <ITStack direction="column" spacing={2}>
          {fx.locationDevices.map((dev) => (
            <ITCard
              key={dev.id}
              className="p-3 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                fx.setShowDevicesDialog(false);
                fx.navigate(`/dispositivos/${dev.id}`);
              }}
            >
              <ITFlex align="center" justify="between">
                <ITFlex direction="column" gap={0.5}>
                  <ITText className="text-[12px] font-bold text-slate-800">
                    {dev.controlActivos}
                  </ITText>
                  <ITText className="text-[11px] text-slate-500">
                    {dev.descripcion} · {dev.marca} {dev.modelo}
                  </ITText>
                </ITFlex>
                <ITFlex align="center" gap={1}>
                  <ITBadget
                    color={
                      dev.estado === "DISPONIBLE"
                        ? "success"
                        : dev.estado === "ASIGNADO"
                        ? "warning"
                        : "gray"
                    }
                    size="small"
                  >
                    {dev.estado}
                  </ITBadget>
                  <FaArrowRight size={12} className="text-slate-400" />
                </ITFlex>
              </ITFlex>
            </ITCard>
          ))}
        </ITStack>
      )}
    </ITDialog>
  );
}