# 🛒 Mini Checkout

Uma aplicação de checkout realista desenvolvida em **Node.js** com fluxo de e-commerce intuitivo: catálogo de produtos → carrinho dinâmico → criação automática de pedidos. Implementada com **SQLite** e validações robustas de dados.

**Disciplina:** Qualidade de Software  
**Semestre:** 5º - QUI

---

## 📋 Sumário

- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Como Rodar o Projeto](#-como-rodar-o-projeto)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Fluxo de Compra](#-fluxo-de-compra)
- [API Endpoints](#-api-endpoints)
- [Validações e Tratamentos de Erro](#-validações-e-tratamentos-de-erro)
- [Exemplos de Requisições](#-exemplos-de-requisições)

---

## 🛠 Tecnologias Utilizadas

| Tecnologia    | Versão    | Uso                |
| ------------- | --------- | ------------------ |
| **Node.js**   | v18+      | Runtime JavaScript |
| **Express**   | >= 5.2.1  | Framework web      |
| **SQLite3**   | >= 5.1.6  | Banco de dados     |
| **Jest**      | >= 30.2.0 | Testes unitários   |
| **Supertest** | >= 7.2.2  | Testes HTTP        |
| **Nodemon**   | >= 3.1.11 | Dev reloading      |

---

## 🚀 Como Rodar o Projeto

### 1. Clonar ou acessar o repositório

```bash
cd mini-checkout
```

### 2. Instalar dependências

```bash
npm install
```

Isso irá instalar Express, SQLite3, Jest e outras dependências listadas em `package.json`.

### 3. Iniciar o servidor (modo desenvolvimento)

```bash
npm run dev
```

O servidor será iniciado em `http://localhost:3000`.

- **Nodemon** está configurado para reiniciar automaticamente ao detectar mudanças no código
- **Banco de dados** será criado automaticamente em `src/database/database.sqlite` na primeira execução

### 4. Acessar a aplicação

Abra o navegador e acesse:

```
http://localhost:3000
```

Você verá a interface com:

- **Coluna esquerda:** Área para criar produtos e catálogo de produtos disponíveis
- **Coluna direita:** Carrinho com itens selecionados e histórico de pedidos finalizados

### 5. (Opcional) Executar testes

```bash
npm test
```

---

## 📁 Estrutura do Projeto

```
mini-checkout/
├── public/                          # Front-end estático
│   └── index.html                  # Interface HTML + CSS + JS
├── src/
│   ├── app.js                      # Configuração Express
│   ├── server.js                   # Entrada (inicializa DB e server)
│   ├── database/
│   │   ├── db.js                   # Helpers SQLite (run, get, all, init)
│   │   └── database.sqlite         # Arquivo do banco (criado automaticamente)
│   ├── controllers/
│   │   ├── produtosController.js   # Validação e roteamento de Produtos
│   │   └── pedidosController.js    # Validação e roteamento de Pedidos
│   ├── services/
│   │   ├── produtosService.js      # Lógica de negócio: Produtos
│   │   └── pedidosService.js       # Lógica de negócio: Pedidos
│   ├── routes/
│   │   ├── produtos.routes.js      # Rotas de Produtos
│   │   └── pedidos.routes.js       # Rotas de Pedidos
│   └── middlewares/
│       └── tempoResposta.js        # Middleware de tempo de resposta
├── tests/
│   ├── produtos.test.js            # Testes de Produtos
│   └── pedidos.test.js             # Testes de Pedidos
├── package.json                    # Dependências e scripts
├── .gitignore                      # Arquivos ignorados
└── README.md                       # Este arquivo
```

---

## 🛍 Fluxo de Compra

A aplicação segue um fluxo realista de e-commerce:

1. **Listar Produtos** → Catálogo exibe todos os produtos disponíveis em cards
2. **Adicionar ao Carrinho** → Usuário clica "Adicionar ao Carrinho"; se já existe, incrementa quantidade
3. **Gerenciar Carrinho** → Aumentar/diminuir quantidade, remover itens, visualizar total dinâmico
4. **Finalizar Pedido** → Clica "Finalizar Pedido" → Sistema cria pedido automaticamente
5. **Consultar Pedidos** → Histórico de pedidos finalizados aparece abaixo do carrinho

**Importante:** O sistema gera IDs automaticamente; não há exposição de manipulação de IDs ao usuário.

---

## 🔌 API Endpoints

### Produtos

#### 1. Criar Produto

```http
POST /produtos
Content-Type: application/json

{
  "nome": "Mouse Logitech",
  "preco": 150.00
}
```

**Respostas:**

- ✅ **201 Created** — Produto criado
- ❌ **400 Bad Request** — "Preço não pode ser negativo ou zero"

---

#### 2. Listar Produtos

```http
GET /produtos
```

**Resposta:** ✅ **200 OK**

```json
[
  {
    "id": 1,
    "nome": "Mouse Logitech",
    "preco": 150.0
  }
]
```

---

#### 3. Deletar Produto

```http
DELETE /produtos/:id
```

**Resposta:** ✅ **200 OK** — "Produto deletado com sucesso"

---

### Pedidos

#### 1. Criar Pedido

```http
POST /pedidos
Content-Type: application/json

{
  "itens": [
    {
      "produtoId": 1,
      "quantidade": 2
    }
  ]
}
```

**Respostas:**

- ✅ **201 Created** — Pedido criado com `id`, `status`, `itens`, `total`, `data`
- ❌ **400 Bad Request** — Validações de quantidade, produto, etc.

---

#### 2. Listar Pedidos

```http
GET /pedidos
```

**Resposta:** ✅ **200 OK** — Array de pedidos finalizados com itens, total e data

---

#### 3. Adicionar Item a Pedido (Admin)

```http
POST /pedidos/:id/itens
Content-Type: application/json

{
  "produtoId": 1,
  "quantidade": 1
}
```

---

#### 4. Finalizar Pedido (Admin)

```http
POST /pedidos/:id/finalizar
```

---

#### 5. Deletar Pedido (Admin)

```http
DELETE /pedidos/:id
```

---

## ✅ Validações e Tratamentos de Erro

| Cenário                | Mensagem                                               | Status |
| ---------------------- | ------------------------------------------------------ | ------ |
| Preço negativo ou zero | "Preço não pode ser negativo ou zero"                  | 400    |
| Quantidade ≤ 0         | "Quantidade não pode ser zero ou negativa"             | 400    |
| Produto inexistente    | "Não é possível adicionar item de produto inexistente" | 400    |
| Pedido finalizado      | "Pedido finalizado não pode receber novos itens"       | 400    |
| Nome vazio             | "Nome é obrigatório"                                   | 400    |

**Total do Pedido:** `soma(preço unitário × quantidade)` — calculado com precisão decimal

---

## 📝 Exemplos de Requisições

### Criar Produto

```bash
curl -X POST http://localhost:3000/produtos \
  -H "Content-Type: application/json" \
  -d '{"nome": "Mouse", "preco": 150.00}'
```

### Listar Produtos

```bash
curl http://localhost:3000/produtos
```

### Criar Pedido

```bash
curl -X POST http://localhost:3000/pedidos \
  -H "Content-Type: application/json" \
  -d '{"itens": [{"produtoId": 1, "quantidade": 2}]}'
```

### Listar Pedidos

```bash
curl http://localhost:3000/pedidos
```

---

## 🧹 Limpar o Banco de Dados

Para deletar o banco e iniciar do zero:

```bash
# macOS/Linux
rm src/database/database.sqlite

# Windows
del src\database\database.sqlite
```

Na próxima execução, um novo banco será criado automaticamente.

---

**Desenvolvido com ❤️ para a disciplina de Qualidade de Software**
