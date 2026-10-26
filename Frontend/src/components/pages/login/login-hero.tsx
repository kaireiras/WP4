import { cn } from '#/lib/utils'

export interface LoginHeroProps {
  className?: string
}

export function LoginHero({ className }: LoginHeroProps) {
  return (
    <div
      className={cn(
        'w-full h-full flex flex-col items-center justify-between p-8 sm:p-12 lg:p-16 bg-white dark:bg-neutral-n800 select-none transition-colors',
        className,
      )}
    >
      {/* Spacer atas agar konten utama benar-benar berada di tengah vertikal */}
      <div className="h-6" aria-hidden="true" />

      {/* Main Brand Area (Figma 13:66) */}
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto my-auto py-6">
        {/* Logo UGM (Figma 11:735) */}
        <div className="w-48 h-48 sm:w-60 sm:h-60 lg:w-72 lg:h-72 mb-6 sm:mb-8 shrink-0 flex items-center justify-center">
          <img
            src="/logo-ugm.svg"
            alt="Logo Universitas Gadjah Mada"
            className="w-full h-full object-contain drop-shadow-sm select-none"
            loading="eager"
          />
        </div>

        {/* Brand Titles (Figma 13:67, 13:73, 13:74) */}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-600 tracking-tight leading-tight mb-2 sm:mb-3">
          Pendeteksi Keramaian
        </h2>
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-primary-600 tracking-tight leading-snug mb-1">
          Departemen Teknik Elektro Dan Informatika
        </h3>
        <h4 className="text-lg sm:text-xl lg:text-2xl font-bold text-primary-600 tracking-tight leading-snug">
          Universitas Gadjah Mada
        </h4>
      </div>

      {/* Bottom Status Pill: Connected (Figma 21:44 -> 22:451) */}
      <div className="pt-4 flex justify-center w-full">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-success-50 text-white shadow-xs">
          <span className="size-2 rounded-full bg-success-20 shrink-0 animate-pulse" />
          <span className="text-xs font-normal tracking-wide">Connected</span>
        </div>
      </div>
    </div>
  )
}
