import { useState } from "react"
import { depositBalance } from "../api"
import { useUser } from "../context/UserContext"

function DepositMenu({ isOpen, onClose }) {
  const { user, refreshUser } = useUser()

  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const depositOptions = [
    100,
    250,
    500,
    1000,
    2500,
    5000,
  ]

  const handleDeposit = async (amount) => {
    if (!user?.id || isLoading) return

    try {
      setIsLoading(true)

      await depositBalance({
        telegram_id: user.id,
        amount,
      })

      await refreshUser()

      onClose()
    } catch (err) {
      console.error("DEPOSIT ERROR:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="deposit-overlay" onClick={onClose}>
      <div
        className="deposit-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="deposit-handle" />

        <div className="deposit-title">
          Пополнить баланс
        </div>

        <div className="deposit-grid">
          {depositOptions.map((amount) => (
            <button
              key={amount}
              className="deposit-option"
              onClick={() => handleDeposit(amount)}
              disabled={isLoading}
            >
              <img
                src="/ui/star.PNG"
                className="deposit-star"
                alt=""
              />

              <span>{amount}</span>
            </button>
          ))}
        </div>

        <button
          className="deposit-close"
          onClick={onClose}
        >
          Закрыть
        </button>
      </div>
    </div>
  )
}

export default DepositMenu
