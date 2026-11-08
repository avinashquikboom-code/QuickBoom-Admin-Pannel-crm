"use client";
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { Toaster as Sonner } from "sonner";
import { faCheckCircle, faCircleInfo, faCircleXmark, faSpinner, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
const Toaster = ({ ...props }) => {
    const theme = "light";
    return (<Sonner theme={theme} className="toaster group" icons={{
            success: (<FontAwesomeIcon icon={faCheckCircle} className="size-4 text-brand"/>),
            info: (<FontAwesomeIcon icon={faCircleInfo} className="size-4 text-sky-500"/>),
            warning: (<FontAwesomeIcon icon={faTriangleExclamation} className="size-4 text-amber-500"/>),
            error: (<FontAwesomeIcon icon={faCircleXmark} className="size-4 text-red-500"/>),
            loading: (<FontAwesomeIcon icon={faSpinner} className="size-4 animate-spin text-brand"/>),
        }} style={{
            "--normal-bg": "var(--popover)",
            "--normal-text": "var(--popover-foreground)",
            "--normal-border": "var(--border)",
            "--border-radius": "var(--radius)",
        }} toastOptions={{
            classNames: {
                toast: "cn-toast",
            },
        }} {...props}/>);
};
export { Toaster };

