'use client';

import * as React from 'react';
import { AnalyticsChart } from './analytics-chart';

export function LineChart(props) {
    return <AnalyticsChart {...props} kind="line" />;
}

