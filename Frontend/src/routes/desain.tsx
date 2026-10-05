import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/desain')({ component: DesainPage })

const primaryShades = [
  { name: '50', hex: '#ECF4FE', bg: 'bg-primary-50', text: 'text-neutral-900' },
  {
    name: '100',
    hex: '#C4DCFA',
    bg: 'bg-primary-100',
    text: 'text-neutral-900',
  },
  {
    name: '200',
    hex: '#9DC3F7',
    bg: 'bg-primary-200',
    text: 'text-neutral-900',
  },
  {
    name: '300',
    hex: '#75ABF4',
    bg: 'bg-primary-300',
    text: 'text-neutral-900',
  },
  { name: '400', hex: '#4D93F1', bg: 'bg-primary-400', text: 'text-white' },
  { name: '500', hex: '#267BEE', bg: 'bg-primary-500', text: 'text-white' },
  { name: '600', hex: '#1166D8', bg: 'bg-primary-600', text: 'text-white' },
  { name: '700', hex: '#0E53B0', bg: 'bg-primary-700', text: 'text-white' },
  { name: '800', hex: '#0B4088', bg: 'bg-primary-800', text: 'text-white' },
  { name: '900', hex: '#093672', bg: 'bg-primary-900', text: 'text-white' },
  { name: '950', hex: '#041B39', bg: 'bg-primary-950', text: 'text-white' },
]

const secondaryShades = [
  {
    name: '50',
    hex: '#FDEDEE',
    bg: 'bg-secondary-50',
    text: 'text-neutral-900',
  },
  {
    name: '100',
    hex: '#F9C6CA',
    bg: 'bg-secondary-100',
    text: 'text-neutral-900',
  },
  {
    name: '200',
    hex: '#F4A0A6',
    bg: 'bg-secondary-200',
    text: 'text-neutral-900',
  },
  {
    name: '300',
    hex: '#F07982',
    bg: 'bg-secondary-300',
    text: 'text-neutral-900',
  },
  { name: '400', hex: '#EC525E', bg: 'bg-secondary-400', text: 'text-white' },
  { name: '500', hex: '#E82C3B', bg: 'bg-secondary-500', text: 'text-white' },
  { name: '600', hex: '#D81827', bg: 'bg-secondary-600', text: 'text-white' },
  { name: '700', hex: '#AB131F', bg: 'bg-secondary-700', text: 'text-white' },
  { name: '800', hex: '#840F18', bg: 'bg-secondary-800', text: 'text-white' },
  { name: '900', hex: '#5E0A11', bg: 'bg-secondary-900', text: 'text-white' },
  { name: '950', hex: '#37060A', bg: 'bg-secondary-950', text: 'text-white' },
]

const tertiaryShades = [
  {
    name: '50',
    hex: '#FEF9EC',
    bg: 'bg-tertiary-50',
    text: 'text-neutral-900',
  },
  {
    name: '100',
    hex: '#FCEDC3',
    bg: 'bg-tertiary-100',
    text: 'text-neutral-900',
  },
  {
    name: '200',
    hex: '#F9E09B',
    bg: 'bg-tertiary-200',
    text: 'text-neutral-900',
  },
  {
    name: '300',
    hex: '#F7D472',
    bg: 'bg-tertiary-300',
    text: 'text-neutral-900',
  },
  {
    name: '400',
    hex: '#F4C84A',
    bg: 'bg-tertiary-400',
    text: 'text-neutral-900',
  },
  {
    name: '500',
    hex: '#F2BB21',
    bg: 'bg-tertiary-500',
    text: 'text-neutral-900',
  },
  { name: '600', hex: '#DCA50D', bg: 'bg-tertiary-600', text: 'text-white' },
  { name: '700', hex: '#B3870A', bg: 'bg-tertiary-700', text: 'text-white' },
  { name: '800', hex: '#8B6808', bg: 'bg-tertiary-800', text: 'text-white' },
  { name: '900', hex: '#624A06', bg: 'bg-tertiary-900', text: 'text-white' },
  { name: '950', hex: '#3A2B03', bg: 'bg-tertiary-950', text: 'text-white' },
]

const yellowShades = [
  { name: '50', hex: '#FFFFEB', bg: 'bg-yellow-50', text: 'text-neutral-900' },
  {
    name: '100',
    hex: '#FFFFC0',
    bg: 'bg-yellow-100',
    text: 'text-neutral-900',
  },
  {
    name: '200',
    hex: '#FFFF95',
    bg: 'bg-yellow-200',
    text: 'text-neutral-900',
  },
  {
    name: '300',
    hex: '#FFFF6A',
    bg: 'bg-yellow-300',
    text: 'text-neutral-900',
  },
  {
    name: '400',
    hex: '#FFFF3F',
    bg: 'bg-yellow-400',
    text: 'text-neutral-900',
  },
  {
    name: '500',
    hex: '#FFFF00',
    bg: 'bg-yellow-500',
    text: 'text-neutral-900',
  },
  {
    name: '600',
    hex: '#E9E900',
    bg: 'bg-yellow-600',
    text: 'text-neutral-900',
  },
  {
    name: '700',
    hex: '#BEBE00',
    bg: 'bg-yellow-700',
    text: 'text-neutral-900',
  },
  { name: '800', hex: '#939300', bg: 'bg-yellow-800', text: 'text-white' },
  { name: '900', hex: '#686800', bg: 'bg-yellow-900', text: 'text-white' },
  { name: '950', hex: '#3D3D00', bg: 'bg-yellow-950', text: 'text-white' },
]

const successShades = [
  { name: '5', hex: '#F0FDF4', bg: 'bg-success-5', text: 'text-neutral-900' },
  { name: '10', hex: '#DCFCE7', bg: 'bg-success-10', text: 'text-neutral-900' },
  { name: '20', hex: '#BBF7D0', bg: 'bg-success-20', text: 'text-neutral-900' },
  { name: '30', hex: '#86EFAC', bg: 'bg-success-30', text: 'text-neutral-900' },
  { name: '40', hex: '#4ADE80', bg: 'bg-success-40', text: 'text-neutral-900' },
  { name: '50', hex: '#22C55E', bg: 'bg-success-50', text: 'text-white' },
  { name: '60', hex: '#16A34A', bg: 'bg-success-60', text: 'text-white' },
  { name: '70', hex: '#15803D', bg: 'bg-success-70', text: 'text-white' },
  { name: '80', hex: '#166534', bg: 'bg-success-80', text: 'text-white' },
  { name: '90', hex: '#14532D', bg: 'bg-success-90', text: 'text-white' },
]

const destructiveShades = [
  {
    name: '5',
    hex: '#FFF1F2',
    bg: 'bg-destructive-5',
    text: 'text-neutral-900',
  },
  {
    name: '10',
    hex: '#FFE4E6',
    bg: 'bg-destructive-10',
    text: 'text-neutral-900',
  },
  {
    name: '20',
    hex: '#FECDD3',
    bg: 'bg-destructive-20',
    text: 'text-neutral-900',
  },
  {
    name: '30',
    hex: '#FDA4AF',
    bg: 'bg-destructive-30',
    text: 'text-neutral-900',
  },
  { name: '40', hex: '#FB7185', bg: 'bg-destructive-40', text: 'text-white' },
  { name: '50', hex: '#F43F5E', bg: 'bg-destructive-50', text: 'text-white' },
  { name: '60', hex: '#E11D48', bg: 'bg-destructive-60', text: 'text-white' },
  { name: '70', hex: '#BE123C', bg: 'bg-destructive-70', text: 'text-white' },
  { name: '80', hex: '#9F1239', bg: 'bg-destructive-80', text: 'text-white' },
  { name: '90', hex: '#881337', bg: 'bg-destructive-90', text: 'text-white' },
]

const warningShades = [
  { name: '5', hex: '#FFFBEB', bg: 'bg-warning-5', text: 'text-neutral-900' },
  { name: '10', hex: '#FEF3C7', bg: 'bg-warning-10', text: 'text-neutral-900' },
  { name: '20', hex: '#FDE68A', bg: 'bg-warning-20', text: 'text-neutral-900' },
  { name: '30', hex: '#FCD34D', bg: 'bg-warning-30', text: 'text-neutral-900' },
  { name: '40', hex: '#FBBF24', bg: 'bg-warning-40', text: 'text-neutral-900' },
  { name: '50', hex: '#F59E0B', bg: 'bg-warning-50', text: 'text-neutral-900' },
  { name: '60', hex: '#D97706', bg: 'bg-warning-60', text: 'text-white' },
  { name: '70', hex: '#B45309', bg: 'bg-warning-70', text: 'text-white' },
  { name: '80', hex: '#92400E', bg: 'bg-warning-80', text: 'text-white' },
  { name: '90', hex: '#78350F', bg: 'bg-warning-90', text: 'text-white' },
]

const neutralShades = [
  {
    name: 'N0',
    hex: '#FFFFFF',
    bg: 'bg-neutral-n0 border border-neutral-n40',
    text: 'text-neutral-900',
  },
  {
    name: 'N10',
    hex: '#FAFAFA',
    bg: 'bg-neutral-n10',
    text: 'text-neutral-900',
  },
  {
    name: 'N20',
    hex: '#F5F5F5',
    bg: 'bg-neutral-n20',
    text: 'text-neutral-900',
  },
  {
    name: 'N30',
    hex: '#EBEBEB',
    bg: 'bg-neutral-n30',
    text: 'text-neutral-900',
  },
  {
    name: 'N40',
    hex: '#DEDEDE',
    bg: 'bg-neutral-n40',
    text: 'text-neutral-900',
  },
  {
    name: 'N50',
    hex: '#BFBFBF',
    bg: 'bg-neutral-n50',
    text: 'text-neutral-900',
  },
  {
    name: 'N60',
    hex: '#B0B0B0',
    bg: 'bg-neutral-n60',
    text: 'text-neutral-900',
  },
  { name: 'N70', hex: '#A3A3A3', bg: 'bg-neutral-n70', text: 'text-white' },
  { name: 'N80', hex: '#949494', bg: 'bg-neutral-n80', text: 'text-white' },
  { name: 'N90', hex: '#858585', bg: 'bg-neutral-n90', text: 'text-white' },
  { name: 'N100', hex: '#757575', bg: 'bg-neutral-n100', text: 'text-white' },
  { name: 'N200', hex: '#666666', bg: 'bg-neutral-n200', text: 'text-white' },
  { name: 'N300', hex: '#575757', bg: 'bg-neutral-n300', text: 'text-white' },
  { name: 'N400', hex: '#4A4A4A', bg: 'bg-neutral-n400', text: 'text-white' },
  { name: 'N500', hex: '#3B3B3B', bg: 'bg-neutral-n500', text: 'text-white' },
  { name: 'N600', hex: '#2E2E2E', bg: 'bg-neutral-n600', text: 'text-white' },
  { name: 'N700', hex: '#1C1C1C', bg: 'bg-neutral-n700', text: 'text-white' },
  { name: 'N800', hex: '#0D0D0D', bg: 'bg-neutral-n800', text: 'text-white' },
  { name: 'N900', hex: '#000000', bg: 'bg-neutral-n900', text: 'text-white' },
]

function DesainPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-6 md:p-12 space-y-12">
      {/* Navigation Header */}
      <header className="border-b border-border pb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-small-medium text-primary hover:text-primary-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>
        <p className="heading-tagline text-primary mb-2">
          PLMD Deteksi Keramaian · Design System
        </p>
        <h1 className="heading-h2 text-neutral-n900 tracking-tight">
          Global Design Tokens
        </h1>
        <p className="text-regular-normal text-muted-foreground mt-2 max-w-3xl">
          Format token desain diekstrak secara presisi dari Figma (Color Style &
          Typography) dan terintegrasi penuh ke dalam Tailwind CSS v4 serta CSS
          variables global.
        </p>
      </header>

      {/* Typography Section */}
      <section className="space-y-6">
        <h2 className="heading-h4 text-neutral-n900 border-b border-border pb-3">
          1. Typography (Nunito Font)
        </h2>

        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="heading-tagline text-muted-foreground uppercase tracking-wider">
              Heading Hierarchy
            </h3>
            <div className="space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-neutral-n30 pb-3">
                <span className="text-small-medium text-muted-foreground w-48">
                  H1 · Bold 72px / 120%
                </span>
                <span className="heading-h1">Heading 1 Display</span>
              </div>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-neutral-n30 pb-3">
                <span className="text-small-medium text-muted-foreground w-48">
                  H2 · Bold 52px / 120%
                </span>
                <span className="heading-h2">Heading 2 Display</span>
              </div>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-neutral-n30 pb-3">
                <span className="text-small-medium text-muted-foreground w-48">
                  H3 · Bold 44px / 120%
                </span>
                <span className="heading-h3">Heading 3 Display</span>
              </div>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-neutral-n30 pb-3">
                <span className="text-small-medium text-muted-foreground w-48">
                  H4 · Bold 36px / 125%
                </span>
                <span className="heading-h4">Heading 4 Display</span>
              </div>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-neutral-n30 pb-3">
                <span className="text-small-medium text-muted-foreground w-48">
                  H5 · Bold 28px / 125%
                </span>
                <span className="heading-h5">Heading 5 Display</span>
              </div>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-neutral-n30 pb-3">
                <span className="text-small-medium text-muted-foreground w-48">
                  H6 · Bold 22px / 125%
                </span>
                <span className="heading-h6">Heading 6 Display</span>
              </div>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                <span className="text-small-medium text-muted-foreground w-48">
                  Tagline · SemiBold 16px
                </span>
                <span className="heading-tagline">Tagline Section Title</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border space-y-4">
            <h3 className="heading-tagline text-muted-foreground uppercase tracking-wider">
              Body Text Scales (Pantau kepadatan ruangan secara real-time)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-4 rounded-lg bg-neutral-n10 border border-neutral-n30 space-y-2">
                <span className="text-tiny-bold text-primary">
                  Large (22px / 125%)
                </span>
                <p className="text-large-bold">Large Bold</p>
                <p className="text-large-medium">Large Medium</p>
                <p className="text-large-normal">Large Normal</p>
                <a href="#test" className="text-large-link block">
                  Large Link
                </a>
              </div>

              <div className="p-4 rounded-lg bg-neutral-n10 border border-neutral-n30 space-y-2">
                <span className="text-tiny-bold text-primary">
                  Medium (18px / 125%)
                </span>
                <p className="text-medium-bold">Medium Bold</p>
                <p className="text-medium-medium">Medium Medium</p>
                <p className="text-medium-normal">Medium Normal</p>
                <a href="#test" className="text-medium-link block">
                  Medium Link
                </a>
              </div>

              <div className="p-4 rounded-lg bg-neutral-n10 border border-neutral-n30 space-y-2">
                <span className="text-tiny-bold text-primary">
                  Regular (16px)
                </span>
                <p className="text-regular-bold">Regular Bold (160% leading)</p>
                <p className="text-regular-semibold">Regular SemiBold (160%)</p>
                <p className="text-regular-medium">Regular Medium</p>
                <p className="text-regular-normal">Regular Normal</p>
                <a href="#test" className="text-regular-link block">
                  Regular Link
                </a>
              </div>

              <div className="p-4 rounded-lg bg-neutral-n10 border border-neutral-n30 space-y-2">
                <span className="text-tiny-bold text-primary">
                  Small (14px / 125%)
                </span>
                <p className="text-small-bold">Small Bold</p>
                <p className="text-small-medium">Small Medium</p>
                <p className="text-small-normal">Small Normal</p>
                <a href="#test" className="text-small-link block">
                  Small Link
                </a>
              </div>

              <div className="p-4 rounded-lg bg-neutral-n10 border border-neutral-n30 space-y-2">
                <span className="text-tiny-bold text-primary">
                  Tiny (12px / 125%)
                </span>
                <p className="text-tiny-bold">Tiny Bold</p>
                <p className="text-tiny-medium">Tiny Medium</p>
                <p className="text-tiny-normal">Tiny Normal</p>
                <a href="#test" className="text-tiny-link block">
                  Tiny Link
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Colors Section */}
      <section className="space-y-6">
        <h2 className="heading-h4 text-neutral-n900 border-b border-border pb-3">
          2. Color Palettes (Figma Swatches)
        </h2>

        {/* Primary */}
        <PaletteRow title="Primary (Blue)" shades={primaryShades} />

        {/* Secondary */}
        <PaletteRow title="Secondary (Crimson)" shades={secondaryShades} />

        {/* Tertiary */}
        <PaletteRow title="Tertiary (Gold / Brown)" shades={tertiaryShades} />

        {/* Yellow */}
        <PaletteRow title="Yellow" shades={yellowShades} />

        {/* Success */}
        <PaletteRow title="Success (Green - 5 to 90)" shades={successShades} />

        {/* Destructive */}
        <PaletteRow
          title="Destructive (Rose - 5 to 90)"
          shades={destructiveShades}
        />

        {/* Warning */}
        <PaletteRow title="Warning (Amber - 5 to 90)" shades={warningShades} />

        {/* Neutral */}
        <div className="space-y-2">
          <h3 className="text-regular-bold text-neutral-n800">
            Neutral (N0 to N900)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-2">
            {neutralShades.map((s) => (
              <div
                key={s.name}
                className={`${s.bg} ${s.text} p-3 rounded-lg flex flex-col justify-between h-20 shadow-xs`}
              >
                <span className="text-tiny-bold">{s.name}</span>
                <span className="text-[10px] font-mono opacity-80">
                  {s.hex}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function PaletteRow({
  title,
  shades,
}: {
  title: string
  shades: Array<{ name: string; hex: string; bg: string; text: string }>
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-regular-bold text-neutral-n800">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2">
        {shades.map((s) => (
          <div
            key={s.name}
            className={`${s.bg} ${s.text} p-3 rounded-lg flex flex-col justify-between h-20 shadow-xs`}
          >
            <span className="text-tiny-bold">{s.name}</span>
            <span className="text-[10px] font-mono opacity-80">{s.hex}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
