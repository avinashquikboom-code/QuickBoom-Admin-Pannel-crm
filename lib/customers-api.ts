import api from './api';

export interface DeleteCustomerResult {
  deletedCount: number;
  ids: number[];
}

export const customersApi = {
  /**
   * Delete a single customer using DELETE /customers/:id?cancelSubscriptions=true
   * with fallback to bulk-delete if single delete route is not supported.
   */
  async deleteCustomer(id: number, cancelSubscriptions = true): Promise<DeleteCustomerResult> {
    const numericId = Number(id);
    if (!Number.isSafeInteger(numericId) || numericId < 1) {
      throw new Error('Valid customer ID is required.');
    }
    try {
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
    } catch (err: any) {
      // If 404 or method not allowed, fallback to bulk delete endpoint
      if (err?.response?.status === 404 || err?.response?.status === 405) {
        return this.bulkDelete([numericId], cancelSubscriptions);
      }
      throw err;
    }
  },

  /**
   * Bulk delete multiple customers by IDs using POST /customers/bulk-delete
   */
  async bulkDelete(ids: number[], cancelSubscriptions = true): Promise<DeleteCustomerResult> {
    if (!Array.isArray(ids) || !ids.length || ids.length > 100 || ids.some(id => !Number.isSafeInteger(Number(id)) || Number(id) < 1)) {
      throw new Error('Select between 1 and 100 valid customer IDs.');
    }
    const cleanIds = [...new Set(ids.map(id => Number(id)))];
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
  },
};
