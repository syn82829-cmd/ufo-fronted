import { useMemo, useState } from "react"
import { createStarsInvoice } from "../api"
import { useUser } from "../context/UserContext"
import { triggerHaptic } from "../utils/haptics"

function DepositMenu({ isOpen, onClose }) {
  const { user, refreshUser } = useUser()

  const [isLoading, setIsLoading] = useState(false)
  const [amount, setAmount] = useState("")

  const depositOptions = useMemo(() => [100, 250, 500, 1000, 2500, 5000], [])

  if (!isOpen) return null

  const numericAmount = Math.max(0, Number(amount || 0))
  const canDeposit = numericAmount > 0 && !isLoading

  const handleOptionClick = (value) => {
    triggerHaptic("light")
    setAmount(String(value))
  }

  const handleChange = (e) => {
    triggerHaptic("light")
    const digitsOnly = e.target.value.replace(/[^\d]/g, "")
    setAmount(digitsOnly)
  }

  const handleMainAction = async () => {
    if (!canDeposit) {
      triggerHaptic("light")
      onClose()
      return
    }

    if (!user?.id) return

    try {
      triggerHaptic("medium")

      setIsLoading(true)

      const result = await createStarsInvoice({
        telegram_id: user.id,
        amount: numericAmount,
      })

      const tg = window.Telegram?.WebApp

      if (!tg?.openInvoice) {
        throw new Error("Telegram invoice is not available")
      }

      tg.openInvoice(result.invoiceLink, async (status) => {
        if (status === "paid") {
          triggerHaptic("success")

          await refreshUser().catch(() => {})
          setAmount("")
          onClose()
        }

        if (status === "cancelled") {
          triggerHaptic("light")
        }

        if (status === "failed") {
          triggerHaptic("error")
        }
      })
    } catch (err) {
      triggerHaptic("error")
      console.error("STARS INVOICE ERROR:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="deposit-overlay"
      onClick={() => {
        triggerHaptic("light")
        onClose()
      }}
    >
      <div className="deposit-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="deposit-handle" />

        <div className="deposit-title">Пополнить баланс</div>

        <div className="deposit-input-wrap">
          <img src="/ui/star.PNG" className="deposit-input-icon" alt="" />
          <input
            type="text"
            inputMode="numeric"
            className="deposit-input"
            value={amount}
            onChange={handleChange}
            placeholder="Введите сумму пополнения"
            disabled={isLoading}
          />
        </div>

        <div className="deposit-grid">
          {depositOptions.map((value) => (
            <button
              key={value}
              className={`deposit-option ${String(value) === amount ? "active" : ""}`}
              onClick={() => handleOptionClick(value)}
              disabled={isLoading}
            >
              <img src="/ui/star.PNG" className="deposit-star" alt="" />
              <span>{value}</span>
            </button>
          ))}
        </div>

        <button
          className="deposit-close"
          onClick={handleMainAction}
          disabled={isLoading}
        >
          {isLoading ? "Загрузка..." : canDeposit ? "Пополнить" : "Закрыть"}
        </button>
      </div>
    </div>
  )
}

export default DepositMenu
