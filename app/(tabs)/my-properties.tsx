import {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  router,
  useFocusEffect,
} from 'expo-router';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import useAuth from '../../context/AuthContext';

import {
  getMyProperties,
} from '../../api/myProperties';

/* =====================================================
   TYPES
===================================================== */

type PropertyImage =
  | string
  | {
      url?: string;
      publicId?: string | null;
    };

type Property = {
  _id: string;

  title: string;

  description?: string;

  price: number;

  currency: string;

  listingType?:
    | 'sale'
    | 'rent'
    | string;

  propertyType?:
    | 'house'
    | 'apartment'
    | 'land'
    | 'commercial'
    | string;

  address?: string;

  city?: string;

  district?: string;

  bedrooms?: number;

  bathrooms?: number;

  area?: number;

  areaUnit?: string;

  images?: PropertyImage[];

  amenities?: string[];

  status:
    | 'pending'
    | 'approved'
    | 'rejected';

  availabilityStatus?:
    | 'available'
    | 'sold'
    | 'rented'
    | 'unavailable';

  rejectionReason?: string;

  createdAt?: string;

  updatedAt?: string;
};

type PropertyStatus =
  | 'all'
  | 'pending'
  | 'approved'
  | 'rejected';

/* =====================================================
   SCREEN
===================================================== */

export default function MyPropertiesScreen() {
  const {
    user,
    initializing,
  } = useAuth();

  const [
    properties,
    setProperties,
  ] = useState<Property[]>([]);

  const [
    selectedStatus,
    setSelectedStatus,
  ] =
    useState<PropertyStatus>(
      'all'
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
    error,
    setError,
  ] = useState('');

  /* ===================================================
     LOAD PROPERTIES
  =================================================== */

  const loadProperties =
    useCallback(
      async (
        status:
          PropertyStatus,
        showLoader = true
      ) => {
        if (!user) {
          setProperties([]);

          setLoading(false);

          return;
        }

        if (showLoader) {
          setLoading(true);
        }

        setError('');

        try {
          const queryParams: {
            page: number;
            limit: number;
            status?: string;
          } = {
            page: 1,
            limit: 50,
          };

          if (
            status !== 'all'
          ) {
            queryParams.status =
              status;
          }

          const data =
            await getMyProperties(
              queryParams
            );

          const list =
            Array.isArray(
              data?.properties
            )
              ? data.properties
              : [];

          setProperties(list);
        } catch (
          requestError
        ) {
          const message =
            requestError instanceof
              Error
              ? requestError.message
              : 'Unable to load your properties';

          setError(message);
        } finally {
          setLoading(false);

          setRefreshing(false);
        }
      },
      [user]
    );

  /* ===================================================
     LOAD WHEN TAB BECOMES ACTIVE

     This also refreshes when returning from:
     - Create Property
     - Edit Property
     - Manage Property
  =================================================== */

  useFocusEffect(
    useCallback(() => {
      if (
        !initializing
      ) {
        loadProperties(
          selectedStatus
        );
      }
    }, [
      initializing,
      selectedStatus,
      loadProperties,
    ])
  );

  /* ===================================================
     FILTER
  =================================================== */

  const handleStatusChange =
    (
      status:
        PropertyStatus
    ) => {
      if (
        status ===
        selectedStatus
      ) {
        return;
      }

      setSelectedStatus(
        status
      );
    };

  /* ===================================================
     REFRESH
  =================================================== */

  const handleRefresh =
    () => {
      setRefreshing(true);

      loadProperties(
        selectedStatus,
        false
      );
    };

  /* ===================================================
     AUTH INITIALIZING
  =================================================== */

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

        <Text
          style={
            styles.loadingText
          }
        >
          Loading account...
        </Text>
      </SafeAreaView>
    );
  }

  /* ===================================================
     GUEST
  =================================================== */

  if (!user) {
    return (
      <SafeAreaView
        style={
          styles.screen
        }
        edges={['top']}
      >
        <View
          style={
            styles.guestContainer
          }
        >
          <View
            style={
              styles.guestIcon
            }
          >
            <Ionicons
              name="business-outline"
              size={42}
              color="#047857"
            />
          </View>

          <Text
            style={
              styles.guestTitle
            }
          >
            My Properties
          </Text>

          <Text
            style={
              styles.guestMessage
            }
          >
            Login to publish new
            properties and manage
            your existing listings.
          </Text>

          <Pressable
            onPress={() =>
              router.push(
                '/login'
              )
            }
            style={({
              pressed,
            }) => [
              styles.loginButton,

              pressed &&
                styles.pressed,
            ]}
          >
            <Ionicons
              name="log-in-outline"
              size={19}
              color="#ffffff"
            />

            <Text
              style={
                styles.loginButtonText
              }
            >
              Login
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              router.push(
                '/register'
              )
            }
            style={({
              pressed,
            }) => [
              styles.registerButton,

              pressed &&
                styles.pressed,
            ]}
          >
            <Text
              style={
                styles.registerButtonText
              }
            >
              Create Account
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  /* ===================================================
     SCREEN
  =================================================== */

  return (
    <SafeAreaView
      style={
        styles.screen
      }
      edges={['top']}
    >
      {/* ============================================
          HEADER
      ============================================ */}

      <View
        style={
          styles.header
        }
      >
        <View
          style={
            styles.headerTop
          }
        >
          <View
            style={
              styles.headerTextArea
            }
          >
            <Text
              style={
                styles.title
              }
            >
              My Properties
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Manage your property
              listings
            </Text>
          </View>

          <Pressable
            onPress={() =>
              router.push(
                '/my-property/create'
              )
            }
            style={({
              pressed,
            }) => [
              styles.addButton,

              pressed &&
                styles.pressed,
            ]}
          >
            <Ionicons
              name="add"
              size={20}
              color="#ffffff"
            />

            <Text
              style={
                styles.addButtonText
              }
            >
              Add
            </Text>
          </Pressable>
        </View>

        {/* ==========================================
            STATUS FILTERS
        ========================================== */}

        <View
          style={
            styles.filters
          }
        >
          <FilterButton
            title="All"
            icon="grid-outline"
            active={
              selectedStatus ===
              'all'
            }
            onPress={() =>
              handleStatusChange(
                'all'
              )
            }
          />

          <FilterButton
            title="Pending"
            icon="time-outline"
            active={
              selectedStatus ===
              'pending'
            }
            onPress={() =>
              handleStatusChange(
                'pending'
              )
            }
          />

          <FilterButton
            title="Approved"
            icon="checkmark-circle-outline"
            active={
              selectedStatus ===
              'approved'
            }
            onPress={() =>
              handleStatusChange(
                'approved'
              )
            }
          />

          <FilterButton
            title="Rejected"
            icon="close-circle-outline"
            active={
              selectedStatus ===
              'rejected'
            }
            onPress={() =>
              handleStatusChange(
                'rejected'
              )
            }
          />
        </View>
      </View>

      {/* ============================================
          LOADING
      ============================================ */}

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
            Loading your
            properties...
          </Text>
        </View>
      ) : error &&
        properties.length ===
          0 ? (
        /* ==========================================
            ERROR
        ========================================== */

        <View
          style={
            styles.centeredContent
          }
        >
          <View
            style={
              styles.errorIcon
            }
          >
            <Ionicons
              name="alert-circle-outline"
              size={38}
              color="#b91c1c"
            />
          </View>

          <Text
            style={
              styles.errorTitle
            }
          >
            Unable to load
            properties
          </Text>

          <Text
            style={
              styles.errorMessage
            }
          >
            {error}
          </Text>

          <Pressable
            onPress={() =>
              loadProperties(
                selectedStatus
              )
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
                styles.retryText
              }
            >
              Try Again
            </Text>
          </Pressable>
        </View>
      ) : (
        /* ==========================================
            LIST
        ========================================== */

        <FlatList
          data={properties}
          keyExtractor={(
            property
          ) =>
            property._id
          }
          renderItem={({
            item,
          }) => (
            <MyPropertyCard
              property={
                item
              }
            />
          )}
          contentContainerStyle={[
            styles.list,

            properties.length ===
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
          ListHeaderComponent={
            properties.length >
            0 ? (
              <View
                style={
                  styles.resultsHeader
                }
              >
                <Text
                  style={
                    styles.resultsText
                  }
                >
                  {properties.length}{' '}
                  {properties.length ===
                  1
                    ? 'property'
                    : 'properties'}
                </Text>

                <Text
                  style={
                    styles.resultsHint
                  }
                >
                  Pull down to
                  refresh
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              selectedStatus={
                selectedStatus
              }
              onShowAll={() =>
                setSelectedStatus(
                  'all'
                )
              }
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

/* =====================================================
   FILTER BUTTON
===================================================== */

function FilterButton({
  title,
  icon,
  active,
  onPress,
}: {
  title: string;

  icon:
    keyof typeof Ionicons.glyphMap;

  active: boolean;

  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({
        pressed,
      }) => [
        styles.filterButton,

        active &&
          styles.filterButtonActive,

        pressed &&
          styles.pressed,
      ]}
    >
      <Ionicons
        name={icon}
        size={15}
        color={
          active
            ? '#ffffff'
            : '#64748b'
        }
      />

      <Text
        style={[
          styles.filterText,

          active &&
            styles.filterTextActive,
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>
    </Pressable>
  );
}

/* =====================================================
   PROPERTY CARD
===================================================== */

function MyPropertyCard({
  property,
}: {
  property: Property;
}) {
  const imageUrl =
    getFirstImage(
      property.images
    );

  const statusMeta =
    getStatusMeta(
      property.status
    );

  const availabilityMeta =
    getAvailabilityMeta(
      property
        .availabilityStatus ||
        'available'
    );

  const openProperty =
    () => {
      router.push({
        pathname:
          '/my-property/[id]',

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
        styles.card,

        pressed &&
          styles.cardPressed,
      ]}
    >
      {/* ==========================================
          IMAGE
      ========================================== */}

      <View
        style={
          styles.imageArea
        }
      >
        {imageUrl ? (
          <Image
            source={{
              uri: imageUrl,
            }}
            style={
              styles.propertyImage
            }
            resizeMode="cover"
          />
        ) : (
          <View
            style={
              styles.imagePlaceholder
            }
          >
            <View
              style={
                styles.placeholderIcon
              }
            >
              <Ionicons
                name="image-outline"
                size={32}
                color="#047857"
              />
            </View>

            <Text
              style={
                styles.placeholderTitle
              }
            >
              EstateHub
            </Text>

            <Text
              style={
                styles.placeholderText
              }
            >
              No property image
            </Text>
          </View>
        )}

        {/* Moderation Status */}

        <View
          style={[
            styles.imageStatusBadge,

            {
              backgroundColor:
                statusMeta.background,
            },
          ]}
        >
          <Ionicons
            name={
              statusMeta.icon
            }
            size={13}
            color={
              statusMeta.color
            }
          />

          <Text
            style={[
              styles.imageStatusText,

              {
                color:
                  statusMeta.color,
              },
            ]}
          >
            {
              statusMeta.label
            }
          </Text>
        </View>

        {/* Availability */}

        {property.status ===
        'approved' ? (
          <View
            style={[
              styles.imageAvailabilityBadge,

              {
                backgroundColor:
                  availabilityMeta.background,
              },
            ]}
          >
            <Text
              style={[
                styles.imageAvailabilityText,

                {
                  color:
                    availabilityMeta.color,
                },
              ]}
            >
              {
                availabilityMeta.label
              }
            </Text>
          </View>
        ) : null}
      </View>

      {/* ==========================================
          CONTENT
      ========================================== */}

      <View
        style={
          styles.cardContent
        }
      >
        <View
          style={
            styles.typeRow
          }
        >
          <View
            style={
              styles.propertyTypeBadge
            }
          >
            <Ionicons
              name={
                getPropertyTypeIcon(
                  property.propertyType
                )
              }
              size={14}
              color="#047857"
            />

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
              styles.listingTypeText
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

        {/* Title */}

        <Text
          style={
            styles.propertyTitle
          }
          numberOfLines={2}
        >
          {property.title}
        </Text>

        {/* Price */}

        <Text
          style={
            styles.price
          }
        >
          {formatPrice(
            property.price,
            property.currency
          )}
        </Text>

        {/* Location */}

        <View
          style={
            styles.locationRow
          }
        >
          <Ionicons
            name="location-outline"
            size={15}
            color="#64748b"
          />

          <Text
            style={
              styles.location
            }
            numberOfLines={1}
          >
            {formatLocation(
              property
            )}
          </Text>
        </View>

        {/* Property Meta */}

        <View
          style={
            styles.propertyMeta
          }
        >
          {property.propertyType !==
          'land' ? (
            <>
              <MetaItem
                icon="bed-outline"
                text={`${
                  property.bedrooms ??
                  0
                } Beds`}
              />

              <MetaItem
                icon="water-outline"
                text={`${
                  property.bathrooms ??
                  0
                } Baths`}
              />
            </>
          ) : null}

          {property.area ? (
            <MetaItem
              icon="resize-outline"
              text={`${property.area} ${
                property.areaUnit ||
                ''
              }`}
            />
          ) : null}
        </View>

        {/* ========================================
            PENDING NOTICE
        ========================================= */}

        {property.status ===
        'pending' ? (
          <View
            style={
              styles.pendingNotice
            }
          >
            <Ionicons
              name="time-outline"
              size={19}
              color="#92400e"
            />

            <View
              style={
                styles.noticeContent
              }
            >
              <Text
                style={
                  styles.pendingNoticeTitle
                }
              >
                Under review
              </Text>

              <Text
                style={
                  styles.pendingNoticeText
                }
              >
                This property is
                waiting for admin
                approval.
              </Text>
            </View>
          </View>
        ) : null}

        {/* ========================================
            REJECTION REASON
        ========================================= */}

        {property.status ===
          'rejected' &&
        property.rejectionReason ? (
          <View
            style={
              styles.rejectionBox
            }
          >
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color="#b91c1c"
            />

            <View
              style={
                styles.noticeContent
              }
            >
              <Text
                style={
                  styles.rejectionTitle
                }
              >
                Rejection reason
              </Text>

              <Text
                style={
                  styles.rejectionText
                }
              >
                {
                  property.rejectionReason
                }
              </Text>

              <Text
                style={
                  styles.rejectionHelp
                }
              >
                Edit the property
                and submit it again
                for review.
              </Text>
            </View>
          </View>
        ) : null}

        {/* ========================================
            APPROVED STATUS
        ========================================= */}

        {property.status ===
        'approved' ? (
          <View
            style={
              styles.approvedInfo
            }
          >
            <View
              style={
                styles.approvedInfoIcon
              }
            >
              <Ionicons
                name="checkmark-circle"
                size={18}
                color="#047857"
              />
            </View>

            <Text
              style={
                styles.approvedInfoText
              }
            >
              Published on
              EstateHub
            </Text>
          </View>
        ) : null}

        {/* ========================================
            DATE
        ========================================= */}

        {property.createdAt ? (
          <View
            style={
              styles.dateRow
            }
          >
            <Ionicons
              name="calendar-outline"
              size={14}
              color="#94a3b8"
            />

            <Text
              style={
                styles.dateText
              }
            >
              Added{' '}
              {formatDate(
                property.createdAt
              )}
            </Text>
          </View>
        ) : null}

        {/* ========================================
            MANAGE
        ========================================= */}

        <View
          style={
            styles.manageRow
          }
        >
          <View
            style={
              styles.manageLeft
            }
          >
            <View
              style={
                styles.manageIcon
              }
            >
              <Ionicons
                name="settings-outline"
                size={17}
                color="#047857"
              />
            </View>

            <Text
              style={
                styles.manageText
              }
            >
              Manage Property
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#047857"
          />
        </View>
      </View>
    </Pressable>
  );
}

/* =====================================================
   META ITEM
===================================================== */

function MetaItem({
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
        styles.metaItem
      }
    >
      <Ionicons
        name={icon}
        size={15}
        color="#64748b"
      />

      <Text
        style={
          styles.metaText
        }
      >
        {text}
      </Text>
    </View>
  );
}

/* =====================================================
   EMPTY STATE
===================================================== */

function EmptyState({
  selectedStatus,
  onShowAll,
}: {
  selectedStatus:
    PropertyStatus;

  onShowAll: () => void;
}) {
  const isAll =
    selectedStatus ===
    'all';

  return (
    <View
      style={
        styles.emptyContainer
      }
    >
      <View
        style={
          styles.emptyIcon
        }
      >
        <Ionicons
          name={
            isAll
              ? 'business-outline'
              : 'filter-outline'
          }
          size={39}
          color="#047857"
        />
      </View>

      <Text
        style={
          styles.emptyTitle
        }
      >
        {isAll
          ? 'No properties yet'
          : `No ${selectedStatus} properties`}
      </Text>

      <Text
        style={
          styles.emptyMessage
        }
      >
        {isAll
          ? 'Create your first property listing and submit it for review.'
          : `You currently do not have any ${selectedStatus} property listings.`}
      </Text>

      {isAll ? (
        <Pressable
          onPress={() =>
            router.push(
              '/my-property/create'
            )
          }
          style={({
            pressed,
          }) => [
            styles.emptyPrimaryButton,

            pressed &&
              styles.pressed,
          ]}
        >
          <Ionicons
            name="add"
            size={19}
            color="#ffffff"
          />

          <Text
            style={
              styles.emptyPrimaryText
            }
          >
            Add Property
          </Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={
            onShowAll
          }
          style={({
            pressed,
          }) => [
            styles.showAllButton,

            pressed &&
              styles.pressed,
          ]}
        >
          <Text
            style={
              styles.showAllText
            }
          >
            Show All Properties
          </Text>
        </Pressable>
      )}
    </View>
  );
}

/* =====================================================
   STATUS META
===================================================== */

function getStatusMeta(
  status:
    Property['status']
): {
  label: string;
  color: string;
  background: string;
  icon:
    keyof typeof Ionicons.glyphMap;
} {
  switch (status) {
    case 'approved':
      return {
        label: 'Approved',
        color: '#166534',
        background:
          '#dcfce7',
        icon:
          'checkmark-circle',
      };

    case 'rejected':
      return {
        label: 'Rejected',
        color: '#991b1b',
        background:
          '#fee2e2',
        icon:
          'close-circle',
      };

    default:
      return {
        label: 'Pending',
        color: '#92400e',
        background:
          '#fef3c7',
        icon: 'time',
      };
  }
}

/* =====================================================
   AVAILABILITY META
===================================================== */

function getAvailabilityMeta(
  status: string
) {
  switch (status) {
    case 'sold':
      return {
        label: 'Sold',
        color: '#b91c1c',
        background:
          '#fee2e2',
      };

    case 'rented':
      return {
        label: 'Rented',
        color: '#1d4ed8',
        background:
          '#dbeafe',
      };

    case 'unavailable':
      return {
        label:
          'Unavailable',
        color: '#92400e',
        background:
          '#fef3c7',
      };

    default:
      return {
        label: 'Available',
        color: '#047857',
        background:
          '#d1fae5',
      };
  }
}

/* =====================================================
   PROPERTY TYPE ICON
===================================================== */

function getPropertyTypeIcon(
  type?: string
):
  keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'apartment':
      return 'business-outline';

    case 'land':
      return 'leaf-outline';

    case 'commercial':
      return 'storefront-outline';

    default:
      return 'home-outline';
  }
}

/* =====================================================
   IMAGE
===================================================== */

function getFirstImage(
  images?: PropertyImage[]
) {
  if (
    !Array.isArray(
      images
    ) ||
    images.length === 0
  ) {
    return null;
  }

  const first =
    images[0];

  if (
    typeof first ===
    'string'
  ) {
    return first;
  }

  return (
    first?.url ||
    null
  );
}

/* =====================================================
   PRICE
===================================================== */

function formatPrice(
  price: number,
  currency: string
) {
  const numericPrice =
    Number(price) || 0;

  return `${
    currency || 'LKR'
  } ${numericPrice.toLocaleString()}`;
}

/* =====================================================
   LOCATION
===================================================== */

function formatLocation(
  property: Property
) {
  const parts = [
    property.city,
    property.district,
  ].filter(Boolean);

  return (
    parts.join(', ') ||
    'Location not provided'
  );
}

/* =====================================================
   DATE
===================================================== */

function formatDate(
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }
  );
}

/* =====================================================
   CAPITALIZE
===================================================== */

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

    centeredContent: {
      flex: 1,
      alignItems:
        'center',
      justifyContent:
        'center',
      paddingHorizontal: 25,
    },

    pressed: {
      opacity: 0.82,
    },

    /* ============================
       HEADER
    ============================= */

    header: {
      paddingHorizontal: 18,
      paddingTop: 15,
      paddingBottom: 14,
      backgroundColor:
        '#f8fafc',
    },

    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
    },

    headerTextArea: {
      flex: 1,
      marginRight: 12,
    },

    title: {
      color: '#0f172a',
      fontSize: 28,
      fontWeight: '800',
    },

    subtitle: {
      marginTop: 4,
      color: '#64748b',
      fontSize: 13,
    },

    addButton: {
      minHeight: 43,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 4,
      borderRadius: 12,
      backgroundColor:
        '#047857',
      paddingHorizontal: 14,
    },

    addButtonText: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '800',
    },

    /* ============================
       FILTERS
    ============================= */

    filters: {
      marginTop: 18,
      flexDirection: 'row',
      gap: 5,
    },

    filterButton: {
      flex: 1,
      minHeight: 42,
      alignItems: 'center',
      justifyContent:
        'center',
      flexDirection: 'row',
      gap: 4,
      borderWidth: 1,
      borderColor:
        '#e2e8f0',
      borderRadius: 11,
      backgroundColor:
        '#ffffff',
      paddingHorizontal: 3,
    },

    filterButtonActive: {
      borderColor:
        '#047857',
      backgroundColor:
        '#047857',
    },

    filterText: {
      color: '#64748b',
      fontSize: 9,
      fontWeight: '700',
    },

    filterTextActive: {
      color: '#ffffff',
    },

    /* ============================
       LIST
    ============================= */

    list: {
      paddingHorizontal: 18,
      paddingBottom: 30,
    },

    emptyList: {
      flexGrow: 1,
    },

    resultsHeader: {
      marginBottom: 11,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
    },

    resultsText: {
      color: '#334155',
      fontSize: 12,
      fontWeight: '800',
    },

    resultsHint: {
      color: '#94a3b8',
      fontSize: 10,
    },

    /* ============================
       CARD
    ============================= */

    card: {
      overflow: 'hidden',
      marginBottom: 17,
      borderWidth: 1,
      borderColor:
        '#e2e8f0',
      borderRadius: 18,
      backgroundColor:
        '#ffffff',
      elevation: 2,
    },

    cardPressed: {
      opacity: 0.88,
    },

    imageArea: {
      position: 'relative',
      backgroundColor:
        '#e2e8f0',
    },

    propertyImage: {
      width: '100%',
      height: 190,
      backgroundColor:
        '#e2e8f0',
    },

    imagePlaceholder: {
      height: 190,
      alignItems: 'center',
      justifyContent:
        'center',
      backgroundColor:
        '#d1fae5',
    },

    placeholderIcon: {
      width: 61,
      height: 61,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 31,
      backgroundColor:
        '#ecfdf5',
    },

    placeholderTitle: {
      marginTop: 8,
      color: '#047857',
      fontSize: 17,
      fontWeight: '800',
    },

    placeholderText: {
      marginTop: 3,
      color: '#64748b',
      fontSize: 10,
    },

    /* ============================
       IMAGE BADGES
    ============================= */

    imageStatusBadge: {
      position: 'absolute',
      top: 12,
      left: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 6,
    },

    imageStatusText: {
      fontSize: 9,
      fontWeight: '900',
      textTransform:
        'uppercase',
    },

    imageAvailabilityBadge: {
      position: 'absolute',
      top: 12,
      right: 12,
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 6,
    },

    imageAvailabilityText: {
      fontSize: 9,
      fontWeight: '900',
      textTransform:
        'uppercase',
    },

    /* ============================
       CARD CONTENT
    ============================= */

    cardContent: {
      padding: 15,
    },

    typeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      gap: 10,
    },

    propertyTypeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },

    propertyTypeText: {
      color: '#047857',
      fontSize: 11,
      fontWeight: '800',
    },

    listingTypeText: {
      color: '#64748b',
      fontSize: 10,
      fontWeight: '700',
    },

    propertyTitle: {
      marginTop: 9,
      color: '#0f172a',
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '800',
    },

    price: {
      marginTop: 7,
      color: '#047857',
      fontSize: 20,
      fontWeight: '800',
    },

    locationRow: {
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    location: {
      flex: 1,
      color: '#64748b',
      fontSize: 12,
    },

    propertyMeta: {
      marginTop: 13,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 13,
      borderTopWidth: 1,
      borderTopColor:
        '#f1f5f9',
      paddingTop: 12,
    },

    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    metaText: {
      color: '#475569',
      fontSize: 10,
      fontWeight: '600',
    },

    /* ============================
       PENDING
    ============================= */

    pendingNotice: {
      marginTop: 14,
      flexDirection: 'row',
      alignItems:
        'flex-start',
      gap: 9,
      borderWidth: 1,
      borderColor:
        '#fde68a',
      borderRadius: 12,
      backgroundColor:
        '#fffbeb',
      padding: 11,
    },

    noticeContent: {
      flex: 1,
    },

    pendingNoticeTitle: {
      color: '#92400e',
      fontSize: 11,
      fontWeight: '800',
    },

    pendingNoticeText: {
      marginTop: 3,
      color: '#a16207',
      fontSize: 10,
      lineHeight: 16,
    },

    /* ============================
       REJECTED
    ============================= */

    rejectionBox: {
      marginTop: 14,
      flexDirection: 'row',
      alignItems:
        'flex-start',
      gap: 9,
      borderWidth: 1,
      borderColor:
        '#fecaca',
      borderRadius: 12,
      backgroundColor:
        '#fef2f2',
      padding: 11,
    },

    rejectionTitle: {
      color: '#991b1b',
      fontSize: 11,
      fontWeight: '800',
    },

    rejectionText: {
      marginTop: 3,
      color: '#b91c1c',
      fontSize: 11,
      lineHeight: 17,
    },

    rejectionHelp: {
      marginTop: 5,
      color: '#64748b',
      fontSize: 9,
      lineHeight: 14,
    },

    /* ============================
       APPROVED
    ============================= */

    approvedInfo: {
      marginTop: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderRadius: 11,
      backgroundColor:
        '#ecfdf5',
      paddingHorizontal: 10,
      paddingVertical: 9,
    },

    approvedInfoIcon: {
      width: 27,
      height: 27,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 9,
      backgroundColor:
        '#d1fae5',
    },

    approvedInfoText: {
      color: '#065f46',
      fontSize: 10,
      fontWeight: '700',
    },

    /* ============================
       DATE
    ============================= */

    dateRow: {
      marginTop: 11,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },

    dateText: {
      color: '#94a3b8',
      fontSize: 9,
    },

    /* ============================
       MANAGE
    ============================= */

    manageRow: {
      marginTop: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      borderTopWidth: 1,
      borderTopColor:
        '#f1f5f9',
      paddingTop: 13,
    },

    manageLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    manageIcon: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 10,
      backgroundColor:
        '#ecfdf5',
    },

    manageText: {
      color: '#047857',
      fontSize: 12,
      fontWeight: '800',
    },

    /* ============================
       LOADING
    ============================= */

    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    loadingText: {
      marginTop: 10,
      color: '#64748b',
      fontSize: 13,
    },

    /* ============================
       ERROR
    ============================= */

    errorIcon: {
      width: 74,
      height: 74,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 37,
      backgroundColor:
        '#fef2f2',
    },

    errorTitle: {
      marginTop: 16,
      color: '#991b1b',
      fontSize: 19,
      fontWeight: '800',
      textAlign: 'center',
    },

    errorMessage: {
      marginTop: 7,
      color: '#64748b',
      fontSize: 13,
      lineHeight: 20,
      textAlign: 'center',
    },

    retryButton: {
      minHeight: 46,
      marginTop: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 7,
      borderRadius: 12,
      backgroundColor:
        '#047857',
      paddingHorizontal: 18,
    },

    retryText: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '800',
    },

    /* ============================
       EMPTY
    ============================= */

    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
      paddingHorizontal: 22,
      paddingVertical: 35,
    },

    emptyIcon: {
      width: 78,
      height: 78,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 39,
      backgroundColor:
        '#ecfdf5',
    },

    emptyTitle: {
      marginTop: 16,
      color: '#0f172a',
      fontSize: 19,
      fontWeight: '800',
      textAlign: 'center',
    },

    emptyMessage: {
      marginTop: 7,
      maxWidth: 290,
      color: '#64748b',
      fontSize: 13,
      lineHeight: 20,
      textAlign: 'center',
    },

    emptyPrimaryButton: {
      minHeight: 46,
      marginTop: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 6,
      borderRadius: 12,
      backgroundColor:
        '#047857',
      paddingHorizontal: 18,
    },

    emptyPrimaryText: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '800',
    },

    showAllButton: {
      marginTop: 17,
      borderWidth: 1,
      borderColor:
        '#047857',
      borderRadius: 12,
      backgroundColor:
        '#ffffff',
      paddingHorizontal: 17,
      paddingVertical: 11,
    },

    showAllText: {
      color: '#047857',
      fontSize: 11,
      fontWeight: '800',
    },

    /* ============================
       GUEST
    ============================= */

    guestContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
      paddingHorizontal: 28,
    },

    guestIcon: {
      width: 88,
      height: 88,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 44,
      backgroundColor:
        '#ecfdf5',
    },

    guestTitle: {
      marginTop: 18,
      color: '#0f172a',
      fontSize: 23,
      fontWeight: '800',
    },

    guestMessage: {
      marginTop: 8,
      maxWidth: 300,
      color: '#64748b',
      fontSize: 14,
      lineHeight: 21,
      textAlign: 'center',
    },

    loginButton: {
      width: '100%',
      minHeight: 50,
      marginTop: 23,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 7,
      borderRadius: 13,
      backgroundColor:
        '#047857',
    },

    loginButtonText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '800',
    },

    registerButton: {
      width: '100%',
      minHeight: 50,
      marginTop: 9,
      alignItems: 'center',
      justifyContent:
        'center',
      borderWidth: 1,
      borderColor:
        '#047857',
      borderRadius: 13,
      backgroundColor:
        '#ffffff',
    },

    registerButtonText: {
      color: '#047857',
      fontSize: 14,
      fontWeight: '800',
    },
  });