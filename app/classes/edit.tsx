import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   Button,
//   StyleSheet,
//   Alert,
//   FlatList,
// } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getData, storeData } from "@/utils/asyncStorage";
import { Class } from "@/utils/firebase";
import { View, StyleSheet, FlatList, Alert } from "react-native";
import { TextInput, Button, Text, Card, Divider } from "react-native-paper";

// Define a type for Student
type Student = {
  name: string;
  rollNumber: string;
  email: string;
};

const EditClassScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [newStudent, setNewStudent] = useState<Student>({
    name: "",
    rollNumber: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);
  const [studentsData, setStudentsData] = useState<Student[]>([]);
  const [name, setName] = useState<string>("");
  const [classData, setClassData] = useState<Class | null>(null);

  useEffect(() => {
    const loadClassData = async () => {
      const storedClasses = await getData<Class[]>("classes");
      const studentsOfClass = await getData<Student[]>(`class-${id}`);

      if (studentsOfClass) {
        setStudentsData(studentsOfClass);
      } else {
        console.warn(`No students found for class-${id}`);
        setStudentsData([]);
      }

      if (storedClasses) {
        const classToEdit = storedClasses.find((cls) => cls.id === id);
        if (classToEdit) {
          setClassData(classToEdit);
          setName(classToEdit.name);
        }
      }
    };

    loadClassData();
  }, [id]);

  const saveClass = async () => {
    if (!classData) return;

    try {
      const updatedClass: Class = { ...classData, name };
      const storedClasses = await getData<Class[]>("classes");

      if (storedClasses) {
        const classIndex = storedClasses.findIndex(
          (cls) => cls.id === updatedClass.id
        );

        if (classIndex !== -1) {
          storedClasses[classIndex] = updatedClass;
          await storeData("classes", storedClasses);
          Alert.alert("Success", "Class updated successfully!");
          router.push("/classes");
        }
      }
    } catch (error) {
      console.error("Failed to save class:", error);
      Alert.alert("Error", "Failed to save class.");
    }
  };

  const addStudent = async () => {
    if (!newStudent.name || !newStudent.rollNumber || !newStudent.email) {
      Alert.alert("Error", "All fields are required.");
      return;
    }

    try {
      const updatedStudents = [...studentsData, newStudent];
      setStudentsData(updatedStudents); // Update state immediately
      await storeData(`class-${id}`, updatedStudents); // Persist the data
      setNewStudent({ name: "", rollNumber: "", email: "" }); // Reset form
    } catch (error) {
      console.error("Failed to add student:", error);
      Alert.alert("Error", "Failed to add student.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Class</Text>
      <TextInput
        mode="outlined"
        label="Class Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      {studentsData.length > 0 && (
        <FlatList
          data={studentsData}
          keyExtractor={(item) => item.rollNumber}
          ItemSeparatorComponent={() => <Divider />}
          renderItem={({ item }) => (
            <Card style={styles.studentCard}>
              <Card.Content>
                <Text variant="titleMedium">{item.name}</Text>
                <Text>{item.rollNumber}</Text>
                <Text>{item.email}</Text>
              </Card.Content>
            </Card>
          )}
        />
      )}

      <View style={styles.studentForm}>
        <TextInput
          mode="outlined"
          label="Name"
          value={newStudent.name}
          onChangeText={(text) => setNewStudent({ ...newStudent, name: text })}
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="Roll Number"
          value={newStudent.rollNumber}
          onChangeText={(text) =>
            setNewStudent({ ...newStudent, rollNumber: text })
          }
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="Email"
          value={newStudent.email}
          onChangeText={(text) => setNewStudent({ ...newStudent, email: text })}
          style={styles.input}
        />
        <Button mode="contained" onPress={addStudent} style={styles.addButton}>
          Add Student
        </Button>
      </View>

      <Button mode="contained" onPress={saveClass} style={styles.saveButton}>
        Save
      </Button>

      <Button
        mode="outlined"
        onPress={() => router.push("/classes")}
        style={styles.cancelButton}
      >
        Cancel
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    marginBottom: 16,
  },
  studentCard: {
    marginBottom: 12,
    borderRadius: 8,
  },
  studentForm: {
    marginTop: 20,
    marginBottom: 20,
  },
  addButton: {
    marginTop: 12,
    borderRadius: 8,
  },
  saveButton: {
    marginTop: 12,
    borderRadius: 8,
  },
  cancelButton: {
    marginTop: 12,
    borderRadius: 8,
  },
});

export default EditClassScreen;
