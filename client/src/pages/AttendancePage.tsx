import CrudPage from "@/components/CrudPage";

const config = {
  title: "Presenças",
  description: "Registo de presenças dos alunos",
  listKey: "attendanceRecords",
  createKey: "attendanceRecords",
  updateKey: "attendanceRecords",
  deleteKey: "attendanceRecords",
  columns: [{"key": "studentId", "label": "Aluno ID", "type": "number"}, {"key": "classId", "label": "Classe ID", "type": "number"}, {"key": "subjectId", "label": "Disciplina ID", "type": "number"}, {"key": "date", "label": "Data", "type": "date"}, {"key": "status", "label": "Estado", "type": "enum", "options": ["presente", "ausente", "atraso", "justificado"]}, {"key": "teacherId", "label": "Professor ID", "type": "number"}, ],
};

export default function AttendancePage() {
  return <CrudPage config={config as any} />;
}
