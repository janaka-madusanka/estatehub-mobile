import api from './client';

/**
 * Upload property images.
 *
 * POST /api/uploads/images
 *
 * Backend expects:
 * multipart/form-data
 *
 * Field name:
 * images
 */
export const uploadPropertyImages = async (
  selectedImages = []
) => {
  if (
    !Array.isArray(selectedImages) ||
    selectedImages.length === 0
  ) {
    return [];
  }

  if (selectedImages.length > 10) {
    throw new Error(
      'You can upload a maximum of 10 images'
    );
  }

  const formData = new FormData();

  selectedImages.forEach(
    (image, index) => {
      const uri = image.uri;

      if (!uri) {
        return;
      }

      const fileName =
        image.fileName ||
        getFileName(
          uri,
          index
        );

      const mimeType =
        image.mimeType ||
        getMimeType(fileName);

      formData.append(
        'images',
        {
          uri,
          name: fileName,
          type: mimeType,
        }
      );
    }
  );

  const response = await api.post(
    '/uploads/images',
    formData,
    {
      headers: {
        'Content-Type':
          'multipart/form-data',
      },

      timeout: 120000,
    }
  );

  const images =
    response.data?.data?.images;

  if (!Array.isArray(images)) {
    throw new Error(
      'Invalid image upload response'
    );
  }

  return images;
};

/**
 * Remove uploaded images that were
 * not attached to a property.
 *
 * POST /api/uploads/images/rollback
 */
export const rollbackPropertyImages =
  async (publicIds = []) => {
    if (
      !Array.isArray(publicIds) ||
      publicIds.length === 0
    ) {
      return null;
    }

    const response = await api.post(
      '/uploads/images/rollback',
      {
        publicIds,
      }
    );

    return response.data?.data;
  };

/* =====================================================
   HELPERS
===================================================== */

function getFileName(
  uri,
  index
) {
  const uriWithoutQuery =
    uri.split('?')[0];

  const lastPart =
    uriWithoutQuery
      .split('/')
      .pop();

  if (
    lastPart &&
    lastPart.includes('.')
  ) {
    return lastPart;
  }

  return `property-image-${Date.now()}-${index}.jpg`;
}

function getMimeType(
  fileName
) {
  const extension =
    fileName
      .split('.')
      .pop()
      ?.toLowerCase();

  if (
    extension === 'png'
  ) {
    return 'image/png';
  }

  if (
    extension === 'webp'
  ) {
    return 'image/webp';
  }

  return 'image/jpeg';
}