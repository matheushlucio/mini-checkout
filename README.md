# 🛒 Mini Checkout — Trabalho Prático de Qualidade de Software

Sistema de pedidos (mini e-commerce) desenvolvido com **Node.js + Express + SQLite**.

---

## 📁 Estrutura do projeto

```
mini-checkout/
├── backend/
│   ├── src/
│   │   ├── app.js                  # Configuração Express
│   │   ├── server.js               # Ponto de entrada
│   │   ├── database/
│   │   │   └── db.js               # Conexão e schema SQLite
│   │   ├── controllers/
│   │   │   ├── produtoController.js
│   │   │   ├── clienteController.js
│   │   │   ├── pedidoController.js
│   │   │   └── logController.js
│   │   ├── services/
│   │   │   ├── produtoService.js
│   │   │   ├── clienteService.js
│   │   │   ├── pedidoService.js
│   │   │   └── logService.js
│   │   ├── routes/
│   │   │   ├── index.js            # Rotas v1
│   │   │   └── v2.js               # Rotas v2 (versionadas)
│   │   └── middlewares/
│   │       ├── logger.js           # Middleware de log automático
│   │       └── response.js         # Padronização de respostas
│   ├── tests/
│   │   ├── setup.js
│   │   ├── regras.test.js          # Testes de regras de negócio
│   │   └── api.test.js             # Testes de integração da API
│   └── package.json
└── frontend/
    └── index.html                  # Interface web completa
```

---

## 🚀 Como rodar o projeto

### Pré-requisitos
- **Node.js 18+** ([nodejs.org](https://nodejs.org))

### 1. Instalar dependências

```bash
cd backend
npm install
```

### 2. Iniciar o servidor

```bash
npm start
```

O servidor sobe em **http://localhost:3001**

A interface web abre diretamente em **http://localhost:3001**

> Para desenvolvimento com reinício automático:
> ```bash
> npm run dev
> ```

### 3. Rodar os testes

```bash
npm test
```

Para ver cobertura de código:
```bash
npm run test:coverage
```

---

## 📡 Endpoints da API

### Prefixo: `/api/v1` (ou `/api`)

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/produtos` | Cadastrar produto |
| `GET`  | `/produtos?nome=...` | Listar / buscar produtos |
| `POST` | `/clientes` | Cadastrar cliente |
| `GET`  | `/clientes` | Listar clientes |
| `POST` | `/pedidos` | Criar pedido (status: ABERTO) |
| `GET`  | `/pedidos?status=&clienteId=` | Listar pedidos com filtros |
| `POST` | `/pedidos/:id/itens` | Adicionar item ao pedido |
| `POST` | `/pedidos/:id/cupom` | Aplicar cupom de desconto |
| `POST` | `/pedidos/:id/finalizar` | Finalizar pedido |
| `POST` | `/pedidos/:id/cancelar` | Cancelar pedido |
| `GET`  | `/cupons` | Listar cupons disponíveis |
| `GET`  | `/logs` | Listar logs do sistema |

### Prefixo: `/api/v2` (Passo 5 — versionamento)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET`  | `/pedidos?status=ABERTO` | Listagem padronizada com CamelCase |

---

## 📦 Exemplos de uso

### Criar produto
```http
POST /api/v1/produtos
Content-Type: application/json

{ "nome": "Camiseta", "preco": 49.90 }
```

### Criar pedido com cliente e endereço
```http
POST /api/v1/pedidos
Content-Type: application/json

{
  "clienteId": 1,
  "enderecoEntrega": {
    "rua": "Av. Brasil",
    "numero": "100",
    "bairro": "Centro",
    "cidade": "Rondonópolis"
  }
}
```

### Adicionar item
```http
POST /api/v1/pedidos/1/itens
Content-Type: application/json

{ "produtoId": 1, "quantidade": 2 }
```

### Aplicar cupom
```http
POST /api/v1/pedidos/1/cupom
Content-Type: application/json

{ "codigoCupom": "CUPOM10" }
```

### Cupons pré-cadastrados
| Código | Tipo | Valor |
|--------|------|-------|
| `CUPOM10` | Percentual | 10% |
| `DESCONTO20` | Fixo | R$ 20,00 |
| `FRETE15` | Percentual | 15% |

### Exemplo de resposta de sucesso (v2)
```json
{
  "success": true,
  "message": "Pedidos listados com sucesso.",
  "data": [
    {
      "id": 1,
      "status": "FINALIZADO",
      "cliente": { "id": 1, "nome": "João Silva" },
      "subtotal": 100.00,
      "desconto": 10.00,
      "totalFinal": 90.00,
      "enderecoEntrega": {
        "rua": "Av. Brasil",
        "numero": "100",
        "bairro": "Centro",
        "cidade": "Rondonópolis"
      }
    }
  ]
}
```

### Exemplo de resposta de erro
```json
{
  "success": false,
  "message": "Status inválido. Use: ABERTO, FINALIZADO ou CANCELADO.",
  "error": { "code": "VALIDATION_ERROR" }
}
```

---

## ✅ Testes automáticos

O projeto possui **18+ testes automáticos** organizados em:

| Arquivo | Testes |
|---------|--------|
| `regras.test.js` | Cálculo de total, cupons, validações, pedido finalizado/cancelado, histórico de status, clientes |
| `api.test.js` | Criação de produto/pedido, adição de itens, finalização, erros (404, 400), filtros, API v2, desempenho |

---

## 📊 Banco de Dados (SQLite)

Tabelas criadas automaticamente:

| Tabela | Descrição |
|--------|-----------|
| `tblProdutos` | Produtos cadastrados |
| `tblClientes` | Clientes cadastrados |
| `tblCupons` | Cupons de desconto |
| `tblPedidos` | Pedidos com status e endereço |
| `tblItensPedido` | Itens de cada pedido |
| `tblHistoricoStatus` | Histórico de mudanças de status |
| `tblLogs` | Registro automático de todas as requisições |

O arquivo do banco fica em `backend/data/checkout.db` (criado automaticamente).
# mini-checkout
