import { COLORS, FONTS, hp } from '@/theme/index';
import { useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

export default function OTPInput({
  length = 4,
  otp,
  setOtp,
}: {
  length?: number;
  otp: string[];
  setOtp: (value: string[]) => void;
}) {
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text.slice(-1);
    setOtp(newOtp);
    if (text && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = ({ nativeEvent }: { nativeEvent: { key: string } }, index: number) => {
    if (nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.otpRow}>
      {otp.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            inputs.current[index] = ref;
          }}
          style={[styles.otpBox, !!digit && styles.otpBoxFilled]}
          value={digit}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          keyboardType="number-pad"
          maxLength={1}
          textAlign="center"
          selectionColor={COLORS.primary}
          placeholder="—"
          placeholderTextColor="#D1D5DB"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: hp(1.2),
    gap: hp(0.9),
  },
  otpBox: {
    flex: 1,
    height: hp(8.2),
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: hp(1.4),
    fontSize: hp(2.6),
    fontFamily: FONTS.fontFamilyBold,
    color: COLORS.charcoal,
    backgroundColor: '#F9FAFB',
  },
  otpBoxFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary100,
    color: COLORS.primary,
  },
});
