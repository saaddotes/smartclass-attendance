import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  FlatList,
} from "react-native";
import moment from "moment";

const WeekCalendar = ({ selectedDate, onDateChange, markedDates }: any) => {
  const [currentWeek, setCurrentWeek] = useState(
    moment(selectedDate).startOf("isoWeek") // Start week on Monday
  );

  const handleWeekChange = (direction: "prev" | "next") => {
    const newWeek =
      direction === "prev"
        ? moment(currentWeek).subtract(1, "week").startOf("isoWeek")
        : moment(currentWeek).add(1, "week").startOf("isoWeek");
    setCurrentWeek(newWeek);
  };

  const renderWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = moment(currentWeek).add(i, "days");
      days.push(day);
    }
    return days;
  };

  const isWeekend = (day: moment.Moment) => {
    const dayOfWeek = day.isoWeekday(); // Monday = 1, Sunday = 7
    return dayOfWeek === 6 || dayOfWeek === 7; // Disable Saturday (6) and Sunday (7)
  };

  const isMarkedDate = (day: moment.Moment) => {
    return markedDates.some((markedDate: string) =>
      moment(markedDate).isSame(day, "day")
    );
  };

  return (
    <View style={styles.calendarContainer}>
      <View style={styles.weekHeader}>
        <TouchableOpacity onPress={() => handleWeekChange("prev")}>
          <Text style={styles.arrow}>⬅️</Text>
        </TouchableOpacity>
        <Text style={styles.weekText}>
          {moment(currentWeek).format("MMM DD")} -{" "}
          {moment(currentWeek).endOf("isoWeek").format("MMM DD")}
        </Text>
        <TouchableOpacity onPress={() => handleWeekChange("next")}>
          <Text style={styles.arrow}>➡️</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={renderWeekDays()}
        horizontal
        keyExtractor={(item) => item.format("YYYY-MM-DD")}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.dateContainer,
              item.isSame(selectedDate, "day") && styles.selectedDate,
              isWeekend(item) && styles.disabledDate, // Apply disabled styling
            ]}
            disabled={isWeekend(item)} // Disable weekends
            onPress={() => onDateChange(item)}
          >
            <Text
              style={[
                styles.dayText,
                isWeekend(item) && styles.disabledText, // Apply disabled text styling
              ]}
            >
              {item.format("ddd")}
            </Text>
            <Text
              style={[
                styles.dateText,
                isWeekend(item) && styles.disabledText, // Apply disabled text styling
              ]}
            >
              {item.format("DD")}
            </Text>
            {isMarkedDate(item) && <View style={styles.dot} />}
          </TouchableOpacity>
        )}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  calendarContainer: { padding: 10, backgroundColor: "#f9f9f9" },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  weekText: { fontSize: 16, fontWeight: "600" },
  arrow: { fontSize: 18, fontWeight: "bold" },
  dateContainer: {
    alignItems: "center",
    marginHorizontal: 10,
    padding: 10,
    borderRadius: 6,
  },
  selectedDate: { borderWidth: 2, borderColor: "#ffa500" },
  disabledDate: { backgroundColor: "#e0e0e0", borderRadius: 6 },
  dayText: { fontSize: 14, color: "#444" },
  dateText: { fontSize: 16, fontWeight: "bold" },
  disabledText: { color: "#aaa" },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#6200ee",
    marginTop: 4,
  },
});

export default WeekCalendar;
