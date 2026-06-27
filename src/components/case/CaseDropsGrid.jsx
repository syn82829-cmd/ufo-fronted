import { useEffect, useMemo, useState } from "react"
import Lottie from "lottie-react"

function CaseDropsGrid({
  drops,
  activeDrop,
  animationsById,
  handleClick,
}) {
  const [activeAnimation, setActiveAnimation] = useState(null)

  const activeDropConfig = useMemo(() => {
    return (drops || []).find((drop) => drop?.id === activeDrop) || null
  }, [drops, activeDrop])

  useEffect(() => {
    let cancelled = false

    async function loadActiveAnimation() {
      if (!activeDropConfig?.lottie) {
        setActiveAnimation(null)
        return
      }

      const cachedAnimation = animationsById?.[activeDropConfig.id]

      if (cachedAnimation) {
        setActiveAnimation(cachedAnimation)
        return
      }

      try {
        const res = await fetch(activeDropConfig.lottie)
        if (!res.ok) {
          throw new Error(`Failed to load ${activeDropConfig.lottie}`)
        }

        const json = await res.json()

        if (!cancelled) {
          setActiveAnimation(json)
        }
      } catch (err) {
        console.error(`LOTTIE LOAD ERROR [${activeDropConfig.id}]`, err)

        if (!cancelled) {
          setActiveAnimation(null)
        }
      }
    }

    loadActiveAnimation()

    return () => {
      cancelled = true
    }
  }, [activeDropConfig, animationsById])

  return (
    <div className="casepage-drops">
      {drops.map((drop) => {
        const isActive = activeDrop === drop.id
        const anim = isActive ? activeAnimation : null
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
