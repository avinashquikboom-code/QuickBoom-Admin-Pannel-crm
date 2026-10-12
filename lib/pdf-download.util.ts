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
    const loadingMsg = options.loadingMessage ?? 'Downloading salary slip PDF...';
    if (loadingMsg) {
      toast.loading(loadingMsg, { id: toastId });
    }

    const res = await api.get(endpoint, {
      responseType: 'blob',
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
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

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
  try {
    const loadingMsg = options.loadingMessage ?? 'Opening PDF document...';
    if (loadingMsg) {
      toast.loading(loadingMsg, { id: toastId });
    }

    const res = await api.get(endpoint, {
      responseType: 'blob',
    });

    const blob = await extractPdfBlob(res);
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    toast.dismiss(toastId);
  } catch (err: any) {
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
