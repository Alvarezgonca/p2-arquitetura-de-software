# Arquitetura — Sabor Digital

## 1. Estilo arquitetural

A solução combina dois estilos complementares:

- **Microsserviços** na visão de sistema: serviços pequenos, autônomos, cada um com
  seu banco de dados e seu ciclo de vida.
- **Arquitetura Limpa (Clean Architecture)** dentro de cada serviço: o código é
  dividido em camadas concêntricas, com a regra de dependência apontando para o centro.

## 2. Por que microsserviços aqui?

O domínio tem três contextos bem separados: **cardápio**, **pedidos** e **reservas de
mesa**. Eles mudam por razões diferentes e têm volumes diferentes (o cardápio é quase
estático; pedidos e reservas crescem o tempo todo, com regras próprias). Separá-los
permite:

- evoluir e escalar cada parte de forma independente;
- isolar falhas — se o banco de pedidos cai, o cardápio continua disponível;
- manter bancos independentes (_database per service_), sem acoplamento por dados.

O **gateway** centraliza a borda: o navegador conversa apenas com ele (via `/api`), o
que simplifica CORS, autenticação futura e a aplicação de políticas de resiliência.

## 3. Fluxo de uma requisição

`POST /api/orders` (registrar pedido):

1. `web` (nginx) recebe e faz proxy para o `gateway`.
2. `gateway` chama `orders-service` através do `HttpServiceClient` (com timeout e
   Circuit Breaker).
3. `orders-service` → `OrderController` → caso de uso `PlaceOrder`.
4. `PlaceOrder` resolve a estratégia de desconto (`DiscountStrategyFactory`) e cria a
   entidade `Order`, que calcula subtotal, desconto e total.
5. `OrderRepository` (implementação Postgres) persiste o pedido.
6. A resposta sobe pelas mesmas camadas até o navegador.

Se qualquer passo de infraestrutura falhar, o erro é convertido em uma resposta
**503 com mensagem amigável** antes de chegar ao usuário.

## 4. Camadas (Clean Architecture)

| Camada | Conhece | NÃO conhece | Exemplos |
|---|---|---|---|
| `domain` | Apenas si mesma | Express, pg, HTTP | `Dish`, `Order`, `DiscountStrategy` |
| `application` | `domain` | Frameworks, banco | `PlaceOrder`, `ListDishes` |
| `infrastructure` | `domain`, `application` | `presentation` | `PgOrderRepository`, `pool` |
| `presentation` | `application` | Detalhes de banco | `OrderController`, rotas |
| `main` | Tudo (Composition Root) | — | `compositionRoot.ts` |

A inversão acontece nas **portas** (`domain/repositories`): o domínio declara a
interface, a infraestrutura a implementa. Assim o núcleo permanece testável e
independente de tecnologia.

## 5. Modelo de dados

- **menu-db** → tabela `dishes` (id, name, description, price_cents, category, available).
- **orders-db** → tabela `orders` (id, customer_name, table_label, items `JSONB`,
  discount_name, subtotal_cents, discount_cents, total_cents, status, created_at).
- **reservations-db** → tabela `reservations` (id, customer_name, phone, people_count,
  date, time, area, notes, status, created_at).

O `orders-service` e o `reservations-service` têm, cada um, uma **máquina de estados**
no domínio (pedido: RECEBIDO→EM_PREPARO→PRONTO→ENTREGUE; reserva:
PENDENTE→CONFIRMADA→CONCLUIDA), com cancelamento como transição válida.

Os itens do pedido são guardados como **snapshot** (nome e preço no momento da compra).
Isso reforça a autonomia: depois de registrado, o pedido não depende mais do cardápio.

Valores monetários são sempre **inteiros em centavos**, evitando imprecisão de ponto
flutuante.

## 6. Resiliência (decisão de projeto central)

| Mecanismo | Onde | Efeito |
|---|---|---|
| Boot independente do banco | `main/server.ts` (`initSchemaWithRetry`) | O serviço sobe mesmo com o banco fora; tenta migrar em segundo plano. |
| Timeouts curtos | `infrastructure/database/pool.ts` | Consultas falham rápido em vez de travar. |
| Tradução de erro | `connectionErrors.ts` + `errorHandler` | Falha de conexão vira 503 amigável, sem vazar detalhe técnico. |
| Circuit Breaker | `gateway/src/infra/CircuitBreaker.ts` | Serviço fora → falha rápida com fallback amigável. |
| Degradação parcial | `gateway` `dashboard` | Uma seção (cardápio, pedidos ou reservas) cai, o resto do painel continua. |

## 7. Justificativas técnicas

- **Node + TypeScript**: tipagem estática ajuda a manter contratos entre camadas; o
  ecossistema Express é simples e adequado a serviços pequenos.
- **PostgreSQL**: banco relacional maduro, com `JSONB` para guardar os itens do pedido
  sem criar uma tabela extra neste escopo.
- **nginx** como frontend/proxy: serve estáticos com baixo custo e centraliza o acesso
  à API na mesma origem (sem CORS).
- **Circuit Breaker próprio** (em vez de biblioteca): o padrão fica explícito e
  testável, o que é didático e adequado ao tamanho do projeto.
- **Repositório em memória**: permite TDD/BDD rápidos, sem depender de banco real.
