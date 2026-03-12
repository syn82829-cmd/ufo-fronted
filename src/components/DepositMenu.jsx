import { createStarsInvoice } from "../api"
import { useUser } from "../context/UserContext"

function DepositMenu({ isOpen, onClose }) {
  const { user } = useUser()

  if (!isOpen) return null

  const handleBuy = async (amount) => {
    try {
      const result = await createStarsInvoice({
        telegram_id: user.id,
        amount,
      })

      window.Telegram.WebApp.openInvoice(result.invoiceLink)
    } catch (err) {
      console.error("STARS ERROR:", err)
    }
  }

  return (
    <div className="deposit-overlay" onClick={onClose}>
      <div className="deposit-menu" onClick={(e) => e.stopPropagation()}>
        <div className="deposit-title">Пополнение</div>

        <button onClick={() => handleBuy(100)}>100 ⭐</button>
        <button onClick={() => handleBuy(500)}>500 ⭐</button>
        <button onClick={() => handleBuy(1000)}>1000 ⭐</button>

        <button className="deposit-close" onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>
  )
}

export default DepositMenu
