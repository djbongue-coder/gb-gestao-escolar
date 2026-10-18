import CrudPage from "@/components/CrudPage";

const config = {
  title: "Avaliações",
  description: "Gestão de avaliações e exames",
  listKey: "evaluations",
  createKey: "evaluations",
  updateKey: "evaluations",
  deleteKey: "evaluations",
  columns: [{"key": "name", "label": "Nome da Avaliação", "type": "text", "required": true}, {"key": "type", "label": "Tipo", "type": "enum", "options": ["teste", "exame", "trabalho", "projecto"]}, {"key": "subjectId", "label": "Disciplina ID", "type": "number"}, {"key": "classId", "label": "Classe ID", "type": "number"}, {"key": "date", "label": "Data", "type": "date"}, {"key": "maxScore", "label": "Pontuação Máx.", "type": "number"}, {"key": "weight", "label": "Peso (%)", "type": "number"}, {"key": "academicYearId", "label": "Ano Lectivo ID", "type": "number"}, ],
};

export default function EvaluationsPage() {
  return <CrudPage config={config as any} />;
}
