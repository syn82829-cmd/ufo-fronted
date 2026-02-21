import { useParams, useNavigate } from "react-router-dom"
import { useState, useRef, useLayoutEffect, useEffect } from "react"
import Lottie from "lottie-react"

import { cases } from "../data/cases"
import { darkMatterAnimations } from "../data/animations"

const SPIN_MS = 4200

function CasePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const caseData = cases[id]

  const [activeDrop, setActiveDrop] = useState(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState(null)
  const [reelItems, setReelItems] = useState([])

  const reelRef = useRef(null)
  const rouletteWrapRef = useRef(null)

  const spinTimeout = useRef(null)
  const winIdRef = useRef(null)
  const winIndexRef = useRef(0)
  const startedRef = useRef(false)

  if (!caseData) return <div className="app">Case config missing</div>

  const handleClick = (dropId) => {
    if (activeDrop === dropId) {
      setActiveDrop(null)
      setTimeout(() => setActiveDrop(dropId), 10)
    } else {
      setActiveDrop(dropId)
    }
  }

  const pickWeighted = () => {
    const pool = []
    caseData.drops.forEach((drop) => {
      const w = drop.chance || 10
      for (let i = 0; i < w; i++) pool.push(drop.id)
    })
    return pool[Math.floor(Math.random() * pool.length)]
  }

  const randomDropId = () =>
    caseData.drops[Math.floor(Math.random() * caseData.drops.length)].id

  const openCase = (e) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (isSpinning) return

    clearTimeout(spinTimeout.current)

    setResult(null)
    startedRef.current = false

    const winId = pickWeighted()
    winIdRef.current = winId

    setIsSpinning(true)
    setReelItems([])
  }

  // BUILD REEL (реально длинная лента, без “пустоты”)
  useLayoutEffect(() => {
    if (!isSpinning) return
    if (!rouletteWrapRef.current) return
    if (startedRef.current) return

    const wrap = rouletteWrapRef.current
    const containerWidth = wrap.offsetWidth || 320

    // базовые размеры (потом уточним по DOM при старте)
    const itemW = 140
    const gap = 20
    const full = itemW + gap

    const visibleCount = Math.ceil(containerWidth / full) + 4

    // 🔥 ВАЖНО: win НЕ близко к концу
    const before = visibleCount + 140
    const winIndex = before

    // 🔥 ВАЖНО: справа ОЧЕНЬ много настоящих предметов
    const tailBuffer = visibleCount + 320

    const total = winIndex + 1 + tailBuffer
    winIndexRef.current = winIndex

    const items = new Array(total).fill(null).map(() => randomDropId())
    items[winIndex] = winIdRef.current

    setReelItems(items)
    startedRef.current = true
  }, [isSpinning, caseData.drops])

  // START ANIMATION
  useLayoutEffect(() => {
    if (!isSpinning) return
    if (!reelRef.current) return
    if (!rouletteWrapRef.current) return
    if (!reelItems.length) return

    const reel = reelRef.current
    const wrap = rouletteWrapRef.current

    const firstItem = reel.children[0]
    if (!firstItem) return

    const itemWidth = firstItem.getBoundingClientRect().width
    const styles = getComputedStyle(reel)
    const gapStr = styles.columnGap || styles.gap || "20px"
    const gap = Number.parseFloat(gapStr) || 20
    const full = itemWidth + gap

    const containerWidth = wrap.getBoundingClientRect().width
    const winIndex = winIndexRef.current

    const targetX =
      winIndex * full -
      containerWidth / 2 +
      itemWidth / 2

    // ✅ стартуем ближе к центру ленты, а не с нуля
    const startIndex = Math.max(0, winIndex - 90)
    const startX = startIndex * full

    reel.style.transition = "none"
    reel.style.transform = `translateX(-${startX}px)`
    void reel.offsetHeight

    requestAnimationFrame(() => {
      reel.style.transition = `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.75, 0.15, 1)`
      reel.style.transform = `translateX(-${targetX}px)`
    })

    clearTimeout(spinTimeout.current)
    spinTimeout.current = setTimeout(() => {
      setIsSpinning(false)
      setResult(winIdRef.current)
    }, SPIN_MS + 30)
  }, [isSpinning, reelItems])

  useEffect(() => {
    return () => clearTimeout(spinTimeout.current)
  }, [])

  const sellItem = (e) => {
    e?.preventDefault()
    e?.stopPropagation()
    clearTimeout(spinTimeout.current)
    setResult(null)
    setIsSpinning(false)
    setReelItems([])
  }

  const openAgain = (e) => {
    e?.preventDefault()
    e?.stopPropagation()
    sellItem()
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
              <div className="roulette-absolute" ref={rouletteWrapRef}>
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
