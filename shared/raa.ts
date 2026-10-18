/**
 * Sistema de Avaliação Angolano — Decreto Executivo n.º 106/26 (RAA)
 * Fórmulas oficiais de cálculo e escala de classificação
 */

/**
 * Calcula a média do trimestre: MT = (MAC + NPT) / 2
 * Se NPT for nulo, usa (MAC + NPP) / 2 (prova do professor substitui)
 */
export function calcularMT(mac: number | null, npp: number | null, npt: number | null): number | null {
  if (mac === null || (npt === null && npp === null)) return null;
  const prova = npt ?? npp;
  if (prova === null) return null;
  return Math.round(((mac + prova) / 2) * 10) / 10;
}

/**
 * Calcula a Média Final de Disciplina: MFD = (MT1 + MT2 + MT3) / 3
 */
export function calcularMFD(mt1: number | null, mt2: number | null, mt3: number | null): number | null {
  const trimestres = [mt1, mt2, mt3].filter((v) => v !== null);
  if (trimestres.length === 0) return null;
  const sum = trimestres.reduce((a, b) => a + (b as number), 0);
  return Math.round((sum / trimestres.length) * 10) / 10;
}

/**
 * Calcula a MFD Final (classes de exame): MFD Final = (MFD + EXAME) / 2
 */
export function calcularMFDFinal(mfd: number | null, exame: number | null): number | null {
  if (mfd === null) return null;
  if (exame === null) return mfd; // Se não há exame, MFD Final = MFD
  return Math.round(((mfd + exame) / 2) * 10) / 10;
}

/**
 * Calcula a Média Final Global: MF = média de todas as MDF
 */
export function calcularMF(mdfs: (number | null)[]): number | null {
  const validos = mdfs.filter((v) => v !== null);
  if (validos.length === 0) return null;
  const sum = validos.reduce((a, b) => a + (b as number), 0);
  return Math.round((sum / validos.length) * 10) / 10;
}

/**
 * Retorna a classificação qualificativa baseada na nota final
 * Escala oficial: 16-20 Excelente, 14-15 Bom, 10-13 Suficiente, 0-9 Insuficiente
 */
export function getClassificacaoQualitativa(notaFinal: number | null): string | null {
  if (notaFinal === null) return null;
  if (notaFinal >= 16) return "Excelente";
  if (notaFinal >= 14) return "Bom";
  if (notaFinal >= 10) return "Suficiente";
  return "Insuficiente";
}

/**
 * Retorna a observação baseada na nota final
 * APTO/TRANSITA ≥ 10, NÃO APTO/NÃO TRANSITA < 10, NÃO AVALIADA sem notas
 */
export function getObservacao(notaFinal: number | null): string {
  if (notaFinal === null) return "NÃO AVALIADA";
  if (notaFinal >= 10) return "TRANSITA";
  return "NÃO TRANSITA";
}

/**
 * Retorna a observação aptidão (disciplina individual)
 * APTO ≥ 10, NÃO APTO < 10, NÃO AVALIADA sem notas
 */
export function getObservacaoAptidao(notaFinal: number | null): string {
  if (notaFinal === null) return "NÃO AVALIADA";
  if (notaFinal >= 10) return "APTO";
  return "NÃO APTO";
}
