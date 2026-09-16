export default function FormField({
  id,
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  autoComplete,
  className = "",
  accent = "sky",
}) {
  const focusClass =
    accent === "emerald" ? "focus:border-emerald-400" : "focus:border-sky-400";
  const borderClass = error
    ? "border-rose-400 focus:border-rose-500"
    : `border-slate-200 ${focusClass}`;

  return (
    <label className={`block ${className}`} htmlFor={id}>
      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        className={`input w-full h-12 mt-1 rounded-2xl border-2 text-sm font-semibold text-slate-800 pl-4 focus:outline-none transition-colors duration-200 ${borderClass}`}
      />
      {error ? (
        <span className="block text-[11px] font-bold text-rose-500 mt-1">{error}</span>
      ) : null}
    </label>
  );
}
