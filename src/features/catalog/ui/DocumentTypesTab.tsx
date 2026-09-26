import { personalApi, type TipoDocumento } from "@entities/personal";
import SimpleCatalogTab from "./SimpleCatalogTab";

export default function TiposDocumentoTab({ openCreateSignal }: { openCreateSignal?: number }) {
  return (
    <SimpleCatalogTab<TipoDocumento>
      list={personalApi.documentTypes}
      create={personalApi.createDocumentType}
      update={personalApi.updateDocumentType}
      remove={personalApi.removeDocumentType}
      openCreateSignal={openCreateSignal}
    />
  );
}