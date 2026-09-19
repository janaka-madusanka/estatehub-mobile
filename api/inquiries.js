import api from './client';

/**
 * Create a new inquiry.
 *
 * POST /api/inquiries
 */
export const createInquiry = async ({
  propertyId,
  message,
}) => {
  const response = await api.post(
    '/inquiries',
    {
      propertyId,
      message: message.trim(),
    }
  );

  return response.data.data.inquiry;
};

/**
 * Get inquiries sent by the logged-in buyer.
 *
 * GET /api/inquiries/sent
 */
export const getSentInquiries =
  async () => {
    const response = await api.get(
      '/inquiries/sent'
    );

    return response.data.data;
  };

/**
 * Get inquiries received by the logged-in owner.
 *
 * GET /api/inquiries/received
 */
export const getReceivedInquiries =
  async () => {
    const response = await api.get(
      '/inquiries/received'
    );

    return response.data.data;
  };

/**
 * Get one inquiry.
 *
 * GET /api/inquiries/:inquiryId
 */
export const getInquiry = async (
  inquiryId
) => {
  const response = await api.get(
    `/inquiries/${inquiryId}`
  );

  return response.data.data.inquiry;
};

/**
 * Send another message.
 *
 * POST /api/inquiries/:inquiryId/messages
 */
export const sendInquiryMessage =
  async ({
    inquiryId,
    message,
  }) => {
    const response = await api.post(
      `/inquiries/${inquiryId}/messages`,
      {
        message: message.trim(),
      }
    );

    return response.data.data.inquiry;
  };

/**
 * Close inquiry.
 *
 * PATCH /api/inquiries/:inquiryId/close
 */
export const closeInquiry = async (
  inquiryId
) => {
  const response = await api.patch(
    `/inquiries/${inquiryId}/close`
  );

  return response.data.data.inquiry;
};

/**
 * Get total unread inquiry messages
 * for the logged-in user.
 *
 * Sent:
 * buyerUnreadCount
 *
 * Received:
 * ownerUnreadCount
 */
export const getInquiryUnreadCount =
  async () => {
    const [
      sentData,
      receivedData,
    ] = await Promise.all([
      getSentInquiries(),
      getReceivedInquiries(),
    ]);

    const sentInquiries =
      Array.isArray(
        sentData?.inquiries
      )
        ? sentData.inquiries
        : [];

    const receivedInquiries =
      Array.isArray(
        receivedData?.inquiries
      )
        ? receivedData.inquiries
        : [];

    const sentUnreadCount =
      sentInquiries.reduce(
        (total, inquiry) => {
          const count =
            Number(
              inquiry?.buyerUnreadCount
            ) || 0;

          return (
            total +
            Math.max(0, count)
          );
        },
        0
      );

    const receivedUnreadCount =
      receivedInquiries.reduce(
        (total, inquiry) => {
          const count =
            Number(
              inquiry?.ownerUnreadCount
            ) || 0;

          return (
            total +
            Math.max(0, count)
          );
        },
        0
      );

    return (
      sentUnreadCount +
      receivedUnreadCount
    );
  };