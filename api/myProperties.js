import api from './client';

/**
 * Get the logged-in user's properties.
 *
 * GET /api/properties/my
 */
export const getMyProperties = async (
  queryParams = {}
) => {
  const response = await api.get(
    '/properties/my',
    {
      params: queryParams,
    }
  );

  return response.data.data;
};

/**
 * Get one property owned by
 * the logged-in user.
 *
 * GET /api/properties/my/:id
 */
export const getMyPropertyById = async (
  propertyId
) => {
  const response = await api.get(
    `/properties/my/${propertyId}`
  );

  return response.data.data.property;
};

/**
 * Create property.
 *
 * POST /api/properties
 */
export const createMyProperty = async (
  propertyData
) => {
  const response = await api.post(
    '/properties',
    propertyData
  );

  return response.data.data.property;
};

/**
 * Update owned property.
 *
 * PATCH /api/properties/:id
 */
export const updateMyProperty = async (
  propertyId,
  propertyData
) => {
  const response = await api.patch(
    `/properties/${propertyId}`,
    propertyData
  );

  return response.data.data.property;
};

/**
 * Change availability.
 *
 * PATCH /api/properties/my/:id/availability
 */
export const updateMyPropertyAvailability =
  async (
    propertyId,
    availabilityStatus
  ) => {
    const response = await api.patch(
      `/properties/my/${propertyId}/availability`,
      {
        availabilityStatus,
      }
    );

    return response.data.data.property;
  };

/**
 * Delete owned property.
 *
 * DELETE /api/properties/:id
 */
export const deleteMyProperty = async (
  propertyId
) => {
  const response = await api.delete(
    `/properties/${propertyId}`
  );

  return response.data.data.propertyId;
};