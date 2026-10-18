import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Printer, ArrowLeft, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  calcularMT, calcularMFD, calcularMFDFinal, calcularMF,
  getClassificacaoQualitativa, getObservacaoAptidao,
} from "@shared/raa";

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

export default function PautaTurmaPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedYearId, setSelectedYearId] = useState<string>("1");
  const [isEditing, setIsEditing] = useState<Record<number, boolean>>({});
  const [editData, setEditData] = useState<Record<number, Partial<MiniPautaRow>>>({});

  const { data: classes } = trpc.classes.list.useQuery(undefined, { enabled: true });
  const { data: academicYears } = trpc.academicYears.list.useQuery(undefined, { enabled: true });

  const classId = selectedClassId ? Number(selectedClassId) : null;
  const academicYearId = Number(selectedYearId) || 1;

  const pautaQuery = trpc.pautaTurma.completa.useQuery(
    { classId: classId!, academicYearId },
    { enabled: classId !== null }
  );

  const updateMutation = trpc.miniPautas.update.useMutation({
    onSuccess: () => {
      pautaQuery.refetch();
      toast.success("Nota actualizada");
    },
  });

  const getCalculated = (row: MiniPautaRow) => {
    const mt1 = row.mt1 ?? calcularMT(row.mac1, row.npp1, row.npt1);
    const mt2 = row.mt2 ?? calcularMT(row.mac2, row.npp2, row.npt2);
    const mt3 = row.mt3 ?? calcularMT(row.mac3, row.npp3, row.npt3);
    const mfd = row.mfd ?? calcularMFD(mt1, mt2, mt3);
    const mfdFinal = row.mfdFinal ?? calcularMFDFinal(mfd, row.exame);
    const classif = row.classificacaoQualitativa ?? getClassificacaoQualitativa(mfdFinal);
    const obs = row.observacao ?? getObservacaoAptidao(mfdFinal);
    return { mt1, mt2, mt3, mfd, mfdFinal, classif, obs };
  };

  const handleEdit = (pautaId: number) => {
    const pauta = pautaQuery.data?.miniPautas.find((p) => p.id === pautaId);
    if (pauta) {
      setEditData((prev) => ({ ...prev, [pautaId]: { ...pauta } }));
    }
    setIsEditing((prev) => ({ ...prev, [pautaId]: true }));
  };

  const handleSave = (pautaId: number) => {
    const data = editData[pautaId];
    if (data) {
      // Auto-calculate derived values
      const merged: MiniPautaRow = {
        id: pautaId,
        studentId: data.studentId ?? 0,
        subjectId: data.subjectId ?? 0,
        classId: data.classId ?? 0,
        academicYearId: data.academicYearId ?? 1,
        mac1: data.mac1 ?? null, npp1: data.npp1 ?? null, npt1: data.npt1 ?? null,
        mt1: data.mt1 ?? null,
        mac2: data.mac2 ?? null, npp2: data.npp2 ?? null, npt2: data.npt2 ?? null,
        mt2: data.mt2 ?? null,
        mac3: data.mac3 ?? null, npp3: data.npp3 ?? null, npt3: data.npt3 ?? null,
        mt3: data.mt3 ?? null,
        mfd: data.mfd ?? null, exame: data.exame ?? null, mfdFinal: data.mfdFinal ?? null,
        classificacaoQualitativa: null, observacao: null,
      };
      const calc = getCalculated(merged);
      updateMutation.mutate({
        id: pautaId,
        data: {
          mac1: data.mac1 ?? null, npp1: data.npp1 ?? null, npt1: data.npt1 ?? null,
          mac2: data.mac2 ?? null, npp2: data.npp2 ?? null, npt2: data.npt2 ?? null,
          mac3: data.mac3 ?? null, npp3: data.npp3 ?? null, npt3: data.npt3 ?? null,
          mt1: calc.mt1, mt2: calc.mt2, mt3: calc.mt3,
          mfd: calc.mfd, exame: data.exame ?? null, mfdFinal: calc.mfdFinal,
          classificacaoQualitativa: calc.classif, observacao: calc.obs,
        },
      });
    }
    setIsEditing((prev) => ({ ...prev, [pautaId]: false }));
  };

  const handleCancel = (pautaId: number) => {
    setIsEditing((prev) => ({ ...prev, [pautaId]: false }));
    setEditData((prev) => {
      const next = { ...prev };
      delete next[pautaId];
      return next;
    });
  };

  const selectedClassName = classes?.find((c: any) => c.id === classId)?.name || "";
  const selectedYearName = academicYears?.find((y: any) => y.id === academicYearId)?.year || "";

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!pautaData) {
      toast.error("Sem dados para exportar. Seleccione uma turma.");
      return;
    }
    if (students.length === 0) {
      toast.warning("Não há alunos nesta turma.");
      return;
    }

    // Criar dados para o Excel com TODAS as colunas
    const gradeHeaders = ["MAC1", "NPP1", "NPT1", "MT1", "MAC2", "NPP2", "NPT2", "MT2", "MAC3", "NPP3", "NPT3", "MT3", "MFD", "EXAME", "MFD Final", "Qualit.", "Obs."];
    const headers: string[] = ["Nº", "Aluno"];
    subjects.forEach((sub: any) => {
      gradeHeaders.forEach(() => {
        headers.push(sub.name || `#${sub.id}`);
      });
    });

    const rows: any[][] = [];
    students.forEach((student: any, idx: number) => {
      const row: any[] = [idx + 1, student.fullName || `${student.firstName} ${student.lastName}`];
      subjects.forEach((sub: any) => {
        const pauta = pautaMap.get(student.id)?.get(sub.id);
        if (pauta) {
          const calc = getCalculated(pauta);
          row.push(pauta.mac1 ?? "", pauta.npp1 ?? "", pauta.npt1 ?? "", calc.mt1 ?? "");
          row.push(pauta.mac2 ?? "", pauta.npp2 ?? "", pauta.npt2 ?? "", calc.mt2 ?? "");
          row.push(pauta.mac3 ?? "", pauta.npp3 ?? "", pauta.npt3 ?? "", calc.mt3 ?? "");
          row.push(calc.mfd ?? "", pauta.exame ?? "", calc.mfdFinal ?? "", calc.classif ?? "", calc.obs);
        } else {
          gradeHeaders.forEach(() => row.push(""));
        }
      });
      rows.push(row);
    });

    // Criar workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      [`PAUTA DE AVALIAÇÃO — ${selectedClassName} — ${selectedYearName}`],
      [""],
      ["República de Angola"],
      ["Ministério da Educação"],
      [""],
      headers,
      ...rows,
    ]);

    const numCols = 2 + subjects.length * gradeHeaders.length;
    const colWidths = [{ wch: 4 }, { wch: 30 }];
    for (let i = 2; i < numCols; i++) {
      colWidths.push({ wch: 6 });
    }
    ws["!cols"] = colWidths;
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } }];

    XLSX.utils.book_append_sheet(wb, ws, "Pauta");
    const fileName = `Pauta_${selectedClassName.replace(/\s+/g, "_")}_${selectedYearName || "Ano"}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success(`Ficheiro Excel exportado: ${fileName}`);
  };

  // Organizar dados em matriz: aluno x disciplina
  const pautaData = pautaQuery.data;
  const subjects = pautaData?.subjects ?? [];
  const students = pautaData?.students ?? [];
  const miniPautas = pautaData?.miniPautas ?? [];

  const pautaMap = new Map<number, Map<number, MiniPautaRow>>();
  for (const mp of miniPautas) {
    if (!pautaMap.has(mp.studentId)) pautaMap.set(mp.studentId, new Map());
    pautaMap.get(mp.studentId)!.set(mp.subjectId, mp);
  }

  // Contagem de alunos que transitam
  const studentsTransit = students.filter((s: any) => {
    const subjectPautas = pautaMap.get(s.id);
    if (!subjectPautas) return false;
    let allApto = true;
    for (const mp of Array.from(subjectPautas.values())) {
      const calc = getCalculated(mp);
      if (calc.mfdFinal === null || calc.mfdFinal < 10) {
        allApto = false;
        break;
      }
    }
    return allApto;
  });

  // MF Global do aluno (média de todas as MFD Final)
  const getStudentMF = (studentId: number): number | null => {
    const subjectPautas = pautaMap.get(studentId);
    if (!subjectPautas) return null;
    const mdfs = Array.from(subjectPautas.values()).map((mp) => {
      const calc = getCalculated(mp);
      return calc.mfdFinal;
    });
    return calcularMF(mdfs);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <Button variant="ghost" size="sm" onClick={() => { window.history.back(); }} className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <h1 className="text-2xl font-bold">Pauta Completa da Turma</h1>
          <p className="text-sm text-muted-foreground">
            Sistema de Avaliação Angolano — RAA (Decreto Executivo n.º 106/26)
          </p>
        </div>
        {classId && (
          <div className="flex gap-2">
            <Button onClick={handleExportExcel} variant="outline">
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Exportar Excel
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" /> Imprimir
            </Button>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 print:hidden">
        <Select value={selectedYearId} onValueChange={setSelectedYearId}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Ano Lectivo" />
          </SelectTrigger>
          <SelectContent>
            {academicYears?.map((y: any) => (
              <SelectItem key={y.id} value={String(y.id)}>
                {y.year || y.name || `Ano ${y.id}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Seleccionar Turma" />
          </SelectTrigger>
          <SelectContent>
            {classes?.map((c: any) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name || c.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pauta */}
      {classId && (
        <div>
          {pautaQuery.isLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              A gerar pauta completa...
            </div>
          ) : (
            <div className="space-y-4">
              {/* Resumo */}
              <div className="flex gap-4 print:hidden">
                <div className="bg-card border rounded-lg p-4 flex-1">
                  <p className="text-sm text-muted-foreground">Turma</p>
                  <p className="text-lg font-bold">{selectedClassName}</p>
                </div>
                <div className="bg-card border rounded-lg p-4 flex-1">
                  <p className="text-sm text-muted-foreground">Disciplinas</p>
                  <p className="text-lg font-bold">{subjects.length}</p>
                </div>
                <div className="bg-card border rounded-lg p-4 flex-1">
                  <p className="text-sm text-muted-foreground">Alunos</p>
                  <p className="text-lg font-bold">{students.length}</p>
                </div>
                <div className="bg-card border rounded-lg p-4 flex-1">
                  <p className="text-sm text-muted-foreground">Transitam</p>
                  <p className="text-lg font-bold text-green-600">{studentsTransit.length}</p>
                </div>
              </div>

              {/* Tabela da Pauta */}
              <div className="bg-card border rounded-lg overflow-x-auto">
                <div className="p-4 border-b">
                  <h2 className="font-semibold text-center">
                    PAUTA DE AVALIAÇÃO — {selectedClassName.toUpperCase()} — {selectedYearName}
                  </h2>
                  <p className="text-xs text-center text-muted-foreground mt-1">
                    Sistema de Avaliação Angolano — RAA (Decreto Executivo n.º 106/26)
                  </p>
                </div>
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8" rowSpan={2}>Nº</TableHead>
                      <TableHead className="min-w-32" rowSpan={2}>Aluno</TableHead>
                      {subjects.map((sub: any) => (
                        <TableHead key={sub.id} className="text-center" colSpan={8}>
                          {sub.name || `#${sub.id}`}
                        </TableHead>
                      ))}
                      <TableHead className="w-16" rowSpan={2}>MF Global</TableHead>
                      <TableHead className="w-20" rowSpan={2}>Obs. Geral</TableHead>
                      <TableHead className="w-16 print:hidden" rowSpan={2}>Acções</TableHead>
                    </TableRow>
                    <TableRow>
                      {subjects.map((sub: any) => (
                        <>
                          <TableHead key={`${sub.id}-mac`} className="w-8">MAC</TableHead>
                          <TableHead key={`${sub.id}-npt`} className="w-8">NPT</TableHead>
                          <TableHead key={`${sub.id}-mt1`} className="w-8">MT1</TableHead>
                          <TableHead key={`${sub.id}-mt2`} className="w-8">MT2</TableHead>
                          <TableHead key={`${sub.id}-mt3`} className="w-8">MT3</TableHead>
                          <TableHead key={`${sub.id}-mfd`} className="w-8">MFD</TableHead>
                          <TableHead key={`${sub.id}-ex`} className="w-8">EX</TableHead>
                          <TableHead key={`${sub.id}-mfdf`} className="w-8">MFD F.</TableHead>
                        </>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student: any, idx: number) => {
                      const mfGlobal = getStudentMF(student.id);
                      const obsGeral = mfGlobal !== null ? (mfGlobal >= 10 ? "TRANSITA" : "NÃO TRANSITA") : "—";
                      const rowBg = mfGlobal !== null ? (mfGlobal >= 10 ? "bg-green-50" : "bg-red-50") : "bg-gray-50";
                      return (
                        <TableRow key={student.id} className={`hover:opacity-80 ${rowBg}`}>
                          <TableCell className="font-mono text-center">{idx + 1}</TableCell>
                          <TableCell className="font-medium">
                            {student.fullName || student.firstName + " " + student.lastName}
                          </TableCell>
                          {subjects.map((sub: any) => {
                            const pauta = pautaMap.get(student.id)?.get(sub.id);
                            if (!pauta) {
                              return <TableCell key={sub.id} colSpan={8} className="text-center text-muted-foreground">—</TableCell>;
                            }
                            const calc = getCalculated(pauta);
                            const isEdit = isEditing[pauta.id];
                            const current = isEdit ? (editData[pauta.id] || pauta) : pauta;

                            return (
                              <TableCell key={sub.id} className="text-center">
                                {isEdit ? (
                                  <div className="space-y-1">
                                    <div className="grid grid-cols-3 gap-0.5">
                                      {(["mac1", "npt1"] as const).map((f) => (
                                        <Input key={f} type="number" size={2} className="h-4 text-[8px] p-0 text-center"
                                          defaultValue={current[f]?.toString() ?? ""}
                                          onChange={(e) => setEditData((prev) => ({ ...prev, [pauta.id]: { ...prev[pauta.id], [f]: e.target.value === "" ? null : Number(e.target.value) } }))}
                                        />
                                      ))}
                                      <Input type="number" size={2} className="h-4 text-[8px] p-0 text-center"
                                        defaultValue={current.exame?.toString() ?? ""}
                                        onChange={(e) => setEditData((prev) => ({ ...prev, [pauta.id]: { ...prev[pauta.id], exame: e.target.value === "" ? null : Number(e.target.value) } }))}
                                      />
                                    </div>
                                    <div className="flex gap-0.5">
                                      <Button size="sm" variant="ghost" className="h-3 px-0.5 text-[8px]" onClick={() => handleSave(pauta.id)}>✓</Button>
                                      <Button size="sm" variant="ghost" className="h-3 px-0.5 text-[8px] text-red-500" onClick={() => handleCancel(pauta.id)}>✕</Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-0.5">
                                    <div className="flex justify-center gap-0.5">
                                      <span>{current.mac1 !== null ? Number(current.mac1).toFixed(0) : "—"}</span>
                                      <span>{current.npt1 !== null ? Number(current.npt1).toFixed(0) : "—"}</span>
                                    </div>
                                    <div className="flex justify-center gap-0.5">
                                      <span className="text-muted-foreground">{calc.mt1 !== null ? calc.mt1.toFixed(0) : "—"}</span>
                                      <span className="text-muted-foreground">{calc.mt2 !== null ? calc.mt2.toFixed(0) : "—"}</span>
                                      <span className="text-muted-foreground">{calc.mt3 !== null ? calc.mt3.toFixed(0) : "—"}</span>
                                    </div>
                                    <div className="flex justify-center gap-0.5 font-semibold">
                                      <span>{calc.mfd !== null ? calc.mfd.toFixed(1) : "—"}</span>
                                      <span>{pauta.exame !== null ? Number(pauta.exame).toFixed(0) : "—"}</span>
                                      <span className="font-bold">{calc.mfdFinal !== null ? calc.mfdFinal.toFixed(1) : "—"}</span>
                                    </div>
                                    <div className="flex justify-center gap-0.5">
                                      {calc.mfdFinal !== null ? (
                                        calc.mfdFinal >= 10 ?
                                          <Badge className="bg-green-100 text-green-800 text-[8px] px-1">APTO</Badge> :
                                          <Badge className="bg-red-100 text-red-800 text-[8px] px-1">NÃO APTO</Badge>
                                      ) : <Badge variant="outline" className="text-[8px] px-1">NÃO AVAL.</Badge>}
                                    </div>
                                    {!isEdit && (
                                      <Button size="sm" variant="ghost" className="h-3 px-0.5 text-[8px]" onClick={() => handleEdit(pauta.id)}>Editar</Button>
                                    )}
                                  </div>
                                )}
                              </TableCell>
                            );
                          })}
                          <TableCell className={`text-center font-bold ${mfGlobal !== null ? (mfGlobal >= 16 ? "text-emerald-700" : mfGlobal >= 14 ? "text-blue-700" : mfGlobal >= 10 ? "text-green-700" : "text-red-700") : "text-muted-foreground"}`}>{mfGlobal !== null ? mfGlobal.toFixed(1) : "—"}</TableCell>
                          <TableCell className="text-center">
                            {mfGlobal !== null ? (
                              mfGlobal >= 10 ? <Badge className="bg-green-500 text-white text-[10px] font-bold">TRANSITA</Badge> : <Badge className="bg-red-500 text-white text-[10px] font-bold">NÃO TRANSITA</Badge>
                            ) : <Badge variant="outline" className="bg-gray-200 text-gray-700 text-[10px] font-bold">—</Badge>}
                          </TableCell>
                          <TableCell className="text-center print:hidden">
                            <Button size="sm" variant="ghost" className="h-4 text-[9px]" onClick={() => { /* trigger edit all */ }}>Editar</Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      )}

      {!classId && (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <p>Seleccione uma turma para gerar a pauta completa.</p>
        </div>
      )}
    </div>
  );
}
