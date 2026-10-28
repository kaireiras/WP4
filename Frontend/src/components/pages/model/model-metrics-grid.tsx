import { MODEL_CORE_METRICS } from './model-data'
import { ModelMetricCard } from './model-metric-card'
import { cn } from '#/lib/utils'

export function ModelMetricsGrid({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4 font-sans', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span>Metrik Evaluasi Performa Model</span>
            <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 rounded-md bg-neutral-n20 dark:bg-neutral-n700 border border-neutral-n30 dark:border-neutral-600">
              Test Set Data
            </span>
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Hasil evaluasi pengujian model Random Forest terhadap dataset
            validasi independen
          </p>
        </div>
      </div>

      {/* Grid of Core Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODEL_CORE_METRICS.map((metric) => (
          <ModelMetricCard key={metric.id} metric={metric} />
        ))}
      </div>
    </div>
  )
}
