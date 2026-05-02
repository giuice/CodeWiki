# CodeWiki

[English](README.md) | [Português](README.pt-BR.md)

CodeWiki é um framework que transforma um repositório em um sistema de conhecimento persistente, mantido por LLMs, para ferramentas de programação com agentes de IA.

Rode `npx @giuice/codewiki init` uma vez e a CLI cria a estrutura da wiki junto com os assets de integração disponíveis hoje: oito Skills, scripts de hook compartilhados e definições de agentes. Os nomes lógicos das skills permanecem estáveis entre ferramentas (`codewiki-ingest`, `codewiki-query`, `codewiki-lint`, `codewiki-absorb`, `codewiki-breakdown`, `codewiki-prd`, `codewiki-tasks`, `codewiki-process`), enquanto o instalador grava esses arquivos nas árvores canônicas de cada ferramenta:

- Seleções de Claude Code escrevem em `.claude/skills/codewiki-<name>/SKILL.md`
- Seleções de Codex, Copilot e OpenCode escrevem em `.agents/skills/codewiki-<name>/SKILL.md`
- Seleções mistas que incluem Claude Code e alguma ferramenta não-Claude escrevem nas duas árvores

O resultado é uma base de conhecimento cumulativa com decisões, lições, problemas, resumos de fontes e páginas de entidades que sessões futuras podem reutilizar. Cada nova sessão começa com mais contexto que a anterior.

## Como funciona

A regra central:

> O agente propõe; o humano aprova; só conhecimento aprovado entra em `wiki/`.

Os nomes canônicos das skills são `codewiki-*`. Cada ferramenta pode expor essas skills por um seletor, paleta de comandos ou invocação parecida com slash command, mas o artefato instalado é sempre um arquivo `SKILL.md` por workflow lógico.

### Fluxo recomendado

1. Rode `npx @giuice/codewiki init` uma vez por repositório.
2. Coloque material existente em `raw/` e use `codewiki-ingest` até a wiki refletir o estado atual do projeto.
3. Para trabalho novo, use `codewiki-prd` e depois `codewiki-tasks` antes da implementação.
4. Execute o trabalho com `codewiki-process`, para manter tarefas, verificação, commits e propostas de atualização da wiki alinhados.
5. Revise toda proposta produzida pelo fluxo pós-verificação. Nada deve ser escrito em `wiki/` sem aprovação explícita.
6. Ao fim de uma sessão relevante, use `codewiki-absorb` para extrair lições, entidades e problemas duráveis dos diffs recentes.
7. Use `codewiki-breakdown`, `codewiki-lint` e `codewiki-query` como ciclo contínuo de manutenção entre features.

## Arquitetura

CodeWiki tem três camadas:

- `raw/`: documentos-fonte imutáveis, curados por humanos.
- `wiki/`: markdown gerado por LLM e aprovado por humanos, incluindo `index.md`, `log.md`, `_backlinks.json`, entidades, decisões, lições, problemas e resumos de fontes.
- Integração com ferramentas: skills, hooks, agentes e instruções instaladas por `codewiki init`.

Depois de `codewiki init`, cada projeto recebe a estrutura compartilhada:

```text
project-root/
├── .codewiki/
│   ├── config.yml
│   ├── templates/
│   │   ├── entity.md
│   │   ├── decision.md
│   │   ├── lesson.md
│   │   ├── issue.md
│   │   └── source-summary.md
│   └── hooks/
│       ├── pre-wiki-context.sh
│       ├── post-verify.sh
│       └── session-end.sh
├── raw/
├── tasks/
├── wiki/
│   ├── index.md
│   ├── log.md
│   ├── _backlinks.json
│   ├── entities/
│   ├── decisions/
│   ├── lessons/
│   ├── issues/
│   └── sources/
└── arquivos de integração específicos da ferramenta
```

Regras atuais das árvores de skills:

- `--tool claude-code` escreve `.claude/skills/codewiki-<name>/SKILL.md` e os arquivos específicos do Claude.
- `--tool codex`, `--tool copilot` ou `--tool opencode` escreve `.agents/skills/codewiki-<name>/SKILL.md`.
- Seleções mistas como `--tool claude-code,codex` escrevem tanto em `.claude/skills/` quanto em `.agents/skills/`.
- Instalações somente Claude não criam `.agents/skills/`.

## Instalação

### Começo rápido

```bash
npx @giuice/codewiki init --name "Meu Projeto"
```

O comando detecta marcadores locais das ferramentas de IA e instala a wiki junto com os adapters correspondentes. Use `--tool` quando quiser ser explícito:

```bash
npx @giuice/codewiki init --tool claude-code
npx @giuice/codewiki init --tool codex
npx @giuice/codewiki init --tool copilot
npx @giuice/codewiki init --tool opencode
npx @giuice/codewiki init --tool claude-code,codex
```

### A partir do código-fonte

```bash
git clone https://github.com/your-org/codewiki.git
cd codewiki
npm install
npm run build
npm link
codewiki init --name "Meu Projeto"
```

## Começo rápido em um projeto

```bash
# 1. Inicialize o CodeWiki no seu projeto
npx @giuice/codewiki init --name "Meu Projeto" --tool claude-code,codex

# 2. Invoque as skills instaladas pelos nomes canônicos dentro da sua ferramenta de IA
#    codewiki-ingest raw/api-redesign.md
#    codewiki-prd "adicionar política de retry no cliente de API"
#    codewiki-tasks tasks/<arquivo-prd>.md
#    codewiki-process
#    codewiki-absorb
#    codewiki-breakdown
#    codewiki-lint
#    codewiki-query "o que sabemos sobre o middleware de autenticação?"

# 3. Os hooks compartilhados ficam em .codewiki/hooks/
#    Cada adapter mapeia esses scripts para o modelo da ferramenta hospedeira

# 4. Claude, Codex e OpenCode instalam agentes auxiliares:
#    codewiki-wiki-updater
#    codewiki-verifier
```

## Comando da CLI

| Comando | O que faz |
| --- | --- |
| `codewiki init [--tool ...] [--name ...] [--force]` | Cria `.codewiki/`, `raw/`, `tasks/`, `wiki/`, instala as oito Skills nas árvores canônicas, instala os hooks compartilhados e aplica os adapters disponíveis. Reexecutar é seguro; use `--force` para substituir seções gerenciadas pelo CodeWiki. |

Por enquanto, esse é o único comando da CLI. Toda a inteligência restante vive nos arquivos `SKILL.md` instalados e nos scripts compartilhados que a sua ferramenta de IA executa nativamente.

## Skills

CodeWiki inclui um `SKILL.md` por workflow lógico:

| Skill | Objetivo |
| --- | --- |
| `codewiki-ingest` | Ler um documento em `raw/` e propor atualizações na wiki |
| `codewiki-query` | Buscar contexto relevante na wiki e sintetizar uma resposta com citações |
| `codewiki-lint` | Auditar contradições, claims obsoletas, links ausentes e páginas fracas |
| `codewiki-absorb` | Extrair lições, entidades e problemas de mudanças recentes no código |
| `codewiki-breakdown` | Encontrar entidades importantes mencionadas repetidamente, mas ainda sem página |
| `codewiki-prd` | Criar um PRD por meio de perguntas de esclarecimento e salvar em `tasks/` |
| `codewiki-tasks` | Gerar uma decomposição de tarefas a partir de um PRD |
| `codewiki-process` | Executar tarefas uma subtarefa por vez, com verificação e higiene de commit |

## Hooks

Os scripts compartilhados ficam em `.codewiki/hooks/`:

| Hook | Objetivo |
| --- | --- |
| `pre-wiki-context.sh` | Lê `wiki/index.md`, encontra páginas relevantes e injeta contexto para o agente |
| `post-verify.sh` | Emite contexto estruturado de mudanças para o fluxo `wiki-updater` |
| `session-end.sh` | Produz um resumo leve da sessão que pode alimentar um passo de absorb |

Cada adapter mapeia esses scripts para o modelo de integração da ferramenta hospedeira.

## Agentes

Claude Code, Codex e OpenCode instalam dois agentes auxiliares:

| Agente | Objetivo |
| --- | --- |
| `codewiki-wiki-updater` | Lê contexto relevante da wiki e propõe atualizações após mudanças verificadas |
| `codewiki-verifier` | Revisa propostas de wiki contra contradições, qualidade de links e confiança |

## Suporte multi-ferramenta

`codewiki init` detecta marcadores de ferramentas e instala as superfícies correspondentes. Use `--tool` para sobrescrever a detecção, `--name` para definir o nome em `.codewiki/config.yml`, e `--force` para substituir seções gerenciadas pelo CodeWiki preservando conteúdo não relacionado.

| Ferramenta | Skills | Estratégia de hook ou integração | Agentes | Instruções |
| --- | --- | --- | --- | --- |
| **Claude Code** | `.claude/skills/codewiki-<name>/SKILL.md` | `.claude/settings.json` aponta para hooks shell compartilhados | `.claude/agents/` | Acrescenta em `CLAUDE.md` |
| **Codex** | `.agents/skills/codewiki-<name>/SKILL.md` | `.codex/hooks.json` e `.codex/config.toml`; usa `UserPromptSubmit`, `PreToolUse`/`PostToolUse` e wrappers de Stop | `.codex/agents/` | Acrescenta em `AGENTS.md` |
| **Copilot** | `.agents/skills/codewiki-<name>/SKILL.md` | `.github/hooks/codewiki-hooks.json`; usa `preToolUse`, `postToolUse` e `agentStop` | Fluxo via skills compartilhadas | Acrescenta em `.github/copilot-instructions.md` |
| **OpenCode** | `.agents/skills/codewiki-<name>/SKILL.md` | `.opencode/plugins/codewiki.ts` despacha eventos de plugin para hooks compartilhados | `.opencode/agents/` | Acrescenta em `AGENTS.md` |

A wiki em si é independente da ferramenta. O instalador mantém o conteúdo dos prompts portável e muda apenas o local onde as skills são copiadas.

## Desenvolvimento

```bash
npm install
npm run typecheck
npm run build
npm test
```

O pacote compila TypeScript de `src/` para `dist/` e copia os templates durante o build. Os testes combinam cobertura unitária com verificações de integração para comportamento do instalador e assets empacotados.

### Verificação antes de publicar

O pacote publicado exige `node >=20.11.0` e contém JavaScript compilado mais assets de template. As dependências de runtime são intencionalmente zero; TypeScript, Vitest e `@types/node` são apenas de desenvolvimento.

Antes de publicar, valide o candidato local:

```bash
npm run build
npm test
npm pack --dry-run --json
TARBALL="$(npm pack --json | node -e "let s=''; process.stdin.on('data', d => s += d); process.stdin.on('end', () => console.log(require('path').resolve(JSON.parse(s)[0].filename)))")"
SMOKE_DIR="$(mktemp -d)"
(cd "$SMOKE_DIR" && npx --yes --package "$TARBALL" codewiki init --name packed-smoke --tool claude-code,codex,copilot,opencode)
```

Depois da publicação, rode um smoke test contra o registro:

```bash
REGISTRY_SMOKE_DIR="$(mktemp -d)"
(cd "$REGISTRY_SMOKE_DIR" && npx --yes @giuice/codewiki@latest init --name latest-smoke --tool claude-code,codex,copilot,opencode)
```

O teste com tarball local é o bloqueio antes de publicar porque executa exatamente o candidato que será enviado. O teste com `@latest` é pós-publicação porque aponta para o pacote já disponível no npm.

## Não-objetivos atuais

CodeWiki deliberadamente não inclui:

- comandos de CLI além de `init`
- chamadas diretas para APIs de LLM pela CLI
- embeddings ou busca vetorial
- banco de dados, servidor ou interface web
- ingestão não-markdown
- escrita autônoma na wiki sem aprovação humana
- correção semântica autônoma de contradições
- orquestração de workflow de equipe

## Status do projeto

CodeWiki v2 está em desenvolvimento ativo, mas a arquitetura de instalador e o canon de skills já estão em funcionamento.

| Fase | Descrição | Status |
| --- | --- | --- |
| 1 | Clean Slate | ✅ Completa |
| 2 | Infraestrutura Compartilhada | ✅ Completa |
| 3 | Templates de Prompt e Scripts de Hook | ✅ Completa |
| 3.1 | Motor de Autoaperfeiçoamento | ✅ Completa |
| 4 | Adapter Claude Code e reescrita do init | ✅ Completa |
| 4.1 | Migração para Skills e canon de docs | ✅ Completa |
| 5 | Suíte de Testes | ✅ Completa |
| 6 | Adapter OpenCode | ✅ Completa |
| 7 | Adapters Codex e Copilot | ✅ Completa |
| 8 | Hardening de publicação npm | ✅ Completa |
| 9 | Instalação Global para Agentes | ⬜ Planejada |

## Licença

MIT
