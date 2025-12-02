import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'

interface VehiclesChartProps {
  data: any[]
}

export function VehiclesChart({ data }: VehiclesChartProps) {
  // Sort data to show top vehicles
  const sortedData = [...data].sort((a, b) => b.value - a.value).slice(0, 7)

  return (
    <Card className="col-span-4 lg:col-span-2 card-shadow border-none">
      <CardHeader>
        <CardTitle>Veículos Mais Vendidos</CardTitle>
        <CardDescription>Top modelos por volume de vendas</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            value: {
              label: 'Quantidade',
              color: 'hsl(var(--primary))',
            },
          }}
          className="h-[300px] w-full"
        >
          <BarChart
            layout="vertical"
            data={sortedData}
            margin={{ top: 0, right: 0, left: 40, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={true}
              vertical={false}
            />
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              width={100}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              content={<ChartTooltipContent hideLabel />}
              cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
              {sortedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`hsl(var(--chart-${(index % 5) + 1}))`}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
