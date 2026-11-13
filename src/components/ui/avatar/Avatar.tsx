import { useState } from 'react'

type AvatarProps = {
  initials: string
  src?: string
  size?: 'sm' | 'md' | 'lg'
  tone?: 'dark' | 'soft'
}

export function Avatar({ initials, src, size = 'sm', tone = 'dark' }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string>()

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-pill leading-none font-extrabold ${size === 'lg' ? 'size-20 text-2xl' : size === 'md' ? 'size-11 text-sm' : 'size-9 text-xs'} ${tone === 'soft' ? 'bg-accent-soft text-focus' : 'bg-avatar text-surface'}`}
      aria-hidden="true"
    >
      {initials}
      {src && src !== failedSrc && (
        <img className="absolute inset-0 size-full object-cover" src={src} alt="" onError={() => setFailedSrc(src)} />
      )}
    </span>
  )
}
