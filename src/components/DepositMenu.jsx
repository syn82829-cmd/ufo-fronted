import { useMemo, useState } from "react"
import { createStarsInvoice } from "../api"
import { useUser } from "../context/UserContext"
import { triggerHaptic } from "../utils/haptics"

const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms))

function DepositMenu({ isOpen, onClose }) {
  const { user, refreshUser } = useUser()

  const [isLoading, setIsLoading] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState("idle")
  const [amount, setAmount] = useState("")

  const depositOptions = useMemo(() => [100, 250, 500, 1000, 2500, 5000], [])

  if (!isOpen) return null

  const numericAmount = Math.max(0, Number(amount || 0))
  const canDeposit = numericAmount > 0 && !isLoading

  const handleOptionClick = (value) => {
    triggerHaptic("light")
    setPaymentStatus("idle")
    setAmount(String(value))
  }

  const handleChange = (e) => {
    triggerHaptic("light")
    setPaymentStatus("idle")
    const digitsOnly = e.target.value.replace(/[^\d]/g, "")
    setAmount(digitsOnly)
  }

  const closeSheet = () => {
    setPaymentStatus("idle")
    onClose()
  }

  const refreshUserAfterPayment = async () => {
    const delays = [0, 700, 1400, 2400]

    for (const delay of delays) {
      if (delay > 0) {
        await wait(delay)
      }

      await refreshUser().catch(() => {})
    }
  }

  const handleMainAction = async () => {
    if (!canDeposit) {
      triggerHaptic("light")
      closeSheet()
      return
    }

    if (!user?.id) return

    try {
      triggerHaptic("medium")

      setIsLoading(true)
      setPaymentStatus("creating")

      const result = await createStarsInvoice({
        telegram_id: user.id,
        amount: numericAmount,
      })

      const tg = window.Telegram?.WebApp

      if (!tg?.openInvoice) {
        throw new Error("Telegram invoice is not available")
      }

      setPaymentStatus("invoice")

      tg.openInvoice(result.invoiceLink, async (status) => {
        if (status === "paid") {
          triggerHaptic("success")
          setIsLoading(true)
          setPaymentStatus("refreshing")

          await refreshUserAfterPayment()

          setAmount("")
          setPaymentStatus("done")

          window.setTimeout(() => {
            setIsLoading(false)
            closeSheet()
          }, 450)

          return
        }

        if (status === "cancelled") {
          triggerHaptic("light")
          setPaymentStatus("idle")
        }

        if (status === "failed") {
          triggerHaptic("error")
          setPaymentStatus("failed")
        }

        setIsLoading(false)
      })
    } catch (err) {
      triggerHaptic("error")
      console.error("STARS INVOICE ERROR:", err)
      setPaymentStatus("failed")
      setIsLoading(false)
    }
  }

  const mainButtonText = (() => {
    if (paymentStatus === "creating") return "Готовим оплату…"
    if (paymentStatus === "invoice") return "Подтвердите в Telegram…"
    if (paymentStatus === "refreshing") return "Платёж принят, обновляем баланс…"
    if (paymentStatus === "done") return "Баланс обновлён"
    if (paymentStatus === "failed") return "Попробовать ещё раз"
    if (isLoading) return "Загрузка…"
    return canDeposit ? "Пополнить" : "Закрыть"
  })()

  return (
    <div
      className="deposit-overlay"
      onClick={() => {
        if (isLoading) return

        triggerHaptic("light")
        closeSheet()
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

        {paymentStatus === "refreshing" && (
          <div className="deposit-status-text">
            Stars списались, ждём подтверждение от Telegram…
          </div>
        )}

        <button
          className="deposit-close"
          onClick={handleMainAction}
          disabled={isLoading && paymentStatus !== "failed"}
        >
          {mainButtonText}
        </button>
      </div>
    </div>
  )
}

export default DepositMenu
