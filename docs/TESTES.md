# Testes — Sabor Digital

## Estratégia

Os testes seguem **TDD** (testes unitários guiando o design) e **BDD** (cenários de
comportamento em linguagem de negócio). Todos rodam **sem banco de dados**, usando os
repositórios em memória — então são rápidos e determinísticos, prontos para CI.

## TDD — testes unitários (Jest)

| Serviço | Arquivo | O que cobre |
|---|---|---|
| menu-service | `tests/unit/dish.entity.test.ts` | Invariantes da entidade `Dish` (nome, preço, categoria). |
| menu-service | `tests/unit/create-dish.usecase.test.ts` | Caso de uso de criação com repositório em memória. |
| orders-service | `tests/unit/discount-strategies.test.ts` | Cada estratégia de desconto e a factory. |
| orders-service | `tests/unit/order.entity.test.ts` | Cálculo de subtotal/desconto/total e validações. |
| orders-service | `tests/unit/place-order.usecase.test.ts` | Registro de pedido com Combo Família. |
| gateway | `tests/unit/circuit-breaker.test.ts` | Abertura, falha rápida e recuperação (HALF_OPEN). |

```bash
npm test          # dentro de cada serviço / gateway
```

## BDD — cenários de comportamento (Cucumber.js)

Os cenários ficam em `tests/bdd/features/*.feature`, escritos em **português (Gherkin)**,
com os passos implementados em `tests/bdd/steps/`.

Exemplo (`menu-service`):

```gherkin
# language: pt
Funcionalidade: Gerenciar o cardápio do restaurante
  Cenário: Cadastrar um prato válido
    Dado que o cardápio está vazio
    Quando eu cadastro o prato "Risoto de Camarão" por 69 reais e 90 centavos
    Então o cardápio deve conter 1 prato
    E o prato "Risoto de Camarão" deve estar disponível
```

```bash
npm run test:bdd  # em menu-service e orders-service
```

## Resumo da cobertura funcional

- Regras de negócio (preço, quantidade, descontos) — unitário.
- Comportamento ponta a ponta do caso de uso — BDD.
- Resiliência (Circuit Breaker) — unitário com relógio injetado.
