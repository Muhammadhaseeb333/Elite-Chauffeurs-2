import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface BadgeProps {
  text: string;
  color?: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const Badge = ({ text, color = '#F59E0B', icon, style }: BadgeProps) => {
  return (
    <View style={[styles.badge, { backgroundColor: color }, style]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'black',
  },
});