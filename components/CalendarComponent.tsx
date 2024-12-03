import React from "react";
import { StyleSheet } from "react-native";
import { Calendar } from "react-native-calendars";

interface Props {
  markedDates: Record<string, any>;
  onDayPress: (date: string) => void;
}

const CalendarComponent: React.FC<Props> = ({ markedDates, onDayPress }) => {
  return (
    <Calendar
      markedDates={markedDates}
      onDayPress={(day) => onDayPress(day.dateString)}
      style={styles.calendar}
    />
  );
};

const styles = StyleSheet.create({
  calendar: { marginBottom: 20 },
});

export default CalendarComponent;
