import React, { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getData, storeData } from "@/utils/asyncStorage";
import { Class, Student } from "@/utils/firebase";
import { View, StyleSheet, FlatList, Alert, Modal } from "react-native";
import {
  TextInput,
  Button,
  Text,
  Card,
  Divider,
  IconButton,
} from "react-native-paper";

import Papa from "papaparse";
import * as DocumentPicker from "expo-document-picker";

export default function EditClassScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [newStudent, setNewStudent] = useState<Student>({
    name: "",
    rollNumber: "",
    email: "",
  });
  const [studentsData, setStudentsData] = useState<Student[]>([]);
  const [name, setName] = useState<string>("");
  const [classData, setClassData] = useState<Class | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const now = Date.now().toString();

  const closeModal = () => {
    setCurrentStudent(null);
    setIsModalVisible(false);
  };

  useEffect(() => {
    const loadClassData = async () => {
      const storedClasses = await getData<Class[]>("classes");

      if (storedClasses) {
        const classToEdit = storedClasses.find((cls) => cls.id === id);
        if (classToEdit) {
          setClassData(classToEdit);
          setName(classToEdit.name);
          setStudentsData(classToEdit.students || []);
        }
      }
    };

    loadClassData();
  }, [id]);

  const saveClass = async () => {
    if (!classData) return;

    try {
      const updatedClass: Class = {
        ...classData,
        name,
        students: studentsData,
      };
      const storedClasses = await getData<Class[]>("classes");

      if (storedClasses) {
        const classIndex = storedClasses.findIndex(
          (cls) => cls.id === updatedClass.id
        );

        if (classIndex !== -1) {
          storedClasses[classIndex] = updatedClass;
          await storeData("classes", storedClasses);
          Alert.alert("Success", "Class updated successfully!");
          router.push("/");
        }
      }
    } catch (error) {
      console.error("Failed to save class:", error);
      Alert.alert("Error", "Failed to save class.");
    }
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
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Button
          mode="elevated"
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
      {studentsData.length > 0 && (
        <FlatList
          data={studentsData}
          keyExtractor={(item) => item.rollNumber}
          ItemSeparatorComponent={() => <Divider />}
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
      {/* <Button
        mode="contained"
        onPress={() => {
          setCurrentStudent({ name: "", rollNumber: "", email: "" }); // Initialize empty student
          setIsModalVisible(true);
        }}
        style={styles.addButton}
      >
        Add Student
      </Button> */}

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

      <Button mode="contained" onPress={saveClass} style={styles.saveButton}>
        Done
      </Button>

      {/* <Button
        mode="outlined"
        onPress={() => router.push("/classes")}
        style={styles.cancelButton}
      >
        Cancel
      </Button> */}
    </View>
  );
}

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
    margin: 10,
    borderRadius: 8,
  },
  studentForm: {
    marginTop: 20,
    marginBottom: 20,
  },
  divider: {
    margin: 10,
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
  uploadButton: {
    marginBottom: 16,
    borderRadius: 8,
  },
});
