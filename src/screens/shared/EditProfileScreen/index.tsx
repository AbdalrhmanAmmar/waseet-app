import CountryPicker, { Country } from '@/components/shared/CountryPicker';
import {
  CustomText,
  CustomTextInput,
  GradientBtn,
  HeaderComponent,
  ScreenContainer,
} from '@/components/shared/index';
import { styles } from '@/screens/shared/EditProfileScreen/styles';
import { GetUserProfile, UpdateUserProfile } from '@/store/slices/auth';
import { COLORS, hp } from '@/theme/index';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Keyboard, ScrollView, TouchableOpacity, View } from 'react-native';
import * as Animatable from '@/components/shared/Motion';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';

export default function EditProfileScreen({ navigation }: { navigation: any }) {
  const dispatch = useDispatch<any>();
  const { userData } = useSelector((state: any) => state.AuthSlice);

  const [loading, setLoading] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [countryModalVisible, setCountryModalVisible] = useState(false);

  const { control, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      firstName: '',
      secondName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      country: '',
      address: '',
    },
  });
  const values = useWatch({ control });

  useEffect(() => {
    if (userData) {
      reset({
        firstName: userData.firstName || '',
        secondName: userData.secondName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phoneNumber: userData.phoneNumber || '',
        country: userData.country || '',
        address: userData.address || '',
      });
    }
  }, [userData, reset]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () =>
      setIsKeyboardOpen(true),
    );
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () =>
      setIsKeyboardOpen(false),
    );
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const onSave = async (formData: any) => {
    const userId = userData?.userId || userData?.id;
    if (!userId) {
      Toast.show({ type: 'error', text1: 'معرّف المستخدم غير متوفر' });
      return;
    }

    if (!formData.firstName?.trim()) {
      Toast.show({ type: 'error', text1: 'الاسم الأول مطلوب' });
      return;
    }

    // Only editable fields requested
    const payload = {
      firstName: formData.firstName?.trim() || '',
      secondName: formData.secondName?.trim() || '',
      lastName: formData.lastName?.trim() || '',
      phoneNumber: formData.phoneNumber?.trim() || '',
      country: formData.country?.trim() || '',
      address: formData.address?.trim() || '',
    };

    try {
      setLoading(true);
      const res = await dispatch(UpdateUserProfile({ userId: userId, data: payload })).unwrap();

      if (res?.isSuccess !== false) {
        Toast.show({ type: 'success', text1: 'تم تحديث الملف الشخصي بنجاح' });
        // Refresh profile in background
        dispatch(GetUserProfile(userId));
        navigation.goBack();
      } else {
        Toast.show({ type: 'error', text1: res?.message || 'فشل في حفظ التعديلات' });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: typeof err === 'string' ? err : err?.message || 'حدث خطأ أثناء التحديث',
      });
    } finally {
      setLoading(false);
    }
  };

  const initials = values.firstName ? values.firstName.charAt(0).toUpperCase() : 'U';

  return (
    <ScreenContainer backgroundColor="#F8FAFC">
      <HeaderComponent title="تعديل الملف الشخصي" />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: isKeyboardOpen ? hp(35) : hp(10) }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Card Header */}
        <Animatable.View animation="fadeInDown" style={styles.headerCard}>
          <View style={styles.avatarBox}>
            <CustomText style={styles.avatarText}>{initials}</CustomText>
          </View>
          <CustomText style={styles.headerTitle}>
            {values.firstName} {values.lastName}
          </CustomText>
          <CustomText style={styles.headerSubtitle}>تعديل معلومات الحساب الشخصية</CustomText>
        </Animatable.View>

        {/* Section 1: Names */}
        <Animatable.View animation="fadeInUp" delay={100} style={styles.formBox}>
          <CustomText style={styles.sectionTitle}>الاسم واللقب</CustomText>

          <CustomTextInput
            control={control as any}
            name="firstName"
            label="الاسم الأول *"
            placeholder="الاسم الأول"
            leftComponent={
              <Icon
                name="account-outline"
                size={hp(2.2)}
                color={COLORS.gray}
                style={{ marginRight: 8 }}
              />
            }
          />

          <CustomTextInput
            control={control as any}
            name="secondName"
            label="الاسم الثاني"
            placeholder="الاسم الثاني"
            leftComponent={
              <Icon
                name="account-outline"
                size={hp(2.2)}
                color={COLORS.gray}
                style={{ marginRight: 8 }}
              />
            }
          />

          <CustomTextInput
            control={control as any}
            name="lastName"
            label="اسم العائلة"
            placeholder="اسم العائلة"
            leftComponent={
              <Icon
                name="account-outline"
                size={hp(2.2)}
                color={COLORS.gray}
                style={{ marginRight: 8 }}
              />
            }
          />
        </Animatable.View>

        {/* Section 2: Contact & Address */}
        <Animatable.View animation="fadeInUp" delay={200} style={styles.formBox}>
          <CustomText style={styles.sectionTitle}>بيانات التواصل والموقع</CustomText>

          <CustomTextInput
            control={control as any}
            name="email"
            label="البريد الإلكتروني (للعرض فقط)"
            editable={false}
            placeholder="example@mail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            leftComponent={
              <Icon
                name="email-outline"
                size={hp(2.2)}
                color={COLORS.gray}
                style={{ marginRight: 8 }}
              />
            }
          />

          <CustomTextInput
            control={control as any}
            name="phoneNumber"
            label="رقم الهاتف *"
            placeholder="+201xxxxxxxxx"
            keyboardType="phone-pad"
            leftComponent={
              <Icon
                name="phone-outline"
                size={hp(2.2)}
                color={COLORS.gray}
                style={{ marginRight: 8 }}
              />
            }
          />

          <TouchableOpacity onPress={() => setCountryModalVisible(true)}>
            <View pointerEvents="none">
              <CustomTextInput
                control={control as any}
                name="country"
                label="الدولة *"
                placeholder="اختر الدولة"
                editable={false}
                leftComponent={
                  <Icon
                    name="earth"
                    size={hp(2.2)}
                    color={COLORS.gray}
                    style={{ marginRight: 8 }}
                  />
                }
              />
            </View>
          </TouchableOpacity>

          <CountryPicker
            countryCode="SY"
            withFilter
            withFlag
            withCountryNameButton={false}
            visible={countryModalVisible}
            onClose={() => setCountryModalVisible(false)}
            onSelect={(country: Country) => {
              setValue('country', (country.name as string) || '');
              setCountryModalVisible(false);
            }}
          />

          <CustomTextInput
            control={control as any}
            name="address"
            label="العنوان بالتفصيل"
            placeholder="أدخل العنوان بالتفصيل..."
            leftComponent={
              <Icon
                name="map-marker-outline"
                size={hp(2.2)}
                color={COLORS.gray}
                style={{ marginRight: 8 }}
              />
            }
          />
        </Animatable.View>

        {/* Submit Button */}
        <Animatable.View animation="fadeInUp" delay={300} style={styles.btnContainer}>
          <GradientBtn text="حفظ التعديلات" onPress={handleSubmit(onSave)} isLoading={loading} />
        </Animatable.View>
      </ScrollView>
    </ScreenContainer>
  );
}
