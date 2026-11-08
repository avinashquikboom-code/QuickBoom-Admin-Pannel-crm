'use client';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import { faBuilding, faClock, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import { faFloppyDisk } from '@fortawesome/free-regular-svg-icons';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/common/Tabs';
import { toast } from 'sonner';
export default function SettingsPage() {
    const [companyName, setCompanyName] = React.useState('QB Suite Technologies Inc.');
    const [timezone, setTimezone] = React.useState('UTC-05:00 (Eastern Time)');
    const [standardWorkHours, setStandardWorkHours] = React.useState('9');
    const [maxBreakMinutes, setMaxBreakMinutes] = React.useState('60');
    const [multiplierUnder60, setMultiplierUnder60] = React.useState('1.0');
    const [multiplierOver60, setMultiplierOver60] = React.useState('2.0');
    const [multiplierOver90, setMultiplierOver90] = React.useState('3.0');
    const [otStandardRate, setOtStandardRate] = React.useState('1.5');
    const [otWeekendRate, setOtWeekendRate] = React.useState('2.0');
    const handleSave = (e) => {
        e.preventDefault();
        toast.success('Configuration policies saved and deployed across QB Suite!');
    };
    return (<div className="space-y-6">
      <PageHeader title="Suite Administration & Policies" description="Global system parameters, attendance deduction rules, overtime rates, and company profile." badge="System" badgeVariant="green" actions={<Button size="sm" onClick={handleSave} className="bg-brand hover:bg-primary-hover text-primary-foreground gap-1.5 shadow-sm text-xs">
            <FontAwesomeIcon icon={faFloppyDisk} className="size-4"/>
            <span>Save Changes</span>
          </Button>}/>

      <Tabs defaultValue="hrm-policies" className="space-y-4">
        <TabsList className="bg-slate-100 p-1 border border-slate-200">
          <TabsTrigger value="hrm-policies" className="text-xs data-[state=active]:bg-white data-[state=active]:text-brand-dark">
            HRM Payroll & Attendance Rules
          </TabsTrigger>
          <TabsTrigger value="company" className="text-xs data-[state=active]:bg-white data-[state=active]:text-brand-dark">
            Company Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs data-[state=active]:bg-white data-[state=active]:text-brand-dark">
            Security & Integrations
          </TabsTrigger>
        </TabsList>

        {/* HRM Rules */}
        <TabsContent value="hrm-policies">
          <Card className="border-slate-200/80 shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FontAwesomeIcon icon={faClock} className="size-5 text-brand"/>
                <span>Attendance & Late Deduction Multipliers</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Formula parameters used to calculate automated salary slip deductions (Formula: Hourly Rate = Monthly / 30 / 9)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <Label className="text-xs">Standard Shift Duration (Hours)</Label>
                  <Input value={standardWorkHours} onChange={(e) => setStandardWorkHours(e.target.value)} className="h-8 text-xs"/>
                  <span className="text-[10px] text-slate-400">Default base daily denominator is 9.0 hours</span>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Max Allowable Daily Break (Minutes)</Label>
                  <Input value={maxBreakMinutes} onChange={(e) => setMaxBreakMinutes(e.target.value)} className="h-8 text-xs"/>
                  <span className="text-[10px] text-slate-400">Break duration in excess is flagged on attendance reports</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/80 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Configurable Late Arrival Multipliers
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5">
                    <span className="font-semibold text-slate-700">Up to 60 Minutes Late</span>
                    <Input value={multiplierUnder60} onChange={(e) => setMultiplierUnder60(e.target.value)} className="h-8 text-xs bg-white"/>
                    <span className="text-[10px] text-slate-500">Deduction rate: 1.0× hourly salary</span>
                  </div>

                  <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200/80 space-y-1.5">
                    <span className="font-semibold text-amber-900">Above 60 Minutes Late</span>
                    <Input value={multiplierOver60} onChange={(e) => setMultiplierOver60(e.target.value)} className="h-8 text-xs bg-white"/>
                    <span className="text-[10px] text-amber-700">Deduction rate: 2.0× hourly salary</span>
                  </div>

                  <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-200/80 space-y-1.5">
                    <span className="font-semibold text-rose-900">Above 90 Minutes Late</span>
                    <Input value={multiplierOver90} onChange={(e) => setMultiplierOver90(e.target.value)} className="h-8 text-xs bg-white"/>
                    <span className="text-[10px] text-rose-700">Deduction rate: 3.0× hourly salary</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/80 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Overtime Compensation Rates
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Regular Weekday OT Multiplier</Label>
                    <Input value={otStandardRate} onChange={(e) => setOtStandardRate(e.target.value)} className="h-8 text-xs"/>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Weekend / Public Holiday OT Multiplier</Label>
                    <Input value={otWeekendRate} onChange={(e) => setOtWeekendRate(e.target.value)} className="h-8 text-xs"/>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Info */}
        <TabsContent value="company">
          <Card className="border-slate-200/80 shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FontAwesomeIcon icon={faBuilding} className="size-5 text-brand"/>
                <span>Organization Identity</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Legal Corporate Entity</Label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="h-8 text-xs"/>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Primary Timezone</Label>
                  <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} className="h-8 text-xs"/>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <Card className="border-slate-200/80 shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FontAwesomeIcon icon={faShieldHalved} className="size-5 text-brand"/>
                <span>Security & Webhook Access</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">API Access Token</div>
                  <div className="font-mono text-slate-500 text-[11px]">qb_live_sec_89210948920149021</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast.success('API token rotated')} className="text-xs">
                  Rotate Token
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>);
}
