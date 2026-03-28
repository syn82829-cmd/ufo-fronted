import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  checkBonusChannel,
  getBonusState,
  getInventory,
  sellInventoryItem,
  getTransactions,
} from "../api"
import { useUser } from "../context/UserContext"
import { getPlayerRank } from "../utils/playerRank"
import { triggerHaptic } from "../utils/haptics"
import DepositMenu from "../components/DepositMenu"
import "../style.css"

const BONUS_REWARD_STORAGE_KEY = "ufo_bonus_reserved_reward"

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

  const [bonusLockedItem, setBonusLockedItem] = useState(null)
  const [bonusTimeLeftMs, setBonusTimeLeftMs] = useState(0)
  const [isBonusSheetOpen, setIsBonusSheetOpen] = useState(false)
  const [bonusState, setBonusState] = useState(null)
  const [isCheckingChannel, setIsCheckingChannel] = useState(false)

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

  useEffect(() => {
    if (!user?.id) {
      setBonusLockedItem(null)
      setBonusTimeLeftMs(0)
      return
    }

    const syncReservedReward = () => {
      try {
        const raw = localStorage.getItem(BONUS_REWARD_STORAGE_KEY)
        if (!raw) {
          setBonusLockedItem(null)
          setBonusTimeLeftMs(0)
          return
        }

        const parsed = JSON.parse(raw)

        if (String(parsed?.ownerId) !== String(user.id)) {
          setBonusLockedItem(null)
          setBonusTimeLeftMs(0)
          return
        }

        const left = Math.max(Number(parsed?.reservedUntil || 0) - Date.now(), 0)

        if (left <= 0) {
          localStorage.removeItem(BONUS_REWARD_STORAGE_KEY)
          setBonusLockedItem(null)
          setBonusTimeLeftMs(0)
          return
        }

        setBonusLockedItem(parsed)
        setBonusTimeLeftMs(left)
      } catch (err) {
        console.error("BONUS RESERVED READ ERROR:", err)
        setBonusLockedItem(null)
        setBonusTimeLeftMs(0)
      }
    }

    syncReservedReward()

    const interval = setInterval(syncReservedReward, 1000)
    return () => clearInterval(interval)
  }, [user?.id])

  useEffect(() => {
    async function loadBonusState() {
      if (!user?.id || !bonusLockedItem) {
        setBonusState(null)
        return
      }

      try {
        const data = await getBonusState(user.id)
        setBonusState(data)
      } catch (err) {
        console.error("PROFILE BONUS STATE LOAD ERROR:", err)
        setBonusState(null)
      }
    }

    loadBonusState()
  }, [user?.id, bonusLockedItem])

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

  const handleLockedGiftAction = () => {
    triggerHaptic("light")
    setIsBonusSheetOpen(true)
  }

  const handleOpenChannel = () => {
    const tg = window.Telegram?.WebApp

    if (tg?.openTelegramLink) {
      tg.openTelegramLink("https://t.me/ufomochannel")
      return
    }

    window.open("https://t.me/ufomochannel", "_blank")
  }

  const handleCheckChannel = async () => {
    if (!user?.id || isCheckingChannel) return

    try {
      setIsCheckingChannel(true)
      const result = await checkBonusChannel(user.id)

      setBonusState((prev) => ({
        ...(prev || {}),
        ...prev,
        channelSubscribed: Boolean(result?.channelSubscribed),
        conditionsMet:
          Boolean(result?.channelSubscribed) && Boolean(prev?.friendInvited),
      }))
    } catch (err) {
      console.error("BONUS CHANNEL CHECK ERROR:", err)
    } finally {
      setIsCheckingChannel(false)
    }
  }

  const channelDone = Boolean(bonusState?.channelSubscribed)
  const friendDone = Boolean(bonusState?.friendInvited)
  const conditionsDone = channelDone && friendDone

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

  const formatTimer = (ms) => {
    const totalSeconds = Math.max(Math.floor(ms / 1000), 0)
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0")
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0")
    const seconds = String(totalSeconds % 60).padStart(2, "0")
    return `${hours}:${minutes}:${seconds}`
  }

  const mergedInventory = bonusLockedItem
    ? [bonusLockedItem, ...inventory]
    : inventory

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
            ) : mergedInventory.length === 0 ? (
              <div className="profile-empty-state">В инвентаре пока пусто</div>
            ) : (
              <div className="profile-items-list">
                {mergedInventory.map((item) => {
                  const isLockedBonus =
                    item.source === "bonus" && item.status === "locked"

                  return (
                    <div
                      key={item.id}
                      className={`profile-item-row ${
                        isLockedBonus ? "profile-item-row-bonus-locked" : ""
                      }`}
                    >
                      <div className="profile-item-visual">
                        <img
                          src={`/drops/${item.png}.png`}
                          alt={item.dropName}
                          className="profile-item-image"
                          draggable={false}
                        />
                      </div>

                      <div className="profile-item-main">
                        {isLockedBonus ? (
                          <>
                            <div className="profile-item-bonus-topline">
                              <div className="profile-item-name">{item.dropName}</div>

                              <div className="profile-item-bonus-badge">
                                Закреплён за Вами
                              </div>
                            </div>

                            <div className="profile-item-bonus-bottom">
                              <div className="profile-item-prices">
                                <span className="profile-item-price">
                                  <img
                                    src="/ui/star.PNG"
                                    className="profile-item-price-icon"
                                    alt=""
                                  />
                                  <span>{item.priceStars}</span>
                                </span>

                                {item.priceGems && (
                                  <span className="profile-item-price">
                                    <img
                                      src="/ui/ton.PNG"
                                      className="profile-item-price-icon"
                                      alt=""
                                    />
                                    <span>{item.priceGems}</span>
                                  </span>
                                )}
                              </div>

                              <div className="profile-item-bonus-timer">
                                {formatTimer(bonusTimeLeftMs)}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="profile-item-name">{item.dropName}</div>

                            <div className="profile-item-prices">
                              <span className="profile-item-price">
                                <img
                                  src="/ui/star.PNG"
                                  className="profile-item-price-icon"
                                  alt=""
                                />
                                <span>{item.priceStars}</span>
                              </span>

                              {item.priceGems && (
                                <span className="profile-item-price">
                                  <img
                                    src="/ui/ton.PNG"
                                    className="profile-item-price-icon"
                                    alt=""
                                  />
                                  <span>{item.priceGems}</span>
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="profile-item-actions">
                        <button
                          type="button"
                          className="profile-item-action-btn secondary"
                          onClick={isLockedBonus ? handleLockedGiftAction : undefined}
                          disabled={!isLockedBonus}
                        >
                          Вывести
                        </button>

                        <button
                          type="button"
                          className="profile-item-action-btn primary"
                          onClick={
                            isLockedBonus
                              ? handleLockedGiftAction
                              : () => handleSellItem(item.id)
                          }
                          disabled={!isLockedBonus && sellingItemId === item.id}
                        >
                          {isLockedBonus
                            ? "Продать"
                            : sellingItemId === item.id
                              ? "..."
                              : "Продать"}
                        </button>
                      </div>
                    </div>
                  )
                })}
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

      {isBonusSheetOpen && (
        <div
          className="bonus-sheet-overlay"
          onClick={() => setIsBonusSheetOpen(false)}
        >
          <div
            className="bonus-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bonus-sheet-handle" />

            <div className="bonus-sheet-title">
              Активируйте подарок
            </div>

            <div className="bonus-conditions-list">
              <div className="bonus-condition-row">
                <div className="bonus-condition-left">
                  <button
                    type="button"
                    className={`bonus-check-circle ${channelDone ? "done" : ""}`}
                    onClick={handleCheckChannel}
                    disabled={isCheckingChannel}
                  >
                    {channelDone ? "✓" : ""}
                  </button>

                  <div className="bonus-condition-text-wrap">
                    <div className="bonus-condition-text">
                      Подписаться на канал @ufomochannel
                    </div>

                    {!channelDone && (
                      <button
                        type="button"
                        className="bonus-link-btn"
                        onClick={handleOpenChannel}
                      >
                        Открыть канал
                      </button>
                    )}
                  </div>
                </div>

                <div className="bonus-condition-progress">
                  {channelDone ? "1/1" : "0/1"}
                </div>
              </div>

              <div className="bonus-condition-row">
                <div className="bonus-condition-left">
                  <div className={`bonus-check-circle ${friendDone ? "done" : ""}`}>
                    {friendDone ? "✓" : ""}
                  </div>

                  <div className="bonus-condition-text-wrap">
                    <div className="bonus-condition-text">
                      Пригласить друга
                    </div>
                  </div>
                </div>

                <div className="bonus-condition-progress">
                  {friendDone ? "1/1" : "0/1"}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="bonus-claim-btn"
              disabled
            >
              {conditionsDone ? "Готово к активации на сервере" : "Выполните условия"}
            </button>
          </div>
        </div>
      )}

      <div className="bottom-nav-shell">
        <div className="bottom-nav">
          <div
            className="nav-item"
            onClick={() => {
              triggerHaptic("light")
              navigate("/bonus")
            }}
          >
            <img src="/ui/cupnav.PNG" alt="" className="nav-icon" />
            <span>Награды</span>
          </div>

          <div
            className="nav-item"
            onClick={() => {
              triggerHaptic("light")
              navigate("/giveaways")
            }}
          >
            <img src="/ui/frnav.PNG" alt="" className="nav-icon" />
            <span>Друзья</span>
          </div>

          <div
            className="nav-item"
            onClick={() => {
              triggerHaptic("light")
              navigate("/")
            }}
          >
            <img src="/ui/main.PNG" alt="" className="nav-icon" />
            <span>Главная</span>
          </div>
        </div>

        <div className="floating-profile active">
          {user?.photoUrl ? (
            <img
              src={user.photoUrl}
              alt={user.username}
              className="floating-profile-image"
              draggable={false}
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="floating-profile-fallback">
              {(user?.username?.[0] || "G").toUpperCase()}
            </span>
          )}
        </div>
      </div>

      <DepositMenu
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
      />
    </div>
  )
}

export default Profile
