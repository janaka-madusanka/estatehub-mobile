import {
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
} from 'expo-router';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import * as ImagePicker from 'expo-image-picker';

import {
  createMyProperty,
} from '../../api/myProperties';

import {
  rollbackPropertyImages,
  uploadPropertyImages,
} from '../../api/uploads';

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

/* =====================================================
   SCREEN
===================================================== */

export default function CreatePropertyScreen() {
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

  const [
    selectedImages,
    setSelectedImages,
  ] =
    useState<
      SelectedImage[]
    >([]);

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

  /* ===================================================
     IMAGE PICKER
  =================================================== */

  const handleChooseImages =
    async () => {
      try {
        setError('');

        const permission =
          await ImagePicker
            .requestMediaLibraryPermissionsAsync();

        if (
          !permission.granted
        ) {
          Alert.alert(
            'Permission Required',
            'EstateHub needs permission to access your photos so you can add property images.'
          );

          return;
        }

        const remainingSlots =
          10 -
          selectedImages.length;

        if (
          remainingSlots <= 0
        ) {
          Alert.alert(
            'Maximum Reached',
            'You can select a maximum of 10 property images.'
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

                quality: 0.8,
              }
            );

        if (
          result.canceled
        ) {
          return;
        }

        const picked =
          result.assets || [];

        const validImages:
          SelectedImage[] =
          [];

        for (
          const image of picked
        ) {
          if (!image.uri) {
            continue;
          }

          /*
           * Backend max:
           * 5 MB per file.
           */
          if (
            image.fileSize &&
            image.fileSize >
              5 *
                1024 *
                1024
          ) {
            Alert.alert(
              'Image Too Large',
              `${
                image.fileName ||
                'One selected image'
              } is larger than 5 MB and was not added.`
            );

            continue;
          }

          /*
           * Backend accepts only:
           * JPEG
           * PNG
           * WEBP
           */
          if (
            image.mimeType &&
            ![
              'image/jpeg',
              'image/png',
              'image/webp',
            ].includes(
              image.mimeType
            )
          ) {
            Alert.alert(
              'Unsupported Image',
              `${
                image.fileName ||
                'One selected file'
              } is not JPG, PNG or WEBP.`
            );

            continue;
          }

          validImages.push({
            uri:
              image.uri,

            fileName:
              image.fileName,

            mimeType:
              image.mimeType,

            fileSize:
              image.fileSize,

            width:
              image.width,

            height:
              image.height,
          });
        }

        setSelectedImages(
          (current) => {
            const combined = [
              ...current,
              ...validImages,
            ];

            return combined.slice(
              0,
              10
            );
          }
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
     REMOVE LOCAL IMAGE
  =================================================== */

  const handleRemoveImage = (
    indexToRemove: number
  ) => {
    setSelectedImages(
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
     VALIDATION
  =================================================== */

  const validateForm = () => {
    const cleanTitle =
      title.trim();

    const cleanDescription =
      description.trim();

    const cleanAddress =
      address.trim();

    const cleanCity =
      city.trim();

    const cleanDistrict =
      district.trim();

    if (
      cleanTitle.length < 5 ||
      cleanTitle.length >
        120
    ) {
      return 'Title must contain between 5 and 120 characters.';
    }

    if (
      cleanDescription.length <
        20 ||
      cleanDescription.length >
        3000
    ) {
      return 'Description must contain between 20 and 3000 characters.';
    }

    const numericPrice =
      Number(price);

    if (
      price.trim() === '' ||
      Number.isNaN(
        numericPrice
      ) ||
      numericPrice < 0
    ) {
      return 'Enter a valid property price.';
    }

    if (!cleanAddress) {
      return 'Address is required.';
    }

    if (
      cleanAddress.length >
      250
    ) {
      return 'Address cannot exceed 250 characters.';
    }

    if (!cleanCity) {
      return 'City is required.';
    }

    if (
      cleanCity.length >
      100
    ) {
      return 'City cannot exceed 100 characters.';
    }

    if (!cleanDistrict) {
      return 'District is required.';
    }

    if (
      cleanDistrict.length >
      100
    ) {
      return 'District cannot exceed 100 characters.';
    }

    const numericBedrooms =
      Number(bedrooms);

    if (
      bedrooms.trim() ===
        '' ||
      !Number.isInteger(
        numericBedrooms
      ) ||
      numericBedrooms < 0 ||
      numericBedrooms > 100
    ) {
      return 'Bedrooms must be between 0 and 100.';
    }

    const numericBathrooms =
      Number(bathrooms);

    if (
      bathrooms.trim() ===
        '' ||
      !Number.isInteger(
        numericBathrooms
      ) ||
      numericBathrooms < 0 ||
      numericBathrooms > 100
    ) {
      return 'Bathrooms must be between 0 and 100.';
    }

    const numericArea =
      Number(area);

    if (
      area.trim() === '' ||
      Number.isNaN(
        numericArea
      ) ||
      numericArea < 1
    ) {
      return 'Area must be at least 1.';
    }

    return null;
  };

  /* ===================================================
     SUBMIT
  =================================================== */

  const handleSubmit =
    async () => {
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
          .map((item) =>
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

      const invalidAmenity =
        amenityList.find(
          (item) =>
            item.length > 100
        );

      if (
        invalidAmenity
      ) {
        setError(
          'Each amenity must contain 100 characters or fewer.'
        );

        return;
      }

      let uploadedImages:
        UploadedImage[] = [];

      try {
        setSubmitting(true);
        setError('');

        /*
         * STEP 1:
         * Upload selected local
         * images first.
         */

        if (
          selectedImages.length >
          0
        ) {
          setUploadStatus(
            'Uploading images...'
          );

          uploadedImages =
            await uploadPropertyImages(
              selectedImages
            );
        }

        /*
         * Property model only
         * needs url + publicId.
         */

        const propertyImages =
          uploadedImages.map(
            (image) => ({
              url:
                image.url,

              publicId:
                image.publicId,
            })
          );

        /*
         * STEP 2:
         * Create property using
         * returned Cloudinary data.
         */

        setUploadStatus(
          'Submitting property...'
        );

        const propertyData = {
          title:
            title.trim(),

          description:
            description.trim(),

          price:
            Number(price),

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
            Number(area),

          areaUnit,

          amenities:
            amenityList,

          images:
            propertyImages,
        };

        const property =
          await createMyProperty(
            propertyData
          );

        if (
          !property?._id
        ) {
          throw new Error(
            'Property was created but the property ID was not returned.'
          );
        }

        setUploadStatus('');

        router.replace({
          pathname:
            '/my-property/[id]',

          params: {
            id: property._id,
          },
        });
      } catch (
        requestError
      ) {
        /*
         * Images may have reached
         * Cloudinary while property
         * creation failed.
         *
         * Roll them back.
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

        const message =
          requestError instanceof
            Error
            ? requestError.message
            : 'Unable to create property';

        setError(message);
        setUploadStatus('');
      } finally {
        setSubmitting(false);
      }
    };

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
            Add Property
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
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            styles.content
          }
        >
          {/* Basic */}

          <SectionTitle
            title="Basic Information"
            description="Enter the main details about your property."
          />

          <InputField
            label="Title"
            value={title}
            onChangeText={
              setTitle
            }
            placeholder="Modern Family House in Kandy"
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
            placeholder="Describe the property..."
            multiline
            maxLength={3000}
          />

          <InputField
            label="Price"
            value={price}
            onChangeText={
              setPrice
            }
            placeholder="45000000"
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
            <ChoiceButton
              title="House"
              active={
                propertyType ===
                'house'
              }
              onPress={() =>
                setPropertyType(
                  'house'
                )
              }
            />

            <ChoiceButton
              title="Apartment"
              active={
                propertyType ===
                'apartment'
              }
              onPress={() =>
                setPropertyType(
                  'apartment'
                )
              }
            />

            <ChoiceButton
              title="Land"
              active={
                propertyType ===
                'land'
              }
              onPress={() =>
                setPropertyType(
                  'land'
                )
              }
            />

            <ChoiceButton
              title="Commercial"
              active={
                propertyType ===
                'commercial'
              }
              onPress={() =>
                setPropertyType(
                  'commercial'
                )
              }
            />
          </View>

          {/* Location */}

          <SectionTitle
            title="Location"
            description="Enter where the property is located."
          />

          <InputField
            label="Address"
            value={address}
            onChangeText={
              setAddress
            }
            placeholder="12 Lake Road"
            maxLength={250}
          />

          <InputField
            label="City"
            value={city}
            onChangeText={
              setCity
            }
            placeholder="Kandy"
            maxLength={100}
          />

          <InputField
            label="District"
            value={district}
            onChangeText={
              setDistrict
            }
            placeholder="Kandy"
            maxLength={100}
          />

          {/* Details */}

          <SectionTitle
            title="Property Details"
            description="Provide size and room information."
          />

          <InputField
            label="Bedrooms"
            value={
              bedrooms
            }
            onChangeText={
              setBedrooms
            }
            placeholder="4"
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
            placeholder="3"
            keyboardType="numeric"
          />

          <InputField
            label="Area"
            value={area}
            onChangeText={
              setArea
            }
            placeholder="2500"
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

          <SectionTitle
            title="Amenities"
            description="Separate multiple amenities using commas."
          />

          <InputField
            label="Amenities"
            value={
              amenities
            }
            onChangeText={
              setAmenities
            }
            placeholder="Parking, Garden, Hot Water"
            multiline
          />

          {/* ==========================================
              IMAGES
          ========================================== */}

          <SectionTitle
            title="Property Images"
            description="Select up to 10 JPG, PNG or WEBP images. Each image must be 5 MB or smaller."
          />

          <Pressable
            onPress={
              handleChooseImages
            }
            disabled={
              submitting ||
              selectedImages.length >=
                10
            }
            style={({ pressed }) => [
              styles.chooseImagesButton,

              pressed &&
                !submitting &&
                styles.buttonPressed,

              selectedImages.length >=
                10 &&
                styles.disabledChoice,
            ]}
          >
            <Text
              style={
                styles.chooseImagesButtonText
              }
            >
              + Choose Images
            </Text>
          </Pressable>

          <Text
            style={
              styles.imageCount
            }
          >
            {selectedImages.length}/10
            images selected
          </Text>

          {selectedImages.length >
          0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              style={
                styles.previewScroll
              }
            >
              {selectedImages.map(
                (
                  image,
                  index
                ) => (
                  <View
                    key={`${image.uri}-${index}`}
                    style={
                      styles.previewWrapper
                    }
                  >
                    <Image
                      source={{
                        uri:
                          image.uri,
                      }}
                      style={
                        styles.previewImage
                      }
                    />

                    <Pressable
                      onPress={() =>
                        handleRemoveImage(
                          index
                        )
                      }
                      disabled={
                        submitting
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
                )
              )}
            </ScrollView>
          ) : (
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
                No images selected.
                Images are optional.
              </Text>
            </View>
          )}

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
              After submission,
              the property will
              remain pending until
              an administrator
              approves it.
            </Text>
          </View>

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

          {/* Submit */}

          <Pressable
            onPress={
              handleSubmit
            }
            disabled={
              submitting
            }
            style={({ pressed }) => [
              styles.submitButton,

              pressed &&
                !submitting &&
                styles.buttonPressed,

              submitting &&
                styles.submitButtonDisabled,
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
                    styles.submitButtonText
                  }
                >
                  Please wait...
                </Text>
              </>
            ) : (
              <Text
                style={
                  styles.submitButtonText
                }
              >
                Submit Property
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
   INPUT
===================================================== */

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  maxLength,
  keyboardType = 'default',
}: {
  label: string;

  value: string;

  onChangeText: (
    value: string
  ) => void;

  placeholder: string;

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
        placeholder={
          placeholder
        }
        placeholderTextColor="#94a3b8"
        multiline={multiline}
        maxLength={maxLength}
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
      style={({ pressed }) => [
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
   SECTION TITLE
===================================================== */

function SectionTitle({
  title,
  description,
}: {
  title: string;

  description?: string;
}) {
  return (
    <View
      style={
        styles.sectionHeader
      }
    >
      <Text
        style={
          styles.sectionTitle
        }
      >
        {title}
      </Text>

      {description ? (
        <Text
          style={
            styles.sectionDescription
          }
        >
          {description}
        </Text>
      ) : null}
    </View>
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

    content: {
      paddingHorizontal: 20,
      paddingTop: 10,
    },

    sectionHeader: {
      marginTop: 24,
      marginBottom: 14,
    },

    sectionTitle: {
      color: '#0f172a',
      fontSize: 20,
      fontWeight: '800',
    },

    sectionDescription: {
      marginTop: 5,
      color: '#64748b',
      fontSize: 13,
      lineHeight: 20,
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
      borderColor: '#cbd5e1',
      borderRadius: 13,
      backgroundColor:
        '#ffffff',
      paddingHorizontal: 14,
      color: '#0f172a',
      fontSize: 14,
    },

    multilineInput: {
      minHeight: 125,
      paddingTop: 13,
      paddingBottom: 13,
    },

    choiceLabel: {
      marginTop: 3,
      marginBottom: 8,
      color: '#334155',
      fontSize: 13,
      fontWeight: '700',
    },

    optionRow: {
      flexDirection: 'row',
      gap: 9,
      marginBottom: 18,
    },

    optionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 9,
      marginBottom: 18,
    },

    choiceButton: {
      minWidth: '47%',
      flexGrow: 1,
      minHeight: 48,
      alignItems: 'center',
      justifyContent:
        'center',
      borderWidth: 1,
      borderColor: '#cbd5e1',
      borderRadius: 12,
      backgroundColor:
        '#ffffff',
      paddingHorizontal: 10,
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

    chooseImagesButton: {
      minHeight: 52,
      alignItems: 'center',
      justifyContent:
        'center',
      borderWidth: 1,
      borderColor:
        '#047857',
      borderRadius: 13,
      backgroundColor:
        '#ecfdf5',
    },

    chooseImagesButtonText: {
      color: '#047857',
      fontSize: 14,
      fontWeight: '800',
    },

    disabledChoice: {
      opacity: 0.5,
    },

    imageCount: {
      marginTop: 8,
      color: '#64748b',
      fontSize: 12,
      textAlign: 'right',
    },

    previewScroll: {
      marginTop: 14,
    },

    previewWrapper: {
      position: 'relative',
      marginRight: 10,
    },

    previewImage: {
      width: 120,
      height: 100,
      borderRadius: 12,
      backgroundColor:
        '#e2e8f0',
    },

    removeImageButton: {
      position: 'absolute',
      top: 5,
      right: 5,
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 14,
      backgroundColor:
        'rgba(15, 23, 42, 0.75)',
    },

    removeImageText: {
      color: '#ffffff',
      fontSize: 20,
      lineHeight: 22,
      fontWeight: '700',
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
      textAlign: 'center',
    },

    reviewNotice: {
      marginTop: 18,
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

    progressBox: {
      marginTop: 16,
      flexDirection: 'row',
      alignItems: 'center',
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

    errorText: {
      color: '#b91c1c',
      fontSize: 13,
      lineHeight: 19,
    },

    submitButton: {
      minHeight: 55,
      marginTop: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 8,
      borderRadius: 14,
      backgroundColor:
        '#047857',
      paddingHorizontal: 20,
    },

    submitButtonDisabled: {
      backgroundColor:
        '#94a3b8',
    },

    submitButtonText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '800',
    },

    buttonPressed: {
      opacity: 0.83,
    },

    bottomSpacing: {
      height: 35,
    },
  });