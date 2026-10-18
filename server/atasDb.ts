import { eq, desc, and } from "drizzle-orm";
import { atas, miniPautas, students, subjects, schools } from "../drizzle/schema";
import { getDb } from "./db";
import { calcularPerfilTurma, calcularLinhaMiniPauta } from "../shared/minipauta";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Base de dados indisponível");
  return db;
}

export type PeriodLabel = "1trimestre" | "2trimestre" | "3trimestre" | "epoca" | "final";

export const periodLabels: Record<PeriodLabel, string> = {
  "1trimestre": "1.º Trimestre",
  "2trimestre": "2.º Trimestre",
  "3trimestre": "3.º Trimestre",
  epoca: "Época Especial",
  final: "Avaliação Final",
};

export async function listAtas() {
  const db = await requireDb();
  return db.select().from(atas).orderBy(desc(atas.createdAt));
}

export async function getAta(id: number) {
  const db = await requireDb();
  const rows = await db.select().from(atas).where(eq(atas.id, id));
  return rows[0] ?? null;
}

export async function createAta(data: {
  classId: number;
  academicYearId: number;
  period: PeriodLabel;
  numero?: string;
  meetingDate?: Date;
  location?: string;
  startTime?: string;
  endTime?: string;
  agenda?: string;
  deliberacoes?: string;
  observacoes?: string;
  directorName?: string;
  coordenadorName?: string;
  conselhoMembrosJson?: string;
  resumoJson?: string;
}) {
  const db = await requireDb();
  const [result] = await db.insert(atas).values(data);
  return result;
}

export async function updateAta(
  id: number,
  data: Partial<{
    classId: number;
    academicYearId: number;
    period: PeriodLabel;
    numero: string;
    meetingDate: Date;
    location: string;
    startTime: string;
    endTime: string;
    agenda: string;
    deliberacoes: string;
    observacoes: string;
    directorName: string;
    coordenadorName: string;
    conselhoMembrosJson: string;
    resumoJson: string;
    status: "rascunho" | "aprovada";
    approvedAt: Date;
    approvedBy: string;
    approvedByUserId: number;
  }> & Record<string, unknown>,
) {
  const db = await requireDb();
  await db.update(atas).set(data).where(eq(atas.id, id));
  return getAta(id);
}

export async function deleteAta(id: number) {
  const db = await requireDb();
  await db.delete(atas).where(eq(atas.id, id));
  return true;
}

export interface ResumoDisciplina {
  subjectName: string;
  alunosAvaliados: number;
  mediaTurma: number;
  positivas: number;
  negativas: number;
  taxaAprovacao: number;
}

export interface ResumoAta {
  totalMatriculados: number;
  avaliados: number;
  semAvaliacao: number;
  reprovadosFaltas: number;
  anulacoes: number;
  transferidos: number;
  positivas: number;
  negativas: number;
  taxaPositivas: number;
  taxaNegativas: number;
  mediaGeral: number;
  disciplinas: ResumoDisciplina[];
}

/**
 * Calcula o resumo de resultados da turma a partir das mini-pautas,
 * seguindo o RAA 106/26.
 */
export async function calcularResumoAta(
  classId: number,
  academicYearId: number,
  period: PeriodLabel,
): Promise<ResumoAta> {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(miniPautas)
    .where(and(eq(miniPautas.classId, classId), eq(miniPautas.academicYearId, academicYearId)));

  const [alunosRows, subjectRows] = await Promise.all([
    db.select().from(students).where(eq(students.enrolledClassId, classId)),
    db.select().from(subjects),
  ]);
  const subjectMap = new Map<number, string>(subjectRows.map((s: { id: number; name: string }) => [s.id, s.name]));

  const alunosUnicos = new Map<number, typeof rows[number][]>();
  for (const r of rows) {
    if (!alunosUnicos.has(r.studentId)) alunosUnicos.set(r.studentId, []);
    alunosUnicos.get(r.studentId)!.push(r);
  }

  const disciplinas = new Map<string, ResumoDisciplina>();

  for (const regs of Array.from(alunosUnicos.values())) {
    for (const reg of regs) {
      const calc = calcularLinhaMiniPauta(reg as any);
      const nome = subjectMap.get(reg.subjectId) ?? `#${reg.subjectId}`;
      if (!disciplinas.has(nome)) {
        disciplinas.set(nome, {
          subjectName: nome,
          alunosAvaliados: 0,
          mediaTurma: 0,
          positivas: 0,
          negativas: 0,
          taxaAprovacao: 0,
        });
      }
      const d = disciplinas.get(nome)!;
      const notas: number[] = [];
      if (calc.mfd !== null) notas.push(calc.mfd);
      if (calc.mfdFinal !== null) notas.push(calc.mfdFinal);
      if (notas.length > 0) {
        d.alunosAvaliados += 1;
        d.mediaTurma += notas[notas.length - 1];
        const media = notas[notas.length - 1];
        if (media >= 10) d.positivas += 1;
        else d.negativas += 1;
      }
    }
  }

  for (const d of Array.from(disciplinas.values())) {
    if (d.alunosAvaliados > 0) {
      d.mediaTurma = Math.round((d.mediaTurma / d.alunosAvaliados) * 100) / 100;
      d.taxaAprovacao = Math.round((d.positivas / d.alunosAvaliados) * 10000) / 100;
    }
  }

  // Estatísticas gerais: usar o perfil agregado da turma
  const perfil = calcularPerfilTurma(rows as any);
  const totalMatriculados = alunosRows.length;
  const positivas = perfil.positivas;
  const negativas = perfil.negativas;
  const avaliados = perfil.avaliados;
  const taxaPositivas = avaliados > 0 ? Math.round((positivas / avaliados) * 10000) / 100 : 0;
  const taxaNegativas = avaliados > 0 ? Math.round((negativas / avaliados) * 10000) / 100 : 0;

  const medias: number[] = [];
  for (const regs of Array.from(alunosUnicos.values())) {
    for (const reg of regs) {
      const calc = calcularLinhaMiniPauta(reg as any);
      if (calc.mfdFinal !== null) medias.push(calc.mfdFinal);
      else if (calc.mfd !== null) medias.push(calc.mfd);
    }
  }
  const mediaGeral =
    medias.length > 0 ? Math.round((medias.reduce((a, b) => a + b, 0) / medias.length) * 100) / 100 : 0;

  return {
    totalMatriculados,
    avaliados,
    semAvaliacao: perfil.semAvaliacao,
    reprovadosFaltas: perfil.reprovadosFaltas,
    anulacoes: perfil.anulacoes,
    transferidos: perfil.transferidos,
    positivas,
    negativas,
    taxaPositivas,
    taxaNegativas,
    mediaGeral,
    disciplinas: Array.from(disciplinas.values()).sort((a, b) => a.subjectName.localeCompare(b.subjectName)),
  };
}

export async function getAtaSchoolInfo() {
  const db = await requireDb();
  const [sc] = await db.select().from(schools).limit(1);
  return sc ?? null;
}
