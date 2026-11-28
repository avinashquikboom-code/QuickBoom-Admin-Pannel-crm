'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, Upload, Building2, AlertCircle, FileText, Loader2 } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';

const COUNTRY_CODES = [
  { code: '+91', label: 'India (+91)' },
  { code: '+1', label: 'USA / Canada (+1)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+971', label: 'UAE (+971)' },
  { code: '+65', label: 'Singapore (+65)' },
  { code: '+61', label: 'Australia (+61)' },
];

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
    if (isRequired('experience', true) && !formData.experience.trim()) {
      setSubmitError('Please enter your work experience.');
      return;
    }
    if (isRequired('resume', false) && !resumeFile) {
      setSubmitError('Please upload your resume / CV.');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 py-8 px-4 sm:px-6">
      <div className="mx-auto max-w-2xl">
        {/* Branded Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/80">
            <img
              src="/app_logo.png"
              alt="QB Suite"
              className="h-12 w-auto object-contain"
            />
          </div>
          {formMeta?.companyName && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              <Building2 className="h-3.5 w-3.5" />
              {formMeta.companyName}
            </span>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200/80">
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
                    {new Date(submittedData.applicationDate).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-100 bg-slate-900 px-6 py-6 text-white sm:px-8">
                <h1 className="text-xl font-bold sm:text-2xl">{formMeta?.title}</h1>
                {formMeta?.description && (
                  <p className="mt-1.5 text-sm text-slate-300">{formMeta.description}</p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 p-6 sm:p-8">
                {submitError && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Honeypot anti-spam field */}
                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Candidate Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.candidateName}
                    onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={formData.countryCode}
                        onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                        className="w-28 rounded-xl border border-slate-300 bg-white px-2.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.code}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        required
                        value={formData.mobileNumber}
                        onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                        placeholder="9876543210"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                    />
                  </div>
                </div>

                {isVisible('departmentId') && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Department{' '}
                      {isRequired('departmentId', true) && <span className="text-red-500">*</span>}
                    </label>
                    <select
                      required={isRequired('departmentId', true)}
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                    >
                      <option value="">Select Department</option>
                      {(formMeta?.departments || []).map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {isVisible('currentSalary') && (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Current Salary (Monthly / CTC)
                        {isRequired('currentSalary', false) && <span className="text-red-500"> *</span>}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        required={isRequired('currentSalary', false)}
                        value={formData.currentSalary}
                        onChange={(e) => setFormData({ ...formData, currentSalary: e.target.value })}
                        placeholder="e.g. 25000"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                      />
                    </div>
                  )}

                  {isVisible('expectedSalary') && (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Expected Salary
                        {isRequired('expectedSalary', false) && <span className="text-red-500"> *</span>}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        required={isRequired('expectedSalary', false)}
                        value={formData.expectedSalary}
                        onChange={(e) => setFormData({ ...formData, expectedSalary: e.target.value })}
                        placeholder="e.g. 32000"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                      />
                    </div>
                  )}
                </div>

                {isVisible('experience') && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Work Experience
                      {isRequired('experience', true) && <span className="text-red-500"> *</span>}
                    </label>
                    <input
                      type="text"
                      required={isRequired('experience', true)}
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      placeholder="e.g. Fresher, 1.5 Years, 3+ Years in Sales"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                    />
                  </div>
                )}

                {isVisible('resume') && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Resume / CV (PDF, DOC, DOCX — Max 5 MB)
                      {isRequired('resume', false) && <span className="text-red-500"> *</span>}
                    </label>
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 px-4 py-5 text-center transition hover:border-emerald-500 hover:bg-emerald-50/30">
                      {resumeFile ? (
                        <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                          <FileText className="h-5 w-5" />
                          <span>{resumeFile.name}</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="mb-1.5 h-6 w-6 text-slate-400" />
                          <span className="text-sm font-medium text-slate-700">
                            Click to upload your Resume / CV
                          </span>
                          <span className="mt-0.5 text-xs text-slate-500">
                            PDF, DOC, DOCX up to 5 MB
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting Application...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
