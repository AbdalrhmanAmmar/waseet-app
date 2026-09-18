import { styles } from '@/components/shared/CustomTextInput/styles';
import { COLORS, hp } from '@/theme/index';
import React from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import {
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

interface CustomTextInputProps<
  T extends FieldValues,
  C,
  V extends FieldValues,
> extends TextInputProps {
  control?: Control<T, C, V>;
  name?: Path<T>;
  rules?: any;
  label?: string;
  required?: boolean;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
  errorStyle?: TextStyle;
  onPress?: () => void;
  footerText?: string;
  error?: any; // Added for cases where it's not used with Controller
}

const CustomTextInput = <
  T extends FieldValues = FieldValues,
  C = unknown,
  V extends FieldValues = T,
>({
  control,
  name,
  rules,
  label,
  required,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  leftComponent,
  rightComponent,
  containerStyle,
  labelStyle,
  inputStyle,
  errorStyle,
  style,
  onPress,
  footerText,
  error: manualError,
  ...rest
}: CustomTextInputProps<T, C, V>) => {
  const Wrapper = onPress ? TouchableOpacity : View;
  const renderInput = (inputValue: any, onInputChange: any, onInputBlur: any, error: any) => (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: hp(0.6),
            marginBottom: hp(0.8),
            width: '100%',
          }}
        >
          <Text style={[styles.label, labelStyle]}>{label}</Text>
          {required && <Text style={[styles.label, labelStyle, styles.requiredStar]}>*</Text>}
        </View>
      )}
      <Wrapper {...(onPress ? { onPress, activeOpacity: 0.7 } : {})}>
        <View
          style={[styles.inputWrapper, style, error && styles.inputError]}
          pointerEvents={onPress ? 'none' : 'auto'}
        >
          {leftComponent}
          <TextInput
            style={[styles.input, multiline && styles.textArea, inputStyle]}
            placeholder={placeholder}
            placeholderTextColor={COLORS.gray6 || '#999'}
            keyboardType={keyboardType}
            secureTextEntry={secureTextEntry}
            multiline={multiline}
            numberOfLines={numberOfLines}
            value={inputValue}
            onChangeText={onInputChange}
            onBlur={onInputBlur}
            {...rest}
          />
          {rightComponent}
        </View>
      </Wrapper>
      {footerText && !error && (
        <Text
          style={{
            fontSize: hp(1.4),
            color: '#757D85',
            marginTop: hp(0.8),
            fontFamily: 'Montserrat-Regular',
          }}
        >
          {footerText}
        </Text>
      )}
      {error && <Text style={[styles.errorText, errorStyle]}>{error.message || error}</Text>}
    </View>
  );

  if (control && name) {
    return (
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) =>
          renderInput(value, onChange, onBlur, error)
        }
      />
    );
  }

  return renderInput(rest.value, rest.onChangeText, rest.onBlur, manualError);
};

export default CustomTextInput;
