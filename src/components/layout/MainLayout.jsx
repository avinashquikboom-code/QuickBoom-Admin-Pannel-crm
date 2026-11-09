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
       <div className="hidden md:flex shrink-0">
         <React.Suspense fallback={<div className="w-20 lg:w-72 shrink-0 bg-sidebar" />}>
           <Sidebar />
         </React.Suspense>
       </div>
       <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
         <Header />
         <main id="main-content" className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 lg:p-6">
           {children}
         </main>
       </div>
     </div>
     <Toaster position="top-right" />
   </TooltipProvider>
   </ApprovalDialogProvider>
 );
}
