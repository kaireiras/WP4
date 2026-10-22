import { createFileRoute } from '@tanstack/react-router'
import { DashboardHeader } from '#/components/ui/dashboard-header'

export const Route = createFileRoute('/_dashboard/grafik')({
  component: GrafikPage,
})

function GrafikPage() {
  return (
    <>
      {/* Page Header (Figma Main-Header) */}
      <DashboardHeader
        title="Grafik"
        subtitle="Analisis tren trafik dan okupansi dalam rentang waktu tertentu"
      />
    </>
  )
}
