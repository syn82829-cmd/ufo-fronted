function CaseHeader({
  caseName,
  caseImage,
  isSpinning,
  imgRef,
  wrapRef,
  lineRef,
  reelRef,
  reelItems,
  dropMap,
  onBack,
  onOpenCase,
  isOpenDisabled,
  openButtonText,
}) {
  const pngSrcByDrop = (drop) => `/drops/${drop?.png}.png`

  return (
    <div className="casepage-header">
      <div className="casepage-title-row">
        <button
          type="button"
          className="casepage-header-btn casepage-back-btn"
          onClick={onBack}
        >
          ←
        </button>

        <div className="casepage-title">{caseName}</div>

        <button type="button" className="casepage-header-btn casepage-settings-btn">
          ⚙
        </button>
      </div>

      <div className="case-image-wrapper">
        <img
          ref={imgRef}
          src={caseImage}
          className={`casepage-case-image ${isSpinning ? "hidden-case" : ""}`}
          alt={caseName}
        />

        {isSpinning && (
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
        )}
      </div>

      <button
        type="button"
        className="casepage-open-btn"
        onClick={onOpenCase}
        disabled={isOpenDisabled}
      >
        {openButtonText}
      </button>
    </div>
  )
}

export default CaseHeader
