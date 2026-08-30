import api from './api';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from './utils';

/**
 * Safely extracts a valid binary Blob from an Axios response
 * whether the response was unwrapped by an interceptor (returning Blob directly)
 * or still wrapped in AxiosResponse (res.data).
 */
export async function extractPdfBlob(res: any): Promise<Blob> {
  let blob: Blob;

  if (res instanceof Blob) {
    blob = res;
  } else if (res?.data instanceof Blob) {
    blob = res.data;
  } else if (res instanceof ArrayBuffer) {
    blob = new Blob([res], { type: 'application/pdf' });
  } else if (ArrayBuffer.isView(res)) {
    const copiedBytes = new Uint8Array(res.byteLength);
    copiedBytes.set(new Uint8Array(res.buffer, res.byteOffset, res.byteLength));
    blob = new Blob([copiedBytes.buffer], { type: 'application/pdf' });
  } else if (res?.data instanceof ArrayBuffer) {
    blob = new Blob([res.data], { type: 'application/pdf' });
  } else if (res?.data && ArrayBuffer.isView(res.data)) {
    const copiedBytes = new Uint8Array(res.data.byteLength);
    copiedBytes.set(new Uint8Array(res.data.buffer, res.data.byteOffset, res.data.byteLength));
    blob = new Blob([copiedBytes.buffer], { type: 'application/pdf' });
  } else if (typeof res === 'string') {
    // If it's a binary string or base64, wrap as binary blob
    blob = new Blob([res], { type: 'application/pdf' });
  } else if (typeof res?.data === 'string') {
    blob = new Blob([res.data], { type: 'application/pdf' });
  } else {
    throw new Error('Invalid PDF data received from server');
  }

  // If the server returned an error page or error JSON with content-type application/json as a blob
  if (blob.type.includes('application/json') || blob.type.includes('text/html')) {
    try {
      const text = await blob.text();
      const json = JSON.parse(text);
      throw new Error(json.message || json.error || 'Failed to generate PDF document.');
    } catch (e: any) {
      if (e.message && !e.message.includes('JSON')) {
        throw e;
      }
    }
  }

  if (blob.size === 0) {
    throw new Error('Received an empty PDF document.');
  }

  return blob;
}

/**
 * Downloads a PDF from an authenticated endpoint URL safely,
 * avoiding "Failed to load PDF document" caused by invalid blob wrapping.
 */
export async function downloadPdfFromEndpoint(
  endpoint: string,
  filename: string,
  options: {
    loadingMessage?: string;
    successMessage?: string;
    toastId?: string;
  } = {}
) {
  const toastId = options.toastId || 'pdf-dl';
  try {
    if (options.loadingMessage) {
      toast.loading(options.loadingMessage, { id: toastId });
    }

    const res = await api.get(endpoint, {
      responseType: 'blob',
    });

    const blob = await extractPdfBlob(res);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast.success(options.successMessage || 'PDF downloaded successfully', { id: toastId });
  } catch (err: any) {
    const errorMsg = getErrorMessage(err) || 'Unable to generate PDF. Please try again.';
    toast.error(errorMsg, { id: toastId });
    throw err;
  }
}

/**
 * Opens a PDF from an authenticated endpoint in a new tab using a Blob URL.
 */
export async function viewPdfFromEndpoint(
  endpoint: string,
  options: {
    loadingMessage?: string;
    toastId?: string;
  } = {}
) {
  const toastId = options.toastId || 'pdf-view';
  try {
    if (options.loadingMessage) {
      toast.loading(options.loadingMessage, { id: toastId });
    }

    const res = await api.get(endpoint, {
      responseType: 'blob',
    });

    const blob = await extractPdfBlob(res);
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    toast.dismiss(toastId);
  } catch (err: any) {
    const errorMsg = getErrorMessage(err) || 'Unable to load PDF document. Please try again.';
    toast.error(errorMsg, { id: toastId });
    throw err;
  }
}
