import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
  Linking,
  Alert,
} from "react-native";

// External Libraries
import moment from "moment";
import "moment/locale/en-gb";

// Vector Icons
import {
  Feather,
  MaterialIcons,
  FontAwesome,
  Fontisto,
  FontAwesome5,
  Ionicons,
  Zocial,
  AntDesign,
  EvilIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

// Custom Components & Functions
import api from "../api/client";
import { COLORS } from "../variables/color";
import { decodeString, getPrice } from "../helper/helper";
import { useStateValue } from "../StateProvider";
import AppButton from "../components/AppButton";
import AppTextButton from "../components/AppTextButton";
import { paginationData } from "../app/pagination/paginationData";
import { getRelativeTimeConfig, __ } from "../language/stringPicker";
import { routes } from "../navigation/routes";
import AdmobBanner from "../components/AdmobBanner";
import { admobConfig } from "../app/services/adMobConfig";

const storeDetailsTexts = {
  membershipMomentFormate: "MMM Do YYYY",
};

const { width: windowWidth, height: windowHeight } = Dimensions.get("window");

const storeDetailfallbackImage = {
  listingCardImage: require("../assets/100x100.png"),
  logo: require("../assets/100x100.png"),
  banner: require("../assets/200X150.png"),
};

const week = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

const StoreDetailsScreen = ({ route, navigation }) => {
  const [{ config, user, ios, appSettings, rtl_support }] = useStateValue();
  const [loading, setLoading] = useState(true);
  const [storeData, setStoreData] = useState();
  const [storeExpired, setStoreExpired] = useState(false);
  const [storeId, setStoreId] = useState(route.params.storeId);
  const [listHeaderHeight, setListHeaderHeight] = useState(
    windowWidth * 0.06 + 70 + 21 + 78 + 16 + 42 + 25 + 40 + 5
  );
  const [listHeaderHeightChanged, setListHeaderHeightChanged] = useState(false);
  const [initial, setInitial] = useState(true);
  const [storeListingSData, setStoreListingsData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [moreLoading, setMoreLoading] = useState(false);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(
    pagination.page || paginationData.storeDetails.page
  );
  const [admobError, setAdmobError] = useState(false);
  // {* Get Store Detail Call *}
  useEffect(() => {
    const relativeTime = getRelativeTimeConfig(appSettings.lng);
    moment.updateLocale("en-gb", {
      relativeTime: relativeTime,
    });
    if (storeData) return;
    getStoreDetail(route.params.storeId);
  }, []);

  // {* Get Store Listings Call *}
  useEffect(() => {
    if (!initial && loading) return;
    getStoreListings(storeId, paginationData.storeDetails);
  }, [loading]);

  // {* Refreshing get listing call *}
  useEffect(() => {
    if (!refreshing) return;
    setCurrentPage(1);
    setPagination({});
    getStoreListings(storeId, paginationData.storeDetails);
  }, [refreshing]);

  // {* Next page get listing call *}
  useEffect(() => {
    if (!moreLoading) return;
    const tempPaginationData = {
      per_page: paginationData.storeDetails.per_page,
      page: currentPage,
    };
    getStoreListings(storeId, tempPaginationData);
  }, [moreLoading]);

  const getStoreDetail = (storeId) => {
    api.get(`stores/${storeId}`).then((res) => {
      if (res.ok) {
        if (res.data) {
          setStoreData(res.data);
          setLoading(false);
        } else {
          setStoreExpired(true);
          setLoading(false);
        }
      } else {
        // print error
        // TODO handle error
        setLoading(false);
      }
    });
  };

  const getStoreListings = (storeId, paginationData) => {
    const args = { ...paginationData, store_id: storeId };
    api.get("store/listings", { ...args }).then((res) => {
      if (res.ok) {
        if (refreshing) {
          setRefreshing(false);
        }
        if (moreLoading) {
          setStoreListingsData((prevStoreListingsData) => [
            ...prevStoreListingsData,
            ...res.data.data,
          ]);
          setCurrentPage(res.data.pagination.page);
          setMoreLoading(false);
        } else {
          setStoreListingsData(res.data.data);
        }
        setPagination(res.data.pagination ? res.data.pagination : {});

        if (initial) {
          setInitial(false);
        }
        if (loading) {
          setLoading(false);
        }
      } else {
        // print error
        // TODO handle error
        // if error give retry button and set initial to true only for initial call
        if (refreshing) {
          setRefreshing(false);
        }
        if (moreLoading) {
          setMoreLoading(false);
        }
        if (loading) {
          setLoading(false);
        }
        if (initial) {
          setInitial(false);
        }
      }
    });
  };

  const handleEmail = () => {
    if (user === null && config?.registered_only?.store_contact) {
      handleEmailLoginAlert();
    } else {
      const data = {
        id: storeData.id,
        title: storeData.title,
      };
      navigation.navigate(routes.sendEmailScreen, {
        store: data,
        source: "store",
      });
    }
  };

  const handleEmailLoginAlert = () => {
    Alert.alert(
      "",
      __("storeDetailsTexts.loginAlert", appSettings.lng),
      [
        {
          text: __("storeDetailsTexts.cancelButtonTitle", appSettings.lng),
        },
        {
          text: __("storeDetailsTexts.loginButtonTitle", appSettings.lng),
          onPress: () => navigation.navigate(routes.loginScreen),
        },
      ],
      { cancelable: false }
    );
  };

  const renderListItem = useCallback(
    ({ item }) => <StoreListingCard item={item} />,
    []
  );
  const StoreListingCard = ({ item }) => (
    <View style={styles.storeListingCardWrap}>
      <TouchableOpacity
        style={[styles.storeListingCardContent, rtlView]}
        onPress={() => handleViewListing(item)}
      >
        <View style={styles.listingCardImageWrap}>
          <Image
            source={
              !!item.images.length
                ? { uri: item.images[0].sizes.thumbnail.src }
                : storeDetailfallbackImage.listingCardImage
            }
            style={styles.listingCardImage}
          />
        </View>
        <View
          style={[
            styles.listingCardDetailWrap,
            {
              paddingLeft: rtl_support ? 0 : 10,
              paddingRight: rtl_support ? 10 : 0,
            },
          ]}
        >
          <View style={styles.listingCardDetailContent}>
            <View
              style={[
                styles.listingCardDetailLeft,
                { alignItems: rtl_support ? "flex-end" : "flex-start" },
              ]}
            >
              <View
                style={{ alignItems: rtl_support ? "flex-end" : "flex-start" }}
              >
                <Text
                  style={[styles.listingCardTitle, rtlText]}
                  numberOfLines={1}
                >
                  {decodeString(item.title)}
                </Text>
                <View
                  style={[
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      marginVertical: ios ? 3 : 2,
                    },
                    rtlView,
                  ]}
                >
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
                  <Text style={[styles.listingCardText, rtlText]}>
                    {moment(item.created_at).fromNow()}
                  </Text>
                </View>
                <View
                  style={[
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      marginVertical: ios ? 3 : 2,
                    },
                    rtlView,
                  ]}
                >
                  <View
                    style={[
                      styles.iconWrap,
                      {
                        paddingRight: rtl_support ? 0 : 5,
                        paddingLeft: rtl_support ? 5 : 0,
                      },
                    ]}
                  >
                    <FontAwesome5
                      name="eye"
                      size={12}
                      color={COLORS.text_gray}
                    />
                  </View>
                  <Text style={[styles.listingCardText, rtlText]}>
                    {__("storeDetailsTexts.viewsCount", appSettings.lng)}{" "}
                    {item?.view_count}
                  </Text>
                </View>
              </View>
              {config?.available_fields?.listing.includes("price") && (
                <Text
                  style={[styles.listingCardPrice, rtlText]}
                  numberOfLines={1}
                >
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
        </View>
      </TouchableOpacity>
    </View>
  );

  const handleViewListing = (listing) => {
    navigation.push(routes.listingDetailScreen, {
      listingId: listing.listing_id,
    });
  };

  const ListSeparator = () => (
    <View
      style={{
        height: 1,
        width: "94%",
        backgroundColor: COLORS.bg_dark,
        marginVertical: 15,
        marginHorizontal: "3%",
      }}
    ></View>
  );

  const getOpenHours = () => {
    if (storeData?.opening_hours?.type === "always") {
      return __("storeDetailsTexts.alwaysOpen", appSettings.lng);
    }
    if (storeData?.opening_hours?.type === "selected") {
      const today = week[new Date().getDay()];

      if (storeData?.opening_hours?.hours[today]?.active) {
        if (
          storeData?.opening_hours?.hours[today]?.open ||
          storeData?.opening_hours?.hours[today]?.close
        ) {
          return (
            __("storeDetailsTexts.openDayStarting", appSettings.lng) +
            storeData.opening_hours.hours[today].open +
            __("storeDetailsTexts.openDayClosing", appSettings.lng) +
            storeData.opening_hours.hours[today].close
          );
        } else {
          return __("storeDetailsTexts.fullDayOpen", appSettings.lng);
        }
      } else {
        return __("storeDetailsTexts.closed", appSettings.lng);
      }
    }
    return __("storeDetailsTexts.noData", appSettings.lng);
  };

  const keyExtractor = useCallback((item, index) => `${index}`, []);

  const handleMoreDetailPress = () => {
    navigation.navigate(routes.storeMoreDetailsScreen, { data: storeData });
  };

  const handleHeaderLayout = (e) => {
    if (e.nativeEvent.layout.height > 1 && !listHeaderHeightChanged) {
      setListHeaderHeight(e.nativeEvent.layout.height);
      setListHeaderHeightChanged(true);
    }
    return;
  };

  const handleLoginAlert = () => {
    Alert.alert(
      "",
      __("listingDetailScreenTexts.loginAlert", appSettings.lng),
      [
        {
          text: __(
            "listingDetailScreenTexts.cancelButtonTitle",
            appSettings.lng
          ),
        },
        {
          text: __(
            "listingDetailScreenTexts.loginButtonTitle",
            appSettings.lng
          ),
          onPress: () => navigation.navigate(routes.loginScreen),
        },
      ],
      { cancelable: false }
    );
  };

  const onAdmobError = (error) => {
    setAdmobError(true);
  };

  const ListHeader = useCallback(
    () => (
      <View
        style={[
          styles.storeTop,
          {
            height:
              admobConfig?.admobEnabled &&
              admobConfig?.storeDetail &&
              !admobError
                ? listHeaderHeight +
                  (200 - (70 + 15 + windowWidth * 0.03)) +
                  40 +
                  100 +
                  5
                : listHeaderHeight +
                  (200 - (70 + 15 + windowWidth * 0.03)) +
                  40 +
                  5,
          },
        ]}
      >
        {/* Store Banner */}
        <View style={styles.bannerWrap}>
          <Image
            source={
              !!storeData.banner
                ? { uri: storeData.banner }
                : storeDetailfallbackImage.banner
            }
            style={styles.banner}
          />
        </View>
        {/* Store Detail */}
        <View
          onLayout={(event) => handleHeaderLayout(event)}
          style={styles.storeDetailWrap}
        >
          {/* Logo, Title, Rating, Slogan */}
          <View style={[styles.storeDetatilTopWrap, rtlView]}>
            <View style={styles.storeLogo}>
              <Image
                style={styles.logo}
                source={
                  storeData.logo
                    ? { uri: storeData.logo }
                    : storeDetailfallbackImage.logo
                }
              />
            </View>
            <View
              style={[
                styles.storeDetailTopRight,
                {
                  paddingLeft: rtl_support ? 0 : 10,
                  paddingRight: rtl_support ? 10 : 0,
                  alignItems: rtl_support ? "flex-end" : "flex-start",
                },
              ]}
            >
              <View style={[styles.storeTitleRow, rtlView]}>
                <View
                  style={{
                    flex: 1,
                    alignItems: rtl_support ? "flex-end" : "flex-start",
                  }}
                >
                  <Text style={[styles.storeTitle, rtlText]} numberOfLines={1}>
                    {storeData.title
                      ? decodeString(storeData.title)
                      : __("storeDetailsTexts.nullText", appSettings.lng)}
                  </Text>
                </View>

                {!!storeData.review.average && (
                  <View style={[styles.storeRatingWrap, rtlView]}>
                    <Text
                      style={[
                        styles.rating,
                        {
                          marginRight: rtl_support ? 0 : 5,
                          marginLeft: rtl_support ? 5 : 0,
                        },
                        rtlText,
                      ]}
                    >
                      {parseFloat(storeData.review.average)}
                    </Text>

                    <FontAwesome name="star" size={12} color={COLORS.white} />
                  </View>
                )}
              </View>

              {!!storeData.slogan && (
                <Text style={[styles.storeSlogan, rtlText]} numberOfLines={2}>
                  {decodeString(storeData.slogan)}
                </Text>
              )}
              {config?.seller_verification &&
                !!storeData?.owner?.seller_verified && (
                  <View
                    style={{
                      flexDirection: rtl_support ? "row-reverse" : "row",
                      alignItems: "center",
                      paddingTop: 5,
                    }}
                  >
                    <MaterialIcons
                      name="verified"
                      size={20}
                      color={
                        config?.seller_verification?.badge_color || "green"
                      }
                    />
                    <View style={{ paddingHorizontal: 5 }}>
                      <Text
                        style={[
                          {
                            fontSize: 15,
                            color:
                              config?.seller_verification?.badge_color ||
                              "green",
                          },
                          rtlText,
                        ]}
                      >
                        {__(
                          "listingDetailScreenTexts.verified",
                          appSettings.lng
                        )}
                      </Text>
                    </View>
                  </View>
                )}
            </View>
          </View>

          <View
            style={{
              height: 1,
              width: "100%",
              backgroundColor: COLORS.gray,
              marginTop: 15,
              marginBottom: 5,
            }}
          />
          {/* Address, Opening hours, Membership, Website */}
          <View style={styles.storeDetatilMidWrap}>
            <View style={[styles.storeDetailMidrow, rtlView]}>
              <View style={styles.storeDetailMidrowIconWrap}>
                <Fontisto
                  name="map-marker-alt"
                  size={14}
                  color={COLORS.primary}
                />
              </View>
              <View style={[{ flex: 1 }, rtlView]}>
                <Text
                  style={[
                    styles.storeDetailMidrowText,
                    {
                      marginRight: rtl_support ? 5 : 0,
                      marginLeft: rtl_support ? 0 : 5,
                    },
                    rtlText,
                  ]}
                  numberOfLines={2}
                >
                  {storeData.address
                    ? decodeString(storeData.address)
                    : __("storeDetailsTexts.nullText", appSettings.lng)}
                </Text>
              </View>
            </View>
            <View style={[styles.storeDetailMidrow, rtlView]}>
              <View style={styles.storeDetailMidrowIconWrap}>
                <Fontisto name="clock" size={13} color={COLORS.primary} />
              </View>
              <View style={[{ flex: 1 }, rtlView]}>
                <Text
                  style={[
                    styles.storeDetailMidrowText,
                    {
                      marginRight: rtl_support ? 5 : 0,
                      marginLeft: rtl_support ? 0 : 5,
                    },
                    rtlText,
                  ]}
                >
                  {getOpenHours()}
                </Text>
              </View>
            </View>
            <View style={[styles.storeDetailMidrow, rtlView]}>
              <View style={styles.storeDetailMidrowIconWrap}>
                <FontAwesome name="user" size={16} color={COLORS.primary} />
              </View>
              <Text
                style={[
                  styles.storeDetailMidrowText,
                  {
                    marginRight: rtl_support ? 5 : 0,
                    marginLeft: rtl_support ? 0 : 5,
                  },
                  rtlText,
                ]}
              >
                {__("storeDetailsTexts.membership", appSettings.lng)}{" "}
                {moment(storeData.created_at).format(
                  storeDetailsTexts.membershipMomentFormate
                )}
              </Text>
            </View>
            <View style={[styles.storeDetailMidrow, rtlView]}>
              <View style={styles.storeDetailMidrowIconWrap}>
                <FontAwesome5
                  name="globe-americas"
                  size={14}
                  color={COLORS.primary}
                />
              </View>
              <Text
                style={[
                  styles.storeDetailMidrowText,
                  {
                    marginRight: rtl_support ? 5 : 0,
                    marginLeft: rtl_support ? 0 : 5,
                  },
                  rtlText,
                ]}
              >
                {storeData.website
                  ? storeData.website
                  : __("storeDetailsTexts.nullText", appSettings.lng)}
              </Text>
            </View>
          </View>
          <View
            style={{
              height: 1,
              width: "100%",
              backgroundColor: COLORS.gray,
              marginTop: 5,
              marginBottom: 10,
            }}
          />
          {/* Call, Message, More Details */}
          <View style={styles.storeDetatilBottomWrap}>
            {(user === null || user?.id !== storeData.owner_id) &&
              (!!storeData.phone || !!storeData.email) && (
                <View
                  style={[
                    styles.storeContactWrap,
                    {
                      justifyContent:
                        !!storeData.phone && !!storeData.email
                          ? "space-between"
                          : "center",
                    },
                  ]}
                >
                  {!!storeData.phone && (
                    <TouchableOpacity
                      style={[
                        styles.storeContactButton,
                        { backgroundColor: COLORS.bg_dark },
                      ]}
                      onPress={() => {
                        if (
                          user === null &&
                          config?.registered_only?.store_contact
                        ) {
                          handleLoginAlert();
                        } else {
                          setModalVisible(true);
                        }
                      }}
                    >
                      <Ionicons name="call" size={18} color={COLORS.primary} />
                      <Text
                        style={[
                          styles.storeContactButtonText,
                          { color: COLORS.text_gray },
                          rtlText,
                        ]}
                      >
                        {__("sellerContactTexts.call", appSettings.lng)}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {!!storeData.email && (
                    <TouchableOpacity
                      style={[
                        styles.storeContactButton,
                        { backgroundColor: COLORS.primary },
                      ]}
                      onPress={handleEmail}
                    >
                      <Zocial name="email" size={18} color={COLORS.white} />
                      <Text
                        style={[
                          styles.storeContactButtonText,
                          { color: COLORS.white },
                          rtlText,
                        ]}
                      >
                        {__("sellerContactTexts.email", appSettings.lng)}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            {admobConfig?.admobEnabled &&
              admobConfig?.storeDetail &&
              !admobError && (
                <View
                  style={{
                    width: "100%",
                    alignItems: "center",
                    marginTop: 10,
                  }}
                >
                  <AdmobBanner onError={onAdmobError} />
                </View>
              )}
            <TouchableOpacity
              style={[
                styles.viewMoreDetailsButton,
                {
                  marginTop:
                    (!storeData.phone && !storeData.email) ||
                    user?.id === storeData.owner_id
                      ? 0
                      : 15,
                  justifyContent: "center",
                },
              ]}
              onPress={handleMoreDetailPress}
            >
              <Text style={[styles.viewMoreDetailsButtonText, rtlText]}>
                {__("storeDetailsTexts.viewMore", appSettings.lng)}
              </Text>
              <AntDesign name="arrowright" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
        {/* Flatlist Title */}
        <View
          style={[
            {
              width: "100%",
              position: "absolute",
              top:
                listHeaderHeight + (200 - (70 + 15 + windowWidth * 0.03)) + 15,
              paddingHorizontal: "3%",
            },
            rtlView,
          ]}
        >
          <Text
            style={[
              {
                fontSize: 15,
                fontWeight: "bold",
                color: COLORS.text_dark,
                lineHeight: 20,
              },
              rtlText,
            ]}
          >
            {__("storeDetailsTexts.latestAds", appSettings.lng)}
          </Text>
        </View>
      </View>
    ),
    [storeData, listHeaderHeight]
  );

  const EmptyListComponent = () => {
    if (initial) {
      return (
        <View style={styles.view}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    } else {
      return (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={[
              {
                fontSize: 15,
                fontWeight: "bold",
                color: COLORS.gray,
              },
              rtlText,
            ]}
          >
            {__("storeDetailsTexts.emptyListing", appSettings.lng)}
          </Text>
        </View>
      );
    }
  };

  const listFooter = () => {
    if (pagination && pagination.total_pages > pagination.current_page) {
      return (
        <View style={styles.loadMoreWrap}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      );
    } else {
      return null;
    }
  };

  const handleNextPageLoading = () => {
    if (refreshing) return;
    if (pagination && pagination.total_pages > pagination.current_page) {
      setCurrentPage((prevCurrentPage) => prevCurrentPage + 1);
      setMoreLoading(true);
    }
  };

  const handleCall = (number) => {
    setModalVisible(false);
    let phoneNumber = "";
    if (ios) {
      phoneNumber = `telprompt:${number}`;
    } else {
      phoneNumber = `tel:${number}`;
    }
    Linking.openURL(phoneNumber);
  };

  const onRefresh = () => {
    if (moreLoading) return;
    setRefreshing(true);
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

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

  return loading ? (
    // {* Loading Component *}
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={[styles.text, rtlText]}>
        {__("storeDetailsTexts.loadingText", appSettings.lng)}
      </Text>
    </View>
  ) : (
    <View style={styles.container}>
      {!storeExpired && !!storeData && (
        <>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.screenTitle, rtlText]}>
              {__("storeDetailsTexts.title", appSettings.lng)}
            </Text>
            {/* Back Button */}
            <TouchableOpacity
              style={styles.headerBackButton}
              onPress={() => navigation.goBack()}
            >
              <Feather name="arrow-left" size={24} color={COLORS.black} />
            </TouchableOpacity>
          </View>
          {/* Listing FlatList */}
          <View style={styles.storeBottom}>
            <FlatList
              data={storeListingSData}
              renderItem={renderListItem}
              keyExtractor={keyExtractor}
              horizontal={false}
              showsVerticalScrollIndicator={false}
              onEndReached={handleNextPageLoading}
              onEndReachedThreshold={1}
              ListFooterComponent={listFooter}
              onRefresh={onRefresh}
              refreshing={refreshing}
              ListHeaderComponent={ListHeader}
              ListEmptyComponent={EmptyListComponent}
              ItemSeparatorComponent={ListSeparator}
              contentContainerStyle={{
                paddingBottom: 50,
              }}
            />
          </View>
          {/* Call prompt */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
          >
            <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
              <View style={styles.modalOverlay} />
            </TouchableWithoutFeedback>
            {!!storeData.phone && (
              <View
                style={{
                  flex: 1,
                  justifyContent: "flex-end",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    paddingHorizontal: "3%",
                    padding: 20,
                    backgroundColor: COLORS.white,
                    width: "100%",
                  }}
                >
                  <Text style={[styles.callText, rtlText]}>
                    {__("storeDetailsTexts.callPrompt", appSettings.lng)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleCall(storeData.phone)}
                    style={styles.phone}
                  >
                    <Text style={[styles.phoneText, rtlText]}>
                      {storeData.phone}
                    </Text>
                    <FontAwesome5
                      name="phone"
                      size={18}
                      color={COLORS.primary}
                    />
                  </TouchableOpacity>

                  <AppTextButton
                    title={__(
                      "storeDetailsTexts.cancelButtonTitle",
                      appSettings.lng
                    )}
                    style={{ marginTop: 20 }}
                    onPress={() => setModalVisible(false)}
                  />
                </View>
              </View>
            )}
          </Modal>
        </>
      )}
      {storeExpired && (
        <View style={styles.expiredWrap}>
          <EvilIcons name="exclamation" size={50} color={COLORS.red} />
          <Text style={[styles.expiredText, rtlText]}>
            {__("storeDetailsTexts.storeExpired", appSettings.lng)}
          </Text>
          <AppButton
            title={__("storeDetailsTexts.goBackButtonTitle", appSettings.lng)}
            onPress={handleGoBack}
            style={styles.goBackButton}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    height: 200,
    width: "100%",
    resizeMode: "cover",
  },
  bannerWrap: {
    width: "100%",
    height: 200,
  },
  callText: {
    fontSize: 20,
    color: COLORS.text_dark,
    textAlign: "center",
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    width: "100%",
    height: "100%",
  },
  expiredText: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.gray,
    textAlign: "center",
    marginVertical: 15,
  },
  expiredWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: "3%",
  },
  goBackButton: {
    width: "40%",
  },
  header: {
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    width: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 2,
  },
  headerBackButton: {
    position: "absolute",
    left: "3%",
    elevation: 2,
    height: 30,
    width: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    width: 20,
    alignItems: "center",
  },
  listingCardDetailContent: {
    flex: 1,
  },
  listingCardDetailLeft: {
    flex: 1,
  },
  listingCardDetailRight: {},
  listingCardDetailWrap: {
    flex: 1,

    width: windowWidth * 0.74,
  },
  listingCardImage: {
    height: 80,
    width: 80,
    resizeMode: "cover",
  },
  listingCardImageWrap: {
    height: 80,
    width: 80,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 5,
  },
  listingCardPrice: {
    fontWeight: "bold",
    color: COLORS.primary,
  },
  listingCardText: {
    fontSize: 12,
    color: COLORS.text_gray,
  },
  listingCardTitle: {
    fontWeight: "bold",
    fontSize: 13,
    color: COLORS.text_dark,
  },

  loading: {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  logo: {
    height: 70,
    width: 80,
    resizeMode: "contain",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  phone: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  phoneText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 18,
  },
  rating: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.white,

    lineHeight: 18,
  },
  screenTitle: {
    fontSize: 20,
    color: COLORS.black,
    fontWeight: "bold",
    elevation: 2,
  },
  storeBottom: {
    width: "100%",
    flex: 1,
    position: "relative",
  },
  storeContactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 3,
    width: "48%",
    height: 32,
  },
  storeContactButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
  },
  storeContactWrap: {
    marginVertical: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  storeDetailMidrow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginVertical: 5,
  },
  storeDetailMidrowIconWrap: {
    height: 16,
    width: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  storeDetailMidrowText: {
    fontSize: 14,
    color: COLORS.text_gray,
  },
  storeDetailTopRight: {
    flex: 1,

    width: windowWidth * 0.724,
  },
  storeDetatilTopWrap: {
    width: windowWidth * 0.88,
    flexDirection: "row",
    alignItems: "center",
  },
  storeDetailWrap: {
    backgroundColor: COLORS.white,
    position: "absolute",
    width: windowWidth * 0.94,
    top: 200 - (70 + 15 + windowWidth * 0.03),
    borderRadius: 5,
    elevation: 5,
    padding: windowWidth * 0.03,
    shadowColor: "#000",
    shadowRadius: 3,
    shadowOffset: {
      width: 3,
      height: 3,
    },
    shadowOpacity: 0.2,
    zIndex: 1,
  },
  storeListingCardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: "3%",
  },
  storeLogo: {
    height: 70,
    width: 80,
    overflow: "hidden",
  },
  storeRatingWrap: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: COLORS.orange,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  storeSlogan: {
    fontSize: 15,
    color: COLORS.text_gray,
    marginBottom: 5,
    lineHeight: 18,
  },
  storeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text_dark,
    lineHeight: 25,
  },
  storeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  storeTop: {
    width: "100%",
    alignItems: "center",
  },
  viewMoreDetailsButton: {
    flexDirection: "row",
    alignItems: "center",

    marginBottom: 5,
  },
  viewMoreDetailsButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    marginRight: 5,
    lineHeight: 20,
  },
});

export default StoreDetailsScreen;
