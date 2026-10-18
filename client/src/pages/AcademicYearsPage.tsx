import CrudPage from "@/components/CrudPage";

const config = {
  title: "Ano Lectivo",
  description: "Gestão de anos lectivos",
  listKey: "academicYears",
  createKey: "academicYears",
  updateKey: "academicYears",
  deleteKey: "academicYears",
  columns: [{"key": "name", "label": "Nome do Ano", "type": "text", "required": true}, {"key": "startDate", "label": "Data Início", "type": "date"}, {"key": "endDate", "label": "Data Fim", "type": "date"}, {"key": "status", "label": "Estado", "type": "enum", "options": ["activo", "inactivo", "concluido"]}, ],
};

export default function AcademicYearsPage() {
  return <CrudPage config={config as any} />;
}
