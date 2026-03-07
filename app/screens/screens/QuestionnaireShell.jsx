export default function QuestionnaireShell({ children, onLogoClick }) {
    return (
        <div className="questionnaire-page">
            <main className="questionnaire-main">{children}</main>
        </div>
    );
}
