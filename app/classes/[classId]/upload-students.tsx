import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { Text, Button, Card, Divider } from "react-native-paper";
import * as DocumentPicker from "expo-document-picker";
import Papa from "papaparse";
import { getData } from "@/utils/asyncStorage";
import { useLocalSearchParams } from "expo-router";

type Student = {
  name: string;
  rollNumber: string;
  email: string;
};

const UploadStudents: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [studentsData, setStudentsData] = useState<Student[]>([]);

  const { classId } = useLocalSearchParams(); // Get class ID
  console.log(classId);

  useEffect(() => {
    const loadClasses = async () => {
      const localClasses = await getData(`class-${classId}`);
      console.log("localClasses", localClasses, classId);

      if (localClasses) {
        setStudentsData(localClasses);
      }
    };
    if (classId) {
      loadClasses();
    }
  }, [classId]);

  const handleFilePicker = async () => {
    setLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "text/csv",
      });

      if (result.canceled) {
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

      const parsedData = Papa.parse(fileContent, { header: true });

      if (!Array.isArray(parsedData.data)) {
        throw new Error("Invalid CSV structure");
      }

      setStudentsData(parsedData.data);
    } catch (error: any) {
      console.error("Error processing CSV file:", error);
      alert(error.message || "Could not process the CSV file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Students</Text>
      <Button
        mode="contained"
        onPress={handleFilePicker}
        disabled={loading}
        style={styles.button}
      >
        {loading ? "Uploading..." : "Upload CSV"}
      </Button>

      {loading && (
        <ActivityIndicator
          size="large"
          animating={loading}
          style={styles.loadingIndicator}
        />
      )}

      {studentsData.length > 0 && (
        <FlatList
          data={studentsData}
          keyExtractor={(item) => item.rollNumber + item.name}
          ItemSeparatorComponent={() => <Divider />}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium">{item.name}</Text>
                <Text>{item.rollNumber}</Text>
                <Text>{item.email}</Text>
              </Card.Content>
            </Card>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    marginBottom: 20,
  },
  loadingIndicator: {
    marginTop: 20,
    alignSelf: "center",
  },
  card: {
    marginBottom: 12,
    borderRadius: 8,
    elevation: 3,
  },
});

export default UploadStudents;
