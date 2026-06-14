"use strict";

// ---------------------------------------------------------------------------
// Sabor Digital — frontend (sem framework, conversa com o gateway via /api).
// Toda falha vira mensagem AMIGÁVEL; o usuário nunca vê detalhe técnico.
// ---------------------------------------------------------------------------

const GENERIC_ERROR = "Serviço temporariamente indisponível. Tente novamente em instantes.";
const cart = [];
const menuFilter = { search: "", category: "" };

const DISCOUNT_LABELS = {
  NENHUM: "Sem desconto",
  PERCENTUAL_10: "10% de desconto",
  PERCENTUAL_20: "20% de desconto",
  COMBO_FAMILIA: "Combo Família (15% acima de R$ 100)",
  CUPOM_BEMVINDO: "Cupom Bem-vindo (R$ 15 acima de R$ 80)",
};

const STATUS_LABELS = {
  RECEBIDO: "Recebido",
  EM_PREPARO: "Em preparo",
  PRONTO: "Pronto",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

// Ações de avanço permitidas por status (espelha a máquina de estados do back).
const STATUS_ACTIONS = {
  RECEBIDO: [
    { to: "EM_PREPARO", label: "Iniciar preparo", kind: "primary" },
    { to: "CANCELADO", label: "Cancelar", kind: "ghost" },
  ],
  EM_PREPARO: [
    { to: "PRONTO", label: "Marcar pronto", kind: "primary" },
    { to: "CANCELADO", label: "Cancelar", kind: "ghost" },
  ],
  PRONTO: [{ to: "ENTREGUE", label: "Entregar", kind: "primary" }],
  ENTREGUE: [],
  CANCELADO: [],
};

function money(cents) {
  return (Number(cents || 0) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function friendlyMessage(body) {
  return (body && body.error && body.error.message) || GENERIC_ERROR;
}

async function apiGet(path) {
  let res;
  try {
    res = await fetch(path, { headers: { accept: "application/json" } });
  } catch (_e) {
    throw new Error(GENERIC_ERROR);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(friendlyMessage(body));
  return body;
}

async function apiSend(method, path, payload) {
  let res;
  try {
    res = await fetch(path, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (_e) {
    throw new Error(GENERIC_ERROR);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(friendlyMessage(body));
  return body;
}

const apiPost = (path, payload) => apiSend("POST", path, payload);
const apiPatch = (path, payload) => apiSend("PATCH", path, payload);
const apiPut = (path, payload) => apiSend("PUT", path, payload);
const apiDelete = (path) => apiSend("DELETE", path);

function noticeWarn(message) {
  return `<div class="notice notice--warn"><span>⚠️</span><span>${message}</span></div>`;
}

// ----- Navegação por abas --------------------------------------------------
const tabs = document.getElementById("tabs");
tabs.addEventListener("click", (event) => {
  const button = event.target.closest(".tab");
  if (!button) return;
  const name = button.dataset.tab;

  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("is-active", t === button));
  document.querySelectorAll(".panel").forEach((p) => {
    p.classList.toggle("is-active", p.id === `tab-${name}`);
  });

  if (name === "pedidos") loadOrders();
  if (name === "reservas") loadReservations();
  if (name === "painel") loadDashboard();
});

// Labels e ações de status das reservas (espelham a máquina de estados do back).
const RESERVA_STATUS_LABELS = {
  PENDENTE: "Pendente",
  CONFIRMADA: "Confirmada",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

const RESERVA_STATUS_ACTIONS = {
  PENDENTE: [
    { to: "CONFIRMADA", label: "Confirmar", kind: "primary" },
    { to: "CANCELADA", label: "Cancelar", kind: "ghost" },
  ],
  CONFIRMADA: [
    { to: "CONCLUIDA", label: "Concluir", kind: "primary" },
    { to: "CANCELADA", label: "Cancelar", kind: "ghost" },
  ],
  CONCLUIDA: [],
  CANCELADA: [],
};

// ----- Cardápio ------------------------------------------------------------
function menuQuery() {
  const params = new URLSearchParams();
  if (menuFilter.search) params.set("search", menuFilter.search);
  if (menuFilter.category) params.set("category", menuFilter.category);
  const query = params.toString();
  return query ? `?${query}` : "";
}

async function loadCategories() {
  const box = document.getElementById("cardapio-categorias");
  try {
    const body = await apiGet("/api/menu/categories");
    const categories = body.data || [];
    const chips = [chip("Todas", "")].concat(categories.map((c) => chip(c, c)));
    box.innerHTML = chips.join("");
  } catch (_err) {
    box.innerHTML = "";
  }
}

function chip(label, value) {
  const active = menuFilter.category === value ? " chip--on" : "";
  return `<button class="chip${active}" data-category="${escapeHtml(value)}">${escapeHtml(label)}</button>`;
}

document.getElementById("cardapio-categorias").addEventListener("click", (event) => {
  const button = event.target.closest(".chip");
  if (!button) return;
  menuFilter.category = button.dataset.category || "";
  document
    .querySelectorAll("#cardapio-categorias .chip")
    .forEach((c) => c.classList.toggle("chip--on", c === button));
  loadMenu();
});

let searchTimer;
document.getElementById("cardapio-busca").addEventListener("input", (event) => {
  clearTimeout(searchTimer);
  const value = event.target.value;
  searchTimer = setTimeout(() => {
    menuFilter.search = value.trim();
    loadMenu();
  }, 250);
});

async function loadMenu() {
  const status = document.getElementById("cardapio-status");
  const list = document.getElementById("cardapio-lista");
  status.innerHTML = "";
  list.innerHTML = '<p class="muted">Carregando cardápio…</p>';

  try {
    const body = await apiGet(`/api/menu${menuQuery()}`);
    const dishes = body.data || [];
    if (dishes.length === 0) {
      list.innerHTML = '<p class="muted">Nenhum prato encontrado para este filtro.</p>';
      return;
    }
    list.innerHTML = dishes.map(dishCard).join("");
  } catch (err) {
    list.innerHTML = "";
    status.innerHTML = noticeWarn(err.message);
  }
}

function dishCard(d) {
  const unavailable = d.available === false;
  const addButton = unavailable
    ? `<button class="btn btn--ghost btn--small" disabled>Indisponível</button>`
    : `<button class="btn btn--primary btn--small" data-add='${encodeURIComponent(
        JSON.stringify({ dishId: d.id, name: d.name, unitPriceCents: d.priceCents }),
      )}'>Adicionar ao pedido</button>`;
  const toggle = `<button class="btn btn--ghost btn--small" data-toggle="${escapeHtml(
    d.id,
  )}" data-available="${unavailable}">${unavailable ? "Reativar" : "Tirar do cardápio"}</button>`;
  const payload = encodeURIComponent(JSON.stringify(d));
  const edit = `<button class="btn btn--ghost btn--small" data-edit="${payload}">Editar</button>`;
  const del = `<button class="btn btn--danger btn--small" data-delete-dish="${escapeHtml(
    d.id,
  )}" data-name="${escapeHtml(d.name)}">Excluir</button>`;

  return `
    <article class="dish${unavailable ? " dish--off" : ""}">
      <span class="dish__cat">${escapeHtml(d.category)}</span>
      <span class="dish__name">${escapeHtml(d.name)}</span>
      <span class="dish__desc">${escapeHtml(d.description || "")}</span>
      <span class="dish__price">${money(d.priceCents)}</span>
      <div class="dish__actions">${addButton}${toggle}${edit}${del}</div>
    </article>`;
}

document.getElementById("cardapio-lista").addEventListener("click", async (event) => {
  const addButton = event.target.closest("[data-add]");
  if (addButton) {
    addToCart(JSON.parse(decodeURIComponent(addButton.dataset.add)));
    return;
  }

  const editButton = event.target.closest("[data-edit]");
  if (editButton) {
    startEditDish(JSON.parse(decodeURIComponent(editButton.dataset.edit)));
    return;
  }

  const deleteButton = event.target.closest("[data-delete-dish]");
  if (deleteButton) {
    const name = deleteButton.dataset.name || "este prato";
    if (!confirm(`Excluir "${name}" do cardápio? Esta ação não pode ser desfeita.`)) return;
    deleteButton.disabled = true;
    try {
      await apiDelete(`/api/menu/${deleteButton.dataset.deleteDish}`);
      loadCategories();
      loadMenu();
    } catch (err) {
      deleteButton.disabled = false;
      document.getElementById("cardapio-status").innerHTML = noticeWarn(err.message);
    }
    return;
  }

  const toggle = event.target.closest("[data-toggle]");
  if (toggle) {
    const makeAvailable = toggle.dataset.available === "true";
    toggle.disabled = true;
    try {
      await apiPatch(`/api/menu/${toggle.dataset.toggle}/availability`, { available: makeAvailable });
      loadMenu();
    } catch (err) {
      toggle.disabled = false;
      document.getElementById("cardapio-status").innerHTML = noticeWarn(err.message);
    }
  }
});

// Estado de edição do prato (null = criando um novo)
let editingDishId = null;

function startEditDish(dish) {
  editingDishId = dish.id;
  const form = document.getElementById("form-prato");
  form.classList.remove("is-hidden");
  form.name.value = dish.name || "";
  form.category.value = dish.category || "";
  form.description.value = dish.description || "";
  form.price.value = (Number(dish.priceCents || 0) / 100).toFixed(2);
  document.getElementById("prato-submit").textContent = "Salvar alterações";
  document.getElementById("prato-cancelar").classList.remove("is-hidden");
  const msg = document.getElementById("prato-msg");
  msg.className = "form__msg";
  msg.textContent = `Editando "${dish.name}".`;
  form.scrollIntoView({ behavior: "smooth", block: "center" });
}

function resetDishForm() {
  editingDishId = null;
  const form = document.getElementById("form-prato");
  form.reset();
  document.getElementById("prato-submit").textContent = "Salvar prato";
  document.getElementById("prato-cancelar").classList.add("is-hidden");
  document.getElementById("prato-msg").textContent = "";
}

document.getElementById("prato-cancelar").addEventListener("click", () => {
  resetDishForm();
  document.getElementById("form-prato").classList.add("is-hidden");
});

// Form de novo prato
document.getElementById("toggle-novo-prato").addEventListener("click", () => {
  document.getElementById("form-prato").classList.toggle("is-hidden");
});

document.getElementById("form-prato").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  const msg = document.getElementById("prato-msg");
  msg.className = "form__msg";
  msg.textContent = "Salvando…";

  const priceReais = parseFloat(form.price.value);
  const payload = {
    name: form.name.value,
    description: form.description.value,
    category: form.category.value,
    priceCents: Math.round((priceReais || 0) * 100),
  };

  try {
    if (editingDishId) {
      await apiPut(`/api/menu/${editingDishId}`, payload);
    } else {
      await apiPost("/api/menu", { ...payload, available: true });
    }
    msg.className = "form__msg ok";
    msg.textContent = editingDishId ? "Prato atualizado!" : "Prato cadastrado com sucesso!";
    resetDishForm();
    loadCategories();
    loadMenu();
  } catch (err) {
    msg.className = "form__msg err";
    msg.textContent = err.message;
  }
});

// ----- Carrinho ------------------------------------------------------------
function addToCart(dish) {
  const existing = cart.find((item) => item.dishId === dish.dishId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...dish, quantity: 1 });
  }
  renderCart();
  flashTab("pedido");
}

function removeFromCart(dishId) {
  const index = cart.findIndex((item) => item.dishId === dishId);
  if (index >= 0) cart.splice(index, 1);
  renderCart();
}

function renderCart() {
  const empty = document.getElementById("carrinho-vazio");
  const list = document.getElementById("carrinho-itens");
  const clearBtn = document.getElementById("limpar-carrinho");
  if (cart.length === 0) {
    empty.style.display = "block";
    list.innerHTML = "";
    clearBtn.classList.add("is-hidden");
    return;
  }
  empty.style.display = "none";
  clearBtn.classList.remove("is-hidden");
  list.innerHTML = cart
    .map(
      (item) => `
      <li>
        <span>${item.quantity}× ${escapeHtml(item.name)} <small class="muted">(${money(
          item.unitPriceCents,
        )})</small></span>
        <span>
          <strong>${money(item.unitPriceCents * item.quantity)}</strong>
          <button class="btn btn--ghost btn--small" data-remove="${item.dishId}">remover</button>
        </span>
      </li>`,
    )
    .join("");
}

document.getElementById("carrinho-itens").addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove]");
  if (button) removeFromCart(button.dataset.remove);
});

document.getElementById("limpar-carrinho").addEventListener("click", () => {
  if (cart.length === 0) return;
  if (!confirm("Esvaziar o carrinho?")) return;
  cart.length = 0;
  renderCart();
});

function flashTab(name) {
  const button = document.querySelector(`.tab[data-tab="${name}"]`);
  if (button) {
    button.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.12)" }, { transform: "scale(1)" }],
      { duration: 280 },
    );
  }
}

// ----- Descontos -----------------------------------------------------------
async function loadDiscounts() {
  const select = document.getElementById("select-desconto");
  try {
    const body = await apiGet("/api/discounts");
    const codes = body.data || ["NENHUM"];
    select.innerHTML = codes
      .map((code) => `<option value="${code}">${DISCOUNT_LABELS[code] || code}</option>`)
      .join("");
  } catch (_err) {
    select.innerHTML = '<option value="NENHUM">Sem desconto</option>';
  }
}

// ----- Finalizar pedido ----------------------------------------------------
document.getElementById("form-pedido").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  const msg = document.getElementById("pedido-msg");
  msg.className = "form__msg";

  if (cart.length === 0) {
    msg.className = "form__msg err";
    msg.textContent = "Adicione ao menos um item do cardápio antes de finalizar.";
    return;
  }

  msg.textContent = "Enviando pedido…";
  try {
    const body = await apiPost("/api/orders", {
      customerName: form.customerName.value,
      tableLabel: form.tableLabel.value,
      discountCode: form.discountCode.value,
      items: cart.map((item) => ({
        dishId: item.dishId,
        name: item.name,
        unitPriceCents: item.unitPriceCents,
        quantity: item.quantity,
      })),
    });
    const total = body.data ? body.data.totalCents : 0;
    msg.className = "form__msg ok";
    msg.textContent = `Pedido registrado! Total: ${money(total)}`;
    cart.length = 0;
    renderCart();
    form.reset();
  } catch (err) {
    msg.className = "form__msg err";
    msg.textContent = err.message;
  }
});

// ----- Pedidos -------------------------------------------------------------
async function loadOrders() {
  const status = document.getElementById("pedidos-status");
  const list = document.getElementById("pedidos-lista");
  const filter = document.getElementById("pedidos-filtro").value;
  status.innerHTML = "";
  list.innerHTML = '<p class="muted">Carregando pedidos…</p>';

  try {
    const query = filter ? `?status=${encodeURIComponent(filter)}` : "";
    const body = await apiGet(`/api/orders${query}`);
    const orders = body.data || [];
    if (orders.length === 0) {
      list.innerHTML = '<p class="muted">Nenhum pedido para este filtro.</p>';
      return;
    }
    list.innerHTML = orders.map(orderCard).join("");
  } catch (err) {
    list.innerHTML = "";
    status.innerHTML = noticeWarn(err.message);
  }
}

function orderCard(order) {
  const items = (order.items || []).map((i) => `${i.quantity}× ${escapeHtml(i.name)}`).join(", ");
  const statusKey = order.status || "RECEBIDO";
  const discount =
    order.discountName && order.discountName !== "NENHUM"
      ? `<span class="tag">${DISCOUNT_LABELS[order.discountName] || order.discountName}</span>`
      : "";
  const actions = (STATUS_ACTIONS[statusKey] || [])
    .map(
      (action) =>
        `<button class="btn btn--${action.kind} btn--small" data-order="${escapeHtml(
          order.id,
        )}" data-status="${action.to}">${action.label}</button>`,
    )
    .join("");
  // Pedidos já encerrados (entregues/cancelados) podem ser removidos do histórico.
  const canDelete = statusKey === "ENTREGUE" || statusKey === "CANCELADO";
  const del = canDelete
    ? `<button class="btn btn--danger btn--small" data-delete-order="${escapeHtml(
        order.id,
      )}">Excluir</button>`
    : "";
  const allActions = actions + del;

  return `
    <article class="order">
      <div class="order__head">
        <h3>${escapeHtml(order.customerName)} · <small class="muted">${escapeHtml(
          order.tableLabel,
        )}</small></h3>
        <span class="status status--${statusKey}">${STATUS_LABELS[statusKey] || statusKey}</span>
      </div>
      <p class="muted">${items}</p>
      <span class="order__total">${money(order.totalCents)}</span>
      ${discount}
      ${allActions ? `<div class="order__actions">${allActions}</div>` : ""}
    </article>`;
}

document.getElementById("pedidos-lista").addEventListener("click", async (event) => {
  const deleteButton = event.target.closest("[data-delete-order]");
  if (deleteButton) {
    if (!confirm("Excluir este pedido do histórico? Esta ação não pode ser desfeita.")) return;
    deleteButton.disabled = true;
    try {
      await apiDelete(`/api/orders/${deleteButton.dataset.deleteOrder}`);
      loadOrders();
    } catch (err) {
      deleteButton.disabled = false;
      document.getElementById("pedidos-status").innerHTML = noticeWarn(err.message);
    }
    return;
  }

  const button = event.target.closest("[data-order]");
  if (!button) return;
  button.disabled = true;
  try {
    await apiPatch(`/api/orders/${button.dataset.order}/status`, { status: button.dataset.status });
    loadOrders();
  } catch (err) {
    button.disabled = false;
    document.getElementById("pedidos-status").innerHTML = noticeWarn(err.message);
  }
});

document.getElementById("reload-pedidos").addEventListener("click", loadOrders);
document.getElementById("pedidos-filtro").addEventListener("change", loadOrders);

// ----- Reservas ------------------------------------------------------------
async function loadAreas() {
  const select = document.getElementById("select-area");
  try {
    const body = await apiGet("/api/reservation-areas");
    const areas = body.data || ["Salão"];
    select.innerHTML = areas.map((a) => `<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`).join("");
  } catch (_err) {
    select.innerHTML = '<option value="Salão">Salão</option>';
  }
}

async function loadReservations() {
  const status = document.getElementById("reservas-status");
  const list = document.getElementById("reservas-lista");
  const filter = document.getElementById("reservas-filtro").value;
  status.innerHTML = "";
  list.innerHTML = '<p class="muted">Carregando reservas…</p>';

  try {
    const query = filter ? `?status=${encodeURIComponent(filter)}` : "";
    const body = await apiGet(`/api/reservations${query}`);
    const reservations = body.data || [];
    if (reservations.length === 0) {
      list.innerHTML = '<p class="muted">Nenhuma reserva para este filtro.</p>';
      return;
    }
    list.innerHTML = reservations.map(reservationCard).join("");
  } catch (err) {
    list.innerHTML = "";
    status.innerHTML = noticeWarn(err.message);
  }
}

function reservationCard(r) {
  const statusKey = r.status || "PENDENTE";
  const when = `${formatDate(r.date)} · ${escapeHtml(r.time)}`;
  const actions = (RESERVA_STATUS_ACTIONS[statusKey] || [])
    .map(
      (action) =>
        `<button class="btn btn--${action.kind} btn--small" data-reserva="${escapeHtml(
          r.id,
        )}" data-status="${action.to}">${action.label}</button>`,
    )
    .join("");
  const canDelete = statusKey === "CONCLUIDA" || statusKey === "CANCELADA";
  const del = canDelete
    ? `<button class="btn btn--danger btn--small" data-delete-reserva="${escapeHtml(r.id)}">Excluir</button>`
    : "";
  const notes = r.notes ? `<p class="muted">📝 ${escapeHtml(r.notes)}</p>` : "";
  const allActions = actions + del;

  return `
    <article class="order">
      <div class="order__head">
        <h3>${escapeHtml(r.customerName)} · <small class="muted">${escapeHtml(
          String(r.peopleCount),
        )} pessoa(s)</small></h3>
        <span class="status status--${statusKey}">${RESERVA_STATUS_LABELS[statusKey] || statusKey}</span>
      </div>
      <p class="muted">📅 ${when} · 📍 ${escapeHtml(r.area)}${r.phone ? ` · 📞 ${escapeHtml(r.phone)}` : ""}</p>
      ${notes}
      ${allActions ? `<div class="order__actions">${allActions}</div>` : ""}
    </article>`;
}

function formatDate(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) return escapeHtml(iso || "");
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

document.getElementById("toggle-nova-reserva").addEventListener("click", () => {
  document.getElementById("form-reserva").classList.toggle("is-hidden");
});

document.getElementById("form-reserva").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  const msg = document.getElementById("reserva-msg");
  msg.className = "form__msg";
  msg.textContent = "Salvando…";

  try {
    await apiPost("/api/reservations", {
      customerName: form.customerName.value,
      phone: form.phone.value,
      date: form.date.value,
      time: form.time.value,
      peopleCount: Number(form.peopleCount.value),
      area: form.area.value,
      notes: form.notes.value,
    });
    msg.className = "form__msg ok";
    msg.textContent = "Reserva registrada!";
    form.reset();
    form.peopleCount.value = "2";
    document.getElementById("form-reserva").classList.add("is-hidden");
    loadReservations();
  } catch (err) {
    msg.className = "form__msg err";
    msg.textContent = err.message;
  }
});

document.getElementById("reservas-lista").addEventListener("click", async (event) => {
  const deleteButton = event.target.closest("[data-delete-reserva]");
  if (deleteButton) {
    if (!confirm("Excluir esta reserva do histórico? Esta ação não pode ser desfeita.")) return;
    deleteButton.disabled = true;
    try {
      await apiDelete(`/api/reservations/${deleteButton.dataset.deleteReserva}`);
      loadReservations();
    } catch (err) {
      deleteButton.disabled = false;
      document.getElementById("reservas-status").innerHTML = noticeWarn(err.message);
    }
    return;
  }

  const button = event.target.closest("[data-reserva]");
  if (!button) return;
  button.disabled = true;
  try {
    await apiPatch(`/api/reservations/${button.dataset.reserva}/status`, { status: button.dataset.status });
    loadReservations();
  } catch (err) {
    button.disabled = false;
    document.getElementById("reservas-status").innerHTML = noticeWarn(err.message);
  }
});

document.getElementById("reload-reservas").addEventListener("click", loadReservations);
document.getElementById("reservas-filtro").addEventListener("change", loadReservations);

// ----- Painel --------------------------------------------------------------
async function loadDashboard() {
  const container = document.getElementById("painel-stats");
  container.innerHTML = '<p class="muted">Carregando indicadores…</p>';

  try {
    const body = await apiGet("/api/dashboard");
    const { menu, orders, reservations } = body.data;
    const blocks = [];

    if (menu.available) {
      blocks.push(stat(menu.totalDishes, "Pratos no cardápio"));
      blocks.push(stat(menu.availableDishes, "Pratos disponíveis"));
    } else {
      blocks.push(statUnavailable("Cardápio indisponível"));
    }

    if (orders.available) {
      blocks.push(stat(orders.totalOrders, "Pedidos recebidos"));
      blocks.push(stat(money(orders.revenueCents), "Faturamento"));
      blocks.push(stat(money(orders.averageTicketCents), "Ticket médio"));
    } else {
      blocks.push(statUnavailable("Pedidos indisponíveis"));
    }

    if (reservations && reservations.available) {
      blocks.push(stat(reservations.totalReservations, "Reservas"));
      blocks.push(stat(reservations.upcomingGuests, "Convidados esperados"));
    } else {
      blocks.push(statUnavailable("Reservas indisponíveis"));
    }

    let html = `<div class="stats">${blocks.join("")}</div>`;

    if (orders.available) {
      html += statusBreakdown(orders.byStatus);
      html += topDishes(orders.topDishes);
    }

    if (reservations && reservations.available) {
      html += reservationsBreakdown(reservations.byStatus);
    }

    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = noticeWarn(err.message);
  }
}

function statusBreakdown(byStatus) {
  const entries = Object.entries(byStatus || {});
  if (entries.length === 0) return "";
  const rows = entries
    .map(
      ([status, count]) =>
        `<li><span class="status status--${status}">${STATUS_LABELS[status] || status}</span><strong>${count}</strong></li>`,
    )
    .join("");
  return `<div class="card panel-block"><h3>Pedidos por status</h3><ul class="breakdown">${rows}</ul></div>`;
}

function reservationsBreakdown(byStatus) {
  const entries = Object.entries(byStatus || {});
  if (entries.length === 0) return "";
  const rows = entries
    .map(
      ([status, count]) =>
        `<li><span class="status status--${status}">${RESERVA_STATUS_LABELS[status] || status}</span><strong>${count}</strong></li>`,
    )
    .join("");
  return `<div class="card panel-block"><h3>Reservas por status</h3><ul class="breakdown">${rows}</ul></div>`;
}

function topDishes(list) {
  if (!list || list.length === 0) return "";
  const rows = list
    .map(
      (item) =>
        `<li><span>${escapeHtml(item.name)}</span><strong>${item.quantity}×</strong></li>`,
    )
    .join("");
  return `<div class="card panel-block"><h3>Pratos mais pedidos</h3><ul class="breakdown">${rows}</ul></div>`;
}

function stat(value, label) {
  return `<div class="stat"><div class="stat__value">${value}</div><div class="stat__label">${label}</div></div>`;
}

function statUnavailable(label) {
  return `<div class="stat"><div class="stat__value">—</div><div class="stat__label">${label}</div></div>`;
}

document.getElementById("reload-painel").addEventListener("click", loadDashboard);

// ----- Utilidades ----------------------------------------------------------
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ----- Inicialização -------------------------------------------------------
loadCategories();
loadMenu();
loadDiscounts();
loadAreas();
renderCart();
