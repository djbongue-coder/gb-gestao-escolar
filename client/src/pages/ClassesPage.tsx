import CrudPage from "@/components/CrudPage";

const config = {
  title: "Classes",
  description: "Gestão de turmas/classes",
  listKey: "classes",
  createKey: "classes",
  updateKey: "classes",
  deleteKey: "classes",
  columns: [{"key": "name", "label": "Nome da Classe", "type": "text", "required": true}, {"key": "courseId", "label": "Curso ID", "type": "number"}, {"key": "academicYearId", "label": "Ano Lectivo ID", "type": "number"}, {"key": "maxStudents", "label": "Máx. Alunos", "type": "number"}, ],
};

export default function ClassesPage() {
  return <CrudPage config={config as any} />;
}
