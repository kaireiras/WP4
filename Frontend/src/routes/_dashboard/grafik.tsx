import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_dashboard/grafik')({
  component: GrafikPage,
})

function GrafikPage() {
  return (
    <div className="space-y-6">
      {/* Page Header (Figma Main-Header) */}
      <div className="space-y-1">
        <h1 className="font-sans font-bold text-2xl lg:text-[28px] text-neutral-n900 leading-tight">
          Grafik
        </h1>
        <p className="text-small-normal text-neutral-n500">
          Analisis tren trafik dan okupansi dalam rentang waktu tertentu
        </p>
      </div>
    </div>
  )
}
