// components/ui/Avatar.tsx
import Image from 'next/image'

const GRADIENTS = [
  'linear-gradient(135deg,#345D9D,#4a80d4)',
  'linear-gradient(135deg,#1e3d6e,#345D9D)',
  'linear-gradient(135deg,#345D9D,#38bdf8)',
  'linear-gradient(135deg,#243550,#345D9D)',
]

function getGradient(seed: string) {
  const idx = seed.charCodeAt(0) % GRADIENTS.length
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
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }} className={className}>
        <Image src={src} alt={name} width={size} height={size} className="object-cover w-full h-full" />
      </div>
    )
  }

  return (
    <div
      className={`flex items-center justify-center font-bold flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: gradient,
        fontSize: Math.floor(size * 0.38),
        color: '#fff',
        fontFamily: 'var(--font-display)',
      }}>
      {initial}
    </div>
  )
}
