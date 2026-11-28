'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  UploadCloud,
  Send,
  ChevronDown,
  Link2,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';

const COUNTRY_CODES = [
  { code: '+91', label: 'India (+91)' },
  { code: '+1', label: 'USA / Canada (+1)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+971', label: 'UAE (+971)' },
  { code: '+65', label: 'Singapore (+65)' },
  { code: '+61', label: 'Australia (+61)' },
];

const INPUT =
  'h-11 w-full min-w-0 rounded-xl border border-[#b9cdf0] bg-white px-4 text-sm text-[#0b1547] outline-none transition placeholder:text-[#6b7bb0] focus:border-[#04913c] focus:ring-2 focus:ring-[#04913c]/20';

const ICON_PATHS = {
  user: 'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5 0-9 2.5-9 6v2h18v-2c0-3.5-4-6-9-6Z',
  phone:
    'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.2 1.2.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.5.6 3.6.1.4 0 .8-.2 1.1l-2.3 2.1Z',
  mail: 'M4 4h16a2 2 0 0 1 2 2v.4l-10 6.2L2 6.4V6a2 2 0 0 1 2-2Zm18 4.7V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.7l10 6.2 10-6.2Z',
  home: 'M12 2.5 1.5 11.5H4.5V21H10v-6h4v6h5.5v-9.5h3L19 8.5V4h-3v1.9L12 2.5Z',
  briefcase:
    'M9 3h6a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3V5a2 2 0 0 1 2-2Zm0 3h6V5H9v1Zm2 4v2.5H8.5v2H11V17h2v-2.5h2.5v-2H13V10h-2Z',
  star: 'm12 2 3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21.1l1.4-7L2 9.3l7-.8L12 2Z',
  users:
    'M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-7 1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm14 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm-7 1c-3.3 0-6 1.8-6 4v3h12v-3c0-2.2-2.7-4-6-4Zm-7.5.5C2.3 13.7 0 15 0 17v2h4.5v-2c0-1.3.6-2.5 1.6-3.4a8 8 0 0 0-1.6-.1Zm15 0c-.6 0-1.1 0-1.6.1 1 .9 1.6 2.1 1.6 3.4v2H24v-2c0-2-2.3-3.5-4.5-3.5Z',
  file: 'M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7 1.5V9h5.5L13 3.5ZM8 12v1.8h8V12H8Zm0 4v1.8h8V16H8Z',
};

function FieldIcon({ name }) {
  if (name === 'link') return <Link2 className="h-7 w-7 shrink-0 text-[#04913c]" strokeWidth={2.75} />;
  if (name === 'rupee') {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#04913c] text-base font-bold text-white">
        ₹
      </span>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0 fill-[#04913c]" aria-hidden="true">
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

function Field({ icon, label, required, className = '', children }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="mb-2 flex items-center gap-3 text-sm font-medium text-[#0b1547] sm:text-[15px]">
        <FieldIcon name={icon} />
        <span>
          {label}
          {required && <span className="text-red-500"> *</span>}
        </span>
      </div>
      {children}
    </div>
  );
}

function SelectBox({ className = '', children, ...props }) {
  return (
    <div className={`relative ${className}`}>
      <select {...props} className={`${INPUT} cursor-pointer appearance-none pr-10 font-medium`}>
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black"
        strokeWidth={3}
      />
    </div>
  );
}

function Waves({ className }) {
  return (
    <svg viewBox="0 0 300 150" className={`pointer-events-none absolute ${className}`} aria-hidden="true">
      <path d="M0 0H300C250 5 190 5 140 30C70 62 25 70 0 150Z" fill="#bdf0c4" opacity="0.55" />
      <path d="M0 0H230C180 8 150 20 105 42C55 66 18 70 0 112Z" fill="#4fcf6c" opacity="0.7" />
      <path d="M0 0H150C105 10 85 24 55 37C30 48 10 52 0 70Z" fill="#04913c" />
    </svg>
  );
}

export default function PublicHiringApplicationPage() {
  const params = useParams();
  const token = params?.token;

  const [loading, setLoading] = useState(true);
  const [formMeta, setFormMeta] = useState(null);
  const [loadError, setLoadError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedData, setSubmittedData] = useState(null);

  const [formData, setFormData] = useState({
    candidateName: '',
    countryCode: '+91',
    mobileNumber: '',
    email: '',
    departmentId: '',
    candidateAddress: '',
    designationId: '',
    referredById: '',
    workLink: '',
    currentSalary: '',
    expectedSalary: '',
    experience: '',
    website: '', // honeypot
  });
  const [resumeFile, setResumeFile] = useState(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setLoadError('');
        const res = await fetch(`${API_BASE}/hiring/public/${encodeURIComponent(token)}`);
        const json = await res.json();
        if (!res.ok || !json?.success) {
          throw new Error(json?.message || 'This hiring form is unavailable or has expired.');
        }
        if (active) {
          setFormMeta(json.data);
          if (json.data?.departments?.length === 1) {
            setFormData((prev) => ({ ...prev, departmentId: String(json.data.departments[0].id) }));
          }
        }
      } catch (err) {
        if (active) setLoadError(err?.message || 'Unable to load hiring form.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  const fc = formMeta?.fieldConfig || {};
  const isVisible = (key) => fc[key]?.visible !== false;
  const isRequired = (key, fallback = false) =>
    fc[key]?.required !== undefined ? Boolean(fc[key].required) : fallback;

  const roles = (formMeta?.designations || []).filter(
    (d) => !d.departmentId || String(d.departmentId) === formData.departmentId
  );

  const setField = (key) => (e) => setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setResumeFile(null);
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'doc', 'docx'].includes(ext || '')) {
      setSubmitError('Only PDF, DOC, and DOCX files are allowed.');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError('Resume file size must not exceed 5 MB.');
      e.target.value = '';
      return;
    }
    setSubmitError('');
    setResumeFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!formData.candidateName.trim()) {
      setSubmitError('Please enter your full name.');
      return;
    }
    if (!/^\d{7,15}$/.test(formData.mobileNumber.replace(/\s+/g, ''))) {
      setSubmitError('Please enter a valid mobile number (7-15 digits).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setSubmitError('Please enter a valid email address.');
      return;
    }
    if (isRequired('departmentId', true) && !formData.departmentId) {
      setSubmitError('Please select a department.');
      return;
    }
    if (!formData.candidateAddress.trim()) {
      setSubmitError('Please enter your address.');
      return;
    }
    if (!formData.designationId) {
      setSubmitError('Please select the role you are applying for.');
      return;
    }
    if (!formData.referredById) {
      setSubmitError('Please select who referred you.');
      return;
    }
    if (formData.workLink.trim() && !/^https?:\/\/\S+$/i.test(formData.workLink.trim())) {
      setSubmitError('Work link must start with http:// or https://');
      return;
    }
    if (isVisible('currentSalary') && !formData.currentSalary) {
      setSubmitError('Please enter your current salary.');
      return;
    }
    if (isVisible('expectedSalary') && !formData.expectedSalary) {
      setSubmitError('Please enter your expected salary.');
      return;
    }
    if (isVisible('experience') && !formData.experience.trim()) {
      setSubmitError('Please enter your work experience.');
      return;
    }

    try {
      setSubmitting(true);
      const body = new FormData();
      body.append('candidateName', formData.candidateName.trim());
      body.append('countryCode', formData.countryCode);
      body.append('mobileNumber', formData.mobileNumber.replace(/\s+/g, ''));
      body.append('email', formData.email.trim());
      if (formData.departmentId) body.append('departmentId', formData.departmentId);
      body.append('candidateAddress', formData.candidateAddress.trim());
      body.append('designationId', formData.designationId);
      body.append('referredById', formData.referredById);
      if (formData.workLink.trim()) body.append('workLink', formData.workLink.trim());
      if (formData.currentSalary) body.append('currentSalary', formData.currentSalary);
      if (formData.expectedSalary) body.append('expectedSalary', formData.expectedSalary);
      if (formData.experience) body.append('experience', formData.experience.trim());
      if (formData.website) body.append('website', formData.website);
      if (resumeFile) body.append('resume', resumeFile);

      const res = await fetch(`${API_BASE}/hiring/public/${encodeURIComponent(token)}/apply`, {
        method: 'POST',
        body,
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || 'Submission failed. Please review your details.');
      }
      setSubmittedData(json.data);
    } catch (err) {
      setSubmitError(err?.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-dvh overflow-y-auto bg-slate-50 px-3 py-4 sm:px-6 sm:py-8">
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_rgba(4,145,60,0.15)]">
        <Waves className="left-0 top-0 w-44 sm:w-72" />
        <Waves className="right-0 top-0 w-44 -scale-x-100 sm:w-72" />
        <Waves className="bottom-0 right-0 w-40 -scale-100 sm:w-60" />

        <div className="relative px-5 pb-10 pt-4 sm:px-10">
          <img src="/logo.png" alt="Quikboom" className="mx-auto h-16 w-auto object-contain sm:h-20" />
          <div className="mt-3 flex items-center gap-4">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#04913c]" />
            <h1 className="whitespace-nowrap rounded-full bg-[#04913c] px-6 py-2 text-xl font-bold text-white shadow-sm sm:px-10 sm:text-3xl">
              Application Form
            </h1>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#04913c]" />
          </div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="mt-3 text-sm font-medium">Loading application form...</p>
            </div>
          ) : loadError ? (
            <div className="p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h1 className="text-lg font-semibold text-slate-900">Form Unavailable</h1>
              <p className="mt-2 text-sm text-slate-600">{loadError}</p>
            </div>
          ) : submittedData ? (
            <div className="p-8 text-center sm:p-10">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Application Submitted!</h1>
              <p className="mt-2 text-sm text-slate-600">
                Thank you, <span className="font-semibold text-slate-800">{submittedData.candidateName}</span>.
                Your application has been received by our HR team.
              </p>
              <div className="mt-6 rounded-xl bg-slate-50 p-4 text-left text-xs text-slate-600 ring-1 ring-slate-200/70">
                <div className="flex justify-between py-1">
                  <span className="font-medium text-slate-500">Reference ID</span>
                  <span className="font-semibold text-slate-900">#{submittedData.id}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="font-medium text-slate-500">Submitted On</span>
                  <span className="font-semibold text-slate-900">
                    {new Date(submittedData.appliedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
              {/* Honeypot anti-spam field */}
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={setField('website')}
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />

              <Field icon="user" label="Candidate Name" required>
                <input
                  type="text"
                  required
                  value={formData.candidateName}
                  onChange={setField('candidateName')}
                  placeholder="Enter your full name"
                  className={INPUT}
                />
              </Field>

              <Field icon="phone" label="Mobile Number" required>
                <div className="flex gap-2">
                  <SelectBox
                    className="w-28 shrink-0"
                    value={formData.countryCode}
                    onChange={setField('countryCode')}
                    aria-label="Country code"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code}
                      </option>
                    ))}
                  </SelectBox>
                  <input
                    type="tel"
                    required
                    value={formData.mobileNumber}
                    onChange={setField('mobileNumber')}
                    placeholder="9876543210"
                    className={INPUT}
                  />
                </div>
              </Field>

              <Field icon="mail" label="Email Address" required>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={setField('email')}
                  placeholder="you@example.com"
                  className={INPUT}
                />
              </Field>

              <Field icon="home" label="Candidate Address" required>
                <input
                  type="text"
                  required
                  maxLength={500}
                  value={formData.candidateAddress}
                  onChange={setField('candidateAddress')}
                  placeholder="Enter your complete address"
                  className={INPUT}
                />
              </Field>

              {isVisible('departmentId') && (
                <Field icon="briefcase" label="Department" required={isRequired('departmentId', true)}>
                  <SelectBox
                    required={isRequired('departmentId', true)}
                    value={formData.departmentId}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, departmentId: e.target.value, designationId: '' }))
                    }
                  >
                    <option value="">Select Department</option>
                    {(formMeta?.departments || []).map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </SelectBox>
                </Field>
              )}

              <Field icon="star" label="Applying For Role" required>
                <SelectBox required value={formData.designationId} onChange={setField('designationId')}>
                  <option value="">Select Role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </SelectBox>
              </Field>

              <Field icon="users" label="Referred By" required>
                <SelectBox required value={formData.referredById} onChange={setField('referredById')}>
                  <option value="">Select Employee Name</option>
                  {(formMeta?.referrers || []).map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </SelectBox>
              </Field>

              <Field icon="link" label="Work Link / Portfolio">
                <input
                  type="url"
                  maxLength={500}
                  value={formData.workLink}
                  onChange={setField('workLink')}
                  placeholder="https://your-portfolio-link.com"
                  className={INPUT}
                />
              </Field>

              {isVisible('currentSalary') && (
                <Field icon="rupee" label="Current Salary (Monthly / CTC)" required>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formData.currentSalary}
                    onChange={setField('currentSalary')}
                    placeholder="e.g. 25000"
                    className={INPUT}
                  />
                </Field>
              )}

              {isVisible('expectedSalary') && (
                <Field icon="rupee" label="Expected Salary" required>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formData.expectedSalary}
                    onChange={setField('expectedSalary')}
                    placeholder="e.g. 32000"
                    className={INPUT}
                  />
                </Field>
              )}

              {isVisible('experience') && (
                <Field icon="briefcase" label="Work Experience" required className="sm:col-span-2">
                  <input
                    type="text"
                    required
                    value={formData.experience}
                    onChange={setField('experience')}
                    placeholder="e.g. Fresher, 1.5 Years, 3+ Years in Sales"
                    className={INPUT}
                  />
                </Field>
              )}

              {isVisible('resume') && (
                <Field
                  icon="file"
                  label="Resume / CV (PDF, DOC, DOCX — Max 5 MB) (Optional)"
                  className="sm:col-span-2"
                >
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#b9cdf0] bg-slate-50/50 px-4 py-5 text-center transition hover:border-[#04913c] hover:bg-emerald-50/40">
                    {resumeFile ? (
                      <div className="flex items-center gap-2 break-all text-sm font-medium text-[#04913c]">
                        <FileText className="h-5 w-5 shrink-0" />
                        <span>{resumeFile.name}</span>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="mb-1.5 h-10 w-10 text-[#04913c]" strokeWidth={2.25} />
                        <span className="text-base font-semibold text-[#0b1547]">
                          Click to upload your Resume / CV
                        </span>
                        <span className="mt-0.5 text-sm text-[#6b7bb0]">PDF, DOC, DOCX up to 5 MB</span>
                      </>
                    )}
                    <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="hidden" />
                  </label>
                </Field>
              )}

              {/* Shown next to the submit button so it is visible after tapping it */}
              {submitError && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 sm:col-span-2"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#04913c] text-base font-semibold text-white shadow-sm transition hover:bg-[#037a32] disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Submitting Application...
                  </>
                ) : (
                  <>
                    <Send className="h-6 w-6" />
                    Submit Application
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
