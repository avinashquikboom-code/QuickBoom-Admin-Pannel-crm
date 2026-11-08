'use client';

import * as React from 'react';
import { AnalyticsChart } from './analytics-chart';

export function BarChart(props) {
    return <AnalyticsChart {...props} kind="bar" />;
}

