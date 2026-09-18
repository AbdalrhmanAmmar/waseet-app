import { roleLabels } from '@/auth/roles';
import { CustomText, HeaderComponent, ScreenContainer } from '@/components/shared/index';
import { ScreenNames } from '@/navigation/ScreenNames';
import { styles } from '@/screens/shared/ProfileScreen/styles';
import { GetUserProfile, logout } from '@/store/slices/auth';
import { COLORS, hp } from '@/theme/index';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { useDispatch, useSelector } from 'react-redux';

export default function ProfileScreen({ navigation }: { navigation: any }) {
  const dispatch: any = useDispatch();
  const { userData } = useSelector((state: any) => state.AuthSlice);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = useCallback(async () => {
    const userId = userData?.userId || userData?.id;
    if (userId) {
      await dispatch(GetUserProfile(userId));
    }
  }, [dispatch, userData?.userId, userData?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const initials = userData?.firstName ? userData.firstName.charAt(0).toUpperCase() : 'U';
  const fullName =
    [userData?.firstName, userData?.secondName, userData?.lastName].filter(Boolean).join(' ') ||
    'المستخدم';
  const roleLabel = roleLabels[userData?.role as keyof typeof roleLabels] ?? 'مستخدم';
  const statusLabel =
    userData?.accountStatus === 'Approved' ? 'حساب مفعّل' : userData?.accountStatus || 'معتمد';

  return (
    <ScreenContainer backgroundColor="#F8FAFC">
      <HeaderComponent
        title="الملف الشخصي"
        rightComponent={
          <TouchableOpacity
            onPress={() => navigation.navigate(ScreenNames.EditProfileScreen)}
            style={{ padding: 5 }}
            activeOpacity={0.7}
          >
            <Icon name="account-edit-outline" size={hp(3)} color={COLORS.mainOrange} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.mainOrange]}
          />
        }
      >
        <TouchableOpacity
          onPress={() => navigation.navigate(ScreenNames.MenuStack)}
          style={{ padding: 18, backgroundColor: '#fff', borderRadius: 14, marginBottom: 16 }}
        >
          <CustomText>القائمة • الإشعارات والمساعدة</CustomText>
        </TouchableOpacity>
        {/* Avatar Section */}
        <Animatable.View animation="fadeIn" duration={800} style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <CustomText style={styles.avatarText}>{initials}</CustomText>
            </View>
          </View>
          <CustomText style={styles.userName}>{fullName}</CustomText>
          <CustomText style={styles.userRole}>{userData?.email || 'لا يوجد بريد مسجل'}</CustomText>

          {/* Role & Status Badges */}
          <View style={styles.badgesRow}>
            <View style={styles.roleBadge}>
              <CustomText style={styles.roleBadgeText}>{roleLabel}</CustomText>
            </View>
            <View style={styles.statusBadge}>
              <CustomText style={styles.statusBadgeText}>✓ {statusLabel}</CustomText>
            </View>
            {userData?.userId ? (
              <View
                style={[styles.roleBadge, { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }]}
              >
                <CustomText style={[styles.roleBadgeText, { color: '#64748B' }]}>
                  #{userData.userId}
                </CustomText>
              </View>
            ) : null}
          </View>

          {/* Edit Profile CTA Button */}
          <TouchableOpacity
            style={styles.editProfileCta}
            activeOpacity={0.8}
            onPress={() => navigation.navigate(ScreenNames.EditProfileScreen)}
          >
            <Icon name="pencil" size={hp(1.8)} color={COLORS.mainOrange} />
            <CustomText style={styles.editProfileCtaText}>تعديل الملف الشخصي</CustomText>
          </TouchableOpacity>
        </Animatable.View>

        <View style={styles.form}>
          {/* Basic Info */}
          <View style={styles.infoBox}>
            <CustomText style={styles.sectionTitle}>المعلومات الأساسية</CustomText>

            <View style={styles.infoRow}>
              <Icon name="account" size={hp(2.2)} color={COLORS.gray} />
              <View style={styles.infoCol}>
                <CustomText style={styles.infoLabel}>الاسم الكامل</CustomText>
                <CustomText style={styles.infoValue}>{fullName}</CustomText>
              </View>
            </View>

            {userData?.birthDate ? (
              <View style={styles.infoRow}>
                <Icon name="calendar" size={hp(2.2)} color={COLORS.gray} />
                <View style={styles.infoCol}>
                  <CustomText style={styles.infoLabel}>تاريخ الميلاد</CustomText>
                  <CustomText style={styles.infoValue}>
                    {new Date(userData.birthDate).toLocaleDateString('ar-EG')}
                  </CustomText>
                </View>
              </View>
            ) : null}
          </View>

          {/* Contact Info */}
          <View style={[styles.infoBox, { marginTop: hp(2) }]}>
            <CustomText style={styles.sectionTitle}>معلومات الاتصال</CustomText>

            <View style={styles.infoRow}>
              <Icon name="email" size={hp(2.2)} color={COLORS.gray} />
              <View style={styles.infoCol}>
                <CustomText style={styles.infoLabel}>البريد الإلكتروني</CustomText>
                <CustomText style={styles.infoValue}>{userData?.email || '—'}</CustomText>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Icon name="phone" size={hp(2.2)} color={COLORS.gray} />
              <View style={styles.infoCol}>
                <CustomText style={styles.infoLabel}>رقم الهاتف</CustomText>
                <CustomText style={styles.infoValue}>{userData?.phoneNumber || '—'}</CustomText>
              </View>
            </View>

            {userData?.oliveryContactMobile ? (
              <View style={styles.infoRow}>
                <Icon name="cellphone-check" size={hp(2.2)} color={COLORS.gray} />
                <View style={styles.infoCol}>
                  <CustomText style={styles.infoLabel}>رقم هاتف التواصل (Olivery)</CustomText>
                  <CustomText style={styles.infoValue}>{userData.oliveryContactMobile}</CustomText>
                </View>
              </View>
            ) : null}

            {userData?.cliqNumber ? (
              <View style={styles.infoRow}>
                <Icon name="bank" size={hp(2.2)} color={COLORS.gray} />
                <View style={styles.infoCol}>
                  <CustomText style={styles.infoLabel}>رقم كليك (Cliq Number)</CustomText>
                  <CustomText style={styles.infoValue}>{userData.cliqNumber}</CustomText>
                </View>
              </View>
            ) : null}

            <View style={styles.infoRow}>
              <Icon name="currency-usd" size={hp(2.2)} color={COLORS.mainOrange} />
              <View style={styles.infoCol}>
                <CustomText style={styles.infoLabel}>رصيد المحفظة (دولار)</CustomText>
                <CustomText
                  style={[
                    styles.infoValue,
                    { color: COLORS.mainOrange, fontFamily: 'Montserrat-Bold' },
                  ]}
                >
                  {userData?.dollarBalance !== null && userData?.dollarBalance !== undefined
                    ? `${Number(userData.dollarBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`
                    : '0.00 $'}
                </CustomText>
              </View>
            </View>
          </View>

          {/* Location & Address */}
          <View style={[styles.infoBox, { marginTop: hp(2) }]}>
            <CustomText style={styles.sectionTitle}>الموقع والعنوان</CustomText>

            <View style={styles.infoRow}>
              <Icon name="earth" size={hp(2.2)} color={COLORS.gray} />
              <View style={styles.infoCol}>
                <CustomText style={styles.infoLabel}>الدولة</CustomText>
                <CustomText style={styles.infoValue}>{userData?.country || '—'}</CustomText>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Icon name="map-marker" size={hp(2.2)} color={COLORS.gray} />
              <View style={styles.infoCol}>
                <CustomText style={styles.infoLabel}>العنوان بالتفصيل</CustomText>
                <CustomText style={styles.infoValue}>{userData?.address || '—'}</CustomText>
              </View>
            </View>
          </View>
        </View>

        {/* Logout */}
        <View style={styles.saveSection}>
          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.8}
            onPress={() => {
              dispatch(logout());
            }}
          >
            <Icon name="logout" size={hp(2.2)} color="#e74c3c" />
            <CustomText style={styles.logoutText}>تسجيل الخروج</CustomText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
