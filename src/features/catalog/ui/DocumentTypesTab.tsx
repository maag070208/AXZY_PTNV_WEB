import { personalApi, type DocumentType } from "@entities/hr";
import SimpleCatalogTab from "./SimpleCatalogTab";

export default function DocumentTypesTab({ openCreateSignal }: { openCreateSignal?: number }) {
  return (
    <SimpleCatalogTab<DocumentType>
      list={personalApi.documentTypes}
      create={personalApi.createDocumentType}
      update={personalApi.updateDocumentType}
      remove={personalApi.removeDocumentType}
      openCreateSignal={openCreateSignal}
    />
  );
}