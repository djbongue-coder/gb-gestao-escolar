import CrudPage from "@/components/CrudPage";

const config = {
  title: "Professores",
  description: "Gestão de corpo docente",
  listKey: "teachers",
  createKey: "teachers",
  updateKey: "teachers",
  deleteKey: "teachers",
  columns: [{"key": "fullName", "label": "Nome Completo", "type": "text", "required": true}, {"key": "phone", "label": "Telefone", "type": "text"}, {"key": "email", "label": "Email", "type": "text"}, {"key": "specialization", "label": "Especialização", "type": "text"}, {"key": "status", "label": "Estado", "type": "enum", "options": ["activo", "inactivo"]}, ],
};

export default function TeachersPage() {
  return <CrudPage config={config as any} />;
}
