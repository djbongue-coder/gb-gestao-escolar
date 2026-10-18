import { describe, it, expect } from "vitest";
import {
  calcularLinhaMiniPauta,
  calcularPerfilTurma,
  fmtNota,
} from "../shared/minipauta";

describe("calcularLinhaMiniPauta", () => {
  it("calcula MT = (MAC + NPT)/2, MFD = média dos trimestres, MFD Final = (MFD+Exame)/2", () => {
    const calc = calcularLinhaMiniPauta({
      mac1: 15, npp1: 2, npt1: 12,
      mac2: 10, npp2: 1, npt2: 9,
      mac3: 10, npp3: 0, npt3: 8,
      exame: 12,
    });
    expect(calc.mt1).toBe(13.5); // (15+12)/2
    expect(calc.mt2).toBe(9.5);  // (10+9)/2
    expect(calc.mt3).toBe(9);    // (10+8)/2
    expect(calc.mfd).toBe(10.7); // (13.5+9.5+9)/3
    expect(calc.mfdFinal).toBe(11.4); // (10.7+12)/2
    expect(calc.classificacaoQualitativa).toBe("Suficiente");
    expect(calc.observacao).toBe("APTO");
  });

  it("NÃO AVALIADA quando sem notas", () => {
    const calc = calcularLinhaMiniPauta({});
    expect(calc.mfdFinal).toBeNull();
    expect(calc.observacao).toBe("NÃO AVALIADA");
    expect(calc.temNotasTrimestre).toBe(false);
  });

  it("classificação qualitativa correta por faixa", () => {
    expect(calcularLinhaMiniPauta({ mfdFinal: 18 }).classificacaoQualitativa).toBe("Excelente");
    expect(calcularLinhaMiniPauta({ mfdFinal: 14 }).classificacaoQualitativa).toBe("Bom");
    expect(calcularLinhaMiniPauta({ mfdFinal: 10 }).classificacaoQualitativa).toBe("Suficiente");
    expect(calcularLinhaMiniPauta({ mfdFinal: 9 }).classificacaoQualitativa).toBe("Insuficiente");
    expect(calcularLinhaMiniPauta({ mfdFinal: 9 }).observacao).toBe("NÃO APTO");
  });

  it("usa NPP como prova quando NPT é nulo", () => {
    const calc = calcularLinhaMiniPauta({ mac1: 10, npp1: 10, npt1: null });
    expect(calc.mt1).toBe(10);
  });

  it("MFD Final = MFD quando não há exame", () => {
    const calc = calcularLinhaMiniPauta({ mac1: 10, npp1: 10, npt1: 10 });
    expect(calc.mfdFinal).toBe(10);
  });
});

describe("calcularPerfilTurma", () => {
  const makeRows = (alunoId: number, dados: Record<string, any>[]) =>
    dados.map((d) => ({ studentId: alunoId, ...d }));

  it("conta matriculados e avaliados corretamente", () => {
    const rows = [
      ...makeRows(1, [{ mac1: 10, npp1: 10, npt1: 10 }]),
      ...makeRows(2, [{ mac1: 5, npp1: 5, npt1: 5 }]),
    ];
    const perfil = calcularPerfilTurma(rows);
    expect(perfil.matriculados).toBe(2);
    expect(perfil.avaliados).toBe(2);
    expect(perfil.positivas).toBe(1); // aluno 1: MFD Final = 10 (positiva)
    expect(perfil.negativas).toBe(1); // aluno 2: MFD Final = 5 (negativa)
    expect(perfil.pctPositivas).toBe(50);
  });

  it("aluno sem qualquer nota conta como sem avaliação / reprovado por faltas", () => {
    const rows = [
      ...makeRows(1, [{ mac1: 10, npp1: 10, npt1: 10 }]),
      ...makeRows(2, [{}]),
    ];
    const perfil = calcularPerfilTurma(rows);
    expect(perfil.matriculados).toBe(2);
    expect(perfil.avaliados).toBe(1);
    expect(perfil.semAvaliacao).toBe(1);
    expect(perfil.reprovadosFaltas).toBe(1);
  });
});

describe("fmtNota", () => {
  it("formata com 1 decimal e retorna travessão quando nulo", () => {
    expect(fmtNota(10.5)).toBe("10.5");
    expect(fmtNota(10)).toBe("10.0");
    expect(fmtNota(null)).toBe("—");
    expect(fmtNota(10, 0)).toBe("10");
  });
});
