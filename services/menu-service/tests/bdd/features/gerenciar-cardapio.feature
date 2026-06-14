# language: pt
Funcionalidade: Gerenciar o cardápio do restaurante
  Para manter as opções do restaurante sempre atualizadas
  Como gerente do restaurante
  Quero cadastrar e consultar os pratos do cardápio

  Cenário: Cadastrar um prato válido
    Dado que o cardápio está vazio
    Quando eu cadastro o prato "Risoto de Camarão" por 69 reais e 90 centavos
    Então o cardápio deve conter 1 prato
    E o prato "Risoto de Camarão" deve estar disponível

  Cenário: Recusar prato com preço negativo
    Dado que o cardápio está vazio
    Quando eu tento cadastrar o prato "Item Inválido" por -5 reais
    Então o cadastro deve ser recusado
    E o cardápio deve conter 0 pratos

  Cenário: Filtrar o cardápio por categoria
    Dado que o cardápio está vazio
    Quando eu cadastro o prato "Bruschetta" na categoria "Entradas" por 24 reais e 90 centavos
    E eu cadastro o prato "Risoto" na categoria "Principais" por 69 reais e 90 centavos
    Então a busca por categoria "Entradas" deve retornar 1 prato
