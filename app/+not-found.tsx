import { Stack, useRouter } from 'expo-router';
import { ErrorScreen } from '../src/presentation/ErrorScreen';

/** Any path no route matches, such as a stale or mistyped `physiology://` link. */
export default function NotFound() {
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <ErrorScreen
        title="We can not find that page"
        message="The link may be out of date. The study list is one tap away."
        action={{ label: 'Go to study list', onPress: () => router.replace('/') }}
      />
    </>
  );
}
