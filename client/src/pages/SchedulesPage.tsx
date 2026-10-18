import CrudPage from "@/components/CrudPage";

const config = {
  title: "Horários",
  description: "Gestão de horários das aulas",
  listKey: "schedules",
  createKey: "schedules",
  updateKey: "schedules",
  deleteKey: "schedules",
  columns: [{"key": "classId", "label": "Classe ID", "type": "number"}, {"key": "subjectId", "label": "Disciplina ID", "type": "number"}, {"key": "teacherId", "label": "Professor ID", "type": "number"}, {"key": "dayOfWeek", "label": "Dia da Semana", "type": "enum", "options": ["segunda", "terca", "quarta", "quinta", "sexta", "sabado"]}, {"key": "startTime", "label": "Hora Início", "type": "text"}, {"key": "endTime", "label": "Hora Fim", "type": "text"}, {"key": "classroomId", "label": "Sala ID", "type": "number"}, {"key": "academicYearId", "label": "Ano Lectivo ID", "type": "number"}, ],
};

export default function SchedulesPage() {
  return <CrudPage config={config as any} />;
}
