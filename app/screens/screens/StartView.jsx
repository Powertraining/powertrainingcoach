import QuestionnaireShell from "./QuestionnaireShell.jsx";

export default function StartView({ onStart }) {
    return (
        <QuestionnaireShell>
            <div className="start-view-center">
                <div className="start-view-card">
                    <p className="start-view-eyebrow">Welcome</p>
                    <h1 className="start-view-title">Combat Training Planner</h1>
                    <p className="start-view-subtitle">
                        Create a personalized training program for martial arts based on your goals and schedule.
                    </p>

                    <div className="start-view-actions">
                        <button className="primary-button" onClick={onStart}>
                            Create Training Program
                        </button>
                    </div>
                </div>
            </div>
        </QuestionnaireShell>
    );
}
