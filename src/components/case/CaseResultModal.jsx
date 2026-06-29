import { useEffect } from "react"

function cleanPrice(value) {
  if (value == null || value === "") return "0"
  return String(value).replace(/[.\s]/g, "")
}

function CaseResultModal({ resultDrop, pngSrcByDrop, sellItem, openAgain }) {
  useEffect(() => {
    if (!resultDrop) return undefined

    const scrollY = window.scrollY || document.documentElement.scrollTop || 0
    const bodyStyle = document.body.style
    const htmlStyle = document.documentElement.style

    const prevBodyOverflow = bodyStyle.overflow
    const prevBodyPosition = bodyStyle.position
    const prevBodyTop = bodyStyle.top
    const prevBodyLeft = bodyStyle.left
    const prevBodyRight = bodyStyle.right
    const prevBodyWidth = bodyStyle.width
    const prevHtmlOverflow = htmlStyle.overflow

    htmlStyle.overflow = "hidden"
    bodyStyle.overflow = "hidden"
    bodyStyle.position = "fixed"
    bodyStyle.top = `-${scrollY}px`
    bodyStyle.left = "0"
    bodyStyle.right = "0"
    bodyStyle.width = "100%"

    return () => {
      htmlStyle.overflow = prevHtmlOverflow
      bodyStyle.overflow = prevBodyOverflow
      bodyStyle.position = prevBodyPosition
      bodyStyle.top = prevBodyTop
      bodyStyle.left = prevBodyLeft
      bodyStyle.right = prevBodyRight
      bodyStyle.width = prevBodyWidth
      window.scrollTo(0, scrollY)
    }
  }, [resultDrop])

  if (!resultDrop) return null

  const isStarfall = resultDrop.priceGems === null
  const showStars = !isStarfall
  const showGems = !isStarfall && resultDrop.priceGems

  return (
    <div
      className="result-overlay"
      onTouchMove={(event) => event.preventDefault()}
      onWheel={(event) => event.preventDefault()}
    >
      <div className="result-card">
        <div className="result-title">Ваш выигрыш</div>

        <div className="drop-card result-size">
          <img
            src={pngSrcByDrop(resultDrop)}
            className="result-png"
            alt={resultDrop.name}
            loading="eager"
            decoding="async"
            draggable={false}
          />

          <div className="drop-name">{resultDrop.name}</div>

          {!isStarfall && (
            <div className="drop-prices">
              {showStars && (
                <span className="drop-price-item">
                  <img
                    src="/ui/star.PNG"
                    className="price-icon"
                    alt=""
                    loading="eager"
                    decoding="async"
                    draggable={false}
                  />
                  <span>{cleanPrice(resultDrop.priceStars)}</span>
                </span>
              )}

              {showGems && (
                <span className="drop-price-item">
                  <img
                    src="/ui/ton.PNG"
                    className="price-icon"
                    alt=""
                    loading="eager"
                    decoding="async"
                    draggable={false}
                  />
                  <span>{cleanPrice(resultDrop.priceGems)}</span>
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
            Продать
          </button>
        </div>
      </div>
    </div>
  )
}

export default CaseResultModal
