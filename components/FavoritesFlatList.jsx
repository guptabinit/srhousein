import React from "react";
import {
  View,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";

// External Libraries
import moment from "moment";

// Vector Icons
import { FontAwesome5 } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";

// Custom Components
import { COLORS } from "../variables/color";
import { getPrice, decodeString } from "../helper/helper";
import { useStateValue } from "../StateProvider";
import { __ } from "../language/stringPicker";

const favouritesItemfallbackImageUrl = "../assets/200X150.png";

const FavoritesFlatList = ({ onDelete, item, onClick }) => {
  const [{ config, ios, appSettings, rtl_support }] = useStateValue();
  const getTaxonomy = (data) => {
    if (data) {
      return decodeString(data);
    } else {
      return "";
    }
  };
  const getImageURL = () => {
    if (item.images.length) {
      return item.images[0].sizes.thumbnail.src;
    }
  };

  const rtlTextA = rtl_support && {
    writingDirection: "rtl",
    textAlign: "right",
  };
  const rtlView = rtl_support && {
    flexDirection: "row-reverse",
  };
  return (
    <View style={[styles.listAd, rtlView]}>
      <TouchableWithoutFeedback onPress={onClick}>
        <View style={styles.imageWrap}>
          <Image
            style={styles.image}
            source={
              item.images.length
                ? {
                    uri: getImageURL(),
                  }
                : require(favouritesItemfallbackImageUrl)
            }
          />
        </View>
      </TouchableWithoutFeedback>
      <View style={[styles.details, rtlView]}>
        <View
          style={[
            styles.detailsLeft,
            {
              paddingLeft: rtl_support ? 0 : 10,
              paddingRight: rtl_support ? 10 : 0,
            },
          ]}
        >
          <TouchableWithoutFeedback onPress={onClick}>
            <View style={{ flex: 1, justifyContent: "flex-start" }}>
              <View
                style={{ alignItems: rtl_support ? "flex-end" : "flex-start" }}
              >
                <Text
                  style={[styles.title, { marginBottom: ios ? 3 : 2 }]}
                  numberOfLines={1}
                >
                  {getTaxonomy(item.title)}
                </Text>
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
                  <MaterialCommunityIcons
                    name="clock"
                    size={12}
                    color={COLORS.text_gray}
                  />
                </View>
                <Text style={[styles.detailsLeftRowText, rtlTextA]}>
                  {moment(item.created_at).fromNow()}
                </Text>
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
                <Text style={[styles.detailsLeftRowText, rtlTextA]}>
                  {__("favouritesItemTexts.viewsText", appSettings.lng)}{" "}
                  {item.view_count}
                </Text>
              </View>
              {config?.available_fields?.listing.includes("price") && (
                <View style={[styles.detailsLeftRow, rtlView]}>
                  <Text style={styles.price} numberOfLines={1}>
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
                          config?.available_fields?.listing.includes(
                            "price_type"
                          ),
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
          </TouchableWithoutFeedback>
        </View>
        <View style={styles.detailsRight}>
          <View
            style={{
              flex: 1,
              alignItems: "flex-end",
              justifyContent: "space-between",
            }}
          >
            <TouchableOpacity style={styles.iconButton} onPress={onDelete}>
              <FontAwesome name="trash-o" size={20} color={COLORS.red} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.green,
    borderRadius: 0,
    paddingVertical: 5,
    paddingHorizontal: 20,
    width: "auto",
  },
  buttonText: {
    fontSize: 12,
  },
  buttonWrap: {
    alignItems: "center",
  },
  details: {
    flexDirection: "row",
    justifyContent: "space-between",
    flex: 3,
    alignItems: "center",
  },
  detailsLeft: {
    flex: 1,
  },
  detailsLeftRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },
  detailsLeftRowText: {
    fontSize: 12,
    color: COLORS.text_gray,
  },
  detailsRight: {
    justifyContent: "space-around",
    alignItems: "flex-end",
  },
  iconButton: {
    flex: 1,
    alignItems: "flex-end",
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
    // width: 70,
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
    padding: "3%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.bg_dark,
    borderRadius: 5,
    marginVertical: 5,
  },
  title: {
    fontWeight: "bold",
    fontSize: 13,
  },
});

export default FavoritesFlatList;
