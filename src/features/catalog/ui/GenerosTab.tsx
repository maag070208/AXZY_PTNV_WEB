import { personalApi } from "@entities/personal";
import SimpleCatalogTab from "./SimpleCatalogTab";

export default function GenerosTab() {
  return (
    <SimpleCatalogTab
      list={personalApi.generos}
      create={personalApi.crearGenero}
      update={personalApi.actualizarGenero}
      remove={personalApi.eliminarGenero}
    />
  );
}