import QuestionnaireShell from "./QuestionnaireShell.jsx";

export default function QuestionnaireSportView({
    options,
    value,
    onChange,
    onContinue,
    onBack,
    onLogoClick,
}) {
    const canContinue = Boolean(value);

    return (
        <QuestionnaireShell onLogoClick={onLogoClick}>
            <div className="questionnaire-center">
                <div className="questionnaire-content">
                    <h2 className="questionnaire-title">What is your primary combat sport?</h2>

                    <div className="sport-options-grid">
                        {options.map((s) => (
                            <label key={s} className="sport-option-label">
                                <input
                                    type="radio"
                                    name="primarySport"
                                    value={s}
                                    checked={value === s}
                                    onChange={() => onChange(s)}
                                    className="sport-option-radio"
                                />
                                <span>{s}</span>
                            </label>
                        ))}
                    </div>

                    <div className="questionnaire-footer-between">
                        {onBack && (
                            <button onClick={onBack} className="secondary-button">
                                Back
                            </button>
                        )}

                        <button
                            onClick={onContinue}
                            disabled={!canContinue}
                            className="primary-button"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            </div>
        </QuestionnaireShell>
    );
}
