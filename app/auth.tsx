import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { auth } from "@/firebaseConfig";
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  FacebookAuthProvider,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, Divider, Text, TextInput } from "react-native-paper";

export default function AuthScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        await sendEmailVerification(userCredential.user);
        ToastAndroid.show(
          "Signed up successfully! Please verify your email.",
          ToastAndroid.SHORT
        );
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        ToastAndroid.show("Logged in successfully!", ToastAndroid.SHORT);
      }
      router.push("/");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      ToastAndroid.show(
        "Logged in with Google successfully!",
        ToastAndroid.SHORT
      );
      router.push("/");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred.");
      }
    }
  };

  const handleFacebookSignIn = async () => {
    const provider = new FacebookAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      ToastAndroid.show(
        "Logged in with Facebook successfully!",
        ToastAndroid.SHORT
      );
      router.push("/");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred.");
      }
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Text style={styles.title}>{isSignUp ? "Sign Up" : "Login"}</Text>
      <TextInput
        mode="outlined"
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.emailInput}
      />
      <View style={styles.passwordContainer}>
        <TextInput
          mode="outlined"
          label="Password"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry={!passwordVisible}
          right={
            <TextInput.Icon
              icon={passwordVisible ? "eye-off" : "eye"}
              onPress={() => setPasswordVisible(!passwordVisible)}
            />
          }
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {loading ? (
        <ActivityIndicator size="large" color="#6200ea" />
      ) : (
        <>
          <Button mode="contained" onPress={handleAuth}>
            {isSignUp ? "Sign Up" : "Login"}
          </Button>
          <View style={styles.switchContainer}>
            <ThemedText>
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
            </ThemedText>
            <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
              <ThemedText style={styles.linkText}>
                {isSignUp ? "Login" : "Sign Up"}
              </ThemedText>
            </TouchableOpacity>
          </View>
          <Divider style={{ marginVertical: 20 }} />
          <Button
            mode="contained"
            onPress={handleGoogleSignIn}
            style={styles.googleButton}
          >
            Sign in with Google
          </Button>
          <Button
            mode="contained"
            onPress={handleFacebookSignIn}
            style={styles.socialButton}
          >
            Sign in with Facebook
          </Button>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f0f4ff",
  },
  title: {
    fontSize: 28,
    marginVertical: 20,
    textAlign: "center",
    color: "#6200ea",
    fontWeight: "bold",
  },
  input: {
    flex: 1,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  emailInput: {
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  errorText: {
    color: "#d32f2f",
    marginBottom: 12,
    textAlign: "center",
  },
  socialButton: {
    marginTop: 10,
    backgroundColor: "#3f51b5",
  },
  googleButton: {
    marginTop: 10,
    backgroundColor: "#cccccc",
  },
  switchContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  linkText: {
    color: "#6200ea",
    fontWeight: "bold",
    marginTop: 10,
  },
});
