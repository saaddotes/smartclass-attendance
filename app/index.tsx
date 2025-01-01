import React, { useEffect, useState } from "react";
import { View, FlatList, StyleSheet, Alert } from "react-native";
import { Link, useRouter } from "expo-router";
import { getData, storeData, removeData } from "@/utils/asyncStorage";
import { syncClassesToFirestore, Class } from "@/utils/firebase";
import {
  Button,
  Card,
  Text,
  IconButton,
  FAB,
  Divider,
} from "react-native-paper";

export default function ClassListScreen() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);

  useEffect(() => {
    const loadClasses = async () => {
      const localClasses = await getData<Class[]>("classes");
      if (localClasses) {
        setClasses(localClasses);
      }
    };
    loadClasses();
  }, []);

  const deleteClass = async (id: string) => {
    const updatedClasses = classes.filter((cls) => cls.id !== id);
    setClasses(updatedClasses);
    await storeData("classes", updatedClasses);
  };

  const confirmDelete = (id: string) => {
    Alert.alert("Delete Class", "Are you sure you want to delete this class?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteClass(id) },
    ]);
  };

  const syncData = async () => {
    await syncClassesToFirestore(classes);
    Alert.alert("Synced successfully!");
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <Text style={styles.title}>Class List</Text>
        <Button
          mode="contained-tonal"
          // icon="plus"
          onPress={() => router.push("/classes/manageClass")}
          style={styles.button}
        >
          Add Class
        </Button>
      </View>
      <FlatList
        data={classes}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <Divider style={styles.divider} />}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.headerContainer}>
                <Text style={styles.className}>{item.name}</Text>
                <View style={styles.studentCountBadge}>
                  <Text style={styles.studentCountText}>
                    {item.students?.length || 0} Students
                  </Text>
                </View>
              </View>
              <Divider style={styles.divider} />
            </Card.Content>
            <Card.Actions style={styles.actionsContainer}>
              <Button
                mode="contained-tonal"
                onPress={() => router.push(`/classes/${item.id}/attendance`)}
                style={styles.attendanceButton}
              >
                Attendance
              </Button>
              <IconButton
                icon="pencil"
                onPress={() =>
                  router.push(`/classes/manageClass?id=${item.id}`)
                }
                style={styles.editButton}
              />
              <IconButton
                icon="delete"
                iconColor="#d32f2f"
                onPress={() => confirmDelete(item.id)}
                style={styles.deleteButton}
              />
            </Card.Actions>
          </Card>
        )}
      />

      <Button mode="elevated" onPress={syncData} style={styles.syncButton}>
        Sync Data
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
    padding: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  // card: {
  //   marginBottom: 12,
  //   borderRadius: 8,
  //   backgroundColor: "#fff",
  // },
  button: {
    marginRight: 8,
  },
  // fab: {
  //   position: "absolute",
  //   right: 16,
  //   bottom: 60,
  //   backgroundColor: "#6200ee",
  //   color: "#ffffff",
  // },
  syncButton: {
    marginTop: 12,
  },
  // divider: {
  //   marginVertical: 8,
  // },
  studentCountContainer: {
    marginTop: 8,
    padding: 4,
    backgroundColor: "#f0f4ff",
    borderRadius: 4,
    alignItems: "center",
  },

  card: {
    margin: 8,
    padding: 10,
    borderRadius: 12,
    elevation: 3,
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  className: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e88e5",
  },
  studentCountBadge: {
    backgroundColor: "#e3f2fd",
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  studentCountText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1e88e5",
  },
  divider: {
    marginVertical: 8,
    backgroundColor: "#e0e0e0",
    height: 1,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  attendanceButton: {
    flex: 1,
    marginRight: 8,
    borderRadius: 8,
  },
  editButton: {
    borderRadius: 8,
  },
  deleteButton: {
    borderRadius: 8,
  },
});
