import { useMemo, useState } from "react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Pencil, Trash2, FileText, Plus, Users, Printer, CheckCircle, RotateCcw, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import type { Atas } from "@shared/types";

declare module "jspdf" {
  interface jsPDF {
    lastAutoTable?: { finalY: number };
    autoTable: (options: Record<string, unknown>) => jsPDF;
  }
}

const PERIOD_OPTIONS: { value: Atas["period"]; label: string }[] = [
  { value: "1trimestre", label: "1.º Trimestre" },
  { value: "2trimestre", label: "2.º Trimestre" },
  { value: "3trimestre", label: "3.º Trimestre" },
  { value: "epoca", label: "Época Especial" },
  { value: "final", label: "Avaliação Final" },
];

const PERIOD_LABELS: Record<Atas["period"], string> = {
  "1trimestre": "1.º Trimestre",
  "2trimestre": "2.º Trimestre",
  "3trimestre": "3.º Trimestre",
  epoca: "Época Especial",
  final: "Avaliação Final",
};

// Cabeçalho oficial (mesmo bloco da Mini-Pauta)
function pdfHeaderBlock(doc: jsPDF, pageWidth: number, school: {
  name: string | null; nif: string | null; address: string | null; phone: string | null; email: string | null;
  professorName?: string | null;
} | null) {
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("REPÚBLICA DE ANGOLA", pageWidth / 2, 14, { align: "center" });
  doc.text("MINISTÉRIO DA EDUCAÇÃO", pageWidth / 2, 19, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  if (school?.name) doc.text(school.name, pageWidth / 2, 24, { align: "center" });
  const lines: string[] = [];
  if (school?.address) lines.push(school.address);
  const contact: string[] = [];
  if (school?.phone) contact.push(`Tel: ${school.phone}`);
  if (school?.email) contact.push(`Email: ${school.email}`);
  if (school?.nif) contact.push(`NIF: ${school.nif}`);
  if (contact.length > 0) lines.push(contact.join("   |   "));
  lines.forEach((l, i) => doc.text(l, pageWidth / 2, 29 + i * 4.5, { align: "center" }));
  doc.setDrawColor(15, 82, 186);
  doc.setLineWidth(0.5);
  doc.line(10, 35 + (lines.length - 1) * 4.5, pageWidth - 10, 35 + (lines.length - 1) * 4.5);
  return 38 + (lines.length - 1) * 4.5;
}

export default function AtasPage() {
  const utils = trpc.useUtils();
  const { data: atasList, isLoading } = trpc.atas.list.useQuery();
  const { data: schoolConfigData } = trpc.schoolConfig.get.useQuery();
  const { data: classesData } = trpc.classes.list.useQuery();
  const { data: academicYearsData } = trpc.academicYears.list.useQuery();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [resumoAtaId, setResumoAtaId] = useState<number | null>(null);
  const [resumoOpen, setResumoOpen] = useState(false);
  const [resumoClassId, setResumoClassId] = useState<number | null>(null);
  const [resumoYearId, setResumoYearId] = useState<number | null>(null);
  const [resumoPeriod, setResumoPeriod] = useState<Atas["period"] | null>(null);

  // Form state
  const [form, setForm] = useState({
    classId: "", academicYearId: "", period: "1trimestre" as Atas["period"],
    numero: "", meetingDate: "", location: "", startTime: "", endTime: "",
    agenda: "", deliberacoes: "", observacoes: "",
    directorName: "", coordenadorName: "", conselhoMembros: "",
  });

  const currentYearId = useMemo(() => {
    const y = academicYearsData?.find((a) => a.active)?.id ?? academicYearsData?.[0]?.id;
    return y ? String(y) : "";
  }, [academicYearsData]);

  const resetForm = () =>
    setForm({
      classId: "", academicYearId: currentYearId, period: "1trimestre", numero: "", meetingDate: "",
      location: "", startTime: "", endTime: "", agenda: "", deliberacoes: "",
      observacoes: "", directorName: "", coordenadorName: "", conselhoMembros: "",
    });

  const openCreate = () => {
    setEditingId(null);
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (ata: NonNullable<typeof atasList>[number]) => {
    setEditingId(ata.id);
    const cd = (ata as any).meetingDate as Date | null;
    const d = cd ? cd.toISOString().slice(0, 16) : "";
    setForm({
      classId: String(ata.classId),
      academicYearId: String(ata.academicYearId),
      period: ata.period,
      numero: ata.numero ?? "",
      meetingDate: d,
      location: ata.location ?? "",
      startTime: (ata as any).startTime ?? "",
      endTime: (ata as any).endTime ?? "",
      agenda: ata.agenda ?? "",
      deliberacoes: ata.deliberacoes ?? "",
      observacoes: ata.observacoes ?? "",
      directorName: ata.directorName ?? "",
      coordenadorName: (ata as any).coordenadorName ?? "",
      conselhoMembros: (ata as any).conselhoMembrosJson
        ? JSON.parse((ata as any).conselhoMembrosJson).join(", ")
        : "",
    });
    setFormOpen(true);
  };

  const createMutation = trpc.atas.create.useMutation({
    onSuccess: () => {
      utils.atas.list.invalidate();
      toast.success("Ata criada com sucesso");
      setFormOpen(false);
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const updateMutation = trpc.atas.update.useMutation({
    onSuccess: () => {
      utils.atas.list.invalidate();
      toast.success("Ata actualizada");
      setFormOpen(false);
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const approveMutation = trpc.atas.approve.useMutation({
    onSuccess: () => {
      utils.atas.list.invalidate();
      toast.success("Ata aprovada com validação digital do director");
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const unapproveMutation = trpc.atas.unapprove.useMutation({
    onSuccess: () => {
      utils.atas.list.invalidate();
      toast.success("Ata reaberta como rascunho");
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const deleteMutation = trpc.atas.delete.useMutation({
    onSuccess: () => {
      utils.atas.list.invalidate();
      toast.success("Ata eliminada");
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const conselhoJson = form.conselhoMembros
      ? JSON.stringify(form.conselhoMembros.split(",").map((s) => s.trim()).filter(Boolean))
      : "[]";
    const data = {
      classId: Number(form.classId),
      academicYearId: Number(form.academicYearId),
      period: form.period,
      numero: form.numero || undefined,
      meetingDate: form.meetingDate || undefined,
      location: form.location || undefined,
      startTime: form.startTime || undefined,
      endTime: form.endTime || undefined,
      agenda: form.agenda || undefined,
      deliberacoes: form.deliberacoes || undefined,
      observacoes: form.observacoes || undefined,
      directorName: form.directorName || undefined,
      coordenadorName: form.coordenadorName || undefined,
      conselhoMembrosJson: conselhoJson,
    };
    if (editingId) updateMutation.mutate({ id: editingId, data });
    else createMutation.mutate(data);
  };

  // PDF generation
  const generatePdf = async (ata: NonNullable<typeof atasList>[number]) => {
    // Se a ata não tem resumo gravado, calcular em tempo real
    let resumo = (ata as any).resumoJson ? JSON.parse((ata as any).resumoJson) : {};
    if (!resumo.disciplinas || resumo.disciplinas.length === 0) {
      try {
        const resp = await fetch(
          `/api/trpc/atas.resumo?input=${encodeURIComponent(
            JSON.stringify({ json: { classId: ata.classId, academicYearId: ata.academicYearId, period: ata.period } }),
          )}`,
          { credentials: "include" },
        );
        if (resp.ok) {
          const body = await resp.json();
          resumo = body?.result?.data?.json ?? {};
        }
      } catch {
        resumo = {};
      }
    }
    const year = academicYearsData?.find((a) => a.id === ata.academicYearId);
    const turma = classesData?.find((c) => c.id === ata.classId);

    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    let y = pdfHeaderBlock(doc, pageWidth, schoolConfigData as any);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`ATA DE AVALIAÇÃO DO ${PERIOD_LABELS[ata.period].toUpperCase()}`, pageWidth / 2, y + 8, { align: "center" });
    doc.setFontSize(10);
    if (ata.numero) doc.text(`N.º ${ata.numero}`, pageWidth / 2, y + 13.5, { align: "center" });

    y += ata.numero ? 20 : 15;

    // Identificação
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("I. IDENTIFICAÇÃO", 10, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const idLines = [
      `Turma/Classe: ${turma?.name ?? "—"}        Ano Lectivo: ${year?.year ?? "—"}`,
      `Data da reunião: ${ata.meetingDate ? new Date(ata.meetingDate).toLocaleDateString("pt-PT") : "—"}        Local: ${ata.location ?? "—"}`,
      `Horário: ${ata.startTime ?? "—"} — ${ata.endTime ?? "—"}`,
    ];
    idLines.forEach((l) => {
      doc.text(l, 10, y);
      y += 5;
    });

    y += 3;
    doc.setFont("helvetica", "bold");
    doc.text("II. AGENDA DA REUNIÃO", 10, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    const agendaLines = doc.splitTextToSize(ata.agenda ?? "—", pageWidth - 20);
    agendaLines.forEach((l: string) => {
      doc.text(l, 10, y);
      y += 4.5;
    });

    y += 3;
    doc.setFont("helvetica", "bold");
    doc.text("III. DELIBERAÇÕES DO CONSELHO DE TURMA", 10, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    const delibLines = doc.splitTextToSize(ata.deliberacoes ?? "—", pageWidth - 20);
    delibLines.forEach((l: string) => {
      doc.text(l, 10, y);
      y += 4.5;
    });

    // Tabela de resumo
    if (resumo?.disciplinas?.length > 0) {
      y += 3;
      doc.setFont("helvetica", "bold");
      doc.text("IV. RESUMO DE RESULTADOS", 10, y);
      y += 4;

      doc.autoTable({
        startY: y,
        head: [["Disciplina", "Avaliados", "Positivas", "Negativas", "Média Turma", "Taxa Aprovação"]],
        body: resumo.disciplinas.map((d: any) => [
          d.subjectName,
          String(d.alunosAvaliados),
          String(d.positivas),
          String(d.negativas),
          Number(d.mediaTurma).toFixed(1),
          `${Number(d.taxaAprovacao).toFixed(1)}%`,
        ]),
        headStyles: { fillColor: [15, 82, 186], textColor: [255, 255, 255], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 10, right: 10 },
      });
      y = (doc as any).lastAutoTable?.finalY ?? y + 40;
    }

    // Indicadores gerais
    if (resumo?.totalMatriculados !== undefined) {
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.text("V. INDICADORES GERAIS DA TURMA", 10, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const ind = [
        `Alunos matriculados: ${resumo.totalMatriculados}        Avaliados: ${resumo.avaliados}        Sem avaliação: ${resumo.semAvaliacao ?? 0}`,
        `Positivas: ${resumo.positivas} (${resumo.taxaPositivas ?? 0}%)        Negativas: ${resumo.negativas} (${resumo.taxaNegativas ?? 0}%)`,
        `Média geral da turma: ${Number(resumo.mediaGeral ?? 0).toFixed(1)}`,
      ];
      if (resumo.reprovadosFaltas) ind.push(`Reprovados por faltas: ${resumo.reprovadosFaltas}`);
      if (resumo.transferidos) ind.push(`Transferidos: ${resumo.transferidos}`);
      if (resumo.anulacoes) ind.push(`Anulações: ${resumo.anulacoes}`);
      ind.forEach((l) => {
        doc.text(l, 10, y);
        y += 5;
      });
    }

    if (ata.observacoes) {
      y += 3;
      doc.setFont("helvetica", "bold");
      doc.text("VI. OBSERVAÇÕES", 10, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      const obsLines = doc.splitTextToSize(ata.observacoes, pageWidth - 20);
      obsLines.forEach((l: string) => {
        doc.text(l, 10, y);
        y += 4.5;
      });
    }

    // Assinaturas
    y += 12;
    doc.setFont("helvetica", "bold");
    doc.text("ASSINATURAS", pageWidth / 2, y, { align: "center" });
    y += 20;
    const director = ata.directorName || schoolConfigData?.professorName || "____________________";
    const coordenador = ata.coordenadorName || "____________________";
    const membros: string[] = (ata as any).conselhoMembrosJson
      ? JSON.parse((ata as any).conselhoMembrosJson)
      : [];

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.line(10, y, 80, y);
    doc.text("Director Pedagógico", 45, y + 4, { align: "center" });
    doc.text(director, 45, y + 8.5, { align: "center" });

    doc.line(pageWidth - 80, y, pageWidth - 10, y);
    doc.text("Professor(a) Coordenador(a) de Turma", pageWidth - 45, y + 4, { align: "center" });
    doc.text(coordenador, pageWidth - 45, y + 8.5, { align: "center" });

    y += 20;
    if (membros.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Conselho de Turma", pageWidth / 2, y, { align: "center" });
      y += 6;
      doc.setFont("helvetica", "normal");
      membros.forEach((m: string) => {
        doc.line(10, y, 80, y);
        doc.text(m, 45, y + 4, { align: "center" });
        doc.line(pageWidth - 80, y, pageWidth - 10, y);
        y += 12;
      });
    }

    // Carimbo de validação digital (quando aprovada)
    if ((ata as any).status === "aprovada" && (ata as any).approvedBy) {
      const stampY = y + 12;
      doc.setDrawColor(0, 120, 60);
      doc.setLineWidth(0.8);
      doc.roundedRect(10, stampY, pageWidth - 20, 16, 2, 2);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 120, 60);
      doc.setFontSize(11);
      doc.text("ATA APROVADA DIGITALMENTE", pageWidth / 2, stampY + 5.5, { align: "center" });
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const approvedDate = (ata as any).approvedAt ? new Date((ata as any).approvedAt) : null;
      const dateStr = approvedDate
        ? approvedDate.toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short" })
        : "";
      doc.text(
        `Director(a) validador(a): ${(ata as any).approvedBy}        Data/hora: ${dateStr}`,
        pageWidth / 2,
        stampY + 11.5,
        { align: "center" },
      );
      doc.setTextColor(0, 0, 0);
    }

    doc.save(`Ata_${PERIOD_LABELS[ata.period].replace(/[^a-zA-ZÀ-ú0-9]/g, "_")}_${turma?.name ?? "turma"}.pdf`);
    toast.success("PDF da ata gerado");
  };

  const viewResumo = (ataId: number, classId: number, academicYearId: number, period: Atas["period"]) => {
    setResumoAtaId(ataId);
    setEditingId(ataId);
    setResumoClassId(classId);
    setResumoYearId(academicYearId);
    setResumoPeriod(period);
    setResumoOpen(true);
  };

  const { data: resumoData, isLoading: resumoLoading } = trpc.atas.resumo.useQuery(
    { classId: resumoClassId!, academicYearId: resumoYearId!, period: resumoPeriod! },
    { enabled: resumoOpen && resumoAtaId !== null && resumoClassId !== null && resumoYearId !== null && resumoPeriod !== null },
  );

  const applyResumo = () => {
    if (!resumoData || resumoAtaId === null) return;
    updateMutation.mutate({ id: resumoAtaId, data: { resumoJson: JSON.stringify(resumoData) } });
    setResumoOpen(false);
  };

  const fmt = (ata: NonNullable<typeof atasList>[number]) => {
    const turma = classesData?.find((c) => c.id === ata.classId)?.name ?? `#${ata.classId}`;
    const year = academicYearsData?.find((a) => a.id === ata.academicYearId)?.year ?? "";
    const d = ata.meetingDate ? new Date(ata.meetingDate).toLocaleDateString("pt-PT") : "";
    return `${turma} — ${PERIOD_LABELS[ata.period]}${year ? ` (${year})` : ""}${d ? ` — ${d}` : ""}`;
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Atas de Avaliação</h1>
          <p className="text-sm text-muted-foreground">
            Atas oficiais das reuniões de avaliação do conselho de turma (modelo MED)
          </p>
        </div>
        <div className="flex gap-2">
          {resumoOpen && resumoClassId !== null && (
            <Button variant="secondary" onClick={applyResumo}>
              <FileText className="w-4 h-4 mr-2" /> Preencher resumo da ata
            </Button>
          )}
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> Nova Ata
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-5">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner className="h-8 w-8" />
            </div>
          ) : !atasList || atasList.length === 0 ? (
            <Empty>
              <EmptyTitle>Nenhuma ata criada</EmptyTitle>
              <EmptyDescription>Clique em 'Nova Ata' para criar a primeira ata de avaliação.</EmptyDescription>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#0f52ba] hover:bg-[#0f52ba]">
                  <TableHead className="text-white">Ata</TableHead>
                  <TableHead className="text-white">Período</TableHead>
                  <TableHead className="text-white">Estado</TableHead>
                  <TableHead className="text-white">Data da Reunião</TableHead>
                  <TableHead className="text-white">Director</TableHead>
                  <TableHead className="text-white">Coordenador</TableHead>
                  <TableHead className="text-white text-right">Acções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atasList.map((ata) => (
                  <TableRow key={ata.id}>
                    <TableCell className="font-medium">{fmt(ata)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {PERIOD_LABELS[ata.period]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(ata as any).status === "aprovada" ? (
                        <Badge className="bg-green-600 hover:bg-green-700 text-white border-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" /> Aprovada
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                          Rascunho
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{ata.meetingDate ? new Date(ata.meetingDate).toLocaleDateString("pt-PT") : "—"}</TableCell>
                    <TableCell>{ata.directorName || "—"}</TableCell>
                    <TableCell>{(ata as any).coordenadorName || "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => generatePdf(ata)} title="Gerar PDF">
                          <Printer className="w-4 h-4" />
                        </Button>
                        {(ata as any).status !== "aprovada" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-700"
                            disabled={approveMutation.isPending}
                            title="Aprovar ata (validação digital do director)"
                            onClick={() => {
                              const directorName = ata.directorName || schoolConfigData?.professorName || "";
                              if (!directorName) {
                                toast.error("Indique o nome do Director Pedagógico na ata ou nas Configurações");
                                return;
                              }
                              approveMutation.mutate({ id: ata.id, directorName });
                            }}
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-amber-700"
                            disabled={unapproveMutation.isPending}
                            title="Reabrir como rascunho"
                            onClick={() => {
                              if (confirm("Reabrir a ata como rascunho? A validação digital será removida.")) {
                                unapproveMutation.mutate({ id: ata.id });
                              }
                            }}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => viewResumo(ata.id, ata.classId, ata.academicYearId, ata.period)} title="Ver resumo">
                          <Users className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(ata)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => {
                          if (confirm("Eliminar esta ata?")) deleteMutation.mutate({ id: ata.id });
                        }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Formulário */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Ata" : "Nova Ata de Avaliação"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Turma/Classe *</label>
                <Select value={form.classId} onValueChange={(v) => setForm({ ...form, classId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar turma" /></SelectTrigger>
                  <SelectContent>
                    {classesData?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Período *</label>
                <Select value={form.period} onValueChange={(v: Atas["period"]) => setForm({ ...form, period: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PERIOD_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">N.º da Ata</label>
                <Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} placeholder="Ex: 01/2026" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Data da Reunião</label>
                <Input type="datetime-local" value={form.meetingDate} onChange={(e) => setForm({ ...form, meetingDate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Local</label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Sala dos professores" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Início</label>
                <Input value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} placeholder="08:00" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Fim</label>
                <Input value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} placeholder="10:00" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Agenda da Reunião</label>
              <Textarea value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} rows={3} placeholder="Pontos a discutir na reunião..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Deliberações do Conselho de Turma</label>
              <Textarea value={form.deliberacoes} onChange={(e) => setForm({ ...form, deliberacoes: e.target.value })} rows={4} placeholder="Decisões tomadas pelo conselho de turma..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Director Pedagógico (assinatura)</label>
                <Input value={form.directorName} onChange={(e) => setForm({ ...form, directorName: e.target.value })} placeholder={schoolConfigData?.professorName ?? ""} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Coordenador(a) de Turma (assinatura)</label>
                <Input value={form.coordenadorName} onChange={(e) => setForm({ ...form, coordenadorName: e.target.value })} placeholder="Nome do professor coordenador" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Membros do Conselho de Turma (assinaturas, separados por vírgula)</label>
              <Input value={form.conselhoMembros} onChange={(e) => setForm({ ...form, conselhoMembros: e.target.value })} placeholder="Prof. Ana Silva, Prof. João Santos, Prof. Maria Costa" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Observações</label>
              <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || !form.classId || !form.academicYearId}>
                {editingId ? "Guardar Alterações" : "Criar Ata"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Resumo para preencher */}
      <Dialog open={resumoOpen} onOpenChange={setResumoOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resumo de Resultados (para a ata)</DialogTitle>
          </DialogHeader>
          {resumoLoading ? (
            <div className="flex justify-center py-8"><Spinner className="h-8 w-8" /></div>
          ) : resumoData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="border rounded p-2 text-center"><div className="text-xs text-muted-foreground">Matriculados</div><div className="text-xl font-bold">{resumoData.totalMatriculados}</div></div>
                <div className="border rounded p-2 text-center"><div className="text-xs text-muted-foreground">Avaliados</div><div className="text-xl font-bold">{resumoData.avaliados}</div></div>
                <div className="border rounded p-2 text-center"><div className="text-xs text-muted-foreground">Positivas</div><div className="text-xl font-bold text-green-600">{resumoData.positivas}</div></div>
                <div className="border rounded p-2 text-center"><div className="text-xs text-muted-foreground">Negativas</div><div className="text-xl font-bold text-red-600">{resumoData.negativas}</div></div>
                <div className="border rounded p-2 text-center"><div className="text-xs text-muted-foreground">% Positivas</div><div className="text-xl font-bold">{resumoData.taxaPositivas}%</div></div>
                <div className="border rounded p-2 text-center"><div className="text-xs text-muted-foreground">Média Geral</div><div className="text-xl font-bold">{Number(resumoData.mediaGeral).toFixed(1)}</div></div>
                <div className="border rounded p-2 text-center"><div className="text-xs text-muted-foreground">Sem avaliação</div><div className="text-xl font-bold">{resumoData.semAvaliacao}</div></div>
                <div className="border rounded p-2 text-center"><div className="text-xs text-muted-foreground">Reprov. Faltas</div><div className="text-xl font-bold">{resumoData.reprovadosFaltas}</div></div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Disciplina</TableHead>
                    <TableHead className="text-right">Avaliados</TableHead>
                    <TableHead className="text-right">Positivas</TableHead>
                    <TableHead className="text-right">Negativas</TableHead>
                    <TableHead className="text-right">Média</TableHead>
                    <TableHead className="text-right">% Aprov.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resumoData.disciplinas.map((d) => (
                    <TableRow key={d.subjectName}>
                      <TableCell>{d.subjectName}</TableCell>
                      <TableCell className="text-right">{d.alunosAvaliados}</TableCell>
                      <TableCell className="text-right text-green-600">{d.positivas}</TableCell>
                      <TableCell className="text-right text-red-600">{d.negativas}</TableCell>
                      <TableCell className="text-right">{Number(d.mediaTurma).toFixed(1)}</TableCell>
                      <TableCell className="text-right">{d.taxaAprovacao.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="text-xs text-muted-foreground">
                Nota: clique em "Preencher resumo da ata" para gravar estes dados na ata aberta. Depois poderá gerar o PDF com o botão de impressora na lista.
              </div>
              <div className="flex justify-end">
                <Button onClick={applyResumo}>Preencher resumo da ata</Button>
              </div>
            </div>
          ) : (
            <Empty>
              <EmptyTitle>Sem dados</EmptyTitle>
              <EmptyDescription>Não existem resultados lançados para esta turma/período.</EmptyDescription>
            </Empty>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
