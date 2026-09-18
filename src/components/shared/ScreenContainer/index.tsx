import { COLORS } from '@/theme/index';
import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenContainerProps = {
  children?: React.ReactNode;
  style?: any;
  edges?: string[];
  backgroundColor?: string;
  statusBarTranslucent?: boolean;
  barStyle?: 'default' | 'light-content' | 'dark-content';
};

const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  style,
  edges = ['top'],
  backgroundColor = COLORS.pageColor,
  statusBarTranslucent = true,
  barStyle = 'dark-content',
}) => {
  const insets = useSafeAreaInsets();

  const insetStyle: import('react-native').ViewStyle = {};
  if (edges.includes('top')) insetStyle.paddingTop = insets.top;
  if (edges.includes('bottom')) insetStyle.paddingBottom = insets.bottom;
  if (edges.includes('left')) insetStyle.paddingLeft = insets.left;
  if (edges.includes('right')) insetStyle.paddingRight = insets.right;

  return (
    <View style={[styles.container, { backgroundColor }, insetStyle, style]}>
      <StatusBar
        barStyle={barStyle}
        backgroundColor={statusBarTranslucent ? 'transparent' : backgroundColor}
        translucent={statusBarTranslucent}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ScreenContainer;
