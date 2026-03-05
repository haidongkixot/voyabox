import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { getItem, STORAGE_KEYS } from '@/utils/storage';
import { Colors } from '@/constants';
import { useState } from 'react';

type Destination = '/(onboarding)' | '/(auth)/login' | '/(tabs)/home';

export default function Index() {
  const { currentUser, isHydrated } = useAuthStore();
  const [destination, setDestination] = useState<Destination | null>(null);

  useEffect(() => {
    if (!isHydrated) return;

    async function resolve() {
      if (currentUser) {
        setDestination('/(tabs)/home');
        return;
      }
      const seen = await getItem<string>(STORAGE_KEYS.ONBOARDING_SEEN);
      if (seen) {
        setDestination('/(auth)/login');
      } else {
        setDestination('/(onboarding)');
      }
    }
    resolve();
  }, [isHydrated, currentUser]);

  if (!destination) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white }}>
        <ActivityIndicator size="large" color={Colors.blue} />
      </View>
    );
  }

  return <Redirect href={destination} />;
}
