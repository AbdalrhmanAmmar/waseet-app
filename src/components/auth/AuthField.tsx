import { useId, useRef, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import Text from '@/components/shared/CustomText';
import { palette as p, typography as t } from '@/theme/tokens';
import { useAuthFieldFocus } from './AuthFormLayout';
type IconName = ComponentProps<typeof Icon>['name'];
export type AuthFieldProps = TextInputProps & {
  label: string;
  icon?: IconName;
  error?: string;
  hint?: string;
  success?: string;
  direction?: 'rtl' | 'ltr';
  password?: boolean;
  inputRef?: (input: TextInput | null) => void;
  trailing?: React.ReactNode;
};
export function AuthField({
  label,
  icon,
  error,
  hint,
  success,
  direction = 'rtl',
  password = false,
  inputRef,
  trailing,
  editable = true,
  style,
  ...input
}: AuthFieldProps) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [restoredSelection, setRestoredSelection] = useState<TextInputProps['selection']>();
  const native = useRef<TextInput | null>(null);
  const selection = useRef({ start: input.value?.length ?? 0, end: input.value?.length ?? 0 });
  const focusField = useAuthFieldFocus();
  const id = useId();
  const helper = error || success || hint;
  const toggle = () => {
    const cursor = selection.current;
    setVisible((current) => !current);
    setRestoredSelection({ ...cursor });
    requestAnimationFrame(() => {
      native.current?.focus();
    });
  };
  return (
    <View style={a.field}>
      <Text nativeID={`${id}-label`} style={a.label}>
        {label}
      </Text>
      <View style={[a.halo, focused && editable && !error && a.focusHalo]}>
        <View
          style={[
            a.frame,
            focused && editable && a.focusFrame,
            !!error && a.errorFrame,
            !editable && a.disabledFrame,
          ]}
        >
          {icon && (
            <Icon
              name={icon}
              size={21}
              color={error ? p.danger : focused ? p.primary : p.muted}
              accessible={false}
            />
          )}
          <TextInput
            {...input}
            ref={(element) => {
              native.current = element;
              inputRef?.(element);
            }}
            editable={editable}
            secureTextEntry={password ? !visible : input.secureTextEntry}
            accessibilityLabel={label}
            accessibilityHint={helper}
            aria-invalid={!!error}
            {...{ 'aria-describedby': helper ? `${id}-help` : undefined }}
            placeholderTextColor="#8B9990"
            selectionColor={p.primary}
            cursorColor={p.primary}
            selection={restoredSelection ?? input.selection}
            underlineColorAndroid="transparent"
            style={[
              a.input,
              (direction === 'ltr' || password) && a.ltr,
              input.multiline && a.multiline,
              !editable && { color: '#87948D' },
              style,
            ]}
            onFocus={(event) => {
              setFocused(true);
              if (native.current) focusField(native.current);
              input.onFocus?.(event);
            }}
            onBlur={(event) => {
              setFocused(false);
              input.onBlur?.(event);
            }}
            onSelectionChange={(event) => {
              selection.current = event.nativeEvent.selection;
              input.onSelectionChange?.(event);
            }}
            onChangeText={(value) => {
              setRestoredSelection(undefined);
              input.onChangeText?.(value);
            }}
          />
          {password ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${visible ? 'إخفاء' : 'إظهار'} ${label}`}
              accessibilityState={{ disabled: !editable }}
              disabled={!editable}
              onPress={toggle}
              style={({ pressed }) => [a.eye, pressed && { backgroundColor: p.soft }]}
            >
              <Icon
                name={visible ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={focused ? p.primary : p.muted}
              />
            </Pressable>
          ) : (
            trailing
          )}
        </View>
      </View>
      <View style={a.helper}>
        {!!helper && (
          <>
            <Icon
              name={
                error ? 'alert-circle-outline' : success ? 'check-circle' : 'information-outline'
              }
              size={15}
              color={error ? p.danger : success ? p.primary : p.muted}
              accessible={false}
            />
            <Text
              nativeID={`${id}-help`}
              accessibilityRole={error ? 'alert' : undefined}
              accessibilityLiveRegion={error || success ? 'polite' : undefined}
              style={[
                a.helperText,
                error ? { color: p.danger } : success ? { color: p.primary } : undefined,
              ]}
            >
              {helper}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}
export function FormAuthField<T extends FieldValues>({
  control,
  name,
  onValueChange,
  ...props
}: Omit<AuthFieldProps, 'value' | 'onChangeText' | 'error' | 'inputRef'> & {
  control: Control<T>;
  name: Path<T>;
  onValueChange?: () => void;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <AuthField
          {...props}
          inputRef={field.ref}
          value={field.value ?? ''}
          onChangeText={(value) => {
            field.onChange(value);
            onValueChange?.();
          }}
          onBlur={(event) => {
            field.onBlur();
            props.onBlur?.(event);
          }}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
export function AuthSelectField({
  label,
  value,
  onPress,
  disabled,
  icon = 'earth',
  error,
}: {
  label: string;
  value: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: IconName;
  error?: string;
}) {
  return (
    <View style={a.field}>
      <Text style={a.label}>{label}</Text>
      <View style={a.halo}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${value}`}
          accessibilityState={{ disabled: !!disabled }}
          disabled={disabled}
          onPress={onPress}
          style={({ pressed }) => [
            a.frame,
            pressed && a.focusFrame,
            disabled && a.disabledFrame,
            !!error && a.errorFrame,
          ]}
        >
          <Icon name={icon} size={21} color={p.muted} />
          <Text style={[a.input, { paddingVertical: 14 }]}>{value}</Text>
          <Icon name="chevron-down" size={23} color={p.primary} />
        </Pressable>
      </View>
      <View style={a.helper}>
        {error && (
          <Text accessibilityRole="alert" style={[a.helperText, { color: p.danger }]}>
            {error}
          </Text>
        )}
      </View>
    </View>
  );
}
export function AuthButton({
  title,
  onPress,
  secondary,
  disabled,
  loading,
  loadingText,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        a.button,
        secondary && a.secondaryButton,
        (disabled || loading) && { opacity: 0.6 },
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text style={[a.buttonText, secondary && { color: p.primary }]}>
        {loading ? loadingText || 'جارٍ الإرسال…' : title}
      </Text>
      {loading ? (
        <ActivityIndicator color={secondary ? p.primary : '#fff'} />
      ) : (
        !secondary && <Icon name="arrow-left" size={23} color="#fff" />
      )}
    </Pressable>
  );
}
export function AuthNotice({ message }: { message: string }) {
  return (
    <View
      style={{
        flexDirection: 'row-reverse',
        alignItems: 'flex-start',
        gap: 8,
        padding: 13,
        borderRadius: 14,
        backgroundColor: '#FFF0ED',
      }}
    >
      <Icon name="alert-circle-outline" size={20} color={p.danger} accessible={false} />
      <Text
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={{ flex: 1, fontSize: 13, lineHeight: 22, color: p.danger }}
      >
        {message}
      </Text>
    </View>
  );
}
export const a = StyleSheet.create({
  field: { gap: 5, width: '100%' },
  label: {
    fontFamily: t.medium,
    fontSize: 14,
    lineHeight: 22,
    color: p.ink,
    textAlign: 'right',
    paddingHorizontal: 4,
  },
  halo: { padding: 3, marginHorizontal: -3, borderRadius: 18, backgroundColor: 'transparent' },
  focusHalo: { backgroundColor: '#DAF0E4' },
  frame: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: '#DAE3DC',
    borderRadius: 14,
    backgroundColor: '#FDFEFC',
    paddingHorizontal: 14,
    gap: 10,
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  focusFrame: { borderColor: p.primary, backgroundColor: '#FFFFFF' },
  errorFrame: { borderColor: p.danger, backgroundColor: '#FFF8F7' },
  disabledFrame: { backgroundColor: '#EFF2EF', borderColor: '#E2E7E3', opacity: 0.75 },
  input: {
    flex: 1,
    minWidth: 0,
    outlineWidth: 0,
    paddingVertical: 14,
    fontFamily: t.regular,
    fontSize: 16,
    lineHeight: 24,
    color: p.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  ltr: { writingDirection: 'ltr', textAlign: 'left' },
  multiline: { minHeight: 96, textAlignVertical: 'top', alignSelf: 'stretch' },
  eye: {
    width: 44,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  helper: {
    minHeight: 20,
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 5,
    paddingHorizontal: 3,
  },
  helperText: { flex: 1, fontSize: 12, lineHeight: 20, color: p.muted, textAlign: 'right' },
  button: {
    minHeight: 56,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 15,
    backgroundColor: p.primary,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buttonText: {
    fontFamily: t.bold,
    fontSize: 16,
    lineHeight: 25,
    color: '#fff',
    textAlign: 'center',
  },
  secondaryButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: p.border },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: p.border,
    borderRadius: 22,
    padding: 18,
    gap: 10,
    boxShadow: '0px 6px 24px rgba(16,62,50,0.035)',
  },
});
