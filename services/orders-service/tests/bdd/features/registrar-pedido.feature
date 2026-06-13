# language: pt
Funcionalidade: Registrar pedidos do restaurante
  Para cobrar corretamente os clientes
  Como atendente do restaurante
  Quero registrar pedidos aplicando as políticas de desconto

  Cenário: Pedido sem desconto
    Dado um carrinho com o item "Risoto" a 50 reais e quantidade 2
    Quando eu finalizo o pedido para "João" com o desconto "NENHUM"
    Então o total do pedido deve ser 100 reais

  Cenário: Pedido com Combo Família acima do limite
    Dado um carrinho com o item "Rodízio" a 60 reais e quantidade 2
    Quando eu finalizo o pedido para "Maria" com o desconto "COMBO_FAMILIA"
    Então o total do pedido deve ser 102 reais
