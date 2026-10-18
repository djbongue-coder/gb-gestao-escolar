import CrudPage from "@/components/CrudPage";

const config = {
  title: "Cursos",
  description: "Gestão de cursos oferecidos (Sistema de Ensino de Angola)",
  listKey: "courses",
  createKey: "courses",
  updateKey: "courses",
  deleteKey: "courses",
  columns: [
    {"key": "name", "label": "Nome do Curso", "type": "text", "required": true},
    {"key": "level", "label": "Nível de Ensino", "type": "enum", "options": ["Pre-Escolar", "Ensino Primário", "Ensino Secundário - 1º Ciclo", "Ensino Secundário - 2º Ciclo"]},
    {"key": "duration", "label": "Duração (anos)", "type": "number"},
    {"key": "description", "label": "Descrição", "type": "text"},
  ],
};

export default function CoursesPage() {
  return <CrudPage config={config as any} />;
}
