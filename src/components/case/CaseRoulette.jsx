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
    <div ref={wrapRef} className="roulette-window">
      <div ref={lineRef} className="roulette-line" />
      <div ref={reelRef} className="roulette-reel">
        {reelItems.map((dropId, index) => {
          const drop = dropMap[dropId]
          if (!drop) return null

          return (
            <div key={index} className="roulette-item" data-index={index}>
              <img
                src={pngSrcByDrop(drop)}
                className="roulette-png"
                alt=""
                draggable={false}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CaseRoulette
