import styles from '@/components/shared/GradientBtn/styles';
import LinearGradient from '@/components/shared/LinearGradient';

import { COLORS, PRIMARY_GRADIENT_END, PRIMARY_GRADIENT_START } from '@/theme/index';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';

type Props = {
  onPress: () => void;
  text: string;
  colors?: string[];
  containerStyle?: import('react-native').StyleProp<import('react-native').ViewStyle>;
  textStyle?: import('react-native').StyleProp<import('react-native').TextStyle>;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  isLoading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};
const GradientBtn = ({
  onPress,
  text,
  colors = [COLORS.primary, '#126B57'],
  containerStyle,
  textStyle,
  start = PRIMARY_GRADIENT_START,
  end = PRIMARY_GRADIENT_END,
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
}: Props) => {
  return (
    <LinearGradient
      colors={colors}
      start={start}
      end={end}
      style={[styles.container, containerStyle]}
    >
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={text}
        accessibilityState={{ disabled: disabled || isLoading, busy: isLoading }}
        style={[styles.button, (disabled || isLoading) && { opacity: 0.6 }]}
        onPress={onPress}
        disabled={disabled || isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <>
            {!!rightIcon && rightIcon}
            <Text style={[styles.text, textStyle]}>{text}</Text>
            {!!leftIcon && leftIcon}
          </>
        )}
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default GradientBtn;
