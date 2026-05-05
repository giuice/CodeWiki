# CodeWiki Phases e Auditoria de Hooks

## Resumo

Atualizar o workflow para usar **Phases** como unidades principais e **Tasks** como itens executáveis, mantendo compatibilidade com os nomes públicos atuais: `codewiki-tasks`, `codewiki-process`, `.codewiki/tasks/`, `wiki.tasks_path` e arquivos `tasks-*`.

Corrigir a arquitetura de hooks para reduzir ruído e diagnosticar a confiabilidade real por host. Hooks não serão tratados como canal garantido de contexto; eles devem registrar sinal em `.codewiki/state/`, e os workflows devem consumir esse estado explicitamente quando necessário.

## Mudanças de Workflow

- Trocar a semântica do checklist:
  - antigo `parent task` vira `phase`
  - antigo `sub-task` vira `task`
  - `codewiki-process` executa uma task por vez
  - uma phase concluída vira boundary semântica para `codewiki-absorb`
- Manter compatibilidade externa:
  - `codewiki-tasks` continua gerando o arquivo de planejamento
  - `codewiki-process` continua processando o próximo item acionável
  - `.codewiki/tasks/`, `wiki.tasks_path` e `tasks-[prd].md` continuam válidos
- Atualizar o formato documentado:
  - `## Phases`
  - `- [ ] 1.0 Phase Title`
  - `  - [ ] 1.1 Task description`
- Atualizar skills, comandos Claude espelhados, agentes, instruções e docs para remover linguagem contraditória como `parent task`, `sub-task`, `subtask executor` e “one sub-task at a time”.

## Hooks e Estado

- Criar estado persistente leve:
  - `.codewiki/state/pending-absorb.jsonl`
  - registros pequenos com timestamp, host/evento, arquivos afetados quando disponíveis e motivo curto
- Alterar `post-verify.sh`:
  - registrar pendência em arquivo
  - não imprimir `CODEWIKI_CHANGE_CONTEXT` por padrão
- Alterar `session-end.sh`:
  - remover `git diff HEAD~1`
  - usar apenas working tree/cached diff atual quando necessário
  - não imprimir `CODEWIKI_SESSION_SUMMARY` por padrão
- Alterar `pre-wiki-context.sh`:
  - não injetar `wiki/index.md` inteiro em todo prompt
  - emitir contexto curto só quando o prompt indicar wiki, CodeWiki, decisão, arquitetura, histórico, ingest, query, lint ou absorb
- Alterar wrappers:
  - Codex `Stop` retorna `{}` para pendência comum, sem `"decision":"block"`
  - Copilot `agentStop` não bloqueia para empurrar resumo comum
  - OpenCode `session.idle` registra estado, sem injetar resumo longo
  - Claude mantém `session-end.sh` não conectado automaticamente

## Diagnóstico por Host

- Adicionar uma auditoria/mode debug para hooks que registre:
  - se o hook foi chamado
  - se recebeu payload no stdin
  - qual evento/host chamou
  - se produziu stdout
  - se o wrapper transformou stdout em JSON
  - se há evidência observável de contexto entregue ao agente
- Tratar Copilot como não comprovado até validação real:
  - não depender de `additionalContext` para fluxo crítico
  - documentar diferença entre Copilot cloud/VS Code, Copilot CLI e SDK
  - fallback obrigatório: skills/agentes leem `.codewiki/state/`
- Produzir matriz de compatibilidade para Claude Code, Codex, Copilot e OpenCode com eventos suportados, saída processada, riscos e política padrão.

## Documentação

- Atualizar toda documentação pública e interna afetada:
  - `README.md`
  - `README.pt-BR.md`
  - `AGENTS.md`, `CLAUDE.md`, `copilot-instructions.md`
  - `src/templates/*/instructions.md`
  - `src/templates/skills/**/SKILL.md`
  - `src/templates/claude/commands/codewiki/*.md`
  - `docs/`
  - `docs/prompts/`
- A documentação não deve prometer que hooks entregam contexto ao agente sem qualificar por host/runtime.
- A documentação deve explicar que hooks capturam sinal, enquanto absorb acontece por phase concluída ou pedido explícito.

## Testes e Auditoria

- Atualizar testes de contrato:
  - comandos/skills esperam Phase/Task
  - hooks esperam saída silenciosa por padrão
  - `session-end.sh` não contém `HEAD~1`
  - adapters não transformam fim de turno em contexto longo recorrente
  - scaffold continua preservando `.codewiki/tasks/` e `wiki.tasks_path`
- Adicionar testes para `.codewiki/state/pending-absorb.jsonl`.
- Rodar:
  - `npm run test:unit`
  - `npm test`
- Fazer auditoria textual final com `rg` para sobras problemáticas:
  - `parent task`
  - `sub-task`
  - `subtask`
  - `CODEWIKI_SESSION_SUMMARY`
  - `CODEWIKI_CHANGE_CONTEXT`
  - `HEAD~1`
  - promessas absolutas sobre Copilot `additionalContext`

## Assumptions

- Não renomear comandos, diretórios, config keys ou nomes de arquivos nesta fase.
- Absorb automático não será executado por hook.
- Phase concluída significa `N.0` marcado `[x]` depois que todas as tasks `N.x` abaixo dela forem concluídas.
- Hooks devem ser silenciosos por padrão; qualquer saída visível futura será opção configurável.
