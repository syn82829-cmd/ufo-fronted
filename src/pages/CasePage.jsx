import { useParams, useNavigate } from "react-router-dom"
import { useState, useRef } from "react"
import Lottie from "lottie-react"

import { cases } from "../data/cases"
import { darkMatterAnimations } from "../data/animations"

/* =============================
   LOTTIE ID -> PNG filename map
============================= */
const PNG_BY_ID = {
  darkhelmet: "HeroicHelmet",
  gift: "LootBag",
  westside: "WestsideSign",
  lowrider: "Lowrider",
  watch: "SwissWatch",
  skull: "skull",
  dyson: "IonicDryer",
  batman: "batman",
  poizon: "poison",
  metla: "metla",
  ball: "ball",
  book: "book",
}

const pngSrc = (dropId) =>
  `/drops/${PNG_BY_ID[dropId] || dropId}.png`

function CasePage() {

  const { id } = useParams()
  const navigate = useNavigate()
  const caseData = cases[id]

  const [activeDrop, setActiveDrop] = useState(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState(null)
  const [reelItems, setReelItems] = useState([])

  const reelRef = useRef(null)
  const caseImgRef = useRef(null)

  if (!caseData) return <div className="app">Case config missing</div>

  /* =============================
     PRELOAD PNG
  ============================= */
  const preloadAll = async () => {
    const uniq = [...new Set(caseData.drops.map(d => pngSrc(d.id)))]
    await Promise.all(
      uniq.map(src =>
        new Promise(resolve => {
          const img = new Image()
          img.onload = resolve
          img.onerror = resolve
          img.src = src
        })
      )
    )
  }

  /* =============================
     GRID LOTTIE CLICK
  ============================= */
  const handleClick = (dropId) => {
    if (activeDrop === dropId) {
      setActiveDrop(null)
      setTimeout(() => setActiveDrop(dropId), 10)
    } else {
      setActiveDrop(dropId)
    }
  }

  /* =============================
     OPEN CASE
  ============================= */
  const openCase = async () => {

    if (isSpinning) return

    setResult(null)
    setIsSpinning(true)

    await preloadAll()

    // weighted random
    const pool = []
    caseData.drops.forEach(drop => {
      const w = drop.chance || 10
      for (let i = 0; i < w; i++) pool.push(drop.id)
    })

    const winner =
      pool[Math.floor(Math.random() * pool.length)]

    const totalItems = 80
    const winIndex = 60

    const items = []

    for (let i = 0; i < totalItems; i++) {
      if (i === winIndex) {
        items.push(winner)
      } else {
        const random =
          caseData.drops[
            Math.floor(Math.random() * caseData.drops.length)
          ].id
        items.push(random)
      }
    }

    setReelItems(items)

    requestAnimationFrame(() => {

      const reel = reelRef.current
      if (!reel) return

      const item = reel.querySelector(".roulette-item")
      const gap = parseInt(
        getComputedStyle(reel).gap
      ) || 20

      const itemWidth = item.offsetWidth + gap
      const containerWidth =
        caseImgRef.current?.offsetWidth || 320

      const offset =
        winIndex * itemWidth -
        containerWidth / 2 +
        itemWidth / 2

      reel.style.transition = "none"
      reel.style.transform = "translateX(0px)"

      requestAnimationFrame(() => {
        reel.style.transition =
          "transform 5.2s cubic-bezier(0.12,0.75,0.15,1)"
        reel.style.transform =
          `translateX(-${offset}px)`
      })

      reel.addEventListener("transitionend", () => {
        setIsSpinning(false)
        setResult(winner)
      }, { once: true })

    })
  }

  const sellItem = () => {
    setResult(null)
    setIsSpinning(false)
    setReelItems([])
  }

  const openAgain = () => {
    sellItem()
    openCase()
  }

  const blurred = result != null

  return (
    <div className="app">

      <div className={blurred ? "blurred" : ""}>

        <div className="casepage-header">

          <div className="casepage-title-row">
            <button
              className="casepage-header-btn casepage-back-btn"
              onClick={() => navigate(-1)}
            >
              ←
            </button>
            <div className="casepage-title">
              {caseData.name}
            </div>
            <button className="casepage-header-btn casepage-settings-btn">
              ⚙
            </button>
          </div>

          {!isSpinning && (
            <img
              ref={caseImgRef}
              src={caseData.image}
              className="casepage-case-image"
              alt={caseData.name}
            />
          )}

          {isSpinning && (
            <div
              className="roulette-window"
              style={{
                width:
                  caseImgRef.current?.offsetWidth || 320
              }}
            >
              <div className="roulette-line" />

              <div
                ref={reelRef}
                className="roulette-reel"
              >
                {reelItems.map((dropId, index) => (
                  <div
                    key={index}
                    className="roulette-item"
                  >
                    <img
                      src={pngSrc(dropId)}
                      className="roulette-png"
                      draggable={false}
                      alt=""
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isSpinning && !result && (
            <button
              className="casepage-open-btn"
              onClick={openCase}
            >
              Открыть кейс
            </button>
          )}

        </div>

        {/* DROPS GRID (LOTTIE) */}
        <div className="casepage-drops">
          {caseData.drops.map(drop => {
            const isActive = activeDrop === drop.id
            return (
              <div
                key={drop.id}
                className="drop-card"
                onClick={() => handleClick(drop.id)}
              >
                <Lottie
                  key={isActive ? drop.id + "-active" : drop.id}
                  animationData={
                    darkMatterAnimations[drop.id]
                  }
                  autoplay={isActive}
                  loop={false}
                  className="drop-lottie"
                />
                <div className="drop-name">
                  {drop.name || drop.id}
                </div>
              </div>
            )
          })}
        </div>

      </div>

      {result && (
        <div className="result-overlay">
          <div className="result-card">

            <div className="result-title">
              Поздравляем!
            </div>

            <div className="drop-card result-size">
              <img
                src={pngSrc(result)}
                className="result-png"
                alt=""
              />
              <div className="drop-name">
                {result}
              </div>
            </div>

            <div className="result-buttons">
              <button
                className="glass-btn sell"
                onClick={sellItem}
              >
                Продать
              </button>
              <button
                className="glass-btn open"
                onClick={openAgain}
              >
                Открыть еще
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default CasePage
