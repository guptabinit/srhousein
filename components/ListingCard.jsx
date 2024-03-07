import React from "react";
import {
  Dimensions,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

// Vector Fonts
import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";

// Custom Components & Constants
import { decodeString, getPrice } from "../helper/helper";
import { COLORS } from "../variables/color";
import { useStateValue } from "../StateProvider";
import Badge from "./Badge";
import { __ } from "../language/stringPicker";
import ListAdComponent from "./ListAdComponent";
import { admobConfig } from "../app/services/adMobConfig";
import CategoryIcon from "./CategoryIcon";
import { miscConfig } from "../app/services/miscConfig";

const { width: screenWidth } = Dimensions.get("screen");

const listingCardFallbackImageUrl = require("../assets/100x100.png");

const ListingCard = ({ onPress, item }) => {
  const [{ config, ios, appSettings, rtl_support }] = useStateValue();

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
  const getCategory = (items) => {
    if (!items?.length) return false;
    return decodeString(items[items.length - 1].name);
  };
  const getLocation = (items) => {
    if (!items?.length) return false;
    // return decodeString(items[items.length - 1].name);
    return decodeString(items.map((_loc) => _loc.name).join(", "));
  };
  const getCustomFielValue = (field) => {
    if (field.type === "text" && field?.value !== "null") {
      return (
        decodeString(field.label) + " : " + decodeString(field?.value) ||
        __("listingDetailScreenTexts.deletedValue", appSettings.lng)
      );
    } else if (field.type === "number") {
      return (
        decodeString(field.label) + " : " + field?.value ||
        __("listingDetailScreenTexts.deletedValue", appSettings.lng)
      );
    } else if (["radio", "select"].includes(field.type)) {
      if (
        !!field.value &&
        !!field.options.choices.filter((choice) => choice.id == field.value)
          .length
      ) {
        return (
          decodeString(field.label) +
            " : " +
            decodeString(
              field.options.choices.filter(
                (choice) => choice.id == field.value
              )[0].name
            ) || __("listingDetailScreenTexts.deletedValue", appSettings.lng)
        );
      } else {
        return __("listingDetailScreenTexts.deletedValue", appSettings.lng);
      }
    } else if (field.type === "checkbox") {
      if (
        !!field.value.length &&
        !!field.options.choices.filter((choice) =>
          field.value.includes(choice.id)
        ).length
      ) {
        return (
          decodeString(field.label) +
            " : " +
            decodeString(
              field.options.choices
                .filter((choice) => field.value.includes(choice.id))
                .map((_ch) => _ch.name)
                .join(", ")
            ) || __("listingDetailScreenTexts.deletedValue", appSettings.lng)
        );
      } else {
        return __("listingDetailScreenTexts.deletedValue", appSettings.lng);
      }
    }
  };

  return item.listAd && admobConfig?.admobEnabled ? (
    <ListAdComponent dummy={item.dummy} />
  ) : (
    <View>
      <TouchableWithoutFeedback onPress={onPress}>
        <View
          style={[
            styles.itemWrap,
            {
              // backgroundColor: getBackgroundColor()
              //   ? getBackgroundColor()
              //   : COLORS.white,
              backgroundColor: COLORS.white,
              flex: 1,
            },
          ]}
        >
          {item?.badges?.includes("is-bump-up") &&
            config?.badges?.bump_up?.listing && (
              <View
                style={{
                  position: "absolute",
                  zIndex: 5,
                  height: 20,
                  width: 20,
                  backgroundColor:
                    config?.badges?.bump_up?.color?.bg ||
                    COLORS.promotions.bg._bump_up,
                  alignItems: "center",
                  justifyContent: "center",
                  top: 0,
                  right: 0,
                  borderBottomLeftRadius: 3,
                }}
              >
                <FontAwesome
                  name="clock-o"
                  size={15}
                  color={
                    config?.badges?.bump_up?.color?.text ||
                    COLORS.promotions.text._bump_up
                  }
                />
              </View>
            )}
          {item?.badges?.includes("is-sold") && (
            <View
              style={[
                styles.soldOutBadge,
                {
                  top: "6%",
                  // left: ios ? "54%" : "56%",
                  right: "-18%",
                  width: "70%",
                },
              ]}
            >
              <Text style={styles.soldOutBadgeMessage}>
                {__("listingCardTexts.soldOutBadgeMessage", appSettings.lng)}
              </Text>
            </View>
          )}
          {item?.badges?.includes("is-featured") &&
            config?.badges?.featured?.listing && (
              <View
                style={{
                  position: "absolute",
                  zIndex: 5,
                  top: "5%",
                  left: 0,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    height: 24,
                    justifyContent: "center",
                    backgroundColor:
                      config?.badges?.featured?.color?.bg ||
                      COLORS.promotions.bg.featured,
                  }}
                >
                  <Text
                    style={{
                      paddingHorizontal: 5,
                      fontWeight: "bold",
                      color:
                        config?.badges?.featured?.color?.text ||
                        COLORS.promotions.text.featured,
                    }}
                  >
                    {config?.badges?.featured?.label ||
                      config?.promotions?.featured ||
                      "Featured"}
                  </Text>
                </View>
                <View
                  style={{
                    height: 0,
                    width: 0,
                    borderTopWidth: 12,
                    borderTopColor: "transparent",
                    borderBottomColor: "transparent",
                    borderBottomWidth: 12,
                    borderLeftWidth: 12,
                    borderColor:
                      config?.badges?.featured?.color?.bg ||
                      COLORS.promotions.bg.featured,
                  }}
                />
              </View>
            )}
          {item?.badges?.includes("is-top") && config?.badges?.top?.listing && (
            <View
              style={{
                position: "absolute",
                zIndex: 5,
                top: item?.badges?.includes("is-featured") ? "20%" : "5%",
                left: 0,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  height: 24,
                  justifyContent: "center",
                  backgroundColor:
                    config?.badges?.top?.color?.bg || COLORS.promotions.bg._top,
                }}
              >
                <Text
                  style={{
                    fontWeight: "bold",
                    color:
                      config?.badges?.top?.color?.text ||
                      COLORS.promotions.text._top,
                    paddingHorizontal: 5,
                  }}
                >
                  {config?.badges?.top?.label ||
                    config?.promotions?._top ||
                    "Top"}
                </Text>
              </View>
              <View
                style={{
                  height: 0,
                  width: 0,
                  borderTopWidth: 12,
                  borderTopColor: "transparent",
                  borderBottomColor: "transparent",
                  borderBottomWidth: 12,
                  borderLeftWidth: 12,
                  borderColor:
                    config?.badges?.top?.color?.bg || COLORS.promotions.bg._top,
                }}
              />
            </View>
          )}

          <View style={styles.itemImageWrap}>
            <LinearGradient
              // Background Linear Gradient
              colors={["transparent", "#000000"]}
              style={{
                zIndex: 1,
                height: "35%",
                width: "100%",
                position: "absolute",
                bottom: 0,
                left: 0,
              }}
            />
            <Image
              style={styles.itemImage}
              source={
                item?.images?.length
                  ? {
                      uri: item.images[0].sizes.full.src,
                    }
                  : listingCardFallbackImageUrl
              }
            />
          </View>
          {config?.available_fields?.listing.includes("price") && (
            <View
              style={{
                position: "absolute",
                top: screenWidth * 0.38,
                paddingHorizontal: 15,
              }}
            >
              <Text style={[styles.itemPrice, rtlText]} numberOfLines={1}>
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
          <View
            style={[
              styles.itemDetailWrap,
              { alignItems: rtl_support ? "flex-end" : "flex-start" },
            ]}
          >
            <View
              style={{
                paddingHorizontal: 10,
                alignItems: rtl_support ? "flex-end" : "flex-start",
              }}
            >
              {!!getCategory(item.categories) && (
                <View
                  style={{
                    paddingVertical: 5,
                    paddingHorizontal: 10,
                    borderRadius: 5,
                    backgroundColor: COLORS.bg_primary,
                    marginBottom: 5,
                    justifyContent: "center",
                    alignItems: rtl_support ? "flex-end" : "flex-start",
                  }}
                >
                  <Text
                    style={[
                      styles.itemCategory,
                      { paddingBottom: ios ? 3 : 1 },
                      rtlText,
                    ]}
                    numberOfLines={1}
                  >
                    {getCategory(item.categories)}
                  </Text>
                </View>
              )}
              <Text
                style={[
                  styles.itemTitle,
                  { paddingBottom: ios ? 3 : 1 },
                  rtlTextA,
                ]}
                numberOfLines={2}
              >
                {decodeString(item.title)}
              </Text>
              {(!!item?.contact?.locations?.length ||
                !!item?.contact?.geo_address) && (
                <>
                  {config.location_type === "local" ? (
                    <>
                      {!!item?.contact?.locations?.length && (
                        <View
                          style={[
                            styles.itemLocationWrap,
                            { paddingBottom: ios ? 5 : 3 },
                            rtlView,
                          ]}
                        >
                          <FontAwesome5
                            name="map-marker-alt"
                            size={10}
                            color={COLORS.text_gray}
                          />
                          <Text style={[styles.itemLocation, rtlTextA]}>
                            {getLocation(item.contact.locations)}
                          </Text>
                        </View>
                      )}
                    </>
                  ) : (
                    <>
                      {!!item?.contact?.geo_address && (
                        <View
                          style={[
                            styles.itemLocationWrap,
                            { paddingBottom: ios ? 5 : 3 },
                            rtlView,
                          ]}
                        >
                          <FontAwesome5
                            name="map-marker-alt"
                            size={10}
                            color={COLORS.text_gray}
                          />
                          <Text
                            style={[styles.itemLocation, rtlTextA]}
                            numberOfLines={1}
                          >
                            {decodeString(item.contact.geo_address)}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </>
              )}
            </View>
            {miscConfig?.showCustomFieldsInList &&
              item?.custom_fields?.length > 0 && (
                <View
                  style={[
                    {
                      borderTopWidth: 1,
                      borderColor: COLORS.border_light,
                      paddingHorizontal: 10,
                      paddingTop: 5,
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 3,
                      flexWrap: "wrap",
                      flex: 1,
                    },
                    rtlView,
                  ]}
                >
                  {item.custom_fields.map((_cf, index) => {
                    if (
                      [
                        "text",
                        "number",
                        "radio",
                        "select",
                        "checkbox",
                      ].includes(_cf.type) &&
                      _cf.value &&
                      _cf.valu !== "null"
                    )
                      return (
                        <View
                          key={`${index}`}
                          style={[
                            {
                              flexDirection: "row",
                              alignItems: "center",
                              flex: 1,
                            },
                            rtlView,
                          ]}
                        >
                          <CategoryIcon
                            iconName={
                              _cf.icon.trim().includes("flaticon-")
                                ? _cf.icon.trim().slice(9)
                                : _cf.icon
                            }
                            iconSize={12}
                            iconColor={COLORS.primary}
                          />
                          <View
                            style={{
                              paddingHorizontal: 5,
                              flex: 1,
                            }}
                          >
                            <Text
                              style={[
                                {
                                  fontSize: 11.5,
                                  color: COLORS.text_gray,
                                },
                                rtlText,
                              ]}
                            >
                              {getCustomFielValue(_cf)}
                            </Text>
                          </View>
                        </View>
                      );
                  })}
                </View>
              )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};
const styles = StyleSheet.create({
  badgeSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1,
    margin: 2,
  },
  badgeStyle: {
    padding: 3,
    elevation: 5,
  },
  badgeTextStyle: {
    color: COLORS.white,
    fontSize: 12,
  },
  bumpUpBadge: {
    height: 20,
    width: 20,
    backgroundColor: COLORS.badges["is-bump-up"],
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
  },
  container: {},
  listingTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: "3%",

    marginVertical: 10,
  },
  itemCategory: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  itemDetailWrap: {
    paddingVertical: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    borderColor: COLORS.border_light,
  },
  itemImage: {
    height: "100%",
    width: "100%",
    resizeMode: "cover",
  },
  itemImageWrap: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    width: "100%",
    height: screenWidth * 0.455,
  },
  itemLocation: {
    color: COLORS.text_gray,
    fontSize: 12,
    paddingHorizontal: 5,
  },
  itemLocationWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 2,
  },
  itemPrice: {
    color: COLORS.white,
    fontSize: 14.5,
    fontWeight: "bold",
  },
  itemTitle: {
    fontSize: 13.5,
    fontWeight: "bold",
    color: COLORS.text_dark,
  },
  itemWrap: {
    marginHorizontal: screenWidth * 0.015,
    overflow: "hidden",
    borderRadius: 3,
    marginBottom: screenWidth * 0.03,
    width: screenWidth * 0.455,
  },
  soldOutBadge: {
    position: "absolute",
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 3,
    transform: [{ rotate: "45deg" }],

    flex: 1,
    elevation: 7,
    zIndex: 20,
    shadowColor: "#000",
    shadowRadius: 4,
    shadowOpacity: 0.2,
    shadowOffset: {
      height: 2,
      width: 2,
    },
  },
  soldOutBadgeMessage: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
});

export default ListingCard;
