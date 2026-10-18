/**
 * Estrutura moderna da Mini-Pauta — "MINI-PAUTA DE APROVEITAMENTO ACADÉMICO"
 * Baseada no modelo oficial do MED (referência do utilizador) adaptado ao RAA 106/26.
 *
 * Inclui o painel "Perfil de Aproveitamento Académico" com 10 métricas estatísticas:
 * - Alunos matriculados
 * - Alunos sem avaliação
 * - Reprovados por Faltas (sem registos de MAC/NPP em todos os trimestres)
 * - Anulações de matrícula (sem dados de aluno)
 * - Alunos transferidos (placeholder)
 * - Alunos avaliados
 * - Nº de positivas / Nº de negativas / % + / % -
 */
import {
  calcularMT, calcularMFD, calcularMFDFinal,
  getClassificacaoQualitativa, getObservacaoAptidao,
} from "./raa";

export interface MiniPautaPerfilStats {
  matriculados: number;
  semAvaliacao: number;
  reprovadosFaltas: number;
  anulacoes: number;
  transferidos: number;
  avaliados: number;
  positivas: number;
  negativas: number;
  pctPositivas: number;
  pctNegativas: number;
}

export interface MiniPautaRowCalc {
  mac1: number | null;
  npp1: number | null;
  npt1: number | null;
  mt1: number | null;
  mac2: number | null;
  npp2: number | null;
  npt2: number | null;
  mt2: number | null;
  mac3: number | null;
  npp3: number | null;
  npt3: number | null;
  mt3: number | null;
  mfd: number | null;
  exame: number | null;
  mfdFinal: number | null;
  classificacaoQualitativa: string | null;
  observacao: string | null;
  temNotasTrimestre: boolean; // pelo menos um MAC ou prova lançada no ano
}

/** Calcula todos os valores derivados de uma linha de mini-pauta */
export function calcularLinhaMiniPauta(row: Partial<MiniPautaRowCalc>): MiniPautaRowCalc {
  const mt1 = row.mt1 ?? calcularMT(row.mac1 ?? null, row.npp1 ?? null, row.npt1 ?? null);
  const mt2 = row.mt2 ?? calcularMT(row.mac2 ?? null, row.npp2 ?? null, row.npt2 ?? null);
  const mt3 = row.mt3 ?? calcularMT(row.mac3 ?? null, row.npp3 ?? null, row.npt3 ?? null);
  const mfd = row.mfd ?? calcularMFD(mt1, mt2, mt3);
  const mfdFinal = row.mfdFinal ?? calcularMFDFinal(mfd, row.exame ?? null);
  const classificacaoQualitativa = row.classificacaoQualitativa ?? getClassificacaoQualitativa(mfdFinal);
  const observacao = row.observacao ?? getObservacaoAptidao(mfdFinal);
  const temNotasTrimestre = [row.mac1, row.npp1, row.npt1, row.mac2, row.npp2, row.npt2, row.mac3, row.npp3, row.npt3]
    .some((v) => v !== null && v !== undefined);
  return {
    mac1: row.mac1 ?? null, npp1: row.npp1 ?? null, npt1: row.npt1 ?? null, mt1,
    mac2: row.mac2 ?? null, npp2: row.npp2 ?? null, npt2: row.npt2 ?? null, mt2,
    mac3: row.mac3 ?? null, npp3: row.npp3 ?? null, npt3: row.npt3 ?? null, mt3,
    mfd, exame: row.exame ?? null, mfdFinal, classificacaoQualitativa, observacao, temNotasTrimestre,
  };
}

/**
 * Calcula o Perfil de Aproveitamento Académico da turma
 * (mesmas 10 métricas do modelo oficial do MED)
 */
export function calcularPerfilTurma(rows: (Partial<MiniPautaRowCalc> & { studentId?: number | null })[]): MiniPautaPerfilStats {
  const alunos = new Map<number | null, Partial<MiniPautaRowCalc>[]>();
  for (const r of rows) {
    const list = alunos.get(r.studentId ?? null) ?? [];
    list.push(r);
    alunos.set(r.studentId ?? null, list);
  }

  const ids = Array.from(alunos.keys());
  const matriculados = ids.filter((id) => id !== null).length;
  const anulacoes = ids.filter((id) => id === null).length;

  let positivas = 0;
  let negativas = 0;
  let semAvaliacao = 0;
  let reprovadosFaltas = 0;
  let avaliados = 0;

  for (const [alunoId, alunoRows] of Array.from(alunos.entries())) {
    if (alunoId === null) continue;
    // Aluno com alguma nota final (em qualquer disciplina): avaliado
    const comNotaFinal = alunoRows.some((r) => calcularLinhaMiniPauta(r).mfdFinal !== null);
    const comNotasTrimestre = alunoRows.some((r) => calcularLinhaMiniPauta(r).temNotasTrimestre);

    if (comNotaFinal) {
      avaliados++;
      const negativasNaLinha = alunoRows.filter((r: Partial<MiniPautaRowCalc>) => {
        const c = calcularLinhaMiniPauta(r);
        return c.mfdFinal !== null && c.mfdFinal < 10;
      });
      if (negativasNaLinha.length > 0) negativas++;
      else positivas++;
    } else if (!comNotasTrimestre) {
      // Sem qualquer nota lançada: reprovado por faltas (conforme referência do MED)
      reprovadosFaltas++;
      semAvaliacao++;
    } else {
      semAvaliacao++;
    }
  }

  const classificadas = positivas + negativas;
  return {
    matriculados,
    semAvaliacao,
    reprovadosFaltas,
    anulacoes,
    transferidos: 0,
    avaliados,
    positivas,
    negativas,
    pctPositivas: classificadas > 0 ? Math.round((positivas / classificadas) * 1000) / 10 : 0,
    pctNegativas: classificadas > 0 ? Math.round((negativas / classificadas) * 1000) / 10 : 0,
  };
}

/** Formata valor para exibição: "—" quando nulo */
export function fmtNota(v: number | null, digits = 1): string {
  return v !== null ? Number(v).toFixed(digits) : "—";
}
