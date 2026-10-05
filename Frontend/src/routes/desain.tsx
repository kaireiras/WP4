import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Box, Check, Copy, Wifi, WifiOff } from 'lucide-react'
import {
  AlertBanner,
  ConnectionStatus,
  DEFAULT_ROOM_STATUSES,
  Denah,
  Header,
  isMonitoredRoom,
  MetricsGrid,
  MONITORED_ROOM_IDS,
  Sidebar,
  StatusBadge,
  StatusLevel,
} from '#/components/ui'
import type { NavItemId, StatusLevelType } from '#/components/ui'

export const Route = createFileRoute('/desain')({ component: DesainPage })

// Color Swatches Data
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
  const [activeNav, setActiveNav] = React.useState<NavItemId>('dashboard')
  const [sidebarOpen, setSidebarOpen] = React.useState(true)
  const [selectedRoom, setSelectedRoom] = React.useState('CU205')
  const [alertVisible, setAlertVisible] = React.useState(true)
  const [copiedToken, setCopiedToken] = React.useState<string | null>(null)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedToken(text)
    setTimeout(() => setCopiedToken(null), 1500)
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-6 md:p-12 space-y-16">
      {/* Top Breadcrumb & Header */}
      <header className="border-b border-border pb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-small-medium text-primary hover:text-primary-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>
        <p className="heading-tagline text-primary mb-2">
          PLMD Deteksi Keramaian · Design System & UI Components
        </p>
        <h1 className="heading-h2 text-neutral-n900 tracking-tight">
          Design System & Components
        </h1>
        <p className="text-regular-normal text-muted-foreground mt-2 max-w-3xl">
          Komponen UI modular siap pakai diekstrak dari Figma Node 170:1200 dan
          disimpan di{' '}
          <code className="text-primary font-mono text-small-medium">
            #/components/ui
          </code>{' '}
          dengan utilitas class-merging{' '}
          <code className="text-primary font-mono text-small-medium">
            cn(...)
          </code>
          .
        </p>
      </header>

      {/* ================================================================== */}
      {/* SECTION 1: LOGO UGM & BRANDING                                     */}
      {/* ================================================================== */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
              <Box className="w-5 h-5" />
            </div>
            <h2 className="heading-h4 text-neutral-n900">
              1. Brand Asset: Logo UGM (Node 11:734)
            </h2>
          </div>
          <span className="text-tiny-normal text-muted-foreground font-mono">
            public/logo-ugm.svg
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Default Logo Card */}
          <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-xs">
            <img
              src="/logo-ugm.svg"
              alt="Logo UGM"
              className="w-24 h-24 object-contain drop-shadow-xs"
            />
            <div>
              <p className="text-regular-bold text-neutral-n900">
                Logo Universitas Gadjah Mada
              </p>
              <p className="text-tiny-normal text-muted-foreground mt-0.5">
                Vektor SVG presisi tinggi · Format Asli Figma
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                handleCopy('<img src="/logo-ugm.svg" alt="Logo UGM" />')
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-n40 bg-neutral-n10 hover:bg-neutral-n20 text-tiny-medium text-neutral-n800 transition-colors cursor-pointer"
            >
              {copiedToken === '<img src="/logo-ugm.svg" alt="Logo UGM" />' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-success-60" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Tag Gambar</span>
                </>
              )}
            </button>
          </div>

          {/* Dark Background Variant */}
          <div className="bg-primary-950 border border-primary-900 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-xs">
            <img
              src="/logo-ugm.svg"
              alt="Logo UGM Dark"
              className="w-24 h-24 object-contain brightness-110"
            />
            <div>
              <p className="text-regular-bold text-white">
                Dark Background Preview
              </p>
              <p className="text-tiny-normal text-primary-200 mt-0.5">
                Warna resmi institusi (#004D71)
              </p>
            </div>
          </div>

          {/* Header Brand Lockup */}
          <div className="bg-card border border-border rounded-xl p-6 flex flex-col justify-between space-y-4 shadow-xs">
            <div>
              <span className="text-tiny-bold text-primary uppercase tracking-wider">
                Brand Lockup
              </span>
              <p className="text-small-medium text-muted-foreground mt-1">
                Kombinasi logo UGM dan identitas aplikasi untuk header &
                sidebar:
              </p>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-n10 border border-neutral-n30">
              <img
                src="/logo-ugm.svg"
                alt="Logo UGM"
                className="w-10 h-10 object-contain shrink-0"
              />
              <div>
                <h4 className="text-small-bold text-primary-600 leading-tight">
                  Aplikasi Pendeteksi Keramaian
                </h4>
                <p className="text-tiny-normal text-muted-foreground">
                  PLMD · DTEDI Sekolah Vokasi UGM
                </p>
              </div>
            </div>

            <span className="text-tiny-normal text-muted-foreground">
              Path aset:{' '}
              <code className="text-primary font-mono">/logo-ugm.svg</code>
            </span>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 2: UI COMPONENTS (Node 170:1200)                           */}
      {/* ================================================================== */}
      <section className="space-y-8">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
              <Box className="w-5 h-5" />
            </div>
            <h2 className="heading-h4 text-neutral-n900">
              2. UI Components Library (Node 170:1200)
            </h2>
          </div>
          <span className="text-tiny-normal text-muted-foreground font-mono">
            src/components/ui/*
          </span>
        </div>

        {/* 2.1 AlertBanner */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-regular-bold text-neutral-n900">
              AlertBanner (
              <code className="font-mono text-primary text-tiny-medium">
                &lt;AlertBanner /&gt;
              </code>
              )
            </h3>
            {!alertVisible && (
              <button
                type="button"
                onClick={() => setAlertVisible(true)}
                className="text-tiny-medium text-primary hover:underline cursor-pointer"
              >
                Tampilkan Ulang Alert
              </button>
            )}
          </div>
          {alertVisible && (
            <AlertBanner
              crowdedRooms={['CU205', 'CU207', 'HU206', 'HU207', 'HU209']}
              onDismiss={() => setAlertVisible(false)}
            />
          )}
        </div>

        {/* 2.2 Header Component */}
        <div className="space-y-3">
          <h3 className="text-regular-bold text-neutral-n900">
            Header (
            <code className="font-mono text-primary text-tiny-medium">
              &lt;Header /&gt;
            </code>
            )
          </h3>
          <div className="border border-border rounded-xl overflow-hidden shadow-xs">
            <Header
              title="Dashboards"
              breadcrumbs={['Main', 'Monitoring', 'Lantai 2']}
              connectionState="synced"
              onRefresh={() => alert('Data refreshed!')}
              userName="Admin DTEDI"
            />
          </div>
        </div>

        {/* 2.3 Status Level & Status Badges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Level */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
            <div>
              <h3 className="text-regular-bold text-neutral-n900">
                Status Level (
                <code className="font-mono text-primary text-tiny-medium">
                  &lt;StatusLevel /&gt;
                </code>
                )
              </h3>
              <p className="text-tiny-normal text-muted-foreground">
                Tersedia 4 level kepadatan (Crowded, High, Medium, Low) dengan
                variasi ukuran dan dot indicator.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center gap-3">
                <StatusLevel status="crowded" size="lg" showDot />
                <StatusLevel status="high" size="lg" showDot />
                <StatusLevel status="medium" size="lg" showDot />
                <StatusLevel status="low" size="lg" showDot />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <StatusLevel status="crowded" size="md" />
                <StatusLevel status="high" size="md" />
                <StatusLevel status="medium" size="md" />
                <StatusLevel status="low" size="md" />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <StatusLevel status="crowded" size="sm" showDot />
                <StatusLevel status="high" size="sm" showDot />
                <StatusLevel status="medium" size="sm" showDot />
                <StatusLevel status="low" size="sm" showDot />
              </div>
            </div>
          </div>

          {/* Status Badge & Connection Status */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
            <div>
              <h3 className="text-regular-bold text-neutral-n900">
                Status & Connection Badges
              </h3>
              <p className="text-tiny-normal text-muted-foreground">
                Komponen Status (Active / Acknowledged) & Terhubung (Connection
                status pill).
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <span className="text-tiny-bold text-muted-foreground uppercase tracking-wider">
                  Status Badge (
                  <code className="font-mono text-primary text-tiny-medium">
                    &lt;StatusBadge /&gt;
                  </code>
                  )
                </span>
                <div className="flex items-center gap-3">
                  <StatusBadge status="active" />
                  <StatusBadge status="acknowledged" />
                  <StatusBadge status="active" size="sm" />
                  <StatusBadge status="acknowledged" size="sm" />
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border">
                <span className="text-tiny-bold text-muted-foreground uppercase tracking-wider">
                  Terhubung (
                  <code className="font-mono text-primary text-tiny-medium">
                    &lt;ConnectionStatus /&gt;
                  </code>
                  )
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <ConnectionStatus state="connected" label="Connected" />
                  <ConnectionStatus state="synced" lastSyncTime="12:09:15" />
                  <ConnectionStatus state="disconnected" label="Disconnected" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2.4 MetricsGrid & Sidebar Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar Live Preview */}
          <div className="lg:col-span-4 bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-regular-bold text-neutral-n900">
                  Sidebar (
                  <code className="font-mono text-primary text-tiny-medium">
                    &lt;Sidebar /&gt;
                  </code>
                  )
                </h3>
                <p className="text-tiny-normal text-muted-foreground">
                  Status:{' '}
                  {sidebarOpen ? 'Open (Expanded)' : 'Close (Collapsed)'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen((prev) => !prev)}
                className="px-2.5 py-1 rounded-md text-tiny-medium bg-primary-50 text-primary border border-primary-200 hover:bg-primary-100 cursor-pointer"
              >
                {sidebarOpen ? 'Kecilkan' : 'Perlebar'}
              </button>
            </div>

            <div className="h-[460px] border border-neutral-n30 rounded-lg overflow-hidden flex bg-neutral-n10">
              <Sidebar
                isOpen={sidebarOpen}
                current={activeNav}
                onSelect={(id) => setActiveNav(id)}
                onToggle={() => setSidebarOpen((prev) => !prev)}
                onLogout={() => alert('Logout clicked!')}
                className="h-full border-r-0"
              />
            </div>
          </div>

          {/* MetricsGrid Live Preview */}
          <div className="lg:col-span-8 bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-regular-bold text-neutral-n900">
                  MetricsGrid (
                  <code className="font-mono text-primary text-tiny-medium">
                    &lt;MetricsGrid /&gt;
                  </code>
                  )
                </h3>
                {isMonitoredRoom(selectedRoom) ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-tiny-semibold bg-primary-50 text-primary-700 border border-primary-200">
                    <Wifi className="w-3.5 h-3.5 text-primary-600" />
                    AP Terpasang · Deteksi Aktif
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-tiny-semibold bg-neutral-n40 text-neutral-n600 border border-neutral-n50">
                    <WifiOff className="w-3.5 h-3.5 text-neutral-n200" />
                    Tanpa AP · Statis Gray
                  </span>
                )}
              </div>
              <p className="text-tiny-normal text-muted-foreground mt-1">
                Menampilkan telemetri live per ruangan (RX Rate, TX Rate,
                Packets/sec, Flow Count, Active Clients, Connection Rate).
              </p>
            </div>

            <div className="flex justify-center p-4 bg-neutral-n10 dark:bg-neutral-800 rounded-lg border border-neutral-n30">
              {isMonitoredRoom(selectedRoom) ? (
                <MetricsGrid
                  roomName={selectedRoom}
                  statusLevel={DEFAULT_ROOM_STATUSES[selectedRoom]}
                  isLive={true}
                  updatedAt="Diperbarui 12:09:15"
                />
              ) : (
                <div className="text-center py-6 px-4 max-w-md space-y-3">
                  <div className="w-12 h-12 rounded-full bg-neutral-n40 dark:bg-neutral-n700 border border-neutral-n50 dark:border-neutral-n600 mx-auto flex items-center justify-center text-neutral-n500 dark:text-neutral-n400">
                    <WifiOff className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-small-bold text-neutral-n900 dark:text-neutral-n100">
                      Ruangan Statis ({selectedRoom}) — Tanpa Access Point
                    </h4>
                    <p className="text-tiny-normal text-muted-foreground mt-1 leading-relaxed">
                      Ruangan ini tidak memiliki perangkat Access Point (AP),
                      sehingga telemetri deteksi keramaian tidak dapat diukur
                      dan ruangan tetap berstatus statis abu-abu (#DEDEDE).
                    </p>
                  </div>
                  <div className="pt-2">
                    <span className="text-tiny-medium text-muted-foreground block mb-2">
                      Pilih salah satu dari 11 ruangan terpasang AP:
                    </span>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {MONITORED_ROOM_IDS.map((rId) => (
                        <button
                          key={rId}
                          type="button"
                          onClick={() => setSelectedRoom(rId)}
                          className="px-2 py-0.5 rounded text-tiny-semibold bg-white dark:bg-neutral-n800 border border-primary-200 text-primary-700 hover:bg-primary-50 cursor-pointer transition-colors"
                        >
                          {rId}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="text-tiny-normal text-muted-foreground">
              💡 Hanya 11 ruangan yang memiliki Access Point (CM201,
              CU204–CU208, HU202A, HU206–HU209). Klik ruangan pada denah di
              bawah untuk mengganti data.
            </div>
          </div>
        </div>

        {/* 2.5 Denah Floor Plan Component */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-regular-bold text-neutral-n900">
                Denah Floor Plan (
                <code className="font-mono text-primary text-tiny-medium">
                  &lt;Denah /&gt;
                </code>
                )
              </h3>
              <p className="text-tiny-normal text-muted-foreground">
                Pemetaan lantai 2 DTEDI SV UGM interaktif. Ruangan terpilih saat
                ini:{' '}
                <span className="font-bold text-primary">{selectedRoom}</span>
                {isMonitoredRoom(selectedRoom) ? (
                  <span className="ml-2 text-tiny-semibold text-success-70">
                    (AP Aktif ·{' '}
                    {DEFAULT_ROOM_STATUSES[selectedRoom].toUpperCase()})
                  </span>
                ) : (
                  <span className="ml-2 text-tiny-normal text-muted-foreground">
                    (Ruangan Statis / Tanpa AP)
                  </span>
                )}
              </p>
            </div>
          </div>

          <Denah
            selectedRoom={selectedRoom}
            onSelectRoom={(roomId) => setSelectedRoom(roomId)}
          />
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 3: DESIGN TOKENS (FIGMA COLOR & TYPOGRAPHY)                */}
      {/* ================================================================== */}
      <section className="space-y-8">
        <div className="border-b border-border pb-3">
          <h2 className="heading-h4 text-neutral-n900">
            3. Typography Hierarchy (Nunito Font)
          </h2>
          <p className="text-small-normal text-muted-foreground mt-1">
            Skala teks dan heading sesuai spesifikasi Figma Node 157:364.
          </p>
        </div>

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
              Body Text Scales
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

      {/* ================================================================== */}
      {/* SECTION 4: COLOR PALETTES (FIGMA NODE 2:37)                        */}
      {/* ================================================================== */}
      <section className="space-y-6">
        <div className="border-b border-border pb-3">
          <h2 className="heading-h4 text-neutral-n900">
            4. Color Palettes (Node 2:37)
          </h2>
          <p className="text-small-normal text-muted-foreground mt-1">
            Palet warna diekstrak langsung dari Figma dan dapat diakses dengan
            class Tailwind.
          </p>
        </div>

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
