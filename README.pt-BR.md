# CodeWiki

[English](README.md) | [Português](README.pt-BR.md)

CodeWiki é um framework que transforma um repositório em um sistema de conhecimento persistente, mantido por LLMs, para ferramentas de programação com agentes de IA.

Rode `npx @giuice/codewiki init` uma vez e a CLI cria a wiki junto com os assets de integração disponíveis hoje para as ferramentas: dez Skills, scripts de hook compartilhados e definições de agentes. Os nomes lógicos das skills permanecem estáveis entre ferramentas (`codewiki-ingest`, `codewiki-query`, `codewiki-lint`, `codewiki-absorb`, `codewiki-breakdown`, `codewiki-obsidian`, `codewiki-prd`, `codewiki-tasks`, `codewiki-process`, `codewiki-flow`), enquanto o instalador grava esses arquivos nas árvores canônicas de skills:

- Seleções de Claude Code escrevem `.claude/skills/codewiki-<name>/SKILL.md`
- Seleções de Codex, Copilot e OpenCode escrevem `.agents/skills/codewiki-<name>/SKILL.md`
- Seleções mistas que incluem Claude Code e qualquer ferramenta não-Claude escrevem nas duas árvores

O resultado é uma base de conhecimento cumulativa com decisões, lições, problemas, resumos de fontes e páginas de entidades que sessões futuras podem reutilizar. Assim, cada sessão começa mais inteligente que a anterior.

## Como Funciona

A regra central:

> O agente propõe; o humano aprova; só conhecimento aprovado entra em `wiki/`.

Os nomes canônicos das skills são `codewiki-*`. Ferramentas diferentes podem expor essas skills por um seletor de skills, uma paleta de comandos ou uma invocação parecida com slash command, mas o artefato instalado é sempre um arquivo `SKILL.md` por skill lógica.

Use `codewiki-flow` quando quiser que o agente escolha o próximo workflow CodeWiki a partir do estado do repositório em vez de nomear uma skill específica.

### O Fluxo Completo do Desenvolvedor

```mermaid
flowchart TD
  Init["<b>1. SETUP</b><br/>npx @giuice/codewiki init"] --> Feed

  subgraph Feed["<b>2. ALIMENTAR CONHECIMENTO</b>"]
    direction LR
    F1["Colocar docs em wiki/raw/"] --> F2["codewiki-ingest<br/>Propõe resumos de fonte + updates da wiki"]
    F2 --> F3{"Aprovar escritas na wiki?"}
    F3 -- "Sim" --> F4["Escrever páginas da wiki,<br/>index, log, backlinks"]
    F3 -- "Não" --> F5["Manter apenas os docs raw"]
  end

  Feed --> Plan

  subgraph Plan["<b>3. PLANEJAR A MUDANÇA</b>"]
    direction LR
    P1["codewiki-prd<br/>Rascunha o PRD da feature"] --> P2["codewiki-tasks<br/>Gera tarefas-pai + subtarefas"]
  end

  Plan --> Build

  subgraph Build["<b>4. EXECUTAR TAREFAS</b>"]
    direction TB
    B1["codewiki-process<br/>Escolhe uma subtarefa"] --> B2["hook pre-wiki-context<br/>injeta contexto relevante da wiki"]
    B2 --> B3["Agente edita código<br/>e roda verificação"]
    B3 --> B4["hook post-verify emite<br/>CODEWIKI_CHANGE_CONTEXT"]
    B4 --> B5["wiki-updater propõe<br/>lições, entidades, problemas"]
    B5 --> B6{"Aprovar escritas na wiki?"}
    B6 -- "Sim" --> B7["Atualizar páginas da wiki,<br/>backlinks, log"]
    B6 -- "Não" --> B8["Descartar proposta da wiki"]
    B7 --> B1
    B8 --> B1
  end

  Build --> Compound

  subgraph Compound["<b>5. ACUMULAR CONHECIMENTO</b>"]
    direction LR
    C1["resumo session-end<br/>expõe mudanças da sessão"] --> C2["codewiki-absorb<br/>extrai conhecimento durável dos diffs"]
    C2 --> C3["codewiki-breakdown<br/>preenche páginas referenciadas, mas ausentes"]
  end

  Compound --> Maintain

  subgraph Maintain["<b>6. CONSULTAR + MANTER</b>"]
    direction LR
    M1["codewiki-query<br/>responde perguntas a partir da wiki"] --> M2["codewiki-lint<br/>audita contradições, órfãos,<br/>claims obsoletas, páginas inchadas"]
  end

  Maintain -->|"Próxima sessão começa<br/>com contexto melhor"| Feed

  style Init fill:#2d6a4f,color:#fff
  style Feed fill:#1a3a5c,color:#fff
  style Plan fill:#4a2c6a,color:#fff
  style Build fill:#6a3b2d,color:#fff
  style Compound fill:#5a4b1e,color:#fff
  style Maintain fill:#3a5c1a,color:#fff
```

**Passo a passo:**

1. **Setup**: Rode `npx @giuice/codewiki init` uma vez. Ele cria a wiki e instala os assets de integração atualmente disponíveis para o conjunto de ferramentas selecionado.
2. **Alimentar conhecimento**: Coloque documentos existentes em `wiki/raw/` e rode `codewiki-ingest` para digeri-los em páginas da wiki. O agente propõe; você aprova.
3. **Planejar uma feature**: Rode `codewiki-prd` com uma ideia de feature. O agente rascunha o PRD, então `codewiki-tasks` transforma isso em uma decomposição de tarefas.
4. **Construir**: Rode `codewiki-process`. O agente trabalha pelas tarefas uma subtarefa por vez. `pre-wiki-context.sh` injeta contexto relevante da wiki antes das edições, e `post-verify.sh` emite contexto estruturado de mudanças para que o fluxo wiki-updater possa propor atualizações direcionadas na wiki.
5. **Acumular**: Depois de uma sessão de código relevante, use `codewiki-absorb` para extrair lições, atualizações de entidades e problemas a partir dos diffs recentes. Depois rode `codewiki-breakdown` periodicamente para criar páginas importantes ausentes a partir de referências repetidas.
6. **Manter**: Use `codewiki-query` antes de começar trabalhos parecidos, e rode `codewiki-lint` regularmente para encontrar contradições, páginas órfãs, claims obsoletas, artigos inchados e links cruzados ausentes.

### Ordem Operacional Recomendada

1. Rode `npx @giuice/codewiki init` uma vez por repositório.
2. Coloque material-fonte existente em `wiki/raw/` e rode `codewiki-ingest` até a wiki refletir o estado atual do projeto.
3. Para trabalho novo, rode `codewiki-prd` e depois `codewiki-tasks` antes da implementação.
4. Execute o trabalho por `codewiki-process` para que a lista de tarefas, verificação, commits e propostas de wiki via hooks fiquem alinhados.
5. Revise toda proposta de wiki produzida pelo fluxo post-verify. Nada deve ser escrito em `wiki/` sem aprovação explícita.
6. Ao fim de uma sessão substancial, rode `codewiki-absorb` se o resumo da sessão ainda não tiver exposto a proposta correta.
7. Use `codewiki-breakdown`, `codewiki-lint` e `codewiki-query` como o loop contínuo de manutenção entre features.

## Arquitetura

```mermaid
flowchart TB
  subgraph Raw[Camada raw: fonte da verdade curada por humanos]
    R1[wiki/raw/**<br/>PRDs, notas, incidentes, specs]
  end

  subgraph Wiki[Camada wiki: escrita por LLM, aprovada por humanos]
    W1[wiki/index.md - catálogo]
    W2[wiki/log.md - cronologia]
    W8[wiki/_backlinks.json - links reversos]
    W3[wiki/entities/]
    W4[wiki/decisions/]
    W5[wiki/lessons/]
    W6[wiki/issues/]
    W7[wiki/sources/]
  end

  subgraph ToolIntegration[Camada de integração: instalada pelo init]
    H1[Hooks<br/>pre-wiki-context.sh · post-verify.sh · session-end.sh]
    SK[Skills<br/>flow · ingest · query · lint · absorb · breakdown · prd · tasks · process]
    AG[Agents<br/>wiki-updater · verifier]
    SI[Instruções de sistema<br/>CLAUDE.md / AGENTS.md / copilot-instructions.md]
  end

  R1 -->|codewiki-ingest| W7
  W1 -->|contexto pre-hook| ToolIntegration
  ToolIntegration -->|apenas proposta| Review[Revisão humana]
  Review -->|aprovado| Wiki
```

### Layout Gerado no Projeto

Depois de `codewiki init`, cada projeto recebe o scaffold compartilhado da wiki:

```text
project-root/
├── .codewiki/
│   ├── config.yml                    # Configuração do projeto
│   ├── templates/                    # Templates de páginas da wiki
│   │   ├── entity.md
│   │   ├── decision.md
│   │   ├── concept.md
│   │   ├── comparison.md
│   │   ├── lesson.md
│   │   ├── issue.md
│   │   ├── query.md
│   │   └── source-summary.md
│   └── hooks/                        # Scripts de hook compartilhados
│       ├── pre-wiki-context.sh
│       ├── post-verify.sh
│       └── session-end.sh
├── wiki/
│   ├── SCHEMA.md
│   ├── raw/                         # Documentos-fonte imutáveis curados por humanos
│   │   ├── articles/
│   │   ├── papers/
│   │   ├── transcripts/
│   │   ├── specs/
│   │   └── assets/
│   ├── index.md
│   ├── log.md
│   ├── _backlinks.json
│   ├── entities/
│   ├── decisions/
│   ├── concepts/
│   ├── comparisons/
│   ├── lessons/
│   ├── issues/
│   ├── sources/
│   └── queries/
└── (arquivos de integração específicos da ferramenta abaixo)
```

Regras atuais das árvores de skills:

- `--tool claude-code` escreve `.claude/skills/codewiki-<name>/SKILL.md` e os arquivos do adapter exclusivo do Claude.
- `--tool codex`, `--tool copilot` ou `--tool opencode` escreve `.agents/skills/codewiki-<name>/SKILL.md`.
- Seleções mistas como `--tool claude-code,codex` escrevem tanto em `.claude/skills/` quanto em `.agents/skills/`.
- Execuções somente Claude deixam `.agents/skills/` ausente de propósito.

Exemplo de superfície instalada para Claude Code:

```text
.claude/
├── settings.json                     # Wiring de hooks
├── skills/
│   ├── codewiki-ingest/SKILL.md
│   ├── codewiki-query/SKILL.md
│   ├── codewiki-lint/SKILL.md
│   ├── codewiki-absorb/SKILL.md
│   ├── codewiki-breakdown/SKILL.md
│   ├── codewiki-obsidian/SKILL.md
│   ├── codewiki-prd/SKILL.md
│   ├── codewiki-tasks/SKILL.md
│   ├── codewiki-process/SKILL.md
│   └── codewiki-flow/SKILL.md
└── agents/
    ├── codewiki-wiki-updater.md
    └── codewiki-verifier.md
CLAUDE.md                             # Instruções CodeWiki anexadas
```

A superfície compartilhada de skills para ferramentas não-Claude é o mesmo conjunto de dez diretórios sob `.agents/skills/`.

## Instalação

### Começo Rápido

```bash
npx @giuice/codewiki init --name "Meu Projeto"
```

Detecta automaticamente os marcadores locais das suas ferramentas de IA e instala a wiki junto com os adapters correspondentes disponíveis. Use `--tool` quando quiser ser explícito:

```bash
npx @giuice/codewiki init --tool claude-code
npx @giuice/codewiki init --tool codex
npx @giuice/codewiki init --tool copilot
npx @giuice/codewiki init --tool opencode
npx @giuice/codewiki init --tool claude-code,codex
```

### A Partir do Código-Fonte

```bash
git clone https://github.com/your-org/codewiki.git
cd codewiki
npm install
npm run build
npm link
codewiki init --name "Meu Projeto"
```

## Começo Rápido em um Projeto

```bash
# 1. Inicialize CodeWiki no seu projeto
npx @giuice/codewiki init --name "Meu Projeto" --tool claude-code,codex

# 2. Invoque as skills instaladas pelos nomes canônicos dentro da sua ferramenta de IA
#    codewiki-ingest wiki/raw/specs/api-redesign.md
#    codewiki-prd "adicionar política de retry ao cliente de API"
#    codewiki-tasks .codewiki/tasks/<arquivo-prd>.md
#    codewiki-process
#    codewiki-absorb
#    codewiki-breakdown
#    codewiki-lint
#    codewiki-obsidian
#    codewiki-query "o que sabemos sobre auth middleware?"
#    codewiki-flow

# 3. Scripts de hook compartilhados são instalados em .codewiki/hooks/
#    Cada adapter os mapeia para o modelo de hook ou plugin da ferramenta hospedeira

# 4. Claude, Codex, Copilot e OpenCode instalam agentes auxiliares:
#    codewiki-wiki-updater
#    codewiki-verifier
```

## Comando da CLI

| Comando | O que faz |
| --- | --- |
| `codewiki init [--tool ...] [--name ...] [--force]` | Cria `.codewiki/`, `.codewiki/tasks/` e `wiki/`, instala as dez Skills nas árvores canônicas de skills, instala assets de hook compartilhados e aplica os adapters disponíveis. Reexecutar atualiza seções de instrução gerenciadas pelo CodeWiki e assets copiados dos adapters que mudaram, como skills, hooks e agentes, preservando conteúdo de usuário não relacionado. Use `--force` para substituir arquivos protegidos do scaffold. |

Esse é o único comando da CLI. Toda a outra inteligência vive nos arquivos Skill instalados e nos scripts compartilhados que a sua ferramenta de IA executa nativamente.

## Skills

CodeWiki inclui um `SKILL.md` por workflow lógico. A UI de invocação muda por ferramenta, mas os ids instalados das skills são estáveis:

| Skill | Objetivo |
| --- | --- |
| `codewiki-ingest` | Ler um documento-fonte em raw e propor atualizações da wiki (resumo de fonte, entidades, links cruzados) |
| `codewiki-query` | Buscar contexto relevante na wiki e sintetizar uma resposta com citações |
| `codewiki-lint` | Fazer health-check da wiki por contradições, claims obsoletas, links ausentes ou páginas fracas |
| `codewiki-absorb` | Extrair lições, entidades e problemas de mudanças recentes no código para que cada sessão acumule conhecimento |
| `codewiki-breakdown` | Encontrar entidades importantes ainda não documentadas por contagem de backlinks/referências e propor novas páginas |
| `codewiki-obsidian` | Configurar e auditar a wiki como vault compatível com Obsidian, com assets, wikilinks e frontmatter estáveis |
| `codewiki-prd` | Rascunhar um PRD por perguntas de esclarecimento e salvar em `.codewiki/tasks/` |
| `codewiki-tasks` | Gerar uma decomposição de tarefas a partir de um PRD com estrutura de checklist |
| `codewiki-process` | Trabalhar pelas tarefas uma subtarefa por vez, com verificação e higiene limpa de commits |
| `codewiki-flow` | Escolher a skill CodeWiki correta para setup, ingestão, consulta, feature work, follow-up de contexto de mudança, absorção, breakdown e lint |

## Hooks

Scripts shell compartilhados ficam em `.codewiki/hooks/`:

| Hook | Objetivo |
| --- | --- |
| `pre-wiki-context.sh` | Lê `wiki/index.md`, encontra páginas relevantes ao trabalho prestes a acontecer e expõe contexto para o agente |
| `post-verify.sh` | Emite contexto estruturado de mudanças para que a ferramenta possa rodar o fluxo wiki-updater após trabalho verificado |
| `session-end.sh` | Produz um resumo leve da sessão que pode alimentar uma passada de absorb |

Cada adapter mapeia esses scripts compartilhados para o modelo de integração da ferramenta hospedeira.

## Agentes

Claude Code, Codex, Copilot e OpenCode instalam dois agentes auxiliares:

| Agente | Objetivo |
| --- | --- |
| `codewiki-wiki-updater` | Lê o contexto relevante da wiki e propõe atualizações concretas após mudanças verificadas no código |
| `codewiki-verifier` | Revisa propostas de mudanças na wiki quanto a contradições, qualidade de links cruzados e confiança |

## Suporte Multi-Ferramenta

`codewiki init` detecta automaticamente marcadores de ferramentas e instala as superfícies correspondentes disponíveis. Use `--tool` para sobrescrever a detecção, `--name` para definir o nome do projeto em `.codewiki/config.yml`, e `--force` para substituir seções gerenciadas pelo CodeWiki preservando conteúdo de usuário não relacionado.

| Ferramenta | Skills | Estratégia de hook ou integração | Agentes | Instruções |
| --- | --- | --- | --- | --- |
| **Claude Code** | `.claude/skills/codewiki-<name>/SKILL.md` | `.claude/settings.json` conecta hooks shell compartilhados | `.claude/agents/` | Anexa em `CLAUDE.md` |
| **Codex** | `.agents/skills/codewiki-<name>/SKILL.md` | `.codex/hooks.json` mais `.codex/config.toml`; usa `UserPromptSubmit`, `PreToolUse`/`PostToolUse` para eventos de edit/write, e wrappers de Stop | `.codex/agents/` | Anexa em `AGENTS.md` |
| **Copilot** | `.agents/skills/codewiki-<name>/SKILL.md` | `.github/hooks/codewiki-hooks.json`; usa `preToolUse`, `postToolUse` e `agentStop` para acompanhamento pós-turno | `.github/agents/` | Anexa em `.github/copilot-instructions.md` |
| **OpenCode** | `.agents/skills/codewiki-<name>/SKILL.md` | `.opencode/plugins/codewiki.ts` despacha eventos de plugin para hooks compartilhados | `.opencode/agents/` | Anexa em `AGENTS.md` |

Regra das duas árvores:

- Seleções somente Claude escrevem apenas `.claude/skills/`.
- Seleções somente não-Claude escrevem apenas `.agents/skills/`.
- Seleções mistas que incluem Claude Code escrevem nas duas árvores.

A wiki em si é independente de ferramenta. O instalador mantém o conteúdo dos prompts portável e muda apenas onde as skills são copiadas.

## Changelog

### Unreleased

- Adicionada uma estrutura padrão de wiki mais forte: templates de página `concept`, `comparison` e `query` agora são instalados junto com os templates existentes de entidade, decisão, lição, issue e resumo de fonte.
- Expandido o `wiki/SCHEMA.md` com proveniência de fontes raw, checks de drift por `sha256`, campos obrigatórios de qualidade das páginas, taxonomia de tags, thresholds de criação de páginas, política de archive, metadados do index e entradas de log padronizadas.
- Atualizados os workflows de ingest, query, lint, absorb e breakdown para que agentes possam pular fontes sem mudança, expor claims fracas ou contestadas, salvar respostas substanciais de query após aprovação e executar checks mais programáticos de saúde da wiki.
- Atualizados os agentes verifier e wiki-updater para checar frontmatter, drift de tags, confidence, claims contestadas, hashes de fontes, regras de ciclo de vida de páginas e manutenção obrigatória de index/log/backlinks.
- Adicionada cobertura de testes para o scaffold expandido, skills geradas, mirrors de comandos Claude e templates de agentes multi-ferramenta.
- Adicionada `codewiki-flow` como a décima skill do CodeWiki, com roteamento de ciclo de vida entre ingestão, consulta, planejamento, execução de tarefas, absorção da wiki, breakdown, lint e follow-up de contexto de mudança via hook.
- Adicionada `codewiki-obsidian`, com orientação para vault Obsidian sobre `raw/assets/`, wikilinks, frontmatter compatível com Dataview, navegação pelo grafo e migração segura de vaults existentes.
- Alteradas as seções de instruções gerenciadas e os assets copiados dos adapters para serem atualizados em reinstalações sem exigir `--force`, então instalações existentes recebem instruções, skills, hooks e agentes CodeWiki atualizados enquanto arquivos protegidos do scaffold e texto de usuário fora dos marcadores são preservados.

## Desenvolvimento

```bash
npm install
npm run typecheck
npm run build
npm test
```

O pacote compila TypeScript de `src/` para `dist/` e copia assets de template durante o build. Os testes combinam cobertura unitária com verificações de integração compiladas para comportamento do instalador e assets empacotados.

### Verificação de Publicação

O pacote publicado mira `node >=20.11.0` e contém JavaScript compilado mais assets de template empacotados. Dependências de runtime são intencionalmente zero; TypeScript, Vitest e `@types/node` são apenas de desenvolvimento.

Antes de publicar, verifique o candidato local de release:

```bash
npm run build
npm test
npm pack --dry-run --json
TARBALL="$(npm pack --json | node -e "let s=''; process.stdin.on('data', d => s += d); process.stdin.on('end', () => console.log(require('path').resolve(JSON.parse(s)[0].filename)))")"
SMOKE_DIR="$(mktemp -d)"
(cd "$SMOKE_DIR" && npx --yes --package "$TARBALL" codewiki init --name packed-smoke --tool claude-code,codex,copilot,opencode)
```

O smoke com tarball local é o bloqueio pré-publicação porque executa o candidato de pacote que você está prestes a publicar. Depois de publicar, rode o smoke de registry separadamente:

```bash
REGISTRY_SMOKE_DIR="$(mktemp -d)"
(cd "$REGISTRY_SMOKE_DIR" && npx --yes @giuice/codewiki@latest init --name latest-smoke --tool claude-code,codex,copilot,opencode)
```

Esse é um check pós-publicação porque `@giuice/codewiki@latest` aponta para o pacote já publicado no registry, não para a árvore local nem para o candidato de release.

### Troubleshooting de Publicação

Se o smoke com tarball local não encontrar templates, confira se `npm run build` copiou `src/templates/**` para `dist/templates/**`, depois confirme que `npm pack --dry-run --json` lista os arquivos esperados em `dist/templates/...`. Se `npx @giuice/codewiki@latest init` falhar depois da publicação enquanto o tarball local passou, trate isso como problema de registry ou verificação de publicação, não como falha de teste da árvore local.

## Não-Objetivos Atuais

CodeWiki deliberadamente não inclui:

- comandos de CLI de runtime além de `init`
- chamadas diretas de API de LLM pela CLI
- embeddings ou busca vetorial
- banco de dados, servidor ou UI web
- ingestão não-markdown
- escritas autônomas na wiki sem aprovação humana
- correção semântica autônoma de contradições
- orquestração de workflow de equipe

## Status do Projeto

CodeWiki v2 está em desenvolvimento ativo, mas a arquitetura apenas-instalador e o canon de skills já estão em vigor.

| Fase | Descrição | Status |
| --- | --- | --- |
| 1 | Clean Slate | ✅ Completa |
| 2 | Infraestrutura Compartilhada | ✅ Completa |
| 3 | Templates de Prompt e Scripts de Hook | ✅ Completa |
| 3.1 | Motor de Autoaperfeiçoamento | ✅ Completa |
| 4 | Adapter Claude Code mais reescrita do init | ✅ Completa |
| 4.1 | Migração para Skills e refresh do canon de docs | ✅ Completa |
| 5 | Suíte de Testes | ✅ Completa |
| 6 | Adapter OpenCode | ✅ Completa |
| 7 | Adapters Codex e Copilot | ✅ Completa |
| 8 | Hardening de Publicação npm | ✅ Completa |
| 9 | Superfície de Instalação Global para Agentes | ⬜ Planejada |

## Licença

MIT
