import Lottie from "lottie-react"

function CaseDropsGrid({
  drops,
  activeDrop,
  animationsById,
  handleClick,
}) {
  return (
    <div className="casepage-drops">
      {drops.map((drop) => {
        const isActive = activeDrop === drop.id
        const anim = animationsById?.[drop.id]
        const isPlaceholder = !drop.lottie || !anim

        return (
          <div key={drop.id} className="drop-card" onClick={() => handleClick(drop.id)}>
            {isPlaceholder ? (
              <div className="drop-placeholder" aria-hidden="true" />
            ) : (
              <Lottie
                key={isActive ? `${drop.id}-active` : `${drop.id}-idle`}
                animationData={anim}
                autoplay={isActive}
                loop={false}
                className="drop-lottie"
              />
            )}

            <div className="drop-name">{drop.name || drop.id}</div>

            <div className="drop-prices">
              <span className="drop-price-item">
                <img src="/ui/star.PNG" className="price-icon" alt="" />
                <span>{drop.priceStars || "0"}</span>
              </span>

              <span className="drop-price-item">
                <img src="/ui/ton.PNG" className="price-icon" alt="" />
                <span>{drop.priceGems || "0"}</span>
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default CaseDropsGrid
