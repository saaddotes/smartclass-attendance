import React, { useState } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";

type Student = {
  name: string;
  rollNumber: string;
  email: string;
};

const AttendanceScreen: React.FC<{ students: Student[] }> = ({ students }) => {
  const router = useRouter();

  // State for tracking attendance status
  const [attendance, setAttendance] = useState<Map<string, string>>(new Map());

  // Sort students alphabetically by name
  const sortedStudents = [...students].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const handleAttendance = (rollNumber: string, status: string) => {
    setAttendance((prev) => new Map(prev).set(rollNumber, status));
  };

  //   const navigateToStudent = (index: number) => {
  //     router.push(`/students/${sortedStudents[index].rollNumber}`);
  //   };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance</Text>

      <FlatList
        data={sortedStudents}
        keyExtractor={(item) => item.rollNumber}
        horizontal
        renderItem={({ item, index }) => (
          <View style={styles.card}>
            <Text style={styles.studentName}>{item.name}</Text>
            <Text>{item.rollNumber}</Text>
            <Text>{item.email}</Text>

            <View style={styles.buttons}>
              <Button
                title="Absent"
                onPress={() => handleAttendance(item.rollNumber, "Absent")}
              />
              <Button
                title="Present"
                onPress={() => handleAttendance(item.rollNumber, "Present")}
              />
              <Button
                title="Skip"
                onPress={() => handleAttendance(item.rollNumber, "Skip")}
              />
            </View>

            <View style={styles.navigation}>
              {index > 0 && (
                <TouchableOpacity
                  onPress={() => console.log("previous", index - 1)}
                >
                  <Text style={styles.arrow}>{"<"}</Text>
                </TouchableOpacity>
              )}

              {index < sortedStudents.length - 1 && (
                <TouchableOpacity
                  onPress={() => console.log("next", index + 1)}
                >
                  <Text style={styles.arrow}>{">"}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    marginRight: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  studentName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  navigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    width: "100%",
  },
  arrow: {
    fontSize: 24,
    fontWeight: "bold",
  },
});

export default AttendanceScreen;
