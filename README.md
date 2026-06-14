# 🍽️ Sabor Digital

Sistema de **gestão de cardápio e pedidos** para restaurantes, construído como uma
arquitetura de **microsserviços** com **Arquitetura Limpa**, aplicando **SOLID**,
**Design Patterns**, **TDD** e **BDD**, empacotado com **Docker Compose** e publicado
em servidor.

> **Aluno:** Daniel Alvarez Gonçalves
> **Disciplina:** Arquitetura de Software — Universidade de Vassouras (Campus Maricá)
> **Aplicação publicada:** [Link do Sabor Digital](https://p2-arquitetura-de-software-sabor-digital.n5ywgm.easypanel.host/)

---

## 1. Problema e proposta de solução

Restaurantes de pequeno e médio porte costumam controlar o cardápio e os pedidos em
papel ou planilhas, o que gera erros de preço, dificuldade para aplicar promoções e
nenhuma visão consolidada do faturamento. O **Sabor Digital** resolve isso com um
sistema simples em que a equipe:

- cadastra, **edita** e **exclui** os **pratos do cardápio**, ligando/desligando a disponibilidade;
- registra **pedidos**, aplicando **políticas de desconto** de forma consistente, acompanha o
  **status** na cozinha e **exclui** pedidos encerrados do histórico;
- gerencia **reservas de mesa** (agendamento, confirmação, conclusão e cancelamento);
- acompanha um **painel** com total de pratos, pedidos, faturamento e reservas.

A solução foi desenhada para **continuar de pé mesmo com partes da infraestrutura fora
do ar**: se o banco de um serviço cai, o usuário vê uma mensagem amigável e o restante
do sistema continua funcionando (ver [§8 Resiliência](#8-resiliência-a-falhas)).

## 2. Visão de arquitetura (microsserviços)

```
                          ┌─────────────────────┐
        Navegador  ─────► │   web (nginx + SPA) │   entrada pública
                          └──────────┬──────────┘
                                     │ /api/*
                          ┌──────────▼──────────┐
                          │      gateway        │  roteamento + agregação
                          │  (Circuit Breaker)  │  + resiliência
                          └──┬───────┬───────┬──┘
                     /dishes │  /orders│       │ /reservations
                  ┌──────────▼─┐ ┌─────▼──────┐ ┌▼──────────────────┐
                  │menu-service│ │orders-svc  │ │reservations-service│  microsserviços
                  │ (cardápio) │ │ (pedidos)  │ │    (reservas)      │  autônomos
                  └─────┬──────┘ └─────┬──────┘ └─────────┬─────────┘
                        │              │                  │
                   ┌────▼───┐     ┌────▼─────┐     ┌──────▼────────┐
                   │ menu-db│     │ orders-db│     │reservations-db│  um banco por serviço
                   │Postgres│     │ Postgres │     │   Postgres    │
                   └────────┘     └──────────┘     └───────────────┘
```

| Serviço | Responsabilidade | Stack | Porta | Banco |
|---|---|---|---|---|
| `web` | Interface do usuário (SPA) e proxy `/api` | nginx | 80 | — |
| `gateway` | Roteia para os serviços, agrega o painel, aplica Circuit Breaker | Node + Express | 8080 | — |
| `menu-service` | CRUD de pratos do cardápio (criar, editar, excluir, disponibilidade) | Node + TypeScript | 3001 | `menu-db` |
| `orders-service` | Registro de pedidos, status, descontos e exclusão | Node + TypeScript | 3002 | `orders-db` |
| `reservations-service` | Reservas de mesa (agendamento, status, exclusão) | Node + TypeScript | 3003 | `reservations-db` |

Cada microsserviço é **autônomo**: tem seu próprio banco de dados e não acessa o banco
do outro (princípio _database per service_). A comunicação acontece apenas pela borda
(gateway), o que mantém o baixo acoplamento.

## 3. Arquitetura Limpa (camadas)

Cada serviço segue a mesma divisão em camadas, com a **regra de dependência apontando
para dentro** (camadas externas dependem das internas, nunca o contrário):

```
src/
├── domain/          ← Entidades e regras de negócio (núcleo, sem framework)
│   ├── entities/        Dish, Order, OrderItem, Reservation
│   ├── discounts/       Estratégias de desconto (orders)
│   ├── repositories/    Portas (interfaces) de persistência
│   └── errors/          Erros de domínio
├── application/     ← Casos de uso (orquestram o domínio)
│   └── use-cases/       CreateDish, UpdateDish, DeleteDish, PlaceOrder, CreateReservation…
├── infrastructure/  ← Detalhes: Postgres, configuração, fábricas
│   ├── repositories/    Implementações (Pg + InMemory)
│   ├── database/        Pool, schema, tradução de erros
│   └── RepositoryFactory
└── presentation/    ← Adaptadores HTTP (controllers, rotas, middlewares)
    └── http/
```

O `domain` não importa nada de `infrastructure` nem de `express`/`pg`. Quem conhece as
implementações concretas é apenas o **Composition Root** (`src/main/`), que monta o
grafo de dependências.

📄 Detalhes em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md).

## 4. Princípios SOLID

| Princípio | Onde aparece |
|---|---|
| **S**RP | Cada caso de uso faz uma coisa; controllers só adaptam HTTP; entidades só guardam regra. |
| **O**CP | Novas políticas de desconto entram implementando `DiscountStrategy`, sem alterar `Order` nem o caso de uso. |
| **L**SP | `PgDishRepository` e `InMemoryDishRepository` são intercambiáveis pela porta `DishRepository`. |
| **I**SP | Interfaces pequenas e específicas (`DishRepository`, `OrderRepository`, `DiscountStrategy`). |
| **D**IP | Casos de uso dependem de abstrações; as implementações são injetadas no Composition Root. |

📄 Detalhes com referências de arquivo em [`docs/SOLID-E-PADROES.md`](docs/SOLID-E-PADROES.md).

## 5. Design Patterns (4+)

1. **Repository** — `domain/repositories/*` (portas) + `infrastructure/repositories/*` (Pg/InMemory).
2. **Strategy** — `domain/discounts/*` (políticas de desconto intercambiáveis).
3. **Factory** — `DiscountStrategyFactory` e `RepositoryFactory` decidem a implementação concreta.
4. **Circuit Breaker** — `gateway/src/infra/CircuitBreaker.ts` (resiliência a serviços fora do ar).
5. **Adapter** — `gateway/src/infra/HttpServiceClient.ts` (encapsula `fetch` + timeout + breaker).
6. **Dependency Injection (Composition Root)** — `src/main/compositionRoot.ts` em cada serviço.

## 6. Clean Code

- Nomes que revelam intenção (`PlaceOrder`, `DiscountStrategy`, `isConnectionError`).
- Funções curtas e com responsabilidade única.
- Erros de domínio explícitos em vez de retornos mágicos.
- Dinheiro tratado **em centavos (inteiros)**, evitando erros de ponto flutuante.
- Sem números mágicos espalhados; configuração via variáveis de ambiente (12-factor).
- Camadas isoladas, com dependências apontando só para dentro.

## 7. Testes (TDD e BDD)

- **TDD / testes unitários** — `Jest` em cada serviço, cobrindo entidades, casos de uso,
  estratégias de desconto e o Circuit Breaker, **sem precisar de banco** (usam repositório
  em memória).
- **BDD** — `Cucumber.js` com cenários em **português (Gherkin)** descrevendo o
  comportamento esperado do cardápio, dos pedidos e das reservas.

```bash
# em services/menu-service, services/orders-service, services/reservations-service e gateway:
npm install
npm test          # testes unitários (TDD)
npm run test:bdd  # cenários de comportamento (BDD) — onde houver
```

📄 Detalhes em [`docs/TESTES.md`](docs/TESTES.md).

## 8. Resiliência a falhas

Requisito central: **o sistema continua de pé mesmo com um banco fora do ar**, e o
usuário **nunca vê erro técnico**.

- Cada serviço sobe **mesmo sem o banco** (migração roda em segundo plano, com novas
  tentativas) e mantém tempos-limite curtos nas consultas.
- Falha de conexão é traduzida em **HTTP 503 com mensagem amigável** (sem stack trace).
- O **gateway** usa **Circuit Breaker**: se um serviço para de responder, ele falha
  rápido e devolve uma mensagem amigável, em vez de travar a tela.
- O **painel** tem **degradação parcial**: se o cardápio cair, os blocos de pedidos e
  reservas continuam aparecendo, e assim por diante para cada serviço.

**Como demonstrar** (com o sistema rodando):

```bash
docker compose stop menu-db     # derruba o banco do cardápio
# A aba "Cardápio" mostra um aviso amigável; "Pedidos" continua funcionando.
docker compose start menu-db    # o cardápio volta sozinho
```

## 9. Como executar

### Com Docker (recomendado)

```bash
cp .env.example .env
docker compose up --build
# Acesse: http://localhost:8080
```

### Sem Docker (desenvolvimento)

Cada serviço é um projeto Node independente:

```bash
cd services/menu-service && npm install && npm run dev          # porta 3001
cd services/orders-service && npm install && npm run dev        # porta 3002
cd services/reservations-service && npm install && npm run dev  # porta 3003
cd gateway && npm install && npm run dev                        # porta 8080
```

## 10. Deploy

Publicado via **Docker Compose** em servidor (EasyPanel). O frontend (`web`) é a entrada
pública, exposto por domínio; o gateway e os serviços ficam na rede interna, e cada banco
roda em seu próprio contêiner. O link da aplicação no ar está no topo deste README.

## 11. Mapa de critérios da avaliação

| Critério | Onde está |
|---|---|
| Descrição do problema e proposta | §1 |
| Clean Code | §6 + código comentado |
| SOLID | §4 + `docs/SOLID-E-PADROES.md` |
| Design Patterns | §5 + `docs/SOLID-E-PADROES.md` |
| Arquitetura Limpa | §3 + `docs/ARQUITETURA.md` |
| Microsserviços | §2 |
| TDD / testes unitários | §7 + pasta `tests/unit` |
| BDD | §7 + pasta `tests/bdd` |
| Docker / Docker Compose | §9 + `docker-compose.yml` |
| Deploy ativo | §10 + link no topo |
| Justificativas técnicas | `docs/ARQUITETURA.md` |

## Licença

MIT.
