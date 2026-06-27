import { useEffect, useMemo, useState } from "react"
import Lottie from "lottie-react"

function CaseDropsGrid({
  drops,
  activeDrop,
  handleClick,
}) {
  const [activeAnimationState, setActiveAnimationState] = useState({
    dropId: null,
    animation: null,
  })

  const activeDropConfig = useMemo(() => {
    return (drops || []).find((drop) => drop?.id === activeDrop) || null
  }, [drops, activeDrop])

  useEffect(() => {
    let cancelled = false
    const currentDropId = activeDropConfig?.id || null

    async function loadActiveAnimation() {
      setActiveAnimationState({
        dropId: currentDropId,
        animation: null,
      })

      if (!activeDropConfig?.lottie || !currentDropId) {
        return
      }

      try {
        const res = await fetch(activeDropConfig.lottie)
        if (!res.ok) {
          throw new Error(`Failed to load ${activeDropConfig.lottie}`)
        }

        const json = await res.json()

        if (!cancelled) {
          setActiveAnimationState({
            dropId: currentDropId,
            animation: json,
          })
        }
      } catch (err) {
        console.error(`LOTTIE LOAD ERROR [${currentDropId}]`, err)

        if (!cancelled) {
          setActiveAnimationState({
            dropId: currentDropId,
            animation: null,
          })
        }
      }
    }

    loadActiveAnimation()

    return () => {
      cancelled = true
    }
  }, [activeDropConfig])

  return (
    <div className="casepage-drops">
      {drops.map((drop) => {
        const isActive = activeDrop === drop.id
        const anim =
          isActive && activeAnimationState.dropId === drop.id
            ? activeAnimationState.animation
            : null
        const hasLottie = Boolean(drop.lottie && anim)
        const hasPng = Boolean(drop.png)

        return (
          <div key={drop.id} className="drop-card" onClick={() => handleClick(drop.id)}>
            {hasLottie ? (
              <Lottie
                key={`${drop.id}-active`}
                animationData={anim}
                autoplay
                loop={false}
                className="drop-lottie"
              />
            ) : hasPng ? (
              <img
                src={`/drops/${drop.png}.webp`}
                alt={drop.name || drop.id}
                className="drop-png"
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            ) : (
              <div className="drop-placeholder" aria-hidden="true" />
            )}

            <div className="drop-name">{drop.name || drop.id}</div>

            <div className="drop-prices">
              <span className="drop-price-item">
                <img
                  src="/ui/star.PNG"
                  className="price-icon"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
                <span>{drop.priceStars || "0"}</span>
              </span>

              {drop.priceGems && (
                <span className="drop-price-item">
                  <img
                    src="/ui/ton.PNG"
                    className="price-icon"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                  <span>{drop.priceGems}</span>
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default CaseDropsGrid
