import { useReducedMotion } from '@/hooks/shared/use-reduced-motion';
import { useDeliveryAreasQuery } from '@/api/shared/catalog';
import { useCreateOrderMutation } from '@/api/shared/orders';
import { AsyncState } from '@/components/shared/AsyncState';
import {
  CustomText,
  CustomTextInput,
  GradientBtn,
  ScreenContainer,
} from '@/components/shared/index';
import { ScreenNames } from '@/navigation/ScreenNames';
import { styles } from '@/screens/shared/CheckoutScreen/styles';
import { clearCartLocal } from '@/store/slices/cart';
import { COLORS, hp } from '@/theme/index';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';

const PAYMENT_OPTIONS = [{ id: 'cash', label: 'دفع عند الاستلام', icon: 'cash-multiple' }];

export default function CheckoutScreen({ navigation, route }: { navigation: any; route: any }) {
  const reducedMotion = useReducedMotion();
  const dispatch = useDispatch<any>();
  const insets = useSafeAreaInsets();
  const { userCart } = useSelector((state: any) => state.cart);
  const subtotal = userCart.totalPrice;
  const cartItems = userCart.data;

  const deliveryAreas = useDeliveryAreasQuery();
  const [createOrder, { isLoading: createOrderLoading }] = useCreateOrderMutation();
  const submitting = React.useRef(false);

  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerArea, setCustomerArea] = useState('');
  const [selectedFee, setSelectedFee] = useState<number | null>(null);
  const estimatedTotal = selectedFee === null ? null : subtotal + selectedFee;
  const [customerAddress, setCustomerAddress] = useState('');
  const [areaModalVisible, setAreaModalVisible] = useState(false);
  const [payment, setPayment] = useState('cash');

  const areasList = deliveryAreas.data ?? [];

  const confirmOrder = async () => {
    if (submitting.current || createOrderLoading) return;
    if (!cartItems.length) {
      Toast.show({ type: 'error', text1: 'السلة فارغة' });
      return;
    }
    if (!areasList.length) {
      Toast.show({ type: 'error', text1: 'تعذر تحميل مناطق التوصيل' });
      return;
    }
    if (!customerName.trim()) {
      Toast.show({ type: 'error', text1: 'يرجى إدخال اسم العميل' });
      return;
    }
    const cleanMobile = customerMobile.replace(/\D/g, '');
    if (!cleanMobile) {
      Toast.show({ type: 'error', text1: 'يرجى إدخال رقم هاتف العميل' });
      return;
    }
    if (cleanMobile.length !== 10) {
      Toast.show({
        type: 'error',
        text1: 'رقم هاتف العميل يجب أن يتكون من 10 أرقام بالضبط (بدون رمز الدولة أو رموز)',
      });
      return;
    }
    if (!customerArea.trim()) {
      Toast.show({ type: 'error', text1: 'يرجى اختيار منطقة التوصيل' });
      return;
    }
    if (!customerAddress.trim()) {
      Toast.show({ type: 'error', text1: 'يرجى إدخال عنوان العميل' });
      return;
    }

    const items = cartItems.map((item: any) => ({
      productCode: Number(item.productCode || item.id || 0),
      quantity: Number(item.quantity || 1),
      actualSellPriceUSD: Number(item.sellingPrice ?? item.price ?? 0),
      ...(typeof item.color === 'string' ? { color: item.color } : {}),
    }));

    const orderPayload = {
      customerName: customerName.trim(),
      customerMobile: cleanMobile,
      customerArea: customerArea.trim(),
      customerAddress: customerAddress.trim(),
      items,
    };

    try {
      submitting.current = true;
      const res = await createOrder(orderPayload).unwrap();
      dispatch(clearCartLocal());
      Toast.show({ type: 'success', text1: 'تم إنشاء الطلب بنجاح' });
      navigation.replace(ScreenNames.OrderSuccess, {
        orderId: res?.orderId,
      });
    } catch (err: any) {
      const errorMessage = typeof err === 'string' ? err : err?.message || 'فشل في إنشاء الطلب';
      Alert.alert('تنبيه في الطلب', errorMessage, [{ text: 'حسناً' }]);
      Toast.show({
        type: 'error',
        text1: 'تنبيه في الطلب',
        text2: errorMessage,
        visibilityTime: 6000,
      });
    } finally {
      submitting.current = false;
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <AsyncState
          loading={deliveryAreas.isLoading}
          error={deliveryAreas.error}
          onRetry={deliveryAreas.refetch}
        />
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="رجوع"
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-right" size={hp(2.6)} color={COLORS.charcoal} />
          </TouchableOpacity>
          <CustomText style={styles.headerTitle}>إتمام الطلب</CustomText>
          <View style={{ width: hp(4.2) }} />
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Customer Details */}
          <CustomText style={styles.sectionLabel}>بيانات العميل</CustomText>
          <View style={styles.customerCard}>
            <CustomTextInput
              label="اسم العميل"
              placeholder="أدخل اسم العميل بالكامل"
              value={customerName}
              onChangeText={setCustomerName}
              containerStyle={{ marginBottom: hp(1.5) }}
            />

            <CustomTextInput
              label="رقم هاتف العميل (10 أرقام)"
              placeholder="09xxxxxxxx"
              keyboardType="phone-pad"
              maxLength={10}
              value={customerMobile}
              onChangeText={(text: string) => setCustomerMobile(text.replace(/\D/g, ''))}
              containerStyle={{ marginBottom: hp(1.5) }}
            />

            {/* Customer Area Picker */}
            <CustomText
              style={{
                fontSize: hp(1.5),
                color: '#334155',
                marginBottom: hp(0.6),
                fontFamily: 'Tajawal-Medium',
              }}
            >
              منطقة التوصيل
            </CustomText>
            <TouchableOpacity
              style={styles.areaPickerInput}
              onPress={() => setAreaModalVisible(true)}
              activeOpacity={0.8}
            >
              <CustomText
                style={customerArea ? styles.areaPickerText : styles.areaPickerPlaceholder}
              >
                {customerArea
                  ? `${customerArea}${selectedFee !== null ? ` (رسوم التوصيل: $${selectedFee})` : ''}`
                  : 'اختر منطقة التوصيل'}
              </CustomText>
              <Icon name="chevron-down" size={hp(2.4)} color="#64748B" />
            </TouchableOpacity>

            <CustomTextInput
              label="عنوان العميل"
              placeholder="أدخل عنوان التوصيل بالتفصيل (الشارع، البناء، الشقة...)"
              value={customerAddress}
              onChangeText={setCustomerAddress}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Payment method */}
          <CustomText style={styles.sectionLabel}>طريقة الدفع</CustomText>
          {PAYMENT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              style={[styles.optionCard, payment === opt.id && styles.optionCardActive]}
              onPress={() => setPayment(opt.id)}
              activeOpacity={0.8}
            >
              <View style={payment === opt.id ? styles.radioActive : styles.radio} />
              <View
                style={[
                  styles.optionIcon,
                  { backgroundColor: payment === opt.id ? COLORS.primary100 : COLORS.lightGray },
                ]}
              >
                <Icon
                  name={opt.icon as React.ComponentProps<typeof Icon>['name']}
                  size={hp(2.4)}
                  color={payment === opt.id ? COLORS.primary : COLORS.darkgray}
                />
              </View>
              <CustomText style={styles.optionLabel}>{opt.label}</CustomText>
            </TouchableOpacity>
          ))}

          {/* Order summary */}
          <CustomText style={styles.sectionLabel}>ملخص الطلب</CustomText>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <CustomText style={styles.summaryValue}>{subtotal.toFixed(2)} USD</CustomText>
              <CustomText style={styles.summaryLabel}>المجموع الفرعي</CustomText>
            </View>
            <View style={styles.summaryRow}>
              <CustomText style={styles.summaryValue}>
                {selectedFee === null ? 'تحدد عند تأكيد الطلب' : `${selectedFee.toFixed(2)} USD`}
              </CustomText>
              <CustomText style={styles.summaryLabel}>رسوم التوصيل</CustomText>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <CustomText style={styles.totalValue}>
                {estimatedTotal === null ? 'غير محدد بعد' : `${estimatedTotal.toFixed(2)} USD`}
              </CustomText>
              <CustomText style={styles.totalLabel}>الإجمالي التقديري</CustomText>
            </View>
          </View>
        </ScrollView>

        {/* Place Order Footer */}
        <View style={[styles.footer, { paddingBottom: (insets?.bottom || 0) + hp(1.4) }]}>
          <View style={styles.footerTotal}>
            <CustomText style={styles.footerTotalLabel}>إجمالي المنتجات</CustomText>
            <CustomText style={styles.footerTotalValue}>{subtotal.toFixed(2)} USD</CustomText>
          </View>

          <GradientBtn
            text={createOrderLoading ? 'جاري التنفيذ...' : 'تأكيد الطلب'}
            onPress={confirmOrder}
            containerStyle={styles.placeOrderBtn}
            textStyle={styles.placeOrderText}
            colors={[COLORS.primary, '#126B57']}
            isLoading={createOrderLoading}
            leftIcon={
              !createOrderLoading && (
                <Icon name="check-circle-outline" size={hp(2.1)} color={COLORS.white} />
              )
            }
          />
        </View>

        {/* Area Selection Modal */}
        <Modal
          visible={areaModalVisible}
          transparent
          animationType={reducedMotion ? 'none' : 'slide'}
          onRequestClose={() => setAreaModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <CustomText style={styles.modalTitle}>اختر منطقة التوصيل</CustomText>
                <TouchableOpacity onPress={() => setAreaModalVisible(false)}>
                  <Icon name="close" size={hp(2.4)} color={COLORS.charcoal} />
                </TouchableOpacity>
              </View>

              <FlatList
                data={areasList}
                keyExtractor={(item) => String(item.deliveryAreaId || item.city)}
                renderItem={({ item }) => {
                  const isSelected = customerArea === item.city;
                  return (
                    <TouchableOpacity
                      style={[styles.areaItem, isSelected && styles.areaItemActive]}
                      onPress={() => {
                        setCustomerArea(item.city);
                        setSelectedFee(item.fee);
                        setAreaModalVisible(false);
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Icon
                          name="map-marker-outline"
                          size={hp(2.2)}
                          color={isSelected ? COLORS.primary : '#64748B'}
                        />
                        <CustomText
                          style={[styles.areaItemText, isSelected && styles.areaItemTextActive]}
                        >
                          {item.city}
                        </CustomText>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {item.fee !== undefined && item.fee !== null && (
                          <CustomText
                            style={{
                              fontSize: hp(1.4),
                              color: COLORS.primary,
                              fontFamily: 'Tajawal-Bold',
                            }}
                          >
                            ${item.fee}
                          </CustomText>
                        )}
                        {isSelected && (
                          <Icon name="check-circle" size={hp(2.2)} color={COLORS.primary} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
