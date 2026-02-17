import { useNavigate } from "react-router-dom"

function CaseCard({ caseItem }) {

  const navigate = useNavigate()

  function openCase() {
    navigate(`/case/${caseItem.id}`, {
      state: caseItem
    })
  }

  return (
    <div className="case-card" onClick={openCase}>

      <div className="case-title">
        {caseItem.name}
      </div>

      <img
        src={caseItem.image}
        className="case-image"
        alt={caseItem.name}
      />

      <div className="case-price-badge">
        {caseItem.price}
      </div>

    </div>
  )
}

export default CaseCard
