import Toast from 'react-native-toast-message';
import { useCallback } from 'react';

export const useToast = () => {
  const showToast = useCallback(
    (type: 'success' | 'error' | 'info', text1: string, text2?: string) => {
      Toast.show({
        type,
        text1,
        text2,
        position: 'bottom',
      });
    },
    []
  );

  return { showToast };
};