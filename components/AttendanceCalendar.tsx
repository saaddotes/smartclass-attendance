import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Calendar } from "react-native-calendars";
import { Button, Text, Card } from "react-native-paper";
import { getAttendanceForDate, updateAttendance } from "./api/attendance"; // Mock API calls
import { getData } from "@/utils/asyncStorage";
import { useLocalSearchParams } from "expo-router";

const AttendanceCalendar = () => {
  const { classId } = useLocalSearchParams();

  const [markedDates, setMarkedDates] = useState({});
  const [selectedDate, setSelectedDate] = useState("");
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    fetchAttendanceDays();
  }, []);

  const fetchAttendanceDays = async () => {
    const attendanceDays = await getData(`attendance-${classId}`);

    const marked = {};
    attendanceDays.forEach((day) => {
      marked[day] = { marked: true, dotColor: "green" };
    });
    setMarkedDates(marked);
  };

  const fetchAttendance = async (date) => {
    const data = await getAttendanceForDate(date); // Fetch attendance for the selected day
    setAttendance(data);
    setSelectedDate(date);
  };

  const handleToggleAttendance = (studentId) => {
    const updated = attendance.map((student) =>
      student.id === studentId
        ? { ...student, present: !student.present }
        : student
    );
    setAttendance(updated);
  };

  const handleSaveAttendance = async () => {
    await updateAttendance(selectedDate, attendance); // Save updated attendance
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
        <View style={styles.attendanceList}>
          <Text style={styles.dateText}>Attendance for {selectedDate}</Text>
          {attendance.map((student) => (
            <Card key={student.id} style={styles.card}>
              <Text>{student.name}</Text>
              <Button
                mode={student.present ? "contained" : "outlined"}
                onPress={() => handleToggleAttendance(student.id)}
              >
                {student.present ? "Present" : "Absent"}
              </Button>
            </Card>
          ))}
          <Button
            mode="contained"
            onPress={handleSaveAttendance}
            style={styles.saveButton}
          >
            Save Attendance
          </Button>
        </View>
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
  saveButton: { marginTop: 20 },
});

export default AttendanceCalendar;
