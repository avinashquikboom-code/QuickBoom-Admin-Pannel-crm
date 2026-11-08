import { toast } from 'sonner';
export { toast };
export function useToast() {
    return {
        toast: (opts) => {
            if (opts.variant === 'destructive') {
                toast.error(opts.title, {
                    description: opts.description,
                });
            }
            else {
                toast.success(opts.title, {
                    description: opts.description,
                });
            }
        },
        dismiss: (id) => {
            toast.dismiss(id);
        },
    };
}
