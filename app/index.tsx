import React from "react";
import { Button, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
// import Camera from "@/components/BarcodeScanner";

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Welcome to the Dashboard</ThemedText>
      <Button title="Manage Classes" onPress={() => router.push("/classes")} />
      <Button title="Login Account" onPress={() => router.push("/login")} />
      {/* <Camera /> */}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
});
