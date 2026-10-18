import { and, desc, eq, inArray, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, students, assets, invoices, grades, notifications, auditLogs, finalResults, schedules, evaluations, lessonPlans, contents, payroll, leaves, borrowings, maintenanceRecords, declarations, contracts, feeTables, receipts, subjects, attendanceRecords, teachers, employees, books, provinces, municipalities, communes, educationLevels, angolaProvinces, angolaMunicipalities, schools } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    textFields.forEach(field => {
      const value = user[field];
      if (value !== undefined) {
        const normalized = value ?? null;
        values[field] = normalized;
        updateSet[field] = normalized;
      }
    });
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAll<T extends Record<string, unknown>>(db: any, table: any): Promise<T[]> {
  return db.select().from(table);
}

export async function getById<T extends Record<string, unknown>>(db: any, table: any, id: number): Promise<T | undefined> {
  const result = await db.select().from(table).where(eq(table.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createItem<T extends Record<string, unknown>>(db: any, table: any, data: T): Promise<T> {
  const result = await db.insert(table).values(data as any);
  const insertId = result[0]?.insertId ?? 0;
  const item = await getById<T>(db, table, insertId);
  return item ?? data;
}

export async function updateItem<T extends Record<string, unknown>>(db: any, table: any, id: number, data: Partial<T>): Promise<T | undefined> {
  await db.update(table).set(data).where(eq(table.id, id));
  return getById<T>(db, table, id);
}

export async function deleteItem(db: any, table: any, id: number): Promise<void> {
  await db.delete(table).where(eq(table.id, id));
}

export async function getByColumn<T extends Record<string, unknown>>(db: any, table: any, column: any, value: unknown): Promise<T[]> {
  return db.select().from(table).where(eq(column, value));
}

// Dashboard stats
export async function getDashboardStats(db: any) {
  const [totalStudents, totalTeachers, totalCourses, totalEmployees, totalBooks, totalAssets] = await Promise.all([
    db.execute("SELECT COUNT(*) AS count FROM students").then((r: any) => r[0][0]?.count ?? 0),
    db.execute("SELECT COUNT(*) AS count FROM teachers").then((r: any) => r[0][0]?.count ?? 0),
    db.execute("SELECT COUNT(*) AS count FROM courses").then((r: any) => r[0][0]?.count ?? 0),
    db.execute("SELECT COUNT(*) AS count FROM employees").then((r: any) => r[0][0]?.count ?? 0),
    db.execute("SELECT COUNT(*) AS count FROM books").then((r: any) => r[0][0]?.count ?? 0),
    db.execute("SELECT COUNT(*) AS count FROM assets").then((r: any) => r[0][0]?.count ?? 0),
  ]);
  const totalRevenue = await db.execute("SELECT COALESCE(SUM(amount),0) AS total FROM receipts").then((r: any) => r[0][0]?.total ?? 0);
  const totalPending = await db.execute("SELECT COALESCE(SUM(amount),0) AS total FROM invoices WHERE status = 'pendente'").then((r: any) => r[0][0]?.total ?? 0);
  const activeClasses = await db.execute("SELECT COUNT(*) AS count FROM classes").then((r: any) => r[0][0]?.count ?? 0);
  const activeNotifications = await db.execute("SELECT COUNT(*) AS count FROM notifications WHERE `read` = 'nao'").then((r: any) => r[0][0]?.count ?? 0);
  return { totalStudents, totalTeachers, totalCourses, totalEmployees, totalBooks, totalAssets, totalRevenue, totalPending, activeClasses, activeNotifications };
}

// Students by status
export async function getStudentsByStatus(db: any, status: string) {
  return db.select().from(students).where(eq(students.status, status as any));
}

// Assets by category
export async function getAssetsByCategory(db: any, category: string) {
  return db.select().from(assets).where(eq(assets.category, category as any));
}

// Invoices by student
export async function getInvoicesByStudent(db: any, studentId: number) {
  return db.select().from(invoices).where(eq(invoices.studentId, studentId));
}

// Grades by evaluation
export async function getGradesByEvaluation(db: any, evaluationId: number) {
  return db.select().from(grades).where(eq(grades.evaluationId, evaluationId));
}

// Notifications unread
export async function getUnreadNotifications(db: any) {
  return db.select().from(notifications).where(eq(notifications.read, "nao"));
}

// Audit logs
export async function getAuditLogs(db: any, limit: number = 50) {
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
}

// BI: Revenue by month
export async function getRevenueByMonth(db: any, year: string) {
  return db.execute(
    sql`SELECT MONTH(paymentDate) AS month, SUM(amount) AS total FROM receipts WHERE YEAR(paymentDate) = ${year} GROUP BY MONTH(paymentDate) ORDER BY month`
  );
}

// BI: Students by class
export async function getStudentsByClass(db: any) {
  return db.execute(
    sql`SELECT c.name AS className, COUNT(s.id) AS count FROM students s JOIN classes c ON s.enrolledClassId = c.id WHERE s.status = 'confirmado' GROUP BY c.id ORDER BY count DESC`
  );
}

// BI: Attendance rate
export async function getAttendanceRate(db: any) {
  return db.execute(
    sql`SELECT classId, subjectId, COUNT(*) AS total, SUM(CASE WHEN status = 'presente' THEN 1 ELSE 0 END) AS present FROM attendance_records GROUP BY classId, subjectId`
  );
}

// Final results for a class
export async function getFinalResultsByClass(db: any, classId: number, academicYearId: number) {
  return db.select().from(finalResults).where(and(eq(finalResults.classId, classId), eq(finalResults.academicYearId, academicYearId)));
}

// Schedules by class and academic year
export async function getSchedulesByClass(db: any, classId: number, academicYearId: number) {
  return db.select().from(schedules).where(and(eq(schedules.classId, classId), eq(schedules.academicYearId, academicYearId)));
}

// Evaluations by class and academic year
export async function getEvaluationsByClass(db: any, classId: number, academicYearId: number) {
  return db.select().from(evaluations).where(and(eq(evaluations.classId, classId), eq(evaluations.academicYearId, academicYearId)));
}

// Lesson plans by teacher
export async function getLessonPlansByTeacher(db: any, teacherId: number) {
  return db.select().from(lessonPlans).where(eq(lessonPlans.teacherId, teacherId));
}

// Contents by class and subject
export async function getContentsByClass(db: any, classId: number, subjectId: number) {
  return db.select().from(contents).where(and(eq(contents.classId, classId), eq(contents.subjectId, subjectId)));
}

// Payroll by month
export async function getPayrollByMonth(db: any, month: string) {
  return db.select().from(payroll).where(eq(payroll.month, month));
}

// Leaves by employee
export async function getLeavesByEmployee(db: any, employeeId: number) {
  return db.select().from(leaves).where(eq(leaves.employeeId, employeeId));
}

// Borrowings by student
export async function getBorrowingsByStudent(db: any, studentId: number) {
  return db.select().from(borrowings).where(eq(borrowings.studentId, studentId));
}

// Maintenance by asset
export async function getMaintenanceByAsset(db: any, assetId: number) {
  return db.select().from(maintenanceRecords).where(eq(maintenanceRecords.assetId, assetId));
}

// Declarations by student
export async function getDeclarationsByStudent(db: any, studentId: number) {
  return db.select().from(declarations).where(eq(declarations.studentId, studentId));
}

// Contracts by employee
export async function getContractsByEmployee(db: any, employeeId: number) {
  return db.select().from(contracts).where(eq(contracts.employeeId, employeeId));
}

// Fee tables by class and academic year
export async function getFeeTablesByClass(db: any, classId: number, academicYearId: number) {
  return db.select().from(feeTables).where(and(eq(feeTables.classId, classId), eq(feeTables.academicYearId, academicYearId)));
}

// Receipts by invoice
export async function getReceiptsByInvoice(db: any, invoiceId: number) {
  return db.select().from(receipts).where(eq(receipts.invoiceId, invoiceId));
}

// Notifications by type
export async function getNotificationsByType(db: any, type: string) {
  return db.select().from(notifications).where(eq(notifications.type, type as any));
}

// Subjects by course and class
export async function getSubjectsByCourseAndClass(db: any, courseId: number, classId: number) {
  return db.select().from(subjects).where(and(eq(subjects.courseId, courseId), eq(subjects.classId, classId)));
}

// Attendance by class, subject, and date
export async function getAttendanceByClassDate(db: any, classId: number, subjectId: number, date: Date) {
  return db.select().from(attendanceRecords).where(and(eq(attendanceRecords.classId, classId), eq(attendanceRecords.subjectId, subjectId), eq(attendanceRecords.date, date)));
}

// Grades by student and evaluation
export async function getGradesByStudentEvaluation(db: any, studentId: number, evaluationId: number) {
  return db.select().from(grades).where(and(eq(grades.studentId, studentId), eq(grades.evaluationId, evaluationId)));
}

// Final results by student
export async function getFinalResultsByStudent(db: any, studentId: number) {
  return db.select().from(finalResults).where(eq(finalResults.studentId, studentId));
}

// Search students by name
export async function searchStudents(db: any, query: string) {
  return db.select().from(students).where(like(students.fullName, `%${query}%`));
}

// Search teachers by name
export async function searchTeachers(db: any, query: string) {
  return db.select().from(teachers).where(like(teachers.fullName, `%${query}%`));
}

// Search employees by name
export async function searchEmployees(db: any, query: string) {
  return db.select().from(employees).where(like(employees.fullName, `%${query}%`));
}

// Search books by title or author
export async function searchBooks(db: any, query: string) {
  return db.select().from(books).where(like(books.title, `%${query}%`));
}

// Provinces
export async function getProvinces(db: any) {
  return db.select().from(provinces);
}

// Municipalities by province
export async function getMunicipalitiesByProvince(db: any, provinceId: number) {
  return db.select().from(municipalities).where(eq(municipalities.provinceId, provinceId));
}

// Communes by municipality
export async function getCommunesByMunicipality(db: any, municipalityId: number) {
  return db.select().from(communes).where(eq(communes.municipalityId, municipalityId));
}

// Angola Education Levels
export async function getEducationLevels(db: any) {
  return db.select().from(educationLevels).where(eq(educationLevels.active, 1));
}

// Angola Provinces (official)
export async function getAngolaProvinces(db: any) {
  return db.select().from(angolaProvinces);
}

// Angola Municipalities
export async function getAngolaMunicipalities(db: any) {
  return db.select().from(angolaMunicipalities);
}

// Angola Municipalities by province
export async function getAngolaMunicipalitiesByProvince(db: any, provinceId: number) {
  return db.select().from(angolaMunicipalities).where(eq(angolaMunicipalities.provinceId, provinceId));
}
// School Config (single record - use upsert)
export async function getSchoolConfig(db: any) {
  const result = await db.select().from(schools).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertSchoolConfig(db: any, data: any) {
  const existing = await db.select().from(schools).limit(1);
  if (existing.length > 0) {
    await db.update(schools).set(data).where(eq(schools.id, existing[0].id));
  } else {
    await db.insert(schools).values({ ...data, code: "GB-001" });
  }
  return await getSchoolConfig(db);
}
