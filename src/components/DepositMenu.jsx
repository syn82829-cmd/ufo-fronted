import { useMemo, useState } from "react"
import { createStarsInvoice } from "../api"
import { useUser } from "../context/UserContext"
import { triggerHaptic } from "../utils/haptics"

const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms))

function DepositMenu({ isOpen, onClose }) {
  const { user, refreshUser } = useUser()

  const [isLoading, setIsLoading] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState("idle")
  const [amount, setAmount] = useState("25")
  const [activeTab, setActiveTab] = useState("stars")

  const depositOptions = useMemo(() => [
    { value: 25 },
    { value: 50 },
    { value: 100 },
    { value: 250, bonus: "+2%" },
    { value: 500, bonus: "+5%" },
    { value: 1000, bonus: "+10%" },
    { value: 2500, bonus: "+15%" },
    { value: 5000, bonus: "+25%" },
  ], [])

  if (!isOpen) return null

  const numericAmount = Math.max(0, Number(amount || 0))
  const canDeposit = numericAmount > 0 && !isLoading && activeTab === "stars"

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

  const setMaxAmount = () => {
    triggerHaptic("light")
    setPaymentStatus("idle")
    setAmount("5000")
  }

  const handleMainAction = async () => {
    if (!canDeposit) return
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

          setAmount("25")
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
    return "Пополнить"
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

        <div className="deposit-header-row">
          <div className="deposit-title">Пополнить баланс</div>

          <button
            type="button"
            className="deposit-x-btn"
            onClick={() => {
              if (isLoading) return
              triggerHaptic("light")
              closeSheet()
            }}
          >
            ×
          </button>
        </div>

        <div className="deposit-tabs">
          <button
            type="button"
            className={`deposit-tab ${activeTab === "stars" ? "active" : ""}`}
            onClick={() => {
              triggerHaptic("light")
              setActiveTab("stars")
            }}
          >
            Stars
          </button>

          <button
            type="button"
            className={`deposit-tab ${activeTab === "gifts" ? "active" : ""}`}
            onClick={() => {
              triggerHaptic("light")
              setActiveTab("gifts")
            }}
          >
            Подарки
          </button>
        </div>

        {activeTab === "stars" ? (
          <>
            <div className="deposit-label">Введите сумму в звёздах:</div>

            <div className="deposit-input-wrap">
              <img src="/ui/star.PNG" className="deposit-input-icon" alt="" />
              <input
                type="text"
                inputMode="numeric"
                className="deposit-input"
                value={amount}
                onChange={handleChange}
                placeholder="25"
                disabled={isLoading}
              />

              <button
                type="button"
                className="deposit-max-btn"
                onClick={setMaxAmount}
                disabled={isLoading}
              >
                Макс
              </button>
            </div>

            <div className="deposit-receive-line">
              Вы получите {numericAmount || 0}
              <img src="/ui/star.PNG" className="deposit-receive-star" alt="" />
            </div>

            <div className="deposit-options-scroll">
              {depositOptions.map((option) => (
                <button
                  key={option.value}
                  className={`deposit-option ${String(option.value) === amount ? "active" : ""}`}
                  onClick={() => handleOptionClick(option.value)}
                  disabled={isLoading}
                >
                  {option.bonus && <span className="deposit-option-bonus">{option.bonus}</span>}
                  <span>{option.value}</span>
                  <img src="/ui/star.PNG" className="deposit-star" alt="" />
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
              disabled={!canDeposit || (isLoading && paymentStatus !== "failed")}
            >
              {mainButtonText}
            </button>
          </>
        ) : (
          <div className="deposit-gifts-placeholder">
            <div className="deposit-gifts-title">Подарки скоро будут доступны</div>
            <div className="deposit-gifts-text">
              Сейчас можно пополнить баланс через Stars.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DepositMenu
