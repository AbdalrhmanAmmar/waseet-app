import { styles } from './styles';
import { Text, type TextProps } from 'react-native';
export default function CustomText({
  text,
  style,
  children,
  ...props
}: TextProps & { text?: React.ReactNode }) {
  return (
    <Text {...props} style={[styles.text, style]}>
      {text}
      {children}
    </Text>
  );
}
