// components/ui/FormField.tsx
export function FormField({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      {children}
      {error && <p className="text-xs" style={{ color: 'var(--accent-red)' }}>{error}</p>}
    </div>
  )
}
