# Project TODO - GB-GESTÃO ESCOLAR S.A.

## Base de Dados
- [x] Schema completo com todas as 34 tabelas dos 14 módulos
- [x] Migração SQL gerada e aplicada

## Backend (tRPC)
- [x] Procedimentos CRUD para todos os módulos
- [x] Dashboard stats query
- [x] Autenticação e autorização (adminProcedure, protectedProcedure)

## Frontend
- [x] Tema, cores, tipografia (index.css)
- [x] Layout DashboardLayout com sidebar de navegação
- [x] Página Home / Login
- [x] Componente CrudPage reutilizável
- [x] 28 páginas de gestão

## Pendente
- [x] Verificar dev server sem erros
- [x] Salvar checkpoint
- [x] Entregar ao utilizador

## Bug Fix
- [x] Erro ao aceder a um item/módulo - corrigido (options.map is not a function, causado por options como string em vez de array)

## Sistema de Ensino Angola (MED)
- [x] Pesquisar estrutura do sistema de ensino angolano (níveis, ciclos, disciplinas)
- [x] Pesquisar províncias e municípios de Angola
- [x] Preencher tabela de províncias (18 províncias)
- [x] Preencher tabela de municípios (164 municípios)
- [x] Actualizar níveis de ensino (Pré-escolar, Primário, Secundário 1º e 2º Ciclo)
- [x] Actualizar disciplinas por nível de ensino
- [x] Actualizar frontend para reflectir a estrutura angolana
- [x] Corrigir require() is not defined em db.ts
- [x] Corrigir coluna Activo (Sim/Não) em Níveis de Ensino
- [x] Corrigir coluna Província (nome) em Municípios
- [x] Adicionar render function ao CrudPage

## Módulo Configurações da Escola
- [x] Verificar/criar tabela school_config com nome, NIF, endereço, província, município
- [x] Adicionar helpers e procedures tRPC para schoolConfig
- [x] Criar página de Configurações da Escola no frontend
- [x] Adicionar rota e menu para Configurações
- [x] Testar e salvar checkpoint

## Declarações com Cabeçalho da Escola
- [x] Investigar página de Declarações e estrutura existente
- [x] Actualizar backend/procedures para incluir dados da escola (declarations.byId com schoolConfig)
- [x] Criar página de Declarações com cabeçalho da escola e geração de PDF (botão Imprimir/Visualizar)
- [x] Corrigir colunas faltantes na tabela students (enrolledCourseId, enrollmentDate, enrollmentYear, academicYearId)
- [x] Testar e salvar checkpoint

## Mini-Pautas e Pauta-Geral (Sistema de Avaliação Angolano)
- [x] Criar tabelas mini_pautas e pautas_gerais no schema
- [x] Adicionar routers tRPC para miniPautas e pautasGerais
- [x] Criar página MiniPautasPage com colunas MAC|NPP|NPT|MT1|MFD|EXAME|MFD e observações
- [x] Criar página PautaGeralPage com colunas MDF|MF e observações
- [x] Observações calculadas automaticamente: MFD>=10 → APTO/TRANSITA, MFD<10 → NÃO APTO/NÃO TRANSITA, sem notas → NÃO AVALIADA
- [x] Adicionar rotas e menu para Mini-Pautas e Pauta-Geral
- [x] Testar e salvar checkpoint

## Pauta Completa por Turma (Geração Automática)
- [x] Backend: endpoint GET completo por turma (alunos x disciplinas x notas de mini_pautas/pautas_gerais)
- [x] Backend: endpoint para gerar/inicializar pauta completa (upsert de linhas para todos os alunos x disciplinas)
- [x] Frontend: nova página PautaTurma com selector de turma e tabela completa alunos x disciplinas
- [x] Frontend: impressão com cabeçalho (PAUTA DE AVALIAÇÃO) e botão Imprimir
- [x] Adicionar rota e menu
- [x] Testar e salvar checkpoint

## Exportação Excel da Pauta Turma
- [x] Instalar biblioteca xlsx (SheetJS)
- [x] Adicionar botão "Exportar Excel" na página Pauta Turma
- [x] Implementar lógica de exportação com dados formatados (cabeçalho, notas, observações)
- [x] Testar e salvar checkpoint

## Integração RAA 106/26 (Sistema de Avaliação Angolano)
- [x] Analisar schema actual das mini_pautas e pautas_gerais
- [x] Adicionar campos de classificação qualificativa (Excelente/Bom/Suficiente/Insuficiente)
- [x] Implementar fórmulas automáticas: MT1-MT3=(MAC+NPT)/2, MFD=(MT1+MT2+MT3)/3, MFD Final=(MFD+EXAME)/2
- [x] Adicionar escala qualitativa (Excelente 16-20, Bom 14-15, Suficiente 10-13, Insuficiente 0-9)
- [x] Melhorar Mini-Pautas com 3 trimestres visíveis (colunas MT1, MT2, MT3)
- [x] Melhorar Pauta-Geral com MDF e MF calculados automaticamente
- [x] Actualizar Pauta Turma com MF global (média de todas as disciplinas)
- [x] Testar e salvar checkpoint

## Sistema de Cores na Pauta
- [x] Mini-Pautas: linha com cor de fundo (verde=APTO, vermelho=NÃO APTO, cinza=NÃO AVALIADA) e badges fortes
- [x] Pauta-Geral: linha com cor de fundo (verde=TRANSITA, vermelho=NÃO TRANSITA) e MF colorido
- [x] Pauta Turma: linha com cor de fundo baseada no MF Global e badges sólidos (verde/vermelho)
- [x] Destaque nas células MFD Final/MF com cor baseada na nota (esmeralda>=16, azul>=14, verde>=10, vermelho<10)
- [x] Testar e salvar checkpoint

## Boletim Individual PDF e Export Pauta-Geral Excel
- [x] Instalar jspdf e jspdf-autotable para geração de PDF no browser
- [x] Criar componente BoletimPDF com cabeçalho da escola, dados do aluno, todas as disciplinas, notas, classificação qualitativa, observação e cores
- [x] Adicionar botão "Boletim PDF" na página Mini-Pautas (por aluno seleccionado)
- [x] Adicionar botão "Exportar Excel" na página Pauta-Geral com mesma estrutura da Pauta Turma
- [x] Testar e salvar checkpoint

## Mini-Pauta Moderna (baseada no Excel de referência)
- [x] Mini-Pauta: adicionar painel "Perfil de Aproveitamento Académico" (10 métricas: matriculados, sem avaliação, reprovados por faltas, anulações, transferidos, avaliados, positivas, negativas, %+, %-)
- [x] Mini-Pauta: cabeçalho oficial (REPÚBLICA DE ANGOLA / MINISTÉRIO DA EDUCAÇÃO / escola-NIF-município) + título MINI-PAUTA DE APROVEITAMENTO ACADÉMICO
- [x] Mini-Pauta: bloco de identificação Classe/Turma/Ano Lectivo/Período/Disciplina/Professor/Coordenador/Director Pedagógico
- [x] Mini-Pauta: tabela de alunos com sub-colunas por trimestre (MAC|NPP|MT) e colunas finais MFD|Exame|MFD Final|Qualit.|Observação, estilo moderno
- [x] Mini-Pauta: actualizar geração de PDF com a nova estrutura (PDF de turma A4 horizontal + boletim individual)
- [x] Mini-Pauta: exportação Excel actualizada com a nova estrutura (mantida no Pauta Turma e Pauta-Geral)
- [x] Mini-Pauta: testes vitest para shared/minipauta e checkpoint

## Mini-Pauta estrutura completa (modelo 12ª1.xlsm)
- [x] Ecrã: bloco de identificação completo (Classe, Período, Turma, Ano Lectivo, Disciplina, Prof(a)) + título MINI-PAUTA
- [x] Ecrã: tabela com coluna Gênero, trimestres MAC|NPP|MT e colunas finais MFD|EXAME|MFD F.|CLASSIFICAÇÃO (coluna única mesclada)
- [x] PDF turma: replicar estrutura completa do modelo (identificação + tabela com gênero e classificação única)
- [x] Boletim individual: coluna gênero + classificação única
- [x] Excel export: replicar estrutura completa do modelo (cabeçalho oficial + identificação + tabela)
- [x] Testes vitest e checkpoint (checkpoint 8e0e5d54, testes 9/9 a passar)

## Módulo de Atas de Avaliação Oficial
- [x] Tabela atas na BD: turma, periodo (trimestre/época/final), data, numero, observações, assinaturas (director, conselho)
- [x] Rotas tRPC (list/get/create/update/delete + resumo automático) para atas
- [x] Página AtasPage com lista, formulário e selecção de turma/período
- [x] Geração de PDF da ata oficial com cabeçalho (República de Angola/MED/escola), corpo (identificação/agenda/deliberações), tabela resumo de resultados por disciplina, espaços de assinatura (Director Pedagógico, Professor Coordenador, Conselho de Turma)
- [x] Botão de impressão/PDF e integração no menu lateral
- [x] Testes vitest (10/10) e checkpoint

## Sistema de Estados da Ata (Rascunho/Aprovada)
- [x] BD: colunas status (rascunho/aprovada), approvedAt, approvedBy, approvedByUserId na tabela atas (migração 0003 aplicada)
- [x] Backend: rotas tRPC approve/unapprove (validação digital com director aprovado e data/hora)
- [x] AtasPage: coluna Estado com badges coloridos (Rascunho âmbar/Aprovada verde), acções "Aprovar"/"Reabrir (Rascunho)"
- [x] PDF da ata: carimbo "ATA APROVADA DIGITALMENTE" com director validador + data/hora quando aprovada
- [x] Testes vitest (10/10), TS OK e checkpoint

## Revisão e Correcções (2026-10-18)
- [x] Corrigir crash em /bi — `getRouter("dashboard")` devolvia `undefined` (DashboardPage usava CrudPage com router inexistente)
- [x] Substituir DashboardPage por indicadores reais de `dashboard.stats` (8 cartões + resumo financeiro)
- [x] Home deixou de mostrar 0 fixos (Alunos/Professores/Livros/Funcionários passam a ler `dashboard.stats`)
- [x] Login deixa de falhar em silêncio — aviso explícito quando faltam VITE_OAUTH_PORTAL_URL / VITE_APP_ID
- [x] Criar `.env.example` com as 6 variáveis obrigatórias (não existia documentação de setup)
- [x] Criar `README.md` com stack, instalação, scripts, módulos e estrutura (não existia)
- [x] `vitest.config.ts`: `testTimeout`/`hookTimeout` a 30s — atas.status.test.ts (~4,4s) falhava por flakiness
- [x] Remover `ComponentShowcase.tsx` — página morta, sem rota, usava `trpc.ai` inexistente
- [x] Remover secção duplicada "Sistema de Ensino Angola (MED)" neste ficheiro

### Verificações
- [x] `pnpm check` sem erros · `pnpm test` 13/13 · `pnpm build` OK
- [x] Todas as 40 páginas com router existente no backend; menu e rotas coerentes

### Pendente
- [x] `git init` + primeiro commit (6a07f76)
- [x] Remote GitHub configurado — `git@github.com:djbongue-coder/gb-gestao-escolar.git` (SSH, via chave `~/.ssh/id_ed25519_github`)
- [ ] Testar com dados reais no ambiente Manus (local não tem MySQL nem OAuth)
- [ ] Opcional: remover módulos do template Manus sem uso (llm, dataApi, heartbeat, imageGeneration, voiceTranscription, AIChatBox, ManusDialog, Map)
