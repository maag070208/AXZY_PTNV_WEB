import { ticketsApi } from "@entities/ticket";
import SimpleCatalogTab from "./SimpleCatalogTab";

export default function TicketCategoriesTab({ openCreateSignal }: { openCreateSignal?: number }) {
  return (
    <SimpleCatalogTab
      list={ticketsApi.categories}
      create={ticketsApi.createCategory}
      update={ticketsApi.updateCategory}
      remove={ticketsApi.deleteCategory}
      openCreateSignal={openCreateSignal}
    />
  );
}
