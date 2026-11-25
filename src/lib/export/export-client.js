'use client';

import api from '../../../lib/api';

const EXPORT_LOG_KEY = 'qb_export_debug_logs';
const MAX_LOGS = 100;

export const EXPORT_EVENTS = {
  REQUESTED: 'EXPORT_REQUESTED',
  VALIDATION_FAILED: 'EXPORT_VALIDATION_FAILED',
  GENERATED: 'EXPORT_GENERATED',
  DOWNLOAD_REQUESTED: 'EXPORT_DOWNLOAD_REQUESTED',
  DOWNLOAD_FAILED: 'EXPORT_DOWNLOAD_FAILED',
  PREVIEW_FAILED: 'EXPORT_PREVIEW_FAILED',
};

export function logExportEvent(event, meta = {}) {
  const entry = {
    event,
    timestamp: new Date().toISOString(),
    ...meta,
  };
  if (typeof window !== 'undefined') {
    try {
      const raw = window.sessionStorage.getItem(EXPORT_LOG_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const next = Array.isArray(list) ? [...list, entry].slice(-MAX_LOGS) : [entry];
      window.sessionStorage.setItem(EXPORT_LOG_KEY, JSON.stringify(next));
    } catch {}
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[QB_EXPORT] ${event}`, entry);
    }
  }
  return entry;
}

export function extractFilenameFromDisposition(disposition, fallbackName) {
  if (!disposition || typeof disposition !== 'string') return fallbackName;
  const utfMatch = disposition.match(/filename\*=UTF-8''([^;\n]+)/i);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1].trim().replace(/['"]/g, ''));
    } catch {}
  }
  const match = disposition.match(/filename="?([^";\n]+)"?/i);
  return match?.[1]?.trim() || fallbackName;
}

/**
 * Validates that a binary Blob response is NOT a disguised JSON/HTML error payload.
 */
export async function assertValidBinaryBlob(blob, expectedMimePrefix) {
  if (!(blob instanceof Blob)) {
    throw new Error('Invalid download response received from server.');
  }
  if (blob.size === 0) {
    throw new Error('Generated export file is empty.');
  }
  const type = String(blob.type || '').toLowerCase();
  if (type.includes('application/json') || type.includes('text/html')) {
    const text = await blob.text().catch(() => '');
    try {
      const parsed = JSON.parse(text);
      throw new Error(parsed?.message || 'Export failed on the server.');
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error('Server returned an HTML/JSON error instead of a downloadable file.');
      }
      throw e;
    }
  }
  if (expectedMimePrefix === 'application/pdf') {
    const header = await blob.slice(0, 5).text().catch(() => '');
    if (!header.startsWith('%PDF')) {
      throw new Error('Downloaded file is not a valid PDF document.');
    }
  }
  return blob;
}

export function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 1500);
}

export async function fetchExportSchemas() {
  const res = await api.get('/exports/schemas');
  return res?.data || [];
}

export async function fetchExportHistory() {
  const res = await api.get('/exports/history');
  return res?.data || [];
}

export async function countMatchingExportRecords(module, filters = {}) {
  const res = await api.post('/exports/count', { module, filters });
  return Number(res?.count ?? res?.data?.count ?? 0);
}

export async function executeExportDownload(payload) {
  const format = String(payload.format || 'csv').toLowerCase();
  const dateStamp = new Date().toISOString().slice(0, 10);
  const fallbackName = `qb-${payload.module || 'report'}-${dateStamp}.${format}`;

  logExportEvent(EXPORT_EVENTS.DOWNLOAD_REQUESTED, {
    module: payload.module,
    format,
    scope: payload.scope || 'ALL_FILTERED',
  });

  try {
    const blob = await api.post('/exports/generate', payload, {
      responseType: 'blob',
      timeout: 120000,
    });
    const expectedMime = format === 'pdf' ? 'application/pdf' : undefined;
    await assertValidBinaryBlob(blob, expectedMime);

    const filename = extractFilenameFromDisposition(blob.__contentDisposition, fallbackName);
    triggerBlobDownload(blob, filename);

    logExportEvent(EXPORT_EVENTS.GENERATED, {
      module: payload.module,
      format,
      filename,
      fileSize: blob.size,
    });
    return { filename, size: blob.size };
  } catch (err) {
    logExportEvent(EXPORT_EVENTS.DOWNLOAD_FAILED, {
      module: payload.module,
      format,
      error: err?.message || 'Download failed',
    });
    throw err;
  }
}

export async function generatePdfPreviewUrl(payload) {
  try {
    const blob = await api.post(
      '/exports/generate',
      { ...payload, format: 'pdf' },
      { responseType: 'blob', timeout: 120000 },
    );
    await assertValidBinaryBlob(blob, 'application/pdf');
    const filename = extractFilenameFromDisposition(
      blob.__contentDisposition,
      `qb-${payload.module || 'report'}-${new Date().toISOString().slice(0, 10)}.pdf`,
    );
    return { blob, blobUrl: URL.createObjectURL(blob), filename };
  } catch (err) {
    logExportEvent(EXPORT_EVENTS.PREVIEW_FAILED, {
      module: payload.module,
      error: err?.message || 'PDF preview failed',
    });
    throw err;
  }
}

export async function executeZipBundleDownload(module, selectedIds = []) {
  const blob = await api.post(
    '/exports/zip',
    { module, format: 'pdf', scope: 'SELECTED', selectedIds },
    { responseType: 'blob', timeout: 120000 },
  );
  await assertValidBinaryBlob(blob, 'application/zip');
  const filename = extractFilenameFromDisposition(
    blob.__contentDisposition,
    `qb-${module}-bundle-${new Date().toISOString().slice(0, 10)}.zip`,
  );
  triggerBlobDownload(blob, filename);
  return { filename, size: blob.size };
}

export async function downloadIndividualLeadDossier(leadId) {
  const blob = await api.get(`/exports/leads/${leadId}/pdf`, {
    responseType: 'blob',
    timeout: 60000,
  });
  await assertValidBinaryBlob(blob, 'application/pdf');
  const filename = extractFilenameFromDisposition(blob.__contentDisposition, `qb-lead-${leadId}.pdf`);
  triggerBlobDownload(blob, filename);
  return { filename, size: blob.size };
}
