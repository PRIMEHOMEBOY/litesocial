// components/layout/PageHeader.tsx
export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div
      className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
      style={{
        background: 'rgba(8,8,8,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}>
      <h1 className="text-base font-bold" style={{ fontFamily: 'var(--font-display)' }}>{title}</h1>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
