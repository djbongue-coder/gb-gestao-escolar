import CrudPage from "@/components/CrudPage";

const config = {
  title: "Resultados Finais",
  description: "Resultados finais dos alunos",
  listKey: "finalResults",
  createKey: "finalResults",
  updateKey: "finalResults",
  deleteKey: "finalResults",
  columns: [{"key": "studentId", "label": "Aluno ID", "type": "number"}, {"key": "classId", "label": "Classe ID", "type": "number"}, {"key": "subjectId", "label": "Disciplina ID", "type": "number"}, {"key": "finalScore", "label": "Nota Final", "type": "number"}, {"key": "status", "label": "Estado", "type": "enum", "options": ["aprovado", "reprovado", "em curso"]}, {"key": "academicYearId", "label": "Ano Lectivo ID", "type": "number"}, ],
};

export default function FinalResultsPage() {
  return <CrudPage config={config as any} />;
}
