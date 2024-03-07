/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  BackHandler,
  ActivityIndicator,
  Linking,
  KeyboardAvoidingView,
  StatusBar,
} from "react-native";

// Vector Icons
import { FontAwesome5 } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Octicons } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";

// Custom Components & Functions
import AppSeparator from "../components/AppSeparator";
import { COLORS } from "../variables/color";
import ListingForm from "../components/ListingForm";
import { useStateValue } from "../StateProvider";
import api, { removeAuthToken, setAuthToken } from "../api/client";
import AppButton from "../components/AppButton";
import TabScreenHeader from "../components/TabScreenHeader";
import { decodeString } from "../helper/helper";
import { __ } from "../language/stringPicker";
import { routes } from "../navigation/routes";
// import { StatusBar } from "expo-status-bar";

const NewListingScreen = ({ navigation }) => {
  const [
    {
      newListingScreen,
      user,
      listing_locations,
      auth_token,
      config,
      ios,
      appSettings,
      rtl_support,
    },
    dispatch,
  ] = useStateValue();
  const [adType, setAdType] = useState();
  const [categories, setCategories] = useState({});
  const [currentCategories, setCurrentCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catLoading, setCatLoading] = useState(false);
  const [noSubCat, setNoSubCat] = useState(false);
  const [locationsData, setLocationsData] = useState([]);
  const [newListingConfig, setNewListingConfig] = useState({});
  const [osmOverlay, setOsmOverlay] = useState(true);

  const handleClear = () => {
    setAdType();
    setCurrentCategories([]);
    setNoSubCat(false);
    setNewListingConfig({});

    dispatch({
      type: "SET_LISTING_LOCATIONS",
      listing_locations: null,
    });
  };

  const handleBackButtonClick = () => {
    setLoading(true);
    navigation.goBack(null);
    dispatch({
      type: "SET_NEW_LISTING_SCREEN",
      newListingScreen: false,
    });

    handleClear();
    return true;
  };
  // initial call ( get config, location )
  useEffect(() => {
    if (!newListingScreen) return;
    if (user) {
      setAuthToken(auth_token);
      api.get("config-new-listing").then((res) => {
        if (res.ok) {
          setNewListingConfig(res.data);
          removeAuthToken();
          setLoading(false);
        } else {
          alert(res?.data?.error_message || res?.data?.error || res?.problem);
          // print error
          // TODO handle error
          removeAuthToken();
        }
      });

      api.get("locations").then((res) => {
        if (res.ok) {
          setLocationsData(res.data);
        } else {
          alert(res?.data?.error_message || res?.data?.error || res?.problem);
          //error
          // TODO handle error
        }
      });
    }

    BackHandler.addEventListener("hardwareBackPress", handleBackButtonClick);
    return () => {
      BackHandler.removeEventListener(
        "hardwareBackPress",
        handleBackButtonClick
      );
      setLoading(true);
    };
  }, [newListingScreen, user]);

  //get categories call
  useEffect(() => {
    if (!adType) return;
    setLoading(true);
    setAuthToken(auth_token);
    api
      .get("form/categories", {
        listing_type: adType.id,
      })
      .then((res) => {
        if (res.ok) {
          setCategories({ 0: res.data });
          setLoading(false);
        } else {
          alert(__("newListingScreenTexts.catagoryLoadError", appSettings.lng));
          //print error
          // TODO handle error
        }
      })
      .then(() => removeAuthToken());
  }, [adType]);

  const handleSelectedCatPress = (arg) => {
    setCurrentCategories((prevCurrentCategories) =>
      prevCurrentCategories.slice(0, arg)
    );
    const selectedData = {};
    for (let i = 0; i <= arg; i++) {
      selectedData[i] = categories[i];
    }
    setCategories(selectedData);
  };

  const catPicker = (arg) => {
    if (currentCategories.length < arg) return;
    return (
      <View key={arg}>
        {/* Selected Category */}
        {currentCategories[arg] && (
          <TouchableOpacity
            style={[
              styles.selectedCategory,
              {
                backgroundColor: arg == 0 ? COLORS.primary : COLORS.bg_primary,
              },
              rtlView,
            ]}
            onPress={() => handleSelectedCatPress(arg)}
          >
            <Text
              style={[
                styles.selectedCategoryText,
                {
                  color: arg == 0 ? COLORS.white : COLORS.primary,
                  paddingLeft: rtl_support ? 0 : 18,
                  paddingRight: rtl_support ? 18 : 0,
                },
                rtlText,
              ]}
            >
              {decodeString(currentCategories[arg].name)}
            </Text>
            <FontAwesome5
              name="times"
              size={15}
              color={arg == 0 ? COLORS.white : COLORS.primary}
            />
          </TouchableOpacity>
        )}
        {/* Category Picker Options */}

        {!currentCategories[arg] && (
          <View
            style={{
              flexDirection: rtl_support ? "row-reverse" : "row",
              flexWrap: "wrap",
            }}
          >
            {categories[arg].map((_category) => (
              <TouchableOpacity
                style={[
                  styles.categoryPickerOptions,
                  {
                    borderWidth: _category?.disabled ? 1 : 0,
                    borderColor: _category?.disabled
                      ? COLORS.red
                      : "transparent",
                    paddingVertical: _category?.disabled ? 7 : 8,
                    paddingHorizontal: _category?.disabled ? 9 : 10,
                  },
                ]}
                key={_category.term_id}
                onPress={() => handleCategorySelection(_category)}
              >
                <Text
                  style={[
                    styles.categoryPickerOptionsText,
                    {
                      color: _category?.disabled
                        ? COLORS.red
                        : COLORS.text_gray,
                    },
                    ,
                    rtlText,
                  ]}
                >
                  {decodeString(_category.name)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {/* Loading Component for Next level Picker Existance Checking */}
        {!currentCategories[arg + 1] && catLoading && (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}
      </View>
    );
  };

  const handleCategorySelection = (item) => {
    if (item?.disabled) {
      alert(__("newListingScreenTexts.categoryRestriction", appSettings.lng));
      return;
    }
    setCurrentCategories((prevCurrentCategories) => [
      ...prevCurrentCategories,
      item,
    ]);
    setCatLoading(true);
    getSubCategoryData(item.term_id);
  };

  const getSubCategoryData = (parent_id) => {
    api
      .get("categories", {
        parent_id: parent_id,
      })
      .then((res) => {
        if (res.ok) {
          if (res.data.length) {
            const nwekey = Object.keys(categories).length;
            setCategories((prevCategories) => {
              return { ...prevCategories, [nwekey]: res.data };
            });
          } else {
            setNoSubCat(true);
          }
          setCatLoading(false);
        } else {
          alert(res?.data?.error_message || res?.data?.error || res?.problem);
          //print error
          // TODO handle error
        }
      });
  };

  const getCategoryTaxonomy = () => {
    return rtl_support
      ? decodeString(
          currentCategories
            .map((item) => item.name)
            .reverse()
            .join(" < ")
        )
      : decodeString(currentCategories.map((item) => item.name).join(" > "));
  };

  const handleLocationButtonPress = () => {
    navigation.navigate(routes.selectLocationScreen, {
      data: locationsData,
      type: "newListing",
    });
  };

  const handleChangeCategoryButtonPress = () => {
    setCurrentCategories([]);
    setAdType();
    setNoSubCat(false);
  };

  const getLocationTaxonomy = () => {
    if (!listing_locations) {
      return;
    }
    return rtl_support
      ? decodeString(
          listing_locations
            .map((_location) => _location.name)
            .reverse()
            .join(" < ")
        )
      : decodeString(
          listing_locations.map((_location) => _location.name).join(" > ")
        );
  };

  const handleChangeLocationButtonPress = () => {
    dispatch({
      type: "SET_LISTING_LOCATIONS",
      listing_locations: [],
    });
  };

  const handleMembership = () => {
    navigation.navigate(routes.myMembershipScreen);
  };

  const handleGoBack = () => {
    handleBackButtonClick();
  };
  const handleGoBackonSuccess = () => {
    handleBackButtonClick();
  };

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

  const changeOsmOverlay = (bool) => {
    setOsmOverlay(bool);
  };

  return user ? (
    <KeyboardAvoidingView
      behavior={ios ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: COLORS.white }}
      keyboardVerticalOffset={ios ? 20 : -20}
    >
      <TabScreenHeader
        left={user && newListingScreen}
        onLeftClick={handleGoBack}
        style={{ elevation: 0 }}
      />
      {!user?.phone_verified && config?.verification?.post_restriction ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: COLORS.text_dark,
                paddingBottom: 20,
              }}
            >
              {__("newListingScreenTexts.unverifiedTitle", appSettings.lng)}
            </Text>
            <Text
              style={{
                fontSize: 18,
                color: COLORS.text_gray,
                textAlign: "center",
              }}
            >
              {__(
                user?.phone
                  ? "newListingScreenTexts.unverifiedAccountWithPhoneNumber"
                  : "newListingScreenTexts.unverifiedAccountWithoutPhoneNumber",
                appSettings.lng
              )}
            </Text>
          </View>
          <View style={{ paddingVertical: 20 }}>
            <AppButton
              title={__(
                "newListingScreenTexts.verifyBtnTitle",
                appSettings.lng
              )}
              style={{ paddingHorizontal: "15%" }}
              onPress={() =>
                navigation.navigate(routes.myProfileScreen, { source: "new" })
              }
            />
          </View>
        </View>
      ) : (
        <ScrollView scrollEnabled={osmOverlay}>
          <View style={styles.container}>
            <View style={styles.mainWrap}>
              {/* Title */}
              <View style={styles.titleWrap}>
                <Text style={[styles.title, rtlText]}>
                  {__("newListingScreenTexts.title", appSettings.lng)}
                </Text>
              </View>
              {/* Initial check */}
              {!newListingConfig.eligible && loading && (
                <View style={styles.typeWrap}>
                  <View style={styles.checkWrap}>
                    <Text style={[styles.typeTitle, rtlText]}>
                      {__(
                        "newListingScreenTexts.eligibilityChecking",
                        appSettings.lng
                      )}
                    </Text>
                    <View style={styles.loading}>
                      <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                  </View>
                </View>
              )}

              {/* For not eligible users */}
              {!newListingConfig.eligible && !loading && (
                <View style={styles.notEligible}>
                  <Octicons name="stop" size={50} color={COLORS.red} />
                  <Text style={[styles.remainingAdsText, rtlText]}>
                    {__(
                      "newListingScreenTexts.noRemainingAds",
                      appSettings.lng
                    )}
                  </Text>
                  <Text style={[styles.remainingAdsText, rtlText]}>
                    {__(
                      "newListingScreenTexts.purchaseMembership",
                      appSettings.lng
                    )}
                  </Text>
                  <View style={styles.buttonWrap}>
                    <AppButton
                      title={__(
                        "newListingScreenTexts.goBackButtonTitle",
                        appSettings.lng
                      )}
                      onPress={handleGoBack}
                      style={styles.button}
                    />
                    {!config?.iap_disabled && (
                      <AppButton
                        title={__(
                          "newListingScreenTexts.membershipButtonTitle",
                          appSettings.lng
                        )}
                        onPress={handleMembership}
                        style={styles.button}
                      />
                    )}
                  </View>
                </View>
              )}
              {/* For eligible users */}
              {/* Ad Type Selector */}
              {newListingConfig.eligible && (
                // Add Type selector
                <View
                  style={
                    !!currentCategories.length &&
                    noSubCat &&
                    ((!!listing_locations && !!listing_locations.length) ||
                      config.location_type === "geo")
                      ? styles.displayNone
                      : styles.typeWrap
                  }
                >
                  <View style={[styles.typeTitleWrap, rtlView]}>
                    <View
                      style={{
                        transform: [{ scaleX: -1 }],
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MaterialCommunityIcons
                        name="tag"
                        size={18}
                        color={COLORS.primary}
                      />
                    </View>

                    <Text style={[styles.typeTitle, rtlText]}>
                      {__("newListingScreenTexts.selectType", appSettings.lng)}
                    </Text>
                  </View>
                  <AppSeparator style={styles.formSeparator} />
                  <View style={styles.adType}>
                    {!newListingConfig["listing_types"].length && loading ? (
                      <View style={styles.loading}>
                        <ActivityIndicator
                          size="large"
                          color={COLORS.primary}
                        />
                      </View>
                    ) : (
                      <>
                        {adType ? (
                          <>
                            <TouchableOpacity
                              style={[styles.typePickerFieldWrap, rtlView]}
                              onPress={() => {
                                setAdType();
                                setCategories({});
                                setCurrentCategories([]);
                                setNoSubCat(false);
                              }}
                            >
                              <Text style={[styles.types, rtlText]}>
                                {adType
                                  ? decodeString(adType.name)
                                  : `-- ${__(
                                      "newListingScreenTexts.selectType",
                                      appSettings.lng
                                    )} --`}
                              </Text>
                              <FontAwesome5
                                name="chevron-down"
                                size={14}
                                color={COLORS.primary}
                              />
                            </TouchableOpacity>
                            <AppSeparator style={styles.formSeparator} />
                          </>
                        ) : (
                          <View style={styles.typePickerWrap}>
                            {newListingConfig.listing_types.map((typ) => (
                              <TouchableOpacity
                                style={styles.typePickerOptions}
                                key={typ.id}
                                onPress={() => {
                                  setAdType(typ);
                                  setCurrentCategories([]);
                                  setNoSubCat(false);
                                }}
                              >
                                <Text
                                  style={[
                                    styles.types,
                                    rtlTextA,
                                    {
                                      paddingLeft: rtl_support ? 0 : 18,
                                      paddingRight: rtl_support ? 18 : 0,
                                    },
                                  ]}
                                >
                                  {typ.name}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </>
                    )}
                  </View>
                </View>
              )}
              {/* Ad Category & Location Selector */}
              {/* Category Selector Wrap */}
              {adType && (
                <View
                  style={
                    !!currentCategories.length &&
                    noSubCat &&
                    ((!!listing_locations && !!listing_locations.length) ||
                      config.location_type === "geo")
                      ? styles.displayNone
                      : styles.categoryWrap
                  }
                >
                  <View style={[styles.categoryTitleWrap, rtlView]}>
                    <View
                      style={{
                        transform: [{ scaleX: -1 }],
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MaterialCommunityIcons
                        name="tag"
                        size={18}
                        color={COLORS.primary}
                      />
                    </View>
                    <Text style={[styles.categoryTitle, rtlText]}>
                      {__(
                        "newListingScreenTexts.selectCategory",
                        appSettings.lng
                      )}
                    </Text>
                  </View>
                  {loading && !Object.keys(categories).length ? (
                    <View style={styles.loading}>
                      <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                  ) : (
                    <View style={styles.adCategory}>
                      {Object.keys(categories).map((_cat, index) =>
                        catPicker(index)
                      )}
                    </View>
                  )}
                  {/* Location Selector Wrap */}
                  {!!currentCategories.length && noSubCat && (
                    <View
                      style={
                        !!currentCategories.length &&
                        noSubCat &&
                        ((!!listing_locations && !!listing_locations.length) ||
                          config.location_type === "geo")
                          ? styles.displayNone
                          : styles.locationWrap
                      }
                    >
                      <AppSeparator style={styles.formSeparator} />
                      {/* Location Selection Button */}
                      <View style={[styles.categoryTitleWrap, rtlView]}>
                        <View
                          style={{
                            transform: [{ scaleX: -1 }],
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <MaterialCommunityIcons
                            name="map-marker"
                            size={18}
                            color={COLORS.primary}
                          />
                        </View>
                        <Text style={[styles.categoryTitle, rtlText]}>
                          {__(
                            "newListingScreenTexts.selectLocation",
                            appSettings.lng
                          )}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.locationSelector}
                        onPress={handleLocationButtonPress}
                      >
                        <Text style={[styles.locationSelectorText, rtlText]}>
                          {__(
                            "newListingScreenTexts.selectLocation",
                            appSettings.lng
                          )}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
              {/* Category & Location Change Button Wrap */}
              <View
                style={
                  !!currentCategories.length &&
                  noSubCat &&
                  ((!!listing_locations && !!listing_locations.length) ||
                    config.location_type === "geo")
                    ? styles.changeCategoryWrap
                    : styles.displayNone
                }
              >
                {/* Category Change Button Wrap */}
                <View style={[styles.categoryChangeWrap, rtlView]}>
                  <View
                    style={{
                      flex: 1,
                      marginLeft: rtl_support ? 5 : 0,
                      alignItems: rtl_support ? "flex-end" : "flex-start",
                    }}
                  >
                    <Text
                      style={[styles.categoryRoute, rtlText]}
                      numberOfLines={1}
                    >
                      {getCategoryTaxonomy()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.routeChangeIconWrap}
                    onPress={handleChangeCategoryButtonPress}
                  >
                    <MaterialIcons
                      name="mode-edit"
                      size={14}
                      color={COLORS.white}
                    />
                  </TouchableOpacity>
                </View>

                {/* Location Change Button Wrap */}
                {config.location_type === "local" && (
                  <View
                    style={[
                      styles.categoryChangeWrap,
                      rtlView,
                      { backgroundColor: COLORS.bg_primary },
                    ]}
                  >
                    <View
                      style={{
                        flex: 1,
                        marginLeft: rtl_support ? 5 : 0,
                        alignItems: rtl_support ? "flex-end" : "flex-start",
                      }}
                    >
                      <Text style={[styles.categoryRoute, rtlText]}>
                        {getLocationTaxonomy()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.routeChangeIconWrap}
                      onPress={handleChangeLocationButtonPress}
                    >
                      <MaterialIcons
                        name="mode-edit"
                        size={14}
                        color={COLORS.white}
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              {adType &&
                !!currentCategories.length &&
                noSubCat &&
                ((!!listing_locations && !!listing_locations.length) ||
                  config.location_type === "geo") && (
                  <ListingForm
                    catId={
                      currentCategories[currentCategories.length - 1].term_id
                    }
                    type={adType}
                    goBack={handleGoBackonSuccess}
                    osmOverlay={osmOverlay}
                    changeOsmOverlay={changeOsmOverlay}
                  />
                )}
            </View>
          </View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  ) : (
    <>
      <TabScreenHeader sideBar />
      <View style={styles.noUserViewWrap}>
        <View style={styles.noUserTitleWrap}>
          <Text style={[styles.noUserTitle, rtlTextA]}>
            {__("newListingScreenTexts.notLoggedIn", appSettings.lng)}
          </Text>
          <Text style={[styles.noUserMessage, rtlTextA]}>
            {__("newListingScreenTexts.loginOrSignUp", appSettings.lng)}
          </Text>
          <View style={styles.authButtonWrap}>
            <AppButton
              style={styles.authButton}
              title={__(
                "newListingScreenTexts.loginOrSignUpButtonTitle",
                appSettings.lng
              )}
              onPress={() => navigation.navigate(routes.loginScreen)}
              textStyle={rtlText}
            />
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  adCategory: {
    marginBottom: 5,
  },
  adType: {},
  authButton: {
    borderRadius: 3,
    width: "100%",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  authButtonWrap: {
    marginVertical: 20,
    width: "100%",
  },
  button: {
    width: "45%",
  },
  buttonWrap: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: "3%",
    marginTop: "5%",
  },
  categoryChangeWrap: {
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    paddingHorizontal: "3%",
  },
  categoryPickerFieldText: {
    textTransform: "capitalize",
  },
  categoryPickerFieldWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 3,
    paddingVertical: 5,
    paddingHorizontal: "3%",
    marginVertical: 10,
  },
  categoryPickerOptions: {
    backgroundColor: COLORS.white,
    padding: 8,
    marginVertical: 5,
    marginHorizontal: 3,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: COLORS.bg_dark,
  },
  categoryPickerOptionsText: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.text_gray,
  },
  categoryPickerWrap: {},
  categoryTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.text_dark,
    paddingHorizontal: 10,
  },
  categoryRoute: {
    fontSize: 15,
    color: COLORS.text_gray,
    fontWeight: "bold",
  },
  categoryTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },
  categoryWrap: {
    paddingHorizontal: "3%",
  },
  changeCategory: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 5,
    marginTop: 10,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  changecategoryText: {
    color: COLORS.white,
    paddingRight: 5,
  },
  changeCategoryWrap: {
    marginBottom: 10,
  },
  checkWrap: {
    alignItems: "center",
    marginVertical: "10%",
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  displayNone: {
    display: "none",
  },
  flashMessage: {
    position: "absolute",
    backgroundColor: "green",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    bottom: 0,
    zIndex: 2,
  },
  formSeparator: {
    width: "100%",
  },
  freeAdText: {
    backgroundColor: COLORS.light_green,
    width: "80%",
    textAlign: "center",
    color: COLORS.dark_green,
    borderRadius: 3,
    paddingVertical: 8,
    fontSize: 16,
  },
  freeAdWrap: {
    paddingHorizontal: "3%",
    alignItems: "center",
    marginVertical: 15,
  },
  locationSelector: {
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  locationSelectorText: {
    color: COLORS.white,
    paddingRight: 5,
    fontWeight: "bold",
    fontSize: 13,
  },
  internalSeparator: {
    marginVertical: 10,
    width: "100%",
  },
  locationWrap: {
    marginVertical: 10,
  },
  mainWrap: {},
  mandatory: {
    color: COLORS.red,
    fontSize: 16,
  },
  remainingAdsText: {
    fontSize: 16,
    marginVertical: "2%",
    paddingHorizontal: "3%",
    textAlign: "center",
  },
  routeArrow: {
    color: COLORS.text_gray,
  },
  routeChangeIconWrap: {
    padding: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  separator: {
    width: "100%",
    backgroundColor: COLORS.bg_dark,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text_gray,
    paddingVertical: 10,
  },
  titleWrap: {
    paddingHorizontal: "3%",
    alignItems: "center",
  },

  typePickerFieldWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: "3%",
    marginVertical: 15,
  },
  typePickerOptions: {
    marginVertical: 5,
  },
  types: {
    fontWeight: "bold",
    color: COLORS.text_gray,
  },
  typePickerWrap: {
    paddingVertical: 10,
  },
  typeTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.text_dark,
    paddingHorizontal: 10,
  },
  typeTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 15,
  },
  typeWrap: {
    paddingHorizontal: "3%",
  },
  loading: {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.8,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
    flex: 1,
  },
  notEligible: {
    alignItems: "center",
    marginVertical: "10%",
  },
  noUserMessage: {
    fontSize: 16,
  },
  noUserTitle: {
    fontSize: 20,
  },
  noUserTitleWrap: {
    alignItems: "center",
  },
  noUserViewWrap: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  selectedCategory: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    padding: 8,
    borderRadius: 3,
    marginVertical: 5,
  },
  selectedCategoryText: {
    fontSize: 13,
    fontWeight: "bold",
  },
});

export default NewListingScreen;
