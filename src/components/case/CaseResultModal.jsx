function CaseResultModal({ resultDrop, pngSrcByDrop, sellItem, openAgain }) {
  if (!resultDrop) return null

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

          <div className="drop-prices">
            <span className="drop-price-item">
              <img src="/ui/star.PNG" className="price-icon" alt="" />
              <span>{resultDrop.priceStars || "0"}</span>
            </span>

            <span className="drop-price-item">
              <img src="/ui/ton.PNG" className="price-icon" alt="" />
              <span>{resultDrop.priceGems || "0"}</span>
            </span>
          </div>
        </div>

        <div className="result-buttons">
          <button type="button" className="glass-btn sell" onClick={sellItem}>
            Продать
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
