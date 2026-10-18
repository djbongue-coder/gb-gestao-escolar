import CrudPage from "@/components/CrudPage";

const config = {
  title: "Manutenção",
  description: "Gestão de manutenção de equipamentos",
  listKey: "maintenanceRecords",
  createKey: "maintenanceRecords",
  updateKey: "maintenanceRecords",
  deleteKey: "maintenanceRecords",
  columns: [{"key": "assetId", "label": "Equipamento ID", "type": "number"}, {"key": "type", "label": "Tipo", "type": "enum", "options": ["preventiva", "correctiva", "preditiva"]}, {"key": "description", "label": "Descrição", "type": "text"}, {"key": "date", "label": "Data", "type": "date"}, {"key": "cost", "label": "Custo", "type": "number"}, {"key": "status", "label": "Estado", "type": "enum", "options": ["concluida", "em curso", "agendada"]}, {"key": "responsible", "label": "Responsável", "type": "text"}, ],
};

export default function MaintenancePage() {
  return <CrudPage config={config as any} />;
}
