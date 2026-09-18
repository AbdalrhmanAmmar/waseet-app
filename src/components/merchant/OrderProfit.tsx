import CustomText from '@/components/shared/CustomText';
export function OrderProfit({ value }: { value?: number }) {
  if (value == null) return null;
  return (
    <CustomText style={{ color: '#0D9488', paddingVertical: 8 }}>
      ربح التاجر: {value} USD
    </CustomText>
  );
}
