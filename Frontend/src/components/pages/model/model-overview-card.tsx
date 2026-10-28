import * as React from 'react'
import {
  Activity,
  Calendar,
  Check,
  Copy,
  Cpu,
  Database,
  Layers,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { CURRENT_MODEL_INFO } from './model-data'
import { ModelStatCard } from './model-stat-card'
import { cn } from '#/lib/utils'

const TECHNICAL_SPECS = [
  {
    icon: Zap,
    label: 'Inference Latency',
    value: CURRENT_MODEL_INFO.latency,
    subtitle: 'Prediksi real-time',
  },
  {
    icon: Database,
    label: 'Training Data',
    value: CURRENT_MODEL_INFO.datasetSamples,
    subtitle: 'Dataset kampus SV',
  },
  {
    icon: Layers,
    label: 'Framework',
    value: 'Scikit-Learn 1.5',
    subtitle: 'Python 3.11 Runtime',
  },
  {
    icon: Activity,
    label: 'Cakupan Ruangan',
    value: '11 Ruangan',
    subtitle: 'Gedung Kuliah SV UGM',
  },
]

export function ModelOverviewCard({ className }: { className?: string }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopyId = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(CURRENT_MODEL_INFO.modelId)
      setCopied(true)
      toast.success('Model ID berhasil disalin ke clipboard')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div
      className={cn(
        'w-full bg-white dark:bg-neutral-n800 border border-neutral-n40 dark:border-neutral-n700 rounded-2xl p-5 sm:p-6 shadow-xs transition-colors',
        className,
      )}
    >
      {/* Top Banner: Status & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-neutral-n30 dark:border-neutral-n700">
        <div className="flex items-center gap-3.5">
          <div className="size-12 rounded-xl bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
            <Cpu className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold font-sans text-neutral-n900 dark:text-neutral-n10 leading-tight">
                {CURRENT_MODEL_INFO.algorithm}
              </h2>
              {/* Active Status Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success-50/15 text-success-60 dark:text-success-40 border border-success-20 dark:border-success-800">
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-50 opacity-75" />
                  <span className="relative inline-flex rounded-full size-2 bg-success-50" />
                </span>
                Active in Production
              </div>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-2">
              <span>{CURRENT_MODEL_INFO.type}</span>
              <span className="text-neutral-300 dark:text-neutral-600">•</span>
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5" />
                Deployed: {CURRENT_MODEL_INFO.deployedDate}
              </span>
            </p>
          </div>
        </div>

        {/* Action Button: Copy Model ID */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleCopyId}
            className="h-9 px-3.5 rounded-lg border border-neutral-n40 dark:border-neutral-700 bg-neutral-n10 hover:bg-neutral-n20 dark:bg-neutral-n700/60 dark:hover:bg-neutral-n700 text-xs font-medium text-neutral-700 dark:text-neutral-200 flex items-center gap-2 transition-colors cursor-pointer"
            title="Salin identifier model"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-success-60 dark:text-success-40" />
                <span className="text-success-60 dark:text-success-40">
                  Tersalin
                </span>
              </>
            ) : (
              <>
                <Copy className="size-3.5 text-neutral-500" />
                <span>Salin Model ID</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid of Key Technical Specs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-5">
        {TECHNICAL_SPECS.map((spec) => (
          <ModelStatCard
            key={spec.label}
            icon={spec.icon}
            label={spec.label}
            value={spec.value}
            subtitle={spec.subtitle}
          />
        ))}
      </div>
    </div>
  )
}
