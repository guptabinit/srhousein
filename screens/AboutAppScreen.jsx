import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Linking } from "react-native";

// Vector Icons
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Custom Imports
import { getAppDescription } from "../language/stringPicker";
import { COLORS } from "../variables/color";
import { useStateValue } from "../StateProvider";

const AboutAppScreen = () => {
  const [{ appSettings, rtl_support, ios }] = useStateValue();
  const [appDescriptionData] = useState(getAppDescription(appSettings.lng));

  const rtlText = rtl_support && {
    writingDirection: "rtl",
    textAlign: ios ? "justify" : "right",
  };
  const rtlView = rtl_support && {
    flexDirection: "row-reverse",
  };
  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.mainWrap}>
          <View style={styles.detailWrap}>
            {appDescriptionData.paras.map((_para, index) => (
              <View key={index} style={styles.descriptionParaWrap}>
                {!!_para.paraTitle && (
                  <Text style={[styles.paraTitle, rtlText]}>
                    {_para.paraTitle}
                  </Text>
                )}
                {_para.paraType === "para" ? (
                  <Text style={[styles.paraDetail, rtlText]}>
                    {_para.paraDetail}
                  </Text>
                ) : (
                  <View style={styles.bulletParaWrap}>
                    {_para.paraDetail.map((_bullet, index) => (
                      <View key={index} style={[styles.bulletWrap, rtlView]}>
                        <View
                          style={{
                            alignItems: "center",
                            justifyContent: "center",
                            marginTop: 3,
                          }}
                        >
                          <MaterialCommunityIcons
                            name="circle-medium"
                            size={15}
                            color="black"
                          />
                        </View>
                        <Text style={[styles.bulletDetail, rtlText]}>
                          {_bullet}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
            {!!appDescriptionData.link &&
              !!appDescriptionData.linkedPara.length && (
                <View style={styles.linkedParaWrap}>
                  <Text
                    style={{
                      fontSize: 14,
                      lineHeight: 22,
                    }}
                  >
                    {appDescriptionData.linkedPara[0]}
                    <Text
                      style={styles.linkedText}
                      onPress={() => {
                        Linking.openURL(appDescriptionData.link);
                      }}
                    >
                      {appDescriptionData.linkedPara[1]}
                    </Text>
                    {appDescriptionData.linkedPara[2]}
                  </Text>
                </View>
              )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  bulletDetail: {
    paddingHorizontal: 5,
    textAlign: "justify",
    fontSize: 14,
    lineHeight: 22,
  },
  bulletParaWrap: {
    width: "100%",
  },
  bulletWrap: {
    flexDirection: "row",
    marginRight: 5,
    alignItems: "flex-start",
  },
  container: {
    backgroundColor: COLORS.white,
    flex: 1,
  },
  descriptionParaWrap: {
    marginBottom: 15,
    paddingRight: 5,
  },
  detailWrap: {
    width: "100%",
  },
  linkedParaWrap: {
    marginBottom: 10,
  },
  linkedText: {
    color: COLORS.blue,
    fontSize: 14,
    lineHeight: 22,
  },
  paraTitle: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 5,
  },
  paraDetail: {
    textAlign: "justify",
    fontSize: 14,
    lineHeight: 22,
  },
  mainWrap: {
    paddingHorizontal: "3%",
    paddingVertical: 15,
    width: "100%",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text_dark,
    marginBottom: 10,
  },
  titleWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default AboutAppScreen;
