import api from './client';

/**
 * @typedef {'user' | 'assistant'} ChatHistoryRole
 */

/**
 * @typedef {Object} ChatHistoryMessage
 * @property {ChatHistoryRole} role
 * @property {string} content
 */

/**
 * @typedef {Object} SendChatbotMessageParams
 * @property {string} message
 * @property {ChatHistoryMessage[]} [history]
 */

/**
 * Send a message to EstateHub AI.
 *
 * Backend:
 * POST /api/chat/message
 *
 * @param {SendChatbotMessageParams} params
 */
export const sendChatbotMessage = async ({
  message,
  history = [],
}) => {
  const cleanMessage =
    typeof message === 'string'
      ? message.trim()
      : '';

  if (!cleanMessage) {
    throw new Error(
      'Message is required'
    );
  }

  if (
    cleanMessage.length > 1000
  ) {
    throw new Error(
      'Message cannot exceed 1000 characters'
    );
  }

  /**
   * @type {ChatHistoryMessage[]}
   */
  const normalizedHistory =
    Array.isArray(history)
      ? history
          .filter(
            (item) =>
              item &&
              (
                item.role ===
                  'user' ||
                item.role ===
                  'assistant'
              ) &&
              typeof item.content ===
                'string' &&
              item.content.trim()
          )
          .slice(-10)
          .map((item) => ({
            role: item.role,

            content:
              item.content
                .trim()
                .slice(
                  0,
                  2000
                ),
          }))
      : [];

  const response =
    await api.post(
      '/chat/message',
      {
        message:
          cleanMessage,

        history:
          normalizedHistory,
      },
      {
        /*
         * Local Ollama can take
         * longer than normal API
         * requests.
         */
        timeout: 120000,
      }
    );

  const data =
    response.data?.data;

  if (
    !data ||
    typeof data.reply !==
      'string'
  ) {
    throw new Error(
      'Invalid response from EstateHub AI'
    );
  }

  return data;
};

/**
 * Check EstateHub AI / Ollama health.
 *
 * Backend:
 * GET /api/chat/health
 */
export const getChatbotHealth =
  async () => {
    const response =
      await api.get(
        '/chat/health',
        {
          timeout: 30000,
        }
      );

    return (
      response.data?.data ||
      null
    );
  };