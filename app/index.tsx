import React, { useEffect, useState } from "react";
import { View, FlatList, StyleSheet, Alert, ToastAndroid } from "react-native";
import { useRouter } from "expo-router";
import { getData, storeData } from "@/utils/asyncStorage";
import { syncClassesToFirestore, Class } from "@/utils/firebase";
import { Button, Card, Text, IconButton, Divider } from "react-native-paper";

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
    Alert.alert(
      "Delete Class",
      "Are you sure you want to delete this class?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "OK", onPress: () => deleteClass(id) },
      ],
      { cancelable: false }
    );
  };

  const [syncing, setSyncing] = useState(false);

  const syncData = async () => {
    setSyncing(true);
    ToastAndroid.show("Syncing...", ToastAndroid.SHORT);
    try {
      await syncClassesToFirestore(classes);
      ToastAndroid.show("Synced successfully!", ToastAndroid.SHORT);
    } catch (error) {
      if (error instanceof Error) {
        ToastAndroid.show(`Sync failed: ${error.message}`, ToastAndroid.SHORT);
      } else {
        ToastAndroid.show("Sync failed: An error occurred", ToastAndroid.SHORT);
      }
    } finally {
      setSyncing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <Text style={styles.title}>Class List</Text>
        <Button
          mode="contained-tonal"
          icon={syncing ? "loading" : "sync"}
          onPress={syncData}
          disabled={syncing}
        >
          {syncing ? "Syncing..." : "Sync"}
        </Button>
      </View>
      <Button
        mode="elevated"
        icon="plus"
        onPress={() => router.push("/classes/manageClass")}
        style={styles.addButton}
      >
        New Class
      </Button>
      <Divider style={styles.divider} />
      {classes.length === 0 ? (
        <Text style={styles.noClassesText}>
          No classes available. Please add a new class.
        </Text>
      ) : (
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
                  icon={"account-check"}
                  onPress={() => router.push(`/classes/${item.id}/attendance`)}
                  style={styles.attendanceButton}
                >
                  Attendance List
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
    padding: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  addButton: {
    marginBottom: 10,
  },
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
  noClassesText: {
    flex: 1,
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#757575",
  },
});
