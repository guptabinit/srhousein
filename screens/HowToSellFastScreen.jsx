import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, ActivityIndicator } from "react-native";

// Custom Components & Functions
import { useStateValue } from "../StateProvider";
import { getSellFastTips } from "../language/stringPicker";
import SellFaster from "../components/SellFaster";
import { COLORS } from "../variables/color";
import { admobConfig } from "../app/services/adMobConfig";
import AdmobBanner from "../components/AdmobBanner";

const HowToSellFastScreen = () => {
  const [{ appSettings }] = useStateValue();
  const [sellFastTipsData, setSellFastTipsData] = useState(
    getSellFastTips(appSettings.lng)
  );
  const [loading, setLoading] = useState(true);
  const [admobError, setAdmobError] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 2500);
  });
  const onAdmobError = (error) => {
    setAdmobError(true);
  };
  return (
    <View style={styles.container}>
      {loading ? (
        <View
          style={{
            flex: 1,
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator color={COLORS.primary} size={"large"} />
        </View>
      ) : (
        <ScrollView style={styles.scrollContainer}>
          {admobConfig?.admobEnabled &&
            admobConfig?.sellFasterScreen &&
            !admobError && (
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  height: 100,
                  marginTop: 20,
                  width: "100%",
                }}
              >
                <AdmobBanner onError={onAdmobError} />
              </View>
            )}
          <View style={styles.mainWrap}>
            {sellFastTipsData.map((item, index) => (
              <SellFaster
                key={`${index}`}
                title={item.title}
                detail={item.detail}
                uri={item.uri}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    flex: 1,
  },
  mainWrap: {
    backgroundColor: COLORS.white,
    paddingHorizontal: "3%",
    alignItems: "center",
    marginTop: 15,
  },
  scrollContainer: {
    backgroundColor: COLORS.white,
  },
  title: {
    fontSize: 19,
    fontWeight: "bold",
    color: COLORS.text_dark,
  },
});

export default HowToSellFastScreen;
