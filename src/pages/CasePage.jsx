import { useParams, useNavigate } from "react-router-dom"
import { useState, useRef, useLayoutEffect, useEffect } from "react"
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
  const [isPreparing, setIsPreparing] = useState(false)

  const reelRef = useRef(null)
  const wrapRef = useRef(null)

  const spinTimeout = useRef(null)
  const prepTimeout = useRef(null)

  const winIdRef = useRef(null)
  const winIndexRef = useRef(0)
  const startOffsetRef = useRef(0)
  const startedRef = useRef(false)

  if (!caseData) return <div className="app">Case config missing</div>

  /* =============================
     DROP CLICK (анимация в сетке)
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
     WEIGHTED RANDOM
  ============================= */
  const pickWeighted = () => {
    const pool = []
    caseData.drops.forEach((drop) => {
      const w = drop.chance || 10
      for (let i = 0; i < w; i++) pool.push(drop.id)
    })
    return pool[Math.floor(Math.random() * pool.length)]
  }

  /* =============================
     OPEN CASE
  ============================= */
  const openCase = (e) => {
    if (e) e.preventDefault()
    if (isSpinning || isPreparing) return

    clearTimeout(spinTimeout.current)
    clearTimeout(prepTimeout.current)

    setResult(null)
    setReelItems([])
    startedRef.current = false

    winIdRef.current = pickWeighted()

    // небольшая “загрузка”, чтобы lottie/layout успели прогрузиться
    setIsPreparing(true)
    const SPIN_PRELOAD_MS = 200

    prepTimeout.current = setTimeout(() => {
      setIsPreparing(false)
      setIsSpinning(true)
    }, SPIN_PRELOAD_MS)
  }

  /* =============================
     BUILD REEL (лента с запасами слева/справа)
  ============================= */
  useLayoutEffect(() => {
    if (!isSpinning) return
    if (!wrapRef.current) return
    if (startedRef.current) return

    const wrap = wrapRef.current
    const containerWidth = wrap.clientWidth || 320

    // пока нет DOM-элементов, берём значения из CSS
    // потом в следующем эффекте уточним по фактической ширине
    const itemW = 140
    const gap = 20
    const full = itemW + gap

    const visible = Math.ceil(containerWidth / full) + 2

    // большой запас слева, чтобы стартовать "внутри" ленты
    const prefix = visible + 60
    const travel = 90 // сколько "проедем" до победы
    const winIndex = prefix + travel

    // большой хвост справа, чтобы не было "пустоты"
    const tail = visible + 80
    const total = winIndex + tail

    winIndexRef.current = winIndex
    startOffsetRef.current = prefix

    const items = new Array(total).fill(null).map(() => {
      const r = caseData.drops[Math.floor(Math.random() * caseData.drops.length)].id
      return r
    })

    items[winIndex] = winIdRef.current

    setReelItems(items)
    startedRef.current = true
  }, [isSpinning, caseData.drops])

  /* =============================
     RUN ANIMATION (старт из prefix, едем до winIndex)
  ============================= */
  useLayoutEffect(() => {
    if (!isSpinning) return
    if (!reelRef.current) return
    if (!wrapRef.current) return
    if (!reelItems.length) return

    const reel = reelRef.current
    const wrap = wrapRef.current

    // реальная ширина айтема (важно для мобилок)
    const first = reel.children[0]
    const itemW = first ? Math.round(first.getBoundingClientRect().width) : 140
    const gap = 20
    const full = itemW + gap

    const containerWidth = wrap.clientWidth || 320
    const winIndex = winIndexRef.current
    const startIndex = startOffsetRef.current

    // стартовая позиция: смещаем влево, чтобы "центр" оказался примерно на startIndex
    const startX =
      startIndex * full -
      containerWidth / 2 +
      itemW / 2

    // финишная позиция: победный индекс по центру линии
    const endX =
      winIndex * full -
      containerWidth / 2 +
      itemW / 2

    // 1) мгновенно ставим старт
    reel.style.transition = "none"
    reel.style.transform = `translateX(-${startX}px)`
    // reflow
    void reel.offsetHeight

    // 2) запускаем плавный проезд
    requestAnimationFrame(() => {
      reel.style.transition = "transform 4.2s cubic-bezier(0.12, 0.75, 0.15, 1)"
      reel.style.transform = `translateX(-${endX}px)`
    })

    // 3) показываем результат
    clearTimeout(spinTimeout.current)
    spinTimeout.current = setTimeout(() => {
      setIsSpinning(false)
      setResult(winIdRef.current)
    }, 4300)
  }, [isSpinning, reelItems])

  useEffect(() => {
    return () => {
      clearTimeout(spinTimeout.current)
      clearTimeout(prepTimeout.current)
    }
  }, [])

  /* =============================
     RESET
  ============================= */
  const sellItem = (e) => {
    if (e) e.preventDefault()
    clearTimeout(spinTimeout.current)
    clearTimeout(prepTimeout.current)
    setResult(null)
    setIsPreparing(false)
    setIsSpinning(false)
    setReelItems([])
  }

  const openAgain = (e) => {
    if (e) e.preventDefault()
    sellItem()
    // маленькая пауза, чтобы state успел сброситься
    requestAnimationFrame(() => openCase())
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

            {(isSpinning || isPreparing) && (
              <div className="roulette-absolute" ref={wrapRef}>
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

          {!isSpinning && !isPreparing && !result && (
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
