import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import StudentsPage from "./pages/StudentsPage";
import CoursesPage from "./pages/CoursesPage";
import ClassesPage from "./pages/ClassesPage";
import TeachersPage from "./pages/TeachersPage";
import SchedulesPage from "./pages/SchedulesPage";
import AcademicYearsPage from "./pages/AcademicYearsPage";
import EvaluationsPage from "./pages/EvaluationsPage";
import InvoicesPage from "./pages/InvoicesPage";
import ReceiptsPage from "./pages/ReceiptsPage";
import EmployeesPage from "./pages/EmployeesPage";
import ContractsPage from "./pages/ContractsPage";
import PayrollPage from "./pages/PayrollPage";
import LeavesPage from "./pages/LeavesPage";
import BooksPage from "./pages/BooksPage";
import BorrowingsPage from "./pages/BorrowingsPage";
import AssetsPage from "./pages/AssetsPage";
import MaintenancePage from "./pages/MaintenancePage";
import NotificationsPage from "./pages/NotificationsPage";
import DashboardPage from "./pages/DashboardPage";
import AttendancePage from "./pages/AttendancePage";
import LessonPlansPage from "./pages/LessonPlansPage";
import ContentsPage from "./pages/ContentsPage";
import DeclarationsPage from "./pages/DeclarationsPage";
import ClassroomsPage from "./pages/ClassroomsPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import FinalResultsPage from "./pages/FinalResultsPage";
import MiniPautasPage from "./pages/MiniPautasPage";
import PautaGeralPage from "./pages/PautaGeralPage";
import PautaTurmaPage from "./pages/PautaTurmaPage";
import AtasPage from "./pages/AtasPage";
import FeeTablesPage from "./pages/FeeTablesPage";
import SubjectsPage from "./pages/SubjectsPage";
import EducationLevelsPage from "./pages/EducationLevelsPage";
import ProvincesPage from "./pages/ProvincesPage";
import MunicipalitiesPage from "./pages/MunicipalitiesPage";
import SchoolConfigPage from "./pages/SchoolConfigPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/alunos" component={StudentsPage} />
      <Route path="/cursos" component={CoursesPage} />
      <Route path="/niveis-ensino" component={EducationLevelsPage} />
      <Route path="/provincias" component={ProvincesPage} />
      <Route path="/municipios" component={MunicipalitiesPage} />
      <Route path="/configuracoes" component={SchoolConfigPage} />
      <Route path="/classes" component={ClassesPage} />
      <Route path="/professores" component={TeachersPage} />
      <Route path="/disciplinas" component={SubjectsPage} />
      <Route path="/horarios" component={SchedulesPage} />
      <Route path="/ano-lectivo" component={AcademicYearsPage} />
      <Route path="/avaliacoes" component={EvaluationsPage} />
      <Route path="/mini-pautas" component={MiniPautasPage} />
      <Route path="/pauta-geral" component={PautaGeralPage} />
      <Route path="/pauta-turma" component={PautaTurmaPage} />
      <Route path="/atas" component={AtasPage} />
      <Route path="/resultados-finais" component={FinalResultsPage} />
      <Route path="/facturas" component={InvoicesPage} />
      <Route path="/tabela-precos" component={FeeTablesPage} />
      <Route path="/recibos" component={ReceiptsPage} />
      <Route path="/funcionarios" component={EmployeesPage} />
      <Route path="/contratos" component={ContractsPage} />
      <Route path="/folha-salarial" component={PayrollPage} />
      <Route path="/ferias-licencas" component={LeavesPage} />
      <Route path="/livros" component={BooksPage} />
      <Route path="/emprestimos" component={BorrowingsPage} />
      <Route path="/equipamentos" component={AssetsPage} />
      <Route path="/manutencao" component={MaintenancePage} />
      <Route path="/notificacoes" component={NotificationsPage} />
      <Route path="/bi" component={DashboardPage} />
      <Route path="/presencas" component={AttendancePage} />
      <Route path="/planos-aula" component={LessonPlansPage} />
      <Route path="/conteudos" component={ContentsPage} />
      <Route path="/declaracoes" component={DeclarationsPage} />
      <Route path="/salas" component={ClassroomsPage} />
      <Route path="/auditoria" component={AuditLogsPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
