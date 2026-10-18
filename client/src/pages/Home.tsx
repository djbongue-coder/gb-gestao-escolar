import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { BookOpen, GraduationCap, Users } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: stats } = trpc.dashboard.stats.useQuery(undefined as never, { enabled: !!user });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">A carregar...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">GB-GESTÃO ESCOLAR S.A.</CardTitle>
            <CardDescription>Sistema Integrado de Gestão Escolar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Plataforma completa para gestão académica, tesouraria, recursos humanos,
              biblioteca, património e comunicação escolar.
            </p>
            <Button onClick={() => startLogin()} className="w-full" size="lg">
              <Users className="mr-2 h-4 w-4" />
              Iniciar Sessão
            </Button>
            <div className="grid grid-cols-3 gap-2 pt-4">
              <div className="flex flex-col items-center text-center">
                <BookOpen className="h-6 w-6 text-primary mb-1" />
                <span className="text-xs text-muted-foreground">Académico</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <Users className="h-6 w-6 text-accent mb-1" />
                <span className="text-xs text-muted-foreground">RH & Tesouraria</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <GraduationCap className="h-6 w-6 text-success mb-1" />
                <span className="text-xs text-muted-foreground">Biblioteca</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Bem-vindo, {user.name ?? "Utilizador"}</h1>
          <p className="text-muted-foreground">Painel principal do sistema de gestão escolar.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Alunos</p>
                  <p className="text-2xl font-bold">{stats?.totalStudents ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-8 w-8 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Professores</p>
                  <p className="text-2xl font-bold">{stats?.totalTeachers ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Livros</p>
                  <p className="text-2xl font-bold">{stats?.totalBooks ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-warning" />
                <div>
                  <p className="text-sm text-muted-foreground">Funcionários</p>
                  <p className="text-2xl font-bold">{stats?.totalEmployees ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Sistema</CardTitle>
            <CardDescription>Vista geral dos principais indicadores.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Utilize a navegação lateral para aceder a todos os módulos do sistema.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
