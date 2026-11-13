'use client';

import * as React from 'react';
import api from '../../../../../lib/api';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { toast } from '@/hooks/use-toast';

const tabs = ['Overview', 'API Usage', 'Daily & Monthly Quotas', 'Usage History', 'API Configuration'];

function unwrap(payload) {
  return payload?.data?.data || payload?.data || payload || {};
}

export default function GoogleMapsManagementPage() {
  const [tab, setTab] = React.useState(tabs[0]);
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [apiName, setApiName] = React.useState('');
  const [overview, setOverview] = React.useState(null);
  const [breakdown, setBreakdown] = React.useState([]);
  const [history, setHistory] = React.useState([]);
  const [alerts, setAlerts] = React.useState([]);
  const [quota, setQuota] = React.useState({ dailyLimit: 1000, monthlyLimit: 20000, alertsEnabled: true, enforcementEnabled: false, recipients: '', timezone: 'Asia/Kolkata', warningThresholds: [80, 90, 95] });

  const load = React.useCallback(async () => {
    const params = { from: from || undefined, to: to || undefined, api: apiName || undefined };
    try {
      const [overviewRes, breakdownRes, historyRes, quotaRes, alertsRes] = await Promise.all([
        api.get('/admin/google-maps/usage/overview', { params }),
        api.get('/admin/google-maps/usage/breakdown', { params }),
        api.get('/admin/google-maps/usage/history', { params }),
        api.get('/admin/google-maps/quotas'),
        api.get('/admin/google-maps/alerts'),
      ]);
      setOverview(unwrap(overviewRes));
      const rows = unwrap(breakdownRes);
      setBreakdown(rows.apis || []);
      setHistory(unwrap(historyRes).rows || []);
      setQuota(unwrap(quotaRes));
      setAlerts(unwrap(alertsRes).data || unwrap(alertsRes) || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Google Maps usage could not be loaded.');
    }
  }, [from, to, apiName]);

  React.useEffect(() => { load(); }, [load]);

  async function save(event) {
    event.preventDefault();
    try {
      await api.put('/admin/google-maps/quotas', {
        ...quota,
        dailyLimit: Number(quota.dailyLimit),
        monthlyLimit: Number(quota.monthlyLimit),
        warningThresholds: [80, 90, 95],
      });
      toast.success('Google Maps quota saved');
      load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Quota was not saved.');
    }
  }

  const today = overview?.today || {};
  const month = overview?.month || {};
  const selected = overview?.selected || {};

  return (
    <div className="space-y-6">
      <PageHeader title="Google Maps Management" description="Internal QB Suite usage of backend Google Maps calls. These limits are separate from Google Cloud quotas." />
      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <Button key={item} variant={tab === item ? 'default' : 'outline'} onClick={() => setTab(item)}>{item}</Button>
        ))}
      </div>
      <div className="grid gap-2 md:grid-cols-4">
        <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="From" />
        <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="To" />
        <Input value={apiName} onChange={(event) => setApiName(event.target.value)} placeholder="Filter API name" />
        <Button variant="outline" onClick={load}>Apply</Button>
      </div>
      {overview?.note ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{overview.note}</p> : null}
      {(tab === 'Overview' || tab === 'API Usage') && (
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ['Today', today],
            ['This month', month],
          ].map(([label, card]) => (
            <div key={label} className="rounded-xl border bg-white p-4">
              <div className="text-sm text-slate-500">{label}</div>
              <div className="text-2xl font-semibold">{card.requests || 0} / {card.limit || 0}</div>
              <div className="text-sm">{card.remaining || 0} remaining · {card.percent || 0}%</div>
              <div className="mt-2 h-2 rounded bg-slate-100"><div className="h-2 rounded bg-emerald-600" style={{ width: `${Math.min(100, card.percent || 0)}%` }} /></div>
            </div>
          ))}
          <div className="rounded-xl border bg-white p-4 text-sm">
            <div>Requests in range: {selected.requests || 0}</div>
            <div>Successful: {selected.success || 0}</div>
            <div>Failed: {selected.failed || 0}</div>
            <div className="mt-2 text-slate-500">Estimated Google cost is not shown. This API does not return billing amounts.</div>
          </div>
        </div>
      )}
      {tab === 'API Usage' && (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left">{['API', 'Requests', 'Success', 'Failed', 'Daily quota', 'Monthly quota', 'Usage', 'Status'].map((head) => <th key={head} className="p-3">{head}</th>)}</tr></thead>
            <tbody>
              {breakdown.map((row) => (
                <tr key={row.apiName} className="border-b">
                  <td className="p-3">{row.apiName}</td>
                  <td className="p-3">{row.requests}</td>
                  <td className="p-3">{row.success}</td>
                  <td className="p-3">{row.failed}</td>
                  <td className="p-3">{row.dailyQuota}</td>
                  <td className="p-3">{row.monthlyQuota}</td>
                  <td className="p-3">{row.percent}%</td>
                  <td className="p-3">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === 'Usage History' && (
        <div className="space-y-2 rounded-xl border bg-white p-4">
          {history.map((row) => (
            <div key={`${row.day}-${row.apiName}`} className="grid grid-cols-4 text-sm">
              <span>{row.day}</span><span>{row.apiName}</span><span>{row.success} ok</span><span>{row.failed} failed / {row.requests}</span>
            </div>
          ))}
          {!history.length ? <p className="text-sm text-slate-500">No tracked requests in this range.</p> : null}
        </div>
      )}
      {(tab === 'Daily & Monthly Quotas' || tab === 'API Configuration') && (
        <form className="grid max-w-xl gap-3 rounded-xl border bg-white p-4" onSubmit={save}>
          <label className="text-sm">Daily quota<Input type="number" min="0" value={quota.dailyLimit} onChange={(event) => setQuota({ ...quota, dailyLimit: event.target.value })} /></label>
          <label className="text-sm">Monthly quota<Input type="number" min="0" value={quota.monthlyLimit} onChange={(event) => setQuota({ ...quota, monthlyLimit: event.target.value })} /></label>
          <label className="text-sm">Alert recipients<Input value={quota.recipients || ''} onChange={(event) => setQuota({ ...quota, recipients: event.target.value })} placeholder="ops@company.com" /></label>
          <label className="text-sm">Timezone<Input value={quota.timezone || 'Asia/Kolkata'} onChange={(event) => setQuota({ ...quota, timezone: event.target.value })} /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(quota.alertsEnabled)} onChange={(event) => setQuota({ ...quota, alertsEnabled: event.target.checked })} /> Enable usage alerts at 80%, 90%, 95%, and 100%</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(quota.enforcementEnabled)} onChange={(event) => setQuota({ ...quota, enforcementEnabled: event.target.checked })} /> Stop new backend Google Maps requests when the internal quota is exhausted</label>
          <div className="flex gap-2">
            <Button type="submit">Save settings</Button>
            <Button type="button" variant="outline" onClick={() => setQuota({ ...quota, dailyLimit: 1000, monthlyLimit: 20000, enforcementEnabled: false })}>Reset</Button>
            <Button type="button" variant="outline" onClick={async () => { await api.post('/admin/google-maps/alerts/test'); toast.success('Test alert created'); load(); }}>Test alert</Button>
          </div>
        </form>
      )}
      {tab === 'Overview' && (
        <div className="rounded-xl border bg-white p-4 text-sm">
          <h2 className="font-semibold">Alerts</h2>
          {(Array.isArray(alerts) ? alerts : []).slice(0, 8).map((alert) => <p key={alert.id}>{alert.message}</p>)}
          {!alerts?.length ? <p className="text-slate-500">No quota alerts yet.</p> : null}
        </div>
      )}
    </div>
  );
}
