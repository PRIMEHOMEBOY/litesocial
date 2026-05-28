// components/ui/Avatar.tsx
const GRADIENTS = [
  'linear-gradient(135deg,#345D9D,#4a80d4)',
  'linear-gradient(135deg,#1e3d6e,#345D9D)',
  'linear-gradient(135deg,#243550,#4a80d4)',
  'linear-gradient(135deg,#0d1a2e,#345D9D)',
]

function getGradient(seed: string) {
  const idx = (seed.charCodeAt(0) || 0) % GRADIENTS.length
  return GRADIENTS[idx]
}

interface AvatarProps {
  src?: string | null
  name: string
  size?: number
  className?: string
}

export function Avatar({ src, name, size = 40, className = '' }: AvatarProps) {
  const initial = (name?.[0] || '?').toUpperCase()
  const gradient = getGradient(name || 'a')

  if (src) {
    return (
      <div
        style={{
          width: size, height: size, borderRadius: '50%',
          overflow: 'hidden', flexShrink: 0, display: 'block',
        }}
        className={className}
      >
        <img
          src={src}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={(e) => {
            // Fallback to initial on load error
            const parent = e.currentTarget.parentElement
            if (parent) {
              parent.style.background = gradient
              e.currentTarget.style.display = 'none'
            }
          }}
        />
      </div>
    )
  }

  return (
    <div
      className={className}
      style={{
        width: size, height: size, borderRadius: '50%',
        background: gradient, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: Math.floor(size * 0.38), color: '#fff',
        fontFamily: 'var(--font-display)', fontWeight: 700,
      }}>
      {initial}
    </div>
  )
}
