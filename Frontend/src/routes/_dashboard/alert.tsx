import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_dashboard/alert')({
  component: AlertPage,
})

function AlertPage() {
  return (
    <div className="space-y-6">
      {/* Page Header (Figma Main-Header) */}
      <div className="space-y-1">
        <h1 className="font-sans font-bold text-2xl lg:text-[28px] text-neutral-n900 leading-tight">
          Riwayat Crowded
        </h1>
        <p className="text-small-normal text-neutral-n500">
          Lihat riwayat kejadian Crowded dan status penanganannya
        </p>
      </div>
    </div>
  )
}
