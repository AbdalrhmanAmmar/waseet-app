import { useDeliveryAreasQuery } from '@/api/shared/catalog';
import { AsyncState } from '@/components/shared/AsyncState';
import type { Role } from '@/auth/roles';
import CountryPicker, { Country, CountryCode } from '@/components/shared/CountryPicker';
import { CustomText, CustomTextInput } from '@/components/shared/index';
import { ScreenNames } from '@/navigation/ScreenNames';
import { signUpSchema } from '@/schemas/auth';
import { styles } from '@/screens/auth/SignUp/styles';
import { SignUp } from '@/store/slices/auth';
import { COLORS, hp, Images } from '@/theme/index';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { yupResolver } from '@hookform/resolvers/yup';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Keyboard,
  Modal,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';

type RoleType = Role;

const SignUpScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { isLoading } = useSelector((state: any) => state.AuthSlice);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userRole, setUserRole] = useState<RoleType>('Merchant');
  const areas = useDeliveryAreasQuery(undefined, { skip: userRole !== 'DeliveryAgent' });
  const cities = areas.data ?? [];

  // City Picker state for DeliveryAgent
  const [cityModalVisible, setCityModalVisible] = useState(false);

  // Custom Date Picker state
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [tempDate, setTempDate] = useState({
    day: new Date().getDate().toString(),
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear().toString(),
  });

  // Country Picker state for Phone
  const [countryCode, setCountryCode] = useState<CountryCode>('SY');
  const [callingCode, setCallingCode] = useState('963');
  const [countryModalVisible, setCountryModalVisible] = useState(false);

  const dispatch: any = useDispatch();

  const { control, handleSubmit, setValue } = useForm({
    resolver: yupResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      secondName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      country: 'syria',
      city: '',
      oliveryContactMobile: '',
      address: '',
      password: '',
      confirmPassword: '',
      birthDate: new Date().toISOString(),
    },
  });
  const values = useWatch({ control });

  const onSignUp = (data: any) => {
    if (userRole === 'DeliveryAgent' && !data.city?.trim()) {
      Toast.show({ type: 'error', text1: 'يرجى اختيار المدينة لمندوب التوصيل' });
      return;
    }

    if (userRole === 'Merchant') {
      const mobile = data.oliveryContactMobile?.trim();
      if (!mobile) {
        Toast.show({ type: 'error', text1: 'رقم هاتف أوليفر (Olivery) مطلوب للتاجر' });
        return;
      }
      if (!/^\d{10}$/.test(mobile)) {
        Toast.show({ type: 'error', text1: 'يجب أن يتكون رقم هاتف أوليفر من 10 أرقام' });
        return;
      }
    }

    const { confirmPassword, ...rest } = data;
    const payload: any = {
      ...rest,
      phoneNumber: `+${callingCode}${data.phoneNumber}`,
      role: userRole,
    };

    if (userRole !== 'DeliveryAgent') {
      delete payload.city;
    }

    if (userRole !== 'Merchant') {
      delete payload.oliveryContactMobile;
      delete payload.OliveryContactMobile;
    } else {
      payload.OliveryContactMobile = data.oliveryContactMobile;
      payload.oliveryContactMobile = data.oliveryContactMobile;
    }

    dispatch(SignUp(payload))
      .unwrap()
      .then((res: any) => {
        if (res?.isSuccess) {
          Toast.show({ type: 'success', text1: 'تم إنشاء الحساب بنجاح، يرجى تسجيل الدخول' });
          navigation.navigate(ScreenNames.Login);
        } else {
          const msg = res?.message || res?.title || 'فشل في إنشاء الحساب';
          Toast.show({ type: 'error', text1: msg });
        }
      })
      .catch((err: any) => {
        const errorMsg =
          typeof err === 'string'
            ? err
            : err?.message || err?.title || err?.data?.message || 'فشل في إنشاء الحساب';
        Toast.show({ type: 'error', text1: errorMsg });
      });
  };

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

  const handleConfirmDate = () => {
    const date = new Date(
      parseInt(tempDate.year),
      parseInt(tempDate.month) - 1,
      parseInt(tempDate.day),
    );
    setValue('birthDate', date.toISOString());
    setDateModalVisible(false);
  };

  const ROLES: { id: RoleType; title: string; icon: React.ComponentProps<typeof Icon>['name'] }[] =
    [
      { id: 'Merchant', title: 'تاجر', icon: 'storefront-outline' },
      { id: 'SalesEmployee', title: 'موظف مبيعات', icon: 'account-tie-outline' },
      { id: 'ManagementEmployee', title: 'موظف إدارة', icon: 'briefcase-outline' },
      { id: 'DeliveryAgent', title: 'مندوب توصيل', icon: 'truck-delivery-outline' },
    ];

  const renderUserTypeCard = (role: {
    id: RoleType;
    title: string;
    icon: React.ComponentProps<typeof Icon>['name'];
  }) => {
    const isActive = userRole === role.id;
    return (
      <TouchableOpacity
        key={role.id}
        style={[styles.userTypeCard, isActive && styles.userTypeCardActive]}
        onPress={() => setUserRole(role.id)}
        activeOpacity={0.8}
      >
        <Icon
          name={role.icon}
          size={hp(2.2)}
          color={isActive ? COLORS.mainOrange : '#64748B'}
          style={styles.userTypeIcon}
        />
        <CustomText
          style={[styles.userTypeTitle, isActive && styles.userTypeTitleActive]}
          numberOfLines={1}
        >
          {role.title}
        </CustomText>
        {isActive && (
          <Icon
            name="check-circle"
            size={hp(1.8)}
            color={COLORS.mainOrange}
            style={styles.userTypeCheck}
          />
        )}
      </TouchableOpacity>
    );
  };

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => (currentYear - i).toString());

  return (
    <ImageBackground source={Images.auth_bg} style={styles.bg} resizeMode="cover">
      <View style={styles.overlay}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Icon name="chevron-right" size={hp(2.8)} color={COLORS.charcoal} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, isKeyboardOpen && styles.scrollKeyboard]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand Logo Header */}
          <Animatable.View animation="fadeInDown" duration={800} style={styles.brand}>
            <View style={styles.logoCircle}>
              <Icon name="account-plus" size={hp(3.8)} color={COLORS.mainOrange} />
            </View>
          </Animatable.View>

          <Animatable.View animation="fadeInUp" duration={1000} style={styles.content}>
            <CustomText style={styles.title}>إنشاء حساب جديد</CustomText>
            <CustomText style={styles.subtitle}>انضم إلينا وابدأ رحلتك بسهولة</CustomText>

            {/* Section 1: Role / User Type */}
            <View style={styles.sectionGroup}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconBox}>
                  <Icon name="account-cog-outline" size={hp(2)} color={COLORS.mainOrange} />
                </View>
                <CustomText style={styles.sectionTitleText}>نوع الحساب</CustomText>
              </View>
              <View style={styles.userTypeRow}>
                {ROLES.map((role) => renderUserTypeCard(role))}
              </View>
            </View>

            {/* Section 2: Personal Information */}
            <View style={styles.sectionGroup}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconBox}>
                  <Icon
                    name="card-account-details-outline"
                    size={hp(2)}
                    color={COLORS.mainOrange}
                  />
                </View>
                <CustomText style={styles.sectionTitleText}>البيانات الشخصية</CustomText>
              </View>

              <View style={styles.inputsRow}>
                <View style={styles.inputFlex}>
                  <CustomTextInput
                    control={control}
                    name="firstName"
                    label="الاسم الأول"
                    placeholder="الاسم الأول"
                  />
                </View>
                <View style={styles.inputFlex}>
                  <CustomTextInput
                    control={control}
                    name="secondName"
                    label="الاسم الثاني"
                    placeholder="الاسم الثاني"
                  />
                </View>
              </View>

              <CustomTextInput
                control={control}
                name="lastName"
                label="اسم العائلة"
                placeholder="اسم العائلة"
                leftComponent={
                  <Icon
                    name="account-outline"
                    size={hp(2.4)}
                    color="#757D85"
                    style={styles.inputIcon}
                  />
                }
              />

              <TouchableOpacity onPress={() => setDateModalVisible(true)} activeOpacity={0.8}>
                <View pointerEvents="none">
                  <CustomTextInput
                    control={control}
                    name="birthDate"
                    label="تاريخ الميلاد"
                    placeholder="اختر تاريخ ميلادك"
                    editable={false}
                    value={
                      values.birthDate
                        ? new Date(values.birthDate ?? '').toLocaleDateString('ar-EG')
                        : ''
                    }
                    leftComponent={
                      <Icon
                        name="calendar-outline"
                        size={hp(2.4)}
                        color="#757D85"
                        style={styles.inputIcon}
                      />
                    }
                    rightComponent={
                      <Icon
                        name="calendar-month-outline"
                        size={hp(2.2)}
                        color={COLORS.mainOrange}
                      />
                    }
                  />
                </View>
              </TouchableOpacity>
            </View>

            {/* Section 3: Contact & Location Information */}
            <View style={styles.sectionGroup}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconBox}>
                  <Icon name="map-marker-radius-outline" size={hp(2)} color={COLORS.mainOrange} />
                </View>
                <CustomText style={styles.sectionTitleText}>بيانات التواصل والموقع</CustomText>
              </View>

              <CustomTextInput
                control={control}
                name="email"
                label="البريد الإلكتروني"
                placeholder="example@mail.com"
                keyboardType="email-address"
                autoCapitalize="none"
                leftComponent={
                  <Icon
                    name="email-outline"
                    size={hp(2.4)}
                    color="#757D85"
                    style={styles.inputIcon}
                  />
                }
              />

              <CustomTextInput
                control={control}
                name="phoneNumber"
                label="رقم الهاتف"
                placeholder="أدخل رقم الهاتف"
                keyboardType="phone-pad"
                leftComponent={
                  <View style={styles.countryPickerBox}>
                    <CountryPicker
                      theme={{ fontFamily: 'Montserrat-Regular', fontSize: hp(1.8) }}
                      countryCode={countryCode}
                      withFilter
                      withFlag
                      withCallingCode
                      onSelect={(country: Country) => {
                        setCountryCode(country.cca2);
                        setCallingCode(country.callingCode[0]);
                      }}
                    />
                    <CustomText style={styles.countryCode}>+{callingCode}</CustomText>
                  </View>
                }
              />

              <TouchableOpacity onPress={() => setCountryModalVisible(true)} activeOpacity={0.8}>
                <View pointerEvents="none">
                  <CustomTextInput
                    control={control}
                    name="country"
                    label="الدولة"
                    placeholder="اختر دولتك"
                    editable={false}
                    leftComponent={
                      <Icon name="earth" size={hp(2.4)} color="#757D85" style={styles.inputIcon} />
                    }
                    rightComponent={
                      <Icon name="chevron-down" size={hp(2.2)} color={COLORS.mainOrange} />
                    }
                  />
                </View>
              </TouchableOpacity>

              <View style={styles.hiddenCountryPicker}>
                <CountryPicker
                  countryCode={countryCode}
                  withFilter
                  withFlag
                  withCountryNameButton={false}
                  visible={countryModalVisible}
                  onClose={() => setCountryModalVisible(false)}
                  onSelect={(country: Country) => {
                    setValue('country', country.name as string);
                    setCountryModalVisible(false);
                  }}
                />
              </View>

              {userRole === 'DeliveryAgent' && (
                <View>
                  <View>
                    <CustomTextInput
                      control={control}
                      name="city"
                      label="المدينة (منطقة التوصيل)"
                      placeholder="أدخل المدينة"
                      value={values.city ?? ''}
                      leftComponent={
                        <Icon
                          name="city-variant-outline"
                          size={hp(2.4)}
                          color="#757D85"
                          style={styles.inputIcon}
                        />
                      }
                      rightComponent={
                        <Icon name="chevron-down" size={hp(2.2)} color={COLORS.mainOrange} />
                      }
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => setCityModalVisible(true)}
                    style={{ padding: 10 }}
                  >
                    <CustomText>اختيار مدينة من مناطق التوصيل</CustomText>
                  </TouchableOpacity>
                </View>
              )}

              {userRole === 'Merchant' && (
                <CustomTextInput
                  control={control}
                  name="oliveryContactMobile"
                  label="رقم هاتف أوليفر للاستلام"
                  placeholder="09xxxxxxxx (10 أرقام)"
                  keyboardType="phone-pad"
                  maxLength={10}
                  leftComponent={
                    <Icon
                      name="phone-outgoing-outline"
                      size={hp(2.4)}
                      color="#757D85"
                      style={styles.inputIcon}
                    />
                  }
                />
              )}

              <CustomTextInput
                control={control}
                name="address"
                label="العنوان بالتفصيل"
                placeholder="أدخل عنوانك بالتفصيل"
                leftComponent={
                  <Icon
                    name="map-marker-outline"
                    size={hp(2.4)}
                    color="#757D85"
                    style={styles.inputIcon}
                  />
                }
              />
            </View>

            {/* Section 4: Security & Password */}
            <View style={styles.sectionGroup}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconBox}>
                  <Icon name="shield-lock-outline" size={hp(2)} color={COLORS.mainOrange} />
                </View>
                <CustomText style={styles.sectionTitleText}>الأمان وكلمة المرور</CustomText>
              </View>

              <CustomTextInput
                control={control}
                name="password"
                label="كلمة المرور"
                placeholder="أدخل كلمة المرور"
                secureTextEntry={!showPassword}
                leftComponent={
                  <Icon
                    name="lock-outline"
                    size={hp(2.4)}
                    color="#757D85"
                    style={styles.inputIcon}
                  />
                }
                rightComponent={
                  <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                    <Icon
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={hp(2.4)}
                      color="#757D85"
                    />
                  </TouchableOpacity>
                }
              />

              <CustomTextInput
                control={control}
                name="confirmPassword"
                label="تأكيد كلمة المرور"
                placeholder="تأكيد كلمة المرور"
                secureTextEntry={!showConfirmPassword}
                leftComponent={
                  <Icon
                    name="lock-check-outline"
                    size={hp(2.4)}
                    color="#757D85"
                    style={styles.inputIcon}
                  />
                }
                rightComponent={
                  <TouchableOpacity onPress={() => setShowConfirmPassword((v) => !v)}>
                    <Icon
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={hp(2.4)}
                      color="#757D85"
                    />
                  </TouchableOpacity>
                }
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSubmit(onSignUp)}
              disabled={isLoading}
              style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Icon name="arrow-right" size={hp(2.2)} color={COLORS.white} />
                  <CustomText style={styles.submitText}>إنشاء الحساب</CustomText>
                </>
              )}
            </TouchableOpacity>

            {/* Login Navigation Link */}
            <View style={styles.loginRow}>
              <CustomText style={styles.loginHint}>لديك حساب بالفعل؟ </CustomText>
              <TouchableOpacity
                onPress={() => navigation.navigate(ScreenNames.Login)}
                activeOpacity={0.7}
              >
                <CustomText style={styles.loginLink}>تسجيل الدخول</CustomText>
              </TouchableOpacity>
            </View>
          </Animatable.View>
        </ScrollView>

        {/* City Selection Modal for DeliveryAgent */}
        <Modal
          visible={cityModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setCityModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setCityModalVisible(false)}>
                  <Icon name="close" size={hp(2.6)} color={COLORS.charcoal} />
                </TouchableOpacity>
                <CustomText style={styles.modalTitle}>اختر المدينة (منطقة التوصيل)</CustomText>
                <View style={styles.modalHeaderSpacer} />
              </View>

              <FlatList
                ListHeaderComponent={
                  <AsyncState
                    loading={areas.isLoading}
                    error={areas.error}
                    onRetry={areas.refetch}
                  />
                }
                data={cities}
                keyExtractor={(item) => String(item.deliveryAreaId || item.city)}
                contentContainerStyle={styles.cityListContainer}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const cityName = item.city;
                  const isSelected = values.city === cityName;
                  return (
                    <TouchableOpacity
                      style={[styles.cityItem, isSelected && styles.cityItemSelected]}
                      onPress={() => {
                        setValue('city', cityName);
                        setCityModalVisible(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.cityItemLeft}>
                        <View
                          style={[styles.cityIconBox, isSelected && styles.cityIconBoxSelected]}
                        >
                          <Icon
                            name="map-marker-outline"
                            size={hp(2.2)}
                            color={isSelected ? COLORS.mainOrange : COLORS.gray}
                          />
                        </View>
                        <CustomText
                          style={[styles.cityName, isSelected && styles.cityNameSelected]}
                        >
                          {cityName}
                        </CustomText>
                      </View>

                      {isSelected && (
                        <Icon name="check-circle" size={hp(2.4)} color={COLORS.mainOrange} />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </View>
        </Modal>

        {/* Custom Date Modal */}
        <Modal visible={dateModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setDateModalVisible(false)}>
                  <CustomText style={styles.cancelText}>إلغاء</CustomText>
                </TouchableOpacity>
                <CustomText style={styles.modalTitle}>اختر تاريخ الميلاد</CustomText>
                <TouchableOpacity onPress={handleConfirmDate}>
                  <CustomText style={styles.confirmText}>تأكيد</CustomText>
                </TouchableOpacity>
              </View>

              <View style={styles.pickerRow}>
                <View style={styles.pickerContainer}>
                  <CustomText style={styles.pickerLabel}>اليوم</CustomText>
                  <Picker
                    selectedValue={tempDate.day}
                    onValueChange={(itemValue) =>
                      setTempDate((prev) => ({ ...prev, day: itemValue }))
                    }
                    style={styles.picker}
                    dropdownIconColor={COLORS.mainOrange}
                  >
                    {days.map((d) => (
                      <Picker.Item key={d} label={d} value={d} />
                    ))}
                  </Picker>
                </View>

                <View style={styles.pickerContainer}>
                  <CustomText style={styles.pickerLabel}>الشهر</CustomText>
                  <Picker
                    selectedValue={tempDate.month}
                    onValueChange={(itemValue) =>
                      setTempDate((prev) => ({ ...prev, month: itemValue }))
                    }
                    style={styles.picker}
                    dropdownIconColor={COLORS.mainOrange}
                  >
                    {months.map((m) => (
                      <Picker.Item key={m} label={m} value={m} />
                    ))}
                  </Picker>
                </View>

                <View style={styles.pickerContainer}>
                  <CustomText style={styles.pickerLabel}>السنة</CustomText>
                  <Picker
                    selectedValue={tempDate.year}
                    onValueChange={(itemValue) =>
                      setTempDate((prev) => ({ ...prev, year: itemValue }))
                    }
                    style={styles.picker}
                    dropdownIconColor={COLORS.mainOrange}
                  >
                    {years.map((y) => (
                      <Picker.Item key={y} label={y} value={y} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
};

export default SignUpScreen;
