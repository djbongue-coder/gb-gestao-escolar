import CrudPage from "@/components/CrudPage";

const config = {
  title: "Notificações / Comunicação",
  description: "Sistema de notificações e comunicação",
  listKey: "notifications",
  createKey: "notifications",
  updateKey: "notifications",
  deleteKey: "notifications",
  columns: [{"key": "title", "label": "Título", "type": "text", "required": true}, {"key": "message", "label": "Mensagem", "type": "text"}, {"key": "type", "label": "Tipo", "type": "enum", "options": ["geral", "aluno", "professor", "encarregado", "funcionario"]}, {"key": "priority", "label": "Prioridade", "type": "enum", "options": ["baixa", "media", "alta", "urgente"]}, {"key": "read", "label": "Lida", "type": "boolean"}, {"key": "recipientId", "label": "Destinatário ID", "type": "number"}, ],
};

export default function NotificationsPage() {
  return <CrudPage config={config as any} />;
}
