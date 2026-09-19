import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import useAuth from '../../context/AuthContext';

export default function ProfileScreen() {
  const {
    user,
    initializing,
    signOut,
  } = useAuth();

  /* ================================================
     LOGOUT
  ================================================= */

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',

          onPress: async () => {
            try {
              await signOut();

              router.replace('/');
            } catch (error) {
              Alert.alert(
                'Logout Failed',
                error instanceof Error
                  ? error.message
                  : 'Unable to logout'
              );
            }
          },
        },
      ]
    );
  };

  /* ================================================
     INITIAL AUTH CHECK
  ================================================= */

  if (initializing) {
    return (
      <SafeAreaView
        style={styles.centered}
      >
        <ActivityIndicator
          size="large"
          color="#047857"
        />
      </SafeAreaView>
    );
  }

  /* ================================================
     GUEST PROFILE
  ================================================= */

  if (!user) {
    return (
      <SafeAreaView
        style={styles.screen}
        edges={['top']}
      >
        <View
          style={styles.guestContainer}
        >
          <View
            style={styles.guestIcon}
          >
            <Ionicons
              name="person-outline"
              size={45}
              color="#047857"
            />
          </View>

          <Text
            style={styles.guestTitle}
          >
            Welcome to EstateHub
          </Text>

          <Text
            style={styles.guestDescription}
          >
            Login to manage your
            properties, send inquiries
            and communicate with property
            owners.
          </Text>

          <Pressable
            onPress={() =>
              router.push('/login')
            }
            style={({ pressed }) => [
              styles.loginButton,

              pressed &&
                styles.pressed,
            ]}
          >
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
              router.push('/register')
            }
            style={({ pressed }) => [
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

  /* ================================================
     LOGGED-IN PROFILE
  ================================================= */

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top']}
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
      >
        {/* Header */}

        <View
          style={styles.header}
        >
          <Text
            style={styles.pageTitle}
          >
            Profile
          </Text>

          <Text
            style={
              styles.pageSubtitle
            }
          >
            Manage your EstateHub
            account
          </Text>
        </View>

        {/* ========================================
            USER CARD
        ========================================= */}

        <View
          style={styles.profileCard}
        >
          <View
            style={styles.avatar}
          >
            <Text
              style={styles.avatarText}
            >
              {getInitials(
                user?.name
              )}
            </Text>
          </View>

          <Text
            style={styles.userName}
          >
            {user?.name ||
              'EstateHub User'}
          </Text>

          <Text
            style={styles.userEmail}
          >
            {user?.email ||
              'Email not available'}
          </Text>

          {user?.role ? (
            <View
              style={styles.roleBadge}
            >
              <Text
                style={styles.roleText}
              >
                {user.role}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ========================================
            PROPERTY MANAGEMENT
        ========================================= */}

        <Text
          style={styles.sectionTitle}
        >
          Property Management
        </Text>

        <View
          style={styles.menuCard}
        >
          <MenuItem
            icon="business-outline"
            title="My Properties"
            description="View and manage your listings"
            onPress={() =>
              router.push(
                '/my-properties'
              )
            }
          />

          <View
            style={styles.divider}
          />

          <MenuItem
            icon="add-circle-outline"
            title="Add Property"
            description="Create a new property listing"
            onPress={() =>
              router.push(
                '/my-property/create'
              )
            }
          />
        </View>

        {/* ========================================
            COMMUNICATION
        ========================================= */}

        <Text
          style={styles.sectionTitle}
        >
          Communication
        </Text>

        <View
          style={styles.menuCard}
        >
          <MenuItem
            icon="chatbubbles-outline"
            title="My Inquiries"
            description="View sent and received inquiries"
            onPress={() =>
              router.push(
                '/inquiries'
              )
            }
          />
        </View>

        {/* ========================================
            BROWSE
        ========================================= */}

        <Text
          style={styles.sectionTitle}
        >
          Browse
        </Text>

        <View
          style={styles.menuCard}
        >
          <MenuItem
            icon="compass-outline"
            title="Explore Properties"
            description="Search available properties"
            onPress={() =>
              router.push(
                '/explore'
              )
            }
          />

          <View
            style={styles.divider}
          />

          <MenuItem
            icon="home-outline"
            title="Home"
            description="Return to the home page"
            onPress={() =>
              router.push('/')
            }
          />
        </View>

        {/* ========================================
            ACCOUNT DETAILS
        ========================================= */}

        <Text
          style={styles.sectionTitle}
        >
          Account Information
        </Text>

        <View
          style={styles.infoCard}
        >
          <InfoRow
            label="Name"
            value={
              user?.name || '-'
            }
          />

          <InfoRow
            label="Email"
            value={
              user?.email || '-'
            }
          />

          {user?.role ? (
            <InfoRow
              label="Role"
              value={user.role}
              last
            />
          ) : null}
        </View>

        {/* ========================================
            LOGOUT
        ========================================= */}

        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutButton,

            pressed &&
              styles.pressed,
          ]}
        >
          <Ionicons
            name="log-out-outline"
            size={21}
            color="#dc2626"
          />

          <Text
            style={
              styles.logoutText
            }
          >
            Logout
          </Text>
        </Pressable>

        <Text
          style={styles.footerText}
        >
          EstateHub Mobile
        </Text>

        <View
          style={{
            height: 25,
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

/* =====================================================
   MENU ITEM
===================================================== */

function MenuItem({
  icon,
  title,
  description,
  onPress,
}: {
  icon:
    keyof typeof Ionicons.glyphMap;

  title: string;

  description: string;

  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,

        pressed &&
          styles.menuItemPressed,
      ]}
    >
      <View
        style={styles.menuIcon}
      >
        <Ionicons
          name={icon}
          size={22}
          color="#047857"
        />
      </View>

      <View
        style={styles.menuTextArea}
      >
        <Text
          style={styles.menuTitle}
        >
          {title}
        </Text>

        <Text
          style={
            styles.menuDescription
          }
        >
          {description}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color="#94a3b8"
      />
    </Pressable>
  );
}

/* =====================================================
   INFO ROW
===================================================== */

function InfoRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.infoRow,

        last &&
          styles.infoRowLast,
      ]}
    >
      <Text
        style={styles.infoLabel}
      >
        {label}
      </Text>

      <Text
        style={styles.infoValue}
      >
        {value}
      </Text>
    </View>
  );
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

  const words = name
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

    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
      backgroundColor:
        '#f8fafc',
    },

    content: {
      paddingHorizontal: 20,
    },

    header: {
      paddingTop: 20,
      paddingBottom: 18,
    },

    pageTitle: {
      color: '#0f172a',
      fontSize: 29,
      fontWeight: '800',
    },

    pageSubtitle: {
      marginTop: 5,
      color: '#64748b',
      fontSize: 14,
    },

    /* Profile card */

    profileCard: {
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 20,
      backgroundColor:
        '#ffffff',
      paddingVertical: 25,
      paddingHorizontal: 20,
      elevation: 2,
    },

    avatar: {
      width: 82,
      height: 82,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 41,
      backgroundColor:
        '#047857',
    },

    avatarText: {
      color: '#ffffff',
      fontSize: 29,
      fontWeight: '800',
    },

    userName: {
      marginTop: 14,
      color: '#0f172a',
      fontSize: 21,
      fontWeight: '800',
      textAlign: 'center',
    },

    userEmail: {
      marginTop: 5,
      color: '#64748b',
      fontSize: 13,
    },

    roleBadge: {
      marginTop: 11,
      borderRadius: 999,
      backgroundColor:
        '#ecfdf5',
      paddingHorizontal: 13,
      paddingVertical: 6,
    },

    roleText: {
      color: '#047857',
      fontSize: 11,
      fontWeight: '800',
      textTransform:
        'uppercase',
    },

    /* Sections */

    sectionTitle: {
      marginTop: 27,
      marginBottom: 10,
      color: '#334155',
      fontSize: 14,
      fontWeight: '800',
    },

    menuCard: {
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 16,
      backgroundColor:
        '#ffffff',
    },

    menuItem: {
      minHeight: 74,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 12,
    },

    menuItemPressed: {
      backgroundColor:
        '#f8fafc',
    },

    menuIcon: {
      width: 43,
      height: 43,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 13,
      backgroundColor:
        '#ecfdf5',
    },

    menuTextArea: {
      flex: 1,
      marginHorizontal: 12,
    },

    menuTitle: {
      color: '#0f172a',
      fontSize: 14,
      fontWeight: '800',
    },

    menuDescription: {
      marginTop: 4,
      color: '#64748b',
      fontSize: 11,
      lineHeight: 16,
    },

    divider: {
      height: 1,
      marginLeft: 69,
      backgroundColor:
        '#f1f5f9',
    },

    /* Info */

    infoCard: {
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 16,
      backgroundColor:
        '#ffffff',
      paddingHorizontal: 15,
    },

    infoRow: {
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      gap: 15,
      borderBottomWidth: 1,
      borderBottomColor:
        '#f1f5f9',
    },

    infoRowLast: {
      borderBottomWidth: 0,
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
    },

    /* Logout */

    logoutButton: {
      minHeight: 53,
      marginTop: 28,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 8,
      borderWidth: 1,
      borderColor: '#fecaca',
      borderRadius: 14,
      backgroundColor:
        '#ffffff',
    },

    logoutText: {
      color: '#dc2626',
      fontSize: 14,
      fontWeight: '800',
    },

    pressed: {
      opacity: 0.8,
    },

    footerText: {
      marginTop: 25,
      color: '#94a3b8',
      fontSize: 11,
      textAlign: 'center',
    },

    /* Guest */

    guestContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
      paddingHorizontal: 28,
    },

    guestIcon: {
      width: 90,
      height: 90,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 45,
      backgroundColor:
        '#ecfdf5',
    },

    guestTitle: {
      marginTop: 20,
      color: '#0f172a',
      fontSize: 23,
      fontWeight: '800',
      textAlign: 'center',
    },

    guestDescription: {
      marginTop: 9,
      color: '#64748b',
      fontSize: 14,
      lineHeight: 21,
      textAlign: 'center',
    },

    loginButton: {
      width: '100%',
      minHeight: 52,
      marginTop: 25,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 14,
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
      minHeight: 52,
      marginTop: 10,
      alignItems: 'center',
      justifyContent:
        'center',
      borderWidth: 1,
      borderColor: '#047857',
      borderRadius: 14,
      backgroundColor:
        '#ffffff',
    },

    registerButtonText: {
      color: '#047857',
      fontSize: 14,
      fontWeight: '800',
    },
  });