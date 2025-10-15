import "react-native-gesture-handler";
import "react-native-reanimated";
import React, { useEffect, useState } from "react";
import {
  View,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  Platform,
  Linking,
  AppState,
} from "react-native";
import {
  NavigationContainer,
  DefaultTheme,
} from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import Ionicons from "@expo/vector-icons/Ionicons";
import { auth } from "./config/firebaseConfig";
import { onAuthStateChanged, reload } from "firebase/auth";
import { StripeProvider } from "@stripe/stripe-react-native";
import { DiscountProvider } from "./Screens/DiscountContext";
import { LogBox } from "react-native";
import "react-native-get-random-values";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// 🔔 Push
// import * as Notifications from "expo-notifications";
// import { initPushToken } from "./src/utils/initPush";

// Screens - Update these imports to your actual file paths
import OnboardingScreen from "./Screens/OnboardingScreen";
import PaymentScreen from "./Screens/payment";
import HomeScreen from "./Screens/HomeScreen";
import RideScreen from "./Screens/RideScreen";
import Help from "./Screens/Help";
import ProfileScreen from "./Screens/ProfileScreen";
import PersonalInfoScreen from "./Screens/PersonalInfoScreen";
import ImprintScreen from "./Screens/ImprintScreen";
import TermsConditionsScreen from "./Screens/TermsAndConditions";
import PrivacyPolicyScreen from "./Screens/Privacy Policy";
import ReceiptScreen from "./Screens/ReceiptScreen";
import ToursScreen from "./Screens/ToursScreen";
import TourDetailsScreen from "./Screens/TourDetailsScreen";
import MapScreen from "./Screens/MapScreen";
import CarSelectionScreen from "./Screens/CarSelectionScreen";
import RideDetailsScreen from "./Screens/RideDetailsScreen";
import LoginScreen from "./Screens/LoginScreen";
import ReturnMapScreen from "./Screens/ReturnMapScreen";
import HourlyBookingMapScreen from "./Screens/HourlyBookingMapScreen";
import PromotionsScreen from "./Screens/PromotionsScreen";
import AdditionalInfoScreen from "./Screens/AdditionalInfoScreen";
import PromoCodeScreen from "./Screens/PromoCodeScreen";
import ChangePasswordScreen from "./Screens/ChangePasswordScreen";
import ForgotPasswordScreen from "./Screens/ForgotPasswordScreen";
import ResetPasswordScreen from "./Screens/ResetPasswordScreen";
import VerifyEmailScreen from "./Screens/VerifyEmailScreen";
import FleetScreen from "./Screens/FleetScreen";
import AboutScreen from "./Screens/AboutScreen";
import FeedbackScreen from "./Screens/FeedbackScreen";
import GuestContactScreen from "./Screens/GuestContactScreen";
import RideData from "./Screens/RideData";
import FAQScreen from "./Screens/FAQScreen";
import EmailSentScreen from "./Screens/EmailSentScreen";

// 👇 splash video screen shown first
import SplashVideoScreen from "./Screens/SplashVideoScreen";

LogBox.ignoreLogs([
  "Support for defaultProps will be removed from function components",
]);

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const { width } = Dimensions.get("window");
const FORCE_ONBOARDING = false;

// ⭐ Force Dark theme globally
const DarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "black",
    card: "black",
    primary: "white",
    text: "white",
    border: "black",
    notification: "white",
  },
};

// Neutral boot screen (never flashes white)
function BootScreen() {
  return (
    <SafeAreaView style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="white" />
    </SafeAreaView>
  );
}

function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "black" } }}>
      <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
      <Stack.Screen name="Auth" component={AuthStack} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "black" } }}
    >
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyEmailScreen" component={VerifyEmailScreen} />
      <Stack.Screen name="EmailSentScreen" component={EmailSentScreen} />
      <Stack.Screen name="ResetPasswordScreen" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        contentStyle: { backgroundColor: "black" },
        headerShown: false
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MapScreen"
        component={MapScreen}
        options={headerOptions("One Way")}
      />
      <Stack.Screen
        name="ReturnMapScreen"
        component={ReturnMapScreen}
        options={headerOptions("Round Trip")}
      />
      <Stack.Screen
        name="HourlyBookingMapScreen"
        component={HourlyBookingMapScreen}
        options={headerOptions("Hourly Booking")}
      />
      <Stack.Screen
        name="PromotionsScreen"
        component={PromotionsScreen}
        options={headerOptions("Promotions")}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={headerOptions("Payment")}
      />
      <Stack.Screen
        name="ToursScreen"
        component={ToursScreen}
        options={headerOptions("Tours")}
      />
      <Stack.Screen
        name="TourDetailsScreen"
        component={TourDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ReceiptScreen"
        component={ReceiptScreen}
        options={headerOptions("Receipt")}
      />
      <Stack.Screen
        name="CarSelection"
        component={CarSelectionScreen}
        options={headerOptions("Car Selection")}
      />
      <Stack.Screen
        name="RideDetailsScreen"
        component={RideDetailsScreen}
        options={headerOptions("Ride Details")}
      />
      <Stack.Screen
        name="PersonalInfoScreen"
        component={PersonalInfoScreen}
        options={headerOptions("Personal Information")}
      />
      <Stack.Screen
        name="AdditionalInfoScreen"
        component={AdditionalInfoScreen}
        options={headerOptions("Additional Info")}
      />
      <Stack.Screen
        name="PromoCodeScreen"
        component={PromoCodeScreen}
        options={headerOptions("Promo Codes")}
      />
      <Stack.Screen
        name="ChangePasswordScreen"
        component={ChangePasswordScreen}
        options={headerOptions("Change Password")}
      />
      <Stack.Screen
        name="ForgotPasswordScreen"
        component={ForgotPasswordScreen}
        options={headerOptions("Forgot Password")}
      />
      <Stack.Screen name="ResetPasswordScreen" component={ResetPasswordScreen} />
      <Stack.Screen
        name="GuestContactScreen"
        component={GuestContactScreen}
        options={headerOptions("Your Details")}
      />
      <Stack.Screen
        name="FleetScreen"
        component={FleetScreen}
        options={headerOptions("Our Fleet")}
      />
      <Stack.Screen
        name="AboutScreen"
        component={AboutScreen}
        options={headerOptions("About Us")}
      />
      <Stack.Screen
        name="FeedbackScreen"
        component={FeedbackScreen}
        options={headerOptions("Feedback")}
      />
      <Stack.Screen
        name="RideData"
        component={RideData}
        options={headerOptions("Ride Data")}
      />
      <Stack.Screen
        name="FAQScreen"
        component={FAQScreen}
        options={headerOptions("FAQScreen")}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  const baseBarHeight = Platform.OS === "ios" ? 60 : 56;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarLabelPosition: "below-icon",
        tabBarShowLabel: true,
        tabBarActiveTintColor: "white",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          backgroundColor: "black",
          borderTopWidth: 0,
          elevation: 0,
          height: baseBarHeight + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 6,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={tabScreenOptions("Home", "home")}
      />
      <Tab.Screen
        name="Rides"
        component={RideScreen}
        options={{ ...tabScreenOptions("Rides", "car"), headerShown: false }}
      />
      <Tab.Screen
        name="Help"
        component={HelpStack}
        options={tabScreenOptions("Help", "help-circle")}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={tabScreenOptions("Account", "person")}
      />
    </Tab.Navigator>
  );
}

function HelpStack() {
  return (
    <Stack.Navigator screenOptions={{ contentStyle: { backgroundColor: "black" } }}>
      <Stack.Screen name="HelpMain" component={Help} options={{ headerShown: false }} />
      <Stack.Screen name="ImprintScreen" component={ImprintScreen} options={headerOptions("Imprint")} />
      <Stack.Screen name="TermsAndConditions" component={TermsConditionsScreen} options={headerOptions("Terms & Conditions")} />
      <Stack.Screen name="PrivacyPolicyScreen" component={PrivacyPolicyScreen} options={headerOptions("Privacy Policy")} />
    </Stack.Navigator>
  );
}

const headerOptions = (title) => ({
  headerTitle: title,
  headerTitleAlign: "center",
  headerStyle: { backgroundColor: "#203a43", height: 90 },
  headerTitleStyle: { fontSize: 20, fontWeight: "bold", color: "white" },
  headerBackTitleVisible: false,
  headerBackTitle: "",
});

const tabScreenOptions = (label, icon) => ({
  tabBarLabel: label,
  headerShown: false,
  tabBarIcon: ({ color, focused }) => (
    <Ionicons
      name={focused ? icon : icon + "-outline"}
      size={width * 0.05}
      color={color}
    />
  ),
});

const styles = {
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
};

// Main App Component
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firstLaunch, setFirstLaunch] = useState(null);
  const [showSplash, setShowSplash] = useState(true);

  // For now, skip onboarding flow; keep the flag if you want to enable later
  useEffect(() => {
    setFirstLaunch(false);
  }, []);

  // Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Force reload to get the latest verification status
        try {
          await reload(currentUser);
        } catch (error) {
          console.log("Error reloading user:", error);
        }
      }
      
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Deep linking for email verification
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      if (url.includes('mode=verifyEmail') && auth.currentUser) {
        try {
          await reload(auth.currentUser);
        } catch (error) {
          console.log("Error handling deep link:", error);
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // Check initial URL when app opens
    Linking.getInitialURL().then((url) => {
      if (url && url.includes('mode=verifyEmail') && auth.currentUser) {
        reload(auth.currentUser);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // AppState listener to check verification when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active' && auth.currentUser && !auth.currentUser.emailVerified) {
        // App came to foreground, check if user verified their email
        try {
          await reload(auth.currentUser);
        } catch (error) {
          console.log("Error checking verification status:", error);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Push notifications init
  // useEffect(() => {
  //   if (loading || firstLaunch === null) return;

  //   const init = async () => {
  //     const notification = await Notifications.getInitialNotificationAsync();
  //     if (notification) {
  //       console.log("Opened from quit notification:", notification?.data);
  //     }
  //   };
  //   init().catch(console.log);

  //   const opened = Notifications.addNotificationResponseReceivedListener((res) =>
  //     console.log("Opened from background notification:", res?.notification?.data)
  //   );
  //   const fg = Notifications.addNotificationReceivedListener((n) =>
  //     console.log("Foreground notification:", n?.data)
  //   );

  //   // if (user?.emailVerified && !user?.isAnonymous) {
  //   //   initPushToken().catch((e) => console.log("initPushToken error:", e));
  //   // }

  //   return () => {
  //     opened.remove();
  //     fg.remove();
  //   };
  // }, [user?.emailVerified, user?.isAnonymous, loading, firstLaunch]);

  // Hide splash screen after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Determine which stack to show
  const getInitialRoute = () => {
    if (showSplash) return "Splash";
    if (loading || firstLaunch === null) return "Boot";
    if (firstLaunch || FORCE_ONBOARDING) return "Onboarding";
    if (!user) return "Auth";
    if (user.isAnonymous) return "App";
    if (!user.emailVerified) return "VerifyEmail";
    return "App";
  };

  return (
    <DiscountProvider>
      <StripeProvider publishableKey="pk_live_51QlVklJQXef65FmZRldlntyk6FYXPPOkGckpF96UbjCh9k2xLGaTohWufYxg89Ciu4IpdEkHguRXVTJjShMTzgah00ZPBmkRe9">
        <SafeAreaProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={{ flex: 1, backgroundColor: "black" }}>
              <NavigationContainer theme={DarkTheme}>
                <Stack.Navigator
                  screenOptions={{
                    headerShown: false,
                    animationEnabled: false,
                    contentStyle: { backgroundColor: "black" },
                  }}
                  initialRouteName={getInitialRoute()}
                >
                  {/* Splash Screen */}
                  <Stack.Screen name="Splash" component={SplashVideoScreen} />
                  
                  {/* Boot Screen */}
                  <Stack.Screen name="Boot" component={BootScreen} />
                  
                  {/* Onboarding */}
                  <Stack.Screen name="Onboarding" component={OnboardingStack} />
                  
                  {/* Auth Stack */}
                  <Stack.Screen name="Auth" component={AuthStack} />
                  
                  {/* Verify Email */}
                  <Stack.Screen 
                    name="VerifyEmail" 
                    component={VerifyEmailScreen}
                    initialParams={{ email: user?.email }}
                  />
                  
                  {/* Main App */}
                  <Stack.Screen name="App" component={AppStack} />
                </Stack.Navigator>
              </NavigationContainer>
            </View>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </StripeProvider>
    </DiscountProvider>
  );
}