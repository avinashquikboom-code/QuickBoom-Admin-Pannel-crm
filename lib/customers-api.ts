import api from './api';

export const customersApi = {
  async bulkDelete(ids: number[], cancelSubscriptions = false): Promise<{ deletedCount: number; ids: number[] }> {
    if (!ids.length || ids.length > 100 || ids.some(id => !Number.isSafeInteger(id) || id < 1)) {
      throw new Error('Select between 1 and 100 valid customer IDs.');
    }
    const response: any = await api.post('/customers/bulk-delete', { ids, cancelSubscriptions });
    const result = response?.data ?? response;
    if (!Number.isInteger(result?.deletedCount) || result.deletedCount < 0 || result.deletedCount > ids.length || !Array.isArray(result?.ids)) {
      throw new Error('Deletion response could not be verified. Refresh the customer list before retrying.');
    }
    return result;
  },
};
