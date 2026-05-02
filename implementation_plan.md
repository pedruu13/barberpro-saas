# Melhorias de Código – Plano de Implementação

## Objetivo
Aplicar as melhorias recomendadas para tornar o código mais robusto, manter‑ável e responsivo, incluindo:
- Refatoração do `schema.prisma` (enums, tipos corretos, índices).
- Limpeza e aprimoramento do middleware de plano.
- Ajustes de responsividade da barra inferior do admin.
- Centralização de breakpoints no CSS.
- Validação de entrada nas rotas admin.
- Logs estruturados com `pino`.
- Atualização do `vercel.json`.
- Inclusão de testes unitários.

## Mudanças Propostas
| Arquivo | Alteração |
|--------|-----------|
| `backend/prisma/schema.prisma` | Criar enums `PlanType`, `PlanStatus`, `AppointmentStatus`, `PaymentMethod`. Trocar campos monetários de `Float` → `Decimal`. Usar `DateTime` para datas/horas. Adicionar índices `@@index([shopId])`. |
| `backend/src/middlewares/planMiddleware.js` | Remover código comentado, validar `req.shop`, usar enums, logs com `pino`, export padrão. |
| `frontend/style.css` | Centralizar breakpoints (`--bp-sm`, `--bp-md`, `--bp-lg`). Expandir media query para `.admin-bnav` até 1024 px. Remover duplicação de seletores e usar `rem`/`vh`. |
| `backend/src/routes/adminRoutes.js` | Envolver handlers com `express-async-handler`. Validar payloads usando `zod`. Responder erros com `res.status(...).json({error: ...})`. |
| `vercel.json` | Remover propriedade `memory` (não usada). Manter apenas `functions`. |
| `backend/src/middlewares/authMiddleware.js` (opcional) | Padronizar mensagens e logs. |
| Tests (`backend/tests/*.test.js`) | Criar testes com `jest` + `supertest` para middleware de plano e uma rota admin. |
| `package.json` | Adicionar dependências: `zod`, `express-async-handler`, `pino`, `jest`, `supertest`. |

## Etapas de Execução
1. **Atualizar `schema.prisma`** e rodar `npx prisma generate`.
2. **Instalar dependências** (`npm i zod express-async-handler pino` e `npm i -D jest supertest`).
3. **Aplicar alterações no middleware** (`planMiddleware.js`).
4. **Refatorar CSS** (`style.css`).
5. **Modificar rotas admin** (`adminRoutes.js`).
6. **Atualizar `vercel.json`.**
7. **Criar arquivos de teste** e configurar script `test` no `package.json`.
8. **Executar lint, testes e build** localmente.
9. **Deploy** com `vercel --prod`.

## Verificação
- `prisma generate` sem erros.
- `npm test` passa 100%.
- Em dispositivos móveis (≤ 1024 px) a barra inferior `.admin-bnav` está visível.
- Deploy no Vercel finaliza sem erros.
