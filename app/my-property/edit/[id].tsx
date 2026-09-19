import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
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
  useLocalSearchParams,
} from 'expo-router';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import * as ImagePicker from 'expo-image-picker';

import {
  getMyPropertyById,
  updateMyProperty,
} from '../../../api/myProperties';

import {
  rollbackPropertyImages,
  uploadPropertyImages,
} from '../../../api/uploads';

/* =====================================================
   TYPES
===================================================== */

type Currency =
  | 'LKR'
  | 'USD';

type ListingType =
  | 'sale'
  | 'rent';

type PropertyType =
  | 'house'
  | 'apartment'
  | 'land'
  | 'commercial';

type AreaUnit =
  | 'sqft'
  | 'perch'
  | 'acre';

type ExistingImage = {
  url: string;
  publicId: string | null;
};

type SelectedImage = {
  uri: string;

  fileName?: string | null;

  mimeType?: string | null;

  fileSize?: number | null;

  width?: number;

  height?: number;
};

type UploadedImage = {
  url: string;
  publicId: string;

  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  originalName?: string;
};

type Property = {
  _id: string;

  title: string;
  description?: string;

  price: number;
  currency: Currency;

  listingType: ListingType;

  propertyType:
    PropertyType;

  address: string;
  city: string;
  district: string;

  bedrooms: number;
  bathrooms: number;

  area: number;
  areaUnit: AreaUnit;

  amenities?: string[];

  images?: (
    | string
    | {
        url?: string;
        publicId?:
          | string
          | null;
      }
  )[];

  status?:
    | 'pending'
    | 'approved'
    | 'rejected';
};

/* =====================================================
   SCREEN
===================================================== */

export default function EditPropertyScreen() {
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
    loading,
    setLoading,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    uploadStatus,
    setUploadStatus,
  ] = useState('');

  const [
    error,
    setError,
  ] = useState('');

  /* ==========================
     FORM
  ========================== */

  const [
    title,
    setTitle,
  ] = useState('');

  const [
    description,
    setDescription,
  ] = useState('');

  const [
    price,
    setPrice,
  ] = useState('');

  const [
    currency,
    setCurrency,
  ] =
    useState<Currency>(
      'LKR'
    );

  const [
    listingType,
    setListingType,
  ] =
    useState<ListingType>(
      'sale'
    );

  const [
    propertyType,
    setPropertyType,
  ] =
    useState<PropertyType>(
      'house'
    );

  const [
    address,
    setAddress,
  ] = useState('');

  const [
    city,
    setCity,
  ] = useState('');

  const [
    district,
    setDistrict,
  ] = useState('');

  const [
    bedrooms,
    setBedrooms,
  ] = useState('');

  const [
    bathrooms,
    setBathrooms,
  ] = useState('');

  const [
    area,
    setArea,
  ] = useState('');

  const [
    areaUnit,
    setAreaUnit,
  ] =
    useState<AreaUnit>(
      'sqft'
    );

  const [
    amenities,
    setAmenities,
  ] = useState('');

  /* ==========================
     IMAGES
  ========================== */

  const [
    existingImages,
    setExistingImages,
  ] =
    useState<
      ExistingImage[]
    >([]);

  const [
    newImages,
    setNewImages,
  ] =
    useState<
      SelectedImage[]
    >([]);

  const totalImageCount =
    existingImages.length +
    newImages.length;

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

          const property:
            Property =
            await getMyPropertyById(
              propertyId
            );

          if (
            !property?._id
          ) {
            throw new Error(
              'Property was not found.'
            );
          }

          setTitle(
            property.title ||
              ''
          );

          setDescription(
            property.description ||
              ''
          );

          setPrice(
            String(
              property.price ??
                ''
            )
          );

          setCurrency(
            property.currency ||
              'LKR'
          );

          setListingType(
            property.listingType ||
              'sale'
          );

          setPropertyType(
            property.propertyType ||
              'house'
          );

          setAddress(
            property.address ||
              ''
          );

          setCity(
            property.city ||
              ''
          );

          setDistrict(
            property.district ||
              ''
          );

          setBedrooms(
            String(
              property.bedrooms ??
                ''
            )
          );

          setBathrooms(
            String(
              property.bathrooms ??
                ''
            )
          );

          setArea(
            String(
              property.area ??
                ''
            )
          );

          setAreaUnit(
            property.areaUnit ||
              'sqft'
          );

          setAmenities(
            Array.isArray(
              property.amenities
            )
              ? property.amenities.join(
                  ', '
                )
              : ''
          );

          /*
           * Convert existing
           * backend images into
           * one consistent format.
           */

          const normalizedExistingImages =
            Array.isArray(
              property.images
            )
              ? property.images
                  .map(
                    (
                      image
                    ):
                      | ExistingImage
                      | null => {
                      if (
                        typeof image ===
                        'string'
                      ) {
                        return {
                          url:
                            image,
                          publicId:
                            null,
                        };
                      }

                      if (
                        image?.url
                      ) {
                        return {
                          url:
                            image.url,

                          publicId:
                            image.publicId ||
                            null,
                        };
                      }

                      return null;
                    }
                  )
                  .filter(
                    (
                      image
                    ): image is ExistingImage =>
                      Boolean(
                        image
                      )
                  )
              : [];

          setExistingImages(
            normalizedExistingImages
          );

          setNewImages(
            []
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
     CHOOSE NEW IMAGES
  =================================================== */

  const handleChooseImages =
    async () => {
      try {
        setError('');

        const remainingSlots =
          10 -
          totalImageCount;

        if (
          remainingSlots <=
          0
        ) {
          Alert.alert(
            'Maximum Reached',
            'You can have a maximum of 10 property images.'
          );

          return;
        }

        const permission =
          await ImagePicker
            .requestMediaLibraryPermissionsAsync();

        if (
          !permission.granted
        ) {
          Alert.alert(
            'Permission Required',
            'EstateHub needs permission to access your photos.'
          );

          return;
        }

        const result =
          await ImagePicker
            .launchImageLibraryAsync(
              {
                mediaTypes: [
                  'images',
                ],

                allowsMultipleSelection:
                  true,

                selectionLimit:
                  remainingSlots,

                quality:
                  0.8,
              }
            );

        if (
          result.canceled
        ) {
          return;
        }

        const selected:
          SelectedImage[] =
          [];

        for (
          const asset of
            result.assets || []
        ) {
          if (
            !asset.uri
          ) {
            continue;
          }

          /*
           * Backend allows
           * maximum 5 MB.
           */

          if (
            asset.fileSize &&
            asset.fileSize >
              5 *
                1024 *
                1024
          ) {
            Alert.alert(
              'Image Too Large',
              `${
                asset.fileName ||
                'One selected image'
              } is larger than 5 MB.`
            );

            continue;
          }

          /*
           * Backend supports only:
           * JPEG
           * PNG
           * WEBP
           */

          if (
            asset.mimeType &&
            ![
              'image/jpeg',
              'image/png',
              'image/webp',
            ].includes(
              asset.mimeType
            )
          ) {
            Alert.alert(
              'Unsupported Image',
              `${
                asset.fileName ||
                'One selected image'
              } is not JPG, PNG or WEBP.`
            );

            continue;
          }

          selected.push({
            uri:
              asset.uri,

            fileName:
              asset.fileName,

            mimeType:
              asset.mimeType,

            fileSize:
              asset.fileSize,

            width:
              asset.width,

            height:
              asset.height,
          });
        }

        setNewImages(
          (current) => [
            ...current,
            ...selected,
          ].slice(
            0,
            remainingSlots +
              current.length
          )
        );
      } catch (
        pickerError
      ) {
        setError(
          pickerError instanceof
            Error
            ? pickerError.message
            : 'Unable to select images'
        );
      }
    };

  /* ===================================================
     REMOVE EXISTING IMAGE
  =================================================== */

  const removeExistingImage =
    (
      indexToRemove:
        number
    ) => {
      setExistingImages(
        (current) =>
          current.filter(
            (
              _,
              index
            ) =>
              index !==
              indexToRemove
          )
      );
    };

  /* ===================================================
     REMOVE NEW LOCAL IMAGE
  =================================================== */

  const removeNewImage =
    (
      indexToRemove:
        number
    ) => {
      setNewImages(
        (current) =>
          current.filter(
            (
              _,
              index
            ) =>
              index !==
              indexToRemove
          )
      );
    };

  /* ===================================================
     VALIDATE
  =================================================== */

  const validateForm =
    () => {
      if (
        title.trim()
          .length < 5 ||
        title.trim()
          .length >
          120
      ) {
        return 'Title must contain between 5 and 120 characters.';
      }

      if (
        description
          .trim()
          .length < 20 ||
        description
          .trim()
          .length >
          3000
      ) {
        return 'Description must contain between 20 and 3000 characters.';
      }

      const numericPrice =
        Number(price);

      if (
        price.trim() ===
          '' ||
        Number.isNaN(
          numericPrice
        ) ||
        numericPrice < 0
      ) {
        return 'Enter a valid property price.';
      }

      if (
        !address.trim()
      ) {
        return 'Address is required.';
      }

      if (
        address.trim()
          .length > 250
      ) {
        return 'Address cannot exceed 250 characters.';
      }

      if (
        !city.trim()
      ) {
        return 'City is required.';
      }

      if (
        city.trim()
          .length > 100
      ) {
        return 'City cannot exceed 100 characters.';
      }

      if (
        !district.trim()
      ) {
        return 'District is required.';
      }

      if (
        district.trim()
          .length > 100
      ) {
        return 'District cannot exceed 100 characters.';
      }

      const numericBedrooms =
        Number(
          bedrooms
        );

      if (
        bedrooms.trim() ===
          '' ||
        !Number.isInteger(
          numericBedrooms
        ) ||
        numericBedrooms <
          0 ||
        numericBedrooms >
          100
      ) {
        return 'Bedrooms must be between 0 and 100.';
      }

      const numericBathrooms =
        Number(
          bathrooms
        );

      if (
        bathrooms.trim() ===
          '' ||
        !Number.isInteger(
          numericBathrooms
        ) ||
        numericBathrooms <
          0 ||
        numericBathrooms >
          100
      ) {
        return 'Bathrooms must be between 0 and 100.';
      }

      const numericArea =
        Number(area);

      if (
        area.trim() ===
          '' ||
        Number.isNaN(
          numericArea
        ) ||
        numericArea < 1
      ) {
        return 'Area must be at least 1.';
      }

      if (
        totalImageCount >
        10
      ) {
        return 'A property can contain a maximum of 10 images.';
      }

      return null;
    };

  /* ===================================================
     SAVE
  =================================================== */

  const handleSave =
    async () => {
      if (!propertyId) {
        return;
      }

      const validationError =
        validateForm();

      if (
        validationError
      ) {
        setError(
          validationError
        );

        return;
      }

      const amenityList =
        amenities
          .split(',')
          .map(
            (item) =>
              item.trim()
          )
          .filter(Boolean);

      if (
        amenityList.length >
        30
      ) {
        setError(
          'You can add a maximum of 30 amenities.'
        );

        return;
      }

      if (
        amenityList.some(
          (item) =>
            item.length >
            100
        )
      ) {
        setError(
          'Each amenity must contain 100 characters or fewer.'
        );

        return;
      }

      let uploadedImages:
        UploadedImage[] =
        [];

      try {
        setSubmitting(
          true
        );

        setError('');

        /*
         * STEP 1:
         * Upload ONLY newly
         * selected phone images.
         */

        if (
          newImages.length >
          0
        ) {
          setUploadStatus(
            'Uploading new images...'
          );

          uploadedImages =
            await uploadPropertyImages(
              newImages
            );
        }

        /*
         * STEP 2:
         * Existing images that
         * were not removed.
         */

        const retainedImages =
          existingImages.map(
            (image) => ({
              url:
                image.url,

              publicId:
                image.publicId,
            })
          );

        /*
         * STEP 3:
         * Newly uploaded
         * Cloudinary images.
         */

        const newlyUploadedImages =
          uploadedImages.map(
            (image) => ({
              url:
                image.url,

              publicId:
                image.publicId,
            })
          );

        /*
         * This complete array is
         * sent to the backend.
         *
         * Images missing from this
         * array are automatically
         * deleted from Cloudinary
         * by property.service.js.
         */

        const finalImages = [
          ...retainedImages,
          ...newlyUploadedImages,
        ];

        if (
          finalImages.length >
          10
        ) {
          throw new Error(
            'A property can contain a maximum of 10 images.'
          );
        }

        setUploadStatus(
          'Saving property changes...'
        );

        const propertyData =
          {
            title:
              title.trim(),

            description:
              description.trim(),

            price:
              Number(
                price
              ),

            currency,

            listingType,

            propertyType,

            address:
              address.trim(),

            city:
              city.trim(),

            district:
              district.trim(),

            bedrooms:
              Number(
                bedrooms
              ),

            bathrooms:
              Number(
                bathrooms
              ),

            area:
              Number(
                area
              ),

            areaUnit,

            amenities:
              amenityList,

            images:
              finalImages,
          };

        const updatedProperty =
          await updateMyProperty(
            propertyId,
            propertyData
          );

        if (
          !updatedProperty?._id
        ) {
          throw new Error(
            'Property was updated but no property ID was returned.'
          );
        }

        setUploadStatus('');

        router.replace({
          pathname:
            '/my-property/[id]',

          params: {
            id:
              updatedProperty._id,
          },
        });
      } catch (
        requestError
      ) {
        /*
         * Important:
         *
         * Only rollback NEW
         * uploads.
         *
         * Existing images must
         * never be sent to the
         * rollback endpoint.
         */

        if (
          uploadedImages.length >
          0
        ) {
          try {
            setUploadStatus(
              'Cleaning up uploaded images...'
            );

            await rollbackPropertyImages(
              uploadedImages.map(
                (image) =>
                  image.publicId
              )
            );
          } catch (
            rollbackError
          ) {
            console.log(
              'Image rollback failed:',
              rollbackError
            );
          }
        }

        setError(
          requestError instanceof
            Error
            ? requestError.message
            : 'Unable to update property'
        );

        setUploadStatus('');
      } finally {
        setSubmitting(
          false
        );
      }
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
     LOAD ERROR
  =================================================== */

  if (
    error &&
    !title
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
            styles.backAction
          }
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

  /* ===================================================
     UI
  =================================================== */

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS ===
          'ios'
            ? 'padding'
            : undefined
        }
      >
        <View
          style={styles.topBar}
        >
          <Pressable
            onPress={() =>
              router.back()
            }
            disabled={
              submitting
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
          >
            Edit Property
          </Text>

          <View
            style={
              styles.topBarSpacer
            }
          />
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.content
          }
        >
          {/* Review */}

          <View
            style={
              styles.reviewNotice
            }
          >
            <Text
              style={
                styles.reviewTitle
              }
            >
              Admin Review
            </Text>

            <Text
              style={
                styles.reviewText
              }
            >
              Saving changes will
              submit this property
              for another admin
              review.
            </Text>
          </View>

          {/* Basic */}

          <SectionTitle>
            Basic Information
          </SectionTitle>

          <InputField
            label="Title"
            value={title}
            onChangeText={
              setTitle
            }
            maxLength={120}
          />

          <InputField
            label="Description"
            value={
              description
            }
            onChangeText={
              setDescription
            }
            multiline
            maxLength={3000}
          />

          <InputField
            label="Price"
            value={price}
            onChangeText={
              setPrice
            }
            keyboardType="numeric"
          />

          <FieldLabel>
            Currency
          </FieldLabel>

          <View
            style={
              styles.optionRow
            }
          >
            <ChoiceButton
              title="LKR"
              active={
                currency ===
                'LKR'
              }
              onPress={() =>
                setCurrency(
                  'LKR'
                )
              }
            />

            <ChoiceButton
              title="USD"
              active={
                currency ===
                'USD'
              }
              onPress={() =>
                setCurrency(
                  'USD'
                )
              }
            />
          </View>

          <FieldLabel>
            Listing Type
          </FieldLabel>

          <View
            style={
              styles.optionRow
            }
          >
            <ChoiceButton
              title="For Sale"
              active={
                listingType ===
                'sale'
              }
              onPress={() =>
                setListingType(
                  'sale'
                )
              }
            />

            <ChoiceButton
              title="For Rent"
              active={
                listingType ===
                'rent'
              }
              onPress={() =>
                setListingType(
                  'rent'
                )
              }
            />
          </View>

          <FieldLabel>
            Property Type
          </FieldLabel>

          <View
            style={
              styles.optionGrid
            }
          >
            {(
              [
                'house',
                'apartment',
                'land',
                'commercial',
              ] as PropertyType[]
            ).map(
              (type) => (
                <ChoiceButton
                  key={type}
                  title={
                    type
                      .charAt(
                        0
                      )
                      .toUpperCase() +
                    type.slice(
                      1
                    )
                  }
                  active={
                    propertyType ===
                    type
                  }
                  onPress={() =>
                    setPropertyType(
                      type
                    )
                  }
                />
              )
            )}
          </View>

          {/* Location */}

          <SectionTitle>
            Location
          </SectionTitle>

          <InputField
            label="Address"
            value={address}
            onChangeText={
              setAddress
            }
            maxLength={250}
          />

          <InputField
            label="City"
            value={city}
            onChangeText={
              setCity
            }
            maxLength={100}
          />

          <InputField
            label="District"
            value={district}
            onChangeText={
              setDistrict
            }
            maxLength={100}
          />

          {/* Details */}

          <SectionTitle>
            Property Details
          </SectionTitle>

          <InputField
            label="Bedrooms"
            value={
              bedrooms
            }
            onChangeText={
              setBedrooms
            }
            keyboardType="numeric"
          />

          <InputField
            label="Bathrooms"
            value={
              bathrooms
            }
            onChangeText={
              setBathrooms
            }
            keyboardType="numeric"
          />

          <InputField
            label="Area"
            value={area}
            onChangeText={
              setArea
            }
            keyboardType="numeric"
          />

          <FieldLabel>
            Area Unit
          </FieldLabel>

          <View
            style={
              styles.optionGrid
            }
          >
            <ChoiceButton
              title="Square Feet"
              active={
                areaUnit ===
                'sqft'
              }
              onPress={() =>
                setAreaUnit(
                  'sqft'
                )
              }
            />

            <ChoiceButton
              title="Perch"
              active={
                areaUnit ===
                'perch'
              }
              onPress={() =>
                setAreaUnit(
                  'perch'
                )
              }
            />

            <ChoiceButton
              title="Acre"
              active={
                areaUnit ===
                'acre'
              }
              onPress={() =>
                setAreaUnit(
                  'acre'
                )
              }
            />
          </View>

          {/* Amenities */}

          <SectionTitle>
            Amenities
          </SectionTitle>

          <InputField
            label="Amenities"
            value={
              amenities
            }
            onChangeText={
              setAmenities
            }
            multiline
          />

          <Text
            style={
              styles.helperText
            }
          >
            Separate amenities
            using commas.
          </Text>

          {/* ==========================================
              IMAGES
          ========================================== */}

          <SectionTitle>
            Property Images
          </SectionTitle>

          <Text
            style={
              styles.imageHelpText
            }
          >
            Keep existing images,
            remove unwanted ones
            and add new photos. A
            property can have up to
            10 images.
          </Text>

          <Pressable
            onPress={
              handleChooseImages
            }
            disabled={
              submitting ||
              totalImageCount >=
                10
            }
            style={({
              pressed,
            }) => [
              styles.chooseImageButton,

              pressed &&
                !submitting &&
                styles.buttonPressed,

              totalImageCount >=
                10 &&
                styles.disabledButton,
            ]}
          >
            <Text
              style={
                styles.chooseImageButtonText
              }
            >
              + Add Images
            </Text>
          </Pressable>

          <Text
            style={
              styles.imageCount
            }
          >
            {totalImageCount}/10
            images
          </Text>

          {/* Existing */}

          {existingImages.length >
          0 ? (
            <>
              <Text
                style={
                  styles.imageGroupTitle
                }
              >
                Existing Images
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
              >
                {existingImages.map(
                  (
                    image,
                    index
                  ) => (
                    <ImagePreview
                      key={`existing-${image.url}-${index}`}
                      uri={
                        image.url
                      }
                      onRemove={() =>
                        removeExistingImage(
                          index
                        )
                      }
                      disabled={
                        submitting
                      }
                    />
                  )
                )}
              </ScrollView>
            </>
          ) : null}

          {/* New */}

          {newImages.length >
          0 ? (
            <>
              <Text
                style={
                  styles.imageGroupTitle
                }
              >
                New Images
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
              >
                {newImages.map(
                  (
                    image,
                    index
                  ) => (
                    <ImagePreview
                      key={`new-${image.uri}-${index}`}
                      uri={
                        image.uri
                      }
                      onRemove={() =>
                        removeNewImage(
                          index
                        )
                      }
                      disabled={
                        submitting
                      }
                      isNew
                    />
                  )
                )}
              </ScrollView>
            </>
          ) : null}

          {totalImageCount ===
          0 ? (
            <View
              style={
                styles.noImagesBox
              }
            >
              <Text
                style={
                  styles.noImagesText
                }
              >
                This property
                currently has no
                images.
              </Text>
            </View>
          ) : null}

          {/* Error */}

          {error ? (
            <View
              style={
                styles.errorBox
              }
            >
              <Text
                style={
                  styles.errorBoxText
                }
              >
                {error}
              </Text>
            </View>
          ) : null}

          {/* Progress */}

          {submitting &&
          uploadStatus ? (
            <View
              style={
                styles.progressBox
              }
            >
              <ActivityIndicator
                size="small"
                color="#047857"
              />

              <Text
                style={
                  styles.progressText
                }
              >
                {uploadStatus}
              </Text>
            </View>
          ) : null}

          {/* Save */}

          <Pressable
            onPress={
              handleSave
            }
            disabled={
              submitting
            }
            style={({
              pressed,
            }) => [
              styles.saveButton,

              pressed &&
                !submitting &&
                styles.buttonPressed,

              submitting &&
                styles.disabledButton,
            ]}
          >
            {submitting ? (
              <>
                <ActivityIndicator
                  size="small"
                  color="#ffffff"
                />

                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  Please wait...
                </Text>
              </>
            ) : (
              <Text
                style={
                  styles.saveButtonText
                }
              >
                Save Changes
              </Text>
            )}
          </Pressable>

          <View
            style={
              styles.bottomSpacing
            }
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* =====================================================
   IMAGE PREVIEW
===================================================== */

function ImagePreview({
  uri,
  onRemove,
  disabled,
  isNew = false,
}: {
  uri: string;

  onRemove: () => void;

  disabled?: boolean;

  isNew?: boolean;
}) {
  return (
    <View
      style={
        styles.imagePreviewContainer
      }
    >
      <Image
        source={{
          uri,
        }}
        style={
          styles.imagePreview
        }
        resizeMode="cover"
      />

      {isNew ? (
        <View
          style={
            styles.newImageBadge
          }
        >
          <Text
            style={
              styles.newImageBadgeText
            }
          >
            NEW
          </Text>
        </View>
      ) : null}

      <Pressable
        onPress={
          onRemove
        }
        disabled={
          disabled
        }
        style={
          styles.removeImageButton
        }
      >
        <Text
          style={
            styles.removeImageText
          }
        >
          ×
        </Text>
      </Pressable>
    </View>
  );
}

/* =====================================================
   INPUT
===================================================== */

function InputField({
  label,
  value,
  onChangeText,
  multiline = false,
  maxLength,
  keyboardType = 'default',
}: {
  label: string;

  value: string;

  onChangeText: (
    value: string
  ) => void;

  multiline?: boolean;

  maxLength?: number;

  keyboardType?:
    | 'default'
    | 'numeric';
}) {
  return (
    <View
      style={
        styles.fieldContainer
      }
    >
      <Text
        style={styles.label}
      >
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={
          onChangeText
        }
        placeholder={`Enter ${label.toLowerCase()}`}
        placeholderTextColor="#94a3b8"
        multiline={multiline}
        maxLength={
          maxLength
        }
        keyboardType={
          keyboardType
        }
        textAlignVertical={
          multiline
            ? 'top'
            : 'center'
        }
        style={[
          styles.input,

          multiline &&
            styles.multilineInput,
        ]}
      />
    </View>
  );
}

/* =====================================================
   SECTION
===================================================== */

function SectionTitle({
  children,
}: {
  children: string;
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
   FIELD LABEL
===================================================== */

function FieldLabel({
  children,
}: {
  children: string;
}) {
  return (
    <Text
      style={
        styles.choiceLabel
      }
    >
      {children}
    </Text>
  );
}

/* =====================================================
   CHOICE
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
        24,
      backgroundColor:
        '#f8fafc',
    },

    loadingText: {
      marginTop: 12,
      color: '#64748b',
    },

    errorTitle: {
      color: '#991b1b',
      fontSize: 20,
      fontWeight: '800',
    },

    errorMessage: {
      marginTop: 8,
      color: '#64748b',
      textAlign:
        'center',
    },

    backAction: {
      marginTop: 20,
      borderRadius: 12,
      backgroundColor:
        '#047857',
      paddingHorizontal:
        20,
      paddingVertical: 11,
    },

    backActionText: {
      color: '#ffffff',
      fontWeight: '800',
    },

    topBar: {
      height: 60,
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
        16,
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
      textAlign:
        'center',
    },

    topBarSpacer: {
      width: 42,
    },

    content: {
      paddingHorizontal:
        20,
      paddingTop: 18,
    },

    reviewNotice: {
      borderWidth: 1,
      borderColor:
        '#fde68a',
      borderRadius: 13,
      backgroundColor:
        '#fffbeb',
      padding: 14,
    },

    reviewTitle: {
      color: '#92400e',
      fontSize: 13,
      fontWeight: '800',
    },

    reviewText: {
      marginTop: 5,
      color: '#92400e',
      fontSize: 12,
      lineHeight: 19,
    },

    sectionTitle: {
      marginTop: 27,
      marginBottom: 14,
      color: '#0f172a',
      fontSize: 20,
      fontWeight: '800',
    },

    fieldContainer: {
      marginBottom: 17,
    },

    label: {
      marginBottom: 7,
      color: '#334155',
      fontSize: 13,
      fontWeight: '700',
    },

    input: {
      minHeight: 50,
      borderWidth: 1,
      borderColor:
        '#cbd5e1',
      borderRadius: 13,
      backgroundColor:
        '#ffffff',
      paddingHorizontal:
        14,
      color: '#0f172a',
      fontSize: 14,
    },

    multilineInput: {
      minHeight: 125,
      paddingTop: 13,
      paddingBottom: 13,
    },

    choiceLabel: {
      marginBottom: 8,
      color: '#334155',
      fontSize: 13,
      fontWeight: '700',
    },

    optionRow: {
      flexDirection:
        'row',
      gap: 9,
      marginBottom: 18,
    },

    optionGrid: {
      flexDirection:
        'row',
      flexWrap: 'wrap',
      gap: 9,
      marginBottom: 18,
    },

    choiceButton: {
      minWidth: '47%',
      flexGrow: 1,
      minHeight: 48,
      alignItems:
        'center',
      justifyContent:
        'center',
      borderWidth: 1,
      borderColor:
        '#cbd5e1',
      borderRadius: 12,
      backgroundColor:
        '#ffffff',
      paddingHorizontal:
        10,
    },

    choiceButtonActive: {
      borderColor:
        '#047857',
      backgroundColor:
        '#047857',
    },

    choiceButtonText: {
      color: '#475569',
      fontSize: 13,
      fontWeight: '700',
    },

    choiceButtonTextActive: {
      color: '#ffffff',
    },

    helperText: {
      marginTop: -8,
      color: '#64748b',
      fontSize: 12,
      lineHeight: 18,
    },

    imageHelpText: {
      color: '#64748b',
      fontSize: 13,
      lineHeight: 20,
      marginBottom: 13,
    },

    chooseImageButton: {
      minHeight: 50,
      alignItems:
        'center',
      justifyContent:
        'center',
      borderWidth: 1,
      borderColor:
        '#047857',
      borderRadius: 13,
      backgroundColor:
        '#ecfdf5',
    },

    chooseImageButtonText: {
      color: '#047857',
      fontSize: 14,
      fontWeight: '800',
    },

    imageCount: {
      marginTop: 8,
      color: '#64748b',
      fontSize: 12,
      textAlign: 'right',
    },

    imageGroupTitle: {
      marginTop: 16,
      marginBottom: 8,
      color: '#334155',
      fontSize: 13,
      fontWeight: '800',
    },

    imagePreviewContainer: {
      position:
        'relative',
      marginRight: 10,
    },

    imagePreview: {
      width: 130,
      height: 105,
      borderRadius: 12,
      backgroundColor:
        '#e2e8f0',
    },

    removeImageButton: {
      position:
        'absolute',
      top: 5,
      right: 5,
      width: 29,
      height: 29,
      alignItems:
        'center',
      justifyContent:
        'center',
      borderRadius: 15,
      backgroundColor:
        'rgba(15,23,42,0.78)',
    },

    removeImageText: {
      color: '#ffffff',
      fontSize: 20,
      lineHeight: 22,
      fontWeight: '700',
    },

    newImageBadge: {
      position:
        'absolute',
      left: 5,
      bottom: 5,
      borderRadius: 6,
      backgroundColor:
        '#047857',
      paddingHorizontal: 6,
      paddingVertical: 3,
    },

    newImageBadgeText: {
      color: '#ffffff',
      fontSize: 9,
      fontWeight: '800',
    },

    noImagesBox: {
      marginTop: 14,
      borderRadius: 12,
      backgroundColor:
        '#f1f5f9',
      padding: 15,
    },

    noImagesText: {
      color: '#64748b',
      fontSize: 13,
      textAlign:
        'center',
    },

    errorBox: {
      marginTop: 20,
      borderWidth: 1,
      borderColor:
        '#fecaca',
      borderRadius: 12,
      backgroundColor:
        '#fef2f2',
      padding: 12,
    },

    errorBoxText: {
      color: '#b91c1c',
      fontSize: 13,
      lineHeight: 19,
    },

    progressBox: {
      marginTop: 18,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'center',
      gap: 9,
      borderRadius: 12,
      backgroundColor:
        '#ecfdf5',
      padding: 13,
    },

    progressText: {
      color: '#047857',
      fontSize: 13,
      fontWeight: '700',
    },

    saveButton: {
      minHeight: 55,
      marginTop: 22,
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
    },

    saveButtonText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '800',
    },

    disabledButton: {
      opacity: 0.5,
    },

    buttonPressed: {
      opacity: 0.83,
    },

    bottomSpacing: {
      height: 35,
    },
  });