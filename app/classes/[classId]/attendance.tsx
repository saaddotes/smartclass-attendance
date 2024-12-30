import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
} from "react-native";
import { Card, Button, ProgressBar } from "react-native-paper";
import { getData, storeData } from "@/utils/asyncStorage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Class, Student } from "@/utils/firebase";
import CalendarStrip from "react-native-calendar-strip";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Moment } from "moment";

type Attendance = {
  student: Student;
  status: "Present" | "Absent" | "Skipped";
};

const AttendanceManager: React.FC = () => {
  const router = useRouter();
  const { classId } = useLocalSearchParams<{ classId: string }>();

  const todayDate = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayDate);
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [studentsData, setStudentsData] = useState<Student[]>([]);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [isModalVisible, setModalVisible] = useState(false);
  const onDayPress = (date: Moment) => {
    setSelectedDate(date.format("YYYY-MM-DD"));
  };

  useEffect(() => {
    const fetchStudents = async () => {
      const classes = await getData<Class[]>("classes");
      if (classes) {
        const filteredClass = classes.find((cls) => cls.id === classId);
        if (filteredClass) {
          setStudentsData(filteredClass.students);
        }
      }
    };

    fetchStudents();
  }, [classId]);

  useEffect(() => {
    const fetchAttendance = async () => {
      const existingAttendance =
        (await getData<Record<string, Attendance[]>>(
          `attendance-${classId}`
        )) || {};

      const todaysAttendance = existingAttendance[selectedDate] || [];

      setAttendanceData(todaysAttendance);
    };

    fetchAttendance();
  }, [classId, selectedDate]);

  const handleAttendance = (status: "Present" | "Absent" | "Skipped") => {
    const student = studentsData[currentStudentIndex];

    setAttendanceData((prev) => {
      const updatedData = [...prev];
      const existingRecordIndex = updatedData.findIndex(
        (record) => record.student.rollNumber === student.rollNumber
      );

      if (existingRecordIndex !== -1) {
        updatedData[existingRecordIndex].status = status;
      } else {
        updatedData.push({ student, status });
      }

      return updatedData;
    });
    navigateStudent("next");
  };

  const handleToggleAttendance = (rollNumber: string) => {
    const updatedAttendance = attendanceData.map<Attendance>((record) =>
      record.student.rollNumber === rollNumber
        ? {
            ...record,
            status: record.status === "Present" ? "Absent" : "Present",
          }
        : record
    );
    setAttendanceData(updatedAttendance);
  };

  const navigateStudent = (direction: "next" | "previous") => {
    setCurrentStudentIndex((prevIndex) => {
      const newIndex =
        direction === "next"
          ? Math.min(prevIndex + 1, studentsData.length)
          : Math.max(prevIndex - 1, 0);
      return newIndex;
    });
  };

  const handleSaveAttendance = async () => {
    try {
      const existingAttendance =
        (await getData<Record<string, Attendance[]>>(
          `attendance-${classId}`
        )) || {};

      existingAttendance[selectedDate] = attendanceData;

      await storeData(`attendance-${classId}`, existingAttendance);

      alert("Attendance has been successfully saved!");
      router.push("/classes");
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert("Failed to save attendance. Please try again.");
    }
  };

  const currentStudent = studentsData[currentStudentIndex] || null;
  console.log("currentStudent", currentStudent);

  const progress =
    studentsData.length > 0
      ? parseFloat(((currentStudentIndex + 1) / studentsData.length).toFixed(2))
      : 0;

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Attendance</Text>
        <View style={styles.headerButtons}>
          <Button
            mode="outlined"
            onPress={() => router.push("/classes")}
            // style={styles.outlinedButton}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSaveAttendance}
            // style={styles.containedButton}
          >
            Save
          </Button>
        </View>
      </View>

      {/* <CalendarStrip
        style={styles.calendarStrip}
        scrollable
        selectedDate={new Date(selectedDate)}
        onDateSelected={onDayPress}
        highlightDateNameStyle={{ color: "white" }}
        highlightDateNumberStyle={{ color: "white" }}
        dateNameStyle={{ color: "black" }}
        dateNumberStyle={{ color: "black" }}
        highlightDateContainerStyle={{ backgroundColor: "#6200ee" }}
      /> */}

      <ScrollView style={styles.attendanceList}>
        {/* <Text style={styles.dateText}>Attendance for</Text> */}
        {attendanceData.map((attendance) => (
          <Card
            key={attendance.student.rollNumber}
            onPress={() =>
              setCurrentStudentIndex(
                studentsData.findIndex(
                  (student) =>
                    student.rollNumber === attendance.student.rollNumber
                )
              )
            }
            style={
              currentStudentIndex !== -1 &&
              studentsData[currentStudentIndex]?.rollNumber ===
                attendance.student.rollNumber
                ? styles.selectedCard
                : styles.card
            }
          >
            <View style={styles.cardContent}>
              <Text style={styles.studentText}>
                {attendance.student.name} : {attendance.student.rollNumber}
              </Text>
              <Button
                key={`${attendance.student.rollNumber}-${attendance.status}`}
                style={
                  attendance.status === "Present"
                    ? styles.present
                    : attendance.status === "Absent"
                    ? styles.absent
                    : styles.skip
                }
                onPress={() =>
                  handleToggleAttendance(attendance.student.rollNumber)
                }
              >
                {attendance.status}
              </Button>
            </View>
          </Card>
        ))}
      </ScrollView>

      <ProgressBar
        progress={progress}
        style={styles.progressBar}
        color="#6200ee"
      />

      {studentsData.length > 0 ? (
        <>
          {currentStudent ? (
            <View style={styles.studentCard}>
              <TouchableOpacity
                style={styles.closeButtonContainer}
                onPress={() => setCurrentStudentIndex(-1)}
              >
                <AntDesign name="closecircle" size={24} color="black" />
              </TouchableOpacity>
              <View style={styles.infoContainer}>
                <Text style={styles.studentName}>{currentStudent.name}</Text>
                <Text style={styles.studentDetail}>
                  Roll No: {currentStudent.rollNumber}
                </Text>
                <Text style={styles.studentDetail}>{currentStudent.email}</Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.attendanceButton, styles.absent]}
                  onPress={() => handleAttendance("Absent")}
                >
                  <Text style={styles.buttonText}>Absent</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.attendanceButton, styles.skip]}
                  onPress={() => handleAttendance("Skipped")}
                >
                  <Text style={styles.buttonText}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.attendanceButton, styles.present]}
                  onPress={() => handleAttendance("Present")}
                >
                  <Text style={styles.buttonText}>Present</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.navigation}>
                <TouchableOpacity
                  onPress={() => navigateStudent("previous")}
                  disabled={currentStudentIndex === 0}
                >
                  <Text style={styles.arrow}>
                    {currentStudentIndex > 0 ? "⬅️ Previous" : ""}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigateStudent("next")}
                  disabled={currentStudentIndex === studentsData.length - 1}
                >
                  <Text style={styles.arrow}>
                    {currentStudentIndex < studentsData.length - 1
                      ? "Next ➡️"
                      : ""}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.studentCard}>
              <View style={styles.infoContainer}>
                <Text style={styles.message}>
                  All Students have been marked.
                </Text>
              </View>
            </View>
          )}
        </>
      ) : (
        <View style={styles.studentCard}>
          <View style={styles.infoContainer}>
            <Text style={styles.message}>
              No students found for this class.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 10 },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  headerButtons: {
    flexDirection: "row",
    gap: 3,
    marginVertical: 5,
  },
  dateButton: {
    marginBottom: 10,
  },
  calendarStrip: {
    height: 100,
    paddingTop: 10,
    paddingBottom: 10,
  },
  content: { flex: 1 },
  dateText: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  card: { marginVertical: 5, padding: 10 },
  selectedCard: { marginVertical: 5, padding: 10, backgroundColor: "#eef3fa" },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  studentText: { fontSize: 16 },
  saveButton: { marginTop: 20 },
  status: { fontSize: 16, fontWeight: "bold" },
  progressBar: {
    height: 8,
    marginVertical: 16,
  },
  studentCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 16,
    alignItems: "center",
  },
  infoContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  studentName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  studentDetail: {
    fontSize: 16,
    marginVertical: 4,
  },
  badge: {
    fontSize: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    width: "100%",
  },
  progressBarContainer: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  attendanceButton: {
    padding: 12,
    borderRadius: 8,
    width: "30%",
    alignItems: "center",
    borderWidth: 1,
  },
  absent: {
    backgroundColor: "#f8d7da",
    borderColor: "#f5c6cb",
  },
  skip: {
    backgroundColor: "#fff3cd",
    borderColor: "#ffeeba",
  },
  present: {
    backgroundColor: "#d4edda",
    borderColor: "#c3e6cb",
  },
  buttonText: {
    color: "#333",
    fontWeight: "bold",
  },
  navigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    width: "100%",
  },
  closeButtonContainer: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  arrow: {
    fontSize: 16,
    color: "#6200ee",
  },
  message: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
  },
  skippedContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    elevation: 2,
  },
  skippedHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  skippedStudent: {
    fontSize: 16,
    paddingVertical: 4,
    color: "#6200ee",
  },
  saveButtonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  statsHeader: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  statsCard: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  statsDate: { fontSize: 16, fontWeight: "bold", marginBottom: 8 },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  statsLabel: { fontSize: 14 },
  presentStat: { color: "#155724" },
  absentStat: { color: "#721c24" },
  skippedStat: { color: "#856404" },
  containedButton: {
    backgroundColor: "#6200ee",
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  containedButtonText: {
    color: "#ffffff",
    fontWeight: "500",
    fontSize: 14,
  },
  outlinedButton: {
    backgroundColor: "transparent",
    borderColor: "#6200ee",
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  outlinedButtonText: {
    color: "#6200ee",
    fontWeight: "500",
    fontSize: 14,
  },
  attendanceList: { flex: 1, paddingHorizontal: 2 },
  selectedDate: {
    marginTop: 10,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  calendarContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "90%",
    alignItems: "center",
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#00adf5",
    borderRadius: 5,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default AttendanceManager;
