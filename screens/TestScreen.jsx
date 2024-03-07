import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import CategoryIcon from "../components/CategoryIcon";

const TestScreen = (props) => {
  const a = [
    "user",
    "add-friend",
    "speech-bubble",
    "next",
    "left-arrow",
    "share",
    "share-1",
    "exchange",
    "left-and-right-arrows",
    "heart",
    "camera",
    "video-camera",
    "check",
    "check-1",
    "clock",
    "bed",
    "shower",
    "comment",
    "home",
    "tag",
    "arrow-left",
    "maps-and-flags",
    "envelope",
    "phone-call",
    "call",
    "play-button",
    "loupe",
    "magnifying-glass",
    "user-1",
    "pencil-and-ruler",
    "two-overlapping-square",
    "printer",
    "garage",
    "garage-1",
    "maximize",
    "right-arrow",
    "next-1",
    "right-arrow-1",
    "left-arrow-1",
  ];
  return (
    <View style={styles.container}>
      <ScrollView>
        {a.map((_tt, ind) => (
          <View key={`${ind}`}>
            <Text style={styles.text}>{_tt}</Text>
            <CategoryIcon iconColor={"white"} iconName={_tt} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "red",
    paddingBottom: 100,
  },
});

export default TestScreen;
