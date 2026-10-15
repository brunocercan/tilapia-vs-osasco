# Tilapia vs Osasco

Auto battler 2D web do grupo Tilápia. Escolha 2 dos 5 amigos, monte o time com
equipamentos e sobreviva às 3 fases: **Matão**, **Ruas de Osasco** e **Toca**.
Combate 100% automático — runs de ~5 minutos e ranking online.

## Stack

- TypeScript (strict) + HTML5 Canvas 2D + Vite
- Vitest (testes) + ESLint
- Ranking: Supabase (Fase 6)
- Deploy: GitHub Pages via GitHub Actions (Fase 8)

## Desenvolvimento

```bash
npm install
npm run dev     # servidor de desenvolvimento
npm test        # testes unitários
npm run lint    # lint
npm run build   # typecheck + build de produção
```

## Especificações

- `SPEC-JOGO-COMPLETA.md` — gameplay, personagens, equipamentos, fases, bosses.
- `SPEC-TECNICA.md` — arquitetura, stack, fases de desenvolvimento.

O desenvolvimento segue as fases incrementais da SPEC-TECNICA §29:

| Fase | Conteúdo | Status |
| ---- | -------- | ------ |
| 1 | Vite, TypeScript, Canvas, game loop, tela inicial | ✅ |
| 2 | Personagens, movimentação automática, inimigo, combate | ✅ |
| 3 | XP, níveis, 5 personagens, passivas | ✅ |
| 4 | Equipamentos, slots, tela de recompensa | ✅ |
| 5 | 3 fases, bosses, escalonamento | ✅ |
| 6 | Score, Supabase, ranking | ✅ |
| 7 | Responsividade, áudio (pulado*), efeitos, polimento | ✅ |
| 8 | Testes, GitHub Actions, deploy | ✅ |

\* Áudio é opcional na spec e ficou de fora para manter o projeto sem assets binários.

\* Easter egg extra (pedido fora da spec): boss secreto que aparece aleatoriamente em qualquer tela.

## Publicação (passos manuais)

1. Commit/push para o GitHub (repositório público).
2. GitHub → Settings → Pages → Source: **GitHub Actions**.
3. GitHub → Settings → Secrets and variables → Actions → Variables:
   `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. Banco: siga `SETUP-SUPABASE.md` (rodar `supabase/schema.sql`).

URL esperada: `https://SEU-USUARIO.github.io/tilapia-vs-osasco/`
