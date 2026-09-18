import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs, useRouter, type Href } from 'expo-router';
import { PlatformPressable } from 'expo-router/react-navigation';
import { useSession } from '@/hooks/shared/use-session';
import { rolePaths } from '@/auth/roles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette as p, typography as t } from '@/theme/tokens';

type IconName = React.ComponentProps<typeof Icon>['name'];
function TabIcon({
  focused,
  outline,
  filled,
}: {
  focused: boolean;
  outline: IconName;
  filled: IconName;
}) {
  return (
    <View style={[s.iconPill, focused && s.iconPillActive]}>
      <Icon name={focused ? filled : outline} size={24} color={focused ? p.primary : p.muted} />
    </View>
  );
}
function TabLabel({
  title,
  focused,
  action = false,
}: {
  title: string;
  focused: boolean;
  action?: boolean;
}) {
  return (
    <Text maxFontSizeMultiplier={2} style={[s.label, (focused || action) && s.labelActive]}>
      {title}
    </Text>
  );
}
export function RoleTabs({ commerce }: { commerce: boolean }) {
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const router = useRouter();
  const { role } = useSession();
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduceMotion(value);
    });
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      listener.remove();
    };
  }, []);
  const bottom = Math.max(insets.bottom, 8);
  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarLabelPosition: 'below-icon',
        tabBarAllowFontScaling: true,
        tabBarActiveTintColor: p.primary,
        tabBarInactiveTintColor: p.muted,
        tabBarActiveBackgroundColor: 'transparent',
        animation: reduceMotion ? 'none' : 'fade',
        transitionSpec: { animation: 'timing', config: { duration: reduceMotion ? 0 : 140 } },
        tabBarButton: (props) => (
          <PlatformPressable
            {...props}
            pressOpacity={0.72}
            hitSlop={{ top: 14 }}
            android_ripple={{ color: '#147D6414', borderless: false }}
          />
        ),
        tabBarStyle: [
          s.bar,
          {
            height: 78 + bottom + Math.max(0, Math.min(fontScale, 2) - 1) * 38,
            paddingBottom: bottom,
            paddingLeft: Math.max(insets.left, 6),
            paddingRight: Math.max(insets.right, 6),
          },
        ],
        tabBarItemStyle: s.item,
        tabBarIconStyle: s.iconSlot,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: commerce ? 'الرئيسية' : 'الطلبات',
          tabBarLabel: ({ focused }) => (
            <TabLabel title={commerce ? 'الرئيسية' : 'الطلبات'} focused={focused} />
          ),
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              outline={commerce ? 'home-outline' : 'clipboard-text-outline'}
              filled={commerce ? 'home' : 'clipboard-text'}
            />
          ),
        }}
      />
      {commerce && (
        <Tabs.Screen
          name="products"
          options={{
            title: 'المنتجات',
            tabBarLabel: ({ focused }) => <TabLabel title="المنتجات" focused={focused} />,
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} outline="cube-outline" filled="cube" />
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
            tabBarLabel: () => <TabLabel title="طلب جديد" focused={false} action />,
            tabBarIcon: () => (
              <View style={s.create}>
                <Icon name="plus" color="#fff" size={30} />
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
            tabBarLabel: ({ focused }) => <TabLabel title="الطلبات" focused={focused} />,
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} outline="clipboard-text-outline" filled="clipboard-text" />
            ),
          }}
        />
      )}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'حسابي',
          tabBarLabel: ({ focused }) => <TabLabel title="حسابي" focused={focused} />,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} outline="account-outline" filled="account" />
          ),
        }}
      />
    </Tabs>
  );
}
const s = StyleSheet.create({
  bar: {
    direction: 'rtl',
    backgroundColor: p.surface,
    borderTopColor: '#E7EEE8',
    borderTopWidth: 1,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 12,
    shadowColor: '#103E32',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -4 },
    elevation: 5,
  },
  item: { minHeight: 58, paddingHorizontal: 0 },
  iconSlot: { width: 52, height: 34 },
  iconPill: {
    width: 48,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillActive: { backgroundColor: '#E8F4ED' },
  label: {
    fontFamily: t.medium,
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    color: p.muted,
    marginTop: 4,
  },
  labelActive: { fontFamily: t.bold, color: p.primary },
  create: {
    position: 'absolute',
    bottom: 0,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: p.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: p.primary,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
});
