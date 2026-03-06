function CaseHeader({
  caseData,
  isSpinning,
  resultDrop,
  imgRef,
  wrapRef,
  lineRef,
  reelRef,
  reelItems,
  dropMap,
  navigate,
  openCase,
  phase,
  pngSrcByDrop,
}) {
  return (
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

        <button type="button" className="casepage-header-btn casepage-settings-btn">
          ⚙
        </button>
      </div>

      <div className="case-image-wrapper">
        <img
          ref={imgRef}
          src={caseData.image}
          className={`casepage-case-image ${isSpinning ? "hidden-case" : ""}`}
          alt={caseData.name}
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

      {!resultDrop && (
        <button
          type="button"
          className="casepage-open-btn"
          onClick={openCase}
          disabled={phase === "preparing" || phase === "spinning"}
        >
          {phase === "preparing"
            ? "Загрузка…"
            : phase === "spinning"
              ? "Крутится…"
              : "Открыть кейс"}
        </button>
      )}
    </div>
  )
}

export default CaseHeader
