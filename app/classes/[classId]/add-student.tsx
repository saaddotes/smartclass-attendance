import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { useLocalSearchParams } from "expo-router";

const AddStudent: React.FC = () => {
  const { classId } = useLocalSearchParams(); // Get class ID
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [rollNumber, setRollNumber] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleAddStudent = async () => {
    if (!name || !email || !rollNumber) {
      Alert.alert("Error", "All fields are required.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, `classes/${classId}/students`), {
        name,
        email,
        rollNumber,
      });
      Alert.alert("Success", "Student added successfully.");
      setName("");
      setEmail("");
      setRollNumber("");
    } catch (error) {
      Alert.alert("Error", "Failed to add student.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Student</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Roll Number"
        value={rollNumber}
        onChangeText={setRollNumber}
      />
      <Button
        title={loading ? "Adding..." : "Add Student"}
        onPress={handleAddStudent}
        disabled={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
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
    borderRadius: 5,
  },
});

export default AddStudent;
