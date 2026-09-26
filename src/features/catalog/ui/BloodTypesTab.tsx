import { personalApi } from "@entities/hr";
import SimpleCatalogTab from "./SimpleCatalogTab";

export default function BloodTypesTab({ openCreateSignal }: { openCreateSignal?: number }) {
  return (
    <SimpleCatalogTab
      list={personalApi.bloodTypes}
      create={personalApi.createBloodType}
      update={personalApi.updateBloodType}
      remove={personalApi.deleteBloodType}
      openCreateSignal={openCreateSignal}
    />
  );
}