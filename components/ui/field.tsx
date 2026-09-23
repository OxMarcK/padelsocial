export function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mint text-xs font-bold uppercase tracking-wider text-mint-ink-muted">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="h-12 rounded-[14px] border border-mint-net/25 bg-mint-bg-2 px-4 text-[#0E2318] placeholder:text-mint-ink-muted/50"
      />
    </label>
  );
}
