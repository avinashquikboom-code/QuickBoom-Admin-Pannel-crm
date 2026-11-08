'use client';
import { useId } from 'react';
import { Input } from './Input';
export function FileUpload({ label = 'Upload file', onFilesChange, description, ...props }) { const id = useId(); return <div className="space-y-2"><label htmlFor={props.id || id} className="text-sm font-medium">{label}</label><Input {...props} id={props.id || id} type="file" aria-describedby={description ? id+'-hint' : undefined} onChange={event => { props.onChange?.(event); onFilesChange?.(Array.from(event.target.files || [])); }} />{description && <p id={id+'-hint'} className="text-sm text-muted-foreground">{description}</p>}</div>; }
