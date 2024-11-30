import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ProgressBar, Badge, Icon } from "react-native-paper";
import { getData, storeData } from "@/utils/asyncStorage";

type Student = {
  name: string;
  rollNumber: string;
  email: string;
};

const AttendanceScreen = () => {
  const { classId } = useLocalSearchParams();
  const [studentsData, setStudentsData] = useState<Student[]>([]);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [attendanceData, setAttendanceData] = useState<Record<string, string>>(
    {}
  );
  const [attendanceStats, setAttendanceStats] = useState([]);
  const [skippedStudents, setSkippedStudents] = useState<Student[]>([]);
  const [isAttendanceCompleted, setIsAttendanceCompleted] = useState(false);

  useEffect(() => {
    renderStats();
  }, []);

  const saveAttendance = async () => {
    const today = new Date().toISOString().split("T")[0];
    const existingAttendance = (await getData(`attendance-${classId}`)) || {};

    const updatedAttendance = {
      ...existingAttendance,
      [today]: {
        ...existingAttendance[today],
        ...attendanceData,
      },
    };

    await storeData(`attendance-${classId}`, updatedAttendance);
    renderStats(); // Refresh stats after saving
  };

  const renderStats = async () => {
    const attendanceRecords = (await getData(`attendance-${classId}`)) || {};
    const statsList = Object.entries(attendanceRecords).map(([date, data]) => ({
      date,
      ...calculateStats(data),
    }));

    setAttendanceStats(statsList);
  };

  const calculateStats = (attendanceData: Record<string, string>) => {
    let present = 0,
      absent = 0,
      skipped = 0;
    Object.values(attendanceData).forEach((status) => {
      if (status === "Present") present++;
      else if (status === "Absent") absent++;
      else if (status === "Skipped") skipped++;
    });
    return { present, absent, skipped };
  };

  useEffect(() => {
    const loadStudents = async () => {
      const localStudents = await getData<Student[]>(`class-${classId}`);
      if (localStudents) {
        const sortedStudents = localStudents.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        setStudentsData(sortedStudents);
      }
    };

    if (classId) {
      loadStudents();
    }
  }, [classId]);

  const handleAttendance = (status: string) => {
    const student = studentsData[currentStudentIndex];
    if (!student) return;

    // Remove from skipped list if present
    if (status !== "Skipped") {
      setSkippedStudents((prev) =>
        prev.filter((s) => s.rollNumber !== student.rollNumber)
      );
    }

    setAttendanceData((prev) => ({ ...prev, [student.rollNumber]: status }));
    if (status === "Skipped" && !skippedStudents.includes(student)) {
      setSkippedStudents((prev) => [...prev, student]);
    }
    const allMarked = studentsData.every(
      (student) => attendanceData[student.rollNumber]
    );
    setIsAttendanceCompleted(allMarked);

    navigateStudent("next");
  };

  const navigateStudent = (direction: "next" | "previous") => {
    setCurrentStudentIndex((prevIndex) => {
      if (direction === "next") {
        return Math.min(prevIndex + 1, studentsData.length - 1);
      } else {
        return Math.max(prevIndex - 1, 0);
      }
    });
  };

  const jumpToStudent = (rollNumber: string) => {
    const index = studentsData.findIndex(
      (student) => student.rollNumber === rollNumber
    );
    if (index !== -1) {
      setCurrentStudentIndex(index);
    }
  };

  const currentStudent = studentsData[currentStudentIndex];
  const progress =
    studentsData.length > 0
      ? (currentStudentIndex + 1) / studentsData.length
      : 0;

  const getBadgeStyle = (status: string | undefined) => {
    switch (status) {
      case "Present":
        return { backgroundColor: "#d4edda", color: "#155724" };
      case "Absent":
        return { backgroundColor: "#f8d7da", color: "#721c24" };
      case "Skipped":
        return { backgroundColor: "#fff3cd", color: "#856404" };
      default:
        return { backgroundColor: "#e2e3e5", color: "#6c757d" };
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.container}>
        <Text style={styles.header}>Attendance</Text>
        <ProgressBar
          progress={progress}
          style={styles.progressBar}
          color="#6200ee"
        />
        {currentStudent ? (
          <View style={styles.studentCard}>
            <View style={styles.infoContainer}>
              <Text style={styles.studentName}>{currentStudent.name}</Text>
              <Text style={styles.studentDetail}>
                Roll No: {currentStudent.rollNumber}
              </Text>
              <Text style={styles.studentDetail}>{currentStudent.email}</Text>
            </View>

            {/* <View style={styles.progressBarContainer}>
              <Text>Present</Text>
              <ProgressBar progress={20} color="green" />
            </View> */}

            {/* Badge with Color Indication */}
            <Badge
              style={[
                styles.badge,
                getBadgeStyle(attendanceData[currentStudent.rollNumber]),
              ]}
            >
              {attendanceData[currentStudent.rollNumber] || "Not Marked"}
            </Badge>

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

            {/* Navigation Arrows */}
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
          <Text style={styles.message}>No more students to mark!</Text>
        )}

        {/* Skipped Students List */}
        {skippedStudents.length > 0 && (
          <View style={styles.skippedContainer}>
            <Text style={styles.skippedHeader}>Skipped Students</Text>
            <ScrollView>
              {skippedStudents.map((student) => (
                <TouchableOpacity
                  key={student.rollNumber}
                  onPress={() => jumpToStudent(student.rollNumber)}
                >
                  <Text style={styles.skippedStudent}>{student.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {isAttendanceCompleted && (
        <TouchableOpacity style={styles.saveButton} onPress={saveAttendance}>
          <Text style={styles.saveButtonText}>Save Attendance</Text>
        </TouchableOpacity>
      )}

      {/* Attendance Stats */}
      <Text style={styles.statsHeader}>Attendance History</Text>
      {attendanceStats.map((stats) => (
        <AttendanceStatsCard key={stats.date} stats={stats} />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f9f9f9",
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
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
    // paddingVertical: 4,
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
  saveButton: {
    backgroundColor: "#6200ee",
    padding: 12,
    borderRadius: 8,
    marginVertical: 16,
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
});

const AttendanceStatsCard = ({ stats }: { stats: Record<string, number> }) => {
  return (
    <View style={styles.statsCard}>
      <Text style={styles.statsDate}>{stats.date}</Text>
      <View style={styles.statsRow}>
        <Text style={[styles.statsLabel, styles.presentStat]}>
          Present: {stats.present}
        </Text>
        <Text style={[styles.statsLabel, styles.absentStat]}>
          Absent: {stats.absent}
        </Text>
        <Text style={[styles.statsLabel, styles.skippedStat]}>
          Skipped: {stats.skipped}
        </Text>
      </View>
    </View>
  );
};

export default AttendanceScreen;
