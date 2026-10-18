import CrudPage from "@/components/CrudPage";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Printer, FileText, Edit2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const config = {
  title: "Declarações",
  description: "Emissão de declarações escolares",
  listKey: "declarations",
  createKey: "declarations",
  updateKey: "declarations",
  deleteKey: "declarations",
  customActions: true,
  columns: [
    {
      key: "type",
      label: "Tipo",
      type: "enum",
      options: ["matricula", "frequentou", "transitou", "conclusao", "outra"],
      render: (value: string) => {
        const labels: Record<string, string> = {
          matricula: "Matrícula",
          frequentou: "Frequentou",
          transitou: "Transitou",
          conclusao: "Conclusão",
          outra: "Outra",
        };
        return <Badge variant="outline">{labels[value] || value}</Badge>;
      },
    },
    { key: "studentId", label: "Aluno ID", type: "number" },
    {
      key: "issuedDate",
      label: "Data Emissão",
      type: "date",
      render: (value: any) => (
        <span>{value ? new Date(value).toLocaleDateString("pt-PT") : "—"}</span>
      ),
    },
    {
      key: "description",
      label: "Descrição",
      type: "text",
      render: (value: any) => (
        <span className="max-w-48 truncate block">{value || "—"}</span>
      ),
    },
    {
      key: "actions",
      label: "Acções",
      type: "text",
      render: (_value: any, row?: Record<string, unknown>) => (
        <DeclarationActionCell row={row} />
      ),
    },
  ],
};

function DeclarationActionCell({ row }: { row?: Record<string, unknown> }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError } = trpc.declarations.byId.useQuery(
    { id: Number(row?.id) },
    { enabled: open && !!row?.id },
  );

  const handlePrint = () => {
    window.print();
    toast.success("A preparar impressão...");
  };

  return (
    <div className="flex justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        title="Visualizar / Imprimir Declaração"
      >
        <Printer className="h-4 w-4 text-primary" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Declaração - Visualização e Impressão
            </DialogTitle>
            <DialogDescription>
              Pré-visualização do documento oficial. Utilize Ctrl+P para imprimir ou guardar como PDF.
            </DialogDescription>
          </DialogHeader>

          {isLoading && (
            <div className="flex justify-center py-12">
              <p className="text-muted-foreground">A carregar...</p>
            </div>
          )}

          {isError && (
            <div className="text-center py-8 text-destructive">
              <p>Erro ao carregar os dados da declaração.</p>
            </div>
          )}

          {!isLoading && !isError && data && (
            <div className="space-y-4">
              {/* Documento A4 */}
              <div
                id="declaration-document"
                className="bg-white text-black border border-gray-200 p-8 font-serif shadow-sm"
                style={{ fontFamily: "Times New Roman, serif" }}
              >
                {/* Cabeçalho da Escola */}
                <div className="text-center border-b-2 border-black pb-4 mb-6">
                  <h1 className="text-lg font-bold uppercase tracking-wide">
                    República de Angola
                  </h1>
                  <h2 className="text-sm font-semibold uppercase mb-2">
                    Ministério da Educação
                  </h2>
                  <h3 className="text-xl font-bold uppercase">
                    {data.schoolConfig?.name || "NOME DA ESCOLA"}
                  </h3>
                  <div className="text-sm mt-2 space-y-1">
                    {data.schoolConfig?.nif && (
                      <p>
                        <span className="font-semibold">NIF:</span>{" "}
                        {data.schoolConfig.nif}
                      </p>
                    )}
                    {data.schoolConfig?.address && (
                      <p>
                        <span className="font-semibold">Endereço:</span>{" "}
                        {data.schoolConfig.address}
                      </p>
                    )}
                    <p className="flex justify-center gap-4 flex-wrap">
                      {data.schoolConfig?.provinceName && (
                        <span>
                          <span className="font-semibold">Província:</span>{" "}
                          {data.schoolConfig.provinceName}
                        </span>
                      )}
                      {data.schoolConfig?.municipalityName && (
                        <span>
                          <span className="font-semibold">Município:</span>{" "}
                          {data.schoolConfig.municipalityName}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Corpo do Documento */}
                <div className="mt-8 space-y-6">
                  <div className="text-right">
                    <p className="text-sm">
                      {new Date(data.declaration.issuedDate || data.declaration.createdAt).toLocaleDateString("pt-AO", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <h4 className="text-center text-lg font-bold underline uppercase tracking-wider">
                    {data.declaration.type === "matricula" ? "Declaração de Matrícula" :
                     data.declaration.type === "frequentou" ? "Declaração de Frequência" :
                     data.declaration.type === "transitou" ? "Declaração de Transição" :
                     data.declaration.type === "conclusao" ? "Declaração de Conclusão" :
                     "Declaração"}
                  </h4>

                  <div className="mt-6 space-y-4 text-justify leading-relaxed">
                    <p>
                      {data.student ? (
                        <>
                          Certificamos que <strong>{data.student.fullName}</strong>
                          {data.student.dateOfBirth &&
                            `, nascido(a) em ${new Date(data.student.dateOfBirth).toLocaleDateString("pt-AO")}`}
                          {data.student.gender &&
                            `, de género ${data.student.gender === "M" ? "masculino" : "feminino"}`}
                          {data.student.processNumber &&
                            `, portador(a) do processo n.º ${data.student.processNumber}`}
                          , é aluno(a) regularmente matriculado(a) nesta instituição de ensino.
                        </>
                      ) : (
                        "Certificamos que o(a) aluno(a) identificado(a) nos registos desta instituição de ensino se encontra regularmente matriculado(a)."
                      )}
                    </p>
                    <p>A presente declaração é passada para os devidos fins.</p>
                  </div>

                  {/* Rodapé / Assinatura */}
                  <div className="mt-16 pt-8">
                    <div className="flex justify-end">
                      <div className="text-center w-64">
                        <div className="border-b border-black mb-2 h-12"></div>
                        <p className="text-sm font-semibold">O(A) Director(a)</p>
                        <p className="text-xs text-gray-600 mt-1">Carimbo e Assinatura</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botão de Impressão */}
              <div className="flex justify-center pt-4 border-t">
                <Button onClick={handlePrint} className="gap-2">
                  <Printer className="h-4 w-4" />
                  Imprimir / Guardar PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DeclarationsPage() {
  return <CrudPage config={config as any} />;
}
