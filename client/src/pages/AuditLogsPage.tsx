import CrudPage from "@/components/CrudPage";

const config = {
  title: "Auditoria",
  description: "Registo de actividades do sistema",
  listKey: "auditLogs",
  createKey: "auditLogs",
  updateKey: "auditLogs",
  deleteKey: "auditLogs",
  columns: [{"key": "action", "label": "Acção", "type": "text"}, {"key": "entity", "label": "Entidade", "type": "text"}, {"key": "entityId", "label": "ID Entidade", "type": "number"}, {"key": "userId", "label": "Utilizador ID", "type": "number"}, {"key": "details", "label": "Detalhes", "type": "text"}, {"key": "createdAt", "label": "Data", "type": "date"}, ],
};

export default function AuditLogsPage() {
  return <CrudPage config={config as any} />;
}
