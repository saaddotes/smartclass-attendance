import React, { useState } from "react";
import { TextInput, Button, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("An unknown error occurred.");
      }
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Login</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Login" onPress={handleLogin} />
      <View style={styles.signupContainer}>
        <ThemedText>Don't have an account?</ThemedText>
        {/* <Button title="Sign Up" onPress={() => router.push("/signup")} /> */}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 20,
    padding: 10,
  },
  signupContainer: {
    marginTop: 20,
    alignItems: "center",
  },
});
