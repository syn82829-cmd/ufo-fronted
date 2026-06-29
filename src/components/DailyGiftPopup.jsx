import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Lottie from "lottie-react"

import { getBonusState } from "../api"
import { useUser } from "../context/UserContext"

const HIDE_DAILY_GIFT_KEY = "ufomo_hide_daily_gift_popup_date"
const DAILY_GIFT_SESSION_KEY = "ufomo_daily_gift_popup_shown"

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function hideDailyGiftForToday() {
  localStorage.setItem(HIDE_DAILY_GIFT_KEY, getTodayKey())
}

function DailyGiftPopup() {
  const navigate = useNavigate()
  const { user } = useUser()

  const [isOpen, setIsOpen] = useState(false)
  const [dontShowToday, setDontShowToday] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [giftAnimation, setGiftAnimation] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadBonusPopup() {
      if (!user?.id || user.id === "—") {
        setIsLoading(false)
        return
      }

      try {
        const today = getTodayKey()

        const hiddenToday =
          localStorage.getItem(HIDE_DAILY_GIFT_KEY) === today

        if (cancelled) return

        setDontShowToday(hiddenToday)

        if (hiddenToday) {
          setIsOpen(false)
          setIsLoading(false)
          return
        }

        const sessionShown =
          sessionStorage.getItem(DAILY_GIFT_SESSION_KEY) === "true"

        if (sessionShown) {
          setIsOpen(false)
          setIsLoading(false)
          return
        }

        await getBonusState(user.id)

        const animationModule = await import("../assets/animations/podarok.json")

        if (cancelled) return

        setGiftAnimation(animationModule.default || animationModule)
        setIsOpen(true)
        sessionStorage.setItem(DAILY_GIFT_SESSION_KEY, "true")
      } catch (error) {
        console.error("DAILY GIFT POPUP ERROR:", error)
        setIsOpen(false)
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadBonusPopup()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  const handleToggleDontShowToday = () => {
    const nextValue = !dontShowToday

    setDontShowToday(nextValue)

    if (nextValue) {
      hideDailyGiftForToday()
    } else {
      localStorage.removeItem(HIDE_DAILY_GIFT_KEY)
    }
  }

  const handleClose = () => {
    if (dontShowToday) {
      hideDailyGiftForToday()
    }

    setIsOpen(false)
  }

  const handleMainAction = () => {
    if (dontShowToday) {
      hideDailyGiftForToday()
      setIsOpen(false)
      return
    }

    setIsOpen(false)
    navigate("/bonus")
  }

  if (isLoading || !isOpen) return null

  return (
    <div className="daily-gift-overlay" onClick={handleClose}>
      <div className="daily-gift-popup" onClick={(e) => e.stopPropagation()}>
        <div className="daily-gift-visual">
          {giftAnimation && (
            <Lottie
              animationData={giftAnimation}
              loop
              autoplay
              className="daily-gift-lottie"
            />
          )}
        </div>

        <div className="daily-gift-title">
          Ежедневный подарок!
        </div>

        <div className="daily-gift-subtitle">
          Заходи каждый день и забирай подарок бесплатно.
        </div>

        <div className="daily-gift-bottom">
          <button
            type="button"
            className={`daily-gift-checkbox ${dontShowToday ? "active" : ""}`}
            onClick={handleToggleDontShowToday}
            aria-label="Не показывать сегодня"
          >
            {dontShowToday ? "✓" : ""}
          </button>

          <div
            className="daily-gift-checkbox-label"
            onClick={handleToggleDontShowToday}
            role="button"
          >
            Не показывать сегодня
          </div>

          <button
            type="button"
            className="daily-gift-claim-btn"
            onClick={handleMainAction}
          >
            {dontShowToday ? "Готово" : "Забрать"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DailyGiftPopup
