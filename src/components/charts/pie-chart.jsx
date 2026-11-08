'use client';

import * as React from 'react';
import { AnalyticsChart } from './analytics-chart';

export function PieChart(props) {
    return <AnalyticsChart {...props} kind="pie" />;
}

