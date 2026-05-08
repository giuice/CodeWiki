# Exploracao: Hooks Normalizados

## Objetivo

Normalizar o comportamento real dos hooks do CodeWiki para que todos os agentes tenham a mesma semantica: hooks como sensores silenciosos, nao como motores de workflow.

## Publico / contexto

Projeto CodeWiki, com suporte a Claude Code, Codex, Copilot local/VS Code/CLI e OpenCode.

O fluxo operacional do README e a fonte da verdade. Quando comportamento de hooks, roteamento de agentes ou responsabilidades das skills mudarem, o fluxo do README e a secao Hooks devem ser atualizados na mesma mudanca.

## Restricoes

- Nao quebrar compatibilidade dos adapters existentes.
- Updater/verifier nao devem ser chamados diretamente por hooks.
- Diferencas entre hosts devem ficar escondidas nos wrappers/adapters.
- O contrato CodeWiki deve ser unico: mesmos efeitos observaveis, mesmo formato de estado, mesma expectativa de silencio.

## Decisoes ja tomadas

- Hooks gravam estado em `.codewiki/state/` e ficam silenciosos por padrao.
- Silencioso significa tambem silencioso na UI: sem `statusMessage` por padrao em hooks frequentes.
- `pre-wiki-context` continua, mas curto, filtrado, configuravel e sem repeticao desnecessaria.
- No Codex, `UserPromptSubmit` e o momento correto para injetar lessons/contexto, mas deve ser controlado: sem `statusMessage`, filtro restrito, cache/dedupe de contexto emitido e possivel opt-in/config.
- No Codex, `statusMessage` em `UserPromptSubmit`, `PreToolUse` e `PostToolUse` e considerado ruido de producao e deve sair do default.
- `PreToolUse` do Codex deve ser reavaliado: se nao bloqueia nada real, provavelmente deve sair do default.
- Pos-edicao grava evento normalizado em `.codewiki/state/pending-absorb.jsonl`.
- `session-end` / `Stop` / `agentStop` ficam ligados por padrao somente se tiverem dedupe/throttle forte.
- Eventos duplicados devem ser deduplicados por host + evento + arquivos + hash/diff resumido.
- Schema minimo do evento: `timestamp`, `host`, `event`, `reason`, `files`, `topic_candidates`, `diff_stat` ou `diff_hash`.
- Skills como `codewiki-process`, `codewiki-absorb` e `codewiki-flow` leem o estado e chamam updater/verifier quando fizer sentido.

## Criterio de sucesso

Ao final da implementacao, Codex, Copilot, Claude Code e OpenCode podem ter eventos diferentes, mas o usuario observa o mesmo comportamento CodeWiki:

- pouco ou nenhum ruido visual no chat;
- sinais duraveis em `.codewiki/state/`;
- sem automacao surpresa por hook;
- sem `statusMessage` de producao em hooks frequentes;
- dedupe/throttle impedindo spam de `pending-absorb.jsonl`;
- documentacao, templates e testes alinhados ao contrato normalizado.

## Observacao sobre Codex

Codex e o caso critico de UX. Mesmo quando stdout esta vazio e os wrappers retornam `{}`, o `statusMessage` aparece no chat e corta visualmente o fluxo. Portanto, a normalizacao precisa tratar `statusMessage` como saida visivel, nao apenas stdout.

Politica desejada para Codex:

- `UserPromptSubmit`: manter como capacidade de contexto/lessons, mas sem `statusMessage` por padrao; usar filtro restrito e cache/dedupe de contexto.
- `PreToolUse`: remover do default se continuar apenas guardrail-only sem bloqueio real.
- `PostToolUse`: manter como sensor principal de mudanca, sem `statusMessage`.
- `Stop`: manter apenas se dedupe/throttle for forte e sem status visivel.
- `CODEWIKI_HOOK_DEBUG=1`: pode habilitar logs/contexto/status visivel para diagnostico.

## Descobertas adicionais

### UserPromptSubmit continua valioso

O hook de inicio de mensagem e o melhor ponto para injetar lessons e contexto curto antes do agente responder. O problema atual nao e o evento em si, mas a combinacao de:

- `statusMessage` visivel em toda mensagem;
- filtro de keywords largo demais;
- contexto repetido dentro da mesma sessao.

### Filtro atual e largo demais

O filtro atual inclui termos genericos de programacao como `source`, `history`, `architecture`, `schema` e `decision`. Esses termos aparecem em muitos prompts sem intencao CodeWiki e podem poluir o contexto.

Filtro desejado: priorizar intencao CodeWiki explicita, por exemplo `codewiki`, `wiki`, `ingest`, `query`, `lint`, `absorb`, `obsidian`, `lesson` e `lessons`.

### Contexto precisa de cache/dedupe

Mesmo quando a intencao e relevante, o hook nao deve injetar o mesmo bloco de contexto repetidamente em uma conversa longa. O plano deve prever algum mecanismo simples para evitar repeticao, por exemplo registrar hash do contexto emitido por sessao/turno em `.codewiki/state/`.

### Bug confirmado: hooks compartilhados ausentes em installs Codex/Copilot-only

`scaffoldProject` cria o diretorio `.codewiki/hooks`, mas nao copia os scripts compartilhados. Hoje quem copia `src/templates/hooks/*.sh` para `.codewiki/hooks/` e o `ClaudeCodeAdapter`.

Consequencia: em instalacoes somente Codex ou somente Copilot, os wrappers especificos podem ser instalados, mas eles apontam para `.codewiki/hooks/pre-wiki-context.sh`, `.codewiki/hooks/post-verify.sh` e `.codewiki/hooks/session-end.sh`, que podem nao existir.

O plano deve corrigir isso para todos os tools, idealmente movendo a copia dos hooks compartilhados para uma etapa comum de scaffold/init ou para um helper compartilhado usado por todos os adapters.

### Copilot: agentes e skills sao superficies diferentes

Pelas docs atuais, `.agents/skills` e valido para skills; custom agents de repositorio do Copilot vivem em `.github/agents`. Portanto, o adapter atual usando `.github/agents/*.agent.md` parece conceitualmente correto, mas o plano deve manter uma verificacao/teste/documentacao clara para nao misturar agents com skills.
