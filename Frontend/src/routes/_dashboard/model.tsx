import { createFileRoute } from '@tanstack/react-router'
import { DashboardHeader } from '#/components/ui/dashboard-header'
import { ModelOverviewCard, ModelMetricsGrid } from '#/components/pages/model'

export const Route = createFileRoute('/_dashboard/model')({
  component: ModelPage,
})

function ModelPage() {
  return (
    <>
      {/* 1. Page Header (Figma Main-Header) */}
      <DashboardHeader
        title="Informasi Model"
        subtitle="Lihat informasi model machine learning yang digunakan"
      />

      {/* 2. Hero Overview Card with Model Info, Deployed Date & Quick Specs */}
      <ModelOverviewCard />

      {/* 3. Core 6 Metrics Grid (Figma 13:72 Data) */}
      <ModelMetricsGrid />
    </>
  )
}
