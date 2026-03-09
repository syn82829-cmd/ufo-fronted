function CaseResultModal({ resultDrop, pngSrcByDrop, sellItem, openAgain }) {
  if (!resultDrop) return null

  const isStarfall = resultDrop.priceGems === null
  const showStars = !isStarfall
  const showGems = !isStarfall && resultDrop.priceGems

  return (
    <div className="result-overlay">
      <div className="result-card">
        <div className="result-title">Поздравляем!</div>

        <div className="drop-card result-size">
          <img
            src={pngSrcByDrop(resultDrop)}
            className="result-png"
            alt={resultDrop.name}
            draggable={false}
          />

          <div className="drop-name">{resultDrop.name}</div>

          {!isStarfall && (
            <div className="drop-prices">
              {showStars && (
                <span className="drop-price-item">
                  <img src="/ui/star.PNG" className="price-icon" alt="" />
                  <span>{resultDrop.priceStars || "0"}</span>
                </span>
              )}

              {showGems && (
                <span className="drop-price-item">
                  <img src="/ui/ton.PNG" className="price-icon" alt="" />
                  <span>{resultDrop.priceGems}</span>
                </span>
              )}
            </div>
          )}
        </div>

        <div className="result-buttons">
          <button type="button" className="glass-btn sell" onClick={sellItem}>
            Забрать
          </button>

          <button type="button" className="glass-btn open" onClick={openAgain}>
            Открыть еще
          </button>
        </div>
      </div>
    </div>
  )
}

export default CaseResultModal
