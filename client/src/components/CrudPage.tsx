import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Column = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "enum" | "boolean";
  options?: string[];
  required?: boolean;
  render?: (value: any, row?: Record<string, unknown>) => React.ReactNode;
};

type CrudPageConfig = {
  title: string;
  description: string;
  listKey: string;
  createKey: string;
  updateKey: string;
  deleteKey: string;
  columns: Column[];
  // Optional: skip the default actions column and use custom actions via renderActions
  customActions?: boolean;
};

// Static mapping of all routers - this avoids dynamic proxy access issues with tRPC v11
function getRouter(routerName: string) {
  const routers: Record<string, any> = {
    students: trpc.students,
    courses: trpc.courses,
    classes: trpc.classes,
    classrooms: trpc.classrooms,
    teachers: trpc.teachers,
    subjects: trpc.subjects,
    schedules: trpc.schedules,
    academicYears: trpc.academicYears,
    evaluations: trpc.evaluations,
    grades: trpc.grades,
    finalResults: trpc.finalResults,
    feeTables: trpc.feeTables,
    invoices: trpc.invoices,
    receipts: trpc.receipts,
    employees: trpc.employees,
    contracts: trpc.contracts,
    payroll: trpc.payroll,
    leaves: trpc.leaves,
    books: trpc.books,
    borrowings: trpc.borrowings,
    assets: trpc.assets,
    maintenanceRecords: trpc.maintenanceRecords,
    notifications: trpc.notifications,
    lessonPlans: trpc.lessonPlans,
    contents: trpc.contents,
    attendanceRecords: trpc.attendanceRecords,
    declarations: trpc.declarations,
    auditLogs: trpc.auditLogs,
    provinces: trpc.provinces,
    municipalities: trpc.municipalities,
    communes: trpc.communes,
    schools: trpc.schools,
    educationLevels: trpc.educationLevels,
    angolaProvinces: trpc.angolaProvinces,
    angolaMunicipalities: trpc.angolaMunicipalities,
  };
  return routers[routerName];
}

function invalidateUtils(utils: any, routerName: string) {
  utils[routerName]?.list?.invalidate();
}

export default function CrudPage({ config }: { config: CrudPageConfig }) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const isAdmin = user?.role === "admin";

  // Get the router via static mapping
  const listRouter = getRouter(config.listKey);
  const createRouter = getRouter(config.createKey);
  const updateRouter = getRouter(config.updateKey);
  const deleteRouter = getRouter(config.deleteKey);

  // Get list query
  const listQuery = listRouter.list.useQuery();

  // Get mutations
  const createMutation = createRouter?.create?.useMutation();
  const updateMutation = updateRouter?.update?.useMutation();
  const deleteMutation = deleteRouter?.delete?.useMutation();

  const invalidateList = () => {
    invalidateUtils(utils, config.listKey);
  };

  const handleCreate = () => {
    setEditItem(null);
    setFormData({});
    setIsDialogOpen(true);
  };

  const handleEdit = (item: Record<string, unknown>) => {
    setEditItem(item);
    setFormData({ ...item });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Tem a certeza que deseja eliminar este registo?")) {
      deleteMutation?.mutate({ id }, {
        onSuccess: () => {
          toast.success("Registo eliminado");
          invalidateList();
        },
        onError: (err: any) => toast.error(err.message ?? "Erro ao eliminar"),
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editItem) {
      updateMutation?.mutate(
        { id: editItem.id, data: formData },
        {
          onSuccess: () => {
            toast.success("Registo actualizado");
            invalidateList();
            setIsDialogOpen(false);
          },
          onError: (err: any) => toast.error(err.message ?? "Erro ao actualizar"),
        },
      );
    } else {
      createMutation?.mutate(
        formData,
        {
          onSuccess: () => {
            toast.success("Registo criado");
            invalidateList();
            setIsDialogOpen(false);
          },
          onError: (err: any) => toast.error(err.message ?? "Erro ao criar"),
        },
      );
    }
  };

  const data = (listQuery.data as Record<string, unknown>[]) ?? [];
  const filteredData = data.filter((item: Record<string, unknown>) => {
    if (!searchTerm) return true;
    const values = Object.values(item).map(v => String(v ?? "").toLowerCase());
    return values.some(v => v.includes(searchTerm.toLowerCase()));
  });

  return (
    <DashboardLayout>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>{config.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
            </div>
            <Button onClick={handleCreate} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {listQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum registo encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {config.columns.map((col) => (
                      <TableHead key={col.key}>{col.label}</TableHead>
                    ))}
                    {!config.customActions && <TableHead className="text-right">Acções</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item: Record<string, unknown>, idx: number) => (
                    <TableRow key={idx}>
                      {config.columns.map((col) => (
                        <TableCell key={col.key}>
                          {col.type === "date" && item[col.key] ? (
                            new Date(item[col.key] as string).toLocaleDateString("pt-PT")
                          ) : col.type === "enum" ? (
                            <Badge variant="outline">{String(item[col.key] ?? "")}</Badge>
                          ) : col.render ? (
                            col.render(item[col.key], item)
                          ) : (
                            String(item[col.key] ?? "—")
                          )}
                        </TableCell>
                      ))}
                      {!config.customActions && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id as number)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? "Editar Registo" : "Novo Registo"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {config.columns
              .filter(c => c.key !== "id" && c.key !== "createdAt" && c.key !== "updatedAt")
              .map((col) => (
              <div key={col.key} className="space-y-1">
                <Label htmlFor={col.key}>{col.label}{col.required && " *"}</Label>
                {col.type === "enum" && col.options ? (
                  <select
                    id={col.key}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={String(formData[col.key] ?? "")}
                    onChange={(e) => setFormData(prev => ({ ...prev, [col.key]: e.target.value }))}
                  >
                    <option value="">Seleccionar...</option>
                    {Array.isArray(col.options) && col.options.map((opt: any) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : col.type === "boolean" ? (
                  <select
                    id={col.key}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={String(formData[col.key] ?? "")}
                    onChange={(e) => setFormData(prev => ({ ...prev, [col.key]: e.target.value === "sim" }))}
                  >
                    <option value="sim">Sim</option>
                    <option value="nao">Não</option>
                  </select>
                ) : (
                  <Input
                    id={col.key}
                    type={col.type === "number" ? "number" : col.type === "date" ? "date" : "text"}
                    value={String(formData[col.key] ?? "")}
                    onChange={(e) => setFormData(prev => ({ ...prev, [col.key]: col.type === "number" ? Number(e.target.value) : e.target.value }))}
                  />
                )}
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation?.isPending || updateMutation?.isPending}>
                {editItem ? "Actualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
