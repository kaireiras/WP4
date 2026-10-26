import { cn } from '#/lib/utils'

export interface LoginMobileHeaderProps {
  className?: string
}

export function LoginMobileHeader({ className }: LoginMobileHeaderProps) {
  return (
    <header
      className={cn(
        'lg:hidden flex items-center gap-3 mb-6 pb-5 border-b border-white/10 select-none',
        className,
      )}
    >
      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 p-1">
        <img
          src="/logo-ugm.svg"
          alt="Logo UGM"
          className="w-full h-full object-contain"
        />
      </div>
      <div>
        <h2 className="text-sm font-bold text-white leading-tight">
          Aplikasi Pendeteksi Keramaian
        </h2>
        <p className="text-xs text-neutral-n30/80">DTEDI SV UGM</p>
      </div>
    </header>
  )
}
