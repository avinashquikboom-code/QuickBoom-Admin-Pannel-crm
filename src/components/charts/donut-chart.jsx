'use client';

import * as React from 'react';
import { AnalyticsChart } from './analytics-chart';

export function DonutChart(props) {
    return <AnalyticsChart {...props} kind="donut" />;
}

