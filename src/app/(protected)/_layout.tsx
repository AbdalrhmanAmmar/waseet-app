import { useSession } from '@/hooks/shared/use-session';
import { Stack } from 'expo-router';
export default function Layout() {
  const { role } = useSession();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={role === 'Merchant'}>
        <Stack.Screen name="merchant" />
      </Stack.Protected>
      <Stack.Protected guard={role === 'SalesEmployee'}>
        <Stack.Screen name="sales-employee" />
      </Stack.Protected>
      <Stack.Protected guard={role === 'ManagementEmployee'}>
        <Stack.Screen name="management-employee" />
      </Stack.Protected>
      <Stack.Protected guard={role === 'DeliveryAgent'}>
        <Stack.Screen name="delivery-agent" />
      </Stack.Protected>
      <Stack.Screen name="account" />
    </Stack>
  );
}
