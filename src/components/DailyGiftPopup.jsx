import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Lottie from "lottie-react"

import { getBonusState } from "../api"
import { useUser } from "../context/UserContext"
import podarokAnimation from "../assets/animations/podarok.json"

function DailyGiftPopup() {
  const navigate = useNavigate()
  const { user } = useUser()

  const [isOpen, setIsOpen] = useState(false)
  const [dontShowToday, setDontShowToday] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadBonusPopup() {
      if (!user?.id || user.id === "—") {
        setIsLoading(false)
        return
      }

      try {
        const today = new Date().toISOString().slice(0, 10)

        const hiddenToday =
          localStorage.getItem("ufomo_hide_daily_gift_popup_date") === today

        setDontShowToday(hiddenToday)

        if (hiddenToday) {
          setIsOpen(false)
          setIsLoading(false)
          return
        }

        const sessionShown =
          sessionStorage.getItem("ufomo_daily_gift_popup_shown") === "true"

        if (sessionShown) {
          setIsOpen(false)
          setIsLoading(false)
          return
        }

        const bonusState = await getBonusState(user.id)
        const isAvailable = bonusState?.canClaim === true

        if (!isAvailable) {
          setIsOpen(false)
          setIsLoading(false)
          return
        }

        setIsOpen(true)
        sessionStorage.setItem("ufomo_daily_gift_popup_shown", "true")
      } catch (error) {
        console.error("DAILY GIFT POPUP ERROR:", error)
        setIsOpen(false)
      } finally {
        setIsLoading(false)
      }
    }

    loadBonusPopup()
  }, [user?.id])

  const handleToggleDontShowToday = () => {
    const today = new Date().toISOString().slice(0, 10)
    const nextValue = !dontShowToday

    setDontShowToday(nextValue)

    if (nextValue) {
      localStorage.setItem("ufomo_hide_daily_gift_popup_date", today)
    } else {
      localStorage.removeItem("ufomo_hide_daily_gift_popup_date")
    }
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleClaimClick = () => {
    setIsOpen(false)
    navigate("/bonus")
  }

  if (isLoading || !isOpen) return null

  return (
    <div className="daily-gift-overlay" onClick={handleClose}>
      <div className="daily-gift-popup" onClick={(e) => e.stopPropagation()}>
        <div className="daily-gift-visual">
          <Lottie
            animationData={podarokAnimation}
            loop
            autoplay
            className="daily-gift-lottie"
          />
        </div>

        <div className="daily-gift-title">
          Ваш бесплатный подарок!
        </div>

        <div className="daily-gift-subtitle">
          Заходите каждый день и забирайте новый подарок бесплатно.
        </div>

        <div className="daily-gift-bottom">
          <button
            type="button"
            className={`daily-gift-checkbox ${dontShowToday ? "active" : ""}`}
            onClick={handleToggleDontShowToday}
          >
            {dontShowToday ? "✓" : ""}
          </button>

          <div className="daily-gift-checkbox-label">
            Не показывать сегодня
          </div>

          <button
            type="button"
            className="daily-gift-claim-btn"
            onClick={handleClaimClick}
          >
            Забрать
          </button>
        </div>
      </div>
    </div>
  )
}

export default DailyGiftPopup
