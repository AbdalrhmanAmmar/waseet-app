import { backendFeatures, unavailableMessages } from '@/config/features';
import { UnavailableFeature } from '@/components/shared/UnavailableFeature';
import { CustomText } from '@/components/shared/index';
import { ScreenNames } from '@/navigation/ScreenNames';
import { COLORS, FONTS, Images, hp } from '@/theme/index';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState } from 'react';
import { ImageBackground, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import * as Animatable from '@/components/shared/Motion';

// Import Steps
import EnterEmail from '@/screens/auth/ForgetPassword/steps/EnterEmail';
import EnterOtp from '@/screens/auth/ForgetPassword/steps/EnterOtp';
import NewPassword from '@/screens/auth/ForgetPassword/steps/NewPassword';

const ForgetPasswordFlow: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  if (!backendFeatures.passwordReset)
    return (
      <UnavailableFeature title="استعادة كلمة المرور" message={unavailableMessages.passwordReset} />
    );

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleNext = (data?: string) => {
    if (step === 1 && typeof data === 'string') setEmail(data);
    if (step === 2 && typeof data === 'string') setCode(data);

    if (step < 3) {
      setStep(step + 1);
    } else {
      navigation.navigate(ScreenNames.Login);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <EnterEmail onNext={handleNext} navigation={navigation} />;
      case 2:
        return <EnterOtp onNext={handleNext} email={email} />;
      case 3:
        return <NewPassword onNext={handleNext} email={email} otp={code} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground source={Images.auth_bg} style={styles.bg} resizeMode="cover">
        <View style={styles.overlay}>
          <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

          {/* Common Header */}
          <Animatable.View animation="fadeInDown" duration={600} style={styles.headerContainer}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <Icon name="chevron-right" size={hp(3)} color={COLORS.charcoal} />
            </TouchableOpacity>

            <View style={styles.progressContainer}>
              <CustomText style={styles.stepText}>خطوة {step} من 3</CustomText>
              <View style={styles.progressBar}>
                <Animatable.View
                  style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]}
                  duration={400}
                  transition="width"
                />
              </View>
            </View>
          </Animatable.View>

          {/* Render Active Step Content */}
          <View style={styles.content}>{renderStep()}</View>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  bg: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(255,255,255,0.4)' },

  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: hp(3),
    paddingTop: hp(8),
    paddingBottom: hp(2),
    gap: hp(2),
  },
  backBtn: {
    width: hp(6),
    height: hp(6),
    borderRadius: hp(1.5),
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  progressContainer: {
    flex: 1,
  },
  stepText: {
    fontSize: hp(1.6),
    fontFamily: FONTS.fontFamilyBold,
    color: '#757D85',
    marginBottom: hp(0.8),
  },
  progressBar: {
    height: hp(0.8),
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: hp(1),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: hp(1),
  },
  content: {
    flex: 1,
  },
});

export default ForgetPasswordFlow;
