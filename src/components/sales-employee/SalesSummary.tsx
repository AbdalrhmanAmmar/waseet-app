import CustomText from '@/components/shared/CustomText';
export function SalesSummary({ count }: { count: number }) {
  return <CustomText style={{ padding: 16 }}>طلبات المبيعات المعروضة: {count}</CustomText>;
}
