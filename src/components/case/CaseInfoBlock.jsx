function CaseInfoBlock({ caseData }) {
  return (
    <div className="case-info-block">
      <div className="case-info-visual">
        <img
          src={caseData.infoImage}
          alt={caseData.name}
          className="case-info-image"
          draggable={false}
        />
      </div>

      <div className="case-info-content">
        <div className="case-info-title">{caseData.name}</div>
        <div className="case-info-text">{caseData.description}</div>
      </div>
    </div>
  )
}

export default CaseInfoBlock
