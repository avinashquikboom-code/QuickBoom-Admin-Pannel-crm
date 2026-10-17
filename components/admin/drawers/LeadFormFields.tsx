'use client';
import React from 'react';
import { CreateLeadInput } from '@/lib/leads-api';

export const emptyLeadForm: CreateLeadInput = { companyName: '', firstName: '', lastName: '', phone: '', email: '', website: '', address: '', city: '', state: '', country: '', pincode: '', category: '', notes: '' };

export function LeadFormFields({ value, onChange, disabled = false }: {
  value: CreateLeadInput; onChange: (value: CreateLeadInput) => void; disabled?: boolean;
}) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {(Object.keys(emptyLeadForm) as Array<keyof CreateLeadInput>).map(key => <label key={key}
      className={`text-sm font-semibold text-slate-700 ${key === 'notes' || key === 'address' ? 'sm:col-span-2' : ''}`}>
      {key.replace(/([A-Z])/g, ' $1').replace(/^./, letter => letter.toUpperCase())}{key === 'companyName' ? ' *' : ''}
      <input value={value[key] || ''} required={key === 'companyName'} disabled={disabled}
        maxLength={key === 'companyName' ? 500 : ['firstName', 'lastName'].includes(key) ? 200 : key === 'phone' ? 100 : undefined}
        type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'}
        onChange={event => onChange({ ...value, [key]: event.target.value })}
        className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 font-normal disabled:opacity-60" />
    </label>)}
  </div>;
}
