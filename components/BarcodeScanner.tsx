import React, { useEffect, useState } from "react";
import {
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { Audio } from "expo-av";

export default function Camera() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [sound, setSound] = useState<any>(null); // Initialize sound as null

  // Ensure permission is loaded and granted
  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  // Handle QR code scan
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    console.log("scanned", data);
    if (sound) {
      await sound.playAsync(); // Play sound only if sound is available
    }
    // Add your logic to process the scanned data (e.g., marking attendance)
  };

  // Toggle camera facing (back/front)
  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  // Load sound when the component mounts
  // useEffect(() => {
  //   const loadSound = async () => {
  //     try {
  //       const { sound: beepSound } = await Audio.Sound.createAsync(
  //         require("../assets/audio/beep.mp3") // Correct path to beep sound
  //       );
  //       setSound(beepSound);
  //     } catch (error) {
  //       console.error("Error loading sound:", error);
  //     }
  //   };

  //   loadSound();

  //   // Cleanup sound on component unmount
  //   return () => {
  //     if (sound) {
  //       sound.unloadAsync();
  //     }
  //   };
  // }, []); // Empty dependency array ensures the effect runs only once on mount

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        onBarcodeScanned={handleBarCodeScanned} // Keep the scan callback
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <Text style={styles.text}>Flip Camera</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  buttonContainer: {
    position: "absolute",
    top: 50,
    left: "50%",
    transform: [{ translateX: -50 }],
  },
  button: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 10,
    borderRadius: 5,
  },
  text: {
    fontSize: 18,
    color: "white",
  },
});
