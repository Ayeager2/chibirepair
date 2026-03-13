import { useState } from "react";

export default function Tooltip({ text, children }) {
  const [open, setOpen] = useState(false);

  if (!text) return children;

  return (
    <span
      className="app-tooltip-wrap"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      style={{ position: "relative", display: "inline-flex" }}
    >
      {children}

      {open ? (
        <span className="app-tooltip-bubble" role="tooltip">
          {text}
        </span>
      ) : null}
    </span>
  );
}
