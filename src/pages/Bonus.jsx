import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  checkBonusChannel,
  claimBonus,
  getBonusState,
} from "../api"
import { useUser } from "../context/UserContext"
import "../style.css"

function Bonus() {
  const navigate = useNavigate()
  const { user, refreshUser } = useUser()

  const [bonusState, setBonusState] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckingChannel, setIsCheckingChannel] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)

  useEffect(() => {
    async function loadBonusState() {
      if (!user?.id || user.id === "—") {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const data = await getBonusState(user.id)
        setBonusState(data)
      } catch (err) {
        console.error("BONUS STATE LOAD ERROR:", err)
        setBonusState(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadBonusState()
  }, [user?.id])

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
        conditionsMet: Boolean(result?.channelSubscribed) && Boolean(prev?.friendInvited),
        canClaim:
          Boolean(result?.channelSubscribed) &&
          Boolean(prev?.friendInvited) &&
          Number(prev?.timeLeftMs || 0) <= 0,
      }))
    } catch (err) {
      console.error("BONUS CHANNEL CHECK ERROR:", err)
    } finally {
      setIsCheckingChannel(false)
    }
  }

  const handleClaim = async () => {
    if (!user?.id || isClaiming || !bonusState?.canClaim) return

    try {
      setIsClaiming(true)

      await claimBonus(user.id)
      await refreshUser().catch(() => {})

      const updatedState = await getBonusState(user.id)
      setBonusState(updatedState)
    } catch (err) {
      console.error("BONUS CLAIM ERROR:", err)
    } finally {
      setIsClaiming(false)
    }
  }

  const channelDone = Boolean(bonusState?.channelSubscribed)
  const friendDone = Boolean(bonusState?.friendInvited)
  const canClaim = Boolean(bonusState?.canClaim)

  return (
    <div className="app">
      <div className="bonus-page">
        <div className="bonus-header-actions">
          <button
            type="button"
            className="bonus-header-btn bonus-back-btn"
            onClick={() => navigate(-1)}
          >
            <img src="/ui/back.PNG" className="bonus-header-icon" alt="" draggable={false} />
          </button>
        </div>

        <div className="bonus-card">
          <div className="bonus-card-visual">
            <div className="bonus-gift-placeholder">
              🎁
            </div>
          </div>

          <div className="bonus-card-title">
            Ежедневный Бесплатный подарок!
          </div>

          {isLoading ? (
            <div className="bonus-loading">
              Загрузка бонуса...
            </div>
          ) : (
            <>
              <div className="bonus-conditions-title">
                Условия:
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
                onClick={handleClaim}
                disabled={!canClaim || isClaiming}
              >
                {isClaiming ? "Загрузка..." : canClaim ? "Забрать" : "Выполните условия"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bottom-nav">
        <div className="nav-item active">
          Бонусы
        </div>

        <div
          className="nav-item"
          onClick={() => navigate("/giveaways")}
        >
          Розыгрыши
        </div>

        <div
          className="nav-item"
          onClick={() => navigate("/")}
        >
          Главная
        </div>

        <div
          className="nav-item"
          onClick={() => navigate("/profile")}
        >
          Профиль
        </div>
      </div>
    </div>
  )
}

export default Bonus
