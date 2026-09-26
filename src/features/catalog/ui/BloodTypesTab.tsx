import { personalApi } from "@entities/personal";
import SimpleCatalogTab from "./SimpleCatalogTab";

export default function TiposSangreTab({ openCreateSignal }: { openCreateSignal?: number }) {
  return (
    <SimpleCatalogTab
      list={personalApi.tiposSangre}
      create={personalApi.crearTipoSangre}
      update={personalApi.actualizarTipoSangre}
      remove={personalApi.eliminarTipoSangre}
      openCreateSignal={openCreateSignal}
    />
  );
}