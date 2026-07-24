import "./CaseRoulette.css"
import "./CaseRouletteOverrides.css"

const machineMultipliers = [1, 2, 3, 4]

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
    <div className="roulette-machine-shell">
      <div className="roulette-machine-title">GIFTON VAULT</div>

      <div className="roulette-machine-body">
        <div className="roulette-machine-inner-frame">
          <div
            ref={wrapRef}
            className="roulette-window roulette-window--premium roulette-window--vertical"
          >
            <div className="roulette-frame" aria-hidden="true" />

            <div ref={reelRef} className="roulette-reel roulette-reel--premium roulette-reel--vertical">
              {reelItems.map((dropId, index) => {
                const drop = dropMap[dropId]
                if (!drop) return null

                return (
                  <div
                    key={index}
                    className="roulette-item roulette-item--premium roulette-item--vertical"
                    data-index={index}
                  >
                    <img
                      src={pngSrcByDrop(drop)}
                      className="roulette-png roulette-png--premium roulette-png--vertical"
                      alt=""
                      loading="eager"
                      decoding="async"
                      draggable={false}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          <div ref={lineRef} className="roulette-machine-marker" aria-hidden="true">
            <span className="roulette-machine-marker-arrow roulette-machine-marker-arrow--left" />
            <span className="roulette-machine-marker-line" />
            <span className="roulette-machine-marker-arrow roulette-machine-marker-arrow--right" />
          </div>
        </div>
      </div>

      <div className="roulette-machine-multipliers" aria-hidden="true">
        {machineMultipliers.map((value) => (
          <span key={value} className="roulette-machine-multiplier">
            x{value}
          </span>
        ))}
      </div>

      <div className="roulette-machine-open-status">ОТКРЫВАЕМ КЕЙС</div>
    </div>
  )
}

export default CaseRoulette
