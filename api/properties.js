import api from './client';

/**
 * GET /api/properties
 */
export const getApprovedProperties =
  async (queryParams = {}) => {
    const response =
      await api.get(
        '/properties',
        {
          params: queryParams,
        }
      );

    return response.data.data;
  };

/**
 * GET /api/properties/:id
 */
export const getApprovedPropertyById =
  async (propertyId) => {
    const response =
      await api.get(
        `/properties/${propertyId}`
      );

    return response.data.data;
  };