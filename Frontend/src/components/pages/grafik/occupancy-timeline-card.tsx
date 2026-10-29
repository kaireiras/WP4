import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { OccupancyDataPoint } from './grafik-data'
import { getOccupancyColor, getOccupancyLabel } from './grafik-data'
import { cn } from '#/lib/utils'

export interface OccupancyTimelineCardProps {
  data: OccupancyDataPoint[]
  className?: string
}

export function OccupancyTimelineCard({
  data,
  className,
}: OccupancyTimelineCardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-neutral-n800 border border-neutral-n40 dark:border-neutral-n700 rounded-xl p-5 shadow-xs flex flex-col gap-4',
        className,
      )}
    >
      {/* Header & Legends */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-neutral-n900 dark:text-neutral-n100">
            Occupancy Timeline
          </h2>
          <p className="text-xs sm:text-sm text-neutral-n600 dark:text-neutral-n400 font-normal mt-0.5">
            Level okupansi per interval waktu (bucket)
          </p>
        </div>

        {/* Levels Legend */}
        <div className="flex items-center gap-3.5 flex-wrap text-xs font-semibold text-neutral-n800 dark:text-neutral-n200 self-start sm:self-center">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-xs bg-[#f43f5e] shrink-0" />
            <span>Crowded</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-xs bg-[#f97316] shrink-0" />
            <span>High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-xs bg-[#eab308] shrink-0" />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-xs bg-[#22c55e] shrink-0" />
            <span>Low</span>
          </div>
        </div>
      </div>

      {/* Discrete Bar Chart */}
      <div className="w-full h-64 sm:h-72 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              className="stroke-neutral-200 dark:stroke-neutral-700/60"
            />

            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tick={{ fill: '#64748b', fontSize: 11 }}
            />

            <YAxis
              domain={[0, 3]}
              ticks={[0, 1, 2, 3]}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(value) => `${value}`}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload.length) {
                  const entry = payload[0].payload as OccupancyDataPoint
                  const color = getOccupancyColor(entry.level)
                  const label = getOccupancyLabel(entry.level)

                  return (
                    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-2.5 rounded-lg shadow-md text-xs space-y-1.5">
                      <div className="font-bold text-neutral-800 dark:text-neutral-200">
                        Waktu: {entry.time}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                          Tingkat Okupansi: {label} (Level {entry.levelValue})
                        </span>
                      </div>
                      <div className="text-neutral-500 text-[11px]">
                        Estimasi Keramaian:{' '}
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">
                          {entry.estCount}
                        </span>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />

            <Bar dataKey="levelValue" radius={[6, 6, 0, 0]} maxBarSize={45}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-bar-${index}`}
                  fill={getOccupancyColor(entry.level)}
                  className="transition-opacity hover:opacity-85"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
