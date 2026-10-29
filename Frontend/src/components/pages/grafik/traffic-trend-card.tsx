import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TrafficDataPoint } from './grafik-data'
import { cn } from '#/lib/utils'

export interface TrafficTrendCardProps {
  data: TrafficDataPoint[]
  className?: string
}

export function TrafficTrendCard({ data, className }: TrafficTrendCardProps) {
  const chartData = data.map((item, idx) => ({
    ...item,
    pointKey: item.pointKey ?? String(idx),
  }))

  const maxRate = Math.max(
    ...chartData.map((d) => Math.max(d.rxRate, d.txRate)),
    100,
  )
  const step = maxRate <= 100 ? 20 : Math.ceil(maxRate / 5 / 20) * 20
  const yDomainMax = step * 5
  const yTicks = [0, step, step * 2, step * 3, step * 4, yDomainMax]

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
            Traffic Trend
          </h2>
          <p className="text-xs sm:text-sm text-neutral-n600 dark:text-neutral-n400 font-normal mt-0.5">
            Traffic per interval waktu
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold text-neutral-n800 dark:text-neutral-n200 self-start sm:self-center">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-xs bg-[#FF6107] shrink-0" />
            <span>RX Rate</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-xs bg-[#DBCC8F] shrink-0" />
            <span>TX Rate</span>
          </div>
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
              <linearGradient id="rxGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF6107" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#FF6107" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="txGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#DBCC8F" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#DBCC8F" stopOpacity={0.0} />
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
                    TrafficDataPoint | undefined
                  const displayTime =
                    point?.fullTime ?? point?.time ?? String(label)

                  return (
                    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-2.5 rounded-lg shadow-md text-xs space-y-1">
                      <div className="font-bold text-neutral-800 dark:text-neutral-200">
                        Waktu: {displayTime}
                      </div>
                      <div className="flex items-center gap-2 text-[#FF6107] font-semibold">
                        <span className="size-2 rounded-full bg-[#FF6107]" />
                        <span>RX Rate: {payload[0]?.value} KB/s</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#b09e53] dark:text-[#DBCC8F] font-semibold">
                        <span className="size-2 rounded-full bg-[#DBCC8F]" />
                        <span>TX Rate: {payload[1]?.value} KB/s</span>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />

            <Area
              type="monotone"
              dataKey="rxRate"
              stroke="#FF6107"
              strokeWidth={2.5}
              fill="url(#rxGradient)"
              dot={
                chartData.length <= 15
                  ? { r: 4, strokeWidth: 2, stroke: '#FF6107', fill: '#ffffff' }
                  : false
              }
              activeDot={{ r: 6, strokeWidth: 2 }}
            />

            <Area
              type="monotone"
              dataKey="txRate"
              stroke="#DBCC8F"
              strokeWidth={2.5}
              fill="url(#txGradient)"
              dot={
                chartData.length <= 15
                  ? { r: 4, strokeWidth: 2, stroke: '#DBCC8F', fill: '#ffffff' }
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
