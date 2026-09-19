import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  router,
} from 'expo-router';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import useAuth from '../../context/AuthContext';

import {
  getReceivedInquiries,
  getSentInquiries,
} from '../../api/inquiries';

type User = {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
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
  senderRole: 'buyer' | 'owner';
  message: string;
  createdAt: string;
};

type Inquiry = {
  _id: string;

  property?: Property;

  buyer?: User;

  owner?: User;

  messages?: Message[];

  status: 'open' | 'closed';

  lastMessageAt?: string;

  buyerUnreadCount?: number;

  ownerUnreadCount?: number;

  createdAt?: string;
};

type InboxMode =
  | 'sent'
  | 'received';

export default function InquiriesScreen() {
  const {
    user,
    initializing,
  } = useAuth();

  const [
    mode,
    setMode,
  ] =
    useState<InboxMode>('sent');

  const [
    inquiries,
    setInquiries,
  ] =
    useState<Inquiry[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const loadInquiries =
    useCallback(
      async (
        selectedMode:
          InboxMode,
        showLoader = true
      ) => {
        if (!user) {
          setInquiries([]);
          setLoading(false);

          return;
        }

        if (showLoader) {
          setLoading(true);
        }

        setError('');

        try {
          const data =
            selectedMode ===
            'sent'
              ? await getSentInquiries()
              : await getReceivedInquiries();

          const list =
            Array.isArray(
              data?.inquiries
            )
              ? data.inquiries
              : [];

          setInquiries(list);
        } catch (
          requestError
        ) {
          const message =
            requestError instanceof
            Error
              ? requestError.message
              : 'Unable to load inquiries';

          setError(message);
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [user]
    );

  useEffect(() => {
    if (
      !initializing
    ) {
      loadInquiries(
        mode
      );
    }
  }, [
    initializing,
    mode,
    loadInquiries,
  ]);

  const changeMode = (
    selectedMode:
      InboxMode
  ) => {
    if (
      selectedMode === mode
    ) {
      return;
    }

    setMode(
      selectedMode
    );
  };

  const handleRefresh =
    () => {
      setRefreshing(true);

      loadInquiries(
        mode,
        false
      );
    };

  if (initializing) {
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
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView
        style={
          styles.centered
        }
      >
        <Text
          style={
            styles.loginTitle
          }
        >
          My Inquiries
        </Text>

        <Text
          style={
            styles.loginMessage
          }
        >
          Login to view
          property inquiries
          and conversations.
        </Text>

        <Pressable
          onPress={() =>
            router.push(
              '/login'
            )
          }
          style={
            styles.loginButton
          }
        >
          <Text
            style={
              styles.loginButtonText
            }
          >
            Login
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top']}
    >
      <View
        style={styles.header}
      >
        <Text
          style={styles.title}
        >
          My Inquiries
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          View your property
          conversations.
        </Text>

        <View
          style={
            styles.modeContainer
          }
        >
          <Pressable
            onPress={() =>
              changeMode(
                'sent'
              )
            }
            style={[
              styles.modeButton,

              mode ===
                'sent' &&
                styles.modeButtonActive,
            ]}
          >
            <Text
              style={[
                styles.modeButtonText,

                mode ===
                  'sent' &&
                  styles.modeButtonTextActive,
              ]}
            >
              Sent
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              changeMode(
                'received'
              )
            }
            style={[
              styles.modeButton,

              mode ===
                'received' &&
                styles.modeButtonActive,
            ]}
          >
            <Text
              style={[
                styles.modeButtonText,

                mode ===
                  'received' &&
                  styles.modeButtonTextActive,
              ]}
            >
              Received
            </Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View
          style={
            styles.loadingContainer
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
            Loading inquiries...
          </Text>
        </View>
      ) : error &&
        inquiries.length ===
          0 ? (
        <View
          style={
            styles.centeredContent
          }
        >
          <Text
            style={
              styles.errorTitle
            }
          >
            Unable to load
            inquiries
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
              loadInquiries(
                mode
              )
            }
            style={
              styles.retryButton
            }
          >
            <Text
              style={
                styles.retryButtonText
              }
            >
              Try again
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={inquiries}
          keyExtractor={(
            inquiry
          ) => inquiry._id}
          renderItem={({
            item,
          }) => (
            <InquiryCard
              inquiry={
                item
              }
              mode={mode}
            />
          )}
          contentContainerStyle={[
            styles.list,

            inquiries.length ===
              0 &&
              styles.emptyList,
          ]}
          showsVerticalScrollIndicator={
            false
          }
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
          ListEmptyComponent={
            <View
              style={
                styles.emptyContainer
              }
            >
              <Text
                style={
                  styles.emptyTitle
                }
              >
                {mode ===
                'sent'
                  ? 'No sent inquiries'
                  : 'No received inquiries'}
              </Text>

              <Text
                style={
                  styles.emptyMessage
                }
              >
                {mode ===
                'sent'
                  ? 'Inquiries you send to property owners will appear here.'
                  : 'Inquiries received for your properties will appear here.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function InquiryCard({
  inquiry,
  mode,
}: {
  inquiry: Inquiry;
  mode: InboxMode;
}) {
  const latestMessage =
    inquiry.messages?.[
      inquiry.messages
        .length - 1
    ];

  const unreadCount =
    mode === 'sent'
      ? inquiry
          .buyerUnreadCount ??
        0
      : inquiry
          .ownerUnreadCount ??
        0;

  const otherPerson =
    mode === 'sent'
      ? inquiry.owner
      : inquiry.buyer;

  const openInquiry =
    () => {
      router.push({
        pathname:
          '/inquiry/[id]',

        params: {
          id: inquiry._id,
        },
      });
    };

  return (
    <Pressable
      onPress={
        openInquiry
      }
      style={({
        pressed,
      }) => [
        styles.card,

        pressed &&
          styles.cardPressed,
      ]}
    >
      <View
        style={
          styles.cardTop
        }
      >
        <View
          style={
            styles.cardTitleArea
          }
        >
          <Text
            style={
              styles.propertyTitle
            }
            numberOfLines={1}
          >
            {inquiry
              .property
              ?.title ||
              'Property'}
          </Text>

          <Text
            style={
              styles.personText
            }
          >
            {mode ===
            'sent'
              ? 'Owner'
              : 'Buyer'}
            :{' '}
            {otherPerson
              ?.name ||
              otherPerson
                ?.email ||
              'EstateHub User'}
          </Text>
        </View>

        {unreadCount > 0 ? (
          <View
            style={
              styles.unreadBadge
            }
          >
            <Text
              style={
                styles.unreadBadgeText
              }
            >
              {unreadCount}
            </Text>
          </View>
        ) : null}
      </View>

      {latestMessage ? (
        <Text
          style={
            styles.messagePreview
          }
          numberOfLines={2}
        >
          {
            latestMessage.message
          }
        </Text>
      ) : null}

      <View
        style={
          styles.cardBottom
        }
      >
        <View
          style={[
            styles.statusBadge,

            inquiry.status ===
            'closed'
              ? styles.closedBadge
              : styles.openBadge,
          ]}
        >
          <Text
            style={[
              styles.statusText,

              inquiry.status ===
              'closed'
                ? styles.closedText
                : styles.openText,
            ]}
          >
            {inquiry.status}
          </Text>
        </View>

        <Text
          style={
            styles.dateText
          }
        >
          {formatDate(
            inquiry.lastMessageAt
          )}
        </Text>
      </View>
    </Pressable>
  );
}

function formatDate(
  value?: string
) {
  if (!value) {
    return '';
  }

  const date =
    new Date(value);

  return date.toLocaleDateString(
    undefined,
    {
      month: 'short',
      day: 'numeric',
    }
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        '#f8fafc',
    },

    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
      paddingHorizontal: 25,
      backgroundColor:
        '#f8fafc',
    },

    centeredContent: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
      paddingHorizontal: 25,
    },

    header: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 16,
    },

    title: {
      color: '#0f172a',
      fontSize: 28,
      fontWeight: '800',
    },

    subtitle: {
      marginTop: 5,
      color: '#64748b',
      fontSize: 14,
    },

    modeContainer: {
      marginTop: 20,
      flexDirection: 'row',
      borderRadius: 13,
      backgroundColor:
        '#e2e8f0',
      padding: 4,
    },

    modeButton: {
      flex: 1,
      alignItems: 'center',
      borderRadius: 10,
      paddingVertical: 10,
    },

    modeButtonActive: {
      backgroundColor:
        '#ffffff',
    },

    modeButtonText: {
      color: '#64748b',
      fontSize: 14,
      fontWeight: '700',
    },

    modeButtonTextActive: {
      color: '#047857',
    },

    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    loadingText: {
      marginTop: 12,
      color: '#64748b',
    },

    list: {
      paddingHorizontal: 20,
      paddingBottom: 30,
    },

    emptyList: {
      flexGrow: 1,
    },

    card: {
      marginBottom: 13,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 16,
      backgroundColor:
        '#ffffff',
      padding: 16,
      elevation: 2,
    },

    cardPressed: {
      opacity: 0.85,
    },

    cardTop: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems:
        'flex-start',
    },

    cardTitleArea: {
      flex: 1,
      marginRight: 10,
    },

    propertyTitle: {
      color: '#0f172a',
      fontSize: 16,
      fontWeight: '800',
    },

    personText: {
      marginTop: 5,
      color: '#64748b',
      fontSize: 13,
    },

    unreadBadge: {
      minWidth: 25,
      height: 25,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 13,
      backgroundColor:
        '#047857',
      paddingHorizontal: 7,
    },

    unreadBadgeText: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '800',
    },

    messagePreview: {
      marginTop: 13,
      color: '#475569',
      fontSize: 14,
      lineHeight: 20,
    },

    cardBottom: {
      marginTop: 15,
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
    },

    statusBadge: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },

    openBadge: {
      backgroundColor:
        '#dcfce7',
    },

    closedBadge: {
      backgroundColor:
        '#f1f5f9',
    },

    statusText: {
      fontSize: 11,
      fontWeight: '800',
      textTransform:
        'uppercase',
    },

    openText: {
      color: '#166534',
    },

    closedText: {
      color: '#64748b',
    },

    dateText: {
      color: '#94a3b8',
      fontSize: 12,
    },

    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
      paddingHorizontal: 25,
    },

    emptyTitle: {
      color: '#0f172a',
      fontSize: 19,
      fontWeight: '800',
    },

    emptyMessage: {
      marginTop: 7,
      color: '#64748b',
      fontSize: 14,
      lineHeight: 21,
      textAlign: 'center',
    },

    loginTitle: {
      color: '#0f172a',
      fontSize: 24,
      fontWeight: '800',
    },

    loginMessage: {
      marginTop: 8,
      color: '#64748b',
      fontSize: 14,
      lineHeight: 21,
      textAlign: 'center',
    },

    loginButton: {
      marginTop: 20,
      minWidth: 130,
      alignItems: 'center',
      borderRadius: 13,
      backgroundColor:
        '#047857',
      paddingVertical: 13,
    },

    loginButtonText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '800',
    },

    errorTitle: {
      color: '#991b1b',
      fontSize: 19,
      fontWeight: '800',
    },

    errorText: {
      marginTop: 8,
      color: '#64748b',
      textAlign: 'center',
    },

    retryButton: {
      marginTop: 18,
      borderRadius: 12,
      backgroundColor:
        '#047857',
      paddingHorizontal: 20,
      paddingVertical: 11,
    },

    retryButtonText: {
      color: '#ffffff',
      fontWeight: '800',
    },
  });