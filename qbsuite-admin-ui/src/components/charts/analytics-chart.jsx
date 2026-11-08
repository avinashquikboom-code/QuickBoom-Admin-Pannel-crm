'use client';

import { Suspense, useId, useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    Radar,
    RadarChart,
    XAxis,
    YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import {
    Table,
    TableCaption,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { formatCurrency } from '@/lib/currency';
import { filterChartRows, pieTotals } from '@/lib/chart-data';

const numbers = new Intl.NumberFormat('en-IN');

// QB Suite brand greens (#5EC169 family)
const QB_GREEN_PALETTE = [
    '#5EC169',
    '#398C45',
    '#4EAD59',
    '#9FD9A8',
    '#C6E9CA',
    '#2D6B36',
];

function AnalyticsChartContent({
    title,
    description,
    data = [],
    series = [],
    kind = 'bar',
    monetary = false,
    loading = false,
    sample = false,
    yLabel = 'Count',
    defaultPeriod = 'all',
    radarKey = 'subject',
}) {
    const id = useId();
    const [period, setPeriod] = useState(defaultPeriod);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    const rows = useMemo(
        () => filterChartRows(data, { period, from, to }),
        [data, period, from, to]
    );

    const config = useMemo(
        () =>
            Object.fromEntries(
                series.map((item, index) => [
                    item.key,
                    {
                        label: item.label,
                        color: item.color || QB_GREEN_PALETTE[index % QB_GREEN_PALETTE.length],
                    },
                ])
            ),
        [series]
    );

    const format = monetary ? formatCurrency : (value) => numbers.format(value);
    const totals = useMemo(() => pieTotals(rows, series), [rows, series]);

    const isPieOrDonut = kind === 'pie' || kind === 'donut';
    const empty =
        !rows.length || (isPieOrDonut && !totals.some((item) => item.value > 0));

    const tooltip = (
        <ChartTooltip
            content={
                <ChartTooltipContent
                    formatter={(value, name) => (
                        <div className="flex min-w-32 justify-between gap-4">
                            <span>{config[name]?.label || name}</span>
                            <strong>{format(value)}</strong>
                        </div>
                    )}
                />
            }
        />
    );

    return (
        <Card className="min-w-0 border-slate-200/80 rounded-2xl shadow-xs" data-chart-card={title}>
            <CardHeader className="space-y-3 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <CardTitle className="text-base font-bold text-slate-900">{title}</CardTitle>
                        {description && (
                            <CardDescription className="mt-0.5 text-xs text-slate-500">
                                {description}
                                {sample && ' · Live Dataset'}
                            </CardDescription>
                        )}
                    </div>
                </div>

                {/* Date and Period Filter Toolbar */}
                <div className="flex flex-wrap items-end gap-2 pt-1">
                    <div className="space-y-1">
                        <Label htmlFor={`${id}-period`} className="text-[11px] font-semibold text-slate-600">
                            Period
                        </Label>
                        <Select
                            value={period}
                            onValueChange={(value) => {
                                setPeriod(value);
                                setFrom('');
                                setTo('');
                            }}
                        >
                            <SelectTrigger id={`${id}-period`} aria-label={`${title} period`} className="h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All dates</SelectItem>
                                <SelectItem value="7">Last 7 days</SelectItem>
                                <SelectItem value="30">Last 30 days</SelectItem>
                                <SelectItem value="90">Last 90 days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                        <Label htmlFor={`${id}-from`} className="text-[11px] font-semibold text-slate-600">
                            From
                        </Label>
                        <Input
                            id={`${id}-from`}
                            aria-label={`${title} from date`}
                            className="h-8 min-w-0 text-xs bg-slate-50/70"
                            type="date"
                            value={from}
                            max={to || undefined}
                            onChange={(event) => setFrom(event.target.value)}
                        />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                        <Label htmlFor={`${id}-to`} className="text-[11px] font-semibold text-slate-600">
                            To
                        </Label>
                        <Input
                            id={`${id}-to`}
                            aria-label={`${title} to date`}
                            className="h-8 min-w-0 text-xs bg-slate-50/70"
                            type="date"
                            value={to}
                            min={from || undefined}
                            onChange={(event) => setTo(event.target.value)}
                        />
                    </div>
                </div>

                <p className="text-[11px] text-muted-foreground" aria-live="polite">
                    {rows.length
                        ? `${rows.length} observations · ${rows[0].date} to ${rows.at(-1).date}`
                        : 'No observations recorded in this date range'}
                </p>
            </CardHeader>

            <CardContent className="min-w-0 pt-0">
                {loading ? (
                    <Skeleton aria-label={`Loading ${title}`} className="h-72 w-full rounded-xl" />
                ) : empty ? (
                    <div className="flex h-72 items-center justify-center" role="status">
                        <EmptyState
                            title="No chart data available"
                            description="Adjust the date range filters or verify data records."
                        />
                    </div>
                ) : (
                    <>
                        <ChartContainer
                            config={config}
                            className="aspect-auto h-72 w-full"
                            role="img"
                            aria-label={`${title}. ${rows.length} dated observations.`}
                        >
                            {kind === 'donut' ? (
                                <PieChart accessibilityLayer>
                                    {tooltip}
                                    <Pie
                                        data={totals}
                                        dataKey="value"
                                        nameKey="key"
                                        innerRadius="55%"
                                        outerRadius="80%"
                                        paddingAngle={4}
                                    >
                                        {totals.map((item, idx) => (
                                            <Cell
                                                key={item.key}
                                                fill={item.fill || QB_GREEN_PALETTE[idx % QB_GREEN_PALETTE.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <ChartLegend content={<ChartLegendContent nameKey="key" className="flex-wrap gap-2 text-xs" />} />
                                </PieChart>
                            ) : kind === 'pie' ? (
                                <PieChart accessibilityLayer>
                                    {tooltip}
                                    <Pie
                                        data={totals}
                                        dataKey="value"
                                        nameKey="key"
                                        innerRadius={0}
                                        outerRadius="75%"
                                        paddingAngle={3}
                                    >
                                        {totals.map((item, idx) => (
                                            <Cell
                                                key={item.key}
                                                fill={item.fill || QB_GREEN_PALETTE[idx % QB_GREEN_PALETTE.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <ChartLegend content={<ChartLegendContent nameKey="key" className="flex-wrap gap-2 text-xs" />} />
                                </PieChart>
                            ) : kind === 'radar' ? (
                                <RadarChart data={rows} accessibilityLayer margin={{ top: 8, right: 10, left: 10, bottom: 8 }}>
                                    <PolarGrid stroke="#E2E8F0" />
                                    <PolarAngleAxis dataKey={radarKey} tick={{ fill: '#64748B', fontSize: 11 }} />
                                    <PolarRadiusAxis />
                                    {tooltip}
                                    <ChartLegend content={<ChartLegendContent className="flex-wrap gap-2 text-xs" />} />
                                    {series.map((item, idx) => (
                                        <Radar
                                            key={item.key}
                                            name={item.label}
                                            dataKey={item.key}
                                            stroke={item.color || QB_GREEN_PALETTE[idx % QB_GREEN_PALETTE.length]}
                                            fill={item.color || QB_GREEN_PALETTE[idx % QB_GREEN_PALETTE.length]}
                                            fillOpacity={0.35}
                                        />
                                    ))}
                                </RadarChart>
                            ) : kind === 'area' ? (
                                <AreaChart data={rows} accessibilityLayer margin={{ top: 8, right: 10, left: 0, bottom: 24 }}>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(value) => value.slice(5)}
                                        tickLine={false}
                                        axisLine={false}
                                        minTickGap={24}
                                        label={{ value: 'Date', position: 'insideBottom', offset: -16 }}
                                    />
                                    <YAxis
                                        width={monetary ? 110 : 65}
                                        tickLine={false}
                                        axisLine={false}
                                        allowDecimals={monetary}
                                        tickFormatter={format}
                                        label={{ value: monetary ? 'INR' : yLabel, angle: -90, position: 'insideLeft' }}
                                    />
                                    {tooltip}
                                    <ChartLegend content={<ChartLegendContent className="flex-wrap gap-2 text-xs" />} />
                                    {series.map((item, idx) => (
                                        <Area
                                            key={item.key}
                                            type="monotone"
                                            dataKey={item.key}
                                            stroke={item.color || QB_GREEN_PALETTE[idx % QB_GREEN_PALETTE.length]}
                                            fill={item.color || QB_GREEN_PALETTE[idx % QB_GREEN_PALETTE.length]}
                                            fillOpacity={0.2}
                                        />
                                    ))}
                                </AreaChart>
                            ) : kind === 'line' ? (
                                <LineChart data={rows} accessibilityLayer margin={{ top: 8, right: 10, left: 0, bottom: 24 }}>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(value) => value.slice(5)}
                                        tickLine={false}
                                        axisLine={false}
                                        minTickGap={24}
                                        label={{ value: 'Date', position: 'insideBottom', offset: -16 }}
                                    />
                                    <YAxis
                                        width={monetary ? 110 : 65}
                                        tickLine={false}
                                        axisLine={false}
                                        allowDecimals={monetary}
                                        tickFormatter={format}
                                        label={{ value: monetary ? 'INR' : yLabel, angle: -90, position: 'insideLeft' }}
                                    />
                                    {tooltip}
                                    <ChartLegend content={<ChartLegendContent className="flex-wrap gap-2 text-xs" />} />
                                    {series.map((item, idx) => (
                                        <Line
                                            key={item.key}
                                            type="monotone"
                                            dataKey={item.key}
                                            stroke={item.color || QB_GREEN_PALETTE[idx % QB_GREEN_PALETTE.length]}
                                            strokeWidth={2.5}
                                            dot={{ r: 3 }}
                                            activeDot={{ r: 5 }}
                                        />
                                    ))}
                                </LineChart>
                            ) : (
                                <BarChart data={rows} accessibilityLayer margin={{ top: 8, right: 10, left: 0, bottom: 24 }}>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(value) => value.slice(5)}
                                        tickLine={false}
                                        axisLine={false}
                                        minTickGap={24}
                                        label={{ value: 'Date', position: 'insideBottom', offset: -16 }}
                                    />
                                    <YAxis
                                        width={monetary ? 110 : 65}
                                        tickLine={false}
                                        axisLine={false}
                                        allowDecimals={monetary}
                                        tickFormatter={format}
                                        label={{ value: monetary ? 'INR' : yLabel, angle: -90, position: 'insideLeft' }}
                                    />
                                    {tooltip}
                                    <ChartLegend content={<ChartLegendContent className="flex-wrap gap-2 text-xs" />} />
                                    {series.map((item, idx) => (
                                        <Bar
                                            key={item.key}
                                            dataKey={item.key}
                                            fill={item.color || QB_GREEN_PALETTE[idx % QB_GREEN_PALETTE.length]}
                                            radius={[4, 4, 0, 0]}
                                            maxBarSize={36}
                                        />
                                    ))}
                                </BarChart>
                            )}
                        </ChartContainer>

                        {/* Accessible Data Table Alternative */}
                        <details className="mt-3 text-xs">
                            <summary className="cursor-pointer text-muted-foreground hover:text-slate-800 transition-colors">
                                View accessible data table
                            </summary>
                            <div className="overflow-x-auto mt-2">
                                <Table className="w-full text-left text-xs">
                                    <TableCaption className="sr-only">{title} data</TableCaption>
                                    <TableHeader>
                                        <TableRow className="border-b border-slate-200">
                                            <TableHead scope="col" className="font-semibold text-slate-700">Date / Category</TableHead>
                                            {series.map((item) => (
                                                <TableHead scope="col" key={item.key} className="font-semibold text-slate-700">
                                                    {item.label}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rows.map((row, index) => (
                                            <TableRow key={`${row.date || index}-${index}`} className="border-b border-slate-100">
                                                <TableHead scope="row" className="font-normal text-slate-600">
                                                    {row.date || row.subject || `Item ${index + 1}`}
                                                </TableHead>
                                                {series.map((item) => (
                                                    <TableCell key={item.key} className="text-slate-700 font-mono">
                                                        {format(row[item.key] ?? 0)}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </details>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

export function AnalyticsChart(props) {
    return (
        <Suspense fallback={<Skeleton aria-label={`Loading ${props.title}`} className="h-96 w-full rounded-2xl" />}>
            <AnalyticsChartContent {...props} />
        </Suspense>
    );
}

