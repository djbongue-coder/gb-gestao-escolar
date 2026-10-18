import CrudPage from "@/components/CrudPage";

const config = {
  title: "Províncias de Angola",
  description: "As 18 províncias oficiais de Angola",
  listKey: "angolaProvinces",
  createKey: "angolaProvinces",
  updateKey: "angolaProvinces",
  deleteKey: "angolaProvinces",
  columns: [
    {"key": "name", "label": "Nome da Província", "type": "text", "required": true},
  ],
};

export default function ProvincesPage() {
  return <CrudPage config={config as any} />;
}
