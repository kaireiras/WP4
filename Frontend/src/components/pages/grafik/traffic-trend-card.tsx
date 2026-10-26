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
  return (
    <div
      className={cn(
        'bg-white dark:bg-neutral-n800 border border-neutral-n40 dark:border-neutral-n700 rounded-xl p-5 shadow-xs flex flex-col gap-4',
        className,
      )}
    >
      {/* 1. Header & Legends */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-neutral-n900 dark:text-neutral-n100">
            Traffic Trend
          </h2>
          <p className="text-xs sm:text-sm text-neutral-n600 dark:text-neutral-n400 font-normal mt-0.5">
            Traffic per interval waktu
          </p>
        </div>

        {/* Custom Legend matching Figma Frame 39972 */}
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

      {/* 2. Area Chart */}
      <div className="w-full h-64 sm:h-72 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
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
              dataKey="time"
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tick={{ fill: '#64748b', fontSize: 11 }}
            />

            <YAxis
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tick={{ fill: '#64748b', fontSize: 11 }}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload.length) {
                  return (
                    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-2.5 rounded-lg shadow-md text-xs space-y-1">
                      <div className="font-bold text-neutral-800 dark:text-neutral-200">
                        Waktu: {label}
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
            />

            <Area
              type="monotone"
              dataKey="txRate"
              stroke="#DBCC8F"
              strokeWidth={2.5}
              fill="url(#txGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
