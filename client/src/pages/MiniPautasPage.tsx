import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit2, Trash2, Printer, FileDown, Plus } from "lucide-react";
// @ts-ignore — jspdf-autotable adds autoTable method at runtime
import type { jsPDF as jsPDFType } from "jspdf";

type DocWithAutoTable = jsPDFType & { autoTable: (opts: any) => void; lastAutoTable: { finalY: number } };
import { toast } from "sonner";
import {
  calcularPerfilTurma, calcularLinhaMiniPauta, fmtNota,
  type MiniPautaRowCalc, type MiniPautaPerfilStats,
} from "@shared/minipauta";

interface MiniPautaRow {
  id: number;
  studentId: number;
  subjectId: number;
  classId: number;
  academicYearId: number;
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
}

function getObservacaoBadge(obs: string | null, nota: number | null) {
  if (obs === "NÃO AVALIADA" || nota === null) return <Badge variant="outline" className="bg-gray-200 text-gray-700 text-xs font-bold">NÃO AVALIADA</Badge>;
  if ((nota ?? 0) >= 10) return <Badge className="bg-green-500 text-white hover:bg-green-500 text-xs font-bold">APTO</Badge>;
  return <Badge className="bg-red-500 text-white hover:bg-red-500 text-xs font-bold">NÃO APTO</Badge>;
}

/** Retorna a cor de fundo da linha baseada na observação */
function getRowColor(obs: string | null, nota: number | null): string {
  if (obs === "NÃO AVALIADA" || nota === null) return "bg-gray-50";
  if ((nota ?? 0) >= 10) return "bg-green-50";
  return "bg-red-50";
}

/** Retorna a cor do texto para a célula MFD Final */
function getFinalNotaColor(nota: number | null): string {
  if (nota === null) return "text-muted-foreground";
  if (nota >= 16) return "text-emerald-700 font-extrabold";
  if (nota >= 14) return "text-blue-700 font-bold";
  if (nota >= 10) return "text-green-700 font-bold";
  return "text-red-700 font-bold";
}

function getQualitativaBadge(classif: string | null) {
  if (!classif) return null;
  const colors: Record<string, string> = {
    "Excelente": "bg-emerald-100 text-emerald-800",
    "Bom": "bg-blue-100 text-blue-800",
    "Suficiente": "bg-yellow-100 text-yellow-800",
    "Insuficiente": "bg-red-100 text-red-800",
  };
  return <Badge className={`${colors[classif] || "bg-gray-100 text-gray-600"} text-xs`}>{classif}</Badge>;
}

/** Cor de fundo do pill de classificação */
function getObservacaoColor(obs: string | null): string {
  if (obs === "NÃO AVALIADA") return "bg-gray-400";
  if (obs === "APTO" || obs === "TRANSITA") return "bg-green-600";
  if (obs === "NÃO APTO" || obs === "NÃO TRANSITA") return "bg-red-600";
  return "bg-gray-400";
}

/** Cabeçalho oficial impresso no PDF (REPÚBLICA DE ANGOLA ...) */
function pdfHeaderBlock(doc: any, pageWidth: number, schoolConfig: any) {
  let y = 12;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("REPÚBLICA DE ANGOLA", pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.text("MINISTÉRIO DA EDUCAÇÃO", pageWidth / 2, y, { align: "center" });
  y += 5;
  if (schoolConfig?.name) {
    doc.text(schoolConfig.name, pageWidth / 2, y, { align: "center" });
    y += 5;
  }
  if (schoolConfig?.nif) {
    doc.setFontSize(9);
    doc.text(`NIF: ${schoolConfig.nif}`, pageWidth / 2, y, { align: "center" });
    y += 4.5;
  }
  if (schoolConfig?.address) {
    doc.setFontSize(9);
    doc.text(schoolConfig.address, pageWidth / 2, y, { align: "center" });
    y += 4.5;
  }
  y += 1;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("MINI-PAUTA DE APROVEITAMENTO ACADÉMICO", pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.setLineWidth(0.4);
  doc.line(10, y, pageWidth - 10, y);
  y += 1;
  return y;
}

export default function MiniPautasPage() {
  const [classId, setClassId] = useState<string>("");
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: miniPautas, isLoading, refetch } = trpc.miniPautas.list.useQuery(undefined as never);
  const { data: schoolConfigData } = trpc.schoolConfig.get.useQuery(undefined as never);
  const { data: students } = trpc.students.list.useQuery(undefined as never);
  const { data: subjects } = trpc.subjects.list.useQuery(undefined as never);
  const { data: classes } = trpc.classes.list.useQuery(undefined as never);
  const { data: currentYearData } = trpc.academicYears.list.useQuery(undefined as never);

  const createMutation = trpc.miniPautas.create.useMutation({
    onSuccess: () => { refetch(); toast.success("Registo criado com sucesso"); },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const updateMutation = trpc.miniPautas.update.useMutation({
    onSuccess: () => { refetch(); toast.success("Registo actualizado com sucesso"); },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const deleteMutation = trpc.miniPautas.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Registo eliminado"); },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedBoletimStudent, setSelectedBoletimStudent] = useState<string>("");
  const [editData, setEditData] = useState<Partial<MiniPautaRow>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [addData, setAddData] = useState<Partial<MiniPautaRow>>({ classId: 1, academicYearId: 1 });

  const filtered = useMemo(() => {
    if (!miniPautas) return [];
    return miniPautas.filter((p: MiniPautaRow) =>
      !classId || classId === "all" || p.classId === Number(classId)
    );
  }, [miniPautas, classId]);

  const perfil: MiniPautaPerfilStats = useMemo(() => calcularPerfilTurma(filtered), [filtered]);

  const handlePrint = () => {
    window.print();
  };

  // Exportar Mini-Pauta para Excel (estrutura moderna)
  const exportExcel = async () => {
    if (filtered.length === 0) {
      toast.warning("Sem registos para exportar.");
      return;
    }
    const XLSXModule = await import("xlsx");
    const XLSX = XLSXModule.default || XLSXModule;
    const wb = XLSX.utils.book_new();

    // Cabeçalho oficial
    const school = schoolConfigData as any;
    const official: any[][] = [
      ["REPÚBLICA DE ANGOLA"],
      ["MINISTÉRIO DA EDUCAÇÃO"],
      [school?.name || ""],
      [school?.nif ? `NIF: ${school.nif}` : ""],
      [school?.address || ""],
      [""],
      ["MINI-PAUTA DE APROVEITAMENTO ACADÉMICO"],
    ];

    // Bloco de identificação
    const ano = (currentYearData as any)?.[0]?.year || new Date().getFullYear().toString();
    const cls = (classes as any)?.find((c: any) => String(c.id) === classId || classId === "all");
    const turmaNome = cls?.name || `Classe ${classId || "Todas"}`;
    // Bloco de identificação (modelo 12ª1.xlsm): Classe | Período | Disciplina | Prof(a)
    const idBlock: any[][] = [
      ["Classe:", turmaNome, "Período:", "Manhã", "Disciplina:", "Todas", "Prof(a):", schoolConfigData?.professorName || ""],
      ["Turma:", classId === "all" ? "Todas" : classId, "Ano Lectivo:", ano],
    ];

    // Cabeçalho da tabela (2 linhas) — modelo 12ª1.xlsm
    const head1 = ["Nº", "Nome do aluno", "Gênero", "Disciplina", "I TRIMESTRE", "", "", "II TRIMESTRE", "", "", "III TRIMESTRE", "", "", "MFD", "EXAME", "MFD F.", "CLASSIFICAÇÃO"];
    const head2 = ["", "", "", "", "MAC", "NPP", "MT", "MAC", "NPP", "MT", "MAC", "NPP", "MT", "", "", "", ""];

    // Dados
    const dataRows: any[][] = filtered.map((row: MiniPautaRow, idx: number) => {
      const calc = calcularLinhaMiniPauta(row);
      const student = (students as any)?.find((s: any) => s.id === row.studentId);
      const subject = (subjects as any)?.find((s: any) => s.id === row.subjectId);
      return [
        idx + 1,
        student?.fullName || `#${row.studentId}`,
        student?.gender === "F" ? "F" : student?.gender === "M" ? "M" : "",
        subject?.name || `#${row.subjectId}`,
        calc.mac1, calc.npp1, calc.mt1,
        calc.mac2, calc.npp2, calc.mt2,
        calc.mac3, calc.npp3, calc.mt3,
        calc.mfd,
        calc.exame,
        calc.mfdFinal,
        calc.observacao || "",
      ];
    });

    // Montar: cabeçalho oficial + identificação + tabela
    const wsData: any[][] = [
      ...official.map((r) => [...r, ...Array(17).fill("")]),
      ...idBlock.map((r) => [...r, ...Array(Math.max(0, 18 - r.length)).fill("")]),
      [""],
      head1,
      head2,
      ...dataRows,
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Larguras
    ws["!cols"] = [
      { wch: 5 }, { wch: 32 }, { wch: 6 }, { wch: 22 }, { wch: 7 }, { wch: 7 }, { wch: 7 },
      { wch: 7 }, { wch: 7 }, { wch: 7 }, { wch: 7 }, { wch: 7 }, { wch: 7 },
      { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 16 },
    ];

    const idStart = official.length;
    const headStart = official.length + idBlock.length + 1;
    // Mesclar cabeçalho oficial e trimestres
    ws["!merges"] = [
      ...official.map((_, i) => ({ s: { r: i, c: 0 }, e: { r: i, c: 16 } })),
      ...idBlock.map((_, i) => ({ s: { r: idStart + i, c: 0 }, e: { r: idStart + i, c: 16 } })),
      { s: { r: headStart, c: 4 }, e: { r: headStart, c: 6 } },
      { s: { r: headStart, c: 7 }, e: { r: headStart, c: 9 } },
      { s: { r: headStart, c: 10 }, e: { r: headStart, c: 12 } },
    ];

    // Formatar MFD Final e CLASSIFICAÇÃO
    const firstDataRow = headStart + 2;
    dataRows.forEach((_, i) => {
      const r = firstDataRow + i;
      const mfdCell = ws[XLSX.utils.encode_cell({ r, c: 15 })];
      if (mfdCell?.v !== null && mfdCell?.v !== undefined && mfdCell.v !== "") {
        mfdCell.s = { font: { bold: true, color: { rgb: Number(mfdCell.v) >= 10 ? "008000" : "C80000" } } } as any;
      }
      const obsCell = ws[XLSX.utils.encode_cell({ r, c: 16 })];
      if (obsCell?.v === "APTO" || obsCell?.v === "TRANSITA") obsCell.s = { font: { bold: true, color: { rgb: "008000" } } } as any;
      else if (obsCell?.v === "NÃO APTO" || obsCell?.v === "NÃO TRANSITA") obsCell.s = { font: { bold: true, color: { rgb: "C80000" } } } as any;
    });

    XLSX.utils.book_append_sheet(wb, ws, "Mini-Pauta");
    const fileName = `Mini-Pauta_${turmaNome.replace(/\s+/g, "_")}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success(`Excel exportado: ${fileName}`);
  };

  // Gerar Mini-Pauta PDF (documento completo da turma, estrutura moderna)
  const generatePDF = async () => {
    if (filtered.length === 0) {
      toast.warning("Sem registos para gerar o documento.");
      return;
    }
    const cls = classes?.find((c: any) => String(c.id) === classId || classId === "all");
    const jsPDFModule = await import("jspdf");
    const jsPDFClass: new (o?: any) => DocWithAutoTable = (jsPDFModule.jsPDF || jsPDFModule.default) as any;
    const autoTableModule = await import("jspdf-autotable");
    // @ts-ignore
    const patchFn = autoTableModule.applyPlugin || autoTableModule.default || autoTableModule;
    // @ts-ignore
    patchFn(jsPDFClass);

    const doc = new jsPDFClass({ orientation: "l", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = pdfHeaderBlock(doc, pageWidth, schoolConfigData);

    // Bloco de identificação (modelo 12ª1.xlsm)
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const ano = currentYearData?.[0]?.year || new Date().getFullYear().toString();
    const turmaNome = cls ? `${cls.name || `Classe ${classId}`}` : (classId === "all" ? "Todas as classes" : `Classe ${classId}`);
    const halfW = pageWidth / 2;
    doc.text(`Classe: ${turmaNome}`, 10, y);
    doc.text(`Período: Manhã`, halfW + 10, y);
    y += 5;
    doc.text(`Turma: ${classId === "all" ? "Todas" : classId}`, 10, y);
    doc.text(`Ano Lectivo: ${ano}`, halfW + 10, y);
    y += 5;
    doc.text(`Disciplina: Todas`, 10, y);
    doc.text(`Prof(a): ${schoolConfigData?.professorName || ""}`, halfW + 10, y);
    y += 7;

    // Título MINI-PAUTA centrado
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("MINI-PAUTA", pageWidth / 2, y, { align: "center" });
    doc.setLineWidth(0.5);
    doc.line(10, y + 2, pageWidth - 10, y + 2);
    y += 8;

    // Perfil de Aproveitamento Académico (tabela estatística do modelo oficial)
    const statsRows = [
      ["Alunos matriculados", perfil.matriculados, "Alunos sem avaliação", perfil.semAvaliacao],
      ["Reprovados por Faltas", perfil.reprovadosFaltas, "Anulações de matrícula", perfil.anulacoes],
      ["Alunos Transferidos", perfil.transferidos, "Alunos Avaliados", perfil.avaliados],
      ["Nº de Positivas", perfil.positivas, "Nº de Negativas", perfil.negativas],
      ["% +", perfil.pctPositivas, "% -", perfil.pctNegativas],
    ];
    doc.autoTable({
      startY: y,
      head: [["Métrica", "Valor", "Métrica", "Valor"]],
      body: statsRows,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 1.5, halign: "left" },
      headStyles: { fillColor: [18, 56, 120], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
      alternateRowStyles: { fillColor: [235, 242, 252] },
      margin: { left: 10, right: 10 },
    });
    y = (doc as any).lastAutoTable.finalY + 5;

    // Tabela de alunos por trimestre
    const tableData = filtered.map((row: MiniPautaRow, idx: number) => {
      const calc = calcularLinhaMiniPauta(row);
      const student = students?.find((s: any) => s.id === row.studentId);
      const subject = subjects?.find((s: any) => s.id === row.subjectId);
      return [
        idx + 1,
        student?.fullName || `#${row.studentId}`,
        student?.gender === "F" ? "F" : student?.gender === "M" ? "M" : "",
        subject?.name || `#${row.subjectId}`,
        fmtNota(calc.mac1), fmtNota(calc.npp1), fmtNota(calc.mt1, 0),
        fmtNota(calc.mac2), fmtNota(calc.npp2), fmtNota(calc.mt2, 0),
        fmtNota(calc.mac3), fmtNota(calc.npp3), fmtNota(calc.mt3, 0),
        fmtNota(calc.mfd), fmtNota(calc.exame), fmtNota(calc.mfdFinal), calc.observacao || "—",
      ];
    });

    doc.autoTable({
      startY: y,
      head: [[
        { content: "Nº", rowSpan: 2 },
        { content: "Nome do aluno", rowSpan: 2 },
        { content: "Gênero", rowSpan: 2 },
        { content: "Disciplina", rowSpan: 2 },
        { content: "I — TRIMESTRE", colSpan: 3 },
        { content: "II — TRIMESTRE", colSpan: 3 },
        { content: "III — TRIMESTRE", colSpan: 3 },
        { content: "MFD", rowSpan: 2 },
        { content: "EXAME", rowSpan: 2 },
        { content: "MFD F.", rowSpan: 2 },
        { content: "CLASSIFICAÇÃO", rowSpan: 2 },
      ], [
        "MAC", "NPP", "MT", "MAC", "NPP", "MT", "MAC", "NPP", "MT",
      ]],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 7.5, cellPadding: 1.5, halign: "center" },
      headStyles: { fillColor: [18, 56, 120], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [240, 248, 240] },
      didParseCell: function (data: any) {
        if (data.section === "body") {
          // MFD Final (col 13)
          if (data.column.index === 13) {
            const val = Number(data.cell.raw);
            if (!isNaN(val)) {
              data.cell.styles.textColor = val >= 10 ? [0, 128, 0] : [200, 0, 0];
              data.cell.styles.fontStyle = "bold";
            }
          }
          // CLASSIFICAÇÃO (col 14)
          if (data.column.index === 14) {
            const obs = String(data.cell.raw);
            if (obs === "APTO" || obs === "TRANSITA") data.cell.styles.textColor = [0, 128, 0];
            else if (obs === "NÃO APTO" || obs === "NÃO TRANSITA") data.cell.styles.textColor = [200, 0, 0];
            else data.cell.styles.textColor = [128, 128, 128];
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });

    // Rodapé com assinaturas
    const finalY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const assY = finalY + 8;
    doc.line(30, assY, 90, assY);
    doc.text("O (a) Coordenador (a) da Disciplina", 60, assY + 5, { align: "center" });
    doc.line(120, assY, 180, assY);
    doc.text("O Director Pedagógico", 150, assY + 5, { align: "center" });

    const fileName = `MiniPauta_${classId === "all" ? "Turma" : classId}.pdf`;
    doc.save(fileName);
    toast.success(`Mini-Pauta PDF gerada: ${fileName}`);
  };

  // Gerar Boletim PDF para um aluno
  const generateBoletimPDF = async (studentId: number) => {
    const student = students?.find((s: any) => s.id === studentId);
    if (!student) return;

    const studentRows = filtered.filter((r: MiniPautaRow) => r.studentId === studentId);
    if (studentRows.length === 0) {
      toast.warning("Sem dados de avaliação para este aluno.");
      return;
    }

    const jsPDFModule = await import("jspdf");
    const jsPDFClass: new (o?: any) => DocWithAutoTable = (jsPDFModule.jsPDF || jsPDFModule.default) as any;
    const autoTableModule = await import("jspdf-autotable");
    // @ts-ignore
    const patchFn = autoTableModule.applyPlugin || autoTableModule.default || autoTableModule;
    // @ts-ignore
    patchFn(jsPDFClass);

    const doc = new jsPDFClass({ orientation: "p", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = pdfHeaderBlock(doc, pageWidth, schoolConfigData);

    // Título do boletim
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("BOLETIM DE AVALIAÇÃO INDIVIDUAL", pageWidth / 2, y, { align: "center" });
    y += 7;

    // Dados do aluno
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Nome: ${student.fullName || `${student.firstName || ""} ${student.lastName || ""}`}`, 10, y);
    doc.text(`Gênero: ${student.gender === "F" ? "F" : student.gender === "M" ? "M" : ""}`, pageWidth - 60, y);
    y += 6;
    if (student.processNumber) doc.text(`N.º Processo: ${student.processNumber}`, 10, y);
    y += 6;
    const ano = currentYearData?.[0]?.year || new Date().getFullYear().toString();
    doc.text(`Ano Lectivo: ${ano}`, 10, y);
    y += 8;

    // Tabela de disciplinas e notas (sub-colunas MAC|NPP|MT por trimestre)
    const tableData = studentRows.map((row: MiniPautaRow) => {
      const calc = calcularLinhaMiniPauta(row);
      const subject = subjects?.find((s: any) => s.id === row.subjectId);
      return [
        subject?.name || `#${row.subjectId}`,
        fmtNota(calc.mac1), fmtNota(calc.npp1), fmtNota(calc.mt1, 0),
        fmtNota(calc.mac2), fmtNota(calc.npp2), fmtNota(calc.mt2, 0),
        fmtNota(calc.mac3), fmtNota(calc.npp3), fmtNota(calc.mt3, 0),
        fmtNota(calc.mfd),
        fmtNota(calc.exame),
        fmtNota(calc.mfdFinal),
        calc.observacao || "—",
      ];
    });

    // @ts-ignore
    doc.autoTable({
      startY: y + 2,
      head: [[
        { content: "Disciplina", rowSpan: 2 },
        { content: "I — TRIMESTRE", colSpan: 3 },
        { content: "II — TRIMESTRE", colSpan: 3 },
        { content: "III — TRIMESTRE", colSpan: 3 },
        { content: "MFD", rowSpan: 2 },
        { content: "EXAME", rowSpan: 2 },
        { content: "MFD F.", rowSpan: 2 },
        { content: "CLASSIFICAÇÃO", rowSpan: 2 },
      ], ["MAC", "NPP", "MT", "MAC", "NPP", "MT", "MAC", "NPP", "MT"]],
      body: tableData,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [18, 56, 120], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [240, 248, 240] },
      didParseCell: function (data: any) {
        if (data.section === "body") {
          if (data.column.index === 12) {
            const val = Number(data.cell.raw);
            if (!isNaN(val)) {
              data.cell.styles.textColor = val >= 10 ? [0, 128, 0] : [200, 0, 0];
              data.cell.styles.fontStyle = "bold";
            }
          }
          if (data.column.index === 13) {
            const obs = String(data.cell.raw);
            if (obs === "APTO" || obs === "TRANSITA") data.cell.styles.textColor = [0, 128, 0];
            else if (obs === "NÃO APTO" || obs === "NÃO TRANSITA") data.cell.styles.textColor = [200, 0, 0];
            else data.cell.styles.textColor = [128, 128, 128];
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });

    // Rodapé com assinaturas
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(10);
    doc.text("_______________________________", pageWidth / 2, finalY, { align: "center" });
    doc.setFontSize(9);
    doc.text("Assinatura do Encarregado de Educação", pageWidth / 2, finalY + 5, { align: "center" });

    doc.setFontSize(10);
    doc.text("_______________________________", pageWidth - 60, finalY, { align: "center" });
    doc.setFontSize(9);
    doc.text("Assinatura do Director", pageWidth - 60, finalY + 5, { align: "center" });

    const fileName = `Boletim_${(student.fullName || "Aluno").replace(/\s+/g, "_")}.pdf`;
    doc.save(fileName);
    toast.success(`Boletim PDF gerado: ${fileName}`);
  };

  const handleSaveEdit = (row: MiniPautaRow) => {
    const merged = { ...editData };
    const calc = calcularLinhaMiniPauta({ ...row, ...merged });
    merged.mt1 = calc.mt1;
    merged.mt2 = calc.mt2;
    merged.mt3 = calc.mt3;
    merged.mfd = calc.mfd;
    merged.mfdFinal = calc.mfdFinal;
    merged.classificacaoQualitativa = calc.classificacaoQualitativa;
    merged.observacao = calc.observacao;
    updateMutation.mutate({ id: row.id, data: merged });
    setEditingId(null);
    setEditData({});
  };

  const handleSaveNew = () => {
    const calc = calcularLinhaMiniPauta(addData as MiniPautaRow);
    createMutation.mutate({
      ...addData,
      mt1: calc.mt1,
      mt2: calc.mt2,
      mt3: calc.mt3,
      mfd: calc.mfd,
      mfdFinal: calc.mfdFinal,
      classificacaoQualitativa: calc.classificacaoQualitativa,
      observacao: calc.observacao,
    } as any);
    setShowAddForm(false);
    setAddData({ classId: 1, academicYearId: 1 });
  };

  const EditableCell = ({ field, value, onChange }: { field: string; value: number | null; onChange: (v: number | null) => void }) => (
    <Input
      type="number"
      step="0.1"
      min="0"
      max="20"
      className="w-14 h-7 text-center text-xs"
      defaultValue={value?.toString() ?? ""}
      onBlur={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
    />
  );

  // Estatísticas para o painel "Perfil de Aproveitamento Académico"
  const statsCards: { label: string; value: number | string; accent: string }[] = [
    { label: "Alunos Matriculados", value: perfil.matriculados, accent: "border-l-blue-600" },
    { label: "Alunos Avaliados", value: perfil.avaliados, accent: "border-l-emerald-600" },
    { label: "Sem Avaliação", value: perfil.semAvaliacao, accent: "border-l-gray-400" },
    { label: "Reprovados por Faltas", value: perfil.reprovadosFaltas, accent: "border-l-rose-600" },
    { label: "Anulações de Matrícula", value: perfil.anulacoes, accent: "border-l-orange-500" },
    { label: "Alunos Transferidos", value: perfil.transferidos, accent: "border-l-amber-500" },
    { label: "Nº de Positivas", value: perfil.positivas, accent: "border-l-green-600" },
    { label: "Nº de Negativas", value: perfil.negativas, accent: "border-l-red-600" },
    { label: "% +", value: `${perfil.pctPositivas}%`, accent: "border-l-green-600" },
    { label: "% -", value: `${perfil.pctNegativas}%`, accent: "border-l-red-600" },
  ];

  return (
    <div className="space-y-4 print:space-y-0">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mini-Pautas</h1>
          <p className="text-muted-foreground">
            Sistema de Avaliação Angolano — RAA (Decreto Executivo n.º 106/26)
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por Classe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {classes?.map((c: any) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name || c.id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isAdmin && (
            <Button variant="outline" onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          )}
          <Button variant="outline" onClick={exportExcel}>
            <FileDown className="h-4 w-4 mr-1" /> Exportar Excel
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" /> Imprimir
          </Button>
        </div>
      </div>

      {/* Painel Perfil de Aproveitamento Académico */}
      <Card className="border-t-4 border-t-[#123878] print:break-inside-avoid">
        <CardContent className="pt-4">
          <h2 className="text-sm font-bold text-[#123878] uppercase tracking-wide mb-3">
            Perfil de Aproveitamento Académico
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {statsCards.map((s) => (
              <div key={s.label} className={`border-l-4 ${s.accent} bg-white rounded-md px-3 py-2 shadow-sm`}>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selector de aluno para gerar boletim + botão Mini-Pauta PDF */}
      <div className="flex flex-wrap gap-2 items-center print:hidden">
        <span className="text-sm text-muted-foreground">Gerar Boletim PDF:</span>
        <Select value={selectedBoletimStudent} onValueChange={setSelectedBoletimStudent}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Seleccionar Aluno" />
          </SelectTrigger>
          <SelectContent>
            {students?.map((s: any) => (
              <SelectItem key={s.id} value={String(s.id)}>{s.fullName || s.id}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (selectedBoletimStudent) generateBoletimPDF(Number(selectedBoletimStudent));
            else toast.warning("Seleccione um aluno primeiro.");
          }}
        >
          <FileDown className="h-4 w-4 mr-1" /> Gerar PDF
        </Button>
        <Button variant="default" size="sm" onClick={generatePDF} className="bg-[#123878] hover:bg-[#0f2d62]">
          <FileDown className="h-4 w-4 mr-1" /> Mini-Pauta PDF (Turma)
        </Button>
      </div>

      {/* Formulário de Adição */}
      {showAddForm && (
        <Card className="print:hidden">
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
              <div>
                <label className="text-sm font-medium">Aluno</label>
                <Select value={String(addData.studentId || "")} onValueChange={(v) => setAddData({ ...addData, studentId: Number(v) })}>
                  <SelectTrigger><SelectValue placeholder="Aluno" /></SelectTrigger>
                  <SelectContent>
                    {students?.map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.fullName || s.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Disciplina</label>
                <Select value={String(addData.subjectId || "")} onValueChange={(v) => setAddData({ ...addData, subjectId: Number(v) })}>
                  <SelectTrigger><SelectValue placeholder="Disciplina" /></SelectTrigger>
                  <SelectContent>
                    {subjects?.map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name || s.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              <div className="col-span-3 md:col-span-6">
                <p className="text-xs font-semibold text-muted-foreground mb-1">I Trimestre <span className="font-normal text-[10px]">(MT automático = média)</span></p>
                <div className="grid grid-cols-2 gap-2">
                  {["mac1", "npp1"].map((field) => (
                    <div key={field}>
                      <label className="text-xs">{field.toUpperCase()}</label>
                      <Input
                        type="number" step="0.1" placeholder="—"
                        value={addData[field as keyof MiniPautaRow]?.toString() || ""}
                        onChange={(e) => setAddData({ ...addData, [field]: e.target.value === "" ? null : Number(e.target.value) })}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-span-3 md:col-span-6">
                <p className="text-xs font-semibold text-muted-foreground mb-1">II Trimestre <span className="font-normal text-[10px]">(MT automático)</span></p>
                <div className="grid grid-cols-2 gap-2">
                  {["mac2", "npp2"].map((field) => (
                    <div key={field}>
                      <label className="text-xs">{field.toUpperCase()}</label>
                      <Input
                        type="number" step="0.1" placeholder="—"
                        value={addData[field as keyof MiniPautaRow]?.toString() || ""}
                        onChange={(e) => setAddData({ ...addData, [field]: e.target.value === "" ? null : Number(e.target.value) })}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-span-3 md:col-span-6">
                <p className="text-xs font-semibold text-muted-foreground mb-1">III Trimestre <span className="font-normal text-[10px]">(MT automático)</span></p>
                <div className="grid-cols-2 grid gap-2">
                  {["mac3", "npp3"].map((field) => (
                    <div key={field}>
                      <label className="text-xs">{field.toUpperCase()}</label>
                      <Input
                        type="number" step="0.1" placeholder="—"
                        value={addData[field as keyof MiniPautaRow]?.toString() || ""}
                        onChange={(e) => setAddData({ ...addData, [field]: e.target.value === "" ? null : Number(e.target.value) })}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-span-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Exame</p>
                <Input
                  type="number" step="0.1" placeholder="—"
                  value={addData.exame?.toString() || ""}
                  onChange={(e) => setAddData({ ...addData, exame: e.target.value === "" ? null : Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancelar</Button>
              <Button onClick={handleSaveNew}>Guardar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mini-Pauta — estrutura moderna estilo Excel de referência */}
      <Card>
        <CardContent className="pt-5">
          {/* Cabeçalho oficial + Identificação (modelo 12ª1.xlsm) */}
          <div className="text-center mb-2">
            <p className="font-bold text-sm">República de Angola</p>
            <p className="font-bold text-sm">Ministério da Educação</p>
            <p className="font-bold text-sm">{schoolConfigData?.name || ""}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 mb-3 text-sm print:text-xs">
            <p>
              <span className="font-semibold">Classe: </span>
              <span>{classId === "all" ? "Todas as classes" : ((classes as any)?.find((c: any) => String(c.id) === classId)?.name || "—")}</span>
            </p>
            <p>
              <span className="font-semibold">Período: </span>
              <span>Manhã</span>
            </p>
            <p>
              <span className="font-semibold">Disciplina: </span>
              <span>Todas</span>
            </p>
            <p>
              <span className="font-semibold">Prof(a): </span>
              <span>{schoolConfigData?.professorName || ""}</span>
            </p>
            <p>
              <span className="font-semibold">Turma: </span>
              <span>{classId === "all" ? "Todas" : classId}</span>
            </p>
            <p>
              <span className="font-semibold">Ano Lectivo: </span>
              <span>{(currentYearData as any)?.[0]?.year || new Date().getFullYear()}</span>
            </p>
          </div>
          <p className="text-center font-bold text-lg uppercase tracking-wide mb-4 border-b-2 border-[#123878] pb-1">
            Mini-Pauta
          </p>

          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">A carregar...</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Sem registos. Adicione notas para a classe seleccionada.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table className="text-sm">
                <TableHeader>
                  <TableRow>
                    {[
                      { label: "Nº", rowSpan: 2, center: true },
                      { label: "Nome do aluno", rowSpan: 2, center: false, wide: true },
                      { label: "Gênero", rowSpan: 2, center: true },
                      { label: "Disciplina", rowSpan: 2, center: false },
                      { label: "I — TRIMESTRE", colSpan: 3, center: true },
                      { label: "II — TRIMESTRE", colSpan: 3, center: true },
                      { label: "III — TRIMESTRE", colSpan: 3, center: true },
                      { label: "MFD", rowSpan: 2, center: true },
                      { label: "EXAME", rowSpan: 2, center: true },
                      { label: "MFD F.", rowSpan: 2, center: true },
                      { label: "CLASSIFICAÇÃO", rowSpan: 2, center: true, classif: true },
                      { label: "Acções", rowSpan: 2, center: true, printHide: true },
                    ].map((h) => (
                      <TableHead
                        key={h.label}
                        {...(h.rowSpan ? { rowSpan: h.rowSpan } : { colSpan: h.colSpan })}
                        className={`${h.center ? "text-center" : ""} align-middle`}
                        style={{ background: "#123878", color: "#fff", borderLeft: "1px solid rgba(255,255,255,0.3)", ...(h.wide ? { minWidth: "200px" } : {}), ...(h.classif ? { minWidth: "150px" } : {}) }}
                      >
                        {h.label}
                      </TableHead>
                    ))}
                  </TableRow>
                  <TableRow>
                    {["MAC", "NPP", "MT", "MAC", "NPP", "MT", "MAC", "NPP", "MT"].map((h) => (
                      <TableHead key={h} className="text-center font-semibold" style={{ background: "#2a4f9c", color: "#fff" }}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row: MiniPautaRow, idx: number) => {
                    const student = students?.find((s: any) => s.id === row.studentId);
                    const subject = subjects?.find((s: any) => s.id === row.subjectId);
                    const isEditing = editingId === row.id;
                    const calc = calcularLinhaMiniPauta(row);

                    return (
                      <TableRow key={row.id} className={`hover:opacity-80 ${getRowColor(calc.observacao, calc.mfdFinal)}`}>
                        <TableCell className="text-center font-mono">{idx + 1}</TableCell>
                        <TableCell className="font-medium text-xs" style={{ minWidth: "200px" }}>{student?.fullName || `#${row.studentId}`}</TableCell>
                        <TableCell className="text-center text-xs font-semibold">{student?.gender === "F" ? "F" : "M"}</TableCell>
                        <TableCell className="text-xs">{subject?.name || `#${row.subjectId}`}</TableCell>

                        {/* I Trimestre — MAC | NPP | MT */}
                        {([
                          ["mac1", row.mac1, false],
                          ["npp1", row.npp1, false],
                          ["mt1", calc.mt1, true],
                        ] as const).map(([field, value, computed]) => (
                          <TableCell key={field} className="text-center p-1 border-l border-muted">
                            {isEditing && !computed ? (
                              <EditableCell field={field} value={value as number | null} onChange={(v) => setEditData((prev) => ({ ...prev, [field]: v }))} />
                            ) : (
                              <span className={`font-mono text-xs ${computed ? "font-semibold text-[#123878]" : ""}`}>{value !== null ? Number(value).toFixed(1) : "—"}</span>
                            )}
                          </TableCell>
                        ))}

                        {/* II Trimestre — MAC | NPP | MT */}
                        {([
                          ["mac2", row.mac2, false],
                          ["npp2", row.npp2, false],
                          ["mt2", calc.mt2, true],
                        ] as const).map(([field, value, computed]) => (
                          <TableCell key={field} className="text-center p-1 border-l border-muted">
                            {isEditing && !computed ? (
                              <EditableCell field={field} value={value as number | null} onChange={(v) => setEditData((prev) => ({ ...prev, [field]: v }))} />
                            ) : (
                              <span className={`font-mono text-xs ${computed ? "font-semibold text-[#123878]" : ""}`}>{value !== null ? Number(value).toFixed(1) : "—"}</span>
                            )}
                          </TableCell>
                        ))}

                        {/* III Trimestre — MAC | NPP | MT */}
                        {([
                          ["mac3", row.mac3, false],
                          ["npp3", row.npp3, false],
                          ["mt3", calc.mt3, true],
                        ] as const).map(([field, value, computed]) => (
                          <TableCell key={field} className="text-center p-1 border-l border-muted">
                            {isEditing && !computed ? (
                              <EditableCell field={field} value={value as number | null} onChange={(v) => setEditData((prev) => ({ ...prev, [field]: v }))} />
                            ) : (
                              <span className={`font-mono text-xs ${computed ? "font-semibold text-[#123878]" : ""}`}>{value !== null ? Number(value).toFixed(1) : "—"}</span>
                            )}
                          </TableCell>
                        ))}

                        {/* Finais */}
                        <TableCell className="text-center border-l border-muted">
                          <span className="font-mono text-xs font-semibold">{calc.mfd !== null ? calc.mfd.toFixed(1) : "—"}</span>
                        </TableCell>
                        <TableCell className="text-center p-1 border-l border-muted">
                          {isEditing ? (
                            <EditableCell field="exame" value={row.exame} onChange={(v) => setEditData((prev) => ({ ...prev, exame: v }))} />
                          ) : (
                            <span className="font-mono text-xs">{row.exame !== null ? Number(row.exame).toFixed(1) : "—"}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center border-l border-muted">
                          <span className={`font-mono text-xs ${getFinalNotaColor(calc.mfdFinal)}`}>{calc.mfdFinal !== null ? calc.mfdFinal.toFixed(1) : "—"}</span>
                        </TableCell>
                        <TableCell className="text-center border-l border-muted" style={{ minWidth: "150px" }}>
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold text-white ${getObservacaoColor(calc.observacao)}`}>{calc.observacao || "—"}</span>
                        </TableCell>
                        <TableCell className="text-center print:hidden border-l border-muted">
                          {isEditing ? (
                            <Button variant="ghost" size="sm" onClick={() => handleSaveEdit(row)} className="text-green-600">✓</Button>
                          ) : (
                            <div className="flex justify-center gap-1">
                              {isAdmin && (
                                <Button variant="ghost" size="sm" onClick={() => { setEditingId(row.id); setEditData({}); }}>
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {isAdmin && (
                                <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate({ id: row.id })}>
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
