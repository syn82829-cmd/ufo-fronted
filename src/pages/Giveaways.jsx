import { useNavigate } from "react-router-dom"
import "../style.css"

function Giveaways() {

  const navigate = useNavigate()

  return (
    <div className="app">

      <div className="empty-page">

        <div className="empty-glass">
          Розыгрыши — скоро 🚀
        </div>

      </div>

      <div className="bottom-nav">

        <div
          className="nav-item"
          onClick={() => navigate("/bonus")}
        >
          Бонусы
        </div>

        <div className="nav-item active">
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

export default Giveaways
