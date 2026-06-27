import { memo } from "react"
import { useNavigate } from "react-router-dom"

import { triggerHaptic } from "../utils/haptics"

function CaseCard({ caseItem }) {
  const navigate = useNavigate()

  function openCase() {
    triggerHaptic("light")

    navigate(`/case/${caseItem.id}`, {
      state: caseItem,
    })
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
