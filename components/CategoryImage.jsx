import React from "react";
import { View, StyleSheet, Image } from "react-native";

const CategoryImage = ({ uri, size }) => {
  return (
    <View
      style={{
        height: size,
        width: size,
        overflow: "hidden",
      }}
    >
      <Image
        source={{ uri: uri }}
        style={{ height: size, width: size, resizeMode: "contain" }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
});

export default CategoryImage;
