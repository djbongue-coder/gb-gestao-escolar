import CrudPage from "@/components/CrudPage";

const config = {
  title: "Disciplinas",
  description: "Gestão de disciplinas (Currículo do Ministério da Educação de Angola)",
  listKey: "subjects",
  createKey: "subjects",
  updateKey: "subjects",
  deleteKey: "subjects",
  columns: [
    {"key": "name", "label": "Nome da Disciplina", "type": "text", "required": true},
    {"key": "educationLevel", "label": "Nível de Ensino", "type": "enum", "options": ["PRE", "PRIM", "SEC1", "SEC2"]},
    {"key": "courseId", "label": "Curso ID", "type": "number"},
    {"key": "classId", "label": "Classe ID", "type": "number"},
    {"key": "teacherId", "label": "Professor ID", "type": "number"},
    {"key": "weeklyHours", "label": "Horas Semanais", "type": "number"},
  ],
};

export default function SubjectsPage() {
  return <CrudPage config={config as any} />;
}
