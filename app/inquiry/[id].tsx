import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  closeInquiry,
  getInquiry,
  sendInquiryMessage,
} from '../../api/inquiries';

import useAuth from '../../context/AuthContext';

/* =====================================================
   TYPES
===================================================== */

type User = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
};

type Property = {
  _id: string;

  title?: string;

  price?: number;

  currency?: string;

  city?: string;

  district?: string;
};

type Message = {
  _id: string;

  sender?: User;

  senderRole:
    | 'buyer'
    | 'owner';

  message: string;

  createdAt: string;
};

type Inquiry = {
  _id: string;

  property?: Property;

  buyer?: User;

  owner?: User;

  messages: Message[];

  status:
    | 'open'
    | 'closed';

  lastMessageAt?: string;

  closedAt?: string;
};

/* =====================================================
   SCREEN
===================================================== */

export default function InquiryConversationScreen() {
  const {
    user,
  } = useAuth();

  const params =
    useLocalSearchParams<{
      id?:
        | string
        | string[];
    }>();

  const inquiryId =
    Array.isArray(
      params.id
    )
      ? params.id[0]
      : params.id;

  const [
    inquiry,
    setInquiry,
  ] =
    useState<Inquiry | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState('');

  const [
    sending,
    setSending,
  ] = useState(false);

  const [
    closing,
    setClosing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const listRef =
    useRef<FlatList<Message>>(
      null
    );

  /* ===================================================
     LOAD INQUIRY
  =================================================== */

  const loadInquiry =
    useCallback(
      async (
        showLoader = true
      ) => {
        if (!inquiryId) {
          setError(
            'Inquiry ID is missing.'
          );

          setLoading(false);

          return;
        }

        try {
          if (showLoader) {
            setLoading(true);
          }

          setError('');

          const data =
            await getInquiry(
              inquiryId
            );

          if (!data?._id) {
            throw new Error(
              'Inquiry conversation was not found.'
            );
          }

          setInquiry(data);
        } catch (
          requestError
        ) {
          setError(
            requestError instanceof
              Error
              ? requestError.message
              : 'Unable to load inquiry'
          );
        } finally {
          setLoading(false);

          setRefreshing(false);
        }
      },
      [inquiryId]
    );

  /* ===================================================
     INITIAL LOAD
  =================================================== */

  useEffect(() => {
    loadInquiry();
  }, [loadInquiry]);

  /* ===================================================
     SCROLL TO LATEST MESSAGE
  =================================================== */

  useEffect(() => {
    if (
      inquiry?.messages
        ?.length
    ) {
      const timer =
        setTimeout(() => {
          listRef.current
            ?.scrollToEnd({
              animated: true,
            });
        }, 120);

      return () =>
        clearTimeout(timer);
    }
  }, [
    inquiry?.messages?.length,
  ]);

  /* ===================================================
     REFRESH
  =================================================== */

  const handleRefresh =
    () => {
      setRefreshing(true);

      loadInquiry(false);
    };

  /* ===================================================
     SEND MESSAGE
  =================================================== */

  const handleSend =
    async () => {
      if (
        !inquiryId ||
        !inquiry ||
        inquiry.status ===
          'closed' ||
        sending
      ) {
        return;
      }

      const cleanMessage =
        message.trim();

      if (
        cleanMessage.length <
        2
      ) {
        setError(
          'Message must contain at least 2 characters.'
        );

        return;
      }

      if (
        cleanMessage.length >
        2000
      ) {
        setError(
          'Message cannot contain more than 2000 characters.'
        );

        return;
      }

      try {
        setSending(true);

        setError('');

        const updatedInquiry =
          await sendInquiryMessage({
            inquiryId,

            message:
              cleanMessage,
          });

        setInquiry(
          updatedInquiry
        );

        setMessage('');
      } catch (
        requestError
      ) {
        setError(
          requestError instanceof
            Error
            ? requestError.message
            : 'Unable to send message'
        );
      } finally {
        setSending(false);
      }
    };

  /* ===================================================
     CLOSE INQUIRY
  =================================================== */

  const handleClose =
    () => {
      if (
        !inquiryId ||
        !inquiry ||
        inquiry.status ===
          'closed' ||
        closing
      ) {
        return;
      }

      Alert.alert(
        'Close Inquiry',
        'Are you sure you want to close this conversation? You will not be able to send new replies after closing it.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },

          {
            text: 'Close',
            style:
              'destructive',

            onPress:
              async () => {
                try {
                  setClosing(
                    true
                  );

                  setError('');

                  const updatedInquiry =
                    await closeInquiry(
                      inquiryId
                    );

                  setInquiry(
                    updatedInquiry
                  );
                } catch (
                  requestError
                ) {
                  setError(
                    requestError instanceof
                      Error
                      ? requestError.message
                      : 'Unable to close inquiry'
                  );
                } finally {
                  setClosing(
                    false
                  );
                }
              },
          },
        ]
      );
    };

  /* ===================================================
     LOADING
  =================================================== */

  if (loading) {
    return (
      <SafeAreaView
        style={
          styles.centered
        }
      >
        <ActivityIndicator
          size="large"
          color="#047857"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading conversation...
        </Text>
      </SafeAreaView>
    );
  }

  /* ===================================================
     LOAD ERROR
  =================================================== */

  if (
    error &&
    !inquiry
  ) {
    return (
      <SafeAreaView
        style={
          styles.centered
        }
      >
        <View
          style={
            styles.errorIcon
          }
        >
          <Ionicons
            name="alert-circle-outline"
            size={39}
            color="#b91c1c"
          />
        </View>

        <Text
          style={
            styles.errorTitle
          }
        >
          Unable to load
          conversation
        </Text>

        <Text
          style={
            styles.errorText
          }
        >
          {error}
        </Text>

        <Pressable
          onPress={() =>
            loadInquiry()
          }
          style={({
            pressed,
          }) => [
            styles.retryButton,

            pressed &&
              styles.pressed,
          ]}
        >
          <Ionicons
            name="refresh"
            size={18}
            color="#ffffff"
          />

          <Text
            style={
              styles.retryButtonText
            }
          >
            Try Again
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            router.back()
          }
          style={({
            pressed,
          }) => [
            styles.backActionButton,

            pressed &&
              styles.pressed,
          ]}
        >
          <Text
            style={
              styles.backActionText
            }
          >
            Go Back
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!inquiry) {
    return null;
  }

  /* ===================================================
     USER INFORMATION
  =================================================== */

  const currentUserId =
    user?._id ||
    user?.id;

  const buyerId =
    inquiry.buyer?._id ||
    inquiry.buyer?.id;

  const isBuyer =
    Boolean(
      currentUserId &&
        buyerId &&
        String(
          currentUserId
        ) ===
          String(buyerId)
    );

  const otherPerson =
    isBuyer
      ? inquiry.owner
      : inquiry.buyer;

  const otherPersonRole =
    isBuyer
      ? 'Property Owner'
      : 'Buyer';

  const cleanMessage =
    message.trim();

  const canSend =
    inquiry.status ===
      'open' &&
    cleanMessage.length >=
      2 &&
    !sending;

  /* ===================================================
     PROPERTY
  =================================================== */

  const openProperty =
    () => {
      if (
        !inquiry.property
          ?._id
      ) {
        return;
      }

      router.push({
        pathname:
          '/property/[id]',

        params: {
          id:
            inquiry.property
              ._id,
        },
      });
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
              styles.backButton,

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
              styles.headerAvatar
            }
          >
            <Text
              style={
                styles.headerAvatarText
              }
            >
              {getInitials(
                otherPerson?.name
              )}
            </Text>
          </View>

          <View
            style={
              styles.headerInfo
            }
          >
            <Text
              style={
                styles.headerPersonName
              }
              numberOfLines={1}
            >
              {otherPerson
                ?.name ||
                otherPerson
                  ?.email ||
                'EstateHub User'}
            </Text>

            <View
              style={
                styles.headerRoleRow
              }
            >
              <Text
                style={
                  styles.headerRole
                }
              >
                {
                  otherPersonRole
                }
              </Text>

              <View
                style={
                  styles.headerDot
                }
              />

              <Text
                style={[
                  styles.headerStatus,

                  inquiry.status ===
                    'open'
                    ? styles.openStatus
                    : styles.closedStatus,
                ]}
              >
                {inquiry.status ===
                'open'
                  ? 'Open'
                  : 'Closed'}
              </Text>
            </View>
          </View>

          {inquiry.status ===
          'open' ? (
            <Pressable
              onPress={
                handleClose
              }
              disabled={
                closing
              }
              style={({
                pressed,
              }) => [
                styles.closeButton,

                pressed &&
                  !closing &&
                  styles.pressed,

                closing &&
                  styles.disabledButton,
              ]}
            >
              {closing ? (
                <ActivityIndicator
                  size="small"
                  color="#b91c1c"
                />
              ) : (
                <Ionicons
                  name="close-circle-outline"
                  size={22}
                  color="#b91c1c"
                />
              )}
            </Pressable>
          ) : (
            <View
              style={
                styles.closedHeaderBadge
              }
            >
              <Ionicons
                name="lock-closed-outline"
                size={14}
                color="#64748b"
              />
            </View>
          )}
        </View>

        {/* ============================================
            PROPERTY SUMMARY
        ============================================ */}

        <Pressable
          onPress={
            openProperty
          }
          disabled={
            !inquiry.property
              ?._id
          }
          style={({
            pressed,
          }) => [
            styles.propertyBox,

            pressed &&
              inquiry.property
                ?._id &&
              styles.pressed,
          ]}
        >
          <View
            style={
              styles.propertyIcon
            }
          >
            <Ionicons
              name="home-outline"
              size={22}
              color="#047857"
            />
          </View>

          <View
            style={
              styles.propertyInformation
            }
          >
            <Text
              style={
                styles.propertyLabel
              }
            >
              PROPERTY INQUIRY
            </Text>

            <Text
              style={
                styles.propertyName
              }
              numberOfLines={1}
            >
              {inquiry.property
                ?.title ||
                'Property'}
            </Text>

            <View
              style={
                styles.propertyBottomRow
              }
            >
              {typeof inquiry
                .property
                ?.price ===
              'number' ? (
                <Text
                  style={
                    styles.propertyPrice
                  }
                >
                  {formatPrice(
                    inquiry
                      .property
                      .price,

                    inquiry
                      .property
                      .currency
                  )}
                </Text>
              ) : null}

              {formatLocation(
                inquiry.property
              ) ? (
                <>
                  <View
                    style={
                      styles.propertyDot
                    }
                  />

                  <Text
                    style={
                      styles.propertyLocation
                    }
                    numberOfLines={1}
                  >
                    {formatLocation(
                      inquiry.property
                    )}
                  </Text>
                </>
              ) : null}
            </View>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#047857"
          />
        </Pressable>

        {/* ============================================
            MESSAGES
        ============================================ */}

        <FlatList
          ref={listRef}
          style={
            styles.messageList
          }
          data={
            inquiry.messages ||
            []
          }
          keyExtractor={(
            item
          ) => item._id}
          renderItem={({
            item,
            index,
          }) => (
            <MessageBubble
              message={
                item
              }
              currentUserId={
                currentUserId
              }
              previousMessage={
                index > 0
                  ? inquiry
                      .messages[
                      index - 1
                    ]
                  : undefined
              }
            />
          )}
          contentContainerStyle={
            styles.messages
          }
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={
                refreshing
              }
              onRefresh={
                handleRefresh
              }
              colors={[
                '#047857',
              ]}
              tintColor="#047857"
            />
          }
          ListHeaderComponent={
            <View
              style={
                styles.conversationStart
              }
            >
              <View
                style={
                  styles.conversationStartLine
                }
              />

              <Text
                style={
                  styles.conversationStartText
                }
              >
                Conversation
              </Text>

              <View
                style={
                  styles.conversationStartLine
                }
              />
            </View>
          }
          ListEmptyComponent={
            <View
              style={
                styles.emptyMessages
              }
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={37}
                color="#94a3b8"
              />

              <Text
                style={
                  styles.emptyMessagesTitle
                }
              >
                No messages yet
              </Text>

              <Text
                style={
                  styles.emptyMessagesText
                }
              >
                Messages in this
                inquiry will appear
                here.
              </Text>
            </View>
          }
        />

        {/* ============================================
            INLINE ERROR
        ============================================ */}

        {error ? (
          <View
            style={
              styles.inlineError
            }
          >
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color="#b91c1c"
            />

            <Text
              style={
                styles.inlineErrorText
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
            CLOSED CONVERSATION
        ============================================ */}

        {inquiry.status ===
        'closed' ? (
          <View
            style={
              styles.closedContainer
            }
          >
            <View
              style={
                styles.closedIcon
              }
            >
              <Ionicons
                name="lock-closed-outline"
                size={19}
                color="#64748b"
              />
            </View>

            <View
              style={
                styles.closedInformation
              }
            >
              <Text
                style={
                  styles.closedTitle
                }
              >
                Conversation closed
              </Text>

              <Text
                style={
                  styles.closedMessage
                }
              >
                New replies can no
                longer be sent.
                {inquiry.closedAt
                  ? ` Closed ${formatClosedDate(
                      inquiry.closedAt
                    )}.`
                  : ''}
              </Text>
            </View>
          </View>
        ) : (
          /* ==========================================
              COMPOSER
          ========================================== */

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
                value={
                  message
                }
                onChangeText={(
                  value
                ) => {
                  setMessage(
                    value
                  );

                  if (error) {
                    setError('');
                  }
                }}
                placeholder="Write a message..."
                placeholderTextColor="#94a3b8"
                multiline
                maxLength={2000}
                editable={
                  !sending
                }
                style={
                  styles.input
                }
                textAlignVertical="top"
              />

              <Pressable
                onPress={
                  handleSend
                }
                disabled={
                  !canSend
                }
                style={({
                  pressed,
                }) => [
                  styles.sendButton,

                  !canSend &&
                    styles.sendButtonDisabled,

                  pressed &&
                    canSend &&
                    styles.sendButtonPressed,
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
                styles.composerFooter
              }
            >
              <Text
                style={
                  styles.composerHint
                }
              >
                Messages are visible
                to both participants.
              </Text>

              {message.length >
              1600 ? (
                <Text
                  style={[
                    styles.characterCount,

                    message.length >
                      1900 &&
                      styles.characterCountWarning,
                  ]}
                >
                  {message.length}
                  /2000
                </Text>
              ) : null}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* =====================================================
   MESSAGE BUBBLE
===================================================== */

function MessageBubble({
  message,
  currentUserId,
  previousMessage,
}: {
  message: Message;

  currentUserId?: string;

  previousMessage?:
    Message;
}) {
  const senderId =
    message.sender?._id ||
    message.sender?.id;

  const mine =
    Boolean(
      senderId &&
        currentUserId &&
        String(senderId) ===
          String(
            currentUserId
          )
    );

  const showDate =
    shouldShowDate(
      message,
      previousMessage
    );

  return (
    <>
      {showDate ? (
        <View
          style={
            styles.dateSeparator
          }
        >
          <View
            style={
              styles.dateLine
            }
          />

          <Text
            style={
              styles.dateSeparatorText
            }
          >
            {formatMessageDate(
              message.createdAt
            )}
          </Text>

          <View
            style={
              styles.dateLine
            }
          />
        </View>
      ) : null}

      <View
        style={[
          styles.messageRow,

          mine
            ? styles.myMessageRow
            : styles.otherMessageRow,
        ]}
      >
        {!mine ? (
          <View
            style={
              styles.messageAvatar
            }
          >
            <Text
              style={
                styles.messageAvatarText
              }
            >
              {getInitials(
                message.sender
                  ?.name
              )}
            </Text>
          </View>
        ) : null}

        <View
          style={[
            styles.messageBubble,

            mine
              ? styles.myBubble
              : styles.otherBubble,
          ]}
        >
          {!mine ? (
            <Text
              style={
                styles.senderName
              }
            >
              {message.sender
                ?.name ||
                capitalize(
                  message.senderRole
                )}
            </Text>
          ) : null}

          <Text
            style={[
              styles.messageText,

              mine &&
                styles.myMessageText,
            ]}
          >
            {message.message}
          </Text>

          <View
            style={[
              styles.messageTimeRow,

              mine &&
                styles.myMessageTimeRow,
            ]}
          >
            <Text
              style={[
                styles.messageTime,

                mine &&
                  styles.myMessageTime,
              ]}
            >
              {formatMessageTime(
                message.createdAt
              )}
            </Text>

            {mine ? (
              <Ionicons
                name="checkmark-done"
                size={14}
                color="#bbf7d0"
              />
            ) : null}
          </View>
        </View>
      </View>
    </>
  );
}

/* =====================================================
   DATE SEPARATOR
===================================================== */

function shouldShowDate(
  message: Message,
  previousMessage?: Message
) {
  if (!previousMessage) {
    return true;
  }

  const currentDate =
    new Date(
      message.createdAt
    );

  const previousDate =
    new Date(
      previousMessage.createdAt
    );

  if (
    Number.isNaN(
      currentDate.getTime()
    ) ||
    Number.isNaN(
      previousDate.getTime()
    )
  ) {
    return false;
  }

  return (
    currentDate.toDateString() !==
    previousDate.toDateString()
  );
}

/* =====================================================
   FORMAT MESSAGE DATE
===================================================== */

function formatMessageDate(
  value?: string
) {
  if (!value) {
    return '';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '';
  }

  const today =
    new Date();

  const yesterday =
    new Date();

  yesterday.setDate(
    today.getDate() - 1
  );

  if (
    date.toDateString() ===
    today.toDateString()
  ) {
    return 'Today';
  }

  if (
    date.toDateString() ===
    yesterday.toDateString()
  ) {
    return 'Yesterday';
  }

  return date.toLocaleDateString(
    undefined,
    {
      month: 'short',
      day: 'numeric',
      year:
        date.getFullYear() !==
        today.getFullYear()
          ? 'numeric'
          : undefined,
    }
  );
}

/* =====================================================
   FORMAT MESSAGE TIME
===================================================== */

function formatMessageTime(
  value?: string
) {
  if (!value) {
    return '';
  }

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

/* =====================================================
   CLOSED DATE
===================================================== */

function formatClosedDate(
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

  return date.toLocaleDateString(
    undefined,
    {
      month: 'short',
      day: 'numeric',
    }
  );
}

/* =====================================================
   PRICE
===================================================== */

function formatPrice(
  price?: number,
  currency?: string
) {
  const numericPrice =
    Number(price);

  if (
    !Number.isFinite(
      numericPrice
    )
  ) {
    return '';
  }

  return `${
    currency || 'LKR'
  } ${numericPrice.toLocaleString()}`;
}

/* =====================================================
   LOCATION
===================================================== */

function formatLocation(
  property?: Property
) {
  if (!property) {
    return '';
  }

  return [
    property.city,
    property.district,
  ]
    .filter(Boolean)
    .join(', ');
}

/* =====================================================
   INITIALS
===================================================== */

function getInitials(
  name?: string
) {
  if (!name) {
    return 'U';
  }

  const words =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    words.length === 0
  ) {
    return 'U';
  }

  if (
    words.length === 1
  ) {
    return words[0]
      .charAt(0)
      .toUpperCase();
  }

  return (
    words[0]
      .charAt(0)
      .toUpperCase() +
    words[
      words.length - 1
    ]
      .charAt(0)
      .toUpperCase()
  );
}

/* =====================================================
   CAPITALIZE
===================================================== */

function capitalize(
  value?: string
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

    centered: {
      flex: 1,
      alignItems:
        'center',
      justifyContent:
        'center',
      paddingHorizontal: 25,
      backgroundColor:
        '#f8fafc',
    },

    pressed: {
      opacity: 0.82,
    },

    disabledButton: {
      opacity: 0.6,
    },

    loadingText: {
      marginTop: 12,
      color: '#64748b',
      fontSize: 14,
    },

    /* ============================
       ERROR
    ============================= */

    errorIcon: {
      width: 76,
      height: 76,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 38,
      backgroundColor:
        '#fef2f2',
    },

    errorTitle: {
      marginTop: 16,
      color: '#991b1b',
      fontSize: 20,
      fontWeight: '800',
      textAlign: 'center',
    },

    errorText: {
      marginTop: 8,
      maxWidth: 310,
      color: '#64748b',
      fontSize: 13,
      lineHeight: 20,
      textAlign: 'center',
    },

    retryButton: {
      minHeight: 47,
      marginTop: 19,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 7,
      borderRadius: 12,
      backgroundColor:
        '#047857',
      paddingHorizontal: 19,
    },

    retryButtonText: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '800',
    },

    backActionButton: {
      marginTop: 11,
      paddingHorizontal: 19,
      paddingVertical: 11,
    },

    backActionText: {
      color: '#64748b',
      fontSize: 12,
      fontWeight: '700',
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

    backButton: {
      width: 41,
      height: 41,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 12,
      backgroundColor:
        '#f1f5f9',
    },

    headerAvatar: {
      width: 40,
      height: 40,
      marginLeft: 9,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 20,
      backgroundColor:
        '#047857',
    },

    headerAvatarText: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '800',
    },

    headerInfo: {
      flex: 1,
      marginHorizontal: 9,
    },

    headerPersonName: {
      color: '#0f172a',
      fontSize: 14,
      fontWeight: '800',
    },

    headerRoleRow: {
      marginTop: 3,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },

    headerRole: {
      color: '#64748b',
      fontSize: 10,
    },

    headerDot: {
      width: 3,
      height: 3,
      borderRadius: 2,
      backgroundColor:
        '#94a3b8',
    },

    headerStatus: {
      fontSize: 10,
      fontWeight: '800',
    },

    openStatus: {
      color: '#047857',
    },

    closedStatus: {
      color: '#64748b',
    },

    closeButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent:
        'center',
      borderWidth: 1,
      borderColor:
        '#fecaca',
      borderRadius: 12,
      backgroundColor:
        '#fff',
    },

    closedHeaderBadge: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 12,
      backgroundColor:
        '#f1f5f9',
    },

    /* ============================
       PROPERTY SUMMARY
    ============================= */

    propertyBox: {
      marginHorizontal: 12,
      marginTop: 11,
      marginBottom: 5,
      minHeight: 76,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor:
        '#d1fae5',
      borderRadius: 14,
      backgroundColor:
        '#ecfdf5',
      padding: 11,
    },

    propertyIcon: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 13,
      backgroundColor:
        '#d1fae5',
    },

    propertyInformation: {
      flex: 1,
      marginHorizontal: 10,
    },

    propertyLabel: {
      color: '#047857',
      fontSize: 8,
      fontWeight: '900',
      letterSpacing: 0.5,
    },

    propertyName: {
      marginTop: 3,
      color: '#064e3b',
      fontSize: 13,
      fontWeight: '800',
    },

    propertyBottomRow: {
      marginTop: 4,
      flexDirection: 'row',
      alignItems: 'center',
    },

    propertyPrice: {
      color: '#047857',
      fontSize: 10,
      fontWeight: '800',
    },

    propertyDot: {
      width: 3,
      height: 3,
      marginHorizontal: 6,
      borderRadius: 2,
      backgroundColor:
        '#94a3b8',
    },

    propertyLocation: {
      flex: 1,
      color: '#64748b',
      fontSize: 9,
    },

    /* ============================
       MESSAGE LIST
    ============================= */

    messageList: {
      flex: 1,
    },

    messages: {
      flexGrow: 1,
      paddingHorizontal: 13,
      paddingTop: 8,
      paddingBottom: 18,
    },

    conversationStart: {
      marginVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
    },

    conversationStartLine: {
      flex: 1,
      height: 1,
      backgroundColor:
        '#e2e8f0',
    },

    conversationStartText: {
      color: '#94a3b8',
      fontSize: 9,
      fontWeight: '700',
      textTransform:
        'uppercase',
    },

    /* ============================
       DATE
    ============================= */

    dateSeparator: {
      marginVertical: 13,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
    },

    dateLine: {
      flex: 1,
      height: 1,
      backgroundColor:
        '#e2e8f0',
    },

    dateSeparatorText: {
      color: '#94a3b8',
      fontSize: 9,
      fontWeight: '700',
    },

    /* ============================
       MESSAGE
    ============================= */

    messageRow: {
      marginBottom: 9,
      flexDirection: 'row',
      alignItems: 'flex-end',
    },

    myMessageRow: {
      justifyContent:
        'flex-end',
    },

    otherMessageRow: {
      justifyContent:
        'flex-start',
    },

    messageAvatar: {
      width: 28,
      height: 28,
      marginRight: 6,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 14,
      backgroundColor:
        '#e2e8f0',
    },

    messageAvatarText: {
      color: '#475569',
      fontSize: 9,
      fontWeight: '800',
    },

    messageBubble: {
      maxWidth: '80%',
      borderRadius: 17,
      paddingHorizontal: 13,
      paddingVertical: 9,
    },

    myBubble: {
      backgroundColor:
        '#047857',
      borderBottomRightRadius:
        5,
    },

    otherBubble: {
      borderWidth: 1,
      borderColor:
        '#e2e8f0',
      backgroundColor:
        '#ffffff',
      borderBottomLeftRadius:
        5,
    },

    senderName: {
      marginBottom: 4,
      color: '#64748b',
      fontSize: 9,
      fontWeight: '800',
    },

    messageText: {
      color: '#0f172a',
      fontSize: 13,
      lineHeight: 19,
    },

    myMessageText: {
      color: '#ffffff',
    },

    messageTimeRow: {
      marginTop: 5,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },

    myMessageTimeRow: {
      justifyContent:
        'flex-end',
    },

    messageTime: {
      color: '#94a3b8',
      fontSize: 8,
    },

    myMessageTime: {
      color: '#bbf7d0',
    },

    /* ============================
       EMPTY MESSAGES
    ============================= */

    emptyMessages: {
      flex: 1,
      minHeight: 230,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    emptyMessagesTitle: {
      marginTop: 10,
      color: '#475569',
      fontSize: 14,
      fontWeight: '800',
    },

    emptyMessagesText: {
      marginTop: 4,
      color: '#94a3b8',
      fontSize: 11,
      textAlign: 'center',
    },

    /* ============================
       INLINE ERROR
    ============================= */

    inlineError: {
      marginHorizontal: 12,
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

    inlineErrorText: {
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
      paddingBottom: 7,
    },

    composer: {
      flexDirection: 'row',
      alignItems:
        'flex-end',
      gap: 8,
    },

    input: {
      flex: 1,
      maxHeight: 110,
      minHeight: 45,
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
      width: 46,
      height: 46,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 23,
      backgroundColor:
        '#047857',
    },

    sendButtonDisabled: {
      backgroundColor:
        '#94a3b8',
    },

    sendButtonPressed: {
      opacity: 0.8,
    },

    composerFooter: {
      minHeight: 18,
      marginTop: 5,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      paddingHorizontal: 3,
    },

    composerHint: {
      color: '#94a3b8',
      fontSize: 8,
    },

    characterCount: {
      color: '#64748b',
      fontSize: 8,
    },

    characterCountWarning: {
      color: '#b91c1c',
      fontWeight: '800',
    },

    /* ============================
       CLOSED
    ============================= */

    closedContainer: {
      marginHorizontal: 12,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderWidth: 1,
      borderColor:
        '#e2e8f0',
      borderRadius: 14,
      backgroundColor:
        '#f1f5f9',
      padding: 12,
    },

    closedIcon: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 11,
      backgroundColor:
        '#e2e8f0',
    },

    closedInformation: {
      flex: 1,
    },

    closedTitle: {
      color: '#475569',
      fontSize: 12,
      fontWeight: '800',
    },

    closedMessage: {
      marginTop: 3,
      color: '#64748b',
      fontSize: 9,
      lineHeight: 14,
    },
  });