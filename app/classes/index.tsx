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
    await removeData("classes");
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
      <Text style={styles.title}>Class List</Text>
      <FlatList
        data={classes}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <Divider style={styles.divider} />}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium">{item.name}</Text>
            </Card.Content>
            <Card.Actions>
              <Button
                mode="contained-tonal"
                onPress={() => router.push(`/classes/${item.id}/calendar`)}
                style={styles.button}
              >
                Attendance
              </Button>

              <Button
                mode="contained-tonal"
                onPress={() => router.push(`/classes/${item.id}/attendance`)}
                style={styles.button}
              >
                Attendance
              </Button>
              {/* <Button
                mode="contained-tonal"
                onPress={() =>
                  router.push(`/classes/${item.id}/upload-students`)
                }
                style={styles.button}
              >
                Enroll Students
              </Button> */}
              <IconButton
                icon="pencil"
                mode="contained"
                onPress={() => router.push(`/classes/edit?id=${item.id}`)}
              />
              <IconButton
                icon="delete"
                iconColor="#d32f2f"
                onPress={() => confirmDelete(item.id)}
              />
            </Card.Actions>
          </Card>
        )}
      />
      <FAB
        icon="plus"
        label="Add Class"
        onPress={() => router.push("/classes/add")}
        style={styles.fab}
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  card: {
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  button: {
    marginRight: 8,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 60,
    backgroundColor: "#6200ee",
    color: "#ffffff",
  },
  syncButton: {
    marginTop: 12,
  },
  divider: {
    marginVertical: 8,
  },
});
