import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from 'expo-router';
import { CustomText as Text, HeaderComponent, ScreenContainer } from '@/components/shared';
import { Button, Card, ui } from '@/components/shared/ui';
import { BalanceCard } from '@/components/shared/home/BalanceCard';
import { useSession } from '@/hooks/shared/use-session';
import { useAppDispatch } from '@/hooks/shared/use-store';
import { GetUserProfile, logout } from '@/store/slices/auth';
import { roleLabels } from '@/auth/roles';
import type { ScreenProps } from '@/navigation/use-screen-props';
import { palette as p, typography as t } from '@/theme/tokens';
export default function ProfileScreen({ navigation }: ScreenProps) {
  const { userData, role } = useSession();
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const userId = userData?.userId;
  const fetch = useCallback(async () => {
    if (userId) await dispatch(GetUserProfile(userId));
  }, [dispatch, userId]);
  useFocusEffect(
    useCallback(() => {
      void fetch();
    }, [fetch]),
  );
  const refresh = async () => {
    setRefreshing(true);
    try {
      await fetch();
    } finally {
      setRefreshing(false);
    }
  };
  const fullName =
    [userData?.firstName, userData?.secondName, userData?.lastName].filter(Boolean).join(' ') ||
    'حسابي';
  const details = [
    ['البريد الإلكتروني', userData?.email],
    ['رقم الهاتف', userData?.phoneNumber],
    ['الدولة', userData?.country],
    ['العنوان', userData?.address],
    ...(userData?.birthDate
      ? [['تاريخ الميلاد', new Date(String(userData.birthDate)).toLocaleDateString('ar-EG')]]
      : []),
    ...(userData?.oliveryContactMobile
      ? [['رقم تواصل التوصيل', userData.oliveryContactMobile]]
      : []),
    ...(userData?.cliqNumber ? [['رقم CliQ', userData.cliqNumber]] : []),
  ];
  return (
    <ScreenContainer>
      <HeaderComponent
        title="حسابي"
        showBack={false}
        rightComponent={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="فتح القائمة"
            onPress={() => navigation.navigate('MenuScreen')}
            style={{ padding: 8 }}
          >
            <Icon name="menu" size={24} color={p.ink} />
          </Pressable>
        }
      />
      <ScrollView
        testID="profile-content"
        contentContainerStyle={ui.page}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={p.primary} />
        }
      >
        <View style={s.hero}>
          <View style={s.avatar}>
            <Text style={s.initial}>{userData?.firstName?.[0] || 'و'}</Text>
          </View>
          <Text style={s.name}>{fullName}</Text>
          <View style={s.badge}>
            <Text style={ui.link}>{role ? roleLabels[role] : 'مستخدم'}</Text>
          </View>
          <Text style={ui.caption}>رقم الحساب #{userData?.userId}</Text>
        </View>
        <Button
          title="تعديل الملف الشخصي"
          secondary
          icon="account-edit-outline"
          onPress={() => navigation.navigate('EditProfileScreen')}
        />
        {role === 'Merchant' && <BalanceCard key={String(userId)} />}
        <Card>
          <Text style={ui.title}>بيانات الحساب</Text>
          {details.map(([label, value]) => (
            <View key={String(label)} style={s.detail}>
              <Text style={ui.caption}>{String(label)}</Text>
              <Text selectable style={s.value}>
                {String(value ?? 'غير متوفر')}
              </Text>
            </View>
          ))}
        </Card>
        <Card>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('ContactUs')}
            style={ui.section}
          >
            <Text style={s.value}>المساعدة والتواصل</Text>
            <Icon name="headset" size={24} color={p.primary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('AboutUs')}
            style={ui.section}
          >
            <Text style={s.value}>عن وسيط</Text>
            <Icon name="information-outline" size={24} color={p.primary} />
          </Pressable>
        </Card>
        <Pressable accessibilityRole="button" onPress={() => dispatch(logout())} style={s.logout}>
          <Icon name="logout" size={21} color={p.danger} />
          <Text style={{ color: p.danger, fontFamily: t.bold }}>تسجيل الخروج</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
const s = StyleSheet.create({
  hero: { alignItems: 'center', gap: 10, paddingVertical: 16 },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 28,
    backgroundColor: p.soft,
    borderWidth: 1,
    borderColor: p.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { color: p.primary, fontSize: 38, lineHeight: 54, fontFamily: t.bold },
  name: { fontSize: 24, lineHeight: 34, fontFamily: t.bold, textAlign: 'center' },
  badge: { backgroundColor: p.soft, paddingHorizontal: 16, paddingVertical: 4, borderRadius: 10 },
  balance: { color: '#fff', fontFamily: t.bold, fontSize: 28, lineHeight: 40 },
  detail: { borderTopWidth: 1, borderColor: p.border, paddingTop: 12, gap: 3 },
  value: { fontSize: 16, fontFamily: t.medium },
  logout: {
    minHeight: 52,
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FCF0ED',
    borderRadius: 14,
  },
});
