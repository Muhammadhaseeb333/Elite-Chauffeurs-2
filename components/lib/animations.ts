import { Easing, SharedValue, withTiming } from 'react-native-reanimated';

export const fadeIn = (value: SharedValue<number>) => {
  value.value = withTiming(1, {
    duration: 300,
    easing: Easing.out(Easing.ease),
  });
};