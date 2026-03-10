import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getInventory, sellInventoryItem, depositBalance } from "../api"
import { useUser } from "../context/UserContext"
import "../style.css"

function Profile() {
  const navigate = useNavigate()
  const { user, refreshUser } = useUser()

  const [inventory, setInventory] = useState([])
  const [isInventoryLoading, setIsInventoryLoading] = useState(true)
  const [sellingItemId, setSellingItemId] = useState(null)
  const [isDepositing, setIsDepositing] = useState(false)

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

  const handleDeposit = async () => {
    if (!user?.id || isDepositing) return

    try {
      setIsDepositing(true)

      await depositBalance({
        telegram_id: user.id,
        amount: 10000,
      })

      await refreshUser()
    } catch (err) {
      console.error("DEPOSIT ERROR:", err)
      await refreshUser().catch(() => {})
    } finally {
      setIsDepositing(false)
    }
  }

  const handleSellItem = async (itemId) => {
    if (!user?.id || !itemId || sellingItemId) return

    try {
      setSellingItemId(itemId)

      await sellInventoryItem({
        telegram_id: user.id,
        inventoryItemId: itemId,
      })

      setInventory((prev) => prev.filter((item) => item.id !== itemId))
      await refreshUser()
    } catch (err) {
      console.error("SELL INVENTORY ITEM ERROR:", err)
      await refreshUser().catch(() => {})
    } finally {
      setSellingItemId(null)
    }
  }

  return (
    <div className="app">
      <div className="profile-page">
        <div className="profile-card">
          <div className="profile-avatar">
            {user.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={user.username}
                className="profile-avatar-image"
                draggable={false}
              />
            ) : (
              <span className="profile-avatar-fallback">
                {(user.username?.[0] || "G").toUpperCase()}
              </span>
            )}
          </div>

          <div className="profile-info">
            <div className="profile-name">{user.username}</div>
            <div className="profile-id">ID: {user.id}</div>
          </div>

          <div className="profile-balance">
            <span className="profile-balance-value">{user.balance}</span>
            <img src="/ui/star.PNG" className="profile-balance-icon" alt="" />
          </div>
        </div>

        <div className="profile-actions">
          <button
            className="deposit-btn large"
            onClick={handleDeposit}
            disabled={isDepositing}
          >
            {isDepositing ? "Пополнение..." : "Пополнить"}
          </button>

          <button className="withdraw-btn large">Вывести</button>
        </div>

        <div className="inventory-wrapper">
          <div className="inventory-block">
            {isInventoryLoading ? (
              <div className="inventory-empty">Загрузка инвентаря…</div>
            ) : inventory.length === 0 ? (
              <div className="inventory-empty">В инвентаре пока пусто</div>
            ) : (
              <div className="profile-inventory-grid">
                {inventory.map((item) => (
                  <div key={item.id} className="profile-inventory-card">
                    <img
                      src={`/drops/${item.png}.png`}
                      alt={item.dropName}
                      className="profile-inventory-image"
                      draggable={false}
                    />

                    <div className="profile-inventory-name">{item.dropName}</div>

                    <div className="profile-inventory-prices">
                      <span className="profile-inventory-price-item">
                        <img src="/ui/star.PNG" className="profile-inventory-price-icon" alt="" />
                        <span>{item.priceStars}</span>
                      </span>

                      {item.priceGems && (
                        <span className="profile-inventory-price-item">
                          <img src="/ui/ton.PNG" className="profile-inventory-price-icon" alt="" />
                          <span>{item.priceGems}</span>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="profile-inventory-sell-btn"
                      onClick={() => handleSellItem(item.id)}
                      disabled={sellingItemId === item.id}
                    >
                      {sellingItemId === item.id ? "Продажа..." : "Продать"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bottom-nav">
        <div className="nav-item" onClick={() => navigate("/bonus")}>
          Бонусы
        </div>

        <div className="nav-item" onClick={() => navigate("/giveaways")}>
          Розыгрыши
        </div>

        <div className="nav-item" onClick={() => navigate("/")}>
          Главная
        </div>

        <div className="nav-item active">Профиль</div>
      </div>
    </div>
  )
}

export default Profile
