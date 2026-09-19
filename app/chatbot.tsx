import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  router,
} from 'expo-router';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  sendChatbotMessage,
} from '../api/chatbot';

/* =====================================================
   TYPES
===================================================== */

type ChatRole =
  | 'user'
  | 'assistant';

type ChatPropertyImage =
  | string
  | {
      url?: string;
      publicId?: string | null;
    }
  | null;

type ChatProperty = {
  _id: string;

  title?: string;

  description?: string;

  price?: number;

  currency?: string;

  listingType?: string;

  propertyType?: string;

  address?: string;

  city?: string;

  district?: string;

  bedrooms?: number;

  bathrooms?: number;

  area?: number;

  areaUnit?: string;

  amenities?: string[];

  image?: ChatPropertyImage;

  path?: string;

  createdAt?: string;
};

type ChatSource = {
  sourceId?: string;

  title?: string;

  category?: string;

  score?: number;
};

type ChatMessage = {
  id: string;

  role: ChatRole;

  content: string;

  createdAt: string;

  /*
   * The greeting is only UI text.
   * We don't need to send it
   * back to the backend.
   */
  includeInHistory?: boolean;

  properties?: ChatProperty[];

  totalMatches?: number;

  returnedCount?: number;

  sources?: ChatSource[];
};

/* =====================================================
   START MESSAGE
===================================================== */

const createWelcomeMessage =
  (): ChatMessage => ({
    id: 'estatehub-ai-welcome',

    role: 'assistant',

    content:
      'Hi! I’m EstateHub AI. I can help you search approved properties or explain how EstateHub works.',

    createdAt:
      new Date().toISOString(),

    includeInHistory: false,
  });

/* =====================================================
   SUGGESTED PROMPTS
===================================================== */

const SUGGESTED_PROMPTS = [
  'Show me houses in Kandy',

  'Show apartments for rent in Colombo',

  'How do I add a property?',

  'What does pending status mean?',
];

/* =====================================================
   SCREEN
===================================================== */

export default function ChatbotScreen() {
  const [
    messages,
    setMessages,
  ] = useState<ChatMessage[]>(
    [createWelcomeMessage()]
  );

  const [
    input,
    setInput,
  ] = useState('');

  const [
    sending,
    setSending,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const listRef =
    useRef<
      FlatList<ChatMessage>
    >(null);

  const hasConversation =
    messages.some(
      (item) =>
        item.role === 'user'
    );

  /* ===================================================
     SCROLL TO BOTTOM
  =================================================== */

  useEffect(() => {
    const timer =
      setTimeout(() => {
        listRef.current
          ?.scrollToEnd({
            animated: true,
          });
      }, 120);

    return () =>
      clearTimeout(timer);
  }, [
    messages.length,
    sending,
  ]);

  /* ===================================================
     BUILD HISTORY
  =================================================== */

  const buildHistory =
    () => {
      return messages
        .filter(
          (item) =>
            item.includeInHistory !==
              false &&
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
        }));
    };

  /* ===================================================
     SEND MESSAGE
  =================================================== */

  const handleSend =
    async (
      overrideMessage?: string
    ) => {
      if (sending) {
        return;
      }

      const cleanMessage =
        (
          overrideMessage ??
          input
        ).trim();

      if (!cleanMessage) {
        return;
      }

      if (
        cleanMessage.length >
        1000
      ) {
        setError(
          'Message cannot exceed 1000 characters.'
        );

        return;
      }

      /*
       * Build history BEFORE
       * adding the current
       * message.
       */
      const history =
        buildHistory();

      const userMessage:
        ChatMessage = {
        id: createMessageId(
          'user'
        ),

        role: 'user',

        content:
          cleanMessage,

        createdAt:
          new Date().toISOString(),
      };

      setMessages(
        (current) => [
          ...current,
          userMessage,
        ]
      );

      setInput('');

      setError('');

      try {
        setSending(true);

        const data =
          await sendChatbotMessage({
            message:
              cleanMessage,

            history,
          });

        const assistantMessage:
          ChatMessage = {
          id: createMessageId(
            'assistant'
          ),

          role:
            'assistant',

          content:
            data.reply,

          createdAt:
            new Date().toISOString(),

          properties:
            Array.isArray(
              data.properties
            )
              ? data.properties
              : [],

          totalMatches:
            Number(
              data
                .propertySearch
                ?.totalMatches
            ) || 0,

          returnedCount:
            Number(
              data
                .propertySearch
                ?.returnedCount
            ) || 0,

          sources:
            Array.isArray(
              data.sources
            )
              ? data.sources
              : [],
        };

        setMessages(
          (current) => [
            ...current,
            assistantMessage,
          ]
        );
      } catch (
        requestError
      ) {
        /*
         * Remove the user
         * bubble if the request
         * failed, and restore the
         * text so the user can
         * retry.
         */
        setMessages(
          (current) =>
            current.filter(
              (item) =>
                item.id !==
                userMessage.id
            )
        );

        setInput(
          cleanMessage
        );

        setError(
          requestError instanceof
            Error
            ? requestError.message
            : 'Unable to contact EstateHub AI'
        );
      } finally {
        setSending(false);
      }
    };

  /* ===================================================
     CLEAR CHAT
  =================================================== */

  const handleClearChat =
    () => {
      if (
        !hasConversation ||
        sending
      ) {
        return;
      }

      Alert.alert(
        'New Conversation',
        'Clear the current AI conversation?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },

          {
            text: 'Clear',

            onPress: () => {
              setMessages([
                createWelcomeMessage(),
              ]);

              setInput('');

              setError('');
            },
          },
        ]
      );
    };

  /* ===================================================
     UI
  =================================================== */

  return (
    <SafeAreaView
      style={
        styles.screen
      }
      edges={[
        'top',
        'bottom',
      ]}
    >
      <KeyboardAvoidingView
        style={
          styles.flex
        }
        behavior={
          Platform.OS ===
          'ios'
            ? 'padding'
            : 'height'
        }
      >
        {/* ============================================
            HEADER
        ============================================ */}

        <View
          style={
            styles.header
          }
        >
          <Pressable
            onPress={() =>
              router.back()
            }
            style={({
              pressed,
            }) => [
              styles.headerButton,

              pressed &&
                styles.pressed,
            ]}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#0f172a"
            />
          </Pressable>

          <View
            style={
              styles.aiAvatar
            }
          >
            <Ionicons
              name="sparkles"
              size={21}
              color="#ffffff"
            />
          </View>

          <View
            style={
              styles.headerInfo
            }
          >
            <Text
              style={
                styles.headerTitle
              }
            >
              EstateHub AI
            </Text>

            <View
              style={
                styles.onlineRow
              }
            >
              <View
                style={
                  styles.onlineDot
                }
              />

              <Text
                style={
                  styles.headerSubtitle
                }
              >
                Property assistant
              </Text>
            </View>
          </View>

          <Pressable
            onPress={
              handleClearChat
            }
            disabled={
              !hasConversation ||
              sending
            }
            style={({
              pressed,
            }) => [
              styles.headerButton,

              (!hasConversation ||
                sending) &&
                styles.disabledHeaderButton,

              pressed &&
                hasConversation &&
                !sending &&
                styles.pressed,
            ]}
          >
            <Ionicons
              name="refresh-outline"
              size={21}
              color={
                hasConversation
                  ? '#047857'
                  : '#94a3b8'
              }
            />
          </Pressable>
        </View>

        {/* ============================================
            TRUST / INFORMATION
        ============================================ */}

        <View
          style={
            styles.infoBanner
          }
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={17}
            color="#047857"
          />

          <Text
            style={
              styles.infoBannerText
            }
          >
            Uses EstateHub knowledge
            and current approved
            property listings.
          </Text>
        </View>

        {/* ============================================
            MESSAGE LIST
        ============================================ */}

        <FlatList
          ref={listRef}
          style={
            styles.messageList
          }
          data={
            messages
          }
          keyExtractor={(
            item
          ) => item.id}
          renderItem={({
            item,
          }) => (
            <ChatMessageItem
              message={item}
            />
          )}
          contentContainerStyle={
            styles.messageContent
          }
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            !hasConversation ? (
              <SuggestedPrompts
                disabled={
                  sending
                }
                onPress={(
                  prompt
                ) =>
                  handleSend(
                    prompt
                  )
                }
              />
            ) : null
          }
          ListFooterComponent={
            sending ? (
              <TypingIndicator />
            ) : null
          }
        />

        {/* ============================================
            ERROR
        ============================================ */}

        {error ? (
          <View
            style={
              styles.errorBox
            }
          >
            <Ionicons
              name="alert-circle-outline"
              size={19}
              color="#b91c1c"
            />

            <Text
              style={
                styles.errorText
              }
            >
              {error}
            </Text>

            <Pressable
              onPress={() =>
                setError('')
              }
              hitSlop={10}
            >
              <Ionicons
                name="close"
                size={18}
                color="#b91c1c"
              />
            </Pressable>
          </View>
        ) : null}

        {/* ============================================
            MESSAGE COMPOSER
        ============================================ */}

        <View
          style={
            styles.composerArea
          }
        >
          <View
            style={
              styles.composer
            }
          >
            <TextInput
              value={input}
              onChangeText={(
                value
              ) => {
                setInput(value);

                if (error) {
                  setError('');
                }
              }}
              placeholder="Ask EstateHub AI..."
              placeholderTextColor="#94a3b8"
              multiline
              maxLength={1000}
              editable={
                !sending
              }
              textAlignVertical="top"
              style={
                styles.input
              }
            />

            <Pressable
              onPress={() =>
                handleSend()
              }
              disabled={
                sending ||
                !input.trim()
              }
              style={({
                pressed,
              }) => [
                styles.sendButton,

                (sending ||
                  !input.trim()) &&
                  styles.sendButtonDisabled,

                pressed &&
                  !sending &&
                  Boolean(
                    input.trim()
                  ) &&
                  styles.pressed,
              ]}
            >
              {sending ? (
                <ActivityIndicator
                  size="small"
                  color="#ffffff"
                />
              ) : (
                <Ionicons
                  name="send"
                  size={19}
                  color="#ffffff"
                />
              )}
            </Pressable>
          </View>

          <View
            style={
              styles.composerBottom
            }
          >
            <Text
              style={
                styles.aiNotice
              }
            >
              Ask about EstateHub or
              available properties
            </Text>

            {input.length >
            800 ? (
              <Text
                style={[
                  styles.characterCount,

                  input.length >
                    950 &&
                    styles.characterWarning,
                ]}
              >
                {input.length}/1000
              </Text>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* =====================================================
   SUGGESTIONS
===================================================== */

function SuggestedPrompts({
  disabled,
  onPress,
}: {
  disabled: boolean;

  onPress: (
    prompt: string
  ) => void;
}) {
  return (
    <View
      style={
        styles.suggestionsArea
      }
    >
      <Text
        style={
          styles.suggestionsTitle
        }
      >
        Try asking
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.suggestions
        }
      >
        {SUGGESTED_PROMPTS.map(
          (
            prompt,
            index
          ) => (
            <Pressable
              key={`${prompt}-${index}`}
              disabled={
                disabled
              }
              onPress={() =>
                onPress(prompt)
              }
              style={({
                pressed,
              }) => [
                styles.suggestionChip,

                pressed &&
                  !disabled &&
                  styles.pressed,
              ]}
            >
              <Ionicons
                name={
                  index < 2
                    ? 'home-outline'
                    : 'help-circle-outline'
                }
                size={15}
                color="#047857"
              />

              <Text
                style={
                  styles.suggestionText
                }
                numberOfLines={2}
              >
                {prompt}
              </Text>
            </Pressable>
          )
        )}
      </ScrollView>
    </View>
  );
}

/* =====================================================
   CHAT MESSAGE
===================================================== */

function ChatMessageItem({
  message,
}: {
  message: ChatMessage;
}) {
  const isUser =
    message.role ===
    'user';

  return (
    <View
      style={[
        styles.messageWrapper,

        isUser
          ? styles.userMessageWrapper
          : styles.aiMessageWrapper,
      ]}
    >
      {!isUser ? (
        <View
          style={
            styles.smallAiAvatar
          }
        >
          <Ionicons
            name="sparkles"
            size={14}
            color="#ffffff"
          />
        </View>
      ) : null}

      <View
        style={[
          styles.messageBlock,

          isUser &&
            styles.userMessageBlock,
        ]}
      >
        <View
          style={[
            styles.messageBubble,

            isUser
              ? styles.userBubble
              : styles.aiBubble,
          ]}
        >
          {!isUser ? (
            <Text
              style={
                styles.aiName
              }
            >
              EstateHub AI
            </Text>
          ) : null}

          <Text
            style={[
              styles.messageText,

              isUser &&
                styles.userMessageText,
            ]}
          >
            {message.content}
          </Text>

          <Text
            style={[
              styles.messageTime,

              isUser &&
                styles.userMessageTime,
            ]}
          >
            {formatTime(
              message.createdAt
            )}
          </Text>
        </View>

        {/* ========================================
            PROPERTY SEARCH RESULTS
        ========================================= */}

        {!isUser &&
        message.properties &&
        message.properties.length >
          0 ? (
          <View
            style={
              styles.propertyResults
            }
          >
            <View
              style={
                styles.propertyResultsHeader
              }
            >
              <View
                style={
                  styles.propertyResultsTitleRow
                }
              >
                <Ionicons
                  name="home-outline"
                  size={17}
                  color="#047857"
                />

                <Text
                  style={
                    styles.propertyResultsTitle
                  }
                >
                  Property Results
                </Text>
              </View>

              {typeof message
                .totalMatches ===
              'number' ? (
                <Text
                  style={
                    styles.matchCount
                  }
                >
                  {message.returnedCount ||
                    message.properties
                      .length}{' '}
                  of{' '}
                  {
                    message.totalMatches
                  }
                </Text>
              ) : null}
            </View>

            {message.properties.map(
              (property) => (
                <ChatPropertyCard
                  key={
                    property._id
                  }
                  property={
                    property
                  }
                />
              )
            )}
          </View>
        ) : null}

        {/* ========================================
            KNOWLEDGE SOURCE
        ========================================= */}

        {!isUser &&
        message.sources &&
        message.sources.length >
          0 ? (
          <View
            style={
              styles.sourceArea
            }
          >
            <Ionicons
              name="library-outline"
              size={13}
              color="#64748b"
            />

            <Text
              style={
                styles.sourceLabel
              }
            >
              EstateHub knowledge:
            </Text>

            <Text
              style={
                styles.sourceText
              }
              numberOfLines={1}
            >
              {message.sources
                .map(
                  (source) =>
                    source.title
                )
                .filter(Boolean)
                .join(', ')}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

/* =====================================================
   TYPING INDICATOR
===================================================== */

function TypingIndicator() {
  return (
    <View
      style={
        styles.typingRow
      }
    >
      <View
        style={
          styles.smallAiAvatar
        }
      >
        <Ionicons
          name="sparkles"
          size={14}
          color="#ffffff"
        />
      </View>

      <View
        style={
          styles.typingBubble
        }
      >
        <ActivityIndicator
          size="small"
          color="#047857"
        />

        <Text
          style={
            styles.typingText
          }
        >
          EstateHub AI is thinking...
        </Text>
      </View>
    </View>
  );
}

/* =====================================================
   PROPERTY CARD
===================================================== */

function ChatPropertyCard({
  property,
}: {
  property: ChatProperty;
}) {
  const imageUrl =
    getPropertyImageUrl(
      property.image
    );

  const openProperty =
    () => {
      if (!property._id) {
        return;
      }

      router.push({
        pathname:
          '/property/[id]',

        params: {
          id: property._id,
        },
      });
    };

  return (
    <Pressable
      onPress={
        openProperty
      }
      style={({
        pressed,
      }) => [
        styles.propertyCard,

        pressed &&
          styles.pressed,
      ]}
    >
      {imageUrl ? (
        <Image
          source={{
            uri: imageUrl,
          }}
          resizeMode="cover"
          style={
            styles.propertyImage
          }
        />
      ) : (
        <View
          style={
            styles.propertyImagePlaceholder
          }
        >
          <Ionicons
            name="image-outline"
            size={28}
            color="#047857"
          />
        </View>
      )}

      <View
        style={
          styles.propertyCardContent
        }
      >
        <View
          style={
            styles.propertyBadgeRow
          }
        >
          <View
            style={
              styles.propertyTypeBadge
            }
          >
            <Text
              style={
                styles.propertyTypeText
              }
            >
              {capitalize(
                property.propertyType ||
                  'Property'
              )}
            </Text>
          </View>

          <Text
            style={
              styles.listingType
            }
          >
            {property.listingType ===
            'sale'
              ? 'For Sale'
              : property.listingType ===
                  'rent'
                ? 'For Rent'
                : capitalize(
                    property.listingType ||
                      ''
                  )}
          </Text>
        </View>

        <Text
          style={
            styles.propertyTitle
          }
          numberOfLines={2}
        >
          {property.title ||
            'EstateHub Property'}
        </Text>

        <Text
          style={
            styles.propertyPrice
          }
        >
          {formatPrice(
            property.price,
            property.currency
          )}
        </Text>

        <View
          style={
            styles.propertyLocationRow
          }
        >
          <Ionicons
            name="location-outline"
            size={14}
            color="#64748b"
          />

          <Text
            style={
              styles.propertyLocation
            }
            numberOfLines={1}
          >
            {formatLocation(
              property
            )}
          </Text>
        </View>

        <View
          style={
            styles.propertyDetails
          }
        >
          {property.propertyType !==
          'land' ? (
            <>
              <PropertyMeta
                icon="bed-outline"
                text={`${
                  property.bedrooms ??
                  0
                } Beds`}
              />

              <PropertyMeta
                icon="water-outline"
                text={`${
                  property.bathrooms ??
                  0
                } Baths`}
              />
            </>
          ) : null}

          {property.area ? (
            <PropertyMeta
              icon="resize-outline"
              text={`${property.area} ${
                property.areaUnit ||
                ''
              }`}
            />
          ) : null}
        </View>

        <View
          style={
            styles.viewPropertyRow
          }
        >
          <Text
            style={
              styles.viewPropertyText
            }
          >
            View Property
          </Text>

          <Ionicons
            name="arrow-forward"
            size={17}
            color="#047857"
          />
        </View>
      </View>
    </Pressable>
  );
}

/* =====================================================
   PROPERTY META
===================================================== */

function PropertyMeta({
  icon,
  text,
}: {
  icon:
    keyof typeof Ionicons.glyphMap;

  text: string;
}) {
  return (
    <View
      style={
        styles.propertyMeta
      }
    >
      <Ionicons
        name={icon}
        size={14}
        color="#64748b"
      />

      <Text
        style={
          styles.propertyMetaText
        }
      >
        {text}
      </Text>
    </View>
  );
}

/* =====================================================
   HELPERS
===================================================== */

function createMessageId(
  prefix: string
) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function getPropertyImageUrl(
  image?: ChatPropertyImage
) {
  if (!image) {
    return null;
  }

  if (
    typeof image ===
    'string'
  ) {
    return image;
  }

  return image.url || null;
}

function formatPrice(
  price?: number,
  currency?: string
) {
  const value =
    Number(price);

  if (
    !Number.isFinite(value)
  ) {
    return (
      currency ||
      'Price not available'
    );
  }

  return `${
    currency || 'LKR'
  } ${value.toLocaleString()}`;
}

function formatLocation(
  property: ChatProperty
) {
  return (
    [
      property.city,
      property.district,
    ]
      .filter(Boolean)
      .join(', ') ||
    'Location not provided'
  );
}

function formatTime(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '';
  }

  return date.toLocaleTimeString(
    undefined,
    {
      hour: 'numeric',
      minute: '2-digit',
    }
  );
}

function capitalize(
  value: string
) {
  if (!value) {
    return '';
  }

  return (
    value
      .charAt(0)
      .toUpperCase() +
    value.slice(1)
  );
}

/* =====================================================
   STYLES
===================================================== */

const styles =
  StyleSheet.create({
    flex: {
      flex: 1,
    },

    screen: {
      flex: 1,

      backgroundColor:
        '#f8fafc',
    },

    pressed: {
      opacity: 0.82,
    },

    /* ============================
       HEADER
    ============================= */

    header: {
      minHeight: 68,

      flexDirection: 'row',

      alignItems: 'center',

      borderBottomWidth: 1,

      borderBottomColor:
        '#e2e8f0',

      backgroundColor:
        '#ffffff',

      paddingHorizontal: 12,
    },

    headerButton: {
      width: 41,

      height: 41,

      alignItems: 'center',

      justifyContent: 'center',

      borderRadius: 12,

      backgroundColor:
        '#f1f5f9',
    },

    disabledHeaderButton: {
      opacity: 0.6,
    },

    aiAvatar: {
      width: 42,

      height: 42,

      marginLeft: 9,

      alignItems: 'center',

      justifyContent: 'center',

      borderRadius: 21,

      backgroundColor:
        '#047857',
    },

    headerInfo: {
      flex: 1,

      marginHorizontal: 10,
    },

    headerTitle: {
      color: '#0f172a',

      fontSize: 15,

      fontWeight: '800',
    },

    onlineRow: {
      marginTop: 3,

      flexDirection: 'row',

      alignItems: 'center',

      gap: 5,
    },

    onlineDot: {
      width: 6,

      height: 6,

      borderRadius: 3,

      backgroundColor:
        '#10b981',
    },

    headerSubtitle: {
      color: '#64748b',

      fontSize: 10,
    },

    /* ============================
       INFORMATION
    ============================= */

    infoBanner: {
      minHeight: 39,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent: 'center',

      gap: 6,

      borderBottomWidth: 1,

      borderBottomColor:
        '#d1fae5',

      backgroundColor:
        '#ecfdf5',

      paddingHorizontal: 14,
    },

    infoBannerText: {
      color: '#065f46',

      fontSize: 9,

      fontWeight: '600',
    },

    /* ============================
       MESSAGES
    ============================= */

    messageList: {
      flex: 1,
    },

    messageContent: {
      flexGrow: 1,

      paddingHorizontal: 12,

      paddingTop: 13,

      paddingBottom: 18,
    },

    messageWrapper: {
      marginBottom: 14,

      flexDirection: 'row',

      alignItems: 'flex-start',
    },

    userMessageWrapper: {
      justifyContent:
        'flex-end',
    },

    aiMessageWrapper: {
      justifyContent:
        'flex-start',
    },

    smallAiAvatar: {
      width: 29,

      height: 29,

      marginRight: 7,

      alignItems: 'center',

      justifyContent: 'center',

      borderRadius: 15,

      backgroundColor:
        '#047857',
    },

    messageBlock: {
      flex: 1,

      alignItems:
        'flex-start',
    },

    userMessageBlock: {
      alignItems:
        'flex-end',
    },

    messageBubble: {
      maxWidth: '88%',

      borderRadius: 17,

      paddingHorizontal: 13,

      paddingVertical: 10,
    },

    aiBubble: {
      borderWidth: 1,

      borderColor:
        '#e2e8f0',

      borderTopLeftRadius: 5,

      backgroundColor:
        '#ffffff',
    },

    userBubble: {
      borderTopRightRadius: 5,

      backgroundColor:
        '#047857',
    },

    aiName: {
      marginBottom: 5,

      color: '#047857',

      fontSize: 9,

      fontWeight: '800',
    },

    messageText: {
      color: '#0f172a',

      fontSize: 13,

      lineHeight: 20,
    },

    userMessageText: {
      color: '#ffffff',
    },

    messageTime: {
      marginTop: 6,

      color: '#94a3b8',

      fontSize: 8,
    },

    userMessageTime: {
      color: '#bbf7d0',

      textAlign: 'right',
    },

    /* ============================
       SUGGESTIONS
    ============================= */

    suggestionsArea: {
      marginBottom: 17,
    },

    suggestionsTitle: {
      marginBottom: 8,

      color: '#64748b',

      fontSize: 10,

      fontWeight: '800',
    },

    suggestions: {
      gap: 8,

      paddingRight: 10,
    },

    suggestionChip: {
      width: 170,

      minHeight: 60,

      flexDirection: 'row',

      alignItems: 'center',

      gap: 8,

      borderWidth: 1,

      borderColor:
        '#d1fae5',

      borderRadius: 13,

      backgroundColor:
        '#ffffff',

      paddingHorizontal: 11,

      paddingVertical: 9,
    },

    suggestionText: {
      flex: 1,

      color: '#334155',

      fontSize: 10,

      lineHeight: 15,

      fontWeight: '700',
    },

    /* ============================
       TYPING
    ============================= */

    typingRow: {
      marginBottom: 15,

      flexDirection: 'row',

      alignItems: 'center',
    },

    typingBubble: {
      minHeight: 45,

      flexDirection: 'row',

      alignItems: 'center',

      gap: 8,

      borderWidth: 1,

      borderColor:
        '#e2e8f0',

      borderRadius: 16,

      borderTopLeftRadius: 5,

      backgroundColor:
        '#ffffff',

      paddingHorizontal: 13,
    },

    typingText: {
      color: '#64748b',

      fontSize: 10,

      fontWeight: '600',
    },

    /* ============================
       PROPERTY RESULTS
    ============================= */

    propertyResults: {
      width: '100%',

      marginTop: 9,
    },

    propertyResultsHeader: {
      marginBottom: 8,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',
    },

    propertyResultsTitleRow: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 5,
    },

    propertyResultsTitle: {
      color: '#0f172a',

      fontSize: 11,

      fontWeight: '800',
    },

    matchCount: {
      color: '#64748b',

      fontSize: 9,
    },

    propertyCard: {
      overflow: 'hidden',

      marginBottom: 11,

      borderWidth: 1,

      borderColor:
        '#e2e8f0',

      borderRadius: 15,

      backgroundColor:
        '#ffffff',
    },

    propertyImage: {
      width: '100%',

      height: 145,

      backgroundColor:
        '#e2e8f0',
    },

    propertyImagePlaceholder: {
      height: 125,

      alignItems: 'center',

      justifyContent: 'center',

      backgroundColor:
        '#d1fae5',
    },

    propertyCardContent: {
      padding: 12,
    },

    propertyBadgeRow: {
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',
    },

    propertyTypeBadge: {
      borderRadius: 999,

      backgroundColor:
        '#ecfdf5',

      paddingHorizontal: 8,

      paddingVertical: 4,
    },

    propertyTypeText: {
      color: '#047857',

      fontSize: 8,

      fontWeight: '800',
    },

    listingType: {
      color: '#64748b',

      fontSize: 8,

      fontWeight: '700',
    },

    propertyTitle: {
      marginTop: 8,

      color: '#0f172a',

      fontSize: 14,

      lineHeight: 19,

      fontWeight: '800',
    },

    propertyPrice: {
      marginTop: 6,

      color: '#047857',

      fontSize: 15,

      fontWeight: '800',
    },

    propertyLocationRow: {
      marginTop: 6,

      flexDirection: 'row',

      alignItems: 'center',

      gap: 3,
    },

    propertyLocation: {
      flex: 1,

      color: '#64748b',

      fontSize: 9,
    },

    propertyDetails: {
      marginTop: 10,

      flexDirection: 'row',

      flexWrap: 'wrap',

      gap: 11,

      borderTopWidth: 1,

      borderTopColor:
        '#f1f5f9',

      paddingTop: 9,
    },

    propertyMeta: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 3,
    },

    propertyMetaText: {
      color: '#475569',

      fontSize: 8,
    },

    viewPropertyRow: {
      marginTop: 11,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',

      borderTopWidth: 1,

      borderTopColor:
        '#f1f5f9',

      paddingTop: 9,
    },

    viewPropertyText: {
      color: '#047857',

      fontSize: 9,

      fontWeight: '800',
    },

    /* ============================
       SOURCES
    ============================= */

    sourceArea: {
      maxWidth: '90%',

      marginTop: 7,

      flexDirection: 'row',

      alignItems: 'center',

      gap: 4,
    },

    sourceLabel: {
      color: '#64748b',

      fontSize: 8,

      fontWeight: '700',
    },

    sourceText: {
      flex: 1,

      color: '#94a3b8',

      fontSize: 8,
    },

    /* ============================
       ERROR
    ============================= */

    errorBox: {
      marginHorizontal: 11,

      marginBottom: 7,

      flexDirection: 'row',

      alignItems: 'center',

      gap: 7,

      borderWidth: 1,

      borderColor:
        '#fecaca',

      borderRadius: 11,

      backgroundColor:
        '#fef2f2',

      padding: 9,
    },

    errorText: {
      flex: 1,

      color: '#b91c1c',

      fontSize: 10,

      lineHeight: 15,
    },

    /* ============================
       COMPOSER
    ============================= */

    composerArea: {
      borderTopWidth: 1,

      borderTopColor:
        '#e2e8f0',

      backgroundColor:
        '#ffffff',

      paddingHorizontal: 11,

      paddingTop: 9,

      paddingBottom: 6,
    },

    composer: {
      flexDirection: 'row',

      alignItems: 'flex-end',

      gap: 8,
    },

    input: {
      flex: 1,

      minHeight: 46,

      maxHeight: 120,

      borderWidth: 1,

      borderColor:
        '#cbd5e1',

      borderRadius: 15,

      backgroundColor:
        '#f8fafc',

      paddingHorizontal: 13,

      paddingTop: 11,

      paddingBottom: 10,

      color: '#0f172a',

      fontSize: 13,
    },

    sendButton: {
      width: 47,

      height: 47,

      alignItems: 'center',

      justifyContent: 'center',

      borderRadius: 24,

      backgroundColor:
        '#047857',
    },

    sendButtonDisabled: {
      backgroundColor:
        '#94a3b8',
    },

    composerBottom: {
      minHeight: 20,

      marginTop: 5,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',

      paddingHorizontal: 3,
    },

    aiNotice: {
      color: '#94a3b8',

      fontSize: 8,
    },

    characterCount: {
      color: '#64748b',

      fontSize: 8,
    },

    characterWarning: {
      color: '#b91c1c',

      fontWeight: '800',
    },
  });