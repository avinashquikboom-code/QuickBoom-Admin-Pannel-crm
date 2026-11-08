'use client';

import * as React from 'react';
import { AnalyticsChart } from './analytics-chart';

export function RadarChart(props) {
    return <AnalyticsChart {...props} kind="radar" />;
}

