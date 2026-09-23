import { personalApi } from "@entities/personal";
import SimpleCatalogTab from "./SimpleCatalogTab";

export default function GenerosTab({ openCreateSignal }: { openCreateSignal?: number }) {
  return (
    <SimpleCatalogTab
      list={personalApi.generos}
      create={personalApi.crearGenero}
      update={personalApi.actualizarGenero}
      remove={personalApi.eliminarGenero}
      openCreateSignal={openCreateSignal}
    />
  );
}