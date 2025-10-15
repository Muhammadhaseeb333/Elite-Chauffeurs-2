import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'solid' | 'outline' | 'ghost';
  theme?: 'gold' | 'gradient' | 'dark';
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'solid',
  theme = 'gold',
  icon,
  disabled = false,
  style,
  textStyle,
}) => {
  // Theme configurations
  const themeConfig = {
    gold: {
      solid: {
        background: ['#F59E0B', '#EAB308'], // amber-500 to amber-400
        text: '#000000',
      },
      outline: {
        border: '#F59E0B',
        text: '#F59E0B',
      },
    },
    gradient: {
      solid: {
        background: ['#6366F1', '#8B5CF6'], // indigo-500 to purple-500
        text: '#FFFFFF',
      },
      outline: {
        border: '#6366F1',
        text: '#6366F1',
      },
    },
    dark: {
      solid: {
        background: ['#475569', '#64748B'], // slate-700 to slate-600
        text: '#FFFFFF',
      },
      outline: {
        border: '#475569',
        text: '#475569',
      },
    },
  };

  const renderButtonContent = () => (
    <>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[
        styles.text,
        variant === 'solid' 
          ? { color: themeConfig[theme].solid.text } 
          : { color: themeConfig[theme].outline.text },
        textStyle,
      ]}>
        {title}
      </Text>
    </>
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.container,
        variant === 'outline' && {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: themeConfig[theme].outline.border,
        },
        variant === 'ghost' && {
          backgroundColor: 'transparent',
        },
        style,
        disabled && styles.disabled,
      ]}
    >
      {variant === 'solid' ? (
        <LinearGradient
          colors={themeConfig[theme].solid.background}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, style]}
        >
          {renderButtonContent()}
        </LinearGradient>
      ) : (
        renderButtonContent()
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 50,
  },
  gradient: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  disabled: {
    opacity: 0.6,
  },
});

export default Button;