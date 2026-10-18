import CrudPage from "@/components/CrudPage";

const config = {
  title: "Níveis de Ensino (Angola)",
  description: "Níveis de ensino do sistema educativo angolano",
  listKey: "educationLevels",
  createKey: "educationLevels",
  updateKey: "educationLevels",
  deleteKey: "educationLevels",
  columns: [
    {"key": "name", "label": "Nome do Nível", "type": "text", "required": true},
    {"key": "code", "label": "Código", "type": "text"},
    {"key": "description", "label": "Descrição", "type": "text"},
    {"key": "active", "label": "Activo", "type": "select", "options": ["1", "0"], "render": (v: any) => v === 1 ? "Sim" : "Não"},
  ],
};

export default function EducationLevelsPage() {
  return <CrudPage config={config as any} />;
}
