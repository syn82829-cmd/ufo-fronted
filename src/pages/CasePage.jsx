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
  const [spinId, setSpinId] = useState(0)

  const reelRef = useRef(null)
  const rouletteWrapRef = useRef(null)
  const spinTimeout = useRef(null)

  if (!caseData) return <div className="app">Case config missing</div>

  // ✅ берём только те дропы, у которых реально есть animationData
  const validDrops = useMemo(() => {
    return (caseData.drops || []).filter(d => !!darkMatterAnimations[d.id])
  }, [caseData.drops])

  // если в конфиге кейса есть дропы, но в animations.js нет соответствий — это и есть причина “одинаковых”
  if (!validDrops.length) {
    return (
      <div className="app">
        No valid drops for this case (animations missing).
      </div>
    )
  }

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
     WEIGHTED RANDOM (только из validDrops)
  ============================= */
  const pickWeighted = () => {
    const pool = []
    validDrops.forEach((drop) => {
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
    if (isSpinning) return

    clearTimeout(spinTimeout.current)
    setResult(null)

    const winId = pickWeighted()

    // ✅ “бесконечность” без конца:
    // делаем базовую ленту и повторяем её несколько раз.
    // ВАЖНО: держим общее число элементов разумным (иначе лаги).
    const baseLength = 34           // базовая длина (не большая)
    const repeats = 5               // повторяем 5 раз => 170 элементов (нормально)
    const winIndexInBase = Math.floor(baseLength / 2) // победа в центре базы
    const middleBlock = Math.floor(repeats / 2)       // победа в центральном блоке

    const base = new Array(baseLength).fill(null).map(() => {
      const r = validDrops[Math.floor(Math.random() * validDrops.length)].id
      return r
    })
    base[winIndexInBase] = winId

    const items = []
    for (let r = 0; r < repeats; r++) items.push(...base)

    // целевой индекс победы в общей ленте
    const targetIndex = middleBlock * baseLength + winIndexInBase

    // сохраняем “служебные” данные прямо в state через объект
    setSpinId((s) => s + 1)
    setReelItems(items.map((x) => x)) // новый массив
    setIsSpinning(true)

    // запланируем завершение (чуть больше длительности анимации)
    spinTimeout.current = setTimeout(() => {
      setIsSpinning(false)
      setResult(winId)
    }, 4200)

    // запускаем прокрут после того как DOM точно есть
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const reel = reelRef.current
        const wrap = rouletteWrapRef.current
        if (!reel || !wrap) return

        const containerWidth = wrap.offsetWidth || 320

        // берём реальные размеры из DOM, чтобы не было рассинхрона на мобиле
        const firstItem = reel.querySelector(".roulette-item")
        const itemW = firstItem ? firstItem.offsetWidth : 140
        const gap = 20
        const full = itemW + gap

        // стартуем из начала центрального блока (чтобы слева/справа всегда были элементы)
        const startIndex = middleBlock * baseLength
        const startX = startIndex * full

        // смещение до targetIndex по центру линии
        const offset =
          targetIndex * full -
          containerWidth / 2 +
          itemW / 2

        // reset + старт
        reel.style.transition = "none"
        reel.style.transform = `translate3d(-${startX}px, 0, 0)`
        void reel.offsetHeight

        reel.style.transition = "transform 4.0s cubic-bezier(0.12, 0.75, 0.15, 1)"
        reel.style.transform = `translate3d(-${offset}px, 0, 0)`
      })
    })
  }

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
    if (e) e.preventDefault()
    clearTimeout(spinTimeout.current)
    setResult(null)
    setIsSpinning(false)
    setReelItems([])
  }

  const openAgain = (e) => {
    if (e) e.preventDefault()
    sellItem()
    // небольшой тик, чтобы React успел размонтировать overlay
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
                  {reelItems.map((dropId, index) => {
                    const anim = darkMatterAnimations[dropId]
                    // на всякий случай: если вдруг undefined (не должно быть), рисуем пустышку
                    if (!anim) {
                      return (
                        <div
                          key={`${spinId}-${index}-missing`}
                          className="roulette-item"
                        />
                      )
                    }
                    return (
                      <div
                        key={`${spinId}-${index}-${dropId}`}
                        className="roulette-item"
                      >
                        <Lottie
                          animationData={anim}
                          autoplay={false}
                          loop={false}
                          style={{ width: 80, height: 80 }}
                        />
                      </div>
                    )
                  })}
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
            const hasAnim = !!darkMatterAnimations[drop.id]
            return (
              <div
                key={drop.id}
                className={`drop-card ${hasAnim ? "" : "drop-missing"}`}
                onClick={() => handleClick(drop.id)}
              >
                {hasAnim ? (
                  <Lottie
                    key={isActive ? drop.id + "-active" : drop.id}
                    animationData={darkMatterAnimations[drop.id]}
                    autoplay={isActive}
                    loop={false}
                    className="drop-lottie"
                  />
                ) : (
                  <div className="drop-lottie" />
                )}
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
