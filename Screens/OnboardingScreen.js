import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ImageBackground,
  ImageSourcePropType,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import Swiper from 'react-native-swiper';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

interface SlideContentProps {
  background: ImageSourcePropType;
  title: string;
  subtitle: string;
  showButtons?: boolean;
  active: boolean;
}

const SlideContent: React.FC<SlideContentProps> = ({
  background,
  title = '',
  subtitle = '',
  showButtons = false,
  active,
}) => {
  const navigation = useNavigation();

  const titleTranslateX = useSharedValue(300);
  const subtitleTranslateX = useSharedValue(300);
  const buttonsTranslateX = useSharedValue(300);

  useEffect(() => {
    if (active) {
      titleTranslateX.value = withTiming(0, { duration: 300 });
      subtitleTranslateX.value = withTiming(0, { duration: 300 });
      if (showButtons) {
        buttonsTranslateX.value = withTiming(0, { duration: 300 });
      }
    } else {
      titleTranslateX.value = 300;
      subtitleTranslateX.value = 300;
      buttonsTranslateX.value = 300;
    }
  }, [active]);

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: titleTranslateX.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: subtitleTranslateX.value }],
  }));

  const buttonsStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: buttonsTranslateX.value }],
  }));

  return (
    <ImageBackground
      source={background}
      style={styles.background}
      blurRadius={3}
    >
      <View style={styles.overlay}>
      <Animated.Text style={[styles.title, titleStyle]}>
  {title}
</Animated.Text>

<Animated.Text style={[styles.text, subtitleStyle]}>
  {subtitle}
</Animated.Text>

        {showButtons && (
          <Animated.View style={[styles.buttonRow, buttonsStyle]}>
<TouchableOpacity
  style={[styles.button, styles.loginButton]}
  onPress={() => navigation.navigate('LoginScreen')}
>
  <Text style={styles.buttonText}>Login</Text>
</TouchableOpacity>

<TouchableOpacity
  style={[styles.button, styles.homeButton]}
  onPress={() => navigation.navigate('MainTabs')}
>
  <Text style={styles.buttonText}>Home</Text>
</TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </ImageBackground>
  );
};

export default function OnboardingScreen() {
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4C8BF5" />
      </View>
    );
  }

  return (
    <Swiper
      loop={false}
      activeDotColor="#4C8BF5"
      onIndexChanged={(index) => setActiveIndex(index)}
    >
      <SlideContent
        active={activeIndex === 0}
        background={require('../assets/images/slide1.jpg')}
        title="Elite Chauffeurs"
        subtitle="Travel in style and comfort with our premium chauffeur services across Ireland."
      />
      <SlideContent
        active={activeIndex === 1}
        background={require('../assets/images/slide2.jpg')}
        title="Personalized Experience"
        subtitle="Whether it's a business trip, a luxury tour, or airport transfer, we tailor your journey."
      />
      <SlideContent
        active={activeIndex === 2}
        background={require('../assets/images/slide3.jpg')}
        title="Effortless Booking"
        subtitle="Schedule your ride in seconds with our intuitive app and experience premium service every time."
        showButtons
      />
    </Swiper>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  background: {
    flex: 1,
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: '100%',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
    letterSpacing: 1,
  },
  text: {
    fontSize: 18,
    color: '#ddd',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 40,
    gap: 20,
    paddingHorizontal: 20,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  loginButton: {
    backgroundColor: '#4C8BF5',
  },
  homeButton: {
    backgroundColor: '#34A853',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
