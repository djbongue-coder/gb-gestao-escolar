# GB — Gestão Escolar S.A.

Sistema integrado de gestão escolar para Angola: académico, tesouraria, recursos humanos, biblioteca, património e comunicação.

Escala de classificação **0–20**; aprovação a partir de **10**.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 · Vite 7 · Tailwind CSS 4 · shadcn/ui · TanStack Query · Recharts |
| Backend | Express 4 · tRPC 11 · Zod 4 |
| Base de dados | MySQL 8 (Drizzle ORM + mysql2) |
| Auth | OAuth do Manus (cookie de sessão assinado com `JWT_SECRET`) |
| Testes | Vitest |

---

## Pré-requisitos

- **Node.js ≥ 18**
- **pnpm** — `corepack enable pnpm` (ou `npm i -g pnpm`)
- **MySQL 8** acessível (local ou na nuvem)

> ⚠️ O projecto **depende do OAuth do Manus** para autenticação. Sem `VITE_APP_ID`,
> `VITE_OAUTH_PORTAL_URL` e `OAUTH_SERVER_URL` o botão "Iniciar Sessão" não funciona
> (mostra um aviso explícito). O ambiente de desenvolvimento no Manus já fornece estes valores.

---

## Instalação

```bash
# 1. Dependências
pnpm install

# 2. Variáveis de ambiente
cp .env.example .env
#    editar .env e preencher

# 3. Criar as tabelas na base de dados
pnpm db:push

# 4. Arrancar
pnpm dev          # http://localhost:3000
```

### Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | ✅ | MySQL, ex.: `mysql://USER:PASS@HOST:3306/DB` |
| `JWT_SECRET` | ✅ | Assina o cookie de sessão |
| `VITE_APP_ID` | ✅ | Id da app no Manus (cliente) |
| `VITE_OAUTH_PORTAL_URL` | ✅ | Portal de autenticação (cliente) |
| `OAUTH_SERVER_URL` | ✅ | Validação do token (servidor) |
| `OWNER_OPEN_ID` | ✅ | OpenId do dono → `role = admin` |
| `BUILT_IN_FORGE_API_URL` / `_KEY` | ❌ | Apenas para funções de IA |

---

## Scripts

| Comando | O que faz |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento (Express + Vite) |
| `pnpm build` | Build de produção (`dist/public` + `dist/index.js`) |
| `pnpm start` | Serve o build de produção |
| `pnpm check` | TypeScript (`tsc --noEmit`) |
| `pnpm test` | Testes (Vitest) |
| `pnpm db:push` | Gera e aplica migrações (Drizzle Kit) |
| `pnpm format` | Prettier |

---

## Módulos

**Académico** — Alunos · Cursos · Classes · Disciplinas · Professores · Horários · Ano Lectivo · Avaliações · Conteúdos · Planos de Aula · Mini-Pautas · Pauta-Geral · Pauta por Turma · Atas · Resultados Finais · Declarações

**Configuração** — Níveis de Ensino · Províncias · Municípios · Configurações da Escola · Salas

**Operacional** — Presenças · Notificações · Auditoria

**Financeiro** — Tabela de Preços · Facturas · Recibos

**Pessoas** — Funcionários · Contratos · Folha Salarial · Férias/Licenças

**Património** — Livros · Empréstimos · Equipamentos · Manutenção

---

## Avaliação (RAA 106/26)

Regras implementadas em `shared/raa.ts` — ver também
[PESQUISA_SISTEMA_AVALIACAO_ANGOLA.md](./PESQUISA_SISTEMA_AVALIACAO_ANGOLA.md).

| Sigla | Significado |
|---|---|
| MAC | Média das Avaliações Contínuas |
| NPP | Nota da Prova do Professor |
| NPT | Nota da Prova Trimestral |
| MT | Média do Trimestre |
| MFD | Média Final da Disciplina |
| EXAME | Nota do Exame Nacional |

Classificação: **16–20** Excelente · **14–15** Bom · **10–13** Suficiente · **0–9** Insuficiente

Observações: `TRANSITA` / `NÃO TRANSITA` (classes de transição) e `APTO` / `NÃO APTO`
(6.ª, 9.ª e 12.ª classe). Sem notas registadas → `NÃO AVALIADA`.

---

## Estrutura

```
client/src/
  components/     CrudPage (CRUD genérico), DashboardLayout, ui/ (shadcn)
  pages/          40 páginas — uma por módulo
  lib/trpc.ts     cliente tRPC
server/
  routers.ts      43 routers tRPC
  db.ts           acesso ao MySQL + consultas agregadas
  _core/          infra: OAuth, tRPC, Vite middleware
shared/
  raa.ts          fórmulas e classificações do RAA
drizzle/
  schema.ts       34 tabelas
```

O `CrudPage` evita repetição: cada módulo simples declara um objecto `config` e delega
listar/criar/actualizar/eliminar. Páginas com lógica própria (Mini-Pautas, Atas,
Pauta por Turma, Configurações da Escola) são implementadas à mão.

---

## Notas

- **Módulos do template Manus não usados** — `server/_core/{llm,dataApi,heartbeat,imageGeneration,voiceTranscription}.ts`
  e `client/src/components/{AIChatBox,ManusDialog,Map,DashboardLayoutSkeleton}.tsx` não são
  importados por nada. Foram deixados por serem removíveis com segurança caso se queira
  reduzir o ruído.
- **Sem git** — o projecto não tem controlo de versões. Recomenda-se `git init` antes de
  mais alterações.
