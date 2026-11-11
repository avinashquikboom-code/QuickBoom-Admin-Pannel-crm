'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { toast } from '@/hooks/use-toast';
import { generateHrmReports, hrmError, hrmReportDownload, loadHrmReportDashboard, loadHrmReportSettings, retryHrmDelivery, saveHrmReportSettings } from '@/modules/hrm/hrm-api';

const sections = [
  ['dashboard', 'Dashboard'],
  ['automated', 'Automated Reports'],
  ['attendance', 'Attendance Reports'],
  ['leave-balance', 'Leave Balance Reports'],
  ['salary', 'Salary Reports'],
  ['commission', 'Commission Reports'],
  ['notifications', 'Leave Notifications'],
  ['deliveries', 'Delivery History'],
  ['templates', 'Notification Templates'],
  ['settings', 'Integration Settings'],
];

function unwrap(payload) {
  return payload?.data && !Array.isArray(payload.data) && payload.totalEmployees === undefined ? payload.data : payload;
}

function reportSection(params) {
  const value = params?.section;
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || raw === 'dashboard') return 'dashboard';
  if (raw === 'leave' || raw === 'leave-balance') return 'leave-balance';
  return raw;
}

export default function HrmReportsPage() {
  const params = useParams();
  const section = reportSection(params);
  const [month, setMonth] = React.useState(new Date().getMonth() + 1);
  const [year, setYear] = React.useState(new Date().getFullYear());
  const [data, setData] = React.useState(null);
  const [settings, setSettings] = React.useState(null);
  const [error, setError] = React.useState('');
  const [confirmSend, setConfirmSend] = React.useState(false);

  const load = React.useCallback(() => {
    setError('');
    Promise.all([loadHrmReportDashboard({ month, year }), loadHrmReportSettings()])
      .then(([dashboard, settingPayload]) => {
        setData(unwrap(dashboard));
        setSettings(unwrap(settingPayload));
      })
      .catch((err) => setError(hrmError(err)));
  }, [month, year]);

  React.useEffect(() => { load(); }, [load]);

  const generate = async (send) => {
    try {
      const types = section === 'attendance' ? ['ATTENDANCE'] : section === 'leave-balance' ? ['LEAVE_BALANCE'] : section === 'salary' ? ['SALARY_SUMMARY'] : section === 'commission' ? ['COMMISSION'] : ['ATTENDANCE', 'LEAVE_BALANCE', 'SALARY_SUMMARY', 'COMMISSION'];
      await generateHrmReports({ month, year, send, types });
      toast.success(send ? 'Report generation and delivery queued.' : 'Report generation queued without sending.');
      setConfirmSend(false);
      load();
    } catch (err) {
      toast.error(hrmError(err));
    }
  };

  const download = async (id) => {
    try {
      const file = unwrap(await hrmReportDownload(id));
      if (file?.url) window.open(file.url, '_blank', 'noopener');
      else toast.error('The report file is not ready.');
    } catch (err) {
      toast.error(hrmError(err));
    }
  };

  const cards = data ? [
    ['Total Employees', data.totalEmployees],
    ['Reports Generated', data.reportsGenerated],
    ['Reports Pending', data.reportsPending],
    ['Email Delivered', data.emailDelivered],
    ['WhatsApp Delivered', data.whatsappDelivered],
    ['Failed Deliveries', data.failedDeliveries],
    ['Attendance Reports', data.monthlyAttendanceReports],
    ['Leave Reports', data.monthlyLeaveReports],
    ['Salary Reports', data.monthlySalaryReports],
    ['Commission Reports', data.monthlyCommissionReports],
    ['Commission generated', data.commission?.generated],
    ['Employee commission', data.commission?.employeeShare],
    ['Leader commission', data.commission?.leaderShare],
    ['Approved commission', data.commission?.approved],
    ['Pending commission', data.commission?.pending],
    ['Paid commission', data.commission?.paid],
    ['Outstanding commission', data.commission?.outstanding],
    ['Reversed commission', data.commission?.reversed],
  ] : [];

  return (
    <div className="space-y-4">
      <PageHeader title="Reports & Notifications" description="Monthly attendance, leave, salary and commission reports. Each month is a new calculation period. Earlier records stay in place." />
      {data?.cycle && <p className="text-sm text-[#172B24]">Cycle {data.cycle.month}/{data.cycle.year}: attendance {data.cycle.attendanceStatus}, payroll {data.cycle.payrollStatus}, commission {data.cycle.commissionStatus}.</p>}
      <div className="flex flex-wrap gap-2">
        {sections.map(([key, label]) => (
          <a key={key} href={key === 'dashboard' ? '/admin/hrm/reports' : `/admin/hrm/reports/${key}`} className={`rounded-full px-3 py-1 text-xs font-semibold ${section === key ? 'bg-[#163A2E] text-white' : 'bg-white text-[#172B24] border border-[#E2E8E5]'}`}>{label}</a>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <input aria-label="Month" className="h-9 rounded-md border border-[#E2E8E5] px-2" type="number" min="1" max="12" value={month} onChange={(event) => setMonth(Number(event.target.value))} />
        <input aria-label="Year" className="h-9 rounded-md border border-[#E2E8E5] px-2" type="number" value={year} onChange={(event) => setYear(Number(event.target.value))} />
        <Button type="button" variant="outline" onClick={() => generate(false)}>Generate without sending</Button>
        <Button type="button" onClick={() => setConfirmSend(true)}>Generate and send</Button>
      </div>
      {error && <p className="text-sm text-rose-700">{error}</p>}
      {section !== 'settings' && section !== 'templates' && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[#E2E8E5] bg-white p-4">
                <p className="text-xs text-[#718078]">{label}</p>
                <p className="text-2xl font-semibold text-[#172B24]">{value ?? 0}</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto rounded-lg border border-[#E2E8E5] bg-white">
            <table className="min-w-[1100px] w-full text-left text-sm">
              <thead className="bg-[#F7F9F8] text-xs uppercase text-[#718078]">
                <tr>{['Employee ID', 'Employee', 'Department', 'Attendance', 'Leave', 'Salary', 'Commission', 'Email', 'WhatsApp', 'Actions'].map((label) => <th key={label} className="px-3 py-2">{label}</th>)}</tr>
              </thead>
              <tbody>
                {(data?.rows || []).map((row) => (
                  <tr key={row.employeeId} className="border-t border-[#E2E8E5]">
                    <td className="px-3 py-2">{row.employeeCode}</td>
                    <td className="px-3 py-2">{row.employeeName}</td>
                    <td className="px-3 py-2">{row.department}</td>
                    <td className="px-3 py-2">{row.attendanceStatus}</td>
                    <td className="px-3 py-2">{row.leaveStatus}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-xs">{row.salaryStatus || 'PENDING'}</span>
                        {row.netPayable != null && (
                          <span className="text-xs font-semibold text-emerald-700">₹{Number(row.netPayable).toLocaleString('en-IN')}</span>
                        )}
                        {row.isProvisional && (
                          <span className="inline-block rounded bg-amber-100 px-1 py-0.2 text-[10px] font-medium text-amber-800 w-max">Provisional</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">{row.commissionStatus || 'PENDING'}</td>
                    <td className="px-3 py-2">{row.emailStatus}</td>
                    <td className="px-3 py-2">{row.whatsappStatus}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {row.attendanceReportId && <Button type="button" size="sm" variant="outline" onClick={() => download(row.attendanceReportId)}>Attendance</Button>}
                        {row.leaveReportId && <Button type="button" size="sm" variant="outline" onClick={() => download(row.leaveReportId)}>Leave</Button>}
                        {row.salaryReportId && <Button type="button" size="sm" variant="outline" onClick={() => download(row.salaryReportId)}>Salary</Button>}
                        {row.commissionReportId && <Button type="button" size="sm" variant="outline" onClick={() => download(row.commissionReportId)}>Commission</Button>}
                        {row.emailStatus === 'FAILED' && row.emailDeliveryId && <Button type="button" size="sm" variant="outline" onClick={() => retryHrmDelivery(row.emailDeliveryId).then(load).catch((err) => toast.error(hrmError(err)))}>Retry email</Button>}
                        {row.whatsappStatus === 'FAILED' && row.whatsappDeliveryId && <Button type="button" size="sm" variant="outline" onClick={() => retryHrmDelivery(row.whatsappDeliveryId).then(load).catch((err) => toast.error(hrmError(err)))}>Retry WhatsApp</Button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {!data?.rows?.length && <tr><td colSpan={10} className="px-3 py-8 text-center text-[#718078]">No employees match this period.</td></tr>}
              </tbody>
            </table>
          </div>
          {section === 'commission' && (
            <div className="overflow-x-auto rounded-lg border border-[#E2E8E5] bg-white">
              <table className="min-w-[1100px] w-full text-left text-sm">
                <thead className="bg-[#F7F9F8] text-xs uppercase text-[#718078]"><tr>{['Employee', 'Customer', 'Invoice', 'Order', 'Product', 'Amount', 'Rate', 'Employee share', 'Leader share', 'Status', 'Payment'].map((label) => <th key={label} className="px-3 py-2">{label}</th>)}</tr></thead>
                <tbody>
                  {(data?.commission?.lines || []).map((line) => (
                    <tr key={line.id} className="border-t border-[#E2E8E5]">
                      <td className="px-3 py-2">{line.employeeCode} {line.employeeName}</td>
                      <td className="px-3 py-2">{line.customerName}</td>
                      <td className="px-3 py-2">{line.invoiceNumber}</td>
                      <td className="px-3 py-2">{line.orderNumber}</td>
                      <td className="px-3 py-2">{line.product}</td>
                      <td className="px-3 py-2">{line.invoiceAmount}</td>
                      <td className="px-3 py-2">{line.rateLabel}</td>
                      <td className="px-3 py-2">{line.employeeShare}</td>
                      <td className="px-3 py-2">{line.leaderShare}</td>
                      <td className="px-3 py-2">{line.status}</td>
                      <td className="px-3 py-2">{line.paymentStatus}</td>
                    </tr>
                  ))}
                  {!data?.commission?.lines?.length && <tr><td colSpan={11} className="px-3 py-8 text-center text-[#718078]">No commission transactions fall in this month.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {section === 'templates' && (
        <div className="rounded-lg border border-[#E2E8E5] bg-white p-4 text-sm text-[#172B24]">
          <p className="font-semibold">Monthly email</p>
          <p>Subject: Your Monthly Attendance, Leave, Salary & Commission Reports - {'{{month}}'} {'{{year}}'}</p>
          <p>Attachments: Attendance_Report.pdf, Leave_Balance_Report.pdf, Salary_Summary_Report.pdf, Commission_Report.pdf.</p>
          <p className="mt-3 font-semibold">Leave approved</p>
          <p>Hello {'{{employeeName}}'}, your {'{{leaveType}}'} request from {'{{from}}'} to {'{{to}}'} is approved. Remaining balance: {'{{remaining}}'}.</p>
          <p className="mt-3 font-semibold">Leave rejected</p>
          <p>Hello {'{{employeeName}}'}, your {'{{leaveType}}'} request was rejected. Reason: {'{{reason}}'}.</p>
        </div>
      )}
      {section === 'settings' && settings && (
        <form className="grid max-w-xl gap-3 rounded-lg border border-[#E2E8E5] bg-white p-4 text-sm" onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          try {
            await saveHrmReportSettings({
              attendanceEnabled: form.get('attendanceEnabled') === 'on',
              leaveEnabled: form.get('leaveEnabled') === 'on',
              salaryEnabled: form.get('salaryEnabled') === 'on',
              commissionEnabled: form.get('commissionEnabled') === 'on',
              emailEnabled: form.get('emailEnabled') === 'on',
              whatsappEnabled: form.get('whatsappEnabled') === 'on',
              deliveryTime: form.get('deliveryTime'),
              graceHours: Number(form.get('graceHours')),
            });
            toast.success('Report settings saved.');
          } catch (err) {
            toast.error(hrmError(err));
          }
        }}>
          <label className="flex items-center gap-2"><input name="attendanceEnabled" type="checkbox" defaultChecked={settings.attendanceEnabled !== false} /> Attendance report</label>
          <label className="flex items-center gap-2"><input name="leaveEnabled" type="checkbox" defaultChecked={settings.leaveEnabled !== false} /> Leave balance report</label>
          <label className="flex items-center gap-2"><input name="salaryEnabled" type="checkbox" defaultChecked={settings.salaryEnabled !== false} /> Salary summary</label>
          <label className="flex items-center gap-2"><input name="commissionEnabled" type="checkbox" defaultChecked={settings.commissionEnabled !== false} /> Commission report</label>
          <label className="flex items-center gap-2"><input name="emailEnabled" type="checkbox" defaultChecked={settings.emailEnabled !== false} /> Email</label>
          <label className="flex items-center gap-2"><input name="whatsappEnabled" type="checkbox" defaultChecked={settings.whatsappEnabled !== false} /> WhatsApp</label>
          <label>Delivery time <input name="deliveryTime" defaultValue={settings.deliveryTime || '18:30'} className="ml-2 h-9 rounded-md border border-[#E2E8E5] px-2" /></label>
          <label>Finalization grace hours <input name="graceHours" type="number" min="0" max="48" defaultValue={settings.graceHours ?? 2} className="ml-2 h-9 w-20 rounded-md border border-[#E2E8E5] px-2" /></label>
          <p className="text-[#718078]">Reports run on the last day of the month in Asia/Kolkata, after the delivery time plus the grace period. WhatsApp is sent only when the employee has opted in.</p>
          <Button type="submit">Save settings</Button>
        </form>
      )}
      {confirmSend && (
        <div className="rounded-lg border border-[#E2E8E5] bg-white p-4">
          <p className="text-sm text-[#172B24]">Send the {month}/{year} reports to employees by email and WhatsApp?</p>
          <div className="mt-3 flex gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirmSend(false)}>Cancel</Button>
            <Button type="button" onClick={() => generate(true)}>Send reports</Button>
          </div>
        </div>
      )}
    </div>
  );
}
