import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, double, mediumtext, longtext } from "drizzle-orm/mysql-core";

// Education Levels (Angolan system)
export const educationLevels = mysqlTable("education_levels", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  gradeRange: varchar("gradeRange", { length: 50 }),
  active: int("active").default(1),
});

// Angola Provinces (official)
export const angolaProvinces = mysqlTable("angola_provinces", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  capital: varchar("capital", { length: 100 }).notNull(),
  areaKm2: int("area_km2"),
  numMunicipalities: int("numMunicipalities"),
});

// Angola Municipalities
export const angolaMunicipalities = mysqlTable("angola_municipalities", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  provinceId: int("provinceId").notNull(),
});

// Core user table (auth)
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

// Provinces
export const provinces = mysqlTable("provinces", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  country: varchar("country", { length: 100 }).notNull().default("Angola"),
});

// Municipalities
export const municipalities = mysqlTable("municipalities", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  provinceId: int("provinceId").notNull(),
});

// Communes
export const communes = mysqlTable("communes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  municipalityId: int("municipalityId").notNull(),
});

// Schools
export const schools = mysqlTable("schools", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  logoUrl: text("logoUrl"),
  nif: varchar("nif", { length: 50 }),
  professorName: varchar("professorName", { length: 200 }),
  provinceId: int("provinceId"),
  municipalityId: int("municipalityId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Courses
export const courses = mysqlTable("courses", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  description: text("description"),
  active: mysqlEnum("active", ["sim", "nao"]).default("sim").notNull(),
  educationLevel: varchar("educationLevel", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Classes
export const classes = mysqlTable("classes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  courseId: int("courseId").notNull(),
  level: int("level").notNull(),
  educationLevel: varchar("educationLevel", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Classrooms
export const classrooms = mysqlTable("classrooms", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  capacity: int("capacity").default(40),
  location: varchar("location", { length: 100 }),
  active: mysqlEnum("active", ["sim", "nao"]).default("sim").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Academic Years
export const academicYears = mysqlTable("academic_years", {
  id: int("id").autoincrement().primaryKey(),
  year: varchar("year", { length: 10 }).notNull().unique(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  active: mysqlEnum("active", ["sim", "nao"]).default("sim").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Students
export const students = mysqlTable("students", {
  id: int("id").autoincrement().primaryKey(),
  processNumber: varchar("processNumber", { length: 20 }).unique(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  fullName: varchar("fullName", { length: 200 }).notNull(),
  dateOfBirth: timestamp("dateOfBirth").notNull(),
  gender: mysqlEnum("gender", ["M", "F"]).notNull(),
  nationality: varchar("nationality", { length: 50 }).default("Angolana"),
  bi: varchar("bi", { length: 20 }),
  provinceId: int("provinceId"),
  municipalityId: int("municipalityId"),
  communeId: int("communeId"),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  guardianName: varchar("guardianName", { length: 200 }),
  guardianPhone: varchar("guardianPhone", { length: 20 }),
  guardianEmail: varchar("guardianEmail", { length: 320 }),
  photoUrl: text("photoUrl"),
  status: mysqlEnum("status", ["pendente", "validado", "confirmado", "anulado"]).default("pendente").notNull(),
  enrolledClassId: int("enrolledClassId"),
  enrolledCourseId: int("enrolledCourseId"),
  enrollmentDate: timestamp("enrollmentDate"),
  enrollmentYear: int("enrollmentYear"),
  academicYearId: int("academicYearId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Teachers
export const teachers = mysqlTable("teachers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  fullName: varchar("fullName", { length: 200 }).notNull(),
  bi: varchar("bi", { length: 20 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  qualification: varchar("qualification", { length: 100 }),
  specialty: varchar("specialty", { length: 100 }),
  active: mysqlEnum("active", ["sim", "nao"]).default("sim").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Subjects
export const subjects = mysqlTable("subjects", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  courseId: int("courseId").notNull(),
  classId: int("classId").notNull(),
  educationLevel: varchar("educationLevel", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Schedules
export const schedules = mysqlTable("schedules", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  subjectId: int("subjectId").notNull(),
  teacherId: int("teacherId").notNull(),
  classroomId: int("classroomId"),
  academicYearId: int("academicYearId").notNull(),
  dayOfWeek: mysqlEnum("dayOfWeek", ["segunda", "terca", "quarta", "quinta", "sexta", "sabado"]).notNull(),
  startTime: varchar("startTime", { length: 10 }).notNull(),
  endTime: varchar("endTime", { length: 10 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Evaluations
export const evaluations = mysqlTable("evaluations", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  subjectId: int("subjectId").notNull(),
  teacherId: int("teacherId").notNull(),
  academicYearId: int("academicYearId").notNull(),
  type: mysqlEnum("type", ["MAC", "NPP", "PT", "Exame"]).notNull(),
  title: varchar("title", { length: 200 }),
  date: timestamp("date").notNull(),
  maxValue: double("maxValue").default(20),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Grades
export const grades = mysqlTable("grades", {
  id: int("id").autoincrement().primaryKey(),
  evaluationId: int("evaluationId").notNull(),
  studentId: int("studentId").notNull(),
  value: double("value").notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Mini Pautas
export const miniPautas = mysqlTable("mini_pautas", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  subjectId: int("subjectId").notNull(),
  classId: int("classId").notNull(),
  academicYearId: int("academicYearId").notNull(),
  // 1º Trimestre
  mac1: double("mac1"),
  npp1: double("npp1"),
  npt1: double("npt1"),
  mt1: double("mt1"),
  // 2º Trimestre
  mac2: double("mac2"),
  npp2: double("npp2"),
  npt2: double("npt2"),
  mt2: double("mt2"),
  // 3º Trimestre
  mac3: double("mac3"),
  npp3: double("npp3"),
  npt3: double("npt3"),
  mt3: double("mt3"),
  // Final
  mfd: double("mfd"),
  exame: double("exame"),
  mfdFinal: double("mfdFinal"),
  classificacaoQualitativa: varchar("classificacaoQualitativa", { length: 20 }),
  observacao: varchar("observacao", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Pautas Gerais
export const pautasGerais = mysqlTable("pautas_gerais", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  subjectId: int("subjectId").notNull(),
  classId: int("classId").notNull(),
  academicYearId: int("academicYearId").notNull(),
  mdf: double("mdf"),
  mf: double("mf"),
  classificacaoQualitativa: varchar("classificacaoQualitativa", { length: 20 }),
  observacao: varchar("observacao", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Atas de Avaliação (oficial - modelo MED)
export const atas = mysqlTable("atas", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  academicYearId: int("academicYearId").notNull(),
  period: mysqlEnum("period", ["1trimestre", "2trimestre", "3trimestre", "epoca", "final"]).notNull(),
  numero: varchar("numero", { length: 50 }),
  meetingDate: timestamp("meetingDate"),
  location: varchar("location", { length: 255 }),
  startTime: varchar("startTime", { length: 10 }),
  endTime: varchar("endTime", { length: 10 }),
  agenda: text("agenda"),
  deliberacoes: text("deliberacoes"),
  observacoes: text("observacoes"),
  // Resumo de resultados (preenchido automaticamente das mini-pautas)
  resumoJson: text("resumoJson"),
  // Assinaturas
  directorName: varchar("directorName", { length: 200 }),
  coordenadorName: varchar("coordenadorName", { length: 200 }),
  conselhoMembrosJson: text("conselhoMembrosJson"),
  // Estado da ata (validação digital)
  status: mysqlEnum("status", ["rascunho", "aprovada"]).default("rascunho").notNull(),
  approvedAt: timestamp("approvedAt"),
  approvedBy: varchar("approvedBy", { length: 200 }),
  approvedByUserId: int("approvedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Final Results
export const finalResults = mysqlTable("final_results", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  subjectId: int("subjectId").notNull(),
  classId: int("classId").notNull(),
  academicYearId: int("academicYearId").notNull(),
  mac: double("mac"),
  npp: double("npp"),
  pt1: double("pt1"),
  pt2: double("pt2"),
  pt3: double("pt3"),
  finalAverage: double("finalAverage"),
  status: mysqlEnum("status", ["transitou", "reprovou", "pendente"]).default("pendente").notNull(),
  approvedByCouncil: mysqlEnum("approvedByCouncil", ["sim", "nao"]).default("nao").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Fee Tables
export const feeTables = mysqlTable("fee_tables", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  academicYearId: int("academicYearId").notNull(),
  tuitionFee: decimal("tuitionFee", { precision: 12, scale: 2 }).default("0"),
  enrollmentFee: decimal("enrollmentFee", { precision: 12, scale: 2 }).default("0"),
  otherFees: decimal("otherFees", { precision: 12, scale: 2 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Invoices
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  classId: int("classId").notNull(),
  academicYearId: int("academicYearId").notNull(),
  month: varchar("month", { length: 7 }),
  type: mysqlEnum("type", ["propina", "matricula", "outra"]).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  dueDate: timestamp("dueDate"),
  status: mysqlEnum("status", ["pendente", "pago", "atrasado", "cancelado"]).default("pendente").notNull(),
  paidDate: timestamp("paidDate"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Receipts
export const receipts = mysqlTable("receipts", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  studentId: int("studentId").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["dinheiro", "transferencia", "tpa", "referencia"]).notNull(),
  paidBy: varchar("paidBy", { length: 200 }),
  receivedBy: int("receivedBy").notNull(),
  paymentDate: timestamp("paymentDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Employees
export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  fullName: varchar("fullName", { length: 200 }).notNull(),
  bi: varchar("bi", { length: 20 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  department: varchar("department", { length: 100 }),
  position: varchar("position", { length: 100 }),
  hireDate: timestamp("hireDate"),
  active: mysqlEnum("active", ["sim", "nao"]).default("sim").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Contracts
export const contracts = mysqlTable("contracts", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  type: mysqlEnum("type", ["efectivo", "contrato", "temporario", "estagio"]).notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  salary: decimal("salary", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["activo", "expirado", "rescindido"]).default("activo").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Payroll
export const payroll = mysqlTable("payroll", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  month: varchar("month", { length: 7 }).notNull(),
  baseSalary: decimal("baseSalary", { precision: 12, scale: 2 }).notNull(),
  bonuses: decimal("bonuses", { precision: 12, scale: 2 }).default("0"),
  deductions: decimal("deductions", { precision: 12, scale: 2 }).default("0"),
  netSalary: decimal("netSalary", { precision: 12, scale: 2 }).notNull(),
  paidDate: timestamp("paidDate"),
  status: mysqlEnum("status", ["pendente", "pago", "processado"]).default("pendente").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Leaves
export const leaves = mysqlTable("leaves", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  type: mysqlEnum("type", ["ferias", "doenca", "licenca_maternidade", "outra"]).notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  status: mysqlEnum("status", ["pendente", "aprovado", "rejeitado"]).default("pendente").notNull(),
  reason: text("reason"),
  approvedBy: int("approvedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Books
export const books = mysqlTable("books", {
  id: int("id").autoincrement().primaryKey(),
  isbn: varchar("isbn", { length: 20 }),
  title: varchar("title", { length: 255 }).notNull(),
  author: varchar("author", { length: 200 }).notNull(),
  publisher: varchar("publisher", { length: 200 }),
  category: varchar("category", { length: 100 }),
  totalCopies: int("totalCopies").default(1),
  availableCopies: int("availableCopies").default(1),
  shelfLocation: varchar("shelfLocation", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Borrowings
export const borrowings = mysqlTable("borrowings", {
  id: int("id").autoincrement().primaryKey(),
  bookId: int("bookId").notNull(),
  studentId: int("studentId").notNull(),
  borrowDate: timestamp("borrowDate").defaultNow().notNull(),
  dueDate: timestamp("dueDate").notNull(),
  returnDate: timestamp("returnDate"),
  status: mysqlEnum("status", ["emprestado", "devolvido", "atrasado"]).default("emprestado").notNull(),
  fine: decimal("fine", { precision: 10, scale: 2 }).default("0"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Assets (Património)
export const assets = mysqlTable("assets", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  category: mysqlEnum("category", ["mobiliario", "informatica", "material_didactico", "veiculo", "outro"]).notNull(),
  serialNumber: varchar("serialNumber", { length: 100 }),
  purchaseDate: timestamp("purchaseDate"),
  purchaseValue: decimal("purchaseValue", { precision: 12, scale: 2 }),
  currentLocation: varchar("currentLocation", { length: 200 }),
  condition: mysqlEnum("condition", ["bom", "regular", "mau", "irrecuperavel"]).default("bom").notNull(),
  status: mysqlEnum("status", ["activo", "manutencao", "baixado"]).default("activo").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Maintenance Records
export const maintenanceRecords = mysqlTable("maintenance_records", {
  id: int("id").autoincrement().primaryKey(),
  assetId: int("assetId").notNull(),
  type: mysqlEnum("type", ["preventiva", "correctiva", "inspeccao"]).notNull(),
  description: text("description").notNull(),
  cost: decimal("cost", { precision: 12, scale: 2 }).default("0"),
  date: timestamp("date").notNull(),
  completedBy: varchar("completedBy", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Notifications
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  message: mediumtext("message").notNull(),
  type: mysqlEnum("type", ["geral", "aluno", "professor", "encarregado", "funcionario"]).default("geral").notNull(),
  channel: mysqlEnum("channel", ["sistema", "email", "sms", "whatsapp"]).default("sistema").notNull(),
  targetId: int("targetId"),
  read: mysqlEnum("read", ["sim", "nao"]).default("nao").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Lesson Plans
export const lessonPlans = mysqlTable("lesson_plans", {
  id: int("id").autoincrement().primaryKey(),
  teacherId: int("teacherId").notNull(),
  subjectId: int("subjectId").notNull(),
  classId: int("classId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  objective: text("objective"),
  content: mediumtext("content"),
  methodology: text("methodology"),
  resources: text("resources"),
  plannedDate: timestamp("plannedDate"),
  status: mysqlEnum("status", ["planeado", "executado", "cancelado"]).default("planeado").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Contents
export const contents = mysqlTable("contents", {
  id: int("id").autoincrement().primaryKey(),
  teacherId: int("teacherId").notNull(),
  subjectId: int("subjectId").notNull(),
  classId: int("classId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: mediumtext("description"),
  attachments: text("attachments"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Attendance Records
export const attendanceRecords = mysqlTable("attendance_records", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  subjectId: int("subjectId").notNull(),
  teacherId: int("teacherId").notNull(),
  date: timestamp("date").notNull(),
  studentId: int("studentId").notNull(),
  status: mysqlEnum("status", ["presente", "ausente", "justificada", "injustificada"]).notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Declarations
export const declarations = mysqlTable("declarations", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  type: mysqlEnum("type", ["matricula", "frequentou", "transitou", "conclusao", "outra"]).notNull(),
  description: text("description"),
  content: mediumtext("content"),
  issuedDate: timestamp("issuedDate").defaultNow().notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Audit Logs
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  table: varchar("table", { length: 100 }),
  recordId: int("recordId"),
  oldValue: longtext("oldValue"),
  newValue: longtext("newValue"),
  ip: varchar("ip", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Province = typeof provinces.$inferSelect;
export type Municipality = typeof municipalities.$inferSelect;
export type Commune = typeof communes.$inferSelect;
export type School = typeof schools.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Class = typeof classes.$inferSelect;
export type Classroom = typeof classrooms.$inferSelect;
export type AcademicYear = typeof academicYears.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Teacher = typeof teachers.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type Schedule = typeof schedules.$inferSelect;
export type Evaluation = typeof evaluations.$inferSelect;
export type Grade = typeof grades.$inferSelect;
export type FinalResult = typeof finalResults.$inferSelect;
export type FeeTable = typeof feeTables.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Receipt = typeof receipts.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type Contract = typeof contracts.$inferSelect;
export type Payroll = typeof payroll.$inferSelect;
export type Leave = typeof leaves.$inferSelect;
export type Book = typeof books.$inferSelect;
export type Borrowing = typeof borrowings.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type LessonPlan = typeof lessonPlans.$inferSelect;
export type Content = typeof contents.$inferSelect;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type Atas = typeof atas.$inferSelect;
export type Declaration = typeof declarations.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
