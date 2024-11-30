import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Calendar } from "react-native-calendars";
import { Button, Text, Card } from "react-native-paper";
import { getData, storeData } from "@/utils/asyncStorage";
import { useLocalSearchParams } from "expo-router";

// Types
interface AttendanceRecord {
  [studentId: string]: "Present" | "Absent";
}

interface AttendanceData {
  [date: string]: AttendanceRecord;
}

interface Student {
  id: string;
  status: "Present" | "Absent";
}

const AttendanceCalendar: React.FC = () => {
  const { classId } = useLocalSearchParams<{ classId: string }>();

  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord>({});
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    fetchAttendanceDays();
  }, []);

  // Fetch attendance dates and mark them on the calendar
  const fetchAttendanceDays = async () => {
    const attendanceData = await getData<AttendanceData>(
      `attendance-${classId}`
    );
    if (attendanceData) {
      const marked = Object.keys(attendanceData).reduce((acc, date) => {
        acc[date] = { marked: true, dotColor: "green" };
        return acc;
      }, {} as Record<string, any>);
      setMarkedDates(marked);
    }
  };

  // Fetch attendance for the selected date
  const fetchAttendance = async (date: string) => {
    const attendanceData = await getData<AttendanceData>(
      `attendance-${classId}`
    );
    const attendanceForDate = attendanceData?.[date] || {};
    setAttendance(attendanceForDate);

    const studentList = Object.keys(attendanceForDate).map((id) => ({
      id,
      status: attendanceForDate[id],
    }));
    setStudents(studentList);
    setSelectedDate(date);
  };

  // Toggle attendance status for a specific student
  const handleToggleAttendance = (studentId: string) => {
    const updatedAttendance = {
      ...attendance,
      [studentId]: attendance[studentId] === "Present" ? "Absent" : "Present",
    };
    setAttendance(updatedAttendance);

    // Update the student list for rendering
    const updatedStudents = Object.keys(updatedAttendance).map((id) => ({
      id,
      status: updatedAttendance[id],
    }));
    setStudents(updatedStudents);
  };

  // Save the modified attendance back to storage
  const handleSaveAttendance = async () => {
    const attendanceData = await getData<AttendanceData>(
      `attendance-${classId}`
    );
    const updatedAttendanceData = {
      ...attendanceData,
      [selectedDate!]: attendance,
    };
    await storeData(`attendance-${classId}`, updatedAttendanceData);
    alert("Attendance updated successfully!");
  };

  return (
    <View style={styles.container}>
      <Calendar
        markedDates={markedDates}
        onDayPress={(day) => fetchAttendance(day.dateString)}
        style={styles.calendar}
      />
      {selectedDate && (
        <ScrollView style={styles.attendanceList}>
          <Text style={styles.dateText}>Attendance for {selectedDate}</Text>
          {students.map((student) => (
            <Card key={student.id} style={styles.card}>
              <View style={styles.cardContent}>
                <Text style={styles.studentText}>Student ID: {student.id}</Text>
                <Button
                  mode={student.status === "Present" ? "contained" : "outlined"}
                  onPress={() => handleToggleAttendance(student.id)}
                >
                  {student.status}
                </Button>
              </View>
            </Card>
          ))}
          <Button
            mode="contained"
            onPress={handleSaveAttendance}
            style={styles.saveButton}
          >
            Save Attendance
          </Button>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  calendar: { marginBottom: 20 },
  attendanceList: { flex: 1 },
  dateText: { fontSize: 18, marginBottom: 10 },
  card: { marginVertical: 5, padding: 10 },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  studentText: { fontSize: 16 },
  saveButton: { marginTop: 20 },
});

export default AttendanceCalendar;
