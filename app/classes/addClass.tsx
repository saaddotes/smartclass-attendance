import React, { useState } from "react";
import { View, StyleSheet, Alert, FlatList, Modal } from "react-native";
import {
  TextInput,
  Button,
  Text,
  Card,
  Divider,
  ActivityIndicator,
  IconButton,
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
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);

  const now = Date.now().toString();

  const addClass = async () => {
    const newClass: Class = { id: now, name, students: studentsData };
    const existingClasses = (await getData<Class[]>("classes")) || [];
    const updatedClasses = [...existingClasses, newClass];
    await storeData("classes", updatedClasses);
    // await storeData(`class-${now}`, studentsData);
    router.push("/");
  };

  const deleteClass = async (rollNumber: string) => {
    const updatedStudents = studentsData.filter(
      (std) => std.rollNumber !== rollNumber
    );
    setStudentsData(updatedStudents);
    // await storeData("classes", updatedStudents);
  };

  const confirmDelete = (rollNumber: string) => {
    Alert.alert("Delete Class", "Are you sure you want to delete this class?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteClass(rollNumber),
      },
    ]);
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

      setStudentsData([...studentsData, ...validStudents]);
      await storeData(`class-${now}`, [...studentsData, ...validStudents]);
      Alert.alert("Success", "Students uploaded successfully!");
    } catch (error: any) {
      console.error("Error processing CSV file:", error);
      Alert.alert("Error", error.message || "Could not process the CSV file");
    } finally {
      setLoading(false);
    }
  };

  const saveStudent = () => {
    if (!currentStudent) return;

    const isEditing = studentsData.some(
      (student) => student.rollNumber === currentStudent.rollNumber
    );

    if (isEditing) {
      // Edit existing student
      const updatedStudents = studentsData.map((student) =>
        student.rollNumber === currentStudent.rollNumber
          ? currentStudent
          : student
      );
      setStudentsData(updatedStudents);
    } else {
      // Add new student
      setStudentsData([...studentsData, currentStudent]);
    }

    closeModal();
  };

  const closeModal = () => {
    setCurrentStudent(null);
    setIsModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.container}>
        <Text style={styles.title}>Add New Class</Text>
        <TextInput
          mode="outlined"
          label="Class Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Button
            mode="elevated"
            // onPress={handleFilePicker}
            loading={loading}
            disabled={loading}
            onPress={() => {
              setCurrentStudent({ name: "", rollNumber: "", email: "" });
              setIsModalVisible(true);
            }}
            style={styles.uploadButton}
          >
            {loading ? "Adding..." : "Add Student +"}
          </Button>
          <Button
            mode="contained-tonal"
            onPress={handleFilePicker}
            loading={loading}
            disabled={loading}
            style={styles.uploadButton}
          >
            {loading ? "Uploading..." : "Import Students (CSV)"}
          </Button>
        </View>

        <Divider style={styles.divider} />

        {/* <Text style={styles.title}>Add Students</Text> */}

        {studentsData.length > 0 && (
          <FlatList
            data={studentsData}
            keyExtractor={(item) => item.rollNumber + item.name}
            // ItemSeparatorComponent={() => <Divider style={styles.divider} />}
            renderItem={({ item }) => (
              <Card style={styles.studentCard}>
                <Card.Content>
                  <View style={styles.cardRow}>
                    <View style={styles.cardDetails}>
                      <Text variant="titleMedium" style={styles.studentName}>
                        {item.name}
                      </Text>
                      <Text style={styles.studentInfo}>{item.rollNumber}</Text>
                      <Text style={styles.studentInfo}>{item.email}</Text>
                    </View>
                    <View style={styles.cardActions}>
                      <IconButton
                        icon="pencil"
                        mode="contained"
                        onPress={() => {
                          setCurrentStudent(item); // Pass the selected student
                          setIsModalVisible(true);
                        }}
                      />
                      <IconButton
                        icon="delete"
                        iconColor="#d32f2f"
                        onPress={() => confirmDelete(item.rollNumber)}
                      />
                    </View>
                  </View>
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
      </View>
      <Button
        mode="contained"
        onPress={addClass}
        style={styles.addButton}
        contentStyle={styles.buttonContent}
      >
        Add Class
      </Button>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <Card style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {currentStudent &&
              studentsData.some(
                (student) => student.rollNumber === currentStudent.rollNumber
              )
                ? "Edit Student"
                : "Add Student"}
            </Text>
            <TextInput
              mode="outlined"
              label="Name"
              value={currentStudent?.name || ""}
              onChangeText={(text) =>
                setCurrentStudent((prev) =>
                  prev
                    ? { ...prev, name: text }
                    : { name: text, rollNumber: "", email: "" }
                )
              }
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="Roll Number"
              value={currentStudent?.rollNumber || ""}
              editable={
                !currentStudent ||
                !studentsData.some(
                  (student) => student.rollNumber === currentStudent.rollNumber
                )
              } // Editable for new students
              onChangeText={(text) =>
                setCurrentStudent((prev) =>
                  prev
                    ? { ...prev, rollNumber: text }
                    : { rollNumber: text, name: "", email: "" }
                )
              }
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="Email"
              value={currentStudent?.email || ""}
              onChangeText={(text) =>
                setCurrentStudent((prev) =>
                  prev
                    ? { ...prev, email: text }
                    : { email: text, name: "", rollNumber: "" }
                )
              }
              style={styles.input}
            />
            <Button
              mode="contained"
              onPress={saveStudent}
              style={styles.saveButton}
            >
              Save
            </Button>
            <Button
              mode="outlined"
              onPress={closeModal}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
          </Card>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f4f4f4",
  },
  saveButton: {
    marginTop: 12,
    borderRadius: 8,
  },
  cancelButton: {
    marginTop: 12,
    borderRadius: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    padding: 20,
    backgroundColor: "white",
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
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
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardDetails: {
    flex: 1,
    marginRight: 8,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  studentInfo: {
    fontSize: 14,
    color: "#555",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
});
