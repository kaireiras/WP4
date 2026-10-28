import { createFileRoute } from '@tanstack/react-router'
import { DashboardHeader } from '#/components/ui/dashboard-header'
import { ModelOverviewCard, ModelMetricsGrid } from '#/components/pages/model'

export const Route = createFileRoute('/_dashboard/model')({
  component: ModelPage,
})

function ModelPage() {
  return (
    <>
      {/* Header */}
      <DashboardHeader
        title="Informasi Model"
        subtitle="Lihat informasi model machine learning yang digunakan"
      />

      {/* Overview Card */}
      <ModelOverviewCard />

      {/* Metrics Grid */}
      <ModelMetricsGrid />
    </>
  )
}
