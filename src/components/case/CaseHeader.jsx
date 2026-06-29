function CaseHeader({
  caseData,
  isSpinning,
  imgRef,
  navigate,
  onOpenSettings,
  settingsPanel = null,
}) {
  return (
    <div className="casepage-header">
      <div className="casepage-title-row">
        <button
          type="button"
          className="casepage-header-btn casepage-back-btn"
          onClick={() => navigate(-1)}
          disabled={isSpinning}
          aria-disabled={isSpinning}
        >
          <img
            src="/ui/back.PNG"
            className="casepage-header-icon"
            alt=""
            loading="eager"
            decoding="async"
            draggable={false}
          />
        </button>

        <div className="casepage-title">{caseData.name}</div>

        <button
          type="button"
          className="casepage-header-btn casepage-settings-btn"
          onClick={onOpenSettings}
          disabled={isSpinning}
          aria-disabled={isSpinning}
        >
          <img
            src="/ui/settings.PNG"
            className="casepage-header-icon"
            alt=""
            loading="eager"
            decoding="async"
            draggable={false}
          />
        </button>
      </div>

      {settingsPanel}

      <div className="case-image-wrapper">
        <img
          ref={imgRef}
          src={caseData.image}
          className={`casepage-case-image ${isSpinning ? "hidden-case" : ""}`}
          alt={caseData.name}
          loading="eager"
          decoding="async"
          draggable={false}
        />
      </div>
    </div>
  )
}

export default CaseHeader
