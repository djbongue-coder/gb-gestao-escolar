import CrudPage from "@/components/CrudPage";

const config = {
  title: "Facturas / Propinas",
  description: "Gestão de facturas e propinas",
  listKey: "invoices",
  createKey: "invoices",
  updateKey: "invoices",
  deleteKey: "invoices",
  columns: [{"key": "studentId", "label": "Aluno ID", "type": "number"}, {"key": "type", "label": "Tipo", "type": "enum", "options": ["propina", "matricula", "uniforme", "material", "outro"]}, {"key": "amount", "label": "Valor", "type": "number", "required": true}, {"key": "dueDate", "label": "Data Limite", "type": "date"}, {"key": "status", "label": "Estado", "type": "enum", "options": ["pendente", "paga", "atrasada", "cancelada"]}, {"key": "academicYearId", "label": "Ano Lectivo ID", "type": "number"}, ],
};

export default function InvoicesPage() {
  return <CrudPage config={config as any} />;
}
