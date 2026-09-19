import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  AppState,
} from 'react-native';

import {
  Tabs,
  usePathname,
} from 'expo-router';

import {
  Ionicons,
} from '@expo/vector-icons';

import useAuth from '../../context/AuthContext';

import {
  getInquiryUnreadCount,
} from '../../api/inquiries';

export default function TabLayout() {
  const {
    user,
    initializing,
  } = useAuth();

  const pathname =
    usePathname();

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  /* ===================================================
     LOAD UNREAD COUNT
  =================================================== */

  const loadUnreadCount =
    useCallback(
      async () => {
        /*
         * Inquiry endpoints are
         * protected.
         *
         * Do not call them when
         * there is no logged-in
         * user.
         */
        if (
          initializing ||
          !user
        ) {
          setUnreadCount(
            0
          );

          return;
        }

        try {
          const total =
            await getInquiryUnreadCount();

          setUnreadCount(
            total
          );
        } catch (error) {
          /*
           * Do not crash navigation
           * if badge loading fails.
           */
          console.log(
            'Unable to load inquiry unread count:',
            error
          );
        }
      },
      [
        user,
        initializing,
      ]
    );

  /* ===================================================
     REFRESH WHEN ROUTE CHANGES
  =================================================== */

  useEffect(() => {
    loadUnreadCount();
  }, [
    pathname,
    loadUnreadCount,
  ]);

  /* ===================================================
     REFRESH WHEN APP RETURNS TO FOREGROUND
  =================================================== */

  useEffect(() => {
    const subscription =
      AppState.addEventListener(
        'change',
        (
          nextState
        ) => {
          if (
            nextState ===
            'active'
          ) {
            loadUnreadCount();
          }
        }
      );

    return () => {
      subscription.remove();
    };
  }, [loadUnreadCount]);

  /* ===================================================
     NAVIGATION
  =================================================== */

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor:
          '#047857',

        tabBarInactiveTintColor:
          '#64748b',

        tabBarStyle: {
          height: 68,

          paddingTop: 7,

          paddingBottom: 8,

          borderTopWidth: 1,

          borderTopColor:
            '#e2e8f0',

          backgroundColor:
            '#ffffff',

          elevation: 10,
        },

        tabBarLabelStyle: {
          fontSize: 10,

          fontWeight: '700',

          marginTop: 2,
        },
      }}
    >
      {/* ==========================================
          HOME
      =========================================== */}

      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',

          tabBarIcon: ({
            color,
            size,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? 'home'
                  : 'home-outline'
              }
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* ==========================================
          EXPLORE
      =========================================== */}

      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',

          tabBarIcon: ({
            color,
            size,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? 'compass'
                  : 'compass-outline'
              }
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* ==========================================
          MY PROPERTIES
      =========================================== */}

      <Tabs.Screen
        name="my-properties"
        options={{
          title:
            'Properties',

          tabBarIcon: ({
            color,
            size,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? 'business'
                  : 'business-outline'
              }
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* ==========================================
          INQUIRIES
      =========================================== */}

      <Tabs.Screen
        name="inquiries"
        options={{
          title:
            'Inquiries',

          /*
           * Hide badge when:
           *
           * unreadCount === 0
           *
           * Show 99+ instead of
           * extremely large numbers.
           */
          tabBarBadge:
            unreadCount > 0
              ? unreadCount >
                99
                ? '99+'
                : unreadCount
              : undefined,

          tabBarBadgeStyle: {
            backgroundColor:
              '#dc2626',

            color:
              '#ffffff',

            fontSize: 10,

            fontWeight:
              '800',
          },

          tabBarIcon: ({
            color,
            size,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? 'chatbubbles'
                  : 'chatbubbles-outline'
              }
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* ==========================================
          PROFILE
      =========================================== */}

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',

          tabBarIcon: ({
            color,
            size,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? 'person-circle'
                  : 'person-circle-outline'
              }
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}