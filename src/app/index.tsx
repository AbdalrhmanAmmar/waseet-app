import { rolePaths } from '@/auth/roles';
import { useSession } from '@/hooks/shared/use-session';
import { Redirect, type Href } from 'expo-router';

export default function Index() {
  const { userData, isFirst, restricted } = useSession();

  if (!userData) {
    return <Redirect href={isFirst ? '/onboarding' : '/login'} />;
  }

  if (restricted) {
    return <Redirect href="/account-status" />;
  }

  return <Redirect href={rolePaths[userData.role] as Href} />;
}
