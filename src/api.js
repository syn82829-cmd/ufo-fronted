const API_URL = "https://ufo-backend-1.onrender.com"

// СОЗДАНИЕ / ПОЛУЧЕНИЕ ПОЛЬЗОВАТЕЛЯ
export async function createUser(userData) {
  if (!userData || !userData.id) {
    throw new Error("Invalid user data")
  }

  const res = await fetch(`${API_URL}/user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: userData.id,
      username: userData.username || "",
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error || "Failed to create user")
  }

  return data
}

// ПОЛУЧЕНИЕ БАЛАНСА
export async function getBalance(userId) {
  if (!userId) {
    throw new Error("User ID required")
  }

  const res = await fetch(`${API_URL}/balance/${userId}`)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error || "Failed to fetch balance")
  }

  return data
}

// ОТКРЫТИЕ КЕЙСА
export async function openCaseRequest({ telegram_id, caseId }) {
  if (!telegram_id || !caseId) {
    throw new Error("telegram_id and caseId are required")
  }

  const res = await fetch(`${API_URL}/case/open`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      telegram_id,
      caseId,
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error || "Failed to open case")
  }

  return data
}

// ПОЛУЧЕНИЕ ИНВЕНТАРЯ
export async function getInventory(telegram_id) {
  if (!telegram_id) {
    throw new Error("telegram_id is required")
  }

  const res = await fetch(`${API_URL}/inventory/${telegram_id}`)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error || "Failed to fetch inventory")
  }

  return Array.isArray(data) ? data : []
}

// ПРОДАЖА ПРЕДМЕТА ИЗ ИНВЕНТАРЯ
export async function sellInventoryItem({ telegram_id, inventoryItemId }) {
  if (!telegram_id || !inventoryItemId) {
    throw new Error("telegram_id and inventoryItemId are required")
  }

  const res = await fetch(`${API_URL}/inventory/sell`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      telegram_id,
      inventoryItemId,
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error || "Failed to sell inventory item")
  }

  return data
}

// ИСТОРИЯ ТРАНЗАКЦИЙ
export async function getTransactions(telegram_id) {
  if (!telegram_id) {
    throw new Error("telegram_id is required")
  }

  const res = await fetch(`${API_URL}/transactions/${telegram_id}`)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error || "Failed to fetch transactions")
  }

  return Array.isArray(data) ? data : []
}

// =============================
// TELEGRAM STARS INVOICE
// =============================

export async function createStarsInvoice({ telegram_id, amount }) {
  if (!telegram_id || !amount || Number(amount) <= 0) {
    throw new Error("telegram_id and valid amount are required")
  }

  const res = await fetch(`${API_URL}/stars/invoice`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      telegram_id,
      amount: Number(amount),
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error || "Failed to create stars invoice")
  }

  return data
}

// =============================
// CRASH STATE
// =============================

export async function getCrashState(telegram_id) {
  if (!telegram_id) {
    throw new Error("telegram_id is required")
  }

  const res = await fetch(
    `${API_URL}/crash/state?telegram_id=${encodeURIComponent(telegram_id)}`
  )

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error || "Failed to fetch crash state")
  }

  return data
}

// =============================
// CRASH LIVE BETS
// =============================

export async function getCrashLive() {
  const res = await fetch(`${API_URL}/crash/live`)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error || "Failed to fetch crash live bets")
  }

  return Array.isArray(data) ? data : []
}

// =============================
// CRASH PLACE BET
// =============================

export async function placeCrashBet({ telegram_id, amount }) {
  if (!telegram_id || !amount || Number(amount) <= 0) {
    throw new Error("telegram_id and valid amount are required")
  }

  const res = await fetch(`${API_URL}/crash/bet`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      telegram_id,
      amount: Number(amount),
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error || "Failed to place crash bet")
  }

  return data
}

// =============================
// CRASH CASHOUT
// =============================

export async function cashoutCrash({ telegram_id }) {
  if (!telegram_id) {
    throw new Error("telegram_id is required")
  }

  const res = await fetch(`${API_URL}/crash/cashout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      telegram_id,
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error || "Failed to cash out crash")
  }

  return data
}
