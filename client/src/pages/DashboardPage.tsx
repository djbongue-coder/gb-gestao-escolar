import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, BookOpen, CalendarDays, GraduationCap, Receipt, Users, Wallet, Briefcase, Building2, Megaphone } from "lucide-react";

type Stat = {
  label: string;
  value: number;
  icon: typeof Users;
  color: string;
  bg: string;
  format?: "moeda";
};

export default function DashboardPage() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery(undefined as never);

  const cards: Stat[] = [
    { label: "Alunos Matriculados", value: stats?.totalStudents ?? 0, icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "Professores", value: stats?.totalTeachers ?? 0, icon: GraduationCap, color: "text-accent", bg: "bg-accent/10" },
    { label: "Cursos", value: stats?.totalCourses ?? 0, icon: BarChart3, color: "text-success", bg: "bg-success/10" },
    { label: "Turmas Activas", value: stats?.activeClasses ?? 0, icon: Building2, color: "text-warning", bg: "bg-warning/10" },
    { label: "Funcionários", value: stats?.totalEmployees ?? 0, icon: Briefcase, color: "text-accent", bg: "bg-accent/10" },
    { label: "Livros", value: stats?.totalBooks ?? 0, icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
    { label: "Equipamentos", value: stats?.totalAssets ?? 0, icon: CalendarDays, color: "text-accent", bg: "bg-accent/10" },
    { label: "Notificações por Ler", value: stats?.activeNotifications ?? 0, icon: Megaphone, color: "text-danger", bg: "bg-danger/10" },
  ];

  const financeiro: Stat[] = [
    { label: "Receitas", value: Number(stats?.totalRevenue ?? 0), icon: Receipt, color: "text-success", bg: "bg-success/10", format: "moeda" },
    { label: "Facturas Pendentes", value: Number(stats?.totalPending ?? 0), icon: Wallet, color: "text-danger", bg: "bg-danger/10", format: "moeda" },
  ];

  const fmt = (s: Stat) =>
    s.format === "moeda"
      ? new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", maximumFractionDigits: 0 }).format(s.value)
      : String(s.value);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">BI / Dashboards</h1>
          <p className="text-muted-foreground">Indicadores e análise de dados do sistema.</p>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">A carregar indicadores...</CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {cards.map((s) => {
                const Icon = s.icon;
                return (
                  <Card key={s.label}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.bg}`}>
                          <Icon className={`h-5 w-5 ${s.color}`} />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{s.label}</p>
                          <p className="text-2xl font-bold">{fmt(s)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Resumo Financeiro</CardTitle>
                <CardDescription>Valores receipts e facturas em aberto.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {financeiro.map((s) => {
                    const Icon = s.icon;
                    return (
                      <div key={s.label} className="flex items-center gap-3 rounded-lg border p-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.bg}`}>
                          <Icon className={`h-5 w-5 ${s.color}`} />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{s.label}</p>
                          <p className="text-xl font-bold">{fmt(s)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
