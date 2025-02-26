import { getData, storeData } from "@/utils/asyncStorage";
import { Class, Student } from "@/utils/firebase";
import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import Papa from "papaparse";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  ToastAndroid,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Divider,
  IconButton,
  Text,
  TextInput,
} from "react-native-paper";

export default function ClassManagementScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [name, setName] = useState<string>("");
  const [studentsData, setStudentsData] = useState<Student[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [, setIsCSVFormatVisible] = useState(false);
  const isEditing = !!id;

  useEffect(() => {
    if (isEditing) {
      loadClassData();
    }
  }, [id]);

  const loadClassData = async () => {
    const storedClasses = await getData<Class[]>("classes");
    if (storedClasses) {
      const classToEdit = storedClasses.find((cls) => cls.id === id);
      if (classToEdit) {
        setName(classToEdit.name);
        setStudentsData(classToEdit.students || []);
      }
    }
  };

  const saveClass = async () => {
    try {
      const newClass: Class = {
        id: Array.isArray(id) ? id[0] : id || Date.now().toString(),
        name,
        students: studentsData,
      };
      const storedClasses = (await getData<Class[]>("classes")) || [];
      let updatedClasses: Class[];

      if (isEditing) {
        updatedClasses = storedClasses.map((cls) =>
          cls.id === id ? newClass : cls
        );
      } else {
        updatedClasses = [...storedClasses, newClass];
      }

      await storeData("classes", updatedClasses);
      ToastAndroid.show(
        `Class ${isEditing ? "updated" : "added"} successfully!`,
        ToastAndroid.SHORT
      );
      router.push("/");
    } catch (error) {
      console.error("Failed to save class:", error);
      ToastAndroid.show("Failed to save class.", ToastAndroid.SHORT);
    }
  };

  const deleteStudent = (rollNumber: string) => {
    const updatedStudents = studentsData.filter(
      (std) => std.rollNumber !== rollNumber
    );
    setStudentsData(updatedStudents);
  };

  const confirmDeleteStudent = (rollNumber: string) => {
    Alert.alert(
      "Delete Student",
      "Are you sure you want to delete this student?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: () => {
            deleteStudent(rollNumber);
            ToastAndroid.show(
              "Student deleted successfully!",
              ToastAndroid.SHORT
            );
          },
          style: "destructive",
        },
      ]
    );
  };

  const showCSVFormat = () => {
    Alert.alert(
      "CSV Format Instructions",
      "Please ensure your CSV file follows this format:\n\n" +
        "1. The first row should contain the column headers: name, rollNumber, email.\n" +
        "2. Each subsequent row should contain the student's details.\n\n" +
        "Example:\n" +
        "name,rollNumber,email\n" +
        "Saad Ali,1234,saad@example.com\n" +
        "Asad Khan,5678,asad@example.com",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => setIsCSVFormatVisible(false),
        },
        {
          text: "Continue",
          onPress: () => {
            setIsCSVFormatVisible(false);
            handleFilePicker();
          },
        },
      ]
    );
  };

  const handleFilePicker = async () => {
    setLoading(true);
    ToastAndroid.show("Uploading...", ToastAndroid.SHORT);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "text/csv",
      });

      if (result.canceled) {
        console.log("Document selection canceled");
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

      if (!parsedData.data || parsedData.data.length === 0) {
        throw new Error("CSV file is empty or contains invalid data");
      }

      const uniqueRollNumbers = new Set<string>();
      const validStudents: Student[] = parsedData.data.filter(
        (student: any) => {
          const trimmedStudent = {
            name: String(student.name).trim(),
            rollNumber: String(student.rollNumber).trim(),
            email: String(student.email).trim(),
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

      setStudentsData((prevStudents) => [...prevStudents, ...validStudents]);
      ToastAndroid.show("Students uploaded successfully!", ToastAndroid.SHORT);
    } catch (error: any) {
      console.error("Error processing CSV file:", error);
      ToastAndroid.show(
        error.message || "Could not process the CSV file",
        ToastAndroid.SHORT
      );
    } finally {
      setLoading(false);
    }
  };

  const saveStudent = () => {
    if (!currentStudent) return;

    const isEditingStudent = studentsData.some(
      (student) => student.rollNumber === currentStudent.rollNumber
    );

    if (isEditingStudent) {
      const updatedStudents = studentsData.map((student) =>
        student.rollNumber === currentStudent.rollNumber
          ? currentStudent
          : student
      );
      setStudentsData(updatedStudents);
    } else {
      setStudentsData([...studentsData, currentStudent]);
    }

    closeModal();
  };

  const openModal = (student: Student | null = null) => {
    setCurrentStudent(student || { name: "", rollNumber: "", email: "" });
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setCurrentStudent(null);
    setIsModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.container}>
        <Text style={styles.title}>
          {isEditing ? "Edit Class" : "Add New Class"}
        </Text>
        <TextInput
          mode="outlined"
          label="Class Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <View style={styles.buttonContainer}>
          <Button
            mode="elevated"
            onPress={() => openModal()}
            style={styles.button}
          >
            Add Student
          </Button>
          <Button
            mode="contained-tonal"
            onPress={showCSVFormat}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            {loading ? "Uploading..." : "Import Students (CSV)"}
          </Button>
        </View>

        <Divider style={styles.divider} />

        {studentsData.length === 0 ? (
          <Text style={styles.noStudentsText}>
            No students available. Please add or import students.
          </Text>
        ) : (
          <FlatList
            data={studentsData}
            keyExtractor={(item) => item.rollNumber}
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
                        onPress={() => openModal(item)}
                      />
                      <IconButton
                        icon="delete"
                        iconColor="#d32f2f"
                        onPress={() => confirmDeleteStudent(item.rollNumber)}
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
        onPress={saveClass}
        style={styles.saveButton}
        disabled={!name.trim()}
      >
        {isEditing ? "Update" : "Done"}
      </Button>
      <Button
        mode="outlined"
        onPress={() => router.push("/")}
        style={styles.cancelButton}
      >
        Cancel
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
              label="Name *"
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
              label="Roll Number *"
              value={currentStudent?.rollNumber || ""}
              editable={
                !currentStudent ||
                !studentsData.some(
                  (student) => student.rollNumber === currentStudent.rollNumber
                )
              }
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
              label="Email (optional)"
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
              style={styles.modalButton}
              disabled={
                !currentStudent?.name.trim() ||
                !currentStudent?.rollNumber.trim()
              }
            >
              Save
            </Button>
            <Button
              mode="outlined"
              onPress={closeModal}
              style={styles.modalButton}
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
    padding: 8,
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
    backgroundColor: "#fff",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  divider: {
    marginVertical: 16,
  },
  studentCard: {
    margin: 10,
    borderRadius: 8,
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
  saveButton: {
    marginTop: 16,
    borderRadius: 8,
  },
  cancelButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  loader: {
    marginTop: 16,
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
  modalButton: {
    marginTop: 12,
    borderRadius: 8,
  },
  noStudentsText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#757575",
  },
});
