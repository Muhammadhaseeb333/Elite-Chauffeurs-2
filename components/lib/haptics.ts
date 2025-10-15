import * as Haptics from 'expo-haptics';

export const triggerSelection = () => {
  Haptics.selectionAsync();
};

export const triggerSuccessFeedback = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};