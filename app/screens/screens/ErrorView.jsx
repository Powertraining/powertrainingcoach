export default function ErrorView({ message, onRetry }) {
  return (
    <div className="error-view-container">
      <p>{message}</p>
      <button onClick={onRetry}>Try again</button>
    </div>
  );
}