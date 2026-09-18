import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router';
export function RoleTabs({ commerce }: { commerce: boolean }) {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#E65317',
        tabBarStyle: { backgroundColor: '#fff' },
        tabBarLabelStyle: { fontFamily: 'Montserrat-Regular' },
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
          name="cart"
          options={{
            title: 'السلة',
            tabBarIcon: ({ color, size }) => <Icon name="cart-outline" color={color} size={size} />,
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
