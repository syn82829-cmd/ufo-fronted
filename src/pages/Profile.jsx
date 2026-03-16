import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  getInventory,
  sellInventoryItem,
  getTransactions,
} from "../api"
import { useUser } from "../context/UserContext"
import { getPlayerRank } from "../utils/playerRank"
import { triggerHaptic } from "../utils/haptics"
import DepositMenu from "../components/DepositMenu"
import "../style.css"

function Profile() {
  const navigate = useNavigate()
  const { user, refreshUser } = useUser()

  const [activeTab, setActiveTab] = useState("inventory")

  const [inventory, setInventory] = useState([])
  const [isInventoryLoading, setIsInventoryLoading] = useState(true)
  const [sellingItemId, setSellingItemId] = useState(null)

  const [transactions, setTransactions] = useState([])
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(true)

  const [isDepositOpen, setIsDepositOpen] = useState(false)

  const playerRank = useMemo(() => {
    return getPlayerRank(
      Number(user?.casesOpened || 0),
      Number(user?.crashGamesPlayed || 0)
    )
  }, [user?.casesOpened, user?.crashGamesPlayed])

  useEffect(() => {
    async function loadInventory() {
      if (!user?.id || user.id === "—") {
        setInventory([])
        setIsInventoryLoading(false)
        return
      }

      try {
        setIsInventoryLoading(true)
        const items = await getInventory(user.id)
        setInventory(items)
      } catch (err) {
        console.error("INVENTORY LOAD ERROR:", err)
        setInventory([])
      } finally {
        setIsInventoryLoading(false)
      }
    }

    loadInventory()
  }, [user?.id])

  useEffect(() => {
    async function loadTransactions() {
      if (!user?.id || user.id === "—") {
        setTransactions([])
        setIsTransactionsLoading(false)
        return
      }

      try {
        setIsTransactionsLoading(true)
        const items = await getTransactions(user.id)
        setTransactions(items)
      } catch (err) {
        console.error("TRANSACTIONS LOAD ERROR:", err)
        setTransactions([])
      } finally {
        setIsTransactionsLoading(false)
      }
    }

    loadTransactions()
  }, [user?.id])

  const handleSellItem = async (itemId) => {
    if (!user?.id || !itemId || sellingItemId) return

    try {
      triggerHaptic("medium")

      setSellingItemId(itemId)

      await sellInventoryItem({
        telegram_id: user.id,
        inventoryItemId: itemId,
      })

      triggerHaptic("success")

      setInventory((prev) => prev.filter((item) => item.id !== itemId))
      await refreshUser()

      const updatedTransactions = await getTransactions(user.id).catch(() => null)
      if (updatedTransactions) {
        setTransactions(updatedTransactions)
      }
    } catch (err) {
      console.error("SELL INVENTORY ITEM ERROR:", err)
      await refreshUser().catch(() => {})
    } finally {
      setSellingItemId(null)
    }
  }

  const formatAmount = (value) => {
    const num = Number(value || 0)
    return new Intl.NumberFormat("ru-RU").format(num)
  }

  const formatTransactionLabel = (type) => {
    if (type === "deposit") return "Пополнение"
    if (type === "withdraw") return "Вывод"
    if (type === "case") return "Открытие кейса"
    if (type === "sale") return "Продажа"
    return type
  }

  const formatTransactionSign = (type) => {
    if (type === "deposit" || type === "sale") return "+"
    return "-"
  }

  const formatTransactionDate = (value) => {
    if (!value) return ""
    const date = new Date(value)

    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <div className="app">
      <div className="profile-page">
        <div className="profile-topbar">
          <div className="profile-topbar-left">
            <div className="profile-topbar-avatar">
              {user.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.username}
                  className="profile-topbar-avatar-image"
                  draggable={false}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="profile-topbar-avatar-fallback">
                  {(user.username?.[0] || "G").toUpperCase()}
                </span>
              )}
            </div>

            <div className="profile-topbar-user">
              <div className="profile-topbar-name">{user.username}</div>

              <div className="profile-topbar-rank">
                <img
                  src={playerRank.image}
                  alt={playerRank.name}
                  className="profile-topbar-rank-icon"
                  draggable={false}
                />
                <span className="profile-topbar-rank-text">{playerRank.name}</span>
              </div>
            </div>
          </div>

          <div className="profile-topbar-right">
            <div className="profile-topbar-balance">
              <img src="/ui/star.PNG" className="profile-topbar-balance-icon" alt="" />
              <span>{user.balance}</span>
            </div>

            <button
              type="button"
              className="profile-topbar-plus"
              onClick={() => {
                triggerHaptic("light")
                setIsDepositOpen(true)
              }}
            >
              +
            </button>
          </div>
        </div>

        <div className="profile-tabs">
          <button
            type="button"
            className={`profile-tab ${activeTab === "inventory" ? "active" : ""}`}
            onClick={() => {
              triggerHaptic("light")
              setActiveTab("inventory")
            }}
          >
            Инвентарь
          </button>

          <button
            type="button"
            className={`profile-tab ${activeTab === "history" ? "active" : ""}`}
            onClick={() => {
              triggerHaptic("light")
              setActiveTab("history")
            }}
          >
            История
          </button>
        </div>

        <div className="profile-content-area">
          {activeTab === "inventory" ? (
            isInventoryLoading ? (
              <div className="profile-empty-state">Загрузка инвентаря…</div>
            ) : inventory.length === 0 ? (
              <div className="profile-empty-state">В инвентаре пока пусто</div>
            ) : (
              <div className="profile-items-list">
                {inventory.map((item) => (
                  <div key={item.id} className="profile-item-row">
                    <div className="profile-item-visual">
                      <img
                        src={`/drops/${item.png}.png`}
                        alt={item.dropName}
                        className="profile-item-image"
                        draggable={false}
                      />
                    </div>

                    <div className="profile-item-main">
                      <div className="profile-item-name">{item.dropName}</div>

                      <div className="profile-item-prices">
                        <span className="profile-item-price">
                          <img src="/ui/star.PNG" className="profile-item-price-icon" alt="" />
                          <span>{item.priceStars}</span>
                        </span>

                        {item.priceGems && (
                          <span className="profile-item-price">
                            <img src="/ui/ton.PNG" className="profile-item-price-icon" alt="" />
                            <span>{item.priceGems}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="profile-item-actions">
                      <button
                        type="button"
                        className="profile-item-action-btn secondary"
                        disabled
                      >
                        Вывести
                      </button>

                      <button
                        type="button"
                        className="profile-item-action-btn primary"
                        onClick={() => handleSellItem(item.id)}
                        disabled={sellingItemId === item.id}
                      >
                        {sellingItemId === item.id ? "..." : "Продать"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : isTransactionsLoading ? (
            <div className="profile-empty-state">Загрузка истории…</div>
          ) : transactions.length === 0 ? (
            <div className="profile-empty-state">История пока пуста</div>
          ) : (
            <div className="profile-history-list">
              {transactions.map((item) => (
                <div key={item.id} className="profile-history-row">
                  <div className="profile-history-main">
                    <div className="profile-history-title">
                      {formatTransactionLabel(item.type)}
                    </div>
                    <div className="profile-history-date">
                      {formatTransactionDate(item.created_at)}
                    </div>
                  </div>

                  <div
                    className={`profile-history-amount ${
                      item.type === "deposit" || item.type === "sale"
                        ? "positive"
                        : "negative"
                    }`}
                  >
                    {formatTransactionSign(item.type)} {formatAmount(item.amount)}
                    <img src="/ui/star.PNG" className="profile-history-star" alt="" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bottom-nav">
        <div
          className="nav-item"
          onClick={() => {
            triggerHaptic("light")
            navigate("/bonus")
          }}
        >
          Вознаграждения
        </div>

        <div
          className="nav-item"
          onClick={() => {
            triggerHaptic("light")
            navigate("/giveaways")
          }}
        >
          Друзья
        </div>

        <div
          className="nav-item"
          onClick={() => {
            triggerHaptic("light")
            navigate("/")
          }}
        >
          Главная
        </div>

        <div className="nav-item active">Профиль</div>
      </div>

      <DepositMenu
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
      />
    </div>
  )
}

export default Profile
