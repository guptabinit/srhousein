import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
//  External Libraries
import moment from "moment";
import "moment/locale/en-gb";
// Vector Icons
import { FontAwesome5 } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Entypo } from "@expo/vector-icons";
// Custom Components & Constants
import { COLORS } from "../variables/color";
import { getPrice, decodeString } from "../helper/helper";
import { useStateValue } from "../StateProvider";
import { getRelativeTimeConfig, __ } from "../language/stringPicker";
const myAdsListItemFallbackImageUrl = require("../assets/200X150.png");

const MyAdsFlatList = ({ onClick, item, onAction, onActionTouch }) => {
  const [{ config, ios, appSettings, rtl_support }] = useStateValue();
  useEffect(() => {
    const relativeTime = getRelativeTimeConfig(appSettings.lng);
    moment.updateLocale("en-gb", {
      relativeTime: relativeTime,
    });
  }, []);

  const rtlText = rtl_support && {
    writingDirection: "rtl",
  };
  const rtlView = rtl_support && {
    flexDirection: "row-reverse",
  };

  const getImageURL = () => {
    if (item.images && !!item.images.length) {
      return item.images[0].sizes.thumbnail.src;
    }
  };
  const getTaxonomy = (data) => {
    if (data) {
      return decodeString(data);
    } else {
      return "";
    }
  };

  const getStatus = () => {
    if ("pending" === item?.status) {
      return __("listingStatus.pending", appSettings.lng);
    }
    if ("rtcl-expired" === item?.status) {
      return __("listingStatus.expired", appSettings.lng);
    }
    if ("publish" === item?.status) {
      return __("listingStatus.publish", appSettings.lng);
    }
    if ("draft" === item?.status) {
      return __("listingStatus.draft", appSettings.lng);
    }
    if ("rtcl-reviewed" === item?.status) {
      return __("listingStatus.reviewed", appSettings.lng);
    }
  };

  return (
    <View style={[styles.listAd, rtlView]}>
      <TouchableWithoutFeedback onPress={onClick}>
        <View style={styles.imageWrap}>
          <Image
            style={styles.image}
            source={
              item.images && !!item.images.length
                ? {
                    uri: getImageURL(),
                  }
                : myAdsListItemFallbackImageUrl
            }
          />
        </View>
      </TouchableWithoutFeedback>
      <View style={[styles.details, rtlView]}>
        <View
          style={[
            styles.detailsLeft,
            {
              alignItems: rtl_support ? "flex-end" : "flex-start",
              paddingLeft: rtl_support ? 0 : "4%",
              paddingRight: rtl_support ? "4%" : 0,
            },
          ]}
        >
          <TouchableWithoutFeedback onPress={onClick}>
            <View
              style={{
                flex: 1,
                justifyContent: "flex-start",
                alignItems: rtl_support ? "flex-end" : "flex-start",
              }}
            >
              <Text
                style={[styles.title, { marginBottom: ios ? 3 : 2 }, rtlText]}
                numberOfLines={1}
              >
                {getTaxonomy(item.title)}
              </Text>

              <View style={[styles.detailsLeftRow, rtlView]}>
                <View
                  style={[
                    styles.iconWrap,
                    {
                      paddingRight: rtl_support ? 0 : 5,
                      paddingLeft: rtl_support ? 0 : 5,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="clock"
                    size={12}
                    color={COLORS.text_gray}
                  />
                </View>
                <Text style={[styles.detailsLeftRowText, rtlText]}>
                  {moment(item.created_at).fromNow()}
                </Text>
              </View>
              <View style={[styles.detailsLeftRow, rtlView]}>
                <View style={styles.iconWrap}>
                  <FontAwesome5 name="eye" size={12} color={COLORS.text_gray} />
                </View>
                <Text style={[styles.detailsLeftRowText, rtlText]}>
                  {__("myAdsListItemTexts.viewsText", appSettings.lng)}{" "}
                  {item.view_count}
                </Text>
                {!!item?.status && (
                  <View
                    style={[
                      styles.statusWrap,
                      {
                        marginLeft: rtl_support ? 0 : 15,
                        marginRight: rtl_support ? 15 : 0,
                      },
                    ]}
                  >
                    <Text style={styles.status}>{getStatus()}</Text>
                  </View>
                )}
              </View>

              <View style={styles.detailsLeftRow}>
                {config?.available_fields?.listing.includes("price") && (
                  <Text style={[styles.price, rtlText]} numberOfLines={1}>
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
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
        <View style={styles.detailsRight}>
          <View
            style={{
              flex: 1,
              alignItems: "flex-end",
            }}
          >
            <View style={styles.buttonWrap}>
              <TouchableOpacity
                onPress={(e) => {
                  onActionTouch(e);
                  onAction();
                }}
              >
                <Entypo name="dots-three-horizontal" size={20} color="black" />
              </TouchableOpacity>
            </View>
            {item.badges.includes("is-sold") && (
              <View
                style={{
                  backgroundColor: COLORS.primary,
                  paddingVertical: 3,
                  paddingHorizontal: 6,
                  borderRadius: 3,
                }}
              >
                <Text
                  style={{
                    textTransform: "uppercase",
                    fontSize: 10,
                    color: COLORS.white,
                  }}
                >
                  {__("myAdsListItemTexts.soldOut", appSettings.lng)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  status: {
    fontSize: 11,
    lineHeight: 12,
    color: COLORS.text_light,
  },
  statusWrap: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border_light,
  },
  buttonText: {},
  buttonWrap: {},
  details: {
    flexDirection: "row",
    justifyContent: "space-between",
    flex: 3,
    alignItems: "center",
  },
  detailsLeft: {
    flex: 1,
    width: "100%",
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
  detailsRight: {},
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
    padding: 10,
    alignItems: "center",
    borderColor: COLORS.bg_dark,
    borderWidth: 1,
    borderRadius: 5,
    marginVertical: 5,
  },
  title: {
    fontWeight: "bold",
    fontSize: 13,
  },
});

export default MyAdsFlatList;
