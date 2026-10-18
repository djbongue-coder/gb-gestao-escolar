import { z } from "zod";
import { and, desc, eq, like } from "drizzle-orm";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { getDb, upsertUser, getUserByOpenId, getDashboardStats, getEducationLevels, getAngolaProvinces, getAngolaMunicipalities, getAngolaMunicipalitiesByProvince } from "./db";
import * as schema from "../drizzle/schema";
import { calcularMT, calcularMFD, calcularMFDFinal, calcularMF, getClassificacaoQualitativa, getObservacao } from "@shared/raa";

type DbType = NonNullable<Awaited<ReturnType<typeof getDb>>>;

async function dbOrThrow(): Promise<DbType> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
}

// CRUD router factory
function crudRouter<T extends Record<string, unknown>>(
  table: any,
  selectAll: (db: DbType) => Promise<T[]>,
  createItem: (db: DbType, data: T) => Promise<T>,
  updateItem: (db: DbType, id: number, data: Partial<T>) => Promise<T | undefined>,
  deleteItem: (db: DbType, id: number) => Promise<void>,
) {
  return router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return selectAll(db);
    }),
    create: adminProcedure.input(z.any()).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      return createItem(db, input);
    }),
    update: adminProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const result = await updateItem(db, input.id, input.data);
      if (!result) throw new Error("Item not found");
      return result;
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await deleteItem(db, input.id);
      return { success: true };
    }),
  });
}

// Simple CRUD helpers
async function simpleSelectAll<T extends { id: number }>(db: DbType, table: any): Promise<T[]> {
  return db.select().from(table);
}

async function simpleCreate<T extends Record<string, unknown>>(db: DbType, table: any, data: T): Promise<T> {
  const result = await db.insert(table).values(data as any);
  const id = result[0]?.insertId ?? 0;
  const item = await db.select().from(table).where(eq((table as any).id, id)).limit(1);
  return item.length > 0 ? item[0] as T : data;
}

async function simpleUpdate<T extends Record<string, unknown>>(db: DbType, table: any, id: number, data: Partial<T>): Promise<T | undefined> {
  await db.update(table).set(data).where(eq((table as any).id, id));
  const item = await db.select().from(table).where(eq((table as any).id, id)).limit(1);
  return item.length > 0 ? item[0] as T : undefined;
}

async function simpleDelete(db: DbType, table: any, id: number): Promise<void> {
  await db.delete(table).where(eq((table as any).id, id));
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Dashboard
  dashboard: router({
    stats: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return await getDashboardStats(db);
    }),
  }),

  // Provinces
  provinces: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.provinces);
    }),
    create: adminProcedure.input(z.any()).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const result = await db.insert(schema.provinces).values(input);
      return { id: result[0]?.insertId };
    }),
  }),

  // Municipalities
  municipalities: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.municipalities);
    }),
    byProvince: publicProcedure.input(z.object({ provinceId: z.number() })).query(async ({ input }) => {
      const db = await dbOrThrow();
      return db.select().from(schema.municipalities).where(eq(schema.municipalities.provinceId, input.provinceId));
    }),
    create: adminProcedure.input(z.any()).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const result = await db.insert(schema.municipalities).values(input);
      return { id: result[0]?.insertId };
    }),
  }),

  // Communes
  communes: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.communes);
    }),
    byMunicipality: publicProcedure.input(z.object({ municipalityId: z.number() })).query(async ({ input }) => {
      const db = await dbOrThrow();
      return db.select().from(schema.communes).where(eq(schema.communes.municipalityId, input.municipalityId));
    }),
    create: adminProcedure.input(z.any()).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const result = await db.insert(schema.communes).values(input);
      return { id: result[0]?.insertId };
    }),
  }),

  // Schools
  schools: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.schools);
    }),
    create: adminProcedure.input(z.any()).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const result = await db.insert(schema.schools).values(input);
      const id = result[0]?.insertId;
      return db.select().from(schema.schools).where(eq(schema.schools.id, id)).then(r => r[0]);
    }),
    update: adminProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.update(schema.schools).set(input.data).where(eq(schema.schools.id, input.id));
      return db.select().from(schema.schools).where(eq(schema.schools.id, input.id)).then(r => r[0]);
    }),
  }),

  // Academic Years
  academicYears: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.academicYears);
    }),
    create: adminProcedure.input(z.any()).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const result = await db.insert(schema.academicYears).values(input);
      const id = result[0]?.insertId;
      return db.select().from(schema.academicYears).where(eq(schema.academicYears.id, id)).then(r => r[0]);
    }),
    update: adminProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.update(schema.academicYears).set(input.data).where(eq(schema.academicYears.id, input.id));
      return db.select().from(schema.academicYears).where(eq(schema.academicYears.id, input.id)).then(r => r[0]);
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.delete(schema.academicYears).where(eq(schema.academicYears.id, input.id));
      return { success: true };
    }),
  }),

  // Courses
  courses: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.courses);
    }),
    create: adminProcedure.input(z.any()).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const result = await db.insert(schema.courses).values(input);
      const id = result[0]?.insertId;
      return db.select().from(schema.courses).where(eq(schema.courses.id, id)).then(r => r[0]);
    }),
    update: adminProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.update(schema.courses).set(input.data).where(eq(schema.courses.id, input.id));
      return db.select().from(schema.courses).where(eq(schema.courses.id, input.id)).then(r => r[0]);
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.delete(schema.courses).where(eq(schema.courses.id, input.id));
      return { success: true };
    }),
  }),

  // Classes
  classes: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.classes);
    }),
    byCourse: publicProcedure.input(z.object({ courseId: z.number() })).query(async ({ input }) => {
      const db = await dbOrThrow();
      return db.select().from(schema.classes).where(eq(schema.classes.courseId, input.courseId));
    }),
    create: adminProcedure.input(z.any()).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const result = await db.insert(schema.classes).values(input);
      const id = result[0]?.insertId;
      return db.select().from(schema.classes).where(eq(schema.classes.id, id)).then(r => r[0]);
    }),
    update: adminProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.update(schema.classes).set(input.data).where(eq(schema.classes.id, input.id));
      return db.select().from(schema.classes).where(eq(schema.classes.id, input.id)).then(r => r[0]);
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.delete(schema.classes).where(eq(schema.classes.id, input.id));
      return { success: true };
    }),
  }),

  // Classrooms
  classrooms: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.classrooms);
    }),
    create: adminProcedure.input(z.any()).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const result = await db.insert(schema.classrooms).values(input);
      const id = result[0]?.insertId;
      return db.select().from(schema.classrooms).where(eq(schema.classrooms.id, id)).then(r => r[0]);
    }),
    update: adminProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.update(schema.classrooms).set(input.data).where(eq(schema.classrooms.id, input.id));
      return db.select().from(schema.classrooms).where(eq(schema.classrooms.id, input.id)).then(r => r[0]);
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.delete(schema.classrooms).where(eq(schema.classrooms.id, input.id));
      return { success: true };
    }),
  }),

  // Students
  students: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.students);
    }),
    byClass: publicProcedure.input(z.object({ classId: z.number() })).query(async ({ input }) => {
      const db = await dbOrThrow();
      return db.select().from(schema.students).where(eq(schema.students.enrolledClassId, input.classId));
    }),
    search: publicProcedure.input(z.object({ query: z.string() })).query(async ({ input }) => {
      const db = await dbOrThrow();
      return db.select().from(schema.students).where(like(schema.students.fullName, `%${input.query}%`));
    }),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const result = await db.insert(schema.students).values(input);
      const id = result[0]?.insertId;
      return db.select().from(schema.students).where(eq(schema.students.id, id)).then(r => r[0]);
    }),
    update: protectedProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.update(schema.students).set(input.data).where(eq(schema.students.id, input.id));
      return db.select().from(schema.students).where(eq(schema.students.id, input.id)).then(r => r[0]);
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.delete(schema.students).where(eq(schema.students.id, input.id));
      return { success: true };
    }),
  }),

  // Teachers
  teachers: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.teachers);
    }),
    search: publicProcedure.input(z.object({ query: z.string() })).query(async ({ input }) => {
      const db = await dbOrThrow();
      return db.select().from(schema.teachers).where(like(schema.teachers.fullName, `%${input.query}%`));
    }),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const result = await db.insert(schema.teachers).values(input);
      const id = result[0]?.insertId;
      return db.select().from(schema.teachers).where(eq(schema.teachers.id, id)).then(r => r[0]);
    }),
    update: protectedProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.update(schema.teachers).set(input.data).where(eq(schema.teachers.id, input.id));
      return db.select().from(schema.teachers).where(eq(schema.teachers.id, input.id)).then(r => r[0]);
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.delete(schema.teachers).where(eq(schema.teachers.id, input.id));
      return { success: true };
    }),
  }),

  // Subjects
  subjects: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.subjects);
    }),
    byCourseAndClass: publicProcedure.input(z.object({ courseId: z.number(), classId: z.number() })).query(async ({ input }) => {
      const db = await dbOrThrow();
      return db.select().from(schema.subjects).where(and(eq(schema.subjects.courseId, input.courseId), eq(schema.subjects.classId, input.classId)));
    }),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const result = await db.insert(schema.subjects).values(input);
      const id = result[0]?.insertId;
      return db.select().from(schema.subjects).where(eq(schema.subjects.id, id)).then(r => r[0]);
    }),
    update: protectedProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.update(schema.subjects).set(input.data).where(eq(schema.subjects.id, input.id));
      return db.select().from(schema.subjects).where(eq(schema.subjects.id, input.id)).then(r => r[0]);
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.delete(schema.subjects).where(eq(schema.subjects.id, input.id));
      return { success: true };
    }),
  }),

  // Schedules
  schedules: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.schedules);
    }),
    byClassAndYear: publicProcedure.input(z.object({ classId: z.number(), academicYearId: z.number() })).query(async ({ input }) => {
      const db = await dbOrThrow();
      return db.select().from(schema.schedules).where(and(eq(schema.schedules.classId, input.classId), eq(schema.schedules.academicYearId, input.academicYearId)));
    }),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const result = await db.insert(schema.schedules).values(input);
      const id = result[0]?.insertId;
      return db.select().from(schema.schedules).where(eq(schema.schedules.id, id)).then(r => r[0]);
    }),
    update: protectedProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.update(schema.schedules).set(input.data).where(eq(schema.schedules.id, input.id));
      return db.select().from(schema.schedules).where(eq(schema.schedules.id, input.id)).then(r => r[0]);
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.delete(schema.schedules).where(eq(schema.schedules.id, input.id));
      return { success: true };
    }),
  }),

  // Evaluations
  evaluations: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.evaluations);
    }),
    byClassAndYear: publicProcedure.input(z.object({ classId: z.number(), academicYearId: z.number() })).query(async ({ input }) => {
      const db = await dbOrThrow();
      return db.select().from(schema.evaluations).where(and(eq(schema.evaluations.classId, input.classId), eq(schema.evaluations.academicYearId, input.academicYearId)));
    }),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const result = await db.insert(schema.evaluations).values(input);
      const id = result[0]?.insertId;
      return db.select().from(schema.evaluations).where(eq(schema.evaluations.id, id)).then(r => r[0]);
    }),
    update: protectedProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.update(schema.evaluations).set(input.data).where(eq(schema.evaluations.id, input.id));
      return db.select().from(schema.evaluations).where(eq(schema.evaluations.id, input.id)).then(r => r[0]);
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.delete(schema.evaluations).where(eq(schema.evaluations.id, input.id));
      return { success: true };
    }),
  }),

  // Grades
  grades: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.grades);
    }),
    byEvaluation: publicProcedure.input(z.object({ evaluationId: z.number() })).query(async ({ input }) => {
      const db = await dbOrThrow();
      return db.select().from(schema.grades).where(eq(schema.grades.evaluationId, input.evaluationId));
    }),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const result = await db.insert(schema.grades).values(input);
      const id = result[0]?.insertId;
      return db.select().from(schema.grades).where(eq(schema.grades.id, id)).then(r => r[0]);
    }),
    update: protectedProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.update(schema.grades).set(input.data).where(eq(schema.grades.id, input.id));
      return db.select().from(schema.grades).where(eq(schema.grades.id, input.id)).then(r => r[0]);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.delete(schema.grades).where(eq(schema.grades.id, input.id));
      return { success: true };
    }),
  }),

  // Mini Pautas
  miniPautas: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.miniPautas);
    }),
    byClass: publicProcedure
      .input(z.object({ classId: z.number() }))
      .query(async ({ input }) => {
        const db = await dbOrThrow();
        return db.select().from(schema.miniPautas)
          .where(eq(schema.miniPautas.classId, input.classId));
      }),
    create: adminProcedure.input(z.any()).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      return simpleCreate(db, schema.miniPautas, input);
    }),
    update: adminProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const result = await simpleUpdate(db, schema.miniPautas, input.id, input.data);
      if (!result) throw new Error("Item not found");
      return result;
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await simpleDelete(db, schema.miniPautas, input.id);
      return { success: true };
    }),
  }),

  // Pauta Turma Completa (gera automaticamente: alunos x disciplinas)
  pautaTurma: router({
    // Gera a pauta completa de uma turma: para cada aluno matriculado na classe,
    // devolve todas as disciplinas da classe e as notas de mini_pautas associadas.
    // Se uma linha (aluno x disciplina) não existir em mini_pautas, é inicializada
    // automaticamente com valores nulos (NÃO AVALIADA).
    completa: publicProcedure
      .input(z.object({ classId: z.number(), academicYearId: z.number().optional() }))
      .query(async ({ input }) => {
        const db = await dbOrThrow();
        const classId = input.classId;
        const academicYearId = input.academicYearId ?? 1;

        // 1. Obter todos os alunos matriculados na classe
        const studentsInClass = await db.select().from(schema.students)
          .where(eq(schema.students.enrolledClassId, classId));

        // 2. Obter todas as disciplinas da classe
        const subjectsOfClass = await db.select().from(schema.subjects)
          .where(eq(schema.subjects.classId, classId));

        // 3. Obter todas as mini-pautas da classe no ano lectivo
        const miniPautasData = await db.select().from(schema.miniPautas)
          .where(eq(schema.miniPautas.classId, classId));

        // 4. Para cada aluno x disciplina, garantir que existe uma linha em mini_pautas
        for (const student of studentsInClass) {
          for (const subject of subjectsOfClass) {
            const exists = miniPautasData.find(
              (mp) => mp.studentId === student.id && mp.subjectId === subject.id
            );
            if (!exists) {
              await db.insert(schema.miniPautas).values({
                studentId: student.id,
                subjectId: subject.id,
                classId,
                academicYearId,
                mac1: null,
                npp1: null,
                npt1: null,
                mac2: null,
                npp2: null,
                npt2: null,
                mac3: null,
                npp3: null,
                npt3: null,
                mt1: null,
                mt2: null,
                mt3: null,
                mfd: null,
                exame: null,
                mfdFinal: null,
              });
            }
          }
        }

        // 5. Re-buscar os dados (agora com todas as linhas inicializadas)
        const finalMiniPautas = await db.select().from(schema.miniPautas)
          .where(eq(schema.miniPautas.classId, classId));

        // 6. Re-buscar alunos e disciplinas (pode ter mudado)
        const finalStudents = await db.select().from(schema.students)
          .where(eq(schema.students.enrolledClassId, classId));
        const finalSubjects = await db.select().from(schema.subjects)
          .where(eq(schema.subjects.classId, classId));

        return {
          classId,
          academicYearId,
          students: finalStudents,
          subjects: finalSubjects,
          miniPautas: finalMiniPautas,
        };
      }),

    // Gera a pauta geral completa de uma turma
    geralCompleta: publicProcedure
      .input(z.object({ classId: z.number(), academicYearId: z.number().optional() }))
      .query(async ({ input }) => {
        const db = await dbOrThrow();
        const classId = input.classId;
        const academicYearId = input.academicYearId ?? 1;

        const studentsInClass = await db.select().from(schema.students)
          .where(eq(schema.students.enrolledClassId, classId));

        const subjectsOfClass = await db.select().from(schema.subjects)
          .where(eq(schema.subjects.classId, classId));

        const pautasData = await db.select().from(schema.pautasGerais)
          .where(eq(schema.pautasGerais.classId, classId));

        // Garantir linhas para todos os alunos x disciplinas
        for (const student of studentsInClass) {
          for (const subject of subjectsOfClass) {
            const exists = pautasData.find(
              (pg) => pg.studentId === student.id && pg.subjectId === subject.id
            );
            if (!exists) {
              await db.insert(schema.pautasGerais).values({
                studentId: student.id,
                subjectId: subject.id,
                classId,
                academicYearId,
                mdf: null,
                mf: null,
              });
            }
          }
        }

        const finalPautas = await db.select().from(schema.pautasGerais)
          .where(eq(schema.pautasGerais.classId, classId));
        const finalStudents = await db.select().from(schema.students)
          .where(eq(schema.students.enrolledClassId, classId));
        const finalSubjects = await db.select().from(schema.subjects)
          .where(eq(schema.subjects.classId, classId));

        return {
          classId,
          academicYearId,
          students: finalStudents,
          subjects: finalSubjects,
          pautas: finalPautas,
        };
      }),
  }),

  // Pautas Gerais
  pautasGerais: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.pautasGerais);
    }),
    byClass: publicProcedure
      .input(z.object({ classId: z.number() }))
      .query(async ({ input }) => {
        const db = await dbOrThrow();
        return db.select().from(schema.pautasGerais)
          .where(eq(schema.pautasGerais.classId, input.classId));
      }),
    create: adminProcedure.input(z.any()).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      return simpleCreate(db, schema.pautasGerais, input);
    }),
    update: adminProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const result = await simpleUpdate(db, schema.pautasGerais, input.id, input.data);
      if (!result) throw new Error("Item not found");
      return result;
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await simpleDelete(db, schema.pautasGerais, input.id);
      return { success: true };
    }),
  }),

  // Final Results
  finalResults: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.finalResults);
    }),
    byClass: publicProcedure.input(z.object({ classId: z.number(), academicYearId: z.number() })).query(async ({ input }) => {
      const db = await dbOrThrow();
      return db.select().from(schema.finalResults).where(and(eq(schema.finalResults.classId, input.classId), eq(schema.finalResults.academicYearId, input.academicYearId)));
    }),
    byStudent: publicProcedure.input(z.object({ studentId: z.number() })).query(async ({ input }) => {
      const db = await dbOrThrow();
      return db.select().from(schema.finalResults).where(eq(schema.finalResults.studentId, input.studentId));
    }),
    update: protectedProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.update(schema.finalResults).set(input.data).where(eq(schema.finalResults.id, input.id));
      return db.select().from(schema.finalResults).where(eq(schema.finalResults.id, input.id)).then(r => r[0]);
    }),
  }),

  // Fee Tables
  feeTables: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.feeTables);
    }),
    byClass: publicProcedure.input(z.object({ classId: z.number(), academicYearId: z.number() })).query(async ({ input }) => {
      const db = await dbOrThrow();
      return db.select().from(schema.feeTables).where(and(eq(schema.feeTables.classId, input.classId), eq(schema.feeTables.academicYearId, input.academicYearId)));
    }),
    create: adminProcedure.input(z.any()).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const result = await db.insert(schema.feeTables).values(input);
      const id = result[0]?.insertId;
      return db.select().from(schema.feeTables).where(eq(schema.feeTables.id, id)).then(r => r[0]);
    }),
    update: adminProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.update(schema.feeTables).set(input.data).where(eq(schema.feeTables.id, input.id));
      return db.select().from(schema.feeTables).where(eq(schema.feeTables.id, input.id)).then(r => r[0]);
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.delete(schema.feeTables).where(eq(schema.feeTables.id, input.id));
      return { success: true };
    }),
  }),

  // Invoices
  invoices: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.invoices);
    }),
    byStudent: publicProcedure.input(z.object({ studentId: z.number() })).query(async ({ input }) => {
      const db = await dbOrThrow();
      return db.select().from(schema.invoices).where(eq(schema.invoices.studentId, input.studentId));
    }),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const result = await db.insert(schema.invoices).values(input);
      const id = result[0]?.insertId;
      return db.select().from(schema.invoices).where(eq(schema.invoices.id, id)).then(r => r[0]);
    }),
    update: protectedProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.update(schema.invoices).set(input.data).where(eq(schema.invoices.id, input.id));
      return db.select().from(schema.invoices).where(eq(schema.invoices.id, input.id)).then(r => r[0]);
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.delete(schema.invoices).where(eq(schema.invoices.id, input.id));
      return { success: true };
    }),
  }),

  // Receipts
  receipts: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.receipts);
    }),
    byInvoice: publicProcedure.input(z.object({ invoiceId: z.number() })).query(async ({ input }) => {
      const db = await dbOrThrow();
      return db.select().from(schema.receipts).where(eq(schema.receipts.invoiceId, input.invoiceId));
    }),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const result = await db.insert(schema.receipts).values(input);
      const id = result[0]?.insertId;
      return db.select().from(schema.receipts).where(eq(schema.receipts.id, id)).then(r => r[0]);
    }),
  }),

  // Employees
  employees: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.employees);
    }),
    search: publicProcedure.input(z.object({ query: z.string() })).query(async ({ input }) => {
      const db = await dbOrThrow();
      return db.select().from(schema.employees).where(like(schema.employees.fullName, `%${input.query}%`));
    }),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const result = await db.insert(schema.employees).values(input);
      const id = result[0]?.insertId;
      return db.select().from(schema.employees).where(eq(schema.employees.id, id)).then(r => r[0]);
    }),
    update: protectedProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.update(schema.employees).set(input.data).where(eq(schema.employees.id, input.id));
      return db.select().from(schema.employees).where(eq(schema.employees.id, input.id)).then(r => r[0]);
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.delete(schema.employees).where(eq(schema.employees.id, input.id));
      return { success: true };
    }),
  }),

  // Contracts
  contracts: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.contracts);
    }),
    byEmployee: publicProcedure.input(z.object({ employeeId: z.number() })).query(async ({ input }) => {
      const db = await dbOrThrow();
      return db.select().from(schema.contracts).where(eq(schema.contracts.employeeId, input.employeeId));
    }),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const result = await db.insert(schema.contracts).values(input);
      const id = result[0]?.insertId;
      return db.select().from(schema.contracts).where(eq(schema.contracts.id, id)).then(r => r[0]);
    }),
    update: protectedProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.update(schema.contracts).set(input.data).where(eq(schema.contracts.id, input.id));
      return db.select().from(schema.contracts).where(eq(schema.contracts.id, input.id)).then(r => r[0]);
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.delete(schema.contracts).where(eq(schema.contracts.id, input.id));
      return { success: true };
    }),
  }),

  // Payroll
  payroll: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.payroll);
    }),
    byMonth: publicProcedure.input(z.object({ month: z.string() })).query(async ({ input }) => {
      const db = await dbOrThrow();
      return db.select().from(schema.payroll).where(eq(schema.payroll.month, input.month));
    }),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const result = await db.insert(schema.payroll).values(input);
      const id = result[0]?.insertId;
      return db.select().from(schema.payroll).where(eq(schema.payroll.id, id)).then(r => r[0]);
    }),
    update: protectedProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.update(schema.payroll).set(input.data).where(eq(schema.payroll.id, input.id));
      return db.select().from(schema.payroll).where(eq(schema.payroll.id, input.id)).then(r => r[0]);
    }),
  }),

  // Leaves
  leaves: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.leaves);
    }),
    byEmployee: publicProcedure.input(z.object({ employeeId: z.number() })).query(async ({ input }) => {
      const db = await dbOrThrow();
      return db.select().from(schema.leaves).where(eq(schema.leaves.employeeId, input.employeeId));
    }),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const result = await db.insert(schema.leaves).values(input);
      const id = result[0]?.insertId;
      return db.select().from(schema.leaves).where(eq(schema.leaves.id, id)).then(r => r[0]);
    }),
    update: protectedProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.update(schema.leaves).set(input.data).where(eq(schema.leaves.id, input.id));
      return db.select().from(schema.leaves).where(eq(schema.leaves.id, input.id)).then(r => r[0]);
    }),
  }),

  // Books
  books: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.books);
    }),
    search: publicProcedure.input(z.object({ query: z.string() })).query(async ({ input }) => {
      const db = await dbOrThrow();
      return db.select().from(schema.books).where(like(schema.books.title, `%${input.query}%`));
    }),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const result = await db.insert(schema.books).values(input);
      const id = result[0]?.insertId;
      return db.select().from(schema.books).where(eq(schema.books.id, id)).then(r => r[0]);
    }),
    update: protectedProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.update(schema.books).set(input.data).where(eq(schema.books.id, input.id));
      return db.select().from(schema.books).where(eq(schema.books.id, input.id)).then(r => r[0]);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.delete(schema.books).where(eq(schema.books.id, input.id));
      return { success: true };
    }),
  }),

  // Borrowings
  borrowings: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.borrowings);
    }),
    byStudent: publicProcedure.input(z.object({ studentId: z.number() })).query(async ({ input }) => {
      const db = await dbOrThrow();
      return db.select().from(schema.borrowings).where(eq(schema.borrowings.studentId, input.studentId));
    }),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const result = await db.insert(schema.borrowings).values(input);
      const id = result[0]?.insertId;
      return db.select().from(schema.borrowings).where(eq(schema.borrowings.id, id)).then(r => r[0]);
    }),
    update: protectedProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.update(schema.borrowings).set(input.data).where(eq(schema.borrowings.id, input.id));
      return db.select().from(schema.borrowings).where(eq(schema.borrowings.id, input.id)).then(r => r[0]);
    }),
  }),

  // Assets
  assets: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.assets);
    }),
    byCategory: publicProcedure.input(z.object({ category: z.string() })).query(async ({ input }) => {
      const db = await dbOrThrow();
      return db.select().from(schema.assets).where(eq(schema.assets.category, input.category as any));
    }),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const result = await db.insert(schema.assets).values(input);
      const id = result[0]?.insertId;
      return db.select().from(schema.assets).where(eq(schema.assets.id, id)).then(r => r[0]);
    }),
    update: protectedProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.update(schema.assets).set(input.data).where(eq(schema.assets.id, input.id));
      return db.select().from(schema.assets).where(eq(schema.assets.id, input.id)).then(r => r[0]);
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.delete(schema.assets).where(eq(schema.assets.id, input.id));
      return { success: true };
    }),
  }),

  // Maintenance Records
  maintenanceRecords: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.maintenanceRecords);
    }),
    byAsset: publicProcedure.input(z.object({ assetId: z.number() })).query(async ({ input }) => {
      const db = await dbOrThrow();
      return db.select().from(schema.maintenanceRecords).where(eq(schema.maintenanceRecords.assetId, input.assetId));
    }),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const result = await db.insert(schema.maintenanceRecords).values(input);
      const id = result[0]?.insertId;
      return db.select().from(schema.maintenanceRecords).where(eq(schema.maintenanceRecords.id, id)).then(r => r[0]);
    }),
  }),

  // Notifications
  notifications: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.notifications);
    }),
    unread: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.notifications).where(eq(schema.notifications.read, "nao"));
    }),
    byType: publicProcedure.input(z.object({ type: z.string() })).query(async ({ input }) => {
      const db = await dbOrThrow();
      return db.select().from(schema.notifications).where(eq(schema.notifications.type, input.type as any));
    }),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const result = await db.insert(schema.notifications).values(input);
      const id = result[0]?.insertId;
      return db.select().from(schema.notifications).where(eq(schema.notifications.id, id)).then(r => r[0]);
    }),
    markRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.update(schema.notifications).set({ read: "sim" }).where(eq(schema.notifications.id, input.id));
      return { success: true };
    }),
  }),

  // Lesson Plans
  lessonPlans: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.lessonPlans);
    }),
    byTeacher: publicProcedure.input(z.object({ teacherId: z.number() })).query(async ({ input }) => {
      const db = await dbOrThrow();
      return db.select().from(schema.lessonPlans).where(eq(schema.lessonPlans.teacherId, input.teacherId));
    }),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const result = await db.insert(schema.lessonPlans).values(input);
      const id = result[0]?.insertId;
      return db.select().from(schema.lessonPlans).where(eq(schema.lessonPlans.id, id)).then(r => r[0]);
    }),
    update: protectedProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.update(schema.lessonPlans).set(input.data).where(eq(schema.lessonPlans.id, input.id));
      return db.select().from(schema.lessonPlans).where(eq(schema.lessonPlans.id, input.id)).then(r => r[0]);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.delete(schema.lessonPlans).where(eq(schema.lessonPlans.id, input.id));
      return { success: true };
    }),
  }),

  // Contents
  contents: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.contents);
    }),
    byClassAndSubject: publicProcedure.input(z.object({ classId: z.number(), subjectId: z.number() })).query(async ({ input }) => {
      const db = await dbOrThrow();
      return db.select().from(schema.contents).where(and(eq(schema.contents.classId, input.classId), eq(schema.contents.subjectId, input.subjectId)));
    }),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const result = await db.insert(schema.contents).values(input);
      const id = result[0]?.insertId;
      return db.select().from(schema.contents).where(eq(schema.contents.id, id)).then(r => r[0]);
    }),
    update: protectedProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.update(schema.contents).set(input.data).where(eq(schema.contents.id, input.id));
      return db.select().from(schema.contents).where(eq(schema.contents.id, input.id)).then(r => r[0]);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.delete(schema.contents).where(eq(schema.contents.id, input.id));
      return { success: true };
    }),
  }),

  // Attendance Records
  attendanceRecords: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.attendanceRecords);
    }),
    byClassDate: publicProcedure.input(z.object({ classId: z.number(), subjectId: z.number(), date: z.date() })).query(async ({ input }) => {
      const db = await dbOrThrow();
      return db.select().from(schema.attendanceRecords).where(and(eq(schema.attendanceRecords.classId, input.classId), eq(schema.attendanceRecords.subjectId, input.subjectId), eq(schema.attendanceRecords.date, input.date)));
    }),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const result = await db.insert(schema.attendanceRecords).values(input);
      const id = result[0]?.insertId;
      return db.select().from(schema.attendanceRecords).where(eq(schema.attendanceRecords.id, id)).then(r => r[0]);
    }),
    update: protectedProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await db.update(schema.attendanceRecords).set(input.data).where(eq(schema.attendanceRecords.id, input.id));
      return db.select().from(schema.attendanceRecords).where(eq(schema.attendanceRecords.id, input.id)).then(r => r[0]);
    }),
  }),

  // Declarations
  declarations: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.declarations);
    }),
    byStudent: publicProcedure.input(z.object({ studentId: z.number() })).query(async ({ input }) => {
      const db = await dbOrThrow();
      return db.select().from(schema.declarations).where(eq(schema.declarations.studentId, input.studentId));
    }),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const result = await db.insert(schema.declarations).values(input);
      const id = result[0]?.insertId;
      return db.select().from(schema.declarations).where(eq(schema.declarations.id, id)).then(r => r[0]);
    }),
    byId: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const db = await dbOrThrow();
      const declaration = await db.select().from(schema.declarations).where(eq(schema.declarations.id, input.id)).then(r => r[0]);
      if (!declaration) return null;

      // Fetch student details
      const students = await db.select().from(schema.students).where(eq(schema.students.id, declaration.studentId));
      const student = students.length > 0 ? students[0] : null;

      // Fetch school config
      const { getSchoolConfig } = await import("./db");
      const schoolConfig = await getSchoolConfig(db);

      // Fetch province and municipality names if available
      let provinceName = "";
      let municipalityName = "";
      if (schoolConfig?.provinceId) {
        const provs = await db.select().from(schema.angolaProvinces).where(eq(schema.angolaProvinces.id, schoolConfig.provinceId));
        if (provs.length > 0) provinceName = provs[0].name;
      }
      if (schoolConfig?.municipalityId) {
        const muns = await db.select().from(schema.angolaMunicipalities).where(eq(schema.angolaMunicipalities.id, schoolConfig.municipalityId));
        if (muns.length > 0) municipalityName = muns[0].name;
      }

      return {
        declaration,
        student,
        schoolConfig: {
          ...schoolConfig,
          provinceName,
          municipalityName,
        },
      };
    }),
  }),

  // Audit Logs
  auditLogs: router({
    list: adminProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(schema.auditLogs).orderBy(desc(schema.auditLogs.createdAt)).limit(100);
    }),
  }),

  // Angola Education Levels
  educationLevels: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return getEducationLevels(db);
    }),
  }),

  // Angola Provinces
  angolaProvinces: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return getAngolaProvinces(db);
    }),
  }),

  // Angola Municipalities
  angolaMunicipalities: router({
    list: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      return getAngolaMunicipalities(db);
    }),
    byProvince: publicProcedure.input(z.object({ provinceId: z.number() })).query(async ({ input }) => {
      const db = await dbOrThrow();
      return getAngolaMunicipalitiesByProvince(db, input.provinceId);
    }),
  }),

  // Subjects by education level
  subjectsByLevel: router({
    list: publicProcedure.input(z.object({ educationLevel: z.string() })).query(async ({ input }) => {
      const db = await dbOrThrow();
      return db.select().from(schema.subjects).where(eq(schema.subjects.educationLevel, input.educationLevel));
    }),
  }),
  // School Config (single record - get/update)
  atas: router({
    list: publicProcedure.query(async () => {
      const { listAtas } = await import("./atasDb");
      return listAtas();
    }),
    get: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const { getAta } = await import("./atasDb");
      const ata = await getAta(input.id);
      if (!ata) throw new Error("Ata não encontrada");
      return ata;
    }),
    create: adminProcedure.input(z.object({
      classId: z.number(),
      academicYearId: z.number(),
      period: z.enum(["1trimestre", "2trimestre", "3trimestre", "epoca", "final"]),
      numero: z.string().optional(),
      meetingDate: z.string().optional(),
      location: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      agenda: z.string().optional(),
      deliberacoes: z.string().optional(),
      observacoes: z.string().optional(),
      directorName: z.string().optional(),
      coordenadorName: z.string().optional(),
      conselhoMembrosJson: z.string().optional(),
      resumoJson: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { createAta } = await import("./atasDb");
      const data: any = { ...input };
      if (input.meetingDate) data.meetingDate = new Date(input.meetingDate);
      return createAta(data);
    }),
    update: adminProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      const { updateAta } = await import("./atasDb");
      const data: any = { ...input.data };
      if (data.meetingDate) data.meetingDate = new Date(data.meetingDate);
      const result = await updateAta(input.id, data);
      if (!result) throw new Error("Ata não encontrada");
      return result;
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const { deleteAta } = await import("./atasDb");
      await deleteAta(input.id);
      return { success: true };
    }),
    // Validação digital do director — aprova a ata
    approve: adminProcedure.input(z.object({ id: z.number(), directorName: z.string().min(2) })).mutation(async ({ input, ctx }) => {
      const db = await dbOrThrow();
      const { getAta, updateAta } = await import("./atasDb");
      const ata = await getAta(input.id);
      if (!ata) throw new Error("Ata não encontrada");
      if (ata.status === "aprovada") throw new Error("A ata já está aprovada. Reabrir como rascunho para alterar.");
      const approvedAt = new Date();
      const result = await updateAta(input.id, {
        status: "aprovada",
        approvedAt,
        approvedBy: input.directorName,
        approvedByUserId: Number(ctx.user?.id ?? 0),
      });
      if (!result) throw new Error("Erro ao aprovar a ata");
      return { success: true, approvedAt, approvedBy: input.directorName };
    }),
    // Reabrir a ata como rascunho (retira a validação digital)
    unapprove: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const { getAta, updateAta } = await import("./atasDb");
      const ata = await getAta(input.id);
      if (!ata) throw new Error("Ata não encontrada");
      const result = await updateAta(input.id, {
        status: "rascunho",
        approvedAt: null as any,
        approvedBy: null as any,
        approvedByUserId: null as any,
      });
      if (!result) throw new Error("Erro ao reabrir a ata");
      return { success: true };
    }),
    resumo: adminProcedure.input(z.object({
      classId: z.number(),
      academicYearId: z.number(),
      period: z.enum(["1trimestre", "2trimestre", "3trimestre", "epoca", "final"]),
    })).query(async ({ input }) => {
      const { calcularResumoAta } = await import("./atasDb");
      return calcularResumoAta(input.classId, input.academicYearId, input.period);
    }),
  }),
  schoolConfig: router({
    get: publicProcedure.query(async () => {
      const db = await dbOrThrow();
      const { getSchoolConfig } = await import("./db");
      return getSchoolConfig(db);
    }),
    update: adminProcedure.input(z.object({
      name: z.string().optional(),
      code: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      logoUrl: z.string().optional(),
      nif: z.string().optional(),
      professorName: z.string().optional(),
      provinceId: z.number().optional(),
      municipalityId: z.number().optional(),
    })).mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const { upsertSchoolConfig } = await import("./db");
      return upsertSchoolConfig(db, input);
    }),
  }),
});

export type AppRouter = typeof appRouter;
