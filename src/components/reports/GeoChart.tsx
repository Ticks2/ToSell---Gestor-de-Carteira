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

interface GeoChartProps {
  data: any[]
}

export function GeoChart({ data }: GeoChartProps) {
  const sortedData = [...data].sort((a, b) => b.value - a.value).slice(0, 10)

  return (
    <Card className="col-span-4 lg:col-span-2 card-shadow border-none">
      <CardHeader>
        <CardTitle>Distribuição Geográfica</CardTitle>
        <CardDescription>Vendas por cidade do cliente</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            value: {
              label: 'Vendas',
              color: 'hsl(var(--chart-2))',
            },
          }}
          className="h-[300px] w-full"
        >
          <BarChart
            data={sortedData}
            margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tick={{ fontSize: 10 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip
              content={<ChartTooltipContent hideLabel />}
              cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
            />
            <Bar
              dataKey="value"
              radius={[4, 4, 0, 0]}
              fill="hsl(var(--chart-3))"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
