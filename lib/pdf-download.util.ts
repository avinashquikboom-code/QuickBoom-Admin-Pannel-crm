import api from './api';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from './utils';

/**
 * Safely extracts a valid binary Blob from an Axios response
 * whether the response was unwrapped by an interceptor (returning Blob directly)
 * or still wrapped in AxiosResponse (res.data).
 */
export async function extractPdfBlob(res: unknown): Promise<Blob> {
  let blob: Blob;

  const data =
    res !== null && typeof res === 'object' && 'data' in res
      ? (res as { data: unknown }).data
      : res;

  if (data instanceof Blob) {
    blob = data;
  } else if (data instanceof ArrayBuffer) {
    blob = new Blob([data], { type: 'application/pdf' });
  } else if (ArrayBuffer.isView(data)) {
    const view = data;
    const buffer = new ArrayBuffer(view.byteLength);
    new Uint8Array(buffer).set(
      new Uint8Array(view.buffer as ArrayBuffer, view.byteOffset, view.byteLength),
    );
    blob = new Blob([buffer], { type: 'application/pdf' });
  } else if (typeof data === 'string') {
    blob = new Blob([data], { type: 'application/pdf' });
  } else {
    throw new Error('Invalid PDF data received from server');
  }

  if (blob.size === 0) throw new Error('Received an empty PDF document.');
  const signature = await blob.slice(0, 5).text();
  if (signature !== '%PDF-') {
    let message = 'The server returned an invalid PDF document.';
    try {
      const error = JSON.parse(await blob.text());
      message = Array.isArray(error.message) ? error.message.join(', ') : (error.message || error.error || message);
    } catch {
      if (blob.type.includes('text/html')) message = 'The server returned a web page instead of a PDF. Please check the API connection or sign in again.';
    }
    throw new Error(message);
  }
  const tail = await blob.slice(Math.max(0, blob.size - 1024)).text();
  if (!tail.includes('%%EOF')) throw new Error('Received an incomplete PDF document. Please try again.');

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
    const loadingMsg = options.loadingMessage ?? 'Downloading salary slip PDF...';
    if (loadingMsg) {
      toast.loading(loadingMsg, { id: toastId });
    }

    const res = await api.get(endpoint, {
      responseType: 'blob',
      headers: { Accept: 'application/pdf' },
    });

    const blob = await extractPdfBlob(res);

    let targetFilename = filename;
    const cd =
      (blob as any)?.__contentDisposition ||
      (res as any)?.headers?.['content-disposition'] ||
      (res as any)?.headers?.['Content-Disposition'];
    if (cd && typeof cd === 'string') {
      const match = cd.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?/i);
      if (match && match[1]) {
        targetFilename = decodeURIComponent(match[1].trim());
      }
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = targetFilename.endsWith('.pdf') ? targetFilename : `${targetFilename}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);

    toast.success(options.successMessage || 'PDF downloaded successfully', { id: toastId });
  } catch (err: any) {
    let errorMsg = 'Unable to generate PDF. Please try again.';
    if (err?.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        const json = JSON.parse(text);
        errorMsg = json.message || json.error || errorMsg;
      } catch {
        errorMsg = getErrorMessage(err) || errorMsg;
      }
    } else {
      errorMsg = getErrorMessage(err) || errorMsg;
    }
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
  const preview = window.open('', '_blank');
  if (preview) preview.opener = null;
  try {
    const loadingMsg = options.loadingMessage ?? 'Opening PDF document...';
    if (loadingMsg) {
      toast.loading(loadingMsg, { id: toastId });
    }

    const res = await api.get(endpoint, {
      responseType: 'blob',
      headers: { Accept: 'application/pdf' },
    });

    const blob = await extractPdfBlob(res);
    const url = window.URL.createObjectURL(blob);
    if (!preview) { window.URL.revokeObjectURL(url); throw new Error('PDF viewing was blocked by the browser. Allow popups or use Download Official PDF.'); }
    preview.location.href = url;
    window.setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    toast.dismiss(toastId);
  } catch (err: any) {
    preview?.close();
    let errorMsg = 'Unable to load PDF document. Please try again.';
    if (err?.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        const json = JSON.parse(text);
        errorMsg = json.message || json.error || errorMsg;
      } catch {
        errorMsg = getErrorMessage(err) || errorMsg;
      }
    } else {
      errorMsg = getErrorMessage(err) || errorMsg;
    }
    toast.error(errorMsg, { id: toastId });
    throw err;
  }
}
