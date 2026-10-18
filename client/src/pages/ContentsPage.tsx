import CrudPage from "@/components/CrudPage";

const config = {
  title: "Conteúdos",
  description: "Gestão de conteúdos programáticos",
  listKey: "contents",
  createKey: "contents",
  updateKey: "contents",
  deleteKey: "contents",
  columns: [{"key": "classId", "label": "Classe ID", "type": "number"}, {"key": "subjectId", "label": "Disciplina ID", "type": "number"}, {"key": "title", "label": "Título", "type": "text", "required": true}, {"key": "description", "label": "Descrição", "type": "text"}, {"key": "order", "label": "Ordem", "type": "number"}, {"key": "academicYearId", "label": "Ano Lectivo ID", "type": "number"}, ],
};

export default function ContentsPage() {
  return <CrudPage config={config as any} />;
}
