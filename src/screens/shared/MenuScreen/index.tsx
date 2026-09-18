import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, ScrollView, View } from 'react-native';
import { CustomText, HeaderComponent, ScreenContainer } from '@/components/shared';
import { Brand, Card, ui } from '@/components/shared/ui';
import { useSession } from '@/hooks/shared/use-session';
import { useAppDispatch } from '@/hooks/shared/use-store';
import type { ScreenProps } from '@/navigation/use-screen-props';
import { logout } from '@/store/slices/auth';
import { palette } from '@/theme/tokens';
export default function MenuScreen({ navigation }: ScreenProps) {
  const session = useSession();
  const dispatch = useAppDispatch();
  const items: {
    screen: string;
    title: string;
    icon: React.ComponentProps<typeof Icon>['name'];
  }[] = [
    { screen: 'ProfileScreen', title: 'حسابي', icon: 'account-outline' },
    { screen: 'Notifications', title: 'الإشعارات', icon: 'bell-outline' },
    ...(session.can('catalog.read')
      ? [{ screen: 'FavoriteProducts', title: 'المفضلة', icon: 'heart-outline' as const }]
      : []),
    { screen: 'ContactUs', title: 'تواصل معنا', icon: 'headset' },
    { screen: 'AboutUs', title: 'عن التطبيق', icon: 'information-outline' },
  ];
  return (
    <ScreenContainer>
      <HeaderComponent title="القائمة" />
      <ScrollView contentContainerStyle={ui.page}>
        <Brand />
        <Card>
          {items.map((item) => (
            <Pressable
              key={item.screen}
              accessibilityRole="button"
              onPress={() => navigation.navigate(item.screen)}
              style={[ui.section, { paddingVertical: 12 }]}
            >
              <Icon name={item.icon} size={25} color={palette.primary} />
              <CustomText style={{ flex: 1 }}>{item.title}</CustomText>
              <Icon name="chevron-left" size={22} color={palette.muted} />
            </Pressable>
          ))}
        </Card>
        <Pressable
          accessibilityRole="button"
          onPress={() => dispatch(logout())}
          style={[ui.section, { justifyContent: 'center', padding: 16 }]}
        >
          <Icon name="logout" size={22} color={palette.danger} />
          <CustomText style={{ color: palette.danger }}>تسجيل الخروج</CustomText>
        </Pressable>
        <View style={{ height: 12 }} />
      </ScrollView>
    </ScreenContainer>
  );
}
