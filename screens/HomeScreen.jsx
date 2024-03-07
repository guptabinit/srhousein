/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
  Animated,
  ActivityIndicator,
  Keyboard,
  RefreshControl,
  Alert,
  BackHandler,
  Pressable,
} from "react-native";

// Expo Libraries
import { Formik } from "formik";

// Vector Fonts
import {
  SimpleLineIcons,
  FontAwesome,
  Feather,
  Fontisto,
  Ionicons,
  Entypo,
} from "@expo/vector-icons";

// Custom Components & Constants
import { COLORS } from "../variables/color";
import TabScreenHeader from "../components/TabScreenHeader";
import { useStateValue } from "../StateProvider";
import api, { removeAuthToken, setAuthToken } from "../api/client";
import { decodeString } from "../helper/helper";
import FlashNotification from "../components/FlashNotification";
import AppButton from "../components/AppButton";
import ListingCard from "../components/ListingCard";
import ListingCardList from "../components/ListingCardList";
import { paginationData } from "../app/pagination/paginationData";
import CategoryIcon from "../components/CategoryIcon";
import CategoryImage from "../components/CategoryImage";
import { __, getRelativeTimeConfig } from "../language/stringPicker";
import { admobConfig } from "../app/services/adMobConfig";
import { routes } from "../navigation/routes";
import settingsStorage from "../app/settings/settingsStorage";
import { useFocusEffect, useScrollToTop } from "@react-navigation/native";
import { miscConfig } from "../app/services/miscConfig";
import moment from "moment";

const { width: screenWidth, height: screenHeight } = Dimensions.get("screen");
const { height: windowHeight } = Dimensions.get("window");

const HomeScreen = ({ navigation }) => {
  const [
    {
      search_locations,
      config,
      search_categories,
      cat_name,
      ios,
      appSettings,
      rtl_support,
      user,
      auth_token,
    },
    dispatch,
  ] = useStateValue();
  const [topCategoriesData, setTopCategoriesData] = useState([]);
  const [pagination, setPagination] = useState({});
  const [searchData, setSearchData] = useState(() => {
    return {
      ...paginationData.home,
      search: "",
      locations: search_locations.length
        ? search_locations.map((location) => location.term_id)
        : "",
      categories: "",
      page: pagination.current_page || 1,
      onScroll: false,
    };
  });
  const [locationsData, setLocationsData] = useState([]);
  const [listingsData, setListingsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [initial, setInitial] = useState(true);
  const [flashNotification, setFlashNotification] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [timedOut, setTimedOut] = useState();
  const [networkError, setNetworkError] = useState();
  const [retry, setRetry] = useState(false);
  const [scrollButtonVisible, setScrollButtonVisible] = useState(false);

  const iosFlatList = useRef(null);
  useScrollToTop(iosFlatList);

  // Search on Location Change
  useEffect(() => {
    if (!search_locations) return;
    setSearchData((prevSearchData) => {
      return {
        ...prevSearchData,
        locations: search_locations
          .map((location) => location.term_id)
          .splice(search_locations.length - 1),
        page: 1,
      };
    });
    setLoading(true);
  }, [search_locations]);
  useEffect(() => {
    const timeConfig = getRelativeTimeConfig(appSettings.lng);
    moment.updateLocale("en-gb", {
      relativeTime: timeConfig,
    });
  }, [appSettings.lng]);

  // Search on Category Change from All Category Page
  useEffect(() => {
    if (!search_categories.length) return;
    setSearchData((prevSearchData) => {
      return {
        ...prevSearchData,
        categories: search_categories[search_categories.length - 1],
        page: 1,
      };
    });
    setLoading(true);
  }, [search_categories]);

  // Initial Load Listings Data
  useEffect(() => {
    if (!initial) return;
    dispatch({
      type: "SET_NEW_LISTING_SCREEN",
      newListingScreen: false,
    });
    handleLoadTopCategories();
    if (config.location_type === "local") {
      handleLoadLocations();
    }
    handleLoadListingsData();
  }, [initial]);

  useEffect(() => {
    if (!loading) return;
    if (!retry) {
      dispatch({
        type: "SET_NEW_LISTING_SCREEN",
        newListingScreen: false,
      });
      handleLoadListingsData();
    } else {
      handleLoadTopCategories();
      if (config.location_type === "local") {
        handleLoadLocations();
      }
      handleLoadListingsData();
    }
  }, [loading]);

  // Get Listing on Next Page Request
  useEffect(() => {
    if (!searchData.onScroll) return;

    handleLoadListingsData(true);
  }, [searchData.onScroll]);

  // Refreshing get listing call
  useEffect(() => {
    if (!refreshing) return;
    handleLoadListingsData();
  }, [refreshing]);

  useEffect(() => {
    if (!miscConfig?.enableHomeButtonRefreshAction) return;
    const unsubscribe = navigation.addListener("tabPress", (e) => {
      if (
        searchData.categories ||
        searchData.locations?.length ||
        searchData.search
      ) {
        handleReset();
      }
    });
    return unsubscribe;
  }, [navigation, searchData]);

  const backAction = () => {
    Alert.alert("", __("homeScreenTexts.exitAppWarning", appSettings.lng), [
      {
        text: __("homeScreenTexts.cancelButtonTitle", appSettings.lng),
        onPress: () => null,
      },
      {
        text: __("homeScreenTexts.yesButtonTitle", appSettings.lng),
        onPress: () => BackHandler.exitApp(),
      },
    ]);
    return true;
  };
  useFocusEffect(
    useCallback(() => {
      BackHandler.addEventListener("hardwareBackPress", backAction);
      return () =>
        BackHandler.removeEventListener("hardwareBackPress", backAction);
    }, [])
  );

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
  const onRefresh = () => {
    if (moreLoading) return;
    setRefreshing(true);
  };

  const handleLoadLocations = () => {
    api.get("locations").then((res) => {
      if (res.ok) {
        setLocationsData(res.data);
      } else {
        // print error
        // TODO handle error
        if (res.problem === "CANCEL_ERROR") {
          return true;
        }
      }
    });
  };

  const handleLoadListingsData = (onScroll) => {
    if (user) {
      setAuthToken(auth_token);
    }
    const args = !refreshing ? { ...searchData } : { ...searchData, page: 1 };
    api.get("listings", args).then((res) => {
      if (res.ok) {
        if (refreshing) {
          setRefreshing(false);
        }
        if (onScroll) {
          if (admobConfig.admobEnabled && admobConfig.homeScreen) {
            if (listingsData.length % 2 == 0) {
              setListingsData((prevListingsData) => [
                ...prevListingsData,
                { listAd: true },
                { listAd: true, dummy: true },
                ...res.data.data,
              ]);
            } else {
              setListingsData((prevListingsData) => [
                ...prevListingsData,
                { listAd: true, dummy: true },
                { listAd: true },
                ...res.data.data,
              ]);
            }
          } else {
            setListingsData((prevListingsData) => [
              ...prevListingsData,
              ...res.data.data,
            ]);
          }
          setSearchData((prevSearchData) => {
            return {
              ...prevSearchData,
              onScroll: false,
            };
          });
        } else {
          setListingsData(res.data.data);
        }
        setPagination(res.data.pagination ? res.data.pagination : {});
        if (initial) {
          setInitial(false);
        }
        if (user) {
          removeAuthToken();
        }
        setLoading(false);
      } else {
        if (refreshing) {
          setRefreshing(false);
        }
        // print error
        // TODO handle error
        if (res.problem === "CANCEL_ERROR") {
          return true;
        }
        if (res.problem === "TIMEOUT_ERROR") {
          setTimedOut(true);
        }
      }
      setMoreLoading(false);
      if (user) {
        removeAuthToken();
      }
      setLoading(false);
    });
  };
  const handleNextPageLoading = () => {
    // if (!searchData.onScroll) return;
    if (pagination && pagination.total_pages > pagination.current_page) {
      setMoreLoading(true);
      setSearchData((prevSearchData) => {
        return {
          ...prevSearchData,
          page: prevSearchData.page + 1,
          onScroll: true,
        };
      });
    }
  };
  const handleLoadTopCategories = () => {
    api.get("categories").then((res) => {
      if (res.ok) {
        setTopCategoriesData(res.data);
        dispatch({
          type: "SET_CATEGORIES_DATA",
          categories_data: res.data,
        });
      } else {
        if (res.problem === "CANCEL_ERROR") {
          return true;
        }
        // print error
        // TODO handle error
      }
    });
  };
  const handleSelectCategory = (item) => {
    setSearchData((prevSearchData) => {
      return { ...prevSearchData, categories: item.term_id, page: 1 };
    });
    dispatch({
      type: "SET_CAT_NAME",
      cat_name: [item.name],
    });
    setLoading(true);
  };

  const scrollY = new Animated.Value(0);
  const diffClamp = Animated.diffClamp(scrollY, 0, 125);
  const translateY = diffClamp.interpolate({
    inputRange: [0, 125],
    outputRange: [0, -125],
  });

  const Category = ({ onPress, item }) => (
    <TouchableOpacity
      onPress={() => onPress(item)}
      style={{
        justifyContent: "center",
        alignItems: "center",
        width: screenWidth / 4,
        padding: 5,
      }}
    >
      <View
        style={{
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: COLORS.bg_primary,
            height: 50,
            width: 50,
            borderRadius: 25,
          }}
        >
          {item?.icon?.url ? (
            <CategoryImage size={20} uri={item.icon.url} />
          ) : (
            <CategoryIcon
              iconName={item.icon.class}
              iconSize={20}
              iconColor={COLORS.primary}
            />
          )}
        </View>
        <Text
          style={{
            marginTop: 5,
            color: COLORS.text_gray,
            // fontWeight: "bold",
            fontSize: 14,
          }}
          numberOfLines={1}
        >
          {decodeString(item.name).split(" ")[0]}
        </Text>
      </View>
    </TouchableOpacity>
  );
  const renderCategory = useCallback(
    ({ item }) => <Category onPress={handleSelectCategory} item={item} />,
    [refreshing, config]
  );

  const keyExtractor = useCallback((item, index) => `${index}`, []);

  const renderFeaturedItem = useCallback(
    ({ item }) => (
      <ListingCard
        onPress={() =>
          navigation.navigate(routes.listingDetailScreen, {
            listingId: item.listing_id,
          })
        }
        item={item}
      />
    ),
    [refreshing, config]
  );
  const renderFeaturedItemList = useCallback(
    ({ item }) => (
      <ListingCardList
        onPress={() =>
          navigation.navigate(routes.listingDetailScreen, {
            listingId: item.listing_id,
          })
        }
        item={item}
      />
    ),
    [refreshing, config]
  );

  const featuredListFooter = () => {
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

  const FeaturedListIosHeader = () => (
    <Animated.View>
      <View
        style={{
          flexDirection: rtl_support ? "row-reverse" : "row",
          alignItems: "center",
          paddingHorizontal: screenWidth * 0.015,

          paddingVertical: 10,
          width: screenWidth,
          justifyContent: "space-between",

          width: screenWidth * 0.97,
        }}
      >
        <Text
          style={{
            fontSize: 15,
            fontWeight: "bold",
          }}
        >
          {__("homeScreenTexts.topCategoriesText", appSettings.lng)}
        </Text>
        <TouchableOpacity onPress={handleSeeAll}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "bold",
              color: COLORS.primary,
            }}
          >
            {__("homeScreenTexts.seAllButtonText", appSettings.lng)}
          </Text>
        </TouchableOpacity>
      </View>
      {/* categories flatlist */}
      <FlatList
        data={topCategoriesData}
        renderItem={renderCategory}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        inverted={rtl_support}
      />

      {rtl_support ? (
        <View style={[styles.featuredListingTop, rtlView]}>
          <View style={[{ flex: 1 }, rtlView]}>
            <Text
              style={[
                {
                  fontSize: 15,
                  fontWeight: "bold",
                },
                // rtlText,
              ]}
            >
              {searchData.categories && cat_name && (
                <Text style={[styles.selectedCat]} numberOfLines={1}>
                  ({getSelectedCat(cat_name[0])})
                </Text>
              )}{" "}
              {__("homeScreenTexts.latestAdsText", appSettings.lng)}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <TouchableOpacity
              onPress={() => handleLayoutToggle(false)}
              style={[
                styles.gridBtnWrap,
                {
                  backgroundColor: appSettings?.listView
                    ? COLORS.white
                    : COLORS.primary,
                  marginRight: 10,
                  borderColor: appSettings?.listView
                    ? COLORS.border_light
                    : COLORS.primary,
                },
              ]}
            >
              <Ionicons
                name="grid"
                size={15}
                color={appSettings?.listView ? COLORS.gray : COLORS.white}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleLayoutToggle(true)}
              style={[
                styles.gridBtnWrap,
                {
                  backgroundColor: appSettings?.listView
                    ? COLORS.primary
                    : COLORS.white,
                  borderColor: appSettings?.listView
                    ? COLORS.primary
                    : COLORS.border_light,
                },
              ]}
            >
              <Ionicons
                name="list-sharp"
                size={15}
                color={appSettings?.listView ? COLORS.white : COLORS.gray}
              />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            flex: 1,
            paddingHorizontal: screenWidth * 0.015,
            paddingBottom: 15,
            paddingTop: 5,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "bold",
              }}
            >
              {__("homeScreenTexts.latestAdsText", appSettings.lng)}{" "}
              {searchData?.categories && cat_name && (
                <Text style={styles.selectedCat} numberOfLines={1}>
                  ({getSelectedCat(cat_name[0])})
                </Text>
              )}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <TouchableOpacity
              onPress={() => handleLayoutToggle(false)}
              style={[
                styles.gridBtnWrap,
                {
                  backgroundColor: appSettings?.listView
                    ? COLORS.white
                    : COLORS.primary,
                  marginRight: 10,
                  borderColor: appSettings?.listView
                    ? COLORS.border_light
                    : COLORS.primary,
                },
              ]}
            >
              <Ionicons
                name="grid"
                size={15}
                color={appSettings?.listView ? COLORS.gray : COLORS.white}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleLayoutToggle(true)}
              style={[
                styles.gridBtnWrap,
                {
                  backgroundColor: appSettings?.listView
                    ? COLORS.primary
                    : COLORS.white,
                  borderColor: appSettings?.listView
                    ? COLORS.primary
                    : COLORS.border_light,
                },
              ]}
            >
              <Ionicons
                name="list-sharp"
                size={15}
                color={appSettings?.listView ? COLORS.white : COLORS.gray}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Animated.View>
  );

  const handleSearch = (values) => {
    Keyboard.dismiss();
    if (values?.search?.trim()) {
      setSearchData((prevSearchData) => {
        return { ...prevSearchData, search: values.search };
      });
      setLoading(true);
    } else {
      return;
    }
  };

  const handleReset = () => {
    setSearchData({
      categories: "",
      locations: "",
      onScroll: false,
      page: 1,
      per_page: 20,
      search: "",
    });
    dispatch({
      type: "SET_SEARCH_LOCATIONS",
      search_locations: [],
    });
    dispatch({
      type: "SET_SEARCH_CATEGORIES",
      search_categories: [],
    });
  };

  const onAndroidFeaturedListingScroll = (e) => {
    scrollY.setValue(e.nativeEvent.contentOffset.y);
  };
  const onListingListScroll = (e) => {
    if (!scrollButtonVisible && e.nativeEvent.contentOffset.y > 300) {
      setScrollButtonVisible(true);
    }
    if (scrollButtonVisible && e.nativeEvent.contentOffset.y < 300) {
      setScrollButtonVisible(false);
    }
  };

  const getSelectedCat = (urg) => {
    return decodeString(urg);
  };

  const handleLayoutToggle = (layout) => {
    if (appSettings?.listView === layout) {
      return;
    }
    const tempSettings = { ...appSettings, listView: layout };
    dispatch({
      type: "SET_SETTINGS",
      appSettings: tempSettings,
    });
    settingsStorage.storeAppSettings(JSON.stringify(tempSettings));
  };

  const ListHeader = () => {
    return (
      <View style={[styles.featuredListingTop, rtlView]}>
        {rtl_support ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                onPress={() => handleLayoutToggle(false)}
                style={[
                  styles.gridBtnWrap,
                  {
                    backgroundColor: appSettings?.listView
                      ? COLORS.white
                      : COLORS.primary,
                    marginRight: 10,
                    borderColor: appSettings?.listView
                      ? COLORS.border_light
                      : COLORS.primary,
                  },
                ]}
              >
                <Ionicons
                  name="grid"
                  size={15}
                  color={appSettings?.listView ? COLORS.gray : COLORS.white}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleLayoutToggle(true)}
                style={[
                  styles.gridBtnWrap,
                  {
                    backgroundColor: appSettings?.listView
                      ? COLORS.primary
                      : COLORS.white,
                    borderColor: appSettings?.listView
                      ? COLORS.primary
                      : COLORS.border_light,
                  },
                ]}
              >
                <Ionicons
                  name="list-sharp"
                  size={15}
                  color={appSettings?.listView ? COLORS.white : COLORS.gray}
                />
              </TouchableOpacity>
            </View>
            <View style={[{ flex: 1 }, rtlView]}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "bold",
                }}
              >
                {searchData?.categories && cat_name && (
                  <Text style={styles.selectedCat} numberOfLines={1}>
                    ({getSelectedCat(cat_name[0])})
                  </Text>
                )}{" "}
                {__("homeScreenTexts.latestAdsText", appSettings.lng)}
              </Text>
            </View>
          </View>
        ) : (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              flex: 1,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "bold",
                }}
              >
                {__("homeScreenTexts.latestAdsText", appSettings.lng)}{" "}
                {searchData?.categories && cat_name && (
                  <Text style={styles.selectedCat} numberOfLines={1}>
                    ({getSelectedCat(cat_name[0])})
                  </Text>
                )}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                onPress={() => handleLayoutToggle(false)}
                style={[
                  styles.gridBtnWrap,
                  {
                    backgroundColor: appSettings?.listView
                      ? COLORS.white
                      : COLORS.primary,
                    marginRight: 10,
                    borderColor: appSettings?.listView
                      ? COLORS.border_light
                      : COLORS.primary,
                  },
                ]}
              >
                <Ionicons
                  name="grid"
                  size={15}
                  color={appSettings?.listView ? COLORS.gray : COLORS.white}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleLayoutToggle(true)}
                style={[
                  styles.gridBtnWrap,
                  {
                    backgroundColor: appSettings?.listView
                      ? COLORS.primary
                      : COLORS.white,
                    borderColor: appSettings?.listView
                      ? COLORS.primary
                      : COLORS.border_light,
                  },
                ]}
              >
                <Ionicons
                  name="list-sharp"
                  size={15}
                  color={appSettings?.listView ? COLORS.white : COLORS.gray}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const handleSeeAll = () => {
    navigation.navigate(routes.selectcategoryScreen, {
      data: topCategoriesData,
    });
  };

  const handleRetry = () => {
    setLoading(true);
    if (timedOut) setTimedOut(false);
  };

  const ListingListEmptyComponent = () => (
    <>
      {/* No Listing Found */}
      {!listingsData?.length && !timedOut && !networkError && (
        <View style={styles.noListingsWrap}>
          <Fontisto name="frowning" size={100} color={COLORS.primary_soft} />
          <Text style={styles.noListingsMessage}>
            {__("homeScreenTexts.noListingsMessage", appSettings.lng)}
          </Text>
          <View style={styles.retryButton}>
            <AppButton
              title={__("homeScreenTexts.refreshBtn", appSettings.lng)}
              onPress={onRefresh}
            />
          </View>
        </View>
      )}
      {/* Timeout & Network Error notice */}
      {!listingsData?.length && (!!timedOut || !!networkError) && (
        <View style={styles.noListingsWrap}>
          <Fontisto name="frowning" size={100} color={COLORS.primary_soft} />
          {!!timedOut && (
            <Text style={styles.noListingsMessage}>
              {__("homeScreenTexts.requestTimedOut", appSettings.lng)}
            </Text>
          )}

          <View style={styles.retryButton}>
            <AppButton
              title={__("homeScreenTexts.retryBtn", appSettings.lng)}
              onPress={handleRetry}
            />
          </View>
        </View>
      )}
    </>
  );

  return (
    <View style={styles.container}>
      <TabScreenHeader style={{ elevation: 0, zIndex: 2 }} sideBar />
      {/* Loading Animation */}
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.text, rtlText]}>
            {__("homeScreenTexts.loadingMessage", appSettings.lng)}
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Search , Location , Reset button */}
          <View style={styles.listingTop}>
            {config.location_type === "local" && (
              <TouchableOpacity
                disabled={timedOut || networkError}
                style={styles.locationWrap}
                onPress={() =>
                  navigation.navigate(routes.selectLocationScreen, {
                    data: locationsData,
                    type: "search",
                  })
                }
              >
                <View style={[styles.locationContent, rtlView]}>
                  <FontAwesome
                    name="map-marker"
                    size={18}
                    color={COLORS.primary}
                  />
                  <Text
                    style={[styles.locationContentText, rtlTextA]}
                    numberOfLines={1}
                  >
                    {search_locations === null || !search_locations.length
                      ? __(
                          "homeScreenTexts.selectLocationText",
                          appSettings.lng
                        )
                      : search_locations.map((location) => location.name)[
                          search_locations.length - 1
                        ]}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            <Formik initialValues={{ search: "" }} onSubmit={handleSearch}>
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                values,
                setFieldValue,
              }) => (
                <View
                  style={[
                    styles.ListingSearchContainer,
                    {
                      marginLeft:
                        config?.location_type === "geo"
                          ? 0
                          : screenWidth * 0.015,
                      marginRight: screenWidth * 0.015,
                    },
                    rtlView,
                  ]}
                >
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={!values.search || timedOut || networkError}
                    style={
                      rtl_support
                        ? { marginLeft: 7 }
                        : styles.listingSearchBtnContainer
                    }
                  >
                    <Feather
                      name="search"
                      size={20}
                      color={values.search ? COLORS.primary : COLORS.primary}
                    />
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.searchInput, rtlTextA]}
                    placeholder={
                      searchData.search ||
                      __(
                        "homeScreenTexts.listingSearchPlaceholder",
                        appSettings.lng
                      )
                    }
                    placeholderTextColor={COLORS.textGray}
                    onChangeText={handleChange("search")}
                    onBlur={() => {
                      handleBlur("search");
                    }}
                    value={values.search}
                    returnKeyType="search"
                    onSubmitEditing={handleSubmit}
                  />

                  <Pressable
                    style={{ padding: 2 }}
                    onPress={() => {
                      if (values.search) {
                        setFieldValue("search", "");
                      } else {
                        if (searchData.search) {
                          Keyboard.dismiss();
                          setSearchData((prevSearchData) => {
                            return { ...prevSearchData, search: "" };
                          });
                          setLoading(true);
                        }
                      }
                    }}
                  >
                    <Feather name="x" size={16} color={COLORS.primary} />
                  </Pressable>
                </View>
              )}
            </Formik>
            {/* <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <SimpleLineIcons name="refresh" size={18} color={COLORS.white} />
            </TouchableOpacity> */}
          </View>
          {/* Category Slider */}
          {!!topCategoriesData.length && !ios && (
            <Animated.View
              style={[
                {
                  transform: [{ translateY: translateY }],
                },
                styles.topCatSliderWrap,
              ]}
            >
              <View
                style={{
                  flexDirection: rtl_support ? "row-reverse" : "row",
                  alignItems: "center",
                  paddingHorizontal: "3%",
                  paddingVertical: 10,
                  width: screenWidth,
                  justifyContent: "space-between",
                }}
              >
                <View style={{ alignItems: "center", flexDirection: "row" }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "bold",
                    }}
                  >
                    {__("homeScreenTexts.topCategoriesText", appSettings.lng)}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleSeeAll}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "bold",
                      color: COLORS.primary,
                    }}
                  >
                    {__("homeScreenTexts.seAllButtonText", appSettings.lng)}
                  </Text>
                </TouchableOpacity>
              </View>
              {/* categories flatlist */}
              <FlatList
                data={topCategoriesData}
                renderItem={renderCategory}
                keyExtractor={keyExtractor}
                horizontal
                showsHorizontalScrollIndicator={false}
                inverted={rtl_support}
              />
            </Animated.View>
          )}

          {/* FlatList */}
          {!!listingsData && !timedOut && !networkError && (
            <>
              {ios ? (
                <View
                  style={{
                    paddingHorizontal: screenWidth * 0.015,
                    flex: 1,
                  }}
                >
                  {
                    <FlatList
                      key={appSettings?.listView ? "list" : "grid"}
                      data={listingsData}
                      renderItem={
                        appSettings?.listView
                          ? renderFeaturedItemList
                          : renderFeaturedItem
                      }
                      keyExtractor={keyExtractor}
                      horizontal={false}
                      showsVerticalScrollIndicator={false}
                      onEndReached={handleNextPageLoading}
                      onEndReachedThreshold={1}
                      ListFooterComponent={featuredListFooter}
                      numColumns={appSettings?.listView ? 1 : 2}
                      maxToRenderPerBatch={appSettings?.listView ? 15 : 8}
                      windowSize={appSettings?.listView ? 41 : 61}
                      onScroll={onListingListScroll}
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                      contentContainerStyle={{
                        paddingBottom: screenHeight - windowHeight + 100,
                      }}
                      ListHeaderComponent={FeaturedListIosHeader}
                      scrollEventThrottle={1}
                      ref={iosFlatList}
                      ListEmptyComponent={ListingListEmptyComponent}
                    />
                  }
                  <TouchableOpacity
                    style={{
                      display: scrollButtonVisible ? "flex" : "none",
                      height: 40,
                      width: 40,
                      backgroundColor: COLORS.bg_dark,
                      alignItems: "center",
                      justifyContent: "center",
                      position: "absolute",
                      bottom: 10,
                      right: 15,
                      borderRadius: 40 / 2,
                      shadowRadius: 5,
                      shadowOpacity: 0.3,
                      shadowOffset: {
                        height: 2,
                        width: 2,
                      },
                      shadowColor: "#000",
                      paddingBottom: 3,
                    }}
                    onPress={() =>
                      iosFlatList.current.scrollToOffset({
                        animated: true,
                        offset: 0,
                      })
                    }
                  >
                    <FontAwesome
                      name="chevron-up"
                      size={20}
                      color={COLORS.primary}
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                <View
                  style={{
                    paddingHorizontal: screenWidth * 0.015,
                    // height:
                    //   screenHeight - Constants.statusBarHeight - 50 - 45 - 50,
                    flex: 1,
                  }}
                >
                  <Animated.FlatList
                    key={appSettings?.listView ? "list" : "grid"}
                    data={listingsData}
                    renderItem={
                      appSettings?.listView
                        ? renderFeaturedItemList
                        : renderFeaturedItem
                    }
                    keyExtractor={keyExtractor}
                    horizontal={false}
                    numColumns={appSettings?.listView ? 1 : 2}
                    showsVerticalScrollIndicator={false}
                    onEndReached={handleNextPageLoading}
                    onEndReachedThreshold={1}
                    ListFooterComponent={featuredListFooter}
                    maxToRenderPerBatch={appSettings?.listView ? 15 : 8}
                    windowSize={appSettings?.listView ? 41 : 61}
                    onScroll={onAndroidFeaturedListingScroll}
                    refreshControl={
                      <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        progressViewOffset={125}
                      />
                    }
                    contentContainerStyle={{
                      paddingBottom: screenHeight - windowHeight + 100,
                      paddingTop: 125,
                    }}
                    ListHeaderComponent={ListHeader}
                    scrollEventThrottle={1}
                    bounces={false}
                    ref={iosFlatList}
                    ListEmptyComponent={ListingListEmptyComponent}
                  />
                </View>
              )}
            </>
          )}
          {/* Timeout & Network Error notice */}
          {!listingsData.length && (!!timedOut || !!networkError) && (
            <View style={styles.noListingsWrap}>
              <Fontisto
                name="frowning"
                size={100}
                color={COLORS.primary_soft}
              />
              {!!timedOut && (
                <Text style={styles.noListingsMessage}>
                  {__("homeScreenTexts.requestTimedOut", appSettings.lng)}
                </Text>
              )}

              <View style={styles.retryButton}>
                <AppButton title="Retry" onPress={handleRetry} />
              </View>
            </View>
          )}
          {/* Flash notification */}
          <FlashNotification
            falshShow={flashNotification}
            flashMessage="Hello World!"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  admobOverLay: {
    flex: 1,
    backgroundColor: COLORS.primary_soft,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    width: "100%",
    padding: windowHeight * 0.03,
  },
  admobOverLayText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.white,
    textAlign: "center",
  },
  categoriesRowWrap: {},
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  featuredListingTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: screenWidth * 0.015,
    paddingBottom: 15,
    paddingTop: 5,
  },
  gridBtnWrap: {
    padding: 4,
    borderRadius: 3,
    borderWidth: 1,
  },
  itemSeparator: {
    height: "100%",
    width: 1.333,
    backgroundColor: COLORS.bg_dark,
  },
  listingSearchBtnContainer: {
    marginRight: 7,
  },
  ListingSearchContainer: {
    flex: 1,
    height: 34,
    backgroundColor: COLORS.white,
    borderRadius: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 7,
  },
  listingTop: {
    backgroundColor: COLORS.primary,
    width: "100%",
    marginTop: -1,
    paddingTop: 1,
    zIndex: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: screenWidth * 0.03,
    paddingBottom: 10,
  },
  locationWrap: {
    maxWidth: screenWidth * 0.25,
    marginHorizontal: screenWidth * 0.015,
    backgroundColor: COLORS.white,
    borderRadius: 5,
    padding: 7,
  },
  locationContent: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  locationContentText: {
    paddingHorizontal: 5,
    color: COLORS.text_gray,
  },
  loadMoreWrap: {
    marginBottom: 10,
  },
  loading: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  noListingsMessage: {
    fontSize: 18,
    color: COLORS.text_gray,
    marginVertical: 10,
  },
  noListingsWrap: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  resetButton: {
    borderRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.white,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  retryButton: {
    width: "30%",
    alignItems: "center",
    justifyContent: "center",
  },
  searchInput: {
    flex: 1,
  },
  selectedCat: {
    fontSize: 12,
  },
  topCatSliderWrap: {
    position: "absolute",
    top: 44,
    zIndex: 1,
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
});

export default HomeScreen;
