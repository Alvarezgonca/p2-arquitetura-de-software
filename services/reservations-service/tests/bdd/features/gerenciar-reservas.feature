# language: pt
Funcionalidade: Gerenciar reservas de mesa
  Para organizar o salão do restaurante
  Como atendente
  Quero registrar reservas e acompanhar o status

  Cenário: Registrar uma reserva válida
    Dado que não há reservas
    Quando eu registro uma reserva para "Família Souza" de 4 pessoas em "2026-06-20" às "20:00"
    Então deve haver 1 reserva
    E a reserva de "Família Souza" deve estar com status "PENDENTE"

  Cenário: Recusar reserva com pessoas demais
    Dado que não há reservas
    Quando eu tento registrar uma reserva para "Grupo Grande" de 50 pessoas em "2026-06-20" às "20:00"
    Então o registro deve ser recusado

  Cenário: Confirmar uma reserva pendente
    Dado que não há reservas
    Quando eu registro uma reserva para "Carlos e Ana" de 2 pessoas em "2026-06-21" às "19:30"
    E eu confirmo a reserva de "Carlos e Ana"
    Então a reserva de "Carlos e Ana" deve estar com status "CONFIRMADA"
