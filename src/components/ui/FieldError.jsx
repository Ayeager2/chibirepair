export default function FieldError({ error }) {
  if (!error) return null;

  return <div className="field-error">{error}</div>;
}
