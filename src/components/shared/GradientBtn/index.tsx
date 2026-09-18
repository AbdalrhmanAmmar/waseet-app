import styles from '@/components/shared/GradientBtn/styles';
import LinearGradient from '@/components/shared/LinearGradient';
import Loading from '@/components/shared/Loading/index';
import { COLORS, PRIMARY_GRADIENT_END, PRIMARY_GRADIENT_START, wp } from '@/theme/index';
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

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
  colors = [COLORS.primary, '#f472b6'],
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
        style={styles.button}
        onPress={onPress}
        disabled={disabled || isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <Loading style={{ width: wp(2), height: wp(2), transform: [{ scale: 0.5 }] }} />
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
