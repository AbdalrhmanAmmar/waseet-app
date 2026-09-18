import { View } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs, useRouter, type Href } from 'expo-router';
import { useSession } from '@/hooks/shared/use-session';
import { rolePaths } from '@/auth/roles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
export function RoleTabs({ commerce }: { commerce: boolean }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { role } = useSession();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#147D64',
        tabBarInactiveTintColor: '#75867E',
        tabBarHideOnKeyboard: true,
        tabBarActiveBackgroundColor: '#EDF6F1',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#DFE8E1',
          elevation: 0,
          height: 68 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 4,
        },
        tabBarItemStyle: {
          borderRadius: 14,
          marginHorizontal: 3,
          marginVertical: 2,
          paddingVertical: 4,
        },
        tabBarLabelStyle: {
          fontFamily: 'Tajawal-Medium',
          fontSize: 11,
          lineHeight: 18,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: commerce ? 'الرئيسية' : 'الطلبات',
          tabBarIcon: ({ color, size }) => (
            <Icon
              name={commerce ? 'home-outline' : 'clipboard-list-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
      {commerce && (
        <Tabs.Screen
          name="products"
          options={{
            title: 'المنتجات',
            tabBarIcon: ({ color, size }) => (
              <Icon name="package-variant" color={color} size={size} />
            ),
          }}
        />
      )}
      {commerce && (
        <Tabs.Screen
          name="new-order"
          listeners={{
            tabPress: (event) => {
              event.preventDefault();
              if (role) router.push(`${rolePaths[role]}/create-order` as Href);
            },
          }}
          options={{
            title: 'طلب جديد',
            tabBarIcon: () => (
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: '#147D64',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="plus" color="#fff" size={27} />
              </View>
            ),
          }}
        />
      )}
      {commerce && (
        <Tabs.Screen
          name="orders"
          options={{
            title: 'الطلبات',
            tabBarIcon: ({ color, size }) => (
              <Icon name="clipboard-list-outline" color={color} size={size} />
            ),
          }}
        />
      )}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'حسابي',
          tabBarIcon: ({ color, size }) => (
            <Icon name="account-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
