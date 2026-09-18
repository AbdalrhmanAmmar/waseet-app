import { styles } from '@/components/shared/CustomText/styles';
import React from 'react';
import { Text } from 'react-native';

type CustomTextProps = {
  text?: any;
  style?: any;
  numberOfLines?: number;
  children?: React.ReactNode;
};

const CustomText: React.FC<CustomTextProps> = ({ text, style, numberOfLines, children }) => {
  return (
    <Text style={[styles.text, style]} numberOfLines={numberOfLines}>
      {text}
      {children}
    </Text>
  );
};

export default CustomText;
