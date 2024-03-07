import React from "react";
import { View, StyleSheet, Text, Image, TouchableOpacity } from "react-native";

// Vector Icons
import { FontAwesome5 } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Custom Components & Constants
import { COLORS } from "../variables/color";
import { getPrice, decodeString } from "../helper/helper";
import { useStateValue } from "../StateProvider";
import { __ } from "../language/stringPicker";

const similarAdListItemFallbackImageUrl = require("../assets/200X150.png");

const SimilarAdFlatList = ({ time, title, url, views, onClick, item }) => {
  const [{ config, appSettings, rtl_support }] = useStateValue();
  const rtlText = rtl_support && {
    writingDirection: "rtl",
  };
  const rtlTextA = rtl_support && {
    writingDirection: "rtl",
    textAlign: "right",
  };
  const rtlView = rtl_support && {
    flexDirection: "row-reverse",
  };
  return (
    <TouchableOpacity style={[styles.listAd, rtlView]} onPress={onClick}>
      <View style={styles.imageWrap}>
        <Image
          style={styles.image}
          source={
            url !== null
              ? {
                  uri: url,
                }
              : similarAdListItemFallbackImageUrl
          }
        />
      </View>
      <View
        style={[
          styles.details,
          { alignItems: rtl_support ? "flex-end" : "flex-start" },
        ]}
      >
        <View
          style={[
            styles.detailsLeft,
            {
              paddingLeft: rtl_support ? 0 : "4%",
              paddingRight: rtl_support ? "4%" : 0,
              alignItems: rtl_support ? "flex-end" : "flex-start",
            },
          ]}
        >
          <Text style={[styles.title, rtlText]} numberOfLines={1}>
            {decodeString(title)}
          </Text>

          <View style={[styles.detailsLeftRow, rtlView]}>
            <View
              style={[
                styles.iconWrap,
                {
                  paddingRight: rtl_support ? 0 : 5,
                  paddingLeft: rtl_support ? 5 : 0,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="clock"
                size={12}
                color={COLORS.text_gray}
              />
            </View>
            <Text style={styles.detailsLeftRowText}>{time}</Text>
          </View>
          <View style={[styles.detailsLeftRow, rtlView]}>
            <View
              style={[
                styles.iconWrap,
                {
                  paddingRight: rtl_support ? 0 : 5,
                  paddingLeft: rtl_support ? 5 : 0,
                },
              ]}
            >
              <FontAwesome5 name="eye" size={12} color={COLORS.text_gray} />
            </View>
            <Text style={styles.detailsLeftRowText}>
              {__("similarAdListItemTexts.viewsText", appSettings.lng)} {views}
            </Text>
          </View>
        </View>
        {config?.available_fields?.listing.includes("price") && (
          <View
            style={{
              paddingLeft: rtl_support ? 0 : "3%",
              paddingRight: rtl_support ? "3%" : 0,
            }}
          >
            <Text style={[styles.price, rtlText]}>
              {getPrice(
                item?.currency
                  ? {
                      ...config.currency,
                      ...item.currency,
                    }
                  : config.currency,
                {
                  pricing_type: item.pricing_type,
                  showPriceType:
                    config?.available_fields?.listing.includes("price_type"),
                  price_type: config?.available_fields?.listing.includes(
                    "price_type"
                  )
                    ? item?.price_type
                    : undefined,
                  price: item.price,
                  max_price: item.max_price,
                  price_unit: item.price_unit,
                  price_units: item.price_units,
                },
                appSettings.lng
              )}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  details: {
    flex: 3,
    justifyContent: "space-between",
  },
  detailsLeft: {
    flex: 1,
  },
  detailsLeftRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  detailsLeftRowText: {
    fontSize: 12,
    color: COLORS.text_gray,
  },
  detailsRight: {
    justifyContent: "center",
    flex: 1,
    alignItems: "flex-end",
  },
  iconButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: COLORS.primary,
    marginHorizontal: 5,
    borderRadius: 3,
  },
  iconWrap: {
    width: 20,
    alignItems: "center",
  },
  image: {
    height: 80,
    width: "100%",
    resizeMode: "cover",
  },
  imageWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
    height: 80,
    width: 80,
    overflow: "hidden",
  },
  price: {
    fontWeight: "bold",
    color: COLORS.primary,
  },
  listAd: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: COLORS.bg_light,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.bg_dark,
    marginVertical: 5,

    padding: "3%",
    alignItems: "center",
  },
  title: {
    fontWeight: "bold",
    fontSize: 13,
    marginBottom: 3,
  },
});

export default SimilarAdFlatList;
