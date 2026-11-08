'use client';

import * as React from 'react';
import { AnalyticsChart } from './analytics-chart';

export function AreaChart(props) {
    return <AnalyticsChart {...props} kind="area" />;
}

