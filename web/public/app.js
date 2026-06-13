"use strict";

// ---------------------------------------------------------------------------
// Sabor Digital — frontend (sem framework, conversa com o gateway via /api).
// Toda falha vira mensagem AMIGÁVEL; o usuário nunca vê detalhe técnico.
// ---------------------------------------------------------------------------

const GENERIC_ERROR = "Serviço temporariamente indisponível. Tente novamente em instantes.";
const cart = [];

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

async function apiPost(path, payload) {
  let res;
  try {
    res = await fetch(path, {
      method: "POST",
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
  if (name === "painel") loadDashboard();
});

// ----- Cardápio ------------------------------------------------------------
async function loadMenu() {
  const status = document.getElementById("cardapio-status");
  const list = document.getElementById("cardapio-lista");
  status.innerHTML = "";
  list.innerHTML = '<p class="muted">Carregando cardápio…</p>';

  try {
    const body = await apiGet("/api/menu");
    const dishes = body.data || [];
    if (dishes.length === 0) {
      list.innerHTML = '<p class="muted">Nenhum prato cadastrado ainda.</p>';
      return;
    }
    list.innerHTML = dishes
      .map(
        (d) => `
        <article class="dish">
          <span class="dish__cat">${escapeHtml(d.category)}</span>
          <span class="dish__name">${escapeHtml(d.name)}</span>
          <span class="dish__desc">${escapeHtml(d.description || "")}</span>
          <span class="dish__price">${money(d.priceCents)}</span>
          <button class="btn btn--primary btn--small" data-add='${encodeURIComponent(
            JSON.stringify({ dishId: d.id, name: d.name, unitPriceCents: d.priceCents }),
          )}'>Adicionar ao pedido</button>
        </article>`,
      )
      .join("");
  } catch (err) {
    list.innerHTML = "";
    status.innerHTML = noticeWarn(err.message);
  }
}

document.getElementById("cardapio-lista").addEventListener("click", (event) => {
  const button = event.target.closest("[data-add]");
  if (!button) return;
  const dish = JSON.parse(decodeURIComponent(button.dataset.add));
  addToCart(dish);
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
  try {
    await apiPost("/api/menu", {
      name: form.name.value,
      description: form.description.value,
      category: form.category.value,
      priceCents: Math.round((priceReais || 0) * 100),
      available: true,
    });
    msg.className = "form__msg ok";
    msg.textContent = "Prato cadastrado com sucesso!";
    form.reset();
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
  if (cart.length === 0) {
    empty.style.display = "block";
    list.innerHTML = "";
    return;
  }
  empty.style.display = "none";
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
const DISCOUNT_LABELS = {
  NENHUM: "Sem desconto",
  PERCENTUAL_10: "10% de desconto",
  COMBO_FAMILIA: "Combo Família (15% acima de R$ 100)",
};

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
  status.innerHTML = "";
  list.innerHTML = '<p class="muted">Carregando pedidos…</p>';

  try {
    const body = await apiGet("/api/orders");
    const orders = body.data || [];
    if (orders.length === 0) {
      list.innerHTML = '<p class="muted">Nenhum pedido registrado ainda.</p>';
      return;
    }
    list.innerHTML = orders
      .map((order) => {
        const items = (order.items || [])
          .map((i) => `${i.quantity}× ${escapeHtml(i.name)}`)
          .join(", ");
        const discount =
          order.discountName && order.discountName !== "NENHUM"
            ? `<span class="tag">${DISCOUNT_LABELS[order.discountName] || order.discountName}</span>`
            : "";
        return `
        <article class="order">
          <h3>${escapeHtml(order.customerName)} · <small class="muted">${escapeHtml(
            order.tableLabel,
          )}</small></h3>
          <p class="muted">${items}</p>
          <span class="order__total">${money(order.totalCents)}</span>
          ${discount}
        </article>`;
      })
      .join("");
  } catch (err) {
    list.innerHTML = "";
    status.innerHTML = noticeWarn(err.message);
  }
}

document.getElementById("reload-pedidos").addEventListener("click", loadOrders);

// ----- Painel --------------------------------------------------------------
async function loadDashboard() {
  const container = document.getElementById("painel-stats");
  container.innerHTML = '<p class="muted">Carregando indicadores…</p>';

  try {
    const body = await apiGet("/api/dashboard");
    const { menu, orders } = body.data;
    const blocks = [];

    if (menu.available) {
      blocks.push(stat(menu.totalDishes, "Pratos no cardápio"));
    } else {
      blocks.push(statUnavailable("Cardápio indisponível"));
    }

    if (orders.available) {
      blocks.push(stat(orders.totalOrders, "Pedidos recebidos"));
      blocks.push(stat(money(orders.revenueCents), "Faturamento"));
    } else {
      blocks.push(statUnavailable("Pedidos indisponíveis"));
    }

    container.innerHTML = blocks.join("");
  } catch (err) {
    container.innerHTML = noticeWarn(err.message);
  }
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
loadMenu();
loadDiscounts();
renderCart();
