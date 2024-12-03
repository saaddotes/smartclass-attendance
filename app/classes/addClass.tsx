import React, { useState } from "react";
import { View, StyleSheet, Alert, FlatList } from "react-native";
import {
  TextInput,
  Button,
  Text,
  Card,
  Divider,
  ActivityIndicator,
} from "react-native-paper";

import { useRouter } from "expo-router";
import { getData, storeData } from "@/utils/asyncStorage";
import Papa from "papaparse";
import * as DocumentPicker from "expo-document-picker";
import { Class, Student } from "@/utils/firebase";

export default function AddClassScreen() {
  const router = useRouter();
  const [name, setName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [studentsData, setStudentsData] = useState<Student[]>([]);

  const now = Date.now().toString();

  const addClass = async () => {
    const newClass: Class = { id: now, name, students: studentsData };
    const existingClasses = (await getData<Class[]>("classes")) || [];
    const updatedClasses = [...existingClasses, newClass];
    await storeData("classes", updatedClasses);
    // await storeData(`class-${now}`, studentsData);
    router.push("/classes");
  };

  const handleFilePicker = async () => {
    setLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "text/csv",
      });

      if (result.canceled) {
        console.log("Document selection canceled");
        setLoading(false);
        return;
      }

      const fileDetails = result.assets?.[0];
      if (!fileDetails) {
        throw new Error("No file selected");
      }

      const fileContent = await fetch(fileDetails.uri).then((res) =>
        res.text()
      );

      const parsedData = Papa.parse<Student>(fileContent, {
        header: true,
        skipEmptyLines: true,
      });

      console.log("parsed ", parsedData, "\ndata ", parsedData.data);

      if (!parsedData.data || parsedData.data.length === 0) {
        throw new Error("CSV file is empty or contains invalid data");
      }

      const uniqueRollNumbers = new Set<string>();
      const validStudents: Student[] = parsedData.data.filter(
        (student: any) => {
          const trimmedStudent = {
            rollNumber: String(student.rollNumber).trim(),
          };

          if (!trimmedStudent.rollNumber) {
            console.error("Invalid student row:", student);
            return false;
          }

          if (uniqueRollNumbers.has(trimmedStudent.rollNumber)) {
            console.error(
              "Duplicate roll number found:",
              trimmedStudent.rollNumber
            );
            return false;
          }

          uniqueRollNumbers.add(trimmedStudent.rollNumber);
          return true;
        }
      );
      console.log("validateStudents", validStudents);

      setStudentsData(validStudents);
      await storeData(`class-${now}`, validStudents);
      Alert.alert("Success", "Students uploaded successfully!");
    } catch (error: any) {
      console.error("Error processing CSV file:", error);
      Alert.alert("Error", error.message || "Could not process the CSV file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add New Class</Text>
      <TextInput
        mode="outlined"
        label="Class Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <Divider style={styles.divider} />

      <Text style={styles.title}>Upload Students</Text>
      <Button
        mode="contained-tonal"
        onPress={handleFilePicker}
        loading={loading}
        disabled={loading}
        style={styles.uploadButton}
      >
        {loading ? "Uploading..." : "Upload CSV"}
      </Button>

      {studentsData.length > 0 && (
        <FlatList
          data={studentsData}
          keyExtractor={(item) => item.rollNumber + item.name}
          // ItemSeparatorComponent={() => <Divider style={styles.divider} />}
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
      {loading && (
        <ActivityIndicator
          animating={true}
          size="large"
          style={styles.loader}
        />
      )}

      <Button
        mode="contained"
        onPress={addClass}
        style={styles.addButton}
        contentStyle={styles.buttonContent}
      >
        Add Class
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f4f4f4",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  input: {
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  addButton: {
    marginBottom: 20,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  divider: {
    marginVertical: 20,
  },
  uploadButton: {
    marginBottom: 16,
    borderRadius: 8,
  },
  studentCard: {
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  loader: {
    marginTop: 16,
  },
});
