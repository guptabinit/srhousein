import React from "react";
import { View, Text, StyleSheet, ScrollView, FlatList } from "react-native";

// Custom Components & Functions
import { COLORS } from "../variables/color";
import LisensesData from "../lisenseData.js";
import LisenseCard from "../components/LisenseCard";

const extractNameFromGithubUrl = (url) => {
  if (!url) {
    return null;
  }

  const reg = /((https?:\/\/)?(www\.)?github\.com\/)?(@|#!\/)?([A-Za-z0-9_]{1,15})(\/([-a-z]{1,20}))?/i;
  const components = reg.exec(url);

  if (components && components.length > 5) {
    return components[5];
  }
  return null;
};

const sortDataByKey = (data, key) => {
  data.sort((a, b) => (a[key] > b[key] ? 1 : b[key] > a[key] ? -1 : 0));
  return data;
};

const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

let licenses = Object.keys(LisensesData).map((key) => {
  let { licenses, ...license } = LisensesData[key];
  let [name, version] = key.split("@");

  const reg = /((https?:\/\/)?(www\.)?github\.com\/)?(@|#!\/)?([A-Za-z0-9_]{1,15})(\/([-a-z]{1,20}))?/i;
  let username =
    extractNameFromGithubUrl(license.repository) ||
    extractNameFromGithubUrl(license.licenseUrl);

  let userUrl;
  let image;
  if (username) {
    username = capitalizeFirstLetter(username);
    image = `http://github.com/${username}.png`;
    userUrl = `http://github.com/${username}`;
  }

  return {
    key,
    name,
    image,
    userUrl,
    username,
    licenses: licenses.slice(0, 405),
    version,
    ...license,
  };
});

sortDataByKey(licenses, "username");

const renderLisenseItem = ({ item }) => <LisenseCard item={item} />;

const ThirdPartyLicensesScreen = () => {
  return (
    <View style={styles.container}>
      <FlatList
        data={licenses}
        renderItem={renderLisenseItem}
        keyExtractor={(item) => item.key}
        contentContainerStyle={{ paddingVertical: 10 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bg_dark,
    flex: 1,
  },
});

export default ThirdPartyLicensesScreen;
