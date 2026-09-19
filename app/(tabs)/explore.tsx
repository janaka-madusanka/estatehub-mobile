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
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  router,
} from 'expo-router';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  getApprovedProperties,
} from '../../api/properties';

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
    | 'rent';

  propertyType?:
    | 'house'
    | 'apartment'
    | 'land'
    | 'commercial';

  address?: string;
  city?: string;
  district?: string;

  bedrooms?: number;
  bathrooms?: number;

  area?: number;
  areaUnit?: string;

  images?: PropertyImage[];

  availabilityStatus?: string;
};

type PropertyTypeFilter =
  | 'all'
  | 'house'
  | 'apartment'
  | 'land'
  | 'commercial';

type ListingTypeFilter =
  | 'all'
  | 'sale'
  | 'rent';

type CurrencyFilter =
  | 'all'
  | 'LKR'
  | 'USD';

type FilterState = {
  search: string;

  propertyType:
    PropertyTypeFilter;

  listingType:
    ListingTypeFilter;

  currency:
    CurrencyFilter;

  city: string;

  district: string;

  minPrice: string;

  maxPrice: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
};

/* =====================================================
   DEFAULT FILTERS
===================================================== */

const EMPTY_FILTERS: FilterState = {
  search: '',

  propertyType: 'all',

  listingType: 'all',

  currency: 'all',

  city: '',

  district: '',

  minPrice: '',

  maxPrice: '',
};

const PAGE_LIMIT = 10;

/* =====================================================
   SCREEN
===================================================== */

export default function ExploreScreen() {
  const [
    filters,
    setFilters,
  ] =
    useState<FilterState>(
      EMPTY_FILTERS
    );

  /*
   * filters = values currently
   * being typed by user.
   *
   * appliedFilters = filters
   * actually sent to backend.
   */
  const [
    appliedFilters,
    setAppliedFilters,
  ] =
    useState<FilterState>(
      EMPTY_FILTERS
    );

  const [
    properties,
    setProperties,
  ] =
    useState<Property[]>([]);

  const [
    pagination,
    setPagination,
  ] =
    useState<Pagination | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadingMore,
    setLoadingMore,
  ] = useState(false);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  /* ===================================================
     BUILD QUERY PARAMS
  =================================================== */

  const buildQueryParams = (
    selectedFilters:
      FilterState,
    pageNumber: number
  ) => {
    const params: Record<
      string,
      string | number
    > = {
      page: pageNumber,
      limit: PAGE_LIMIT,
    };

    const cleanSearch =
      selectedFilters.search.trim();

    const cleanCity =
      selectedFilters.city.trim();

    const cleanDistrict =
      selectedFilters.district.trim();

    if (cleanSearch) {
      params.search =
        cleanSearch;
    }

    if (
      selectedFilters.propertyType !==
      'all'
    ) {
      params.propertyType =
        selectedFilters.propertyType;
    }

    if (
      selectedFilters.listingType !==
      'all'
    ) {
      params.listingType =
        selectedFilters.listingType;
    }

    if (
      selectedFilters.currency !==
      'all'
    ) {
      params.currency =
        selectedFilters.currency;
    }

    if (cleanCity) {
      params.city =
        cleanCity;
    }

    if (cleanDistrict) {
      params.district =
        cleanDistrict;
    }

    if (
      selectedFilters.minPrice.trim()
    ) {
      params.minPrice =
        Number(
          selectedFilters.minPrice
        );
    }

    if (
      selectedFilters.maxPrice.trim()
    ) {
      params.maxPrice =
        Number(
          selectedFilters.maxPrice
        );
    }

    return params;
  };

  /* ===================================================
     LOAD PROPERTIES
  =================================================== */

  const loadProperties =
    useCallback(
      async ({
        pageNumber = 1,
        append = false,
        selectedFilters,
        showLoader = true,
      }: {
        pageNumber?: number;
        append?: boolean;
        selectedFilters:
          FilterState;
        showLoader?: boolean;
      }) => {
        if (showLoader) {
          if (append) {
            setLoadingMore(
              true
            );
          } else {
            setLoading(true);
          }
        }

        setError('');

        try {
          const queryParams =
            buildQueryParams(
              selectedFilters,
              pageNumber
            );

          const data =
            await getApprovedProperties(
              queryParams
            );

          const newProperties =
            Array.isArray(
              data?.properties
            )
              ? data.properties
              : [];

          if (append) {
            setProperties(
              (current) => {
                /*
                 * Prevent duplicate
                 * properties.
                 */
                const existingIds =
                  new Set(
                    current.map(
                      (item) =>
                        item._id
                    )
                  );

                const uniqueNew =
                  newProperties.filter(
                    (
                      property: Property
                    ) =>
                      !existingIds.has(
                        property._id
                      )
                  );

                return [
                  ...current,
                  ...uniqueNew,
                ];
              }
            );
          } else {
            setProperties(
              newProperties
            );
          }

          setPagination(
            data?.pagination ||
              null
          );
        } catch (
          requestError
        ) {
          const message =
            requestError instanceof
            Error
              ? requestError.message
              : 'Unable to load properties';

          setError(message);

          if (!append) {
            setProperties([]);
          }
        } finally {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
        }
      },
      []
    );

  /* ===================================================
     LOAD WHEN FILTERS ARE APPLIED
  =================================================== */

  useEffect(() => {
    loadProperties({
      pageNumber: 1,
      append: false,
      selectedFilters:
        appliedFilters,
    });
  }, [
    appliedFilters,
    loadProperties,
  ]);

  /* ===================================================
     FILTER VALIDATION
  =================================================== */

  const validateFilters =
    () => {
      if (
        filters.search.trim()
          .length > 150
      ) {
        return 'Search text cannot exceed 150 characters.';
      }

      if (
        filters.city.trim()
          .length > 100
      ) {
        return 'City cannot exceed 100 characters.';
      }

      if (
        filters.district.trim()
          .length > 100
      ) {
        return 'District cannot exceed 100 characters.';
      }

      if (
        filters.minPrice.trim()
      ) {
        const min =
          Number(
            filters.minPrice
          );

        if (
          Number.isNaN(min) ||
          min < 0
        ) {
          return 'Minimum price must be zero or greater.';
        }
      }

      if (
        filters.maxPrice.trim()
      ) {
        const max =
          Number(
            filters.maxPrice
          );

        if (
          Number.isNaN(max) ||
          max < 0
        ) {
          return 'Maximum price must be zero or greater.';
        }
      }

      if (
        filters.minPrice.trim() &&
        filters.maxPrice.trim()
      ) {
        const min =
          Number(
            filters.minPrice
          );

        const max =
          Number(
            filters.maxPrice
          );

        if (min > max) {
          return 'Minimum price cannot be greater than maximum price.';
        }
      }

      return null;
    };

  /* ===================================================
     APPLY SEARCH
  =================================================== */

  const handleSearch = () => {
    const validationError =
      validateFilters();

    if (
      validationError
    ) {
      setError(
        validationError
      );

      return;
    }

    setError('');

    setAppliedFilters({
      ...filters,

      search:
        filters.search.trim(),

      city:
        filters.city.trim(),

      district:
        filters.district.trim(),

      minPrice:
        filters.minPrice.trim(),

      maxPrice:
        filters.maxPrice.trim(),
    });
  };

  /* ===================================================
     CLEAR FILTERS
  =================================================== */

  const handleClearFilters =
    () => {
      const emptyFilters = {
        ...EMPTY_FILTERS,
      };

      setFilters(
        emptyFilters
      );

      setAppliedFilters(
        emptyFilters
      );

      setError('');
    };

  /* ===================================================
     REFRESH
  =================================================== */

  const handleRefresh =
    () => {
      setRefreshing(true);

      loadProperties({
        pageNumber: 1,
        append: false,
        selectedFilters:
          appliedFilters,
        showLoader: false,
      });
    };

  /* ===================================================
     LOAD MORE
  =================================================== */

  const handleLoadMore =
    () => {
      if (
        loading ||
        loadingMore ||
        !pagination
      ) {
        return;
      }

      const hasNextPage =
        pagination.hasNextPage ??
        pagination.page <
          pagination.totalPages;

      if (!hasNextPage) {
        return;
      }

      loadProperties({
        pageNumber:
          pagination.page + 1,

        append: true,

        selectedFilters:
          appliedFilters,
      });
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
        contentContainerStyle={
          styles.list
        }
        keyboardShouldPersistTaps="handled"
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
          <>
            {/* =====================================
                HEADER
            ====================================== */}

            <View
              style={
                styles.header
              }
            >
              <Text
                style={
                  styles.title
                }
              >
                Explore Properties
              </Text>

              <Text
                style={
                  styles.subtitle
                }
              >
                Search and filter
                available properties.
              </Text>
            </View>

            {/* =====================================
                SEARCH
            ====================================== */}

            <View
              style={
                styles.filterCard
              }
            >
              <Text
                style={
                  styles.filterTitle
                }
              >
                Search
              </Text>

              <TextInput
                value={
                  filters.search
                }
                onChangeText={(
                  value
                ) =>
                  setFilters(
                    (
                      current
                    ) => ({
                      ...current,
                      search:
                        value,
                    })
                  )
                }
                placeholder="Search property, city or district..."
                placeholderTextColor="#94a3b8"
                maxLength={150}
                returnKeyType="search"
                onSubmitEditing={
                  handleSearch
                }
                style={
                  styles.input
                }
              />

              {/* Property Type */}

              <FilterLabel>
                Property Type
              </FilterLabel>

              <View
                style={
                  styles.choiceGrid
                }
              >
                <ChoiceButton
                  title="All"
                  active={
                    filters.propertyType ===
                    'all'
                  }
                  onPress={() =>
                    setFilters(
                      (
                        current
                      ) => ({
                        ...current,
                        propertyType:
                          'all',
                      })
                    )
                  }
                />

                <ChoiceButton
                  title="House"
                  active={
                    filters.propertyType ===
                    'house'
                  }
                  onPress={() =>
                    setFilters(
                      (
                        current
                      ) => ({
                        ...current,
                        propertyType:
                          'house',
                      })
                    )
                  }
                />

                <ChoiceButton
                  title="Apartment"
                  active={
                    filters.propertyType ===
                    'apartment'
                  }
                  onPress={() =>
                    setFilters(
                      (
                        current
                      ) => ({
                        ...current,
                        propertyType:
                          'apartment',
                      })
                    )
                  }
                />

                <ChoiceButton
                  title="Land"
                  active={
                    filters.propertyType ===
                    'land'
                  }
                  onPress={() =>
                    setFilters(
                      (
                        current
                      ) => ({
                        ...current,
                        propertyType:
                          'land',
                      })
                    )
                  }
                />

                <ChoiceButton
                  title="Commercial"
                  active={
                    filters.propertyType ===
                    'commercial'
                  }
                  onPress={() =>
                    setFilters(
                      (
                        current
                      ) => ({
                        ...current,
                        propertyType:
                          'commercial',
                      })
                    )
                  }
                />
              </View>

              {/* Listing Type */}

              <FilterLabel>
                Listing Type
              </FilterLabel>

              <View
                style={
                  styles.choiceGrid
                }
              >
                <ChoiceButton
                  title="All"
                  active={
                    filters.listingType ===
                    'all'
                  }
                  onPress={() =>
                    setFilters(
                      (
                        current
                      ) => ({
                        ...current,
                        listingType:
                          'all',
                      })
                    )
                  }
                />

                <ChoiceButton
                  title="For Sale"
                  active={
                    filters.listingType ===
                    'sale'
                  }
                  onPress={() =>
                    setFilters(
                      (
                        current
                      ) => ({
                        ...current,
                        listingType:
                          'sale',
                      })
                    )
                  }
                />

                <ChoiceButton
                  title="For Rent"
                  active={
                    filters.listingType ===
                    'rent'
                  }
                  onPress={() =>
                    setFilters(
                      (
                        current
                      ) => ({
                        ...current,
                        listingType:
                          'rent',
                      })
                    )
                  }
                />
              </View>

              {/* Currency */}

              <FilterLabel>
                Currency
              </FilterLabel>

              <View
                style={
                  styles.choiceGrid
                }
              >
                <ChoiceButton
                  title="All"
                  active={
                    filters.currency ===
                    'all'
                  }
                  onPress={() =>
                    setFilters(
                      (
                        current
                      ) => ({
                        ...current,
                        currency:
                          'all',
                      })
                    )
                  }
                />

                <ChoiceButton
                  title="LKR"
                  active={
                    filters.currency ===
                    'LKR'
                  }
                  onPress={() =>
                    setFilters(
                      (
                        current
                      ) => ({
                        ...current,
                        currency:
                          'LKR',
                      })
                    )
                  }
                />

                <ChoiceButton
                  title="USD"
                  active={
                    filters.currency ===
                    'USD'
                  }
                  onPress={() =>
                    setFilters(
                      (
                        current
                      ) => ({
                        ...current,
                        currency:
                          'USD',
                      })
                    )
                  }
                />
              </View>

              {/* Location */}

              <FilterLabel>
                Location
              </FilterLabel>

              <TextInput
                value={
                  filters.city
                }
                onChangeText={(
                  value
                ) =>
                  setFilters(
                    (
                      current
                    ) => ({
                      ...current,
                      city:
                        value,
                    })
                  )
                }
                placeholder="City"
                placeholderTextColor="#94a3b8"
                maxLength={100}
                style={[
                  styles.input,
                  styles.locationInput,
                ]}
              />

              <TextInput
                value={
                  filters.district
                }
                onChangeText={(
                  value
                ) =>
                  setFilters(
                    (
                      current
                    ) => ({
                      ...current,
                      district:
                        value,
                    })
                  )
                }
                placeholder="District"
                placeholderTextColor="#94a3b8"
                maxLength={100}
                style={
                  styles.input
                }
              />

              {/* Price */}

              <FilterLabel>
                Price Range
              </FilterLabel>

              <View
                style={
                  styles.priceRow
                }
              >
                <TextInput
                  value={
                    filters.minPrice
                  }
                  onChangeText={(
                    value
                  ) =>
                    setFilters(
                      (
                        current
                      ) => ({
                        ...current,
                        minPrice:
                          value.replace(
                            /[^0-9.]/g,
                            ''
                          ),
                      })
                    )
                  }
                  placeholder="Min"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  style={[
                    styles.input,
                    styles.priceInput,
                  ]}
                />

                <TextInput
                  value={
                    filters.maxPrice
                  }
                  onChangeText={(
                    value
                  ) =>
                    setFilters(
                      (
                        current
                      ) => ({
                        ...current,
                        maxPrice:
                          value.replace(
                            /[^0-9.]/g,
                            ''
                          ),
                      })
                    )
                  }
                  placeholder="Max"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  style={[
                    styles.input,
                    styles.priceInput,
                  ]}
                />
              </View>

              {/* Buttons */}

              <View
                style={
                  styles.actionRow
                }
              >
                <Pressable
                  onPress={
                    handleClearFilters
                  }
                  style={({
                    pressed,
                  }) => [
                    styles.clearButton,

                    pressed &&
                      styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={
                      styles.clearButtonText
                    }
                  >
                    Clear
                  </Text>
                </Pressable>

                <Pressable
                  onPress={
                    handleSearch
                  }
                  style={({
                    pressed,
                  }) => [
                    styles.searchButton,

                    pressed &&
                      styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={
                      styles.searchButtonText
                    }
                  >
                    Search Properties
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Error */}

            {error ? (
              <View
                style={
                  styles.errorBox
                }
              >
                <Text
                  style={
                    styles.errorText
                  }
                >
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Results Header */}

            {!loading ? (
              <View
                style={
                  styles.resultsHeader
                }
              >
                <Text
                  style={
                    styles.resultsTitle
                  }
                >
                  Properties
                </Text>

                <Text
                  style={
                    styles.resultsCount
                  }
                >
                  {pagination?.total ??
                    properties.length}{' '}
                  found
                </Text>
              </View>
            ) : null}

            {loading ? (
              <View
                style={
                  styles.initialLoading
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
                  Finding
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
                styles.emptyContainer
              }
            >
              <Text
                style={
                  styles.emptyTitle
                }
              >
                No properties found
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                Try changing or
                clearing your
                search filters.
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          !loading &&
          properties.length >
            0 ? (
            <LoadMoreSection
              pagination={
                pagination
              }
              loadingMore={
                loadingMore
              }
              onLoadMore={
                handleLoadMore
              }
            />
          ) : null
        }
      />
    </SafeAreaView>
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
    getFirstImage(
      property.images
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
          <Text
            style={
              styles.placeholderBrand
            }
          >
            EstateHub
          </Text>

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
          styles.cardContent
        }
      >
        {/* badges */}

        <View
          style={
            styles.badgeRow
          }
        >
          {property.propertyType ? (
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
                {
                  property.propertyType
                }
              </Text>
            </View>
          ) : null}

          {property.listingType ? (
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
                  ? 'For Sale'
                  : 'For Rent'}
              </Text>
            </View>
          ) : null}
        </View>

        {/* title */}

        <Text
          style={
            styles.propertyTitle
          }
          numberOfLines={2}
        >
          {property.title}
        </Text>

        {/* price */}

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

        {/* location */}

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

        {/* property info */}

        <View
          style={
            styles.propertyInfoRow
          }
        >
          {property.bedrooms !==
          undefined ? (
            <Text
              style={
                styles.propertyInfo
              }
            >
              {property.bedrooms}{' '}
              Beds
            </Text>
          ) : null}

          {property.bathrooms !==
          undefined ? (
            <Text
              style={
                styles.propertyInfo
              }
            >
              {property.bathrooms}{' '}
              Baths
            </Text>
          ) : null}

          {property.area ? (
            <Text
              style={
                styles.propertyInfo
              }
            >
              {property.area}{' '}
              {property.areaUnit}
            </Text>
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
            View Details
          </Text>

          <Text
            style={
              styles.viewDetailsArrow
            }
          >
            →
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

/* =====================================================
   FILTER LABEL
===================================================== */

function FilterLabel({
  children,
}: {
  children: string;
}) {
  return (
    <Text
      style={
        styles.filterLabel
      }
    >
      {children}
    </Text>
  );
}

/* =====================================================
   CHOICE BUTTON
===================================================== */

function ChoiceButton({
  title,
  active,
  onPress,
}: {
  title: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({
        pressed,
      }) => [
        styles.choiceButton,

        active &&
          styles.choiceButtonActive,

        pressed &&
          !active &&
          styles.buttonPressed,
      ]}
    >
      <Text
        style={[
          styles.choiceButtonText,

          active &&
            styles.choiceButtonTextActive,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

/* =====================================================
   LOAD MORE
===================================================== */

function LoadMoreSection({
  pagination,
  loadingMore,
  onLoadMore,
}: {
  pagination:
    Pagination | null;

  loadingMore: boolean;

  onLoadMore: () => void;
}) {
  if (!pagination) {
    return null;
  }

  const hasNextPage =
    pagination.hasNextPage ??
    pagination.page <
      pagination.totalPages;

  if (!hasNextPage) {
    return (
      <View
        style={
          styles.endContainer
        }
      >
        <Text style={styles.endText}>
  {"You've reached the end."}
</Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={
        onLoadMore
      }
      disabled={
        loadingMore
      }
      style={({
        pressed,
      }) => [
        styles.loadMoreButton,

        pressed &&
          !loadingMore &&
          styles.buttonPressed,
      ]}
    >
      {loadingMore ? (
        <>
          <ActivityIndicator
            size="small"
            color="#ffffff"
          />

          <Text
            style={
              styles.loadMoreText
            }
          >
            Loading...
          </Text>
        </>
      ) : (
        <Text
          style={
            styles.loadMoreText
          }
        >
          Load More
        </Text>
      )}
    </Pressable>
  );
}

/* =====================================================
   HELPERS
===================================================== */

function getFirstImage(
  images?: PropertyImage[]
) {
  if (
    !Array.isArray(images) ||
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

  return first?.url || null;
}

function formatPrice(
  price: number,
  currency: string
) {
  const value =
    Number(price) || 0;

  return `${
    currency || 'LKR'
  } ${value.toLocaleString()}`;
}

function formatLocation(
  property: Property
) {
  const values = [
    property.city,
    property.district,
  ].filter(Boolean);

  return values.length >
    0
    ? values.join(', ')
    : 'Location not provided';
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

    list: {
      paddingHorizontal:
        18,
      paddingBottom: 35,
    },

    header: {
      paddingTop: 20,
      paddingBottom: 18,
    },

    title: {
      color: '#0f172a',
      fontSize: 29,
      fontWeight: '800',
    },

    subtitle: {
      marginTop: 5,
      color: '#64748b',
      fontSize: 14,
    },

    filterCard: {
      borderWidth: 1,
      borderColor:
        '#e2e8f0',
      borderRadius: 17,
      backgroundColor:
        '#ffffff',
      padding: 16,
    },

    filterTitle: {
      marginBottom: 11,
      color: '#0f172a',
      fontSize: 18,
      fontWeight: '800',
    },

    filterLabel: {
      marginTop: 18,
      marginBottom: 8,
      color: '#334155',
      fontSize: 13,
      fontWeight: '800',
    },

    input: {
      minHeight: 48,
      borderWidth: 1,
      borderColor:
        '#cbd5e1',
      borderRadius: 12,
      backgroundColor:
        '#f8fafc',
      paddingHorizontal:
        13,
      color: '#0f172a',
      fontSize: 13,
    },

    locationInput: {
      marginBottom: 9,
    },

    choiceGrid: {
      flexDirection:
        'row',
      flexWrap: 'wrap',
      gap: 7,
    },

    choiceButton: {
      minHeight: 39,
      alignItems:
        'center',
      justifyContent:
        'center',
      borderWidth: 1,
      borderColor:
        '#cbd5e1',
      borderRadius: 10,
      backgroundColor:
        '#ffffff',
      paddingHorizontal:
        13,
    },

    choiceButtonActive: {
      borderColor:
        '#047857',
      backgroundColor:
        '#047857',
    },

    choiceButtonText: {
      color: '#475569',
      fontSize: 12,
      fontWeight: '700',
    },

    choiceButtonTextActive: {
      color: '#ffffff',
    },

    priceRow: {
      flexDirection:
        'row',
      gap: 9,
    },

    priceInput: {
      flex: 1,
    },

    actionRow: {
      marginTop: 20,
      flexDirection:
        'row',
      gap: 9,
    },

    clearButton: {
      minHeight: 49,
      alignItems:
        'center',
      justifyContent:
        'center',
      borderWidth: 1,
      borderColor:
        '#cbd5e1',
      borderRadius: 12,
      paddingHorizontal:
        18,
    },

    clearButtonText: {
      color: '#475569',
      fontSize: 13,
      fontWeight: '800',
    },

    searchButton: {
      flex: 1,
      minHeight: 49,
      alignItems:
        'center',
      justifyContent:
        'center',
      borderRadius: 12,
      backgroundColor:
        '#047857',
      paddingHorizontal:
        15,
    },

    searchButtonText: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '800',
    },

    buttonPressed: {
      opacity: 0.82,
    },

    errorBox: {
      marginTop: 14,
      borderWidth: 1,
      borderColor:
        '#fecaca',
      borderRadius: 12,
      backgroundColor:
        '#fef2f2',
      padding: 12,
    },

    errorText: {
      color: '#b91c1c',
      fontSize: 13,
      lineHeight: 19,
    },

    resultsHeader: {
      marginTop: 25,
      marginBottom: 13,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
    },

    resultsTitle: {
      color: '#0f172a',
      fontSize: 20,
      fontWeight: '800',
    },

    resultsCount: {
      color: '#64748b',
      fontSize: 12,
      fontWeight: '600',
    },

    initialLoading: {
      minHeight: 180,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    loadingText: {
      marginTop: 11,
      color: '#64748b',
      fontSize: 13,
    },

    card: {
      overflow: 'hidden',
      marginBottom: 16,
      borderWidth: 1,
      borderColor:
        '#e2e8f0',
      borderRadius: 17,
      backgroundColor:
        '#ffffff',
      elevation: 2,
    },

    cardPressed: {
      opacity: 0.88,
    },

    propertyImage: {
      width: '100%',
      height: 205,
      backgroundColor:
        '#e2e8f0',
    },

    imagePlaceholder: {
      height: 180,
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        '#d1fae5',
    },

    placeholderBrand: {
      color: '#047857',
      fontSize: 20,
      fontWeight: '800',
    },

    placeholderText: {
      marginTop: 4,
      color: '#64748b',
      fontSize: 12,
    },

    cardContent: {
      padding: 15,
    },

    badgeRow: {
      flexDirection:
        'row',
      flexWrap: 'wrap',
      gap: 7,
    },

    typeBadge: {
      borderRadius: 999,
      backgroundColor:
        '#ecfdf5',
      paddingHorizontal:
        9,
      paddingVertical: 5,
    },

    typeBadgeText: {
      color: '#047857',
      fontSize: 10,
      fontWeight: '800',
      textTransform:
        'capitalize',
    },

    listingBadge: {
      borderRadius: 999,
      backgroundColor:
        '#eff6ff',
      paddingHorizontal:
        9,
      paddingVertical: 5,
    },

    listingBadgeText: {
      color: '#1d4ed8',
      fontSize: 10,
      fontWeight: '800',
    },

    propertyTitle: {
      marginTop: 12,
      color: '#0f172a',
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '800',
    },

    propertyPrice: {
      marginTop: 8,
      color: '#047857',
      fontSize: 19,
      fontWeight: '800',
    },

    propertyLocation: {
      marginTop: 6,
      color: '#64748b',
      fontSize: 13,
    },

    propertyInfoRow: {
      marginTop: 12,
      flexDirection:
        'row',
      flexWrap: 'wrap',
      gap: 13,
    },

    propertyInfo: {
      color: '#475569',
      fontSize: 12,
      fontWeight: '600',
    },

    viewDetailsRow: {
      marginTop: 15,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
      borderTopWidth: 1,
      borderTopColor:
        '#f1f5f9',
      paddingTop: 13,
    },

    viewDetailsText: {
      color: '#047857',
      fontSize: 13,
      fontWeight: '800',
    },

    viewDetailsArrow: {
      color: '#047857',
      fontSize: 19,
      fontWeight: '700',
    },

    emptyContainer: {
      minHeight: 220,
      alignItems:
        'center',
      justifyContent:
        'center',
      paddingHorizontal:
        25,
    },

    emptyTitle: {
      color: '#0f172a',
      fontSize: 18,
      fontWeight: '800',
    },

    emptyText: {
      marginTop: 7,
      color: '#64748b',
      fontSize: 13,
      lineHeight: 20,
      textAlign:
        'center',
    },

    loadMoreButton: {
      minHeight: 50,
      marginTop: 5,
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
    },

    loadMoreText: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '800',
    },

    endContainer: {
      alignItems:
        'center',
      paddingVertical: 18,
    },

    endText: {
      color: '#94a3b8',
      fontSize: 12,
    },
  });