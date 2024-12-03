import React from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";

interface Student {
  id: string;
  name: string;
  status: "Present" | "Absent";
}

interface Props {
  students: Student[];
  onSave: () => void;
  isNewAttendance: boolean;
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
}

const AttendanceList: React.FC<Props> = ({ students, onSave, setStudents }) => {
  const toggleAttendance = (id: string) => {
    setStudents((prevStudents) =>
      prevStudents.map((student) =>
        student.id === id
          ? {
              ...student,
              status: student.status === "Present" ? "Absent" : "Present",
            }
          : student
      )
    );
  };

  return (
    <View>
      {students.map((student) => (
        <TouchableOpacity
          key={student.id}
          onPress={() => toggleAttendance(student.id)}
        >
          <Text style={styles.studentText}>
            {student.name} - {student.status}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  studentText: { fontSize: 16, padding: 10 },
});

export default AttendanceList;
