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
