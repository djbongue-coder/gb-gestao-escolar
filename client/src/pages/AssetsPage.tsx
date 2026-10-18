import CrudPage from "@/components/CrudPage";

const config = {
  title: "Equipamentos (Património)",
  description: "Gestão do património escolar",
  listKey: "assets",
  createKey: "assets",
  updateKey: "assets",
  deleteKey: "assets",
  columns: [{"key": "name", "label": "Nome", "type": "text", "required": true}, {"key": "category", "label": "Categoria", "type": "enum", "options": ["informatica", "mobiliario", "laboratorio", "desporto", "outro"]}, {"key": "serialNumber", "label": "Nº Série", "type": "text"}, {"key": "purchaseDate", "label": "Data Compra", "type": "date"}, {"key": "value", "label": "Valor", "type": "number"}, {"key": "status", "label": "Estado", "type": "enum", "options": ["activo", "inactivo", "manutencao", "abate"]}, {"key": "location", "label": "Localização", "type": "text"}, ],
};

export default function AssetsPage() {
  return <CrudPage config={config as any} />;
}
