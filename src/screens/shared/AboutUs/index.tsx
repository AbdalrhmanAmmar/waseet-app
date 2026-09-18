import { CustomText, HeaderComponent, ScreenContainer } from '@/components/shared/index';
import { COLORS, FONTS, hp, wp } from '@/theme/index';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import Images from '@/theme/images';
import { Image, ScrollView, StyleSheet, View } from 'react-native';

export default function AboutUs() {
  return (
    <ScreenContainer>
      <HeaderComponent title="عن التطبيق" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Image
              source={Images.brandLogo}
              style={{ width: 80, height: 80 }}
              accessibilityLabel="شعار وسيط"
            />
          </View>
          <CustomText style={styles.appName}>وسيط</CustomText>
          <CustomText style={styles.version}>الإصدار 1.0.0</CustomText>
        </View>

        <View style={styles.contentCard}>
          <CustomText style={styles.sectionTitle}>من نحن؟</CustomText>
          <CustomText style={styles.description}>
            وسيط يجمع التجار وفرق المبيعات والإدارة ومندوبي التوصيل في تطبيق واحد. تصفح المنتجات،
            جهّز طلبات العملاء، وتابع حالتها حسب صلاحيات حسابك.
          </CustomText>
        </View>

        <View style={styles.contentCard}>
          <CustomText style={styles.sectionTitle}>رؤيتنا</CustomText>
          <CustomText style={styles.description}>
            أن نكون الخيار الأول للتجارة الإلكترونية في المنطقة، من خلال تقديم حلول مبتكرة تلبي
            احتياجات السوق السوري وتدعم النمو الاقتصادي.
          </CustomText>
        </View>

        <View style={styles.featuresRow}>
          <View style={styles.featureItem}>
            <Icon name="shield-check-outline" size={hp(3)} color={COLORS.primary} />
            <CustomText style={styles.featureLabel}>حسابات وصلاحيات</CustomText>
          </View>
          <View style={styles.featureItem}>
            <Icon name="truck-delivery-outline" size={hp(3)} color={COLORS.primary} />
            <CustomText style={styles.featureLabel}>متابعة التوصيل</CustomText>
          </View>
          <View style={styles.featureItem}>
            <Icon name="headphones" size={hp(3)} color={COLORS.primary} />
            <CustomText style={styles.featureLabel}>دعم فني</CustomText>
          </View>
        </View>

        <View style={styles.footer}>
          <CustomText style={styles.copyright}>
            جميع الحقوق محفوظة © {new Date().getFullYear()}
          </CustomText>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: hp(5) },
  logoContainer: { alignItems: 'center', marginTop: hp(4), marginBottom: hp(4) },
  logoCircle: {
    width: hp(12),
    height: hp(12),
    borderRadius: hp(6),
    backgroundColor: '#EDF6F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(2),
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  appName: { fontSize: hp(2.4), fontFamily: FONTS.fontFamilyBold, color: COLORS.charcoal },
  version: {
    fontSize: hp(1.4),
    fontFamily: FONTS.fontFamilyRegular,
    color: COLORS.gray,
    marginTop: 4,
  },
  contentCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: wp(5),
    padding: hp(2),
    borderRadius: hp(2),
    marginBottom: hp(2),
    elevation: 1,
    shadowColor: COLORS.black,
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  sectionTitle: {
    fontSize: hp(1.8),
    fontFamily: FONTS.fontFamilyBold,
    color: COLORS.charcoal,
    marginBottom: hp(1),
    textAlign: 'right',
  },
  description: {
    fontSize: hp(1.5),
    fontFamily: FONTS.fontFamilyRegular,
    color: COLORS.darkgray,
    lineHeight: hp(2.5),
    textAlign: 'right',
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: hp(2),
    paddingHorizontal: wp(5),
  },
  featureItem: { alignItems: 'center' },
  featureLabel: {
    fontSize: hp(1.4),
    fontFamily: FONTS.fontFamilyMedium,
    color: COLORS.charcoal,
    marginTop: 5,
  },
  footer: { alignItems: 'center', marginTop: hp(4) },
  copyright: { fontSize: hp(1.3), fontFamily: FONTS.fontFamilyRegular, color: COLORS.gray },
});
