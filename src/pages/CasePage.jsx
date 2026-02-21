import { useParams, useNavigate } from "react-router-dom"
import { useState, useRef, useLayoutEffect, useEffect, useMemo } from "react"
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

  const reelRef = useRef(null)
  const rouletteWrapRef = useRef(null)

  const spinTimeout = useRef(null)
  const winIdRef = useRef(null)
  const winIndexRef = useRef(0)
  const startedRef = useRef(false)

  if (!caseData) return <div className="app">Case config missing</div>

  // ✅ БЕРЕМ ТОЛЬКО ТЕ ДРОПЫ, У КОТОРЫХ ЕСТЬ АНИМАЦИЯ
  const validDrops = useMemo(() => {
    const filtered = (caseData.drops || []).filter(d => !!darkMatterAnimations[d.id])
    // если вдруг у кейса вообще нет валидных анимаций — не крашимся
    return filtered.length ? filtered : (caseData.drops || [])
  }, [caseData.drops])

  /* =============================
     DROP CLICK
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
     WEIGHTED RANDOM (ТОЛЬКО validDrops)
  ============================= */
  const pickWeighted = () => {
    const pool = []
    validDrops.forEach((drop) => {
      const w = drop.chance || 10
      for (let i = 0; i < w; i++) pool.push(drop.id)
    })
    if (!pool.length) return validDrops[0]?.id
    return pool[Math.floor(Math.random() * pool.length)]
  }

  const randomDropId = () => {
    if (!validDrops.length) return null
    return validDrops[Math.floor(Math.random() * validDrops.length)].id
  }

  /* =============================
     OPEN CASE
  ============================= */
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

  /* =============================
     BUILD REEL
     (делаем очень длинный хвост справа)
  ============================= */
  useLayoutEffect(() => {
    if (!isSpinning) return
    if (!rouletteWrapRef.current) return
    if (startedRef.current) return

    const wrap = rouletteWrapRef.current
    const containerWidth = wrap.offsetWidth || 320

    // базово (точно уточним на этапе transform)
    const itemW = 140
    const gap = 20
    const full = itemW + gap

    const visibleCount = Math.ceil(containerWidth / full) + 2

    const prefix = visibleCount + 20
    const winIndex = prefix + 80

    // 🔥 БОЛЬШЕ РЕАЛЬНЫХ ПРЕДМЕТОВ СПРАВА — НЕ БУДЕТ ПУСТОТЫ
    const tailBuffer = visibleCount + 320

    const total = winIndex + tailBuffer + 1
    winIndexRef.current = winIndex

    const items = new Array(total).fill(null).map(() => randomDropId())
    items[winIndex] = winIdRef.current

    setReelItems(items)
    startedRef.current = true
  }, [isSpinning, validDrops])

  /* =============================
     RUN TRANSFORM
     (стартуем НЕ с 0)
  ============================= */
  useLayoutEffect(() => {
    if (!isSpinning) return
    if (!reelRef.current) return
    if (!rouletteWrapRef.current) return
    if (!reelItems.length) return

    const reel = reelRef.current
    const wrap = rouletteWrapRef.current

    const firstItem = reel.children[0]
    if (!firstItem) return

    // ✅ реальные размеры DOM
    const itemWidth = firstItem.getBoundingClientRect().width
    const reelStyles = getComputedStyle(reel)
    const gapStr = reelStyles.gap || reelStyles.columnGap || "20px"
    const gap = parseFloat(gapStr) || 20
    const full = itemWidth + gap

    const containerWidth = wrap.getBoundingClientRect().width
    const winIndex = winIndexRef.current

    const targetX =
      winIndex * full -
      containerWidth / 2 +
      itemWidth / 2

    // 🔥 стартуем ближе к выигрышу — справа всегда есть элементы
    const startIndex = Math.max(0, winIndex - 90)
    const startX = startIndex * full

    reel.style.transition = "none"
    reel.style.transform = `translateX(-${startX}px)`
    void reel.offsetHeight

    requestAnimationFrame(() => {
      reel.style.transition = "transform 3.6s cubic-bezier(0.12, 0.75, 0.15, 1)"
      reel.style.transform = `translateX(-${targetX}px)`
    })

    clearTimeout(spinTimeout.current)
    spinTimeout.current = setTimeout(() => {
      setIsSpinning(false)
      setResult(winIdRef.current)
    }, 3700)
  }, [isSpinning, reelItems])

  /* =============================
     CLEANUP
  ============================= */
  useEffect(() => {
    return () => clearTimeout(spinTimeout.current)
  }, [])

  /* =============================
     RESET
  ============================= */
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
    openCase()
  }

  const blurred = result != null

  // безопасный рендер Lottie
  const RenderLottie = ({ id, className, autoplay }) => {
    const anim = darkMatterAnimations[id]
    if (!anim) {
      return (
        <div className={className} style={{ width: 80, height: 80, opacity: 0.6, display: "flex", alignItems: "center", justifyContent: "center" }}>
          ?
        </div>
      )
    }
    return (
      <Lottie
        animationData={anim}
        autoplay={!!autoplay}
        loop={false}
        className={className}
        style={{ width: 80, height: 80 }}
      />
    )
  }

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
                      <RenderLottie id={dropId} autoplay={false} />
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
          {(caseData.drops || []).map((drop) => {
            const isActive = activeDrop === drop.id
            return (
              <div
                key={drop.id}
                className="drop-card"
                onClick={() => handleClick(drop.id)}
              >
                <RenderLottie id={drop.id} autoplay={isActive} className="drop-lottie" />
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
              <RenderLottie id={result} autoplay={true} />
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
