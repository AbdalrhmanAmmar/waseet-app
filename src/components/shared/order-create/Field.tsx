import { TextInput, View, type TextInputProps } from 'react-native';
import Text from '../CustomText';
import { s } from './styles';
export function Field({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        {...props}
        style={[s.input, !!error && s.invalid, props.style]}
      />
      {!!error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
    </View>
  );
}
