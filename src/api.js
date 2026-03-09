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

  if (!res.ok) {
    throw new Error("Failed to create user")
  }

  return await res.json()
}

// ПОЛУЧЕНИЕ БАЛАНСА
export async function getBalance(userId) {
  if (!userId) {
    throw new Error("User ID required")
  }

  const res = await fetch(`${API_URL}/balance/${userId}`)

  if (!res.ok) {
    throw new Error("Failed to fetch balance")
  }

  return await res.json()
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

  return data
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

  return data
}
