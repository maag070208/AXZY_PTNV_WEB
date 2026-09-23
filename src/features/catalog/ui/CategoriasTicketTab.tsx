import { ticketsApi } from "@entities/ticket";
import SimpleCatalogTab from "./SimpleCatalogTab";

export default function CategoriasTicketTab({ openCreateSignal }: { openCreateSignal?: number }) {
  return (
    <SimpleCatalogTab
      list={ticketsApi.categories}
      create={ticketsApi.crearCategoria}
      update={ticketsApi.actualizarCategoria}
      remove={ticketsApi.eliminarCategoria}
      openCreateSignal={openCreateSignal}
    />
  );
}
