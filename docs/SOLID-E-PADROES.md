# SOLID e Design Patterns — Sabor Digital

## Princípios SOLID

### S — Responsabilidade Única (SRP)
Cada classe tem um motivo para mudar.
- `CreateDish` / `PlaceOrder` / `CreateReservation` (`application/use-cases`): só
  orquestram um caso de uso.
- `DishController` / `OrderController` / `ReservationController` (`presentation`): só
  adaptam HTTP ↔ caso de uso.
- `Dish` / `Order` / `Reservation` (`domain/entities`): só guardam regra de negócio
  (incluindo as máquinas de estado de pedido e reserva).

### O — Aberto/Fechado (OCP)
Aberto para extensão, fechado para modificação.
- Para criar uma nova promoção, basta implementar `DiscountStrategy` e registrá-la na
  `DiscountStrategyFactory`. A entidade `Order` e o caso de uso `PlaceOrder` **não
  mudam**.
  - Arquivos: `orders-service/src/domain/discounts/`.

### L — Substituição de Liskov (LSP)
Implementações podem substituir suas abstrações sem quebrar o sistema.
- `PgDishRepository` e `InMemoryDishRepository` implementam `DishRepository`; o caso de
  uso funciona com qualquer uma. O mesmo vale para os repositórios de pedidos e reservas.
  - Arquivos: `*/src/infrastructure/repositories/`.

### I — Segregação de Interface (ISP)
Interfaces pequenas e focadas.
- `DishRepository` (save/findAll/findById) e `OrderRepository` (save/findAll) são
  enxutas; `DiscountStrategy` tem um único método `calculate`.

### D — Inversão de Dependência (DIP)
Módulos de alto nível dependem de abstrações.
- Casos de uso recebem repositórios **por interface**, injetados no Composition Root
  (`src/main/compositionRoot.ts`). Nenhum caso de uso instancia `pg` diretamente.

---

## Design Patterns

### 1. Repository
**Intenção:** isolar a aplicação dos detalhes de persistência.
- Portas: `domain/repositories/DishRepository.ts`, `OrderRepository.ts`.
- Implementações: `infrastructure/repositories/Pg*.ts` e `InMemory*.ts`.

### 2. Strategy
**Intenção:** encapsular algoritmos intercambiáveis (políticas de desconto).
- Contrato: `domain/discounts/DiscountStrategy.ts`.
- Variações: `NoDiscountStrategy`, `PercentageDiscountStrategy`, `ComboFamiliaStrategy`.

### 3. Factory
**Intenção:** centralizar a criação do objeto concreto certo.
- `DiscountStrategyFactory` (qual desconto aplicar a partir de um código).
- `RepositoryFactory` (Postgres ou memória conforme o ambiente).

### 4. Circuit Breaker
**Intenção:** evitar que falhas em cascata derrubem o sistema.
- `gateway/src/infra/CircuitBreaker.ts` — estados CLOSED → OPEN → HALF_OPEN.
- Coberto por teste unitário em `gateway/tests/unit/circuit-breaker.test.ts`.

### 5. Adapter
**Intenção:** adaptar uma API de baixo nível a uma interface conveniente.
- `gateway/src/infra/HttpServiceClient.ts` encapsula `fetch` + timeout + breaker,
  expondo apenas `get`/`post`.

### 6. Dependency Injection (Composition Root)
**Intenção:** montar o grafo de dependências em um único lugar.
- `src/main/compositionRoot.ts` em cada serviço cria repositórios, casos de uso e
  controllers, injetando as dependências por construtor.
