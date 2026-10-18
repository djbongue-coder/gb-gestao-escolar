import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit2, Trash2, Plus, Printer } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { getClassificacaoQualitativa, getObservacao } from "@shared/raa";

function getObservacaoBadge(obs: string | null, nota: number | null) {
  if (obs === "NÃO AVALIADA" || nota === null) return <Badge variant="outline" className="bg-gray-200 text-gray-700 text-xs font-bold">NÃO AVALIADA</Badge>;
  if ((nota ?? 0) >= 10) return <Badge className="bg-green-500 text-white hover:bg-green-500 text-xs font-bold">{obs}</Badge>;
  return <Badge className="bg-red-500 text-white hover:bg-red-500 text-xs font-bold">{obs}</Badge>;
}

/** Retorna a cor de fundo da linha baseada na observação */
function getRowColor(obs: string | null, nota: number | null): string {
  if (obs === "NÃO AVALIADA" || nota === null) return "bg-gray-50";
  if ((nota ?? 0) >= 10) return "bg-green-50";
  return "bg-red-50";
}

/** Retorna a cor do texto para a célula MF */
function getMFColor(nota: number | null): string {
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

interface PautaGeralRow {
  id: number;
  studentId: number;
  subjectId: number;
  classId: number;
  academicYearId: number;
  mdf: number | null;
  mf: number | null;
  classificacaoQualitativa: string | null;
  observacao: string | null;
}

export default function PautaGeralPage() {
  const [classId, setClassId] = useState<string>("");
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: pautasGerais, isLoading, refetch } = trpc.pautasGerais.list.useQuery(undefined as never);
  const { data: students } = trpc.students.list.useQuery(undefined as never);
  const { data: subjects } = trpc.subjects.list.useQuery(undefined as never);
  const { data: classes } = trpc.classes.list.useQuery(undefined as never);

  const createMutation = trpc.pautasGerais.create.useMutation({
    onSuccess: () => { refetch(); toast.success("Registo criado com sucesso"); },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const updateMutation = trpc.pautasGerais.update.useMutation({
    onSuccess: () => { refetch(); toast.success("Registo actualizado com sucesso"); },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const deleteMutation = trpc.pautasGerais.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Registo eliminado"); },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<PautaGeralRow>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [addData, setAddData] = useState<Partial<PautaGeralRow>>({ classId: 1, academicYearId: 1 });

  const filtered = pautasGerais?.filter((p: PautaGeralRow) =>
    !classId || classId === "all" || p.classId === Number(classId)
  ) ?? [];

  const handlePrint = () => {
    window.print();
  };

  // Exportar Excel
  const handleExportExcel = () => {
    if (filtered.length === 0) {
      toast.warning("Sem dados para exportar.");
      return;
    }

    const selectedClass = classId && classId !== "all" ? classes?.find((c: any) => c.id === Number(classId)) : null;
    const className = selectedClass ? (selectedClass.name || `Classe ${selectedClass.id}`) : "Todas";

    // Criar dados para o Excel
    const headers = ["Nº", "Aluno", "Disciplina", "MDF", "MF", "Qualitativa", "Observação"];
    const rows: any[][] = filtered.map((row: PautaGeralRow, idx: number) => {
      const student = students?.find((s: any) => s.id === row.studentId);
      const subject = subjects?.find((s: any) => s.id === row.subjectId);
      const notaFinal = row.mf ?? row.mdf;
      const classif = row.classificacaoQualitativa ?? getClassificacaoQualitativa(notaFinal);
      const obs = row.observacao ?? getObservacao(notaFinal);
      return [idx + 1, student?.fullName || `#${row.studentId}`, subject?.name || `#${row.subjectId}`, row.mdf ?? "", row.mf ?? "", classif ?? "", obs];
    });

    // Criar workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["PAUTA-GERAL DE AVALIAÇÃO"],
      [""],
      ["República de Angola"],
      ["Ministério da Educação"],
      [""],
      headers,
      ...rows,
    ]);

    ws["!cols"] = [
      { wch: 4 },
      { wch: 30 },
      { wch: 28 },
      { wch: 8 },
      { wch: 8 },
      { wch: 14 },
      { wch: 14 },
    ];
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];

    XLSX.utils.book_append_sheet(wb, ws, "Pauta-Geral");
    const fileName = `Pauta_Geral_${className.replace(/\s+/g, "_")}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success(`Ficheiro Excel exportado: ${fileName}`);
  };

  const handleSaveEdit = (row: PautaGeralRow) => {
    const merged = { ...editData };
    const mdf = merged.mdf ?? row.mdf;
    const mf = merged.mf ?? row.mf;
    const notaFinal = mf ?? mdf;
    merged.classificacaoQualitativa = getClassificacaoQualitativa(notaFinal);
    merged.observacao = getObservacao(notaFinal);
    updateMutation.mutate({ id: row.id, data: merged });
    setEditingId(null);
    setEditData({});
  };

  const handleSaveNew = () => {
    const notaFinal = addData.mf ?? addData.mdf ?? null;
    createMutation.mutate({
      ...addData,
      classificacaoQualitativa: getClassificacaoQualitativa(notaFinal),
      observacao: getObservacao(notaFinal),
    } as any);
    setShowAddForm(false);
    setAddData({ classId: 1, academicYearId: 1 });
  };

  return (
    <div className="space-y-4 print:space-y-0">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pauta-Geral</h1>
          <p className="text-muted-foreground">
            MDF | MF | Observação
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
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" /> Imprimir
          </Button>
          <Button variant="outline" onClick={handleExportExcel} className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Formulário de Adição */}
      {showAddForm && (
        <Card className="print:hidden">
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Aluno</label>
                <Select value={String(addData.studentId || "")} onValueChange={(v) => setAddData({ ...addData, studentId: Number(v) })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar aluno" /></SelectTrigger>
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
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {subjects?.map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name || s.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(["mdf", "mf"] as const).map((field) => (
                <div key={field}>
                  <label className="text-sm font-medium uppercase">{field}</label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="—"
                    value={addData[field]?.toString() || ""}
                    onChange={(e) => setAddData({ ...addData, [field]: e.target.value === "" ? null : Number(e.target.value) })}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancelar</Button>
              <Button onClick={handleSaveNew}>Guardar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela da Pauta-Geral */}
      <Card>
        <CardHeader>
          <CardTitle>Pauta-Geral de Avaliação</CardTitle>
        </CardHeader>
        <CardContent>
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
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-8">Nº</TableHead>
                    <TableHead className="min-w-32">Aluno</TableHead>
                    <TableHead className="min-w-28">Disciplina</TableHead>
                    <TableHead className="w-16 text-center">MDF</TableHead>
                    <TableHead className="w-16 text-center">MF</TableHead>
                    <TableHead className="w-20 text-center">Qualit.</TableHead>
                    <TableHead className="min-w-24 text-center">Observação</TableHead>
                    <TableHead className="w-20 text-center print:hidden">Acções</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row: PautaGeralRow, idx: number) => {
                    const student = students?.find((s: any) => s.id === row.studentId);
                    const subject = subjects?.find((s: any) => s.id === row.subjectId);
                    const isEditing = editingId === row.id;
                    const notaFinal = row.mf ?? row.mdf;
                    const classif = row.classificacaoQualitativa ?? getClassificacaoQualitativa(notaFinal);
                    const obs = row.observacao ?? getObservacao(notaFinal);

                    return (
                      <TableRow key={row.id} className={`hover:opacity-80 ${getRowColor(obs, notaFinal)}`}>
                        <TableCell className="font-mono">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{student?.fullName || `#${row.studentId}`}</TableCell>
                        <TableCell>{subject?.name || `#${row.subjectId}`}</TableCell>
                        {([
                          ["mdf", row.mdf],
                          ["mf", row.mf],
                        ] as const).map(([field, value]) => (
                          <TableCell key={field} className="text-center">
                            {isEditing ? (
                              <Input
                                type="number"
                                step="0.1"
                                className="w-16 h-8 text-center text-sm"
                                defaultValue={value?.toString() ?? ""}
                                onBlur={(e) => {
                                  const val = e.target.value === "" ? null : Number(e.target.value);
                                  setEditData((prev) => ({ ...prev, [field]: val }));
                                }}
                              />
                            ) : (
                              <span className={`font-mono text-xs ${field === "mf" ? getMFColor(notaFinal) : "font-semibold"}`}>{value !== null && value !== undefined ? Number(value).toFixed(1) : "—"}</span>
                            )}
                          </TableCell>
                        ))}
                        <TableCell className="text-center">{getQualitativaBadge(classif)}</TableCell>
                        <TableCell className="text-center">{getObservacaoBadge(obs, notaFinal)}</TableCell>
                        <TableCell className="text-center print:hidden">
                          {isEditing ? (
                            <Button variant="ghost" size="sm" onClick={() => handleSaveEdit(row)} className="text-green-600">
                              ✓
                            </Button>
                          ) : (
                            <div className="flex justify-center gap-1">
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => { setEditingId(row.id); setEditData({}); }}
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteMutation.mutate({ id: row.id })}
                                >
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
