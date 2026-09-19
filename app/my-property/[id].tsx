import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
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
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  deleteMyProperty,
  getMyPropertyById,
  updateMyPropertyAvailability,
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

  listingType?: string;
  propertyType?: string;

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

type AvailabilityStatus =
  | 'available'
  | 'sold'
  | 'rented'
  | 'unavailable';

/* =====================================================
   SCREEN
===================================================== */

export default function MyPropertyDetailsScreen() {
  const params =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const propertyId =
    Array.isArray(params.id)
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
    updatingAvailability,
    setUpdatingAvailability,
  ] = useState(false);

  const [
    deleting,
    setDeleting,
  ] = useState(false);

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
            await getMyPropertyById(
              propertyId
            );

          if (!data?._id) {
            throw new Error(
              'Property was not found.'
            );
          }

          setProperty(data);
        } catch (
          requestError
        ) {
          const message =
            requestError instanceof
            Error
              ? requestError.message
              : 'Unable to load property';

          setError(message);
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
     CHANGE AVAILABILITY
  =================================================== */

  const handleAvailabilityChange =
    async (
      newStatus:
        AvailabilityStatus
    ) => {
      if (
        !propertyId ||
        !property
      ) {
        return;
      }

      if (
        property.status !==
        'approved'
      ) {
        Alert.alert(
          'Not Available',
          'Availability can only be changed for an approved property.'
        );

        return;
      }

      if (
        property.availabilityStatus ===
        newStatus
      ) {
        return;
      }

      try {
        setUpdatingAvailability(
          true
        );

        setError('');

        const updatedProperty =
          await updateMyPropertyAvailability(
            propertyId,
            newStatus
          );

        setProperty(
          updatedProperty
        );
      } catch (
        requestError
      ) {
        const message =
          requestError instanceof
          Error
            ? requestError.message
            : 'Unable to update property availability';

        setError(message);

        Alert.alert(
          'Update Failed',
          message
        );
      } finally {
        setUpdatingAvailability(
          false
        );
      }
    };

  /* ===================================================
     DELETE PROPERTY
  =================================================== */

  const handleDelete =
    () => {
      if (
        !propertyId ||
        !property
      ) {
        return;
      }

      Alert.alert(
        'Delete Property',
        `Are you sure you want to delete "${property.title}"? This action cannot be undone.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },

          {
            text: 'Delete',
            style:
              'destructive',

            onPress:
              async () => {
                try {
                  setDeleting(
                    true
                  );

                  await deleteMyProperty(
                    propertyId
                  );

                  router.replace(
                    '/my-properties'
                  );
                } catch (
                  requestError
                ) {
                  const message =
                    requestError instanceof
                    Error
                      ? requestError.message
                      : 'Unable to delete property';

                  setError(
                    message
                  );

                  Alert.alert(
                    'Delete Failed',
                    message
                  );
                } finally {
                  setDeleting(
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
          Loading property...
        </Text>
      </SafeAreaView>
    );
  }

  /* ===================================================
     ERROR
  =================================================== */

  if (
    error &&
    !property
  ) {
    return (
      <SafeAreaView
        style={
          styles.centered
        }
      >
        <Text
          style={
            styles.errorTitle
          }
        >
          Unable to load
          property
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
            router.back()
          }
          style={
            styles.primaryButton
          }
        >
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

  if (!property) {
    return null;
  }

  const imageUrl =
    getFirstImage(
      property.images
    );

  /* ===================================================
     UI
  =================================================== */

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top']}
    >
      {/* Header */}

      <View
        style={styles.topBar}
      >
        <Pressable
          onPress={() =>
            router.back()
          }
          style={
            styles.backButton
          }
        >
          <Text
            style={
              styles.backButtonText
            }
          >
            ←
          </Text>
        </Pressable>

        <Text
          style={
            styles.topBarTitle
          }
          numberOfLines={1}
        >
          Manage Property
        </Text>

        <View
          style={
            styles.topBarSpacer
          }
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.scrollContent
        }
      >
        {/* Image */}

        {imageUrl ? (
          <Image
            source={{
              uri: imageUrl,
            }}
            style={
              styles.heroImage
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

        <View
          style={
            styles.content
          }
        >
          {/* Status Badges */}

          <View
            style={
              styles.statusRow
            }
          >
            <ModerationBadge
              status={
                property.status
              }
            />

            {property.status ===
            'approved' ? (
              <AvailabilityBadge
                status={
                  property.availabilityStatus ||
                  'available'
                }
              />
            ) : null}
          </View>

          {/* Title */}

          <Text
            style={styles.title}
          >
            {property.title}
          </Text>

          {/* Price */}

          <Text
            style={styles.price}
          >
            {formatPrice(
              property.price,
              property.currency
            )}
          </Text>

          {/* Location */}

          <Text
            style={
              styles.location
            }
          >
            {formatLocation(
              property
            )}
          </Text>

          {/* Moderation */}

          <SectionTitle>
            Moderation
          </SectionTitle>

          <View
            style={
              styles.sectionCard
            }
          >
            <InfoRow
              label="Status"
              value={
                property.status
              }
            />

            <InfoRow
              label="Availability"
              value={
                property.availabilityStatus ||
                '-'
              }
            />
          </View>

          {/* Rejection */}

          {property.status ===
            'rejected' ? (
            <>
              <SectionTitle>
                Rejection Reason
              </SectionTitle>

              <View
                style={
                  styles.rejectionBox
                }
              >
                <Text
                  style={
                    styles.rejectionText
                  }
                >
                  {property.rejectionReason ||
                    'No rejection reason was provided.'}
                </Text>
              </View>
            </>
          ) : null}

          {/* Property Information */}

          <SectionTitle>
            Property Information
          </SectionTitle>

          <View
            style={
              styles.sectionCard
            }
          >
            <InfoRow
              label="Listing"
              value={
                property.listingType ||
                '-'
              }
            />

            <InfoRow
              label="Type"
              value={
                property.propertyType ||
                '-'
              }
            />

            <InfoRow
              label="Bedrooms"
              value={String(
                property.bedrooms ??
                  '-'
              )}
            />

            <InfoRow
              label="Bathrooms"
              value={String(
                property.bathrooms ??
                  '-'
              )}
            />

            <InfoRow
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
          </View>

          {/* Description */}

          <SectionTitle>
            Description
          </SectionTitle>

          <Text
            style={
              styles.description
            }
          >
            {property.description ||
              'No description provided.'}
          </Text>

          {/* Location */}

          <SectionTitle>
            Location
          </SectionTitle>
<SectionTitle>
  Edit Property
</SectionTitle>

<Text
  style={
    styles.editHelpText
  }
>
  Update the listing information.
  Changes will require admin
  review again.
</Text>

<Pressable
  onPress={() =>
    router.push({
      pathname:
        '/my-property/edit/[id]',

      params: {
        id: property._id,
      },
    })
  }
  style={({ pressed }) => [
    styles.editButton,

    pressed &&
      styles.buttonPressed,
  ]}
>
  <Text
    style={
      styles.editButtonText
    }
  >
    Edit Property
  </Text>
</Pressable>
          <View
            style={
              styles.sectionCard
            }
          >
            <InfoRow
              label="Address"
              value={
                property.address ||
                '-'
              }
            />

            <InfoRow
              label="City"
              value={
                property.city ||
                '-'
              }
            />

            <InfoRow
              label="District"
              value={
                property.district ||
                '-'
              }
            />
          </View>

          {/* Amenities */}

          <SectionTitle>
            Amenities
          </SectionTitle>

          {property.amenities &&
          property.amenities.length >
            0 ? (
            <View
              style={
                styles.amenities
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
            <Text
              style={
                styles.emptyText
              }
            >
              No amenities listed.
            </Text>
          )}

          {/* ==========================================
              AVAILABILITY MANAGEMENT
          ========================================== */}

          {property.status ===
          'approved' ? (
            <>
              <SectionTitle>
                Change Availability
              </SectionTitle>

              <Text
                style={
                  styles.helpText
                }
              >
                Change whether
                this property is
                currently available
                to buyers or renters.
              </Text>

              {updatingAvailability ? (
                <View
                  style={
                    styles.updatingBox
                  }
                >
                  <ActivityIndicator
                    size="small"
                    color="#047857"
                  />

                  <Text
                    style={
                      styles.updatingText
                    }
                  >
                    Updating...
                  </Text>
                </View>
              ) : (
                <View
  style={
    styles.availabilityOptions
  }
>
  <AvailabilityButton
    title="Available"
    value="available"
    current={
      property.availabilityStatus ||
      'available'
    }
    onPress={
      handleAvailabilityChange
    }
  />

  {property.listingType ===
  'sale' ? (
    <AvailabilityButton
      title="Sold"
      value="sold"
      current={
        property.availabilityStatus ||
        'available'
      }
      onPress={
        handleAvailabilityChange
      }
    />
  ) : null}

  {property.listingType ===
  'rent' ? (
    <AvailabilityButton
      title="Rented"
      value="rented"
      current={
        property.availabilityStatus ||
        'available'
      }
      onPress={
        handleAvailabilityChange
      }
    />
  ) : null}

  <AvailabilityButton
    title="Unavailable"
    value="unavailable"
    current={
      property.availabilityStatus ||
      'available'
    }
    onPress={
      handleAvailabilityChange
    }
  />
</View>
              )}
            </>
          ) : (
            <>
              <SectionTitle>
                Availability
              </SectionTitle>

              <View
                style={
                  styles.noticeBox
                }
              >
                <Text
                  style={
                    styles.noticeText
                  }
                >
                  Availability can
                  be changed after
                  the property has
                  been approved.
                </Text>
              </View>
            </>
          )}

          {/* Error */}

          {error ? (
            <View
              style={
                styles.inlineError
              }
            >
              <Text
                style={
                  styles.inlineErrorText
                }
              >
                {error}
              </Text>
            </View>
          ) : null}

          {/* ==========================================
              DELETE
          ========================================== */}

          <SectionTitle>
            Delete Property
          </SectionTitle>

          <Text
            style={
              styles.deleteHelpText
            }
          >
            Deleting this property
            permanently removes it
            from your listings.
          </Text>

          <Pressable
            onPress={
              handleDelete
            }
            disabled={deleting}
            style={({ pressed }) => [
              styles.deleteButton,

              pressed &&
                !deleting &&
                styles.buttonPressed,

              deleting &&
                styles.disabledButton,
            ]}
          >
            {deleting ? (
              <ActivityIndicator
                size="small"
                color="#ffffff"
              />
            ) : (
              <Text
                style={
                  styles.deleteButtonText
                }
              >
                Delete Property
              </Text>
            )}
          </Pressable>

          <View
            style={
              styles.bottomSpacing
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* =====================================================
   SECTION TITLE
===================================================== */

function SectionTitle({
  children,
}: {
  children: React.ReactNode;
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
   INFO ROW
===================================================== */

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={styles.infoRow}
    >
      <Text
        style={
          styles.infoLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.infoValue
        }
      >
        {value}
      </Text>
    </View>
  );
}

/* =====================================================
   MODERATION BADGE
===================================================== */

function ModerationBadge({
  status,
}: {
  status: Property['status'];
}) {
  return (
    <View
      style={[
        styles.badge,

        status ===
          'approved' &&
          styles.approvedBadge,

        status ===
          'pending' &&
          styles.pendingBadge,

        status ===
          'rejected' &&
          styles.rejectedBadge,
      ]}
    >
      <Text
        style={[
          styles.badgeText,

          status ===
            'approved' &&
            styles.approvedText,

          status ===
            'pending' &&
            styles.pendingText,

          status ===
            'rejected' &&
            styles.rejectedText,
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

/* =====================================================
   AVAILABILITY BADGE
===================================================== */

function AvailabilityBadge({
  status,
}: {
  status: string;
}) {
  return (
    <View
      style={
        styles.availabilityBadge
      }
    >
      <Text
        style={
          styles.availabilityBadgeText
        }
      >
        {status}
      </Text>
    </View>
  );
}

/* =====================================================
   AVAILABILITY BUTTON
===================================================== */

function AvailabilityButton({
  title,
  value,
  current,
  onPress,
}: {
  title: string;
  value: AvailabilityStatus;
  current: AvailabilityStatus;
  onPress: (
    status: AvailabilityStatus
  ) => void;
}) {
  const active =
    value === current;

  return (
    <Pressable
      onPress={() =>
        onPress(value)
      }
      style={({ pressed }) => [
        styles.availabilityButton,

        active &&
          styles.availabilityButtonActive,

        pressed &&
          !active &&
          styles.buttonPressed,
      ]}
    >
      <Text
        style={[
          styles.availabilityButtonText,

          active &&
            styles.availabilityButtonTextActive,
        ]}
      >
        {title}
      </Text>
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
  return `${
    currency || 'LKR'
  } ${(
    Number(price) || 0
  ).toLocaleString()}`;
}

function formatLocation(
  property: Property
) {
  const parts = [
    property.address,
    property.city,
    property.district,
  ].filter(Boolean);

  return parts.length
    ? parts.join(', ')
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

    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
      paddingHorizontal: 24,
      backgroundColor:
        '#f8fafc',
    },

    loadingText: {
      marginTop: 12,
      color: '#64748b',
      fontSize: 14,
    },

    errorTitle: {
      color: '#991b1b',
      fontSize: 20,
      fontWeight: '800',
      textAlign: 'center',
    },

    errorMessage: {
      marginTop: 8,
      color: '#64748b',
      fontSize: 14,
      textAlign: 'center',
    },

    primaryButton: {
      marginTop: 20,
      borderRadius: 12,
      backgroundColor:
        '#047857',
      paddingHorizontal: 22,
      paddingVertical: 12,
    },

    primaryButtonText: {
      color: '#ffffff',
      fontWeight: '800',
    },

    topBar: {
      height: 60,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor:
        '#e2e8f0',
      backgroundColor:
        '#ffffff',
      paddingHorizontal: 16,
    },

    backButton: {
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 12,
      backgroundColor:
        '#f1f5f9',
    },

    backButtonText: {
      color: '#0f172a',
      fontSize: 25,
      fontWeight: '700',
    },

    topBarTitle: {
      flex: 1,
      color: '#0f172a',
      fontSize: 17,
      fontWeight: '800',
      textAlign: 'center',
    },

    topBarSpacer: {
      width: 42,
    },

    scrollContent: {
      paddingBottom: 20,
    },

    heroImage: {
      width: '100%',
      height: 260,
      backgroundColor:
        '#e2e8f0',
    },

    imagePlaceholder: {
      height: 230,
      alignItems: 'center',
      justifyContent:
        'center',
      backgroundColor:
        '#d1fae5',
    },

    placeholderTitle: {
      color: '#047857',
      fontSize: 23,
      fontWeight: '800',
    },

    placeholderText: {
      marginTop: 5,
      color: '#64748b',
      fontSize: 13,
    },

    content: {
      paddingHorizontal: 20,
      paddingTop: 20,
    },

    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    badge: {
      borderRadius: 999,
      paddingHorizontal: 11,
      paddingVertical: 6,
    },

    badgeText: {
      fontSize: 11,
      fontWeight: '800',
      textTransform:
        'uppercase',
    },

    approvedBadge: {
      backgroundColor:
        '#dcfce7',
    },

    approvedText: {
      color: '#166534',
    },

    pendingBadge: {
      backgroundColor:
        '#fef3c7',
    },

    pendingText: {
      color: '#92400e',
    },

    rejectedBadge: {
      backgroundColor:
        '#fee2e2',
    },

    rejectedText: {
      color: '#991b1b',
    },

    availabilityBadge: {
      borderRadius: 999,
      backgroundColor:
        '#e0f2fe',
      paddingHorizontal: 11,
      paddingVertical: 6,
    },

    availabilityBadgeText: {
      color: '#0369a1',
      fontSize: 11,
      fontWeight: '800',
      textTransform:
        'uppercase',
    },

    title: {
      marginTop: 15,
      color: '#0f172a',
      fontSize: 26,
      lineHeight: 34,
      fontWeight: '800',
    },

    price: {
      marginTop: 9,
      color: '#047857',
      fontSize: 23,
      fontWeight: '800',
    },

    location: {
      marginTop: 7,
      color: '#64748b',
      fontSize: 14,
      lineHeight: 21,
    },

    sectionTitle: {
      marginTop: 28,
      marginBottom: 11,
      color: '#0f172a',
      fontSize: 18,
      fontWeight: '800',
    },

    sectionCard: {
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 15,
      backgroundColor:
        '#ffffff',
      paddingHorizontal: 15,
    },

    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      gap: 20,
      borderBottomWidth: 1,
      borderBottomColor:
        '#f1f5f9',
      paddingVertical: 14,
    },

    infoLabel: {
      color: '#64748b',
      fontSize: 13,
      fontWeight: '600',
    },

    infoValue: {
      flex: 1,
      color: '#0f172a',
      fontSize: 13,
      fontWeight: '700',
      textAlign: 'right',
      textTransform:
        'capitalize',
    },

    description: {
      color: '#475569',
      fontSize: 14,
      lineHeight: 23,
    },

    rejectionBox: {
      borderWidth: 1,
      borderColor: '#fecaca',
      borderRadius: 13,
      backgroundColor:
        '#fef2f2',
      padding: 14,
    },

    rejectionText: {
      color: '#b91c1c',
      fontSize: 13,
      lineHeight: 20,
    },

    amenities: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },

    amenityChip: {
      borderRadius: 999,
      backgroundColor:
        '#ecfdf5',
      paddingHorizontal: 13,
      paddingVertical: 8,
    },

    amenityText: {
      color: '#065f46',
      fontSize: 12,
      fontWeight: '700',
    },

    emptyText: {
      color: '#64748b',
      fontSize: 13,
    },

    helpText: {
      marginBottom: 13,
      color: '#64748b',
      fontSize: 13,
      lineHeight: 20,
    },

    availabilityOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 9,
    },

    availabilityButton: {
      width: '48%',
      minHeight: 47,
      alignItems: 'center',
      justifyContent:
        'center',
      borderWidth: 1,
      borderColor: '#cbd5e1',
      borderRadius: 12,
      backgroundColor:
        '#ffffff',
      paddingHorizontal: 8,
    },

    availabilityButtonActive: {
      borderColor: '#047857',
      backgroundColor:
        '#047857',
    },

    availabilityButtonText: {
      color: '#475569',
      fontSize: 12,
      fontWeight: '800',
    },

    availabilityButtonTextActive: {
      color: '#ffffff',
    },

    updatingBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 9,
      borderRadius: 12,
      backgroundColor:
        '#ecfdf5',
      padding: 15,
    },

    updatingText: {
      color: '#047857',
      fontWeight: '700',
    },

    noticeBox: {
      borderWidth: 1,
      borderColor: '#fde68a',
      borderRadius: 12,
      backgroundColor:
        '#fffbeb',
      padding: 13,
    },

    noticeText: {
      color: '#92400e',
      fontSize: 13,
      lineHeight: 20,
    },

    inlineError: {
      marginTop: 20,
      borderWidth: 1,
      borderColor: '#fecaca',
      borderRadius: 12,
      backgroundColor:
        '#fef2f2',
      padding: 12,
    },

    inlineErrorText: {
      color: '#b91c1c',
      fontSize: 13,
      textAlign: 'center',
    },

    deleteHelpText: {
      color: '#64748b',
      fontSize: 13,
      lineHeight: 20,
    },

    deleteButton: {
      minHeight: 52,
      marginTop: 13,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 13,
      backgroundColor:
        '#dc2626',
    },

    deleteButtonText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '800',
    },

    disabledButton: {
      opacity: 0.55,
    },

    buttonPressed: {
      opacity: 0.82,
    },

    bottomSpacing: {
      height: 30,
    },
    editHelpText: {
  color: '#64748b',
  fontSize: 13,
  lineHeight: 20,
},

editButton: {
  minHeight: 52,
  marginTop: 13,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 13,
  backgroundColor: '#047857',
},

editButtonText: {
  color: '#ffffff',
  fontSize: 14,
  fontWeight: '800',
},
  });