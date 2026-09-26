import { personalApi } from "@entities/hr";
import SimpleCatalogTab from "./SimpleCatalogTab";

export default function GendersTab({ openCreateSignal }: { openCreateSignal?: number }) {
  return (
    <SimpleCatalogTab
      list={personalApi.genders}
      create={personalApi.createGender}
      update={personalApi.updateGender}
      remove={personalApi.deleteGender}
      openCreateSignal={openCreateSignal}
    />
  );
}