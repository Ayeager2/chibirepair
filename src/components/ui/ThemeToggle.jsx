export default function ThemeToggle({ theme, onToggle }) {
  const buttonText = theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode";

  return (
    <button
      type="button"
      className="button-secondary"
      onClick={onToggle}
      aria-label={buttonText}
      title={buttonText}
      style={{ width: "100%" }}
    >
      {buttonText}
    </button>
  );
}