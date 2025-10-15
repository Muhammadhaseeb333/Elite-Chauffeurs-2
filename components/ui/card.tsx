import React from 'react';
import { View, Text } from 'react-native';

export const Card = ({ children, style }: any) => (
  <View style={[{
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  }, style]}>
    {children}
  </View>
);

// Similar implementations for CardHeader, CardContent, etc.