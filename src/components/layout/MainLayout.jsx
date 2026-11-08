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
     <div className="flex h-dvh overflow-hidden bg-background text-foreground font-sans">
       <div className="hidden lg:flex shrink-0">
         <React.Suspense fallback={<div className="w-64 shrink-0 bg-sidebar" />}>
           <Sidebar />
         </React.Suspense>
       </div>
       <div className="flex min-w-0 flex-1 flex-col">
         <Header />
         <main id="main-content" className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
           {children}
         </main>
       </div>
     </div>
     <Toaster position="top-right" />
   </TooltipProvider>
   </ApprovalDialogProvider>
 );
}
