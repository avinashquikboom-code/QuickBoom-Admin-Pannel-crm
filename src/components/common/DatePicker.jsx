'use client';
import { useState } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { faCalendar } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
export function DatePicker({ value, onChange, id, name, disabled, min, max, placeholder = 'Pick a date', className, ...props }) {
  const [open, setOpen] = useState(false);
  const date = value ? parseISO(value) : undefined;
  return <Popover open={open} onOpenChange={setOpen}><PopoverTrigger render={<Button id={id} variant="outline" disabled={disabled} className={className} {...props} />}><FontAwesomeIcon icon={faCalendar} />{date && isValid(date) ? format(date, 'dd MMM yyyy') : placeholder}</PopoverTrigger>
    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date && isValid(date) ? date : undefined}
      disabled={(day) => (min && format(day, 'yyyy-MM-dd') < min) || (max && format(day, 'yyyy-MM-dd') > max)}
      onSelect={(day) => { onChange?.({ target: { name, value: day ? format(day, 'yyyy-MM-dd') : '' } }); setOpen(false); }} />
      <Button variant="ghost" size="sm" onClick={() => { onChange?.({ target: { name, value: '' } }); setOpen(false); }}>Clear date</Button>
    </PopoverContent>
  </Popover>;
}
