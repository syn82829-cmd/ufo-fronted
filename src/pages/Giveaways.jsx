import { useNavigate } from "react-router-dom"
import "../style.css"

function Giveaways() {

  const navigate = useNavigate()

  return (
    <div className="app">

      <div className="empty-page">

        <div className="empty-glass">
          Друзья — скоро 🚀
        </div>

      </div>

      <div className="bottom-nav">

        <div
          className="nav-item"
          onClick={() => navigate("/bonus")}
        >
          Вознаграждения
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
