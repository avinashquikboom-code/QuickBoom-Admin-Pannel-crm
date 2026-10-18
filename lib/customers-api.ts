import api from './api';
import { getErrorMessage } from './utils';

export interface DeleteCustomerResult {
  deletedCount: number;
  ids: number[];
  failedCount?: number;
  errors?: string[];
}

export const customersApi = {
  /** A display code or a legacy negative lead ID is never a customer primary key. */
  async getDetails(id: number | string, signal?: AbortSignal): Promise<any> {
    const customerId = Number(id);
    if (!Number.isSafeInteger(customerId) || customerId < 1) {
      throw new Error('Customer details require a positive database customer ID. The supplied identifier is invalid.');
    }
    const response: any = await api.get(`/customers/${customerId}`, { signal });
    const customer = response?.data ?? response;
    if (customer?.id !== customerId) {
      throw new Error('Customer details could not be verified: the returned customer does not match the requested ID.');
    }
    return customer;
  },

  /**
   * Delete a single customer using the existing registered DELETE /customers/:id endpoint.
   */
  async deleteCustomer(id: number, cancelSubscriptions = true): Promise<DeleteCustomerResult> {
    const numericId = Number(id);
    if (!Number.isSafeInteger(numericId) || numericId < 1) {
      throw new Error('Valid customer ID is required.');
    }
    const response: any = await api.delete(`/customers/${numericId}`, {
      params: { cancelSubscriptions },
    });
    const resData = response?.data ?? response;
    const result =
      resData && typeof resData === 'object' && 'data' in resData && resData.data && typeof resData.data === 'object'
        ? resData.data
        : resData;
    const count = Number(result?.deletedCount ?? (Array.isArray(result?.ids) ? result.ids.length : 1));
    const deletedIds = Array.isArray(result?.ids) ? result.ids : [numericId];
    return { deletedCount: count, ids: deletedIds };
  },

  /**
   * Bulk delete multiple customers by IDs.
   * Attempts POST /customers/bulk-delete first. If the server does not support the bulk route
   * (returns 404 or 405), safely falls back to concurrent single deletions via DELETE /customers/:id.
   */
  async bulkDelete(ids: number[], cancelSubscriptions = true): Promise<DeleteCustomerResult> {
    if (!Array.isArray(ids) || !ids.length || ids.length > 100 || ids.some(id => !Number.isSafeInteger(Number(id)) || Number(id) < 1)) {
      throw new Error('Select between 1 and 100 valid customer IDs.');
    }
    const cleanIds = [...new Set(ids.map(id => Number(id)))];

    try {
      const response: any = await api.post('/customers/bulk-delete', { ids: cleanIds, cancelSubscriptions });
      const resData = response?.data ?? response;
      const result =
        resData && typeof resData === 'object' && 'data' in resData && resData.data && typeof resData.data === 'object'
          ? resData.data
          : resData;
      const count = Number(result?.deletedCount ?? (Array.isArray(result?.ids) ? result.ids.length : cleanIds.length));
      const deletedIds = Array.isArray(result?.ids) ? result.ids : cleanIds;
      if (!Number.isInteger(count) || count < 0) {
        throw new Error('Deletion response could not be verified. Refresh the customer list before retrying.');
      }
      return { deletedCount: count, ids: deletedIds };
    } catch (err: any) {
      const status = err?.response?.status;
      // If endpoint is not found (404) or method not allowed (405), fallback to deleting via single-delete API
      if (status === 404 || status === 405) {
        const settled = await Promise.allSettled(
          cleanIds.map(id => api.delete(`/customers/${id}`, { params: { cancelSubscriptions } }))
        );
        const succeededIds: number[] = [];
        const failureMessages: string[] = [];
        settled.forEach((res, idx) => {
          if (res.status === 'fulfilled') {
            succeededIds.push(cleanIds[idx]);
          } else {
            failureMessages.push(`Customer #${cleanIds[idx]}: ${getErrorMessage(res.reason)}`);
          }
        });

        if (succeededIds.length === 0) {
          throw new Error(failureMessages[0] || 'Failed to delete selected customers.');
        }

        return {
          deletedCount: succeededIds.length,
          ids: succeededIds,
          failedCount: failureMessages.length,
          errors: failureMessages,
        };
      }
      throw err;
    }
  },
};
