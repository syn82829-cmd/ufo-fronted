function CaseHeader({
  caseData,
  isSpinning,
  imgRef,
  navigate,
  onOpenSettings,
}) {
  return (
    <div className="casepage-header">
      <div className="casepage-title-row">
        <button
          type="button"
          className="casepage-header-btn casepage-back-btn"
          onClick={() => navigate(-1)}
        >
          <img src="/ui/back.PNG" className="casepage-header-icon" alt="" draggable={false} />
        </button>

        <div className="casepage-title">{caseData.name}</div>

        <button
          type="button"
          className="casepage-header-btn casepage-settings-btn"
          onClick={onOpenSettings}
        >
          <img src="/ui/settings.PNG" className="casepage-header-icon" alt="" draggable={false} />
        </button>
      </div>

      <div className="case-image-wrapper">
        <img
          ref={imgRef}
          src={caseData.image}
          className={`casepage-case-image ${isSpinning ? "hidden-case" : ""}`}
          alt={caseData.name}
        />
      </div>
    </div>
  )
}

export default CaseHeader
