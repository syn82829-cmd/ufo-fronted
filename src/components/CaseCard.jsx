import { useNavigate } from "react-router-dom"

function CaseCard({ caseItem }) {

  const navigate = useNavigate()

  function openCase() {

    navigate(`/case/${caseItem.id}`, {
      state: caseItem
    })

  }

  return (

    <div
      className="case-card"
      onClick={openCase}
    >

      {/* CASE NAME */}

      <div className="case-title">
        {caseItem.name}
      </div>


      {/* CASE IMAGE */}

      <img
        src={caseItem.image}
        className="case-image"
        alt={caseItem.name}
      />


      {/* PRICE */}

      <div className="case-price-badge">
        ⭐ {caseItem.price}
      </div>

    </div>

  )

}

export default CaseCard
