import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { getPrice } from "../helper/helper";
import { COLORS } from "../variables/color";
import { useStateValue } from "../StateProvider";
import { __ } from "../language/stringPicker";

const { width: windowWidth } = Dimensions.get("window");
const MembershipCard = ({ memPlan, onSelect, selected }) => {
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
    <TouchableWithoutFeedback style={styles.container} onPress={onSelect}>
      <View
        style={[
          styles.content,
          {
            borderColor:
              memPlan?.id === selected?.id ? COLORS.primary : COLORS.white,
          },
        ]}
      >
        <View style={[styles.titleWrap, rtlView]}>
          <View
            style={[{ flexDirection: "row", alignItems: "center" }, rtlView]}
          >
            <View style={styles.chkBoxWrap}>
              <View
                style={[
                  styles.chkBxOuter,
                  {
                    borderColor:
                      memPlan?.id === selected?.id
                        ? COLORS.primary
                        : COLORS.border_light,
                  },
                ]}
              >
                {memPlan?.id === selected?.id && (
                  <View style={styles.chkBxInner} />
                )}
              </View>
            </View>
            <View style={styles.priceWrapp}>
              <Text style={styles.price}>
                {getPrice(
                  config.payment_currency,
                  {
                    pricing_type: "price",
                    price_type: "",
                    price: memPlan.price,
                    max_price: 0,
                  },
                  appSettings.lng
                )}
              </Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <View
              style={{
                paddingVertical: 5,
                paddingHorizontal: 10,
                borderRadius: 3,
                backgroundColor: COLORS.bg_primary,
                alignSelf: rtl_support ? "flex-start" : "flex-end",
              }}
            >
              <Text style={[styles.title, rtlTextA]}>{memPlan.title}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.featuresWrap, rtlView]}>
          <View style={{ flex: 1, paddingLeft: 40, paddingRight: 10 }}>
            <View style={[styles.tableHeaderRowWrap, rtlView]}>
              <View style={{ flex: 1.5 }} />
              <View style={styles.headerContent}>
                <Text style={[styles.headerText, rtlText]}>
                  {__("membershipCardTexts.ads", appSettings.lng)}
                </Text>
              </View>
              <View style={styles.headerContent}>
                <Text style={[styles.headerText, rtlText]}>
                  {__("membershipCardTexts.validityUnit", appSettings.lng)}
                </Text>
              </View>
            </View>
            {!!memPlan?.regular_ads && (
              <View
                style={[
                  styles.tableRowWrap,
                  {
                    borderBottomColor: COLORS.border_light,
                    borderBottomWidth: !!memPlan?.promotion?.membership
                      ? 0
                      : 0.7,
                    paddingBottom: !!memPlan?.promotion?.membership ? 5 : 10,
                  },
                  rtlView,
                ]}
              >
                <View
                  style={[
                    styles.tableRowContent,
                    {
                      alignItems: rtl_support ? "flex-end" : "flex-start",
                      flex: 1.5,
                    },
                  ]}
                >
                  <Text style={[styles.contentText, rtlText]}>
                    {__("membershipCardTexts.regular", appSettings.lng)}
                  </Text>
                </View>
                <View style={styles.tableRowContent}>
                  <Text style={[styles.contentText, rtlText]}>
                    {memPlan.regular_ads}
                  </Text>
                </View>
                <View style={styles.tableRowContent}>
                  <Text style={[styles.contentText, rtlText]}>
                    {memPlan.visible}
                  </Text>
                </View>
              </View>
            )}

            {!!memPlan?.promotion?.membership &&
              Object.keys(memPlan.promotion.membership).map((memPkg, index) => (
                <View
                  style={[
                    styles.tableRowWrap,
                    {
                      backgroundColor:
                        !!memPlan?.regular_ads && index % 2 === 0
                          ? COLORS.bg_light
                          : COLORS.white,
                    },
                    rtlView,
                  ]}
                  key={index}
                >
                  <View
                    style={[
                      styles.tableRowContent,
                      {
                        alignItems: rtl_support ? "flex-end" : "flex-start",
                        flex: 1.5,
                      },
                    ]}
                  >
                    <Text style={[styles.contentText, rtlText]}>
                      {config?.promotions[memPkg] || memPkg}
                    </Text>
                  </View>
                  <View style={styles.tableRowContent}>
                    <Text style={[styles.contentText, rtlText]}>
                      {memPlan?.promotion?.membership[memPkg].ads}
                    </Text>
                  </View>
                  <View style={styles.tableRowContent}>
                    <Text style={[styles.contentText, rtlText]}>
                      {memPlan?.promotion?.membership[memPkg].validate}
                    </Text>
                  </View>
                </View>
              ))}
          </View>
        </View>
        <View style={styles.bottomContentWrap}></View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  bottomContentWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  chkBxInner: {
    height: 16,
    width: 16,
    borderRadius: 16 / 2,
    backgroundColor: COLORS.primary,
  },
  chkBxOuter: {
    height: 25,
    width: 25,
    borderRadius: 25 / 2,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  chkBoxWrap: {},
  container: {},
  content: {
    borderRadius: 10,
    backgroundColor: COLORS.white,
    elevation: 3,
    marginVertical: 10,
    shadowRadius: 5,
    shadowOffset: {
      height: 2,
      width: 0,
    },
    shadowOpacity: 0.9,
    shadowColor: COLORS.gray,
    marginHorizontal: windowWidth * 0.03,
    borderWidth: 1,
  },
  contentText: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.text_gray,
  },
  featuresWrap: {
    marginVertical: 10,
    paddingBottom: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  headerText: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.text_dark,
  },
  iconWrap: {
    width: 25,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  labelWrap: {
    alignItems: "center",
    paddingVertical: 15,
  },
  note: {
    color: COLORS.text_gray,
    textAlign: "justify",
  },
  noteWrap: {
    flex: 1,
  },
  price: {
    fontSize: 25,
    fontWeight: "bold",
    color: COLORS.text_dark,
  },
  priceWrapp: {
    marginHorizontal: 5,
    paddingHorizontal: 5,
  },
  tableHeaderRowWrap: {
    flexDirection: "row",
    borderBottomColor: COLORS.border_light,
    borderBottomWidth: 1,
    paddingBottom: 10,
    marginBottom: 5,
  },
  tableRowContent: {
    flex: 1,
    alignItems: "center",
  },
  tableRowWrap: {
    flexDirection: "row",
    paddingVertical: 5,
  },
  title: {
    fontWeight: "bold",
    fontSize: 16,
    color: COLORS.primary,
  },
  titleWrap: {
    backgroundColor: COLORS.white,
    paddingTop: 10,
    paddingHorizontal: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    flexDirection: "row",
  },
  priceTag: {
    backgroundColor: COLORS.primary,

    paddingVertical: 10,
    paddingLeft: 30,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 100,
    justifyContent: "center",
  },
  priceWrap: {},
});

export default MembershipCard;
