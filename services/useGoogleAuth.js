// useGoogleAuth.js
import { useEffect, useState } from "react";
import * as Google from "expo-auth-session/providers/google";
import { auth } from "@/config/firebaseConfig";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { makeRedirectUri } from "expo-auth-session";
import Constants from "expo-constants";

export const useGoogleAuth = () => {
  const [user, setUser] = useState(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: "962290238047-5c3aretft0quspr0sfnocsc5fq5nppdf.apps.googleusercontent.com", 
    iosClientId: "962290238047-l5bbpbpvejgkri2u3tajngm75iq2kp7i.apps.googleusercontent.com", 
    clientId: Constants.expoConfig.extra.firebase["webClientId"], // ✅ correct syntax

    redirectUri: makeRedirectUri({
      useProxy: true, 
    }),
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then((userCredential) => {
          setUser(userCredential.user);
        })
        .catch((error) => {
          console.error("Google Sign-In Error:", error.message);
        });
    }
  }, [response]);

  return { user, request, promptAsync };
};
