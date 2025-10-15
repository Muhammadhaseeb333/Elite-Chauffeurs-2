// Screens/SplashVideoScreen.js
import React, { useEffect, useRef, useState } from "react";
import { 
  StyleSheet, 
  Pressable, 
  Text, 
  StatusBar, 
  Animated, 
  View, 
  Platform,
  Dimensions 
} from "react-native";
import Video from "react-native-video";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "@/config/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

const INTRO_FLAG = "hasSeenIntroVideo";
const SHOW_ONLY_ONCE = false;
const RESIZE_MODE = "contain"; // Changed from "cover" to "contain" to see entire video
const VIDEO_TIMEOUT_MS = 15000;

const { width, height } = Dimensions.get("window");

export default function SplashVideoScreen({ navigation }) {
  const fade = useRef(new Animated.Value(1)).current;
  const [canSkip, setCanSkip] = useState(false);
  const [maskVisible, setMaskVisible] = useState(true);
  const [videoAspectRatio, setVideoAspectRatio] = useState(16/9); // Default aspect ratio
  const finishedRef = useRef(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Let user skip after short delay
    const id = setTimeout(() => setCanSkip(true), 800);
    return () => clearTimeout(id);
  }, []);

  const checkAuthAndNavigate = async () => {
    try {
      // Check auth state with a small delay to ensure Firebase is ready
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const user = auth.currentUser;
      
      if (user && user.emailVerified && !user.isAnonymous) {
        // User is logged in, email verified, and not anonymous - go to Home
        navigation.replace("App");
      } else if (user && user.isAnonymous) {
        // User is anonymous guest - go to Home
        navigation.replace("App");
      } else {
        // User is not logged in, session expired, or email not verified - go to Login
        navigation.replace("Auth");
      }
    } catch (error) {
      console.error("Auth check error:", error);
      // Fallback to login screen on error
      navigation.replace("Auth");
    }
  };

  const goNext = async () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    
    // Clear any existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    try {
      if (SHOW_ONLY_ONCE) await AsyncStorage.setItem(INTRO_FLAG, "1");
    } catch (error) {
      console.warn("AsyncStorage error:", error);
    }
    
    Animated.timing(fade, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      checkAuthAndNavigate();
    });
  };

  // Calculate video dimensions based on aspect ratio
  const getVideoStyle = () => {
    const videoHeight = width / videoAspectRatio;
    
    if (videoHeight > height) {
      // Video is taller than screen, scale to height
      return {
        width: height * videoAspectRatio,
        height: height,
        top: 0,
        left: (width - height * videoAspectRatio) / 2
      };
    } else {
      // Video is wider than screen or fits perfectly, scale to width
      return {
        width: width,
        height: width / videoAspectRatio,
        top: (height - width / videoAspectRatio) / 2,
        left: 0
      };
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fade }]}>
      <StatusBar hidden animated />

      <Video
        source={require("../assets/splash/intro.mp4")}
        style={[styles.video, getVideoStyle()]}
        resizeMode={RESIZE_MODE}
        controls={false}
        pictureInPicture={false}
        fullscreen={false}
        repeat={false}
        muted={true}
        paused={false}
        playInBackground={false}
        playWhenInactive={false}
        ignoreSilentSwitch="obey"
        shutterColor="transparent"
        onLoad={(data) => {
          setMaskVisible(false);
          // Get the actual video aspect ratio
          if (data.naturalSize && data.naturalSize.width && data.naturalSize.height) {
            setVideoAspectRatio(data.naturalSize.width / data.naturalSize.height);
          }
          // Safety fallback if onEnd doesn't fire
          if (!timeoutRef.current) {
            timeoutRef.current = setTimeout(goNext, VIDEO_TIMEOUT_MS);
          }
        }}
        onReadyForDisplay={(data) => {
          setMaskVisible(false);
          if (!timeoutRef.current) {
            timeoutRef.current = setTimeout(goNext, VIDEO_TIMEOUT_MS);
          }
        }}
        onEnd={goNext}
        onError={(e) => {
          console.warn("Intro video error:", e?.nativeEvent || e);
          goNext();
        }}
      />

      {maskVisible && <View pointerEvents="none" style={styles.mask} />}

      <Pressable style={styles.tapCatcher} onPress={() => canSkip && goNext()} />
      {canSkip && (
        <Pressable style={styles.skip} onPress={goNext}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#000",
    justifyContent: 'center',
    alignItems: 'center'
  },
  video: { 
    position: "absolute",
  },
  mask: { 
    position: "absolute", 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: "#000" 
  },
  tapCatcher: { 
    position: "absolute", 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0,
    zIndex: 10 
  },
  skip: {
    position: "absolute",
    right: 16,
    bottom: Platform.select({ ios: 28, android: 24 }),
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    zIndex: 20
  },
  skipText: { 
    color: "#fff", 
    fontWeight: "700", 
    letterSpacing: 0.3 
  },
});