import { styles } from '@/components/shared/AccountPendingModal/styles';
import CustomText from '@/components/shared/CustomText/index';
import { logout } from '@/store/slices/auth';
import { COLORS, hp } from '@/theme/index';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { Modal, StatusBar, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

const AccountPendingModal: React.FC = () => {
  const dispatch = useDispatch();
  const { userData, isLoggedIn } = useSelector((state: any) => state.AuthSlice);

  const isPending =
    isLoggedIn && (userData?.accountStatus === 'Pending' || userData?.status === 'Pending');

  if (!isPending) {
    return null;
  }

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <Modal visible={isPending} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.container}>
        <StatusBar backgroundColor="rgba(0,0,0,0.65)" barStyle="light-content" />
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Icon name="account-clock-outline" size={hp(5.5)} color={COLORS.primary} />
          </View>

          <View style={styles.badge}>
            <CustomText style={styles.badgeText}>قيد المراجعة • Pending</CustomText>
          </View>

          <CustomText style={styles.title}>الحساب بانتظار الموافقة</CustomText>

          <CustomText style={styles.description}>
            تم استلام طلب تسجيل حسابك بنجاح وهو قيد المراجعة حالياً من قِبل إدارة التطبيق. سيتم
            تفعيل حسابك فور التحقق من البيانات.
          </CustomText>

          <View style={styles.userInfoBox}>
            <View style={styles.infoRow}>
              <CustomText style={styles.infoLabel}>الاسم:</CustomText>
              <CustomText style={styles.infoValue}>
                {userData?.firstName} {userData?.lastName}
              </CustomText>
            </View>

            <View style={styles.infoRow}>
              <CustomText style={styles.infoLabel}>نوع الحساب:</CustomText>
              <CustomText style={styles.infoValue}>{userData?.role || 'مستخدم'}</CustomText>
            </View>

            {userData?.email && (
              <View style={styles.infoRow}>
                <CustomText style={styles.infoLabel}>البريد الإلكتروني:</CustomText>
                <CustomText style={styles.infoValue}>{userData?.email}</CustomText>
              </View>
            )}

            {userData?.phoneNumber && (
              <View style={styles.infoRow}>
                <CustomText style={styles.infoLabel}>رقم الهاتف:</CustomText>
                <CustomText style={styles.infoValue}>{userData?.phoneNumber}</CustomText>
              </View>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
              <CustomText style={styles.logoutText}>تسجيل الخروج</CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AccountPendingModal;
