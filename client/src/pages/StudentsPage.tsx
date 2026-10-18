import CrudPage from "@/components/CrudPage";

const config = {
  title: "Alunos",
  description: "Gestão de matrículas e dados dos alunos",
  listKey: "students",
  createKey: "students",
  updateKey: "students",
  deleteKey: "students",
  columns: [
    {"key": "fullName", "label": "Nome Completo", "type": "text", "required": true},
    {"key": "dateOfBirth", "label": "Data de Nascimento", "type": "date"},
    {"key": "gender", "label": "Género", "type": "enum", "options": ["masculino", "feminino"]},
    {"key": "phone", "label": "Telefone", "type": "text"},
    {"key": "address", "label": "Endereço", "type": "text"},
    {"key": "provinceId", "label": "Província", "type": "number"},
    {"key": "municipalityId", "label": "Município", "type": "number"},
    {"key": "guardianName", "label": "Nome do Encarregado", "type": "text"},
    {"key": "guardianPhone", "label": "Telefone do Encarregado", "type": "text"},
    {"key": "enrolledClassId", "label": "Classe ID", "type": "number"},
    {"key": "status", "label": "Estado", "type": "enum", "options": ["activo", "inactivo", "transferido", "desistiu"]},
  ],
};

export default function StudentsPage() {
  return <CrudPage config={config as any} />;
}
