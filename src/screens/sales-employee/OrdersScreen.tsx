import { SalesSummary } from '@/components/sales-employee/SalesSummary';
import { useSalesOrders } from '@/hooks/sales-employee';
import { useScreenProps } from '@/navigation/use-screen-props';
import Orders from '@/screens/shared/MyOrders';
export default function SalesOrdersScreen() {
  const controller = useSalesOrders();
  return (
    <Orders
      {...useScreenProps()}
      title="طلبات المبيعات"
      controller={controller}
      summary={<SalesSummary count={controller.orders.length} />}
    />
  );
}
