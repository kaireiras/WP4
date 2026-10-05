import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Palette, Sparkles } from 'lucide-react'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col justify-center items-center p-6 md:p-12">
      <div className="max-w-2xl w-full text-center space-y-6">
        <div className="flex flex-col items-center gap-3">
          <img
            src="/logo-ugm.svg"
            alt="Logo UGM"
            className="w-16 h-16 object-contain drop-shadow-xs"
          />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-small-semibold">
            <Sparkles className="w-4 h-4 text-primary-600" />
            <span>PLMD · Deteksi Keramaian</span>
          </div>
        </div>

        <h1 className="heading-h2 text-neutral-n900">
          Crowd Detection Frontend
        </h1>

        <p className="text-regular-normal text-muted-foreground max-w-lg mx-auto">
          Aplikasi pemantauan dan deteksi keramaian ruangan secara real-time
          berbasis TanStack Start, React 19, dan Tailwind CSS v4.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/desain"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary-700 transition-colors px-6 py-3 rounded-lg text-small-medium shadow-sm"
          >
            <Palette className="w-4 h-4" />
            <span>Lihat Desain & Tokens</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
