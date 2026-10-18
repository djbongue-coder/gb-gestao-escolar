import CrudPage from "@/components/CrudPage";

const config = {
  title: "Folha Salarial",
  description: "Gestão de folha salarial",
  listKey: "payroll",
  createKey: "payroll",
  updateKey: "payroll",
  deleteKey: "payroll",
  columns: [{"key": "employeeId", "label": "Funcionário ID", "type": "number"}, {"key": "month", "label": "Mês", "type": "text", "required": true}, {"key": "baseSalary", "label": "Salário Base", "type": "number"}, {"key": "deductions", "label": "Descontos", "type": "number"}, {"key": "bonus", "label": "Bónus", "type": "number"}, {"key": "netSalary", "label": "Salário Líquido", "type": "number"}, {"key": "status", "label": "Estado", "type": "enum", "options": ["processado", "pendente", "pago"]}, ],
};

export default function PayrollPage() {
  return <CrudPage config={config as any} />;
}
