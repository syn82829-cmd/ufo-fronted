import { useParams, useNavigate } from "react-router-dom"
import { useState, useRef, useLayoutEffect } from "react"
import Lottie from "lottie-react"

import { cases } from "../data/cases"
import { darkMatterAnimations } from "../data/animations"

function CasePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const caseData = cases[id]

  const [activeDrop, setActiveDrop] = useState(null)

  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState(null)

  const [reelItems, setReelItems] = useState([])
  const [winIndex, setWinIndex] = useState(0)

  const reelRef = useRef(null)
  const spinTimeout = useRef(null)

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
     HELPERS
  ============================= */

  const pickWeightedWin = () => {
    const pool = []
    caseData.drops.forEach((drop) => {
      const weight = drop.chance || 10
      for (let i = 0; i < weight; i++) pool.push(drop.id)
    })
    return pool[Math.floor(Math.random() * pool.length)]
  }

  const randomDropId = () =>
    caseData.drops[Math.floor(Math.random() * caseData.drops.length)].id

  /* =============================
     OPEN CASE
  ============================= */

  const openCase = (e) => {
    e?.preventDefault()
    e?.stopPropagation()

    if (isSpinning) return

    clearTimeout(spinTimeout.current)

    setResult(null)
    setIsSpinning(true)

    const winId = pickWeightedWin()

    // Делаем длинную ленту: много до выигрыша, выигрыш, немного после
    // ВАЖНО: winIndex НЕ последний, чтобы визуально “не кончалось”
    const before = 110
    const after = 25
    const targetIndex = before

    const items = []
    for (let i = 0; i < before; i++) items.push(randomDropId())
    items.push(winId)
    for (let i = 0; i < after; i++) items.push(randomDropId())

    setWinIndex(targetIndex)
    setReelItems(items)

    spinTimeout.current = setTimeout(() => {
      setIsSpinning(false)
      setResult(winId)
    }, 4600)
  }

  /* =============================
     SPIN ANIMATION (stable start)
  ============================= */

  useLayoutEffect(() => {
    if (!isSpinning) return
    const reel = reelRef.current
    if (!reel) return
    if (!reel.children.length) return

    const firstItem = reel.children[0]
    const itemWidth = firstItem.offsetWidth // 140
    const gap = 20 // как в CSS
    const full = itemWidth + gap

    const containerWidth = reel.parentElement.offsetWidth
    const offset =
      winIndex * full - containerWidth / 2 + itemWidth / 2

    // reset
    reel.style.transition = "none"
    reel.style.transform = "translateX(0px)"

    // force reflow
    void reel.offsetHeight

    // animate
    reel.style.transition =
      "transform 4.6s cubic-bezier(0.08, 0.85, 0.18, 1)"
    reel.style.transform = `translateX(-${offset}px)`
  }, [isSpinning, reelItems, winIndex])

  /* =============================
     RESET
  ============================= */

  const sellItem = (e) => {
    e?.preventDefault()
    e?.stopPropagation()
    clearTimeout(spinTimeout.current)
    setResult(null)
    setIsSpinning(false)
  }

  const openAgain = (e) => {
    e?.preventDefault()
    e?.stopPropagation()
    clearTimeout(spinTimeout.current)
    setResult(null)
    setIsSpinning(false)
    // чуть позже, чтобы не конфликтовать со стейтом
    setTimeout(() => openCase(), 0)
  }

  const blurred = result != null

  return (
    <div className="app">
      <div className={blurred ? "blurred" : ""}>
        <div className="casepage-header">
          <div className="casepage-title-row">
            <button
              type="button"
              className="casepage-header-btn casepage-back-btn"
              onClick={() => navigate(-1)}
            >
              ←
            </button>

            <div className="casepage-title">{caseData.name}</div>

            <button
              type="button"
              className="casepage-header-btn casepage-settings-btn"
            >
              ⚙
            </button>
          </div>

          <div className="case-image-wrapper">
            <img
              src={caseData.image}
              className={`casepage-case-image ${isSpinning ? "hidden-case" : ""}`}
              alt={caseData.name}
            />

            {isSpinning && (
              <div className="roulette-absolute">
                <div className="roulette-line" />

                <div ref={reelRef} className="roulette-reel">
                  {reelItems.map((dropId, index) => (
                    <div key={index} className="roulette-item">
                      <Lottie
                        animationData={darkMatterAnimations[dropId]}
                        autoplay={false}
                        loop={false}
                        style={{ width: 80, height: 80 }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!isSpinning && !result && (
            <button
              type="button"
              className="casepage-open-btn"
              onClick={openCase}
            >
              Открыть кейс
            </button>
          )}
        </div>

        {/* DROPS GRID */}
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
                  autoplay={isActive}
                  loop={false}
                  className="drop-lottie"
                />
                <div className="drop-name">{drop.name || drop.id}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* RESULT */}
      {result && (
        <div className="result-overlay">
          <div className="result-card">
            <div className="result-title">Поздравляем!</div>

            <div className="drop-card result-size">
              <Lottie
                animationData={darkMatterAnimations[result]}
                autoplay
                loop={false}
              />
              <div className="drop-name">{result}</div>
            </div>

            <div className="result-buttons">
              <button
                type="button"
                className="glass-btn sell"
                onClick={sellItem}
              >
                Продать
              </button>

              <button
                type="button"
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
