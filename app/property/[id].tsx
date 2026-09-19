import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
  getApprovedPropertyById,
} from '../../api/properties';

import useAuth from '../../context/AuthContext';

const SCREEN_WIDTH =
  Dimensions.get('window').width;

/* =====================================================
   TYPES
===================================================== */

type PropertyImage =
  | string
  | {
      url?: string;
      publicId?: string | null;
    };

type PropertyOwner = {
  _id?: string;
  name?: string;
  email?: string;
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

  owner?: PropertyOwner;

  status?: string;

  availabilityStatus?:
    | 'available'
    | 'sold'
    | 'rented'
    | 'unavailable'
    | string;

  createdAt?: string;
};

/* =====================================================
   SCREEN
===================================================== */

export default function PropertyDetailsScreen() {
  const {
    user,
  } = useAuth();

  const params =
    useLocalSearchParams<{
      id?:
        | string
        | string[];
    }>();

  const propertyId =
    Array.isArray(
      params.id
    )
      ? params.id[0]
      : params.id;

  const [
    property,
    setProperty,
  ] =
    useState<Property | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  const [
    activeImageIndex,
    setActiveImageIndex,
  ] = useState(0);

  /* ===================================================
     LOAD PROPERTY
  =================================================== */

  const loadProperty =
    useCallback(
      async () => {
        if (!propertyId) {
          setError(
            'Property ID is missing.'
          );

          setLoading(false);

          return;
        }

        try {
          setLoading(true);

          setError('');

          const data =
            await getApprovedPropertyById(
              propertyId
            );

          const propertyData =
            data?.property ??
            data;

          if (
            !propertyData?._id
          ) {
            throw new Error(
              'Property details were not found.'
            );
          }

          setProperty(
            propertyData
          );

          setActiveImageIndex(
            0
          );
        } catch (
          requestError
        ) {
          setError(
            requestError instanceof
              Error
              ? requestError.message
              : 'Unable to load property'
          );
        } finally {
          setLoading(false);
        }
      },
      [propertyId]
    );

  useEffect(() => {
    loadProperty();
  }, [loadProperty]);

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
          Loading property...
        </Text>
      </SafeAreaView>
    );
  }

  /* ===================================================
     ERROR
  =================================================== */

  if (
    error ||
    !property
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
            size={38}
            color="#b91c1c"
          />
        </View>

        <Text
          style={
            styles.errorTitle
          }
        >
          Unable to load property
        </Text>

        <Text
          style={
            styles.errorMessage
          }
        >
          {error ||
            'Property not found.'}
        </Text>

        <Pressable
          onPress={() =>
            router.back()
          }
          style={({
            pressed,
          }) => [
            styles.primaryButton,

            pressed &&
              styles.buttonPressed,
          ]}
        >
          <Ionicons
            name="arrow-back"
            size={18}
            color="#ffffff"
          />

          <Text
            style={
              styles.primaryButtonText
            }
          >
            Go Back
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  /* ===================================================
     CALCULATED VALUES
  =================================================== */

  const images =
    normalizeImages(
      property.images
    );

  const availability =
    property.availabilityStatus ||
    'available';

  const isAvailable =
    availability ===
    'available';

  const currentUserId =
    user?._id ||
    user?.id;

  const ownerId =
    property.owner?._id;

  const isOwnProperty =
    Boolean(
      currentUserId &&
        ownerId &&
        String(
          currentUserId
        ) ===
          String(ownerId)
    );

  const availabilityMeta =
    getAvailabilityMeta(
      availability
    );

  /* ===================================================
     IMAGE SCROLL
  =================================================== */

  const handleImageScrollEnd =
    (
      event: NativeSyntheticEvent<NativeScrollEvent>
    ) => {
      const offset =
        event.nativeEvent
          .contentOffset.x;

      const index =
        Math.round(
          offset /
            SCREEN_WIDTH
        );

      setActiveImageIndex(
        Math.max(
          0,
          Math.min(
            index,
            images.length -
              1
          )
        )
      );
    };

  /* ===================================================
     PRIMARY ACTION
  =================================================== */

  const handlePrimaryAction =
    () => {
      /*
       * Property owner should
       * manage their own listing
       * instead of creating an
       * inquiry.
       */
      if (
        isOwnProperty
      ) {
        router.push({
          pathname:
            '/my-property/[id]',

          params: {
            id:
              property._id,
          },
        });

        return;
      }

      /*
       * New inquiry is not
       * available when sold,
       * rented or unavailable.
       */
      if (!isAvailable) {
        return;
      }

      /*
       * Guest must login first.
       */
      if (!user) {
        router.push(
          '/login'
        );

        return;
      }

      router.push({
        pathname:
          '/inquiry/create',

        params: {
          propertyId:
            property._id,

          propertyTitle:
            property.title,
        },
      });
    };

  const actionText =
    getActionText({
      isOwnProperty,
      isAvailable,
      availability,
      loggedIn:
        Boolean(user),
    });

  const actionIcon:
    keyof typeof Ionicons.glyphMap =
    isOwnProperty
      ? 'settings-outline'
      : isAvailable
        ? user
          ? 'chatbubble-ellipses-outline'
          : 'log-in-outline'
        : 'lock-closed-outline';

  const actionDisabled =
    !isOwnProperty &&
    !isAvailable;

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
      {/* ============================================
          TOP BAR
      ============================================ */}

      <View
        style={
          styles.topBar
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
              styles.buttonPressed,
          ]}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color="#0f172a"
          />
        </Pressable>

        <Text
          style={
            styles.topBarTitle
          }
          numberOfLines={1}
        >
          Property Details
        </Text>

        <View
          style={
            styles.topBarSpacer
          }
        />
      </View>

      {/* ============================================
          PAGE CONTENT
      ============================================ */}

      <ScrollView
        style={styles.flex}
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.scrollContent
        }
      >
        {/* ==========================================
            IMAGE CAROUSEL
        =========================================== */}

        <View
          style={
            styles.imageArea
          }
        >
          {images.length >
          0 ? (
            <>
              <FlatList
                horizontal
                pagingEnabled
                data={images}
                keyExtractor={(
                  image,
                  index
                ) =>
                  `${image}-${index}`
                }
                renderItem={({
                  item,
                }) => (
                  <Image
                    source={{
                      uri: item,
                    }}
                    style={
                      styles.heroImage
                    }
                    resizeMode="cover"
                  />
                )}
                showsHorizontalScrollIndicator={
                  false
                }
                onMomentumScrollEnd={
                  handleImageScrollEnd
                }
              />

              {/* Counter */}

              <View
                style={
                  styles.imageCounter
                }
              >
                <Ionicons
                  name="images-outline"
                  size={13}
                  color="#ffffff"
                />

                <Text
                  style={
                    styles.imageCounterText
                  }
                >
                  {activeImageIndex +
                    1}{' '}
                  / {images.length}
                </Text>
              </View>

              {/* Dots */}

              {images.length >
              1 ? (
                <View
                  style={
                    styles.dotContainer
                  }
                >
                  {images.map(
                    (
                      _,
                      index
                    ) => (
                      <View
                        key={
                          index
                        }
                        style={[
                          styles.dot,

                          index ===
                            activeImageIndex &&
                            styles.activeDot,
                        ]}
                      />
                    )
                  )}
                </View>
              ) : null}
            </>
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
                  size={42}
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
                No property images
              </Text>
            </View>
          )}
        </View>

        <View
          style={
            styles.mainContent
          }
        >
          {/* ========================================
              BADGES
          ========================================= */}

          <View
            style={
              styles.badgeRow
            }
          >
            <View
              style={
                styles.listingBadge
              }
            >
              <Text
                style={
                  styles.listingBadgeText
                }
              >
                {property.listingType ===
                'sale'
                  ? 'FOR SALE'
                  : property.listingType ===
                      'rent'
                    ? 'FOR RENT'
                    : 'PROPERTY'}
              </Text>
            </View>

            <View
              style={
                styles.typeBadge
              }
            >
              <Text
                style={
                  styles.typeBadgeText
                }
              >
                {capitalize(
                  property.propertyType ||
                    'property'
                )}
              </Text>
            </View>
          </View>

          {/* ========================================
              TITLE
          ========================================= */}

          <Text
            style={
              styles.title
            }
          >
            {property.title}
          </Text>

          {/* ========================================
              PRICE
          ========================================= */}

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

          {/* ========================================
              LOCATION
          ========================================= */}

          <View
            style={
              styles.locationRow
            }
          >
            <Ionicons
              name="location-outline"
              size={18}
              color="#64748b"
            />

            <Text
              style={
                styles.location
              }
            >
              {formatShortLocation(
                property
              )}
            </Text>
          </View>

          {/* ========================================
              AVAILABILITY
          ========================================= */}

          <View
            style={[
              styles.availabilityBox,

              {
                backgroundColor:
                  availabilityMeta.background,

                borderColor:
                  availabilityMeta.border,
              },
            ]}
          >
            <View
              style={
                styles.availabilityLeft
              }
            >
              <View
                style={[
                  styles.availabilityIcon,

                  {
                    backgroundColor:
                      availabilityMeta.iconBackground,
                  },
                ]}
              >
                <Ionicons
                  name={
                    availabilityMeta.icon
                  }
                  size={18}
                  color={
                    availabilityMeta.color
                  }
                />
              </View>

              <View>
                <Text
                  style={
                    styles.availabilityLabel
                  }
                >
                  Availability
                </Text>

                <Text
                  style={[
                    styles.availabilityValue,

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
            </View>

            {isAvailable ? (
              <Ionicons
                name="checkmark-circle"
                size={22}
                color="#059669"
              />
            ) : null}
          </View>

          {/* ========================================
              QUICK PROPERTY DETAILS
          ========================================= */}

          <SectionTitle>
            Property Details
          </SectionTitle>

          <View
            style={
              styles.detailsGrid
            }
          >
            <DetailItem
              icon="bed-outline"
              label="Bedrooms"
              value={
                property.bedrooms ??
                '-'
              }
            />

            <DetailItem
              icon="water-outline"
              label="Bathrooms"
              value={
                property.bathrooms ??
                '-'
              }
            />

            <DetailItem
              icon="resize-outline"
              label="Area"
              value={
                property.area
                  ? `${property.area} ${
                      property.areaUnit ||
                      ''
                    }`
                  : '-'
              }
            />

            <DetailItem
              icon="home-outline"
              label="Type"
              value={
                capitalize(
                  property.propertyType ||
                    '-'
                )
              }
            />
          </View>

          {/* ========================================
              ABOUT
          ========================================= */}

          <SectionTitle>
            About this property
          </SectionTitle>

          <View
            style={
              styles.descriptionCard
            }
          >
            <Text
              style={
                styles.description
              }
            >
              {property.description ||
                'No description provided.'}
            </Text>
          </View>

          {/* ========================================
              AMENITIES
          ========================================= */}

          <SectionTitle>
            Amenities
          </SectionTitle>

          {property.amenities &&
          property.amenities
            .length > 0 ? (
            <View
              style={
                styles.amenitiesContainer
              }
            >
              {property.amenities.map(
                (
                  amenity,
                  index
                ) => (
                  <View
                    key={`${amenity}-${index}`}
                    style={
                      styles.amenityChip
                    }
                  >
                    <View
                      style={
                        styles.amenityCheck
                      }
                    >
                      <Ionicons
                        name="checkmark"
                        size={13}
                        color="#ffffff"
                      />
                    </View>

                    <Text
                      style={
                        styles.amenityText
                      }
                    >
                      {amenity}
                    </Text>
                  </View>
                )
              )}
            </View>
          ) : (
            <EmptySection
              icon="list-outline"
              text="No amenities listed."
            />
          )}

          {/* ========================================
              LOCATION
          ========================================= */}

          <SectionTitle>
            Location
          </SectionTitle>

          <View
            style={
              styles.locationCard
            }
          >
            <View
              style={
                styles.locationCardIcon
              }
            >
              <Ionicons
                name="location"
                size={24}
                color="#047857"
              />
            </View>

            <View
              style={
                styles.locationCardContent
              }
            >
              {property.address ? (
                <Text
                  style={
                    styles.addressText
                  }
                >
                  {property.address}
                </Text>
              ) : null}

              <Text
                style={
                  styles.cityText
                }
              >
                {[
                  property.city,
                  property.district,
                ]
                  .filter(Boolean)
                  .join(', ') ||
                  'Location not provided'}
              </Text>
            </View>
          </View>

          {/* ========================================
              OWNER
          ========================================= */}

          <SectionTitle>
            Property Owner
          </SectionTitle>

          <View
            style={
              styles.ownerCard
            }
          >
            <View
              style={
                styles.ownerAvatar
              }
            >
              <Text
                style={
                  styles.ownerAvatarText
                }
              >
                {getInitial(
                  property.owner
                    ?.name
                )}
              </Text>
            </View>

            <View
              style={
                styles.ownerInformation
              }
            >
              <Text
                style={
                  styles.ownerName
                }
              >
                {property.owner
                  ?.name ||
                  'Property Owner'}
              </Text>

              <View
                style={
                  styles.ownerVerifiedRow
                }
              >
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color="#047857"
                />

                <Text
                  style={
                    styles.ownerSubtitle
                  }
                >
                  EstateHub property
                  owner
                </Text>
              </View>
            </View>

            {isOwnProperty ? (
              <View
                style={
                  styles.yourPropertyBadge
                }
              >
                <Text
                  style={
                    styles.yourPropertyText
                  }
                >
                  Yours
                </Text>
              </View>
            ) : null}
          </View>

          {/* ========================================
              UNAVAILABLE MESSAGE
          ========================================= */}

          {!isAvailable &&
          !isOwnProperty ? (
            <View
              style={
                styles.unavailableNotice
              }
            >
              <Ionicons
                name="information-circle-outline"
                size={21}
                color="#92400e"
              />

              <Text
                style={
                  styles.unavailableNoticeText
                }
              >
                {getUnavailableMessage(
                  availability
                )}
              </Text>
            </View>
          ) : null}

          <View
            style={
              styles.contentBottomSpace
            }
          />
        </View>
      </ScrollView>

      {/* ============================================
          FIXED BOTTOM ACTION
      ============================================ */}

      <View
        style={
          styles.bottomActionArea
        }
      >
        <Pressable
          onPress={
            handlePrimaryAction
          }
          disabled={
            actionDisabled
          }
          style={({
            pressed,
          }) => [
            styles.contactButton,

            isOwnProperty &&
              styles.manageButton,

            actionDisabled &&
              styles.disabledContactButton,

            pressed &&
              !actionDisabled &&
              styles.buttonPressed,
          ]}
        >
          <Ionicons
            name={
              actionIcon
            }
            size={20}
            color="#ffffff"
          />

          <Text
            style={
              styles.contactButtonText
            }
          >
            {actionText}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/* =====================================================
   SECTION TITLE
===================================================== */

function SectionTitle({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Text
      style={
        styles.sectionTitle
      }
    >
      {children}
    </Text>
  );
}

/* =====================================================
   DETAIL ITEM
===================================================== */

function DetailItem({
  icon,
  label,
  value,
}: {
  icon:
    keyof typeof Ionicons.glyphMap;

  label: string;

  value:
    | string
    | number;
}) {
  return (
    <View
      style={
        styles.detailCard
      }
    >
      <View
        style={
          styles.detailIcon
        }
      >
        <Ionicons
          name={icon}
          size={21}
          color="#047857"
        />
      </View>

      <Text
        style={
          styles.detailValue
        }
        numberOfLines={1}
      >
        {value}
      </Text>

      <Text
        style={
          styles.detailLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}

/* =====================================================
   EMPTY SECTION
===================================================== */

function EmptySection({
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
        styles.emptySection
      }
    >
      <Ionicons
        name={icon}
        size={21}
        color="#94a3b8"
      />

      <Text
        style={
          styles.emptyText
        }
      >
        {text}
      </Text>
    </View>
  );
}

/* =====================================================
   IMAGES
===================================================== */

function normalizeImages(
  images?: PropertyImage[]
) {
  if (
    !Array.isArray(images)
  ) {
    return [];
  }

  return images
    .map((image) => {
      if (
        typeof image ===
        'string'
      ) {
        return image;
      }

      return (
        image?.url ||
        null
      );
    })
    .filter(
      (
        image
      ): image is string =>
        Boolean(image)
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
   SHORT LOCATION
===================================================== */

function formatShortLocation(
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
   OWNER INITIAL
===================================================== */

function getInitial(
  name?: string
) {
  if (!name) {
    return 'O';
  }

  return (
    name
      .trim()
      .charAt(0)
      .toUpperCase() ||
    'O'
  );
}

/* =====================================================
   ACTION TEXT
===================================================== */

function getActionText({
  isOwnProperty,
  isAvailable,
  availability,
  loggedIn,
}: {
  isOwnProperty: boolean;

  isAvailable: boolean;

  availability: string;

  loggedIn: boolean;
}) {
  if (isOwnProperty) {
    return 'Manage Your Property';
  }

  if (!isAvailable) {
    switch (
      availability
    ) {
      case 'sold':
        return 'Property Sold';

      case 'rented':
        return 'Property Rented';

      default:
        return 'Currently Unavailable';
    }
  }

  if (!loggedIn) {
    return 'Login to Contact Owner';
  }

  return 'Contact Owner';
}

/* =====================================================
   UNAVAILABLE MESSAGE
===================================================== */

function getUnavailableMessage(
  availability: string
) {
  switch (
    availability
  ) {
    case 'sold':
      return 'This property has been marked as sold. New inquiries are no longer available.';

    case 'rented':
      return 'This property has been marked as rented. New inquiries are no longer available.';

    default:
      return 'This property is currently unavailable. New inquiries cannot be created.';
  }
}

/* =====================================================
   AVAILABILITY STYLE
===================================================== */

function getAvailabilityMeta(
  status: string
): {
  label: string;

  color: string;

  background: string;

  border: string;

  iconBackground: string;

  icon:
    keyof typeof Ionicons.glyphMap;
} {
  switch (
    status
  ) {
    case 'sold':
      return {
        label: 'Sold',

        color:
          '#b91c1c',

        background:
          '#fef2f2',

        border:
          '#fecaca',

        iconBackground:
          '#fee2e2',

        icon:
          'pricetag-outline',
      };

    case 'rented':
      return {
        label: 'Rented',

        color:
          '#1d4ed8',

        background:
          '#eff6ff',

        border:
          '#bfdbfe',

        iconBackground:
          '#dbeafe',

        icon:
          'key-outline',
      };

    case 'unavailable':
      return {
        label:
          'Unavailable',

        color:
          '#92400e',

        background:
          '#fffbeb',

        border:
          '#fde68a',

        iconBackground:
          '#fef3c7',

        icon:
          'pause-circle-outline',
      };

    default:
      return {
        label:
          'Available',

        color:
          '#047857',

        background:
          '#f0fdf4',

        border:
          '#bbf7d0',

        iconBackground:
          '#d1fae5',

        icon:
          'checkmark-circle-outline',
      };
  }
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

      paddingHorizontal:
        25,

      backgroundColor:
        '#f8fafc',
    },

    loadingText: {
      marginTop: 12,

      color: '#64748b',

      fontSize: 14,
    },

    errorIcon: {
      width: 74,

      height: 74,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 37,

      backgroundColor:
        '#fef2f2',
    },

    errorTitle: {
      marginTop: 16,

      color: '#991b1b',

      fontSize: 21,

      fontWeight: '800',

      textAlign:
        'center',
    },

    errorMessage: {
      marginTop: 8,

      color: '#64748b',

      fontSize: 14,

      lineHeight: 21,

      textAlign:
        'center',
    },

    primaryButton: {
      marginTop: 20,

      minHeight: 48,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 8,

      borderRadius: 13,

      backgroundColor:
        '#047857',

      paddingHorizontal:
        22,
    },

    primaryButtonText: {
      color: '#ffffff',

      fontSize: 14,

      fontWeight: '800',
    },

    buttonPressed: {
      opacity: 0.82,
    },

    /* =============================
       TOP BAR
    ============================== */

    topBar: {
      height: 58,

      flexDirection:
        'row',

      alignItems:
        'center',

      borderBottomWidth:
        1,

      borderBottomColor:
        '#e2e8f0',

      backgroundColor:
        '#ffffff',

      paddingHorizontal:
        15,
    },

    backButton: {
      width: 42,

      height: 42,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 12,

      backgroundColor:
        '#f1f5f9',
    },

    topBarTitle: {
      flex: 1,

      color: '#0f172a',

      fontSize: 16,

      fontWeight: '800',

      textAlign:
        'center',
    },

    topBarSpacer: {
      width: 42,
    },

    scrollContent: {
      paddingBottom: 10,
    },

    /* =============================
       IMAGE
    ============================== */

    imageArea: {
      position:
        'relative',

      backgroundColor:
        '#e2e8f0',
    },

    heroImage: {
      width:
        SCREEN_WIDTH,

      height: 285,

      backgroundColor:
        '#e2e8f0',
    },

    imagePlaceholder: {
      height: 270,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#d1fae5',
    },

    placeholderIcon: {
      width: 72,

      height: 72,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 36,

      backgroundColor:
        '#ecfdf5',
    },

    placeholderTitle: {
      marginTop: 12,

      color: '#047857',

      fontSize: 22,

      fontWeight: '800',
    },

    placeholderText: {
      marginTop: 5,

      color: '#64748b',

      fontSize: 13,
    },

    imageCounter: {
      position:
        'absolute',

      right: 14,

      bottom: 15,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 5,

      borderRadius: 999,

      backgroundColor:
        'rgba(15,23,42,0.72)',

      paddingHorizontal:
        10,

      paddingVertical: 6,
    },

    imageCounterText: {
      color: '#ffffff',

      fontSize: 11,

      fontWeight: '800',
    },

    dotContainer: {
      position:
        'absolute',

      left: 0,

      right: 0,

      bottom: 17,

      flexDirection:
        'row',

      justifyContent:
        'center',

      gap: 5,
    },

    dot: {
      width: 6,

      height: 6,

      borderRadius: 3,

      backgroundColor:
        'rgba(255,255,255,0.55)',
    },

    activeDot: {
      width: 18,

      backgroundColor:
        '#ffffff',
    },

    /* =============================
       MAIN
    ============================== */

    mainContent: {
      paddingHorizontal:
        19,

      paddingTop: 21,
    },

    badgeRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 8,
    },

    listingBadge: {
      borderRadius: 999,

      backgroundColor:
        '#d1fae5',

      paddingHorizontal:
        11,

      paddingVertical: 6,
    },

    listingBadgeText: {
      color: '#065f46',

      fontSize: 10,

      fontWeight: '900',
    },

    typeBadge: {
      borderRadius: 999,

      backgroundColor:
        '#f1f5f9',

      paddingHorizontal:
        11,

      paddingVertical: 6,
    },

    typeBadgeText: {
      color: '#475569',

      fontSize: 10,

      fontWeight: '800',
    },

    title: {
      marginTop: 14,

      color: '#0f172a',

      fontSize: 27,

      lineHeight: 34,

      fontWeight: '800',
    },

    price: {
      marginTop: 9,

      color: '#047857',

      fontSize: 24,

      fontWeight: '800',
    },

    locationRow: {
      marginTop: 10,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 5,
    },

    location: {
      flex: 1,

      color: '#64748b',

      fontSize: 13,
    },

    /* =============================
       AVAILABILITY
    ============================== */

    availabilityBox: {
      marginTop: 18,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      borderWidth: 1,

      borderRadius: 14,

      padding: 13,
    },

    availabilityLeft: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 10,
    },

    availabilityIcon: {
      width: 40,

      height: 40,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 12,
    },

    availabilityLabel: {
      color: '#64748b',

      fontSize: 11,

      fontWeight: '600',
    },

    availabilityValue: {
      marginTop: 2,

      fontSize: 14,

      fontWeight: '800',
    },

    /* =============================
       SECTION
    ============================== */

    sectionTitle: {
      marginTop: 27,

      marginBottom: 12,

      color: '#0f172a',

      fontSize: 18,

      fontWeight: '800',
    },

    /* =============================
       DETAILS
    ============================== */

    detailsGrid: {
      flexDirection:
        'row',

      flexWrap: 'wrap',

      gap: 9,
    },

    detailCard: {
      width: '48%',

      minHeight: 115,

      borderWidth: 1,

      borderColor:
        '#e2e8f0',

      borderRadius: 15,

      backgroundColor:
        '#ffffff',

      padding: 14,
    },

    detailIcon: {
      width: 36,

      height: 36,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 11,

      backgroundColor:
        '#ecfdf5',
    },

    detailValue: {
      marginTop: 10,

      color: '#0f172a',

      fontSize: 15,

      fontWeight: '800',
    },

    detailLabel: {
      marginTop: 3,

      color: '#64748b',

      fontSize: 11,
    },

    /* =============================
       DESCRIPTION
    ============================== */

    descriptionCard: {
      borderWidth: 1,

      borderColor:
        '#e2e8f0',

      borderRadius: 15,

      backgroundColor:
        '#ffffff',

      padding: 15,
    },

    description: {
      color: '#475569',

      fontSize: 14,

      lineHeight: 23,
    },

    /* =============================
       AMENITIES
    ============================== */

    amenitiesContainer: {
      flexDirection:
        'row',

      flexWrap: 'wrap',

      gap: 8,
    },

    amenityChip: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 7,

      borderWidth: 1,

      borderColor:
        '#d1fae5',

      borderRadius: 999,

      backgroundColor:
        '#ffffff',

      paddingHorizontal:
        11,

      paddingVertical: 8,
    },

    amenityCheck: {
      width: 20,

      height: 20,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 10,

      backgroundColor:
        '#047857',
    },

    amenityText: {
      color: '#065f46',

      fontSize: 12,

      fontWeight: '700',
    },

    emptySection: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 8,

      borderRadius: 13,

      backgroundColor:
        '#f1f5f9',

      padding: 14,
    },

    emptyText: {
      color: '#64748b',

      fontSize: 13,
    },

    /* =============================
       LOCATION
    ============================== */

    locationCard: {
      flexDirection:
        'row',

      alignItems:
        'center',

      borderWidth: 1,

      borderColor:
        '#e2e8f0',

      borderRadius: 15,

      backgroundColor:
        '#ffffff',

      padding: 15,
    },

    locationCardIcon: {
      width: 47,

      height: 47,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 14,

      backgroundColor:
        '#ecfdf5',
    },

    locationCardContent: {
      flex: 1,

      marginLeft: 12,
    },

    addressText: {
      color: '#0f172a',

      fontSize: 14,

      fontWeight: '700',
    },

    cityText: {
      marginTop: 4,

      color: '#64748b',

      fontSize: 12,

      lineHeight: 18,
    },

    /* =============================
       OWNER
    ============================== */

    ownerCard: {
      flexDirection:
        'row',

      alignItems:
        'center',

      borderWidth: 1,

      borderColor:
        '#e2e8f0',

      borderRadius: 16,

      backgroundColor:
        '#ffffff',

      padding: 15,
    },

    ownerAvatar: {
      width: 52,

      height: 52,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 26,

      backgroundColor:
        '#047857',
    },

    ownerAvatarText: {
      color: '#ffffff',

      fontSize: 20,

      fontWeight: '800',
    },

    ownerInformation: {
      flex: 1,

      marginLeft: 12,
    },

    ownerName: {
      color: '#0f172a',

      fontSize: 15,

      fontWeight: '800',
    },

    ownerVerifiedRow: {
      marginTop: 4,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 4,
    },

    ownerSubtitle: {
      color: '#64748b',

      fontSize: 11,
    },

    yourPropertyBadge: {
      borderRadius: 999,

      backgroundColor:
        '#ecfdf5',

      paddingHorizontal:
        10,

      paddingVertical: 6,
    },

    yourPropertyText: {
      color: '#047857',

      fontSize: 10,

      fontWeight: '800',
    },

    /* =============================
       UNAVAILABLE
    ============================== */

    unavailableNotice: {
      marginTop: 18,

      flexDirection:
        'row',

      alignItems:
        'flex-start',

      gap: 9,

      borderWidth: 1,

      borderColor:
        '#fde68a',

      borderRadius: 14,

      backgroundColor:
        '#fffbeb',

      padding: 13,
    },

    unavailableNoticeText: {
      flex: 1,

      color: '#92400e',

      fontSize: 12,

      lineHeight: 19,
    },

    contentBottomSpace: {
      height: 22,
    },

    /* =============================
       BOTTOM ACTION
    ============================== */

    bottomActionArea: {
      borderTopWidth: 1,

      borderTopColor:
        '#e2e8f0',

      backgroundColor:
        '#ffffff',

      paddingHorizontal:
        18,

      paddingTop: 10,

      paddingBottom: 8,
    },

    contactButton: {
      minHeight: 53,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 8,

      borderRadius: 14,

      backgroundColor:
        '#047857',

      paddingHorizontal:
        18,
    },

    manageButton: {
      backgroundColor:
        '#0f172a',
    },

    disabledContactButton: {
      backgroundColor:
        '#94a3b8',
    },

    contactButtonText: {
      color: '#ffffff',

      fontSize: 14,

      fontWeight: '800',
    },
  });