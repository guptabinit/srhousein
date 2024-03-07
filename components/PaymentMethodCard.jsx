import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Image,
  Dimensions,
  Keyboard,
} from "react-native";
import { COLORS } from "../variables/color";
import { StripeProvider, CardField } from "@stripe/stripe-react-native";
import { decodeString } from "../helper/helper";
import { useStateValue } from "../StateProvider";

const { width: windowWidth } = Dimensions.get("window");
const PaymentMethodCard = ({
  method,
  isLast,
  onSelect,
  selected,
  onCardDataUpdate,
}) => {
  const [{ rtl_support, user }] = useStateValue();
  const [iconDim, setIconDim] = useState({ iconHeight: 0, iconWidth: 0 });
  const ref = useRef(null);
  const rtlTextA = rtl_support && {
    writingDirection: "rtl",
    textAlign: "right",
  };
  const rtlText = rtl_support && {
    writingDirection: "rtl",
  };
  const rtlView = rtl_support && {
    flexDirection: "row-reverse",
  };

  useEffect(() => {
    makeVisible();
    return () => {};
  }, [selected]);

  const areaHeight = new Animated.Value(0);
  const areaOpacity = new Animated.Value(0);

  const makeVisible = () => {
    Animated.timing(areaHeight, {
      toValue: 300,
      duration: 500,
      useNativeDriver: false,
    }).start();
    Animated.timing(areaOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    if (method?.icon) {
      Image.getSize(method?.icon, (width, height) => {
        const ratio = width / height;
        let tempDim = { iconHeight: 0, iconWidth: 0 };
        if (ratio * 20 < windowWidth * 0.25) {
          tempDim = { iconHeight: 20, iconWidth: ratio * 20 };
        } else {
          tempDim = { iconHeight: 20, iconWidth: windowWidth * 0.25 };
        }

        setIconDim(tempDim);
      });
    }
  }, []);

  return (
    <View style={[styles.container]}>
      <TouchableOpacity onPress={() => onSelect(method)}>
        <View style={[styles.titleRow, rtlView]}>
          <View style={styles.checkBox}>
            {selected?.id === method.id && <View style={styles.inner} />}
          </View>
          <View
            style={{
              flex: 1,
              alignItems: rtl_support ? "flex-end" : "flex-start",
            }}
          >
            <Text
              style={[
                styles.title,
                {
                  paddingLeft: rtl_support ? 0 : 5,
                  paddingRight: rtl_support ? 5 : 0,
                },
                rtlText,
              ]}
            >
              {method.title}
            </Text>
          </View>
          {!!method.icon && (
            <View style={styles.paymentMethodIconWrap}>
              <Image
                source={{ uri: method.icon }}
                style={{
                  height: iconDim.iconHeight,
                  width: iconDim.iconWidth,
                  resizeMode: "contain",
                }}
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
      {selected?.id === method?.id && (
        <>
          {selected?.id === "offline" && (
            <Animated.View
              style={[
                styles.cardContentWrap,
                { maxHeight: areaHeight, opacity: areaOpacity, marginTop: 10 },
              ]}
            >
              <View style={styles.cardContent}>
                {!!method.description && (
                  <Text style={[styles.cardDescription, rtlTextA]}>
                    {method.description}
                  </Text>
                )}
              </View>
            </Animated.View>
          )}
          {selected?.id === "paypal" && (
            <Animated.View
              style={[
                styles.cardContentWrap,
                {
                  maxHeight: areaHeight,
                  opacity: areaOpacity,
                  marginTop: 10,
                },
              ]}
            >
              <View style={[styles.cardContent, { padding: 10 }]}>
                {!!method.description && (
                  <Text style={[styles.cardDescription, rtlTextA]}>
                    {method.description}
                  </Text>
                )}
              </View>
            </Animated.View>
          )}
          {selected?.id === "iyzipay" && (
            <Animated.View
              style={[
                styles.cardContentWrap,
                {
                  maxHeight: areaHeight,
                  opacity: areaOpacity,
                  marginTop: 10,
                },
              ]}
            >
              <View style={[styles.cardContent, { padding: 10 }]}>
                {!!method.description && (
                  <Text style={[styles.cardDescription, rtlTextA]}>
                    {method.description}
                  </Text>
                )}
              </View>
            </Animated.View>
          )}
          {selected?.id === "authorizenet" && (
            <>
              {!!method.description && (
                <Text style={[styles.cardDescription, rtlTextA]}>
                  {method.description}
                </Text>
              )}
              <Animated.View
                style={[
                  styles.cardContentWrap,
                  {
                    maxHeight: areaHeight,
                    opacity: areaOpacity,
                    marginTop: !!method.description ? 0 : 10,
                  },
                ]}
              >
                <View style={styles.cardContent}>
                  <StripeProvider publishableKey="pk_test_51J2sdOGisFrTT10P188P3x8J5YiFn4eOEvMvo6SbVEgBDqZA9RYFUP5fNCQ0x9fjjoUt5KAhlQzvG7jYuN9mVeHO00SfVsayzv">
                    <CardField
                      ref={ref}
                      postalCodeEnabled={false}
                      placeholder={{
                        number: "4242 4242 4242 4242",
                      }}
                      dangerouslyGetFullCardDetails={true}
                      cardStyle={{
                        backgroundColor: "#FFFFFF",
                        textColor: "#000000",
                        fontSize: 15,
                      }}
                      style={{
                        // width: "100%",
                        height: 35,
                        marginVertical: 1,
                        marginHorizontal: 1,
                        borderWidth: 1,
                        borderColor: COLORS.border_light,
                        borderRadius: 3,
                      }}
                      onCardChange={(cardDetails) => {
                        onCardDataUpdate(cardDetails);
                      }}
                    />
                  </StripeProvider>
                </View>
              </Animated.View>
            </>
          )}
          {selected?.id === "stripe" && (
            <>
              {!!method.description && (
                <Text style={[styles.cardDescription, rtlTextA]}>
                  {decodeString(method.description)}
                </Text>
              )}
              <Animated.View
                style={[
                  styles.cardContentWrap,
                  {
                    maxHeight: areaHeight,
                    opacity: areaOpacity,
                    marginTop: !!method.description ? 0 : 10,
                  },
                ]}
              >
                <View
                  style={{
                    // paddingHorizontal: 10,
                    // margin: 10,
                    backgroundColor: COLORS.bg_dark,
                  }}
                >
                  <StripeProvider publishableKey={method.key}>
                    <CardField
                      ref={ref}
                      postalCodeEnabled={false}
                      placeholder={{
                        number: "4242 4242 4242 4242",
                      }}
                      cardStyle={{
                        backgroundColor: "#FFFFFF",
                        textColor: "#000000",
                        fontSize: 15,
                      }}
                      style={{
                        // width: "100%",
                        height: 35,
                        marginVertical: 1,
                        marginHorizontal: 1,
                        borderWidth: 1,
                        borderColor: COLORS.border_light,
                        borderRadius: 3,
                      }}
                      onCardChange={(cardDetails) => {
                        onCardDataUpdate(cardDetails);
                      }}
                    />
                  </StripeProvider>
                </View>
              </Animated.View>
            </>
          )}
        </>
      )}
      <View style={{ width: "100%", alignItems: "center" }}>
        <View
          style={{
            height: 0.5,
            width: "90%",
            backgroundColor: isLast ? COLORS.white : COLORS.border_light,
            marginTop: 12,
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContent: {
    paddingHorizontal: 10,
    margin: 10,
    backgroundColor: COLORS.bg_dark,
  },
  cardContentWrap: {
    backgroundColor: COLORS.bg_light,
  },
  cardDescription: {
    padding: 10,
  },
  checkBox: {
    height: 15,
    width: 15,
    borderRadius: 15 / 2,
    borderWidth: 2,
    borderColor: COLORS.border_light,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    paddingHorizontal: 10,
    paddingTop: 12,
  },
  inner: {
    height: 8,
    width: 8,
    borderRadius: 8 / 2,
    backgroundColor: COLORS.primary,
  },
  paymentMethodIconWrap: {
    height: 20,
  },
  title: {
    fontWeight: "bold",
    color: COLORS.text_gray,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default PaymentMethodCard;
