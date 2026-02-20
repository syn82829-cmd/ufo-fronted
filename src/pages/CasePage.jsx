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
  const [targetIndex, setTargetIndex] = useState(0)

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
     PICK WINNER (weighted)
  ============================= */

  const pickWinner = () => {
    const pool = []
    caseData.drops.forEach(drop => {
      const w = drop.chance || 10
      for (let i = 0; i < w; i++) pool.push(drop.id)
    })
    return pool[Math.floor(Math.random() * pool.length)]
  }

  /* =============================
     BUILD LONG REEL (so it never ends)
  ============================= */

  const buildReel = (winId) => {
    const baseLength = 40              // базовый блок
    const repeats = 9                  // сколько раз повторяем
    const middleRepeat = Math.floor(repeats / 2) // победа будет в середине

    const base = Array.from({ length: baseLength }, () => {
      const r = caseData.drops[Math.floor(Math.random() * caseData.drops.length)].id
      return r
    })

    const winIndexInBase = Math.floor(baseLength / 2) // выигрыш внутри base
    base[winIndexInBase] = winId

    const items = []
    for (let k = 0; k < repeats; k++) items.push(...base)

    const globalTargetIndex = middleRepeat * baseLength + winIndexInBase

    return { items, globalTargetIndex }
  }

  /* =============================
     OPEN CASE
  ============================= */

  const openCase = () => {
    if (isSpinning) return

    // на всякий случай чистим таймер
    if (spinTimeout.current) clearTimeout(spinTimeout.current)

    setResult(null)

    const winId = pickWinner()
    const { items, globalTargetIndex } = buildReel(winId)

    setReelItems(items)
    setTargetIndex(globalTargetIndex)
    setIsSpinning(true)

    spinTimeout.current = setTimeout(() => {
      setIsSpinning(false)
      setResult(winId)
    }, 4300)
  }

  /* =============================
     START ANIMATION WHEN REEL READY
  ============================= */

  useLayoutEffect(() => {
    if (!isSpinning) return
    const reel = reelRef.current
    if (!reel) return

    const first = reel.children[0]
    if (!first) return

    const itemW = first.getBoundingClientRect().width
    const gap = 20
    const step = itemW + gap

    const containerW = reel.parentElement.getBoundingClientRect().width

    // ставим ленту в "середину", чтобы слева тоже были элементы
    const startIndex = Math.max(0, targetIndex - 60)
    const startX = startIndex * step

    // куда едем: победа по центру
    const targetX =
      targetIndex * step -
      containerW / 2 +
      itemW / 2

    reel.style.transition = "none"
    reel.style.transform = `translateX(-${startX}px)`

    // force reflow
    void reel.offsetHeight

    requestAnimationFrame(() => {
      reel.style.transition = "transform 4.2s cubic-bezier(0.12, 0.75, 0.15, 1)"
      reel.style.transform = `translateX(-${targetX}px)`
    })
  }, [isSpinning, reelItems, targetIndex])

  /* =============================
     RESET
  ============================= */

  const sellItem = () => {
    if (spinTimeout.current) clearTimeout(spinTimeout.current)
    setResult(null)
    setIsSpinning(false)
  }

  const openAgain = () => {
    if (spinTimeout.current) clearTimeout(spinTimeout.current)
    setResult(null)
    openCase()
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

            <div className="casepage-title">
              {caseData.name}
            </div>

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

                <div
                  ref={reelRef}
                  className="roulette-reel"
                >
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
                  animationData={darkMatterAnimations[drop.id]}
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
              <Lottie
                animationData={darkMatterAnimations[result]}
                autoplay
                loop={false}
              />
              <div className="drop-name">
                {result}
              </div>
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
