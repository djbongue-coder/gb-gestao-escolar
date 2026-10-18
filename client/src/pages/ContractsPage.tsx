import CrudPage from "@/components/CrudPage";

const config = {
  title: "Contratos",
  description: "Gestão de contratos de trabalho",
  listKey: "contracts",
  createKey: "contracts",
  updateKey: "contracts",
  deleteKey: "contracts",
  columns: [{"key": "employeeId", "label": "Funcionário ID", "type": "number"}, {"key": "type", "label": "Tipo", "type": "enum", "options": ["permanente", "temporario", "estagio", "consultoria"]}, {"key": "startDate", "label": "Data Início", "type": "date"}, {"key": "endDate", "label": "Data Fim", "type": "date"}, {"key": "salary", "label": "Salário", "type": "number"}, {"key": "status", "label": "Estado", "type": "enum", "options": ["activo", "expirado", "rescindido"]}, ],
};

export default function ContractsPage() {
  return <CrudPage config={config as any} />;
}
