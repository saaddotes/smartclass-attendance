import React, { useState, useEffect, useCallback } from "react";
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
import AntDesign from "@expo/vector-icons/AntDesign";
import { Moment } from "moment";
import WeekCalendar from "@/components/CalenderWeekly";

type Attendance = {
  student: Student;
  status: "Present" | "Absent" | "Skipped";
};

const AttendanceManager: React.FC = () => {
  const router = useRouter();
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const [markedDates, setMarkedDates] = useState<string[]>([]);

  const todayDate = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayDate);
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [studentsData, setStudentsData] = useState<Student[]>([]);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [isModalVisible, setModalVisible] = useState(true);

  const handleDateChange = (date: Moment) => {
    setSelectedDate(date.format("YYYY-MM-DD"));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const classes = await getData<Class[]>("classes");
        if (classes) {
          const filteredClass = classes.find((cls) => cls.id === classId);
          if (filteredClass) {
            setStudentsData(filteredClass.students);
          }
        }

        const existingAttendance =
          (await getData<Record<string, Attendance[]>>(
            `attendance-${classId}`
          )) || {};
        const markedDates = Object.keys(existingAttendance);
        setMarkedDates(markedDates);

        const todaysAttendance = existingAttendance[selectedDate] || [];
        setCurrentStudentIndex(
          todaysAttendance.length > 0 ? todaysAttendance.length - 1 : 0
        );
        setAttendanceData(todaysAttendance);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [classId, selectedDate]);

  const handleAttendance = useCallback(
    (status: "Present" | "Absent" | "Skipped") => {
      const student = studentsData[currentStudentIndex];
      const updatedData = [...attendanceData];
      const existingRecordIndex = updatedData.findIndex(
        (record) => record.student.rollNumber === student.rollNumber
      );

      if (existingRecordIndex !== -1) {
        updatedData[existingRecordIndex].status = status;
      } else {
        updatedData.push({ student, status });
      }

      setAttendanceData(updatedData);

      if (currentStudentIndex === studentsData.length - 1) {
        autoSave(updatedData);
        alert("Attendance has been successfully saved!");
      }
      navigateStudent("next");
    },
    [attendanceData, currentStudentIndex, studentsData, selectedDate, classId]
  );

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
          ? Math.min(prevIndex + 1, studentsData.length - 1)
          : Math.max(prevIndex - 1, 0);
      return newIndex;
    });
  };
  const autoSave = async (updatedData: Attendance[]) => {
    try {
      const existingAttendance =
        (await getData<Record<string, Attendance[]>>(
          `attendance-${classId}`
        )) || {};

      existingAttendance[selectedDate] = updatedData;

      await storeData(`attendance-${classId}`, existingAttendance);
    } catch (error) {
      console.error("Error saving attendance:", error);
    }
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
          <Button mode="outlined" onPress={() => router.push("/classes")}>
            Cancel
          </Button>
          <Button mode="contained" onPress={handleSaveAttendance}>
            Save
          </Button>
        </View>
      </View>

      <WeekCalendar
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        markedDates={markedDates}
      />

      <ScrollView style={styles.attendanceList}>
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

      {studentsData.length > 0 ? (
        <>
          {currentStudent ? (
            <>
              {isModalVisible ? (
                <>
                  <ProgressBar
                    progress={progress}
                    style={styles.progressBar}
                    color="#6200ee"
                  />
                  <View style={styles.studentCard}>
                    <TouchableOpacity
                      style={styles.closeButtonContainer}
                      onPress={() => setModalVisible(false)}
                    >
                      <AntDesign name="closecircle" size={24} color="black" />
                    </TouchableOpacity>
                    <View style={styles.infoContainer}>
                      <Text style={styles.studentName}>
                        {currentStudent.name}
                      </Text>
                      <Text style={styles.studentDetail}>
                        Roll No: {currentStudent.rollNumber}
                      </Text>
                      <Text style={styles.studentDetail}>
                        {currentStudent.email}
                      </Text>
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
                        disabled={
                          currentStudentIndex === studentsData.length - 1
                        }
                      >
                        <Text style={styles.arrow}>
                          {currentStudentIndex < studentsData.length - 1
                            ? "Next ➡️"
                            : ""}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              ) : (
                <Button onPress={() => setModalVisible(true)}>
                  View Attendance
                </Button>
              )}
            </>
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

  card: { marginVertical: 5, padding: 10 },
  selectedCard: { marginVertical: 5, padding: 10, backgroundColor: "#eef3fa" },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  studentText: { fontSize: 16 },

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
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    width: "100%",
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
  attendanceList: { flex: 1, paddingHorizontal: 2 },
});

export default AttendanceManager;
