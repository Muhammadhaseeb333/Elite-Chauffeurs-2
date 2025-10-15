import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Sparkles, Gift, Tag } from 'lucide-react-native';
import { Promotion, PROMOTION_THEMES } from "@/types/promotion";
import Button from '../ui/Button';

interface PromotionCardProps {
  promotion: Promotion;
  onPress?: () => void;
}

const PromotionCard: React.FC<PromotionCardProps> = ({ promotion, onPress }) => {
  const theme = PROMOTION_THEMES[promotion.theme];
  
  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.card, { borderColor: theme.border }]}
    >
      <LinearGradient
        colors={theme.background}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header with badges */}
        <View style={styles.header}>
          <View style={[styles.badge, { backgroundColor: theme.button }]}>
            <Text style={styles.badgeText}>{promotion.discount} OFF</Text>
          </View>
          
          <View style={styles.badgeContainer}>
            {promotion.isNew && (
              <View style={[styles.smallBadge, { backgroundColor: '#10B981' }]}>
                <Sparkles size={14} color="white" />
                <Text style={styles.smallBadgeText}>New</Text>
              </View>
            )}
            {promotion.expiresIn && (
              <View style={[styles.smallBadge, { borderColor: '#FCA5A5' }]}>
                <Clock size={14} color="#FCA5A5" />
                <Text style={[styles.smallBadgeText, { color: '#FCA5A5' }]}>
                  {promotion.expiresIn}
                </Text>
              </View>
            )}
            {promotion.isGift && (
              <View style={[styles.smallBadge, { backgroundColor: '#8B5CF6' }]}>
                <Gift size={14} color="white" />
                <Text style={styles.smallBadgeText}>Gift</Text>
              </View>
            )}
          </View>
        </View>

        {/* Content */}
        <Text style={[styles.title, { color: theme.text }]}>
          {promotion.title}
        </Text>
        <Text style={[styles.description, { color: theme.text, opacity: 0.9 }]}>
          {promotion.description}
        </Text>

        {/* Promo code */}
        {promotion.code && (
          <View style={styles.codeContainer}>
            <View style={styles.codeInner}>
              <Tag size={16} color={theme.text} opacity={0.7} />
              <Text style={[styles.codeText, { color: theme.text }]}>
                {promotion.code}
              </Text>
            </View>
            <View style={styles.promoBadge}>
              <Text style={styles.promoBadgeText}>Promo Code</Text>
            </View>
          </View>
        )}

        {/* Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={promotion.buttonText}
            onPress={() => {}}
            variant="solid"
            theme={promotion.theme}
          />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
    card: {
        width: '100%', // Changed from fixed width
        height: 380,
        borderRadius: 12,
        borderWidth: 2,
        overflow: 'hidden',
        // Removed marginRight since we're vertical now
      },
  gradient: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  smallBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  smallBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  codeInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeText: {
    fontFamily: 'monospace',
    marginLeft: 8,
  },
  promoBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  promoBadgeText: {
    fontSize: 10,
    opacity: 0.8,
  },
  buttonContainer: {
    marginTop: 'auto',
  },
});

export default PromotionCard;