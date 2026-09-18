import CustomText from '@/components/shared/CustomText/index';
import { COLORS, FONTS, hp, wp } from '@/theme/index';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface OrderCardProps {
  order: {
    id: string | number;
    customer?: string;
    total: string | number;
    status: string;
    date: string;
  };
  onPress: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onPress }) => {
  const statusColor = order.status === 'تم التوصيل' ? '#2A8A76' : '#F59E0B';
  const statusBg = order.status === 'تم التوصيل' ? '#E6F8F4' : '#FFF7ED';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.iconBox, { backgroundColor: statusBg }]}>
        <Icon name="package-variant" size={hp(2.4)} color={COLORS.mainOrange} />
      </View>
      <View style={styles.info}>
        <CustomText style={styles.customer}>{order.customer || `طلب #${order.id}`}</CustomText>
        <CustomText style={styles.date}>{order.date}</CustomText>
      </View>
      <View style={styles.amountBox}>
        <CustomText style={styles.amount}>{order.total}</CustomText>
        <CustomText style={[styles.status, { color: statusColor }]}>{order.status}</CustomText>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: hp(1.4),
    borderRadius: hp(1.6),
    marginBottom: hp(1.2),
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  iconBox: {
    width: hp(4.7),
    height: hp(4.7),
    borderRadius: hp(1.2),
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { flex: 1, marginStart: wp(3) },
  customer: { fontSize: hp(1.6), fontFamily: FONTS.fontFamilyBold, color: COLORS.charcoal },
  date: {
    fontSize: hp(1.3),
    fontFamily: FONTS.fontFamilyRegular,
    color: COLORS.darkgray2,
    marginTop: 2,
  },
  amountBox: { alignItems: 'flex-end' },
  amount: { fontSize: hp(1.6), fontFamily: FONTS.fontFamilyBold, color: COLORS.charcoal },
  status: { fontSize: hp(1.2), fontFamily: FONTS.fontFamilyBold, marginTop: 2 },
});

export default OrderCard;
