import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
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
  getApprovedProperties,
} from '../../api/properties';

import useAuth from '../../context/AuthContext';
import ChatbotFloatingButton from '../../components/ChatbotFloatingButton';

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

  listingType:
    | 'sale'
    | 'rent';

  propertyType:
    | 'house'
    | 'apartment'
    | 'land'
    | 'commercial';

  city?: string;

  district?: string;

  bedrooms?: number;

  bathrooms?: number;

  area?: number;

  areaUnit?: string;

  images?: PropertyImage[];
};

type PropertyTypeFilter =
  | 'all'
  | 'house'
  | 'apartment'
  | 'land'
  | 'commercial';

const HOME_LIMIT = 6;

/* =====================================================
   HOME
===================================================== */

export default function HomeScreen() {
  const {
    user,
    initializing,
  } = useAuth();

  const [
    properties,
    setProperties,
  ] =
    useState<Property[]>([]);

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    appliedSearch,
    setAppliedSearch,
  ] = useState('');

  const [
    selectedType,
    setSelectedType,
  ] =
    useState<PropertyTypeFilter>(
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
        showLoader = true,
        searchValue =
          appliedSearch,
        propertyType =
          selectedType
      ) => {
        if (showLoader) {
          setLoading(true);
        }

        setError('');

        try {
          const queryParams:
            Record<
              string,
              string | number
            > = {
            page: 1,
            limit: HOME_LIMIT,
          };

          const cleanSearch =
            searchValue.trim();

          if (cleanSearch) {
            queryParams.search =
              cleanSearch;
          }

          if (
            propertyType !==
            'all'
          ) {
            queryParams.propertyType =
              propertyType;
          }

          const data =
            await getApprovedProperties(
              queryParams
            );

          const propertyList =
            Array.isArray(
              data?.properties
            )
              ? data.properties
              : [];

          setProperties(
            propertyList
          );
        } catch (
          requestError
        ) {
          setError(
            requestError instanceof
              Error
              ? requestError.message
              : 'Unable to load properties'
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        appliedSearch,
        selectedType,
      ]
    );

  /* ===================================================
     INITIAL LOAD
  =================================================== */

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  /* ===================================================
     SEARCH
  =================================================== */

  const handleSearch =
    () => {
      const cleanSearch =
        search.trim();

      setAppliedSearch(
        cleanSearch
      );

      /*
       * If the value did not
       * actually change, manually
       * reload.
       */
      if (
        cleanSearch ===
        appliedSearch
      ) {
        loadProperties(
          true,
          cleanSearch,
          selectedType
        );
      }
    };

  /* ===================================================
     PROPERTY TYPE
  =================================================== */

  const handleTypeChange =
    (
      type:
        PropertyTypeFilter
    ) => {
      setSelectedType(
        type
      );
    };

  /* ===================================================
     CLEAR SEARCH
  =================================================== */

  const handleClearSearch =
    () => {
      setSearch('');
      setAppliedSearch('');
    };

  /* ===================================================
     REFRESH
  =================================================== */

  const handleRefresh =
    () => {
      setRefreshing(true);

      loadProperties(
        false,
        appliedSearch,
        selectedType
      );
    };

  /* ===================================================
     EXPLORE
  =================================================== */

  const openExplore =
    () => {
      router.push(
        '/explore'
      );
    };

  /* ===================================================
     PROFILE
  =================================================== */

  const openProfile =
    () => {
      router.push(
        '/profile'
      );
    };

  /* ===================================================
     UI
  =================================================== */

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top']}
    >
      <FlatList
        data={properties}
        keyExtractor={(
          property
        ) => property._id}
        renderItem={({
          item,
        }) => (
          <PropertyCard
            property={item}
          />
        )}
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.listContent,

          properties.length ===
            0 &&
            !loading &&
            styles.emptyListContent,
        ]}
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
          <>
            {/* =====================================
                TOP BAR
            ====================================== */}

            <View
              style={
                styles.topBar
              }
            >
              <View
                style={
                  styles.brandArea
                }
              >
                <View
                  style={
                    styles.brandIcon
                  }
                >
                  <Ionicons
                    name="home"
                    size={20}
                    color="#ffffff"
                  />
                </View>

                <View>
                  <Text
                    style={
                      styles.brandName
                    }
                  >
                    EstateHub
                  </Text>

                  <Text
                    style={
                      styles.brandTagline
                    }
                  >
                    Find your place
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={
                  openProfile
                }
                style={({
                  pressed,
                }) => [
                  styles.profileButton,

                  pressed &&
                    styles.pressed,
                ]}
              >
                {user ? (
                  <View
                    style={
                      styles.profileAvatar
                    }
                  >
                    <Text
                      style={
                        styles.profileAvatarText
                      }
                    >
                      {getInitials(
                        user.name
                      )}
                    </Text>
                  </View>
                ) : (
                  <Ionicons
                    name="person-outline"
                    size={23}
                    color="#047857"
                  />
                )}
              </Pressable>
            </View>

            {/* =====================================
                HERO
            ====================================== */}

            <View
              style={
                styles.hero
              }
            >
              {!initializing &&
              user ? (
                <Text
                  style={
                    styles.welcomeText
                  }
                  numberOfLines={
                    1
                  }
                >
                  Welcome back,{' '}
                  {getFirstName(
                    user.name
                  )}
                </Text>
              ) : (
                <Text
                  style={
                    styles.welcomeText
                  }
                >
                  Welcome to
                  EstateHub
                </Text>
              )}

              <Text
                style={
                  styles.heroTitle
                }
              >
                Find the right
                property for you
              </Text>

              <Text
                style={
                  styles.heroDescription
                }
              >
                Discover approved
                houses, apartments,
                land and commercial
                properties.
              </Text>

              {/* Search */}

              <View
                style={
                  styles.searchContainer
                }
              >
                <Ionicons
                  name="search-outline"
                  size={21}
                  color="#64748b"
                />

                <TextInput
                  value={search}
                  onChangeText={
                    setSearch
                  }
                  placeholder="Search properties..."
                  placeholderTextColor="#94a3b8"
                  returnKeyType="search"
                  onSubmitEditing={
                    handleSearch
                  }
                  style={
                    styles.searchInput
                  }
                />

                {search ? (
                  <Pressable
                    onPress={
                      handleClearSearch
                    }
                    hitSlop={10}
                  >
                    <Ionicons
                      name="close-circle"
                      size={21}
                      color="#94a3b8"
                    />
                  </Pressable>
                ) : null}
              </View>

              <Pressable
                onPress={
                  handleSearch
                }
                style={({
                  pressed,
                }) => [
                  styles.heroSearchButton,

                  pressed &&
                    styles.pressed,
                ]}
              >
                <Ionicons
                  name="search"
                  size={18}
                  color="#ffffff"
                />

                <Text
                  style={
                    styles.heroSearchButtonText
                  }
                >
                  Search Properties
                </Text>
              </Pressable>

              {!user &&
              !initializing ? (
                <View
                  style={
                    styles.guestActions
                  }
                >
                  <Pressable
                    onPress={() =>
                      router.push(
                        '/login'
                      )
                    }
                    style={({
                      pressed,
                    }) => [
                      styles.guestLoginButton,

                      pressed &&
                        styles.pressed,
                    ]}
                  >
                    <Text
                      style={
                        styles.guestLoginText
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
                      styles.guestRegisterButton,

                      pressed &&
                        styles.pressed,
                    ]}
                  >
                    <Text
                      style={
                        styles.guestRegisterText
                      }
                    >
                      Register
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>

            {/* =====================================
                BROWSE TYPES
            ====================================== */}

            <View
              style={
                styles.sectionHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Browse by type
                </Text>

                <Text
                  style={
                    styles.sectionSubtitle
                  }
                >
                  Choose a property
                  category
                </Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.categories
              }
            >
              <CategoryButton
                title="All"
                icon="grid-outline"
                active={
                  selectedType ===
                  'all'
                }
                onPress={() =>
                  handleTypeChange(
                    'all'
                  )
                }
              />

              <CategoryButton
                title="House"
                icon="home-outline"
                active={
                  selectedType ===
                  'house'
                }
                onPress={() =>
                  handleTypeChange(
                    'house'
                  )
                }
              />

              <CategoryButton
                title="Apartment"
                icon="business-outline"
                active={
                  selectedType ===
                  'apartment'
                }
                onPress={() =>
                  handleTypeChange(
                    'apartment'
                  )
                }
              />

              <CategoryButton
                title="Land"
                icon="leaf-outline"
                active={
                  selectedType ===
                  'land'
                }
                onPress={() =>
                  handleTypeChange(
                    'land'
                  )
                }
              />

              <CategoryButton
                title="Commercial"
                icon="storefront-outline"
                active={
                  selectedType ===
                  'commercial'
                }
                onPress={() =>
                  handleTypeChange(
                    'commercial'
                  )
                }
              />
            </ScrollView>

            {/* =====================================
                QUICK ACTIONS
            ====================================== */}

            {user ? (
              <View
                style={
                  styles.quickActions
                }
              >
                <QuickAction
                  icon="add-circle-outline"
                  title="Add Property"
                  onPress={() =>
                    router.push(
                      '/my-property/create'
                    )
                  }
                />

                <QuickAction
                  icon="business-outline"
                  title="My Properties"
                  onPress={() =>
                    router.push(
                      '/my-properties'
                    )
                  }
                />

                <QuickAction
                  icon="chatbubbles-outline"
                  title="Inquiries"
                  onPress={() =>
                    router.push(
                      '/inquiries'
                    )
                  }
                />
              </View>
            ) : null}

            {/* =====================================
                PROPERTIES HEADER
            ====================================== */}

            <View
              style={
                styles.propertiesHeader
              }
            >
              <View
                style={
                  styles.propertiesHeaderText
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  {appliedSearch
                    ? 'Search Results'
                    : selectedType !==
                        'all'
                      ? `${capitalize(
                          selectedType
                        )} Properties`
                      : 'Latest Properties'}
                </Text>

                <Text
                  style={
                    styles.sectionSubtitle
                  }
                >
                  Approved and
                  currently available
                </Text>
              </View>

              <Pressable
                onPress={
                  openExplore
                }
                style={({
                  pressed,
                }) => [
                  styles.seeAllButton,

                  pressed &&
                    styles.pressed,
                ]}
              >
                <Text
                  style={
                    styles.seeAllText
                  }
                >
                  See all
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={15}
                  color="#047857"
                />
              </Pressable>
            </View>

            {/* Error */}

            {error ? (
              <View
                style={
                  styles.errorBox
                }
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color="#b91c1c"
                />

                <View
                  style={
                    styles.errorTextArea
                  }
                >
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
                </View>
              </View>
            ) : null}

            {/* Loading */}

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
                  Loading
                  properties...
                </Text>
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          !loading ? (
            <View
              style={
                styles.emptyState
              }
            >
              <View
                style={
                  styles.emptyIcon
                }
              >
                <Ionicons
                  name="home-outline"
                  size={38}
                  color="#047857"
                />
              </View>

              <Text
                style={
                  styles.emptyStateTitle
                }
              >
                No properties found
              </Text>

              <Text
                style={
                  styles.emptyStateMessage
                }
              >
                Try another search
                or property type.
              </Text>

              {(appliedSearch ||
                selectedType !==
                  'all') && (
                <Pressable
                  onPress={() => {
                    setSearch('');
                    setAppliedSearch(
                      ''
                    );
                    setSelectedType(
                      'all'
                    );
                  }}
                  style={
                    styles.clearFiltersButton
                  }
                >
                  <Text
                    style={
                      styles.clearFiltersText
                    }
                  >
                    Show all
                    properties
                  </Text>
                </Pressable>
              )}
            </View>
          ) : null
        }
        ListFooterComponent={
          !loading &&
          properties.length >
            0 ? (
            <View
              style={
                styles.footer
              }
            >
              <Pressable
                onPress={
                  openExplore
                }
                style={({
                  pressed,
                }) => [
                  styles.exploreButton,

                  pressed &&
                    styles.pressed,
                ]}
              >
                <Ionicons
                  name="compass-outline"
                  size={19}
                  color="#047857"
                />

                <Text
                  style={
                    styles.exploreButtonText
                  }
                >
                  Explore all
                  properties
                </Text>
              </Pressable>
            </View>
          ) : null
        }
      />
      <ChatbotFloatingButton />
    </SafeAreaView>
  );
}

/* =====================================================
   CATEGORY
===================================================== */

function CategoryButton({
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
        styles.categoryButton,

        active &&
          styles.categoryButtonActive,

        pressed &&
          styles.pressed,
      ]}
    >
      <View
        style={[
          styles.categoryIcon,

          active &&
            styles.categoryIconActive,
        ]}
      >
        <Ionicons
          name={icon}
          size={21}
          color={
            active
              ? '#ffffff'
              : '#047857'
          }
        />
      </View>

      <Text
        style={[
          styles.categoryText,

          active &&
            styles.categoryTextActive,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

/* =====================================================
   QUICK ACTION
===================================================== */

function QuickAction({
  icon,
  title,
  onPress,
}: {
  icon:
    keyof typeof Ionicons.glyphMap;

  title: string;

  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({
        pressed,
      }) => [
        styles.quickAction,

        pressed &&
          styles.pressed,
      ]}
    >
      <View
        style={
          styles.quickActionIcon
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
          styles.quickActionText
        }
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

function PropertyCard({
  property,
}: {
  property: Property;
}) {
  const imageUrl =
    getPropertyImageUrl(
      property.images?.[0]
    );

  const openProperty =
    () => {
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
        styles.card,

        pressed &&
          styles.cardPressed,
      ]}
    >
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
            <Ionicons
              name="image-outline"
              size={36}
              color="#047857"
            />

            <Text
              style={
                styles.placeholderText
              }
            >
              No image
            </Text>
          </View>
        )}

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
              : 'FOR RENT'}
          </Text>
        </View>
      </View>

      <View
        style={
          styles.cardContent
        }
      >
        <Text
          style={
            styles.propertyType
          }
        >
          {capitalize(
            property.propertyType
          )}
        </Text>

        <Text
          style={
            styles.propertyTitle
          }
          numberOfLines={2}
        >
          {property.title}
        </Text>

        <Text
          style={styles.price}
        >
          {formatPrice(
            property.price,
            property.currency
          )}
        </Text>

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

        <View
          style={
            styles.detailsRow
          }
        >
          {property.propertyType !==
          'land' ? (
            <>
              <PropertyDetail
                icon="bed-outline"
                text={`${
                  property.bedrooms ??
                  0
                } Beds`}
              />

              <PropertyDetail
                icon="water-outline"
                text={`${
                  property.bathrooms ??
                  0
                } Baths`}
              />
            </>
          ) : null}

          {property.area ? (
            <PropertyDetail
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
            styles.viewDetailsRow
          }
        >
          <Text
            style={
              styles.viewDetailsText
            }
          >
            View details
          </Text>

          <Ionicons
            name="arrow-forward"
            size={18}
            color="#047857"
          />
        </View>
      </View>
    </Pressable>
  );
}

/* =====================================================
   PROPERTY DETAIL
===================================================== */

function PropertyDetail({
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
        styles.detailItem
      }
    >
      <Ionicons
        name={icon}
        size={16}
        color="#64748b"
      />

      <Text
        style={
          styles.detailText
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

function getPropertyImageUrl(
  image?: PropertyImage
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
  price: number,
  currency: string
) {
  const numericPrice =
    Number(price) || 0;

  return `${
    currency || 'LKR'
  } ${numericPrice.toLocaleString()}`;
}

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

function getFirstName(
  name?: string
) {
  if (!name) {
    return 'User';
  }

  return (
    name
      .trim()
      .split(/\s+/)[0] ||
    'User'
  );
}

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
   STYLES
===================================================== */

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        '#f8fafc',
    },

    listContent: {
      paddingHorizontal: 18,
      paddingBottom: 30,
    },

    emptyListContent: {
      flexGrow: 1,
    },

    pressed: {
      opacity: 0.82,
    },

    /* ============================
       TOP BAR
    ============================= */

    topBar: {
      paddingTop: 12,
      paddingBottom: 15,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
    },

    brandArea: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    brandIcon: {
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 13,
      backgroundColor:
        '#047857',
    },

    brandName: {
      color: '#0f172a',
      fontSize: 18,
      fontWeight: '800',
    },

    brandTagline: {
      marginTop: 1,
      color: '#64748b',
      fontSize: 10,
      fontWeight: '600',
    },

    profileButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent:
        'center',
      borderWidth: 1,
      borderColor: '#d1fae5',
      borderRadius: 22,
      backgroundColor:
        '#ffffff',
    },

    profileAvatar: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 19,
      backgroundColor:
        '#047857',
    },

    profileAvatarText: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '800',
    },

    /* ============================
       HERO
    ============================= */

    hero: {
      borderRadius: 22,
      backgroundColor:
        '#064e3b',
      padding: 20,
    },

    welcomeText: {
      color: '#a7f3d0',
      fontSize: 13,
      fontWeight: '700',
    },

    heroTitle: {
      marginTop: 8,
      maxWidth: 290,
      color: '#ffffff',
      fontSize: 30,
      lineHeight: 36,
      fontWeight: '800',
    },

    heroDescription: {
      marginTop: 10,
      color: '#d1fae5',
      fontSize: 13,
      lineHeight: 20,
    },

    searchContainer: {
      minHeight: 52,
      marginTop: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      borderRadius: 14,
      backgroundColor:
        '#ffffff',
      paddingHorizontal: 13,
    },

    searchInput: {
      flex: 1,
      color: '#0f172a',
      fontSize: 14,
    },

    heroSearchButton: {
      minHeight: 48,
      marginTop: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 8,
      borderRadius: 13,
      backgroundColor:
        '#10b981',
    },

    heroSearchButtonText: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '800',
    },

    guestActions: {
      marginTop: 13,
      flexDirection: 'row',
      gap: 9,
    },

    guestLoginButton: {
      flex: 1,
      minHeight: 44,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 12,
      backgroundColor:
        '#ffffff',
    },

    guestLoginText: {
      color: '#047857',
      fontSize: 13,
      fontWeight: '800',
    },

    guestRegisterButton: {
      flex: 1,
      minHeight: 44,
      alignItems: 'center',
      justifyContent:
        'center',
      borderWidth: 1,
      borderColor: '#6ee7b7',
      borderRadius: 12,
    },

    guestRegisterText: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '800',
    },

    /* ============================
       SECTIONS
    ============================= */

    sectionHeader: {
      marginTop: 25,
      marginBottom: 12,
    },

    sectionTitle: {
      color: '#0f172a',
      fontSize: 19,
      fontWeight: '800',
    },

    sectionSubtitle: {
      marginTop: 3,
      color: '#64748b',
      fontSize: 11,
    },

    /* ============================
       CATEGORIES
    ============================= */

    categories: {
      gap: 9,
      paddingRight: 12,
    },

    categoryButton: {
      minWidth: 91,
      minHeight: 87,
      alignItems: 'center',
      justifyContent:
        'center',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 15,
      backgroundColor:
        '#ffffff',
      paddingHorizontal: 11,
    },

    categoryButtonActive: {
      borderColor: '#047857',
      backgroundColor:
        '#ecfdf5',
    },

    categoryIcon: {
      width: 37,
      height: 37,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 12,
      backgroundColor:
        '#ecfdf5',
    },

    categoryIconActive: {
      backgroundColor:
        '#047857',
    },

    categoryText: {
      marginTop: 8,
      color: '#475569',
      fontSize: 11,
      fontWeight: '700',
    },

    categoryTextActive: {
      color: '#047857',
      fontWeight: '800',
    },

    /* ============================
       QUICK ACTIONS
    ============================= */

    quickActions: {
      marginTop: 20,
      flexDirection: 'row',
      gap: 9,
    },

    quickAction: {
      flex: 1,
      minHeight: 82,
      alignItems: 'center',
      justifyContent:
        'center',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 14,
      backgroundColor:
        '#ffffff',
      paddingHorizontal: 6,
    },

    quickActionIcon: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 11,
      backgroundColor:
        '#ecfdf5',
    },

    quickActionText: {
      marginTop: 7,
      color: '#334155',
      fontSize: 10,
      fontWeight: '800',
    },

    /* ============================
       PROPERTIES HEADER
    ============================= */

    propertiesHeader: {
      marginTop: 28,
      marginBottom: 13,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
    },

    propertiesHeaderText: {
      flex: 1,
    },

    seeAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingLeft: 12,
      paddingVertical: 8,
    },

    seeAllText: {
      color: '#047857',
      fontSize: 12,
      fontWeight: '800',
    },

    /* ============================
       PROPERTY CARD
    ============================= */

    card: {
      overflow: 'hidden',
      marginBottom: 17,
      borderWidth: 1,
      borderColor: '#e2e8f0',
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
    },

    propertyImage: {
      width: '100%',
      height: 205,
      backgroundColor:
        '#e2e8f0',
    },

    imagePlaceholder: {
      height: 205,
      alignItems: 'center',
      justifyContent:
        'center',
      backgroundColor:
        '#d1fae5',
    },

    placeholderText: {
      marginTop: 7,
      color: '#047857',
      fontSize: 12,
      fontWeight: '700',
    },

    listingBadge: {
      position: 'absolute',
      left: 12,
      top: 12,
      borderRadius: 999,
      backgroundColor:
        'rgba(255,255,255,0.94)',
      paddingHorizontal: 10,
      paddingVertical: 6,
    },

    listingBadgeText: {
      color: '#047857',
      fontSize: 10,
      fontWeight: '900',
    },

    cardContent: {
      padding: 16,
    },

    propertyType: {
      color: '#047857',
      fontSize: 11,
      fontWeight: '800',
    },

    propertyTitle: {
      marginTop: 5,
      color: '#0f172a',
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '800',
    },

    price: {
      marginTop: 8,
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

    detailsRow: {
      marginTop: 14,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 14,
      borderTopWidth: 1,
      borderTopColor:
        '#f1f5f9',
      paddingTop: 13,
    },

    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },

    detailText: {
      color: '#475569',
      fontSize: 11,
      fontWeight: '600',
    },

    viewDetailsRow: {
      marginTop: 15,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      borderTopWidth: 1,
      borderTopColor:
        '#f1f5f9',
      paddingTop: 13,
    },

    viewDetailsText: {
      color: '#047857',
      fontSize: 12,
      fontWeight: '800',
    },

    /* ============================
       LOADING / ERROR / EMPTY
    ============================= */

    loadingContainer: {
      minHeight: 170,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    loadingText: {
      marginTop: 10,
      color: '#64748b',
      fontSize: 13,
    },

    errorBox: {
      marginBottom: 14,
      flexDirection: 'row',
      alignItems:
        'flex-start',
      gap: 10,
      borderWidth: 1,
      borderColor: '#fecaca',
      borderRadius: 13,
      backgroundColor:
        '#fef2f2',
      padding: 12,
    },

    errorTextArea: {
      flex: 1,
    },

    errorTitle: {
      color: '#991b1b',
      fontSize: 13,
      fontWeight: '800',
    },

    errorMessage: {
      marginTop: 3,
      color: '#b91c1c',
      fontSize: 11,
      lineHeight: 17,
    },

    emptyState: {
      minHeight: 250,
      alignItems: 'center',
      justifyContent:
        'center',
      paddingHorizontal: 25,
    },

    emptyIcon: {
      width: 76,
      height: 76,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 38,
      backgroundColor:
        '#ecfdf5',
    },

    emptyStateTitle: {
      marginTop: 15,
      color: '#0f172a',
      fontSize: 18,
      fontWeight: '800',
    },

    emptyStateMessage: {
      marginTop: 6,
      color: '#64748b',
      fontSize: 13,
      textAlign: 'center',
    },

    clearFiltersButton: {
      marginTop: 15,
      borderRadius: 11,
      backgroundColor:
        '#047857',
      paddingHorizontal: 17,
      paddingVertical: 10,
    },

    clearFiltersText: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '800',
    },

    /* ============================
       FOOTER
    ============================= */

    footer: {
      paddingTop: 4,
      paddingBottom: 12,
    },

    exploreButton: {
      minHeight: 51,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 8,
      borderWidth: 1,
      borderColor: '#047857',
      borderRadius: 14,
      backgroundColor:
        '#ffffff',
    },

    exploreButtonText: {
      color: '#047857',
      fontSize: 13,
      fontWeight: '800',
    },
  });