import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { School, Save, Building2, MapPin, Phone, Mail, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SchoolConfigPage() {
  const { data: config, isLoading } = trpc.schoolConfig.get.useQuery();
  const updateMutation = trpc.schoolConfig.update.useMutation({
    onSuccess: () => {
      toast.success("Configurações guardadas com sucesso!");
      utils.schoolConfig.get.invalidate();
    },
    onError: (err) => {
      toast.error("Erro ao guardar configurações: " + err.message);
    },
  });
  const utils = trpc.useUtils();

  const { data: provinces } = trpc.angolaProvinces.list.useQuery();
  const [selectedProvince, setSelectedProvince] = useState<number | null>(null);
  const { data: municipalities } = trpc.angolaMunicipalities.byProvince.useQuery(
    { provinceId: selectedProvince ?? 1 },
    { enabled: selectedProvince !== null },
  );

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    nif: "",
    address: "",
    phone: "",
    email: "",
    professorName: "",
    provinceId: null as number | null,
    municipalityId: null as number | null,
  });

  useEffect(() => {
    if (config) {
      setFormData({
        name: config.name ?? "",
        code: config.code ?? "",
        nif: config.nif ?? "",
        address: config.address ?? "",
        phone: config.phone ?? "",
        email: config.email ?? "",
        professorName: (config as any).professorName ?? "",
        provinceId: config.provinceId ?? null,
        municipalityId: config.municipalityId ?? null,
      });
      setSelectedProvince(config.provinceId ?? null);
    }
  }, [config]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      name: formData.name,
      code: formData.code,
      nif: formData.nif,
      address: formData.address,
      phone: formData.phone,
      email: formData.email,
      professorName: formData.professorName || undefined,
      provinceId: formData.provinceId ?? undefined,
      municipalityId: formData.municipalityId ?? undefined,
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5" />
              Dados da Escola
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Estes dados serão usados como cabeçalho nos documentos (declarações, recibos, etc.)
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="name">Nome da Escola *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Colégio GB - Gestão Escolar"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="nif">NIF</Label>
                  <Input
                    id="nif"
                    value={formData.nif}
                    onChange={(e) => setFormData(prev => ({ ...prev, nif: e.target.value }))}
                    placeholder="Ex: 5412345678"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="code">Código da Escola</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="Ex: GB-001"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="professorName">Professor(a) Responsável</Label>
                  <Input
                    id="professorName"
                    value={formData.professorName}
                    onChange={(e) => setFormData(prev => ({ ...prev, professorName: e.target.value }))}
                    placeholder="Ex: Prof. João Domingos"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Ex: geral@gbgestao.co.ao"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="address">Endereço Completo</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Ex: Rua da Escola, Bairro Talatona, Luanda"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Ex: +244 923 456 789"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="province">Província</Label>
                  <select
                    id="province"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.provinceId ?? ""}
                    onChange={(e) => {
                      const provId = e.target.value ? Number(e.target.value) : null;
                      setSelectedProvince(provId);
                      setFormData(prev => ({ ...prev, provinceId: provId, municipalityId: null }));
                    }}
                  >
                    <option value="">Seleccionar Província...</option>
                    {provinces?.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="municipality">Município</Label>
                  <select
                    id="municipality"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.municipalityId ?? ""}
                    onChange={(e) => {
                      const munId = e.target.value ? Number(e.target.value) : null;
                      setFormData(prev => ({ ...prev, municipalityId: munId }));
                    }}
                    disabled={!selectedProvince}
                  >
                    <option value="">Seleccionar Município...</option>
                    {municipalities?.map((m: any) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" disabled={updateMutation.isPending} className="w-full md:w-auto">
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? "A guardar..." : "Guardar Configurações"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Preview of the document header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Pré-visualização do Cabeçalho
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Como aparecerá nos documentos gerados pelo sistema
            </p>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed rounded-lg p-6 text-center bg-muted/30">
              <div className="text-lg font-bold text-foreground">
                {formData.name || "Nome da Escola"}
              </div>
              {formData.nif && (
                <div className="text-sm text-muted-foreground mt-1">
                  NIF: {formData.nif}
                </div>
              )}
              <div className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-2">
                <MapPin className="h-3 w-3" />
                {formData.address || "Endereço da escola"}
              </div>
              {(formData.provinceId || formData.municipalityId) && (
                <div className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-2">
                  <Building2 className="h-3 w-3" />
                  {provinces?.find((p: any) => p.id === formData.provinceId)?.name ?? ""}
                  {formData.municipalityId && municipalities?.find((m: any) => m.id === formData.municipalityId)?.name ? `, ${municipalities?.find((m: any) => m.id === formData.municipalityId)?.name}` : ""}
                </div>
              )}
              {formData.phone && (
                <div className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-2">
                  <Phone className="h-3 w-3" />
                  {formData.phone}
                </div>
              )}
              {formData.email && (
                <div className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-2">
                  <Mail className="h-3 w-3" />
                  {formData.email}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
