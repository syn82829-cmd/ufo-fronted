import { useParams, useNavigate } from "react-router-dom"
import { useState, useRef, useEffect } from "react"
import Lottie from "lottie-react"

import { cases } from "../data/cases"
import { darkMatterAnimations } from "../data/animations"

function CasePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const caseData = cases[id]

  const [activeDrop, setActiveDrop] = useState(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [isPreparing, setIsPreparing] = useState(false) // ✅ реальная подготовка
  const [result, setResult] = useState(null)
  const [reelItems, setReelItems] = useState([])

  const reelRef = useRef(null)
  const spinTimeout = useRef(null)

  useEffect(() => {
    return () => {
      if (spinTimeout.current) clearTimeout(spinTimeout.current)
    }
  }, [])

  if (!caseData) {
    return <div className="app">Case config missing</div>
  }

  /* =============================
     PLAY DROP ANIMATION
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
  const openCase = () => {
    if (isSpinning || isPreparing) return

    if (spinTimeout.current) clearTimeout(spinTimeout.current)

    setResult(null)
    setIsPreparing(true)   // ✅ сразу показываем "Загрузка…"
    setReelItems([])

    // weighted random
    const pool = []
    caseData.drops.forEach((drop) => {
      const weight = drop.chance || 10
      for (let i = 0; i < weight; i++) pool.push(drop.id)
    })

    const winId = pool[Math.floor(Math.random() * pool.length)]

    // делаем ленту больше, чтобы точно не было “конца”
    const totalItems = 120
    const winIndex = 90

    const items = []
    for (let i = 0; i < totalItems; i++) {
      if (i === winIndex) {
        items.push(winId)
      } else {
        const random =
          caseData.drops[Math.floor(Math.random() * caseData.drops.length)].id
        items.push(random)
      }
    }

    // ✅ сначала выставляем items, потом запускаем spin на следующем тике
    setReelItems(items)

    requestAnimationFrame(() => {
      setIsPreparing(false)
      setIsSpinning(true)

      // ждём, чтобы DOM точно отрисовал 120 карточек
      requestAnimationFrame(() => {
        const reel = reelRef.current
        if (!reel) return

        // IMPORTANT: ширина слота = 140 + gap 20 = 160
        const itemWidth = 160
        const containerWidth = reel.parentElement.offsetWidth

        const offset =
          winIndex * itemWidth -
          containerWidth / 2 +
          itemWidth / 2

        reel.style.transition = "none"
        reel.style.transform = "translate3d(0px,0,0)"
        // force reflow
        void reel.offsetHeight

        requestAnimationFrame(() => {
          reel.style.transition =
            "transform 4.2s cubic-bezier(0.12, 0.75, 0.15, 1)"
          reel.style.transform = `translate3d(-${offset}px,0,0)`
        })

        spinTimeout.current = setTimeout(() => {
          setIsSpinning(false)
          setResult(winId)
        }, 4300)
      })
    })
  }

  /* =============================
     RESET
  ============================= */
  const sellItem = () => {
    if (spinTimeout.current) clearTimeout(spinTimeout.current)
    setResult(null)
    setIsSpinning(false)
    setIsPreparing(false)
    setReelItems([])
  }

  const openAgain = () => {
    setResult(null)
    openCase()
  }

  const blurred = result != null

  // ✅ PNG не исчезает на “подготовке”
  const showRoulette = isSpinning && reelItems.length > 0

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

            <div className="casepage-title">{caseData.name}</div>

            <button className="casepage-header-btn casepage-settings-btn">
              ⚙
            </button>
          </div>

          <div className="case-image-wrapper">
            <img
              src={caseData.image}
              className={`casepage-case-image ${showRoulette ? "hidden-case" : ""}`}
              alt={caseData.name}
            />

            {showRoulette && (
              <div className="roulette-absolute">
                <div className="roulette-line" />

                <div ref={reelRef} className="roulette-reel">
                  {reelItems.map((dropId, index) => (
                    <div key={index} className="roulette-item">
                      <Lottie
                        animationData={darkMatterAnimations[dropId]}
                        autoplay={false}  // ✅ статично
                        loop={false}
                        style={{ width: 80, height: 80 }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!result && (
            <button
              className="casepage-open-btn"
              onClick={openCase}
              disabled={isPreparing || isSpinning}
            >
              {isPreparing ? "Загрузка…" : isSpinning ? "Крутится…" : "Открыть кейс"}
            </button>
          )}
        </div>

        <div className="casepage-drops">
          {caseData.drops.map((drop) => {
            const isActive = activeDrop === drop.id
            return (
              <div
                key={drop.id}
                className="drop-card"
                onClick={() => handleClick(drop.id)}
              >
                <Lottie
                  key={isActive ? drop.id + "-active" : drop.id}
                  animationData={darkMatterAnimations[drop.id]}
                  autoplay={isActive}     // ✅ в гриде проигрываем по тапу
                  loop={false}
                  className="drop-lottie"
                />

                <div className="drop-name">{drop.name || drop.id}</div>
              </div>
            )
          })}
        </div>
      </div>

      {result && (
        <div className="result-overlay">
          <div className="result-card">
            <div className="result-title">Поздравляем!</div>

            <div className="drop-card result-size">
              <Lottie
                animationData={darkMatterAnimations[result]}
                autoplay     // ✅ приз анимированный
                loop={false}
              />
              <div className="drop-name">{result}</div>
            </div>

            <div className="result-buttons">
              <button className="glass-btn sell" onClick={sellItem}>
                Продать
              </button>
              <button className="glass-btn open" onClick={openAgain}>
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
