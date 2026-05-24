// components/ui/Avatar.tsx
import Image from 'next/image'

const GRADIENTS = [
  'linear-gradient(135deg,#9b63ff,#f7931a)',
  'linear-gradient(135deg,#7ee8a2,#0891b2)',
  'linear-gradient(135deg,#ff6b9d,#9b63ff)',
  'linear-gradient(135deg,#f7931a,#fbbf24)',
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
