import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { startLogin } from "@/const";
import { LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

type NavItem = {
  title: string;
  href: string;
  icon?: string;
};

export function useNavItems(): NavItem[] {
  return [
    { title: "Dashboard", href: "/" },
    { title: "Alunos", href: "/alunos" },
    { title: "Cursos", href: "/cursos" },
    { title: "Níveis de Ensino", href: "/niveis-ensino" },
    { title: "Províncias", href: "/provincias" },
    { title: "Municípios", href: "/municipios" },
    { title: "Classes", href: "/classes" },
    { title: "Disciplinas", href: "/disciplinas" },
    { title: "Professores", href: "/professores" },
    { title: "Horários", href: "/horarios" },
    { title: "Ano Lectivo", href: "/ano-lectivo" },
    { title: "Avaliações", href: "/avaliacoes" },
    { title: "Mini-Pautas", href: "/mini-pautas" },
    { title: "Pauta-Geral", href: "/pauta-geral" },
    { title: "Pauta Turma", href: "/pauta-turma" },
    { title: "Atas de Avaliação", href: "/atas" },
    { title: "Resultados Finais", href: "/resultados-finais" },
    { title: "Facturas", href: "/facturas" },
    { title: "Tabela de Preços", href: "/tabela-precos" },
    { title: "Recibos", href: "/recibos" },
    { title: "Funcionários", href: "/funcionarios" },
    { title: "Contratos", href: "/contratos" },
    { title: "Folha Salarial", href: "/folha-salarial" },
    { title: "Férias/Licenças", href: "/ferias-licencas" },
    { title: "Livros", href: "/livros" },
    { title: "Empréstimos", href: "/emprestimos" },
    { title: "Equipamentos", href: "/equipamentos" },
    { title: "Manutenção", href: "/manutencao" },
    { title: "Notificações", href: "/notificacoes" },
    { title: "BI / Dashboards", href: "/bi" },
    { title: "Presenças", href: "/presencas" },
    { title: "Planos de Aula", href: "/planos-aula" },
    { title: "Conteúdos", href: "/conteudos" },
    { title: "Declarações", href: "/declaracoes" },
    { title: "Salas", href: "/salas" },
    { title: "Auditoria", href: "/auditoria" },
    { title: "Configurações", href: "/configuracoes" },
  ];
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const navItems = useNavItems();

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-bold text-foreground">GB-GESTÃO ESCOLAR</h2>
        <p className="text-xs text-muted-foreground">Sistema Integrado de Gestão Escolar</p>
      </div>
      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
              }`}
            >
              {item.title}
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <div className="p-4 border-t border-border">
        {user ? (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={undefined} />
              <AvatarFallback>{user.name?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name ?? "Utilizador"}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email ?? ""}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={() => startLogin()} className="w-full">
            Iniciar Sessão
          </Button>
        )}
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { loading } = useAuth();

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-32 w-64" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r border-border bg-card">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-card shadow-xl">
            <div className="flex items-center justify-end p-2">
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SidebarContent onNavigate={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-2 border-b border-border bg-card px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-sm font-semibold">GB-GESTÃO ESCOLAR</h1>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
