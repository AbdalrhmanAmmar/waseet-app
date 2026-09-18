import { useState, type Ref } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import Text from '@/components/shared/CustomText';
import { loginColors as p, styles as s } from './styles';

type Props = TextInputProps & {
  label: string;
  icon: 'email-outline' | 'lock-outline';
  error?: string;
  inputRef: Ref<TextInput>;
  trailing?: React.ReactNode;
};

export function LoginField({ label, icon, error, inputRef, trailing, ...input }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <View style={[s.inputRow, focused && s.focusedInput, !!error && s.invalidInput]}>
        <Icon name={icon} size={22} color={focused ? p.primary : p.muted} accessible={false} />
        <TextInput
          {...input}
          ref={inputRef}
          accessibilityLabel={label}
          aria-invalid={!!error}
          placeholderTextColor="#92999F"
          style={[s.input, !!input.value && s.enteredInput]}
          onFocus={(event) => {
            setFocused(true);
            input.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            input.onBlur?.(event);
          }}
        />
        {trailing}
      </View>
      {!!error && (
        <Text accessibilityRole="alert" style={s.fieldError}>
          {error}
        </Text>
      )}
    </View>
  );
}
