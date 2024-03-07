import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";

import { admobConfig } from "../app/services/adMobConfig";
import AdmobBanner from "./AdmobBanner";

const { width: windowWidth } = Dimensions.get("window");

const ListAdComponent = ({ dummy }) => {
  return !dummy && admobConfig?.admobEnabled ? (
    <View style={styles.container}>
      <AdmobBanner />
    </View>
  ) : (
    <View style={styles.dummyAd} />
  );
};

const styles = StyleSheet.create({
  container: {
    width: windowWidth * 0.97,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: windowWidth * 0.03,
    minHeight: 100,
  },
  dummyAd: {
    minHeight: 50,
    minWidth: 1,
  },
});

export default ListAdComponent;
