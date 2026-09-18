import { CustomText, HeaderComponent, ScreenContainer } from '@/components/shared';
import { useSession } from '@/hooks/shared/use-session';
import { useAppDispatch } from '@/hooks/shared/use-store';
import type { ScreenProps } from '@/navigation/use-screen-props';
import { logout } from '@/store/slices/auth';
import { Pressable, ScrollView } from 'react-native';
export default function MenuScreen({ navigation }: ScreenProps) {
  const session = useSession();
  const dispatch = useAppDispatch();
  const items = [
    { screen: 'ProfileScreen', title: 'حسابي' },
    { screen: 'Notifications', title: 'الإشعارات' },
    ...(session.can('catalog.read') ? [{ screen: 'FavoriteProducts', title: 'المفضلة' }] : []),
    { screen: 'ContactUs', title: 'تواصل معنا' },
    { screen: 'AboutUs', title: 'عن التطبيق' },
  ];
  return (
    <ScreenContainer>
      <HeaderComponent title="القائمة" />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        {items.map((item) => (
          <Pressable
            key={item.screen}
            style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20 }}
            onPress={() => navigation.navigate(item.screen)}
          >
            <CustomText>{item.title}</CustomText>
          </Pressable>
        ))}
        <Pressable onPress={() => dispatch(logout())}>
          <CustomText>تسجيل الخروج</CustomText>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
