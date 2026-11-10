'use client';
import * as React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toaster } from '@/components/common/Toast';
import { TooltipProvider } from '@/components/common/Tooltip';
import { ApprovalDialogProvider } from '@/components/approval';
export function MainLayout({ children }) {
 return (
   <ApprovalDialogProvider>
   <TooltipProvider>
     <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded focus:bg-background focus:p-3">
       Skip to content
     </a>
     <div className="flex h-dvh w-full min-w-0 overflow-hidden bg-background text-foreground font-sans">
       <div className="hidden shrink-0 md:flex">
         <React.Suspense fallback={<div className="w-20 shrink-0 bg-sidebar lg:w-72" />}>
           <Sidebar />
         </React.Suspense>
       </div>
       <div className="flex w-0 min-w-0 max-w-none flex-1 flex-col overflow-hidden">
         <Header />
         <main id="main-content" className="box-border w-full min-w-0 max-w-none flex-1 overflow-x-hidden overflow-y-auto bg-[#F7F9F8] p-3.5 sm:p-5 lg:p-6">
           {children}
         </main>
       </div>
     </div>
     <Toaster position="top-right" />
   </TooltipProvider>
   </ApprovalDialogProvider>
 );
}
