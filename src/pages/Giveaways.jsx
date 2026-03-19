import { useNavigate } from "react-router-dom"
import Lottie from "lottie-react"

import friendsAnimation from "../assets/animations/frms.json"
import "../style.css"

function Giveaways() {
  const navigate = useNavigate()

  return (
    <div className="app">
      <div className="friends-page">
        <button
          type="button"
          className="friends-hero-badge"
        >
          ЗАРАБАТЫВАЙ С UFOMO
        </button>

        <div className="friends-hero-visual">
          <Lottie
            animationData={friendsAnimation}
            loop
            autoplay
            className="friends-hero-lottie"
          />
        </div>

        <div className="friends-hero-text">
          Приглашай друзей и получай 15% с их пополнения на свой баланс
        </div>

        <button
          type="button"
          className="friends-invite-btn"
        >
          Пригласить друга
        </button>

        <div className="friends-stats-grid">
          <div className="friends-stat-card">
            <div className="friends-stat-top">
              <img
                src="/ui/ref-total.png"
                alt=""
                className="friends-stat-icon"
                draggable={false}
              />
              <span className="friends-stat-value">0</span>
            </div>

            <div className="friends-stat-label">
              Всего заработано
            </div>
          </div>

          <div className="friends-stat-card">
            <div className="friends-stat-top">
              <img
                src="/ui/ref-withdrawn.png"
                alt=""
                className="friends-stat-icon"
                draggable={false}
              />
              <span className="friends-stat-value">0</span>
            </div>

            <div className="friends-stat-label">
              Выведено
            </div>
          </div>
        </div>

        <div className="friends-withdraw-card">
          <div className="friends-withdraw-top">
            <div className="friends-withdraw-title-row">
              <img
                src="/ui/star.PNG"
                alt=""
                className="friends-withdraw-star"
                draggable={false}
              />
              <span className="friends-withdraw-value">0</span>
            </div>

            <div className="friends-withdraw-label">
              Доступно для вывода
            </div>
          </div>

          <button
            type="button"
            className="friends-withdraw-btn"
            disabled
          >
            Вывести
          </button>
        </div>
      </div>

      <div className="bottom-nav">
        <div
          className="nav-item"
          onClick={() => navigate("/bonus")}
        >
          Награды
        </div>

        <div className="nav-item active">
          Друзья
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

export default Giveaways
