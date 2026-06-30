const API_URL = "https://ufo-backend-1.onrender.com"

function getTelegramInitData() {
  return window.Telegram?.WebApp?.initData || ""
}

function getApiHeaders(extra = {}) {
  const initData = getTelegramInitData()

  return {
    ...extra,
    ...(initData ? { "X-Telegram-Init-Data": initData } : {}),
  }
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: getApiHeaders(options.headers || {}),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error || "API request failed")
  }

  return data
}

// СОЗДАНИЕ / ПОЛУЧЕНИЕ ПОЛЬЗОВАТЕЛЯ
export async function createUser(userData) {
  if (!userData || !userData.id) {
    throw new Error("Invalid user data")
  }

  return apiFetch("/user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: userData.id,
      username: userData.username || "",
    }),
  })
}

// ПОЛУЧЕНИЕ БАЛАНСА
export async function getBalance(userId) {
  if (!userId) {
    throw new Error("User ID required")
  }

  return apiFetch(`/balance/${userId}`)
}

// ОТКРЫТИЕ КЕЙСА
export async function openCaseRequest({ telegram_id, caseId }) {
  if (!telegram_id || !caseId) {
    throw new Error("telegram_id and caseId are required")
  }

  return apiFetch("/case/open", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      telegram_id,
      caseId,
    }),
  })
}

// =============================
// FREE CASE STATE
// =============================

export async function getFreeCaseState({ telegram_id, caseId }) {
  if (!telegram_id || !caseId) {
    throw new Error("telegram_id and caseId are required")
  }

  return apiFetch(
    `/case/free-state?telegram_id=${encodeURIComponent(telegram_id)}&caseId=${encodeURIComponent(caseId)}`
  )
}

// =============================
// FREE CASE OPEN
// =============================

export async function openFreeCase({ telegram_id, caseId }) {
  if (!telegram_id || !caseId) {
    throw new Error("telegram_id and caseId are required")
  }

  return apiFetch("/case/free-open", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      telegram_id,
      caseId,
    }),
  })
}

// ПОЛУЧЕНИЕ ИНВЕНТАРЯ
export async function getInventory(telegram_id) {
  if (!telegram_id) {
    throw new Error("telegram_id is required")
  }

  const data = await apiFetch(`/inventory/${telegram_id}`)
  return Array.isArray(data) ? data : []
}

// ПРОДАЖА ПРЕДМЕТА ИЗ ИНВЕНТАРЯ
export async function sellInventoryItem({ telegram_id, inventoryItemId }) {
  if (!telegram_id || !inventoryItemId) {
    throw new Error("telegram_id and inventoryItemId are required")
  }

  return apiFetch("/inventory/sell", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      telegram_id,
      inventoryItemId,
    }),
  })
}

// ИСТОРИЯ ТРАНЗАКЦИЙ
export async function getTransactions(telegram_id) {
  if (!telegram_id) {
    throw new Error("telegram_id is required")
  }

  const data = await apiFetch(`/transactions/${telegram_id}`)
  return Array.isArray(data) ? data : []
}

// =============================
// TELEGRAM STARS INVOICE
// =============================

export async function createStarsInvoice({ telegram_id, amount }) {
  if (!telegram_id || !amount || Number(amount) <= 0) {
    throw new Error("telegram_id and valid amount are required")
  }

  return apiFetch("/stars/invoice", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      telegram_id,
      amount: Number(amount),
    }),
  })
}

// =============================
// CRASH STATE
// =============================

export async function getCrashState(telegram_id) {
  if (!telegram_id) {
    throw new Error("telegram_id is required")
  }

  return apiFetch(
    `/crash/state?telegram_id=${encodeURIComponent(telegram_id)}`
  )
}

// =============================
// CRASH LIVE BETS
// =============================

export async function getCrashLive() {
  const data = await apiFetch("/crash/live")
  return Array.isArray(data) ? data : []
}

// =============================
// CRASH PLACE BET
// =============================

export async function placeCrashBet({ telegram_id, amount }) {
  if (!telegram_id || !amount || Number(amount) <= 0) {
    throw new Error("telegram_id and valid amount are required")
  }

  return apiFetch("/crash/bet", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      telegram_id,
      amount: Number(amount),
    }),
  })
}

// =============================
// CRASH CASHOUT
// =============================

export async function cashoutCrash({ telegram_id }) {
  if (!telegram_id) {
    throw new Error("telegram_id is required")
  }

  return apiFetch("/crash/cashout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      telegram_id,
    }),
  })
}

// =============================
// BONUS STATE
// =============================

export async function getBonusState(telegram_id) {
  if (!telegram_id) {
    throw new Error("telegram_id is required")
  }

  return apiFetch(`/bonus/state/${telegram_id}`)
}

// =============================
// BONUS RESERVE DAILY GIFT
// =============================

export async function reserveBonusGift(telegram_id) {
  if (!telegram_id) {
    throw new Error("telegram_id is required")
  }

  return apiFetch("/bonus/reserve-gift", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      telegram_id,
    }),
  })
}

// =============================
// BONUS CHECK CHANNEL
// =============================

export async function checkBonusChannel(telegram_id) {
  return apiFetch("/bonus/check-channel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      telegram_id,
    }),
  })
}

// =============================
// BONUS FRIEND INVITED
// =============================

export async function markFriendInvited(telegram_id) {
  return apiFetch("/bonus/friend", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      telegram_id,
    }),
  })
}

// =============================
// BONUS CLAIM
// =============================

export async function claimBonus(telegram_id) {
  return apiFetch("/bonus/claim", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      telegram_id,
    }),
  })
}

// =============================
// REFERRAL STATE
// =============================

export async function getReferralState(telegram_id) {
  if (!telegram_id) {
    throw new Error("telegram_id is required")
  }

  return apiFetch(`/referral/state/${telegram_id}`)
}

// =============================
// REFERRAL APPLY
// =============================

export async function applyReferralCode({ telegram_id, code }) {
  if (!telegram_id || !code) {
    throw new Error("telegram_id and code are required")
  }

  return apiFetch("/referral/apply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      telegram_id,
      code,
    }),
  })
}
