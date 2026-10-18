import CrudPage from "@/components/CrudPage";

const config = {
  title: "Salas",
  description: "Gestão de salas e espaços",
  listKey: "classrooms",
  createKey: "classrooms",
  updateKey: "classrooms",
  deleteKey: "classrooms",
  columns: [{"key": "name", "label": "Nome da Sala", "type": "text", "required": true}, {"key": "capacity", "label": "Capacidade", "type": "number"}, {"key": "type", "label": "Tipo", "type": "enum", "options": ["sala_aula", "laboratorio", "biblioteca", "auditorio", "gabinete", "outro"]}, {"key": "status", "label": "Estado", "type": "enum", "options": ["disponivel", "ocupada", "manutencao"]}, ],
};

export default function ClassroomsPage() {
  return <CrudPage config={config as any} />;
}
