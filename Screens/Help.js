import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  Linking,
  Animated,
  ScrollView,
  StatusBar,
} from 'react-native';
import { FontAwesome, Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

const COLORS = {
  bg: '#0f1115',
  overlay: 'rgba(15, 17, 21, 0.85)',
  card: '#1c1e23',
  text: '#ffffff',
  muted: '#B0B0B0',
  gold: '#b88a44',
  goldSoft: 'rgba(184,138,68,0.2)',
  border: 'rgba(255,255,255,0.1)',
  shadow: '#000',
};

const HelpScreen = () => {
  const navigation = useNavigation();
  const [scaleValue] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
  };

  const handlePhonePress = () => Linking.openURL('tel:+353868095524');
  const handleEmailPress = () => Linking.openURL('mailto:info@elitechauffeurs.ie');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar translucent backgroundColor="transparent" />

      {/* Overlay layer to mirror HomeScreen look (no background image) */}
      <View style={styles.overlay}>
        {/* Header centered (person icon removed) */}
        <View style={styles.header}>
          <View style={styles.brandCenter}>
            <Ionicons name="help-buoy-outline" size={28} color={COLORS.gold} />
            <Text style={styles.brandText}>Help Center</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          {/* Subtitle */}
          <Animatable.Text
            animation="fadeInDown"
            duration={800}
            style={styles.subHeading}
          >
            How can we assist you today?
          </Animatable.Text>

          {/* Contact Support Section */}
          <Animatable.View animation="fadeInUp" duration={800} delay={150} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="headset-outline" size={22} color={COLORS.gold} />
              <Text style={styles.sectionTitle}>Contact Support</Text>
            </View>

            <Animated.View style={[styles.card, { transform: [{ scale: scaleValue }] }]}>
              <TouchableOpacity
                style={styles.contactCard}
                onPress={handlePhonePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.75}
              >
                <View style={[styles.iconCircle, { backgroundColor: '#e74c3c' }]}>
                  <FontAwesome name="phone" size={18} color="#fff" />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>24/7 Support Line</Text>
                  <Text style={styles.contactValue}>+353 86 809 5524</Text>
                </View>
                <Feather name="chevron-right" size={22} color={COLORS.gold} />
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.card, { transform: [{ scale: scaleValue }] }]}>
              <TouchableOpacity
                style={styles.contactCard}
                onPress={handleEmailPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.75}
              >
                <View style={[styles.iconCircle, { backgroundColor: '#3498db' }]}>
                  <FontAwesome name="envelope" size={18} color="#fff" />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Email Support</Text>
                  <Text style={styles.contactValue}>info@elitechauffeurs.ie</Text>
                </View>
                <Feather name="chevron-right" size={22} color={COLORS.gold} />
              </TouchableOpacity>
            </Animated.View>
          </Animatable.View>

          {/* Legal Section */}
          <Animatable.View animation="fadeInUp" duration={800} delay={250} style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="gavel" size={22} color={COLORS.gold} />
              <Text style={styles.sectionTitle}>Legal Information</Text>
            </View>

            <Animatable.View animation="fadeInRight" duration={700} delay={100}>
              <TouchableOpacity
                style={[styles.legalItem, styles.cardish]}
                onPress={() => navigation.navigate('ImprintScreen')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="account-balance" size={22} color={COLORS.gold} />
                <Text style={styles.legalText}>Imprint</Text>
                <Feather name="chevron-right" size={20} color={COLORS.gold} />
              </TouchableOpacity>
            </Animatable.View>

            <Animatable.View animation="fadeInRight" duration={700} delay={180}>
              <TouchableOpacity
                style={[styles.legalItem, styles.cardish]}
                onPress={() => navigation.navigate('TermsAndConditions')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="description" size={22} color={COLORS.gold} />
                <Text style={styles.legalText}>Terms & Conditions</Text>
                <Feather name="chevron-right" size={20} color={COLORS.gold} />
              </TouchableOpacity>
            </Animatable.View>

            <Animatable.View animation="fadeInRight" duration={700} delay={260}>
              <TouchableOpacity
                style={[styles.legalItem, styles.cardish]}
                onPress={() => navigation.navigate('PrivacyPolicyScreen')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="privacy-tip" size={22} color={COLORS.gold} />
                <Text style={styles.legalText}>Privacy Policy</Text>
                <Feather name="chevron-right" size={20} color={COLORS.gold} />
              </TouchableOpacity>
            </Animatable.View>
          </Animatable.View>

          {/* FAQ CTA */}
          <Animatable.View animation="fadeInUp" duration={800} delay={350} style={styles.section}>
            <TouchableOpacity
              style={styles.faqButton}
              onPress={() => navigation.navigate('FAQScreen')}
              activeOpacity={0.9}
            >
              <Text style={styles.faqButtonText}>Browse Frequently Asked Questions</Text>
              <Feather name="help-circle" size={22} color="#fff" />
            </TouchableOpacity>
          </Animatable.View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  overlay: { flex: 1, backgroundColor: COLORS.overlay },

  // Centered header (removed right person icon)
  header: {
    paddingHorizontal: 14,
    paddingTop: 62,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    color: COLORS.gold,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  container: {
    padding: 16,
    paddingBottom: 80,
  },

  subHeading: {
    fontSize: 16,
    color: COLORS.gold,
    textAlign: 'center',
    marginBottom: 16,
  },

  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 4,
    gap: 8,
  },
  sectionTitle: {
    color: COLORS.gold,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardish: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  contactInfo: { flex: 1 },
  contactLabel: { color: COLORS.muted, fontSize: 13, marginBottom: 3, fontWeight: '500' },
  contactValue: { color: COLORS.text, fontSize: 16, fontWeight: '700' },

  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  legalText: {
    flex: 1,
    color: '#EAEAEA',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },

  faqButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    backgroundColor: COLORS.goldSoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  faqButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', flex: 1, marginRight: 12 },
});

export default HelpScreen;
