import CrudPage from "@/components/CrudPage";

const config = {
  title: "Planos de Aula",
  description: "Gestão de planos de aula dos professores",
  listKey: "lessonPlans",
  createKey: "lessonPlans",
  updateKey: "lessonPlans",
  deleteKey: "lessonPlans",
  columns: [{"key": "teacherId", "label": "Professor ID", "type": "number"}, {"key": "subjectId", "label": "Disciplina ID", "type": "number"}, {"key": "classId", "label": "Classe ID", "type": "number"}, {"key": "date", "label": "Data", "type": "date"}, {"key": "topic", "label": "Tema", "type": "text", "required": true}, {"key": "objectives", "label": "Objectivos", "type": "text"}, {"key": "status", "label": "Estado", "type": "enum", "options": ["planeado", "executado", "cancelado"]}, ],
};

export default function LessonPlansPage() {
  return <CrudPage config={config as any} />;
}
