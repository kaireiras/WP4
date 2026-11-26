import { ArrowRight, Terminal } from 'lucide-react'
import { cn } from '#/lib/utils'

export interface LoginDevCardProps {
  onLogin?: () => void
  className?: string
}

export function LoginDevCard({ onLogin, className }: LoginDevCardProps) {
  return (
    <div
      className={cn(
        'mb-6 p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs flex items-center justify-between gap-3 text-white transition-all select-none',
        className,
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="size-8 rounded-xl bg-tertiary-400/20 text-tertiary-400 flex items-center justify-center shrink-0">
          <Terminal className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-tertiary-400/20 text-tertiary-400 shrink-0">
              Dev Mode
            </span>
            <span className="text-xs font-semibold text-white truncate">
              Langsung login saja
            </span>
          </div>
          <p className="text-[11px] text-neutral-n30/80 truncate mt-0.5">
            Klik masuk untuk akses cepat tanpa memasukkan kredensial
          </p>
        </div>
      </div>

      {onLogin && (
        <button
          type="button"
          onClick={onLogin}
          className="shrink-0 px-3 py-1.5 rounded-xl bg-tertiary-600 hover:bg-tertiary-700 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          title="Login instan ke Dashboard"
        >
          <span>Masuk</span>
          <ArrowRight className="size-3" />
        </button>
      )}
    </div>
  )
}
