# Documento de Qualidade de Software — Mini Checkout

**Aluno:** ___________________________  
**Disciplina:** Qualidade de Software  
**Data:** ___/___/______

---

## Critérios de Qualidade Verificados

### 1. Funcionalidade Correta
**Critério:** Total calculado corretamente em todos os casos (itens simples + cupom percentual + cupom fixo).  
**Como medi:** Testes automáticos `regras.test.js` — bloco "cálculo do total do pedido" (3 casos).  
**Evidência:** `npm test` → todos os testes passam. Ex: 2×R$10 + 3×R$25 = R$95 ✔

---

### 2. Validação de Entrada
**Critério:** Sistema rejeita preço negativo, quantidade ≤ 0, nome vazio e e-mail inválido com HTTP 400.  
**Como medi:** Testes `api.test.js` e `regras.test.js` — blocos de validação + chamadas via Postman/frontend.  
**Evidência:** Todos os casos de entrada inválida retornam `{ "success": false, "error": { "code": "VALIDATION_ERROR" } }`.

---

### 3. Mensagens Claras de Erro
**Critério:** Toda resposta de erro retorna `success: false`, `message` legível e `error.code` padronizado.  
**Como medi:** Inspeção dos retornos da API (Postman/supertest). Middleware `response.js` garante padronização.  
**Evidência:** Erro de produto inexistente → `404 NOT_FOUND`. Pedido finalizado sem itens → `400 BUSINESS_RULE`.

---

### 4. Confiabilidade
**Critério:** Chamadas repetidas não corrompem dados nem "quebram" o sistema.  
**Como medi:** Teste de desempenho em `api.test.js` executa `GET /pedidos` 10× seguidas sem falhas.  
**Evidência:** Loop de 10 chamadas retorna status 200 em todas. Banco SQLite com `WAL mode` e `foreign_keys ON`.

---

### 5. Desempenho
**Critério:** `GET /pedidos` responde em média abaixo de 300ms localmente.  
**Como medi:** Teste automático cronometra 10 execuções e verifica `média < 300ms`. Log de middleware exibe duração.  
**Evidência:** Console mostra tempo de resposta por rota. Média local típica: < 50ms.

---

### 6. Segurança Mínima
**Critério:** API rejeita dados malformados. Middleware de log não vaza senhas ou dados sensíveis.  
**Como medi:** Envio de JSON malformado → Express retorna 400 automaticamente. Log registra apenas campos seguros.  
**Evidência:** `POST /produtos` com body `{ "preco": "abc" }` → retorna erro de validação. Logs na `tblLogs` sem campos críticos.

---

### 7. Usabilidade
**Critério:** Fluxo da tela segue a ordem natural: criar pedido → adicionar itens → aplicar cupom → finalizar.  
**Como medi:** Teste manual no `frontend/index.html`. Botões de ação aparecem apenas quando a ação é válida para o status atual.  
**Evidência:** Pedidos FINALIZADOS e CANCELADOS não exibem botões de ação. Toast de feedback em cada operação.

---

### 8. Manutenibilidade
**Critério:** Código organizado em camadas: Route → Controller → Service → Database.  
**Como medi:** Inspeção estrutural das pastas. Cada responsabilidade em arquivo separado.  
**Evidência:** `src/routes/`, `src/controllers/`, `src/services/`, `src/database/` — nenhuma lógica de negócio nas rotas.

---

### 9. Observabilidade
**Critério:** Cada requisição registrada na `tblLogs` com: rota, método, status code, duração (ms), IP e mensagem de erro.  
**Como medi:** Middleware `logger.js` intercepta toda resposta. Rota `GET /api/v1/logs` expõe os registros.  
**Evidência:** Após qualquer chamada, `GET /logs` exibe entrada completa. Console colorido mostra método + rota + status + duração.

---

### 10. Versionamento de API
**Critério:** Endpoint `/api/v2/pedidos` coexiste com v1 sem quebrar a versão anterior.  
**Como medi:** Testes `api.test.js` — bloco "API v2" verifica estrutura CamelCase e filtro por status.  
**Evidência:** `GET /api/v1/pedidos` e `GET /api/v2/pedidos` funcionam simultaneamente. Erro de status inválido retorna `VALIDATION_ERROR`.

---

## Resumo dos Testes

| Tipo | Quantidade | Ferramenta |
|------|-----------|------------|
| Regras de negócio | 8 | Jest |
| Testes de API | 10+ | Jest + Supertest |
| Teste de desempenho | 1 | Jest (loop 10x) |
| **Total** | **18+** | — |

**Comando para rodar:** `cd backend && npm test`

---

*Todos os critérios foram verificados e os testes passam conforme evidenciado pelos prints anexados.*
