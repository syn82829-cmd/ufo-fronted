import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Lottie from "lottie-react"

import { createUser } from "../api"
import CaseCard from "../components/CaseCard"
import ufoAnim from "../animations/ufo.json"
import dailyGiftAnim from "../animations/dailygift.json"
import tiktokAnim from "../animations/tiktok.json"

import "../style.css"

function Home() {
  const navigate = useNavigate()

  const [user, setUser] = useState({
    id: "—",
    username: "Гость",
    balance: 0,
  })

  const [activeSlide, setActiveSlide] = useState(0)

  const cases = [
    { id: "firstpepe", image: "/cases/case1.png.PNG", name: "First Pepe", price: 9999 },
    { id: "crash", image: "/cases/case2.png.PNG", name: "Crash", price: 7999 },
    { id: "darkmatter", image: "/cases/case3.png.PNG", name: "Dark Matter", price: 4999 },
    { id: "godparticle", image: "/cases/case4.png.PNG", name: "God Particle", price: 3599 },
    { id: "purplehole", image: "/cases/case5.png.PNG", name: "Purple Hole", price: 1599 },
    { id: "spacetrash", image: "/cases/case6.png.PNG", name: "Space Trash", price: 599 },
    { id: "starfall", image: "/cases/case7.png.PNG", name: "Starfall", price: 499 },
    { id: "randomcase", image: "/cases/case8.png.PNG", name: "Random Case", price: 999 },
  ]

  const slides = [
    {
      id: "crash",
      title: "UFO Crash",
      subtitle: "> x1.63",
      buttonText: "Запустить НЛО",
      animation: ufoAnim,
      action: () => navigate("/crash"),
      theme: "crash",
    },
    {
      id: "dailygift",
      title: "Получи ежедневный подарок!",
      subtitle: "Подпишись на канал и забирай бонус каждый день",
      buttonText: "Забрать",
      animation: dailyGiftAnim,
      action: () => navigate("/bonus"),
      theme: "gift",
    },
    {
      id: "tiktok",
      title: "Получи любой NFT подарок за нарезки с проектом!",
      subtitle: "Снимай контент, отмечай проект и забирай награду",
      buttonText: "Интересно",
      animation: tiktokAnim,
      action: () => navigate("/giveaways"),
      theme: "tiktok",
    },
  ]

  /* ============================= */
  /* INIT USER */
  /* ============================= */
  useEffect(() => {
    async function initUser() {
      let tgUser = null

      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp
        tg.ready()
        tg.expand()
        tgUser = tg.initDataUnsafe?.user
      }

      if (!tgUser) {
        tgUser = {
          id: 999999999,
          username: "test_user",
        }
      }

      try {
        const dbUser = await createUser({
          id: tgUser.id,
          username: tgUser.username || "",
        })

        setUser({
          id: dbUser.telegram_id,
          username: dbUser.username || "Гость",
          balance: dbUser.balance ?? 0,
        })
      } catch (err) {
        console.error("INIT USER ERROR:", err)
      }
    }

    initUser()
  }, [])

  /* ============================= */
  /* AUTO SLIDER */
  /* ============================= */
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [slides.length])

  return (
    <div className="app">
      {/* TOP CAROUSEL */}
      <div className="crash-panel">
        <div
          className="crash-slider-track"
          style={{ transform: `translateX(-${activeSlide * 100}%)` }}
        >
          {slides.map((slide) => (
            <div key={slide.id} className={`crash-slide crash-slide-${slide.theme}`}>
              <div className="crash-slide-content">
                <div className="crash-slide-left">
                  <div className={`slide-lottie slide-lottie-${slide.theme}`} aria-hidden="true">
                    <Lottie animationData={slide.animation} loop autoplay />
                  </div>
                </div>

                <div className="crash-slide-right">
                  <div className="crash-title">{slide.title}</div>
                  <div className="multiplier">{slide.subtitle}</div>

                  <button
                    className="launch-btn"
                    type="button"
                    onClick={slide.action}
                  >
                    {slide.buttonText}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="crash-dots">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className={`crash-dot ${activeSlide === index ? "active" : ""}`}
              onClick={() => setActiveSlide(index)}
              aria-label={`Перейти к слайду ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Cases */}
      <div className="cases-section">
        {cases.map((item) => (
          <CaseCard
            key={item.id}
            caseItem={item}
            onClick={() => navigate(`/case/${item.id}`)}
          />
        ))}
      </div>

      {/* Bottom nav */}
      <div className="bottom-nav">
        <div className="nav-item" onClick={() => navigate("/bonus")}>
          Бонусы
        </div>

        <div className="nav-item" onClick={() => navigate("/giveaways")}>
          Розыгрыши
        </div>

        <div className="nav-item active">Главная</div>

        <div className="nav-item" onClick={() => navigate("/profile")}>
          Профиль
        </div>
      </div>
    </div>
  )
}

export default Home
