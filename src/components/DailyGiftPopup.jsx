import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getBonusState } from "../api"
import { useUser } from "../context/UserContext"

function DailyGiftPopup() {
  const navigate = useNavigate()
  const { user } = useUser()

  const [isOpen, setIsOpen] = useState(false)
  const [dontShow, setDontShow] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadBonusPopup() {
      if (!user?.id || user.id === "—") {
        setIsLoading(false)
        return
      }

      try {
        const hidden = localStorage.getItem("ufomo_hide_daily_gift_popup") === "true"
        setDontShow(hidden)

        if (hidden) {
          setIsOpen(false)
          setIsLoading(false)
          return
        }

        await getBonusState(user.id)
        setIsOpen(true)
      } catch (error) {
        console.error("DAILY GIFT POPUP ERROR:", error)
        setIsOpen(false)
      } finally {
        setIsLoading(false)
      }
    }

    loadBonusPopup()
  }, [user?.id])

  const handleToggleDontShow = () => {
    const nextValue = !dontShow
    setDontShow(nextValue)
    localStorage.setItem("ufomo_hide_daily_gift_popup", String(nextValue))
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
          <div className="daily-gift-placeholder">
            🎁
          </div>
        </div>

        <div className="daily-gift-title">
          Ежедневный Бесплатный подарок!
        </div>

        <div className="daily-gift-subtitle">
          Заходи каждый день и забирай подарок бесплатно!
        </div>

        <div className="daily-gift-bottom">
          <button
            type="button"
            className={`daily-gift-checkbox ${dontShow ? "active" : ""}`}
            onClick={handleToggleDontShow}
          >
            {dontShow ? "✓" : ""}
          </button>

          <div className="daily-gift-checkbox-label">
            Больше не показывать
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
