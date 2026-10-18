import CrudPage from "@/components/CrudPage";

const config = {
  title: "Tabela de Preços",
  description: "Gestão de tabelas de preços",
  listKey: "feeTables",
  createKey: "feeTables",
  updateKey: "feeTables",
  deleteKey: "feeTables",
  columns: [{"key": "classId", "label": "Classe ID", "type": "number"}, {"key": "type", "label": "Tipo", "type": "enum", "options": ["propina", "matricula", "uniforme", "material"]}, {"key": "amount", "label": "Valor", "type": "number", "required": true}, {"key": "description", "label": "Descrição", "type": "text"}, {"key": "academicYearId", "label": "Ano Lectivo ID", "type": "number"}, ],
};

export default function FeeTablesPage() {
  return <CrudPage config={config as any} />;
}
