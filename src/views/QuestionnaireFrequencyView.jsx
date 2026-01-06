import QuestionnaireShell from "./QuestionnaireShell.jsx";

export default function QuestionnaireFrequencyView({
    value,
    onChange,
    onBack,
    onContinue,
    onLogoClick,
}) {
    return (
        <QuestionnaireShell onLogoClick={onLogoClick}>
            <div className="questionnaire-center">
                <div className="questionnaire-content">
                    <h2 className="questionnaire-title">Number of sessions/week</h2>

                    <div className="frequency-slider-block">
                        <div className="frequency-slider-labels">
                            <span>total body, comprehensive</span>
                            <span>more divided, scattered</span>
                        </div>

                        <input
                            type="range"
                            min={1}
                            max={5}
                            step={1}
                            value={value}
                            onChange={(e) => onChange(Number(e.target.value))}
                            list="sessionsTicks"
                            className="frequency-slider"
                        />
                        <datalist id="sessionsTicks">
                            <option value="1" />
                            <option value="2" />
                            <option value="3" />
                            <option value="4" />
                            <option value="5" />
                        </datalist>

                        <div className="frequency-slider-value-row">
                            <span>Selected: {value}</span>
                        </div>
                    </div>

                    <div className="questionnaire-footer-between">
                        <button onClick={onBack} className="secondary-button">
                            Back
                        </button>
                        <button onClick={onContinue} className="primary-button">
                            Continue
                        </button>
                    </div>
                </div>
            </div>
        </QuestionnaireShell>
    );
}
