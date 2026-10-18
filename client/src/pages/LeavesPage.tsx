import CrudPage from "@/components/CrudPage";

const config = {
  title: "Férias / Licenças",
  description: "Gestão de férias e licenças",
  listKey: "leaves",
  createKey: "leaves",
  updateKey: "leaves",
  deleteKey: "leaves",
  columns: [{"key": "employeeId", "label": "Funcionário ID", "type": "number"}, {"key": "type", "label": "Tipo", "type": "enum", "options": ["ferias", "doenca", "maternidade", "paternidade", "luto", "outro"]}, {"key": "startDate", "label": "Data Início", "type": "date"}, {"key": "endDate", "label": "Data Fim", "type": "date"}, {"key": "status", "label": "Estado", "type": "enum", "options": ["aprovado", "pendente", "rejeitado"]}, {"key": "reason", "label": "Motivo", "type": "text"}, ],
};

export default function LeavesPage() {
  return <CrudPage config={config as any} />;
}
