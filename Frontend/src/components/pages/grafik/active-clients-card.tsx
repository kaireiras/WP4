import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ActiveClientsDataPoint } from './grafik-data'
import { cn } from '#/lib/utils'

export interface ActiveClientsCardProps {
  data: ActiveClientsDataPoint[]
  className?: string
}

export function ActiveClientsCard({ data, className }: ActiveClientsCardProps) {
  const chartData = data.map((item, idx) => ({
    ...item,
    pointKey: item.pointKey ?? String(idx),
  }))

  const maxClient = Math.max(...chartData.map((d) => d.clients), 100)
  const step = maxClient <= 120 ? 20 : Math.ceil(maxClient / 5 / 10) * 10
  const yDomainMax = maxClient <= 120 ? 120 : step * 5
  const yTicks =
    maxClient <= 120
      ? [0, 20, 40, 60, 80, 100, 120]
      : [0, step, step * 2, step * 3, step * 4, yDomainMax]

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
            Active Clients
          </h2>
          <p className="text-xs sm:text-sm text-neutral-n600 dark:text-neutral-n400 font-normal mt-0.5">
            Jumlah klien aktif per interval waktu
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-n800 dark:text-neutral-n200 self-start sm:self-center">
          <span className="size-3 rounded-xs bg-[#2563EB] shrink-0" />
          <span>Active Clients</span>
        </div>
      </div>

      {/* Area Chart */}
      <div className="w-full h-64 sm:h-72 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="clientsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              className="stroke-neutral-200 dark:stroke-neutral-700/60"
            />

            <XAxis
              dataKey="pointKey"
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(value) => {
                const idx = Number(value)
                return Number.isFinite(idx) && chartData[idx]
                  ? chartData[idx].time
                  : String(value)
              }}
            />

            <YAxis
              domain={[0, yDomainMax]}
              ticks={yTicks}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tick={{ fill: '#64748b', fontSize: 11 }}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload.length) {
                  const point = payload[0]?.payload as
                    ActiveClientsDataPoint | undefined
                  const displayTime =
                    point?.fullTime ?? point?.time ?? String(label)

                  return (
                    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-2.5 rounded-lg shadow-md text-xs space-y-1">
                      <div className="font-bold text-neutral-800 dark:text-neutral-200">
                        Waktu: {displayTime}
                      </div>
                      <div className="flex items-center gap-2 text-[#2563EB] font-semibold">
                        <span className="size-2 rounded-full bg-[#2563EB]" />
                        <span>
                          Klien Aktif:{' '}
                          {point?.isNull
                            ? '0 Perangkat (Belum tercatat)'
                            : `${payload[0]?.value} Perangkat`}
                        </span>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />

            <Area
              type="monotone"
              dataKey="clients"
              stroke="#2563EB"
              strokeWidth={2.5}
              fill="url(#clientsGradient)"
              dot={
                chartData.length <= 15
                  ? { r: 4, strokeWidth: 2, stroke: '#2563EB', fill: '#ffffff' }
                  : false
              }
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
