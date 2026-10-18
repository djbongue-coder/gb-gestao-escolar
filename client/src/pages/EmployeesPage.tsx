import CrudPage from "@/components/CrudPage";

const config = {
  title: "Funcionários",
  description: "Gestão de funcionários administrativos",
  listKey: "employees",
  createKey: "employees",
  updateKey: "employees",
  deleteKey: "employees",
  columns: [{"key": "fullName", "label": "Nome Completo", "type": "text", "required": true}, {"key": "position", "label": "Cargo", "type": "text"}, {"key": "department", "label": "Departamento", "type": "text"}, {"key": "phone", "label": "Telefone", "type": "text"}, {"key": "email", "label": "Email", "type": "text"}, {"key": "salary", "label": "Salário", "type": "number"}, {"key": "status", "label": "Estado", "type": "enum", "options": ["activo", "inactivo"]}, ],
};

export default function EmployeesPage() {
  return <CrudPage config={config as any} />;
}
