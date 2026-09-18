import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View } from 'react-native';
import type { accountStatusContent } from '@/auth/account-status';
import { palette as p, typography as t } from '@/theme/tokens';
import Text from '../CustomText';
export function ActivationSteps({ content }: { content: ReturnType<typeof accountStatusContent> }) {
  const steps = [
    { title: 'إنشاء الحساب', detail: 'تم بنجاح', icon: 'check' as const, state: 'done' },
    { title: content.step, detail: content.detail, icon: content.icon, state: 'current' },
    {
      title: 'تفعيل الحساب',
      detail: 'جاهز لبدء أعمالك',
      icon: 'lock-outline' as const,
      state: 'next',
    },
  ];
  return (
    <View style={s.card}>
      <Text accessibilityRole="header" style={s.heading}>
        خطوات تفعيل حسابك
      </Text>
      <View>
        {steps.map((step, index) => (
          <View
            key={step.state}
            style={s.row}
            accessible
            accessibilityLabel={`${step.title}، ${step.detail}`}
          >
            <View style={s.rail}>
              {index < 2 && <View style={[s.connector, index === 1 && s.dashed]} />}
              <View style={[s.circle, index === 0 ? s.done : index === 1 ? s.current : s.next]}>
                <Icon
                  name={step.icon}
                  size={22}
                  color={index === 0 ? '#fff' : index === 1 ? '#E47C0A' : '#6C9187'}
                />
              </View>
            </View>
            <View style={s.text}>
              <Text style={s.title}>{step.title}</Text>
              <Text style={s.detail}>{step.detail}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  card: {
    paddingHorizontal: 18,
    paddingTop: 15,
    paddingBottom: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D3E8DF',
    backgroundColor: '#FFFFFFA6',
  },
  heading: { fontFamily: t.bold, fontSize: 18, lineHeight: 28, color: p.deep, marginBottom: 8 },
  row: { flexDirection: 'row-reverse', gap: 18, minHeight: 52 },
  rail: { width: 32, alignItems: 'center', paddingTop: 3 },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: p.background,
  },
  done: { backgroundColor: '#159879', borderColor: '#159879' },
  current: { borderColor: '#EF8B12' },
  next: { borderColor: '#B5CEC5' },
  connector: { position: 'absolute', top: 38, bottom: 0, width: 2, backgroundColor: '#159879' },
  dashed: {
    width: 0,
    backgroundColor: 'transparent',
    borderLeftWidth: 1.5,
    borderColor: '#7B9C92',
    borderStyle: 'dashed',
  },
  text: { flex: 1, paddingBottom: 12 },
  title: { fontSize: 17, lineHeight: 24, fontFamily: t.bold, color: p.deep },
  detail: { fontSize: 13, lineHeight: 19, color: '#65897E' },
});
