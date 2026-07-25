import "./CaseRoulette.css"
import "./CaseRouletteOverrides.css"

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
      <div className="roulette-frame" aria-hidden="true">
        <span className="roulette-frame-edge roulette-frame-edge--top" />
        <span className="roulette-frame-edge roulette-frame-edge--bottom" />
      </div>

      <div ref={reelRef} className="roulette-reel roulette-reel--premium">
        {reelItems.map((dropId, index) => {
          const drop = dropMap[dropId]
          if (!drop) return null

          return (
            <div key={index} className="roulette-item roulette-item--premium" data-index={index}>
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

      <div ref={lineRef} className="roulette-line roulette-line--premium">
        <span className="roulette-line-cap roulette-line-cap--top" />
        <span className="roulette-line-core" />
        <span className="roulette-line-cap roulette-line-cap--bottom" />
      </div>
    </div>
  )
}

export default CaseRoulette
