import "./CaseRoulette.css"

function CaseRoulette({
  isSpinning,
  wrapRef,
  lineRef,
  reelRef,
  reelItems,
  dropMap,
  pngSrcByDrop,
}) {
  if (!isSpinning) return null

  return (
    <div ref={wrapRef} className="roulette-window roulette-window--premium">
      <div className="roulette-ambient-glow" aria-hidden="true" />
      <div className="roulette-speed-streaks" aria-hidden="true" />
      <div className="roulette-center-focus" aria-hidden="true" />

      <div ref={lineRef} className="roulette-line roulette-line--premium">
        <span className="roulette-line-core" />
        <span className="roulette-line-spark roulette-line-spark--top" />
        <span className="roulette-line-spark roulette-line-spark--bottom" />
      </div>

      <div ref={reelRef} className="roulette-reel roulette-reel--premium">
        {reelItems.map((dropId, index) => {
          const drop = dropMap[dropId]
          if (!drop) return null

          return (
            <div key={index} className="roulette-item roulette-item--premium" data-index={index}>
              <span className="roulette-item-sheen" aria-hidden="true" />
              <img
                src={pngSrcByDrop(drop)}
                className="roulette-png roulette-png--premium"
                alt=""
                loading="eager"
                decoding="async"
                draggable={false}
              />
            </div>
          )
        })}
      </div>

      <div className="roulette-vignette roulette-vignette--left" aria-hidden="true" />
      <div className="roulette-vignette roulette-vignette--right" aria-hidden="true" />
    </div>
  )
}

export default CaseRoulette
