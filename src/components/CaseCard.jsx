import { memo } from "react"
import { useNavigate } from "react-router-dom"

import { triggerHaptic } from "../utils/haptics"

function resetDocumentScroll() {
  window.scrollTo(0, 0)
  window.scrollTo({ top: 0, left: 0, behavior: "auto" })

  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0

  const root = document.getElementById("root")
  if (root) root.scrollTop = 0

  const app = document.querySelector(".app")
  if (app) app.scrollTop = 0
}

function CaseCard({ caseItem }) {
  const navigate = useNavigate()

  function openCase() {
    triggerHaptic("light")

    resetDocumentScroll()

    navigate(`/case/${caseItem.id}`, {
      state: caseItem,
    })

    requestAnimationFrame(resetDocumentScroll)
    window.setTimeout(resetDocumentScroll, 80)
    window.setTimeout(resetDocumentScroll, 220)
  }

  return (
    <div className="case-card" onClick={openCase}>
      {/* CASE NAME */}
      <div className="case-title">
        {caseItem.name}
      </div>

      {/* CASE IMAGE */}
      <img
        src={caseItem.image}
        className="case-image"
        alt={caseItem.name}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        draggable={false}
      />

      {/* PRICE */}
      <div className="case-price-badge">
        {caseItem.free ? (
          <span className="case-free">FREE</span>
        ) : (
          <>
            <img
              src="/ui/star.PNG"
              className="case-price-icon"
              alt=""
              loading="eager"
              decoding="async"
              draggable={false}
            />
            <span>{caseItem.price}</span>
          </>
        )}
      </div>
    </div>
  )
}

export default memo(CaseCard)
