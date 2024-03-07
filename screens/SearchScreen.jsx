import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  Dimensions,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";
import Slider from "@react-native-community/slider";
import Geocoder from "react-native-geocoding";
import Constants from "expo-constants";
import * as Location from "expo-location";
import {
  FontAwesome5,
  FontAwesome,
  MaterialIcons,
  Fontisto,
  Entypo,
} from "@expo/vector-icons";
import { GooglePlacesAutocomplete } from "../components/map/GooglePlacesAutocomplete";
import { COLORS } from "../variables/color";
import TabScreenHeader from "../components/TabScreenHeader";
import api, { removeAuthToken, setAuthToken } from "../api/client";
import { useStateValue } from "../StateProvider";
import { getCurrencySymbol, decodeString } from "../helper/helper";
import DynamicFilterListPicker from "../components/DynamicFilterListPicker";
import DynamicCheckbox from "../components/DynamicFilterCheckbox";
import ListingCard from "../components/ListingCard";
import ListingCardList from "../components/ListingCardList";
import { paginationData } from "../app/pagination/paginationData";
import CategoryIcon from "../components/CategoryIcon";
import CategoryImage from "../components/CategoryImage";
import { __ } from "../language/stringPicker";
import { admobConfig } from "../app/services/adMobConfig";
import { routes } from "../navigation/routes";
import osmApi, { reverseParams } from "../api/osmClient";

const initialSearchData = {
  ...paginationData.search,
  categories: [],
  onScroll: false,
};

const { width: windowWidth, height: windowHeight } = Dimensions.get("window");

const SearchScreen = ({ navigation }) => {
  const [
    {
      search_locations,
      config,
      ios,
      appSettings,
      rtl_support,
      user,
      auth_token,
    },
    dispatch,
  ] = useStateValue();
  const [allCategoriesData, setAllCategoriesData] = useState({});
  const [locationsData, setLocationsData] = useState([]);
  const [pagination, setPagination] = useState({});
  const [searchData, setSearchData] = useState({ ...initialSearchData });
  const [radiusSearchData, setRadiusSearchData] = useState({
    distance: config?.radius_search?.default_distance ?? 10,
  });
  const [radiusSearchAddress, setRadiusSearchAddress] = useState("");
  const [currentCategory, setCurrentCategory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hideTopBar, setHideTopbBar] = useState(false);
  const [initial, setInitial] = useState(true);
  const [bottomLevel, setBottomLevel] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);
  const [applyFilter, setApplyFilter] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filterData, setFilterData] = useState({});
  const [filterSearchData, setFilterSearchData] = useState({});
  const [filterCustomData, setFilterCustomData] = useState({});
  const [filterPriceRange, setFilterPriceRange] = useState([]);
  const [filterLoading, setFilterLoading] = useState(true);
  const [listingsData, setListingsData] = useState([]);
  const [noListingFound, setNoListingFound] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [validateCfDependency, setValidateCfDependency] = useState([]);

  const isNumeric = (n) => {
    return n !== "" && !isNaN(parseFloat(n)) && isFinite(n);
  };

  const isEqualToNumber = (v1, v2) => {
    return parseFloat(v1) === parseFloat(v2);
  };

  const isEqualTo = (v1, v2) => {
    return parseString(v1).toLowerCase() === parseString(v2).toLowerCase();
  };

  const containsString = (haystack, needle) => {
    return parseString(haystack).indexOf(parseString(needle)) > -1;
  };
  const matchesPattern = (v1, pattern) => {
    const regexp = new RegExp(parseString(pattern), "gi");
    return parseString(v1).match(regexp);
  };

  const parseString = (str) => {
    return str ? "" + str : "";
  };

  const cfValidated = (rule, cfs) => {
    let isValid = 0;
    const field_id = rule.field;

    const operator = rule.operator;
    const independFieldArray = cfs ? cfs.filter((_) => _.id == field_id) : [];
    let independField = independFieldArray.length ? independFieldArray[0] : "";

    if (
      independField &&
      ["radio", "select", "checkbox"].includes(independField.type)
    ) {
      const independentFieldValue =
        filterCustomData["_field_" + field_id] || "";
      // Check if filed is exist at custom field object
      if (operator === "==empty") {
        // hasNoValue
        isValid = Array.isArray(independentFieldValue)
          ? !independentFieldValue.length
          : !independentFieldValue;
      } else if (operator === "!=empty") {
        // hasValue  -- ANY value
        isValid = Array.isArray(independentFieldValue)
          ? !!independentFieldValue.length
          : !!independentFieldValue;
      } else if (operator === "==") {
        // equalTo
        if (isNumeric(rule.value)) {
          return isEqualToNumber(rule.value, independentFieldValue);
        } else {
          return isEqualTo(rule.value, independentFieldValue);
        }
      } else if (operator === "!=") {
        // notEqualTo
        if (isNumeric(rule.value)) {
          return !isEqualToNumber(rule.value, independentFieldValue);
        } else {
          return !isEqualTo(rule.value, independentFieldValue);
        }
      } else if (operator === "==pattern") {
        // patternMatch
        return matchesPattern(independentFieldValue, rule.value);
      } else if (operator === "==contains") {
        // contains
        return containsString(independentFieldValue, rule.value);
      }
    }
    isValid = isValid === 0 || isValid === 1 ? !!isValid : isValid;
    return isValid;
  };

  const cfDependencyValidateor = (field, cfs) => {
    if (!field.dependency) {
      return true;
    }
    const con = [];
    field.dependency.map((rules) => {
      const conInner = [];
      rules.map((rule) => {
        conInner.push(cfValidated(rule, cfs));
      });
      con.push(conInner);
    });
    if (con.map((item) => !item.includes(false)).includes(true)) {
      return true;
    }
    return false;
  };

  const initialCFDependencyCheck = (cfs) => {
    const tempCfFieldIds = [];
    if (cfs.length) {
      cfs.map((_cf) => {
        if (cfDependencyValidateor(_cf, cfs)) {
          tempCfFieldIds.push(_cf.id);
        }
      });
    }

    setValidateCfDependency(tempCfFieldIds);
  };

  useEffect(() => {
    if (!filterVisible || !filterData || filterLoading) return;
    initialCFDependencyCheck(filterData.custom_fields);
  }, [filterCustomData]);

  // initial category load
  useEffect(() => {
    if (!initial) return;
    handleLoadCategories();
  }, [initial]);

  // filter data load
  useEffect(() => {
    if (!filterVisible) return;
    handleFilterLoad();
  }, [filterVisible]);

  /**
   * Call when location or category changed
   */
  useEffect(() => {
    if (!bottomLevel) return;
    handleListingDataLoad(true);
  }, [bottomLevel, search_locations]);

  /**
   * Clicked at Apply filter button
   */
  useEffect(() => {
    if (!applyFilter) return;
    handleListingDataLoad();
  }, [applyFilter]);

  /**
   * Call onscroll pagination
   */
  useEffect(() => {
    if (!searchData.onScroll) return;
    handleListingDataLoad(false, true);
  }, [searchData.onScroll]);

  const handleClearFilterOnChnageCatLoc = () => {
    setFilterSearchData({});
    setFilterCustomData({});
    setFilterPriceRange([]);
    setIsFiltered(false);
  };

  const handleFilterLoad = () => {
    if (!currentCategory.length) {
      return;
    }
    const cat_id = currentCategory[currentCategory.length - 1];
    api
      .get("search-fields", { category_id: cat_id })
      .then((res) => {
        if (res.ok) {
          setFilterData(res.data);
          if (res.data.custom_fields.length) {
            initialCFDependencyCheck(res.data.custom_fields);
          }
        } else {
          // TODO Error handling
        }
      })
      .then(() => setFilterLoading(false));
  };

  const handleNextPageLoading = () => {
    if (pagination && pagination.total_pages > pagination.current_page) {
      setSearchData((prevSearchData) => {
        return {
          ...prevSearchData,
          page: prevSearchData.page + 1,
          onScroll: true,
        };
      });
    }
  };

  /**
   *
   * @param {booll} isLocCatChanged
   * @param {booll} onScroll
   */
  const handleListingDataLoad = (isLocCatChanged, onScroll) => {
    if (onScroll) {
    } else {
      setLoading(true);
    }
    if (noListingFound) {
      setNoListingFound(false);
    }
    let newSearchData = {
      ...searchData,
      locations: search_locations.length
        ? search_locations
            .map((loc) => loc.term_id)
            .splice(search_locations.length - 1)
        : [],
    };
    if (isLocCatChanged) {
      if (isFiltered) {
        handleClearFilterOnChnageCatLoc();
      }
      newSearchData = {
        ...initialSearchData,
        locations: newSearchData.locations,
        categories: newSearchData.categories,
      };
    }
    if (user) {
      setAuthToken(auth_token);
    }
    api.get("listings", newSearchData).then((res) => {
      if (res.ok) {
        if (res.data.data.length) {
          if (onScroll) {
            if (admobConfig?.admobEnabled && admobConfig?.searchScreen) {
              setListingsData((prevListingsData) => [
                ...prevListingsData,
                { listAd: true },
                { listAd: true, dummy: true },
                ...res.data.data,
              ]);

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
            setPagination(res.data.pagination ? res.data.pagination : {});
          } else {
            setListingsData(res.data.data);
            setPagination(res.data.pagination ? res.data.pagination : {});
            setLoading(false);
          }
        } else {
          setListingsData([]);
          setNoListingFound(true);
          setPagination(res.data.pagination ? res.data.pagination : {});
          setLoading(false);
        }
        if (user) {
          removeAuthToken();
        }
      } else {
        // print error
        // TODO Error handling
        if (user) {
          removeAuthToken();
        }
        setLoading(false);
      }
      setApplyFilter(false);
    });
  };

  const handleLoadCategories = () => {
    api.get("categories").then((res) => {
      if (res.ok) {
        setAllCategoriesData({ 0: res.data });

        handleLoadLocations();
        setLoading(false);
      } else {
        // print error
        // TODO Error handling
        setLoading(false);
      }
    });
  };
  const handleSelectCategory = (item) => {
    setLoading(true);
    setHideTopbBar(true);
    setCurrentCategory((prevCurrentCategory) => [
      ...prevCurrentCategory,
      item.term_id,
    ]);
    setSearchData((prevSearchData) => {
      return {
        ...prevSearchData,
        categories: [item.term_id],
      };
    });
    getSubCategoryData(item);
  };
  const getSubCategoryData = (item) => {
    api.get("categories", { parent_id: item.term_id }).then((res) => {
      if (res.ok) {
        if (res.data.length) {
          setAllCategoriesData((prevAllCategoriesData) => {
            const index = Object.keys(prevAllCategoriesData).length;
            const newData = { ...prevAllCategoriesData };
            newData[index] = [...res.data];
            return newData;
          });
          setLoading(false);
        } else {
          setBottomLevel(true);
          setHideTopbBar(false);
          setLoading(false);
        }
      } else {
        // print error
        // TODO Error handling
        setLoading(false);
      }
    });
  };
  const handleSelectSubCategory = (item) => {
    setLoading(true);
    setCurrentCategory((prevCurrentCategory) => [
      ...prevCurrentCategory,
      item.term_id,
    ]);
    setSearchData((prevSearchData) => {
      return {
        ...prevSearchData,
        categories: [item.term_id],
      };
    });
    getSubCategoryData(item);
  };
  const handleSelectedCatagoryTouch = (cat, index) => {
    setCurrentCategory((prevCurrentCategory) =>
      prevCurrentCategory.slice(0, index)
    );
    const selectedData = {};
    for (let i = 0; i <= index; i++) {
      selectedData[i] = allCategoriesData[i];
    }
    setAllCategoriesData(selectedData);
  };
  const getTexonomy = (arg) => {
    if (arg === "category") {
      return decodeString(
        allCategoriesData[currentCategory.length - 1].filter(
          (data) => data.term_id === currentCategory[currentCategory.length - 1]
        )[0].name
      );
    } else {
      return decodeString(search_locations[search_locations.length - 1].name);
    }
  };
  const handleLoadLocations = () => {
    api.get("locations").then((res) => {
      if (res.ok) {
        setLocationsData(res.data);

        setInitial(false);
        setLoading(false);
      } else {
        // print error
        // TODO Error handling
      }
    });
  };

  const handleClear = () => {
    setFilterLoading(true);
    setFilterSearchData({});
    setFilterCustomData({});
    setFilterPriceRange([]);
    setRadiusSearchAddress("");
    setRadiusSearchData({
      distance: config?.radius_search?.default_distance ?? 10,
    });
    setLocationLoading(false);
    setTimeout(() => {
      setFilterLoading(false);
    }, 10);
  };

  const handleClose = () => {
    setFilterVisible(!filterVisible); //TODO : need to check filter data if dirty then need to escape to reset filter data
    setFilterSearchData({});
    setFilterCustomData({});
    setFilterPriceRange([]);
    setRadiusSearchAddress("");
    setRadiusSearchData({
      distance: config?.radius_search?.default_distance ?? 10,
    });
    setLocationLoading(false);
  };

  const handleApplyFilter = () => {
    setFilterVisible(!filterVisible);
    setLoading(true);
    if (noListingFound) {
      setNoListingFound(false);
    }

    const tempFilterCustomData = { ...filterCustomData };
    Object.keys(filterCustomData).map((_key) => {
      if (
        !validateCfDependency.includes(
          parseInt(_key.replace("_field_", ""), 10)
        )
      ) {
        delete tempFilterCustomData[_key];
      }
    });

    setSearchData((prevSearchData) => {
      return {
        ...prevSearchData,
        ...filterSearchData,
        ["price_range"]: filterPriceRange,
        ["custom_fields"]: tempFilterCustomData,
        page: 1,
        ["radius_search"]: radiusSearchData,
      };
    });
    setApplyFilter(true);
    setIsFiltered(true);
  };

  const keyExtractor = useCallback((item, index) => `${index}`, []);

  const Category = ({ index, onPress, item }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          justifyContent: "flex-start",
          alignItems: "center",
          width: (windowWidth * 0.88) / 3,
          minHeight: windowHeight / 7,
          paddingVertical: 10,
          paddingHorizontal: 5,
          backgroundColor: COLORS.bg_primary,
          borderRadius: 6,
          marginHorizontal: windowWidth * 0.015,
          marginBottom: windowWidth * 0.03,
        },
        // index % 4 !== 0 && {
        //   borderLeftWidth: 1,
        //   borderLeftColor: COLORS.bg_dark,
        // },
        // categoryData.length - 1 === index && {
        //   borderRightWidth: 1,
        // },
      ]}
    >
      <View
        style={[
          {
            height: (windowWidth * 0.95) / 6,
            width: (windowWidth * 0.95) / 6,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: currentCategory.includes(item.term_id)
              ? COLORS.primary
              : COLORS.white,
            borderRadius: (windowWidth * 0.95) / 12,
          },
          ios
            ? {
                shadowColor: "#000",
                shadowOffset: { width: -2, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 3,
              }
            : { elevation: 2 },
        ]}
      >
        {item?.icon?.url ? (
          <CategoryImage size={windowWidth / 15} uri={item.icon.url} />
        ) : (
          <CategoryIcon
            iconName={item.icon.class}
            iconSize={windowWidth / 15}
            iconColor={
              currentCategory.includes(item.term_id)
                ? COLORS.white
                : COLORS.primary
            }
          />
        )}
      </View>

      <Text
        numberOfLines={1}
        style={{ textAlign: "center", marginTop: 12, fontWeight: "bold" }}
      >
        {decodeString(item.name)}
      </Text>
      <Text
        numberOfLines={1}
        style={{
          textAlign: "center",
          marginTop: 8,
          marginBottom: 5,
          fontSize: 13,
          color: COLORS.text_gray,
        }}
      >
        {decodeString(item.count) +
          " " +
          __("selectCategoryScreenTexts.listings", appSettings.lng)}
      </Text>
    </TouchableOpacity>
  );
  const renderCategory = useCallback(
    ({ item, index }) => (
      <Category
        index={index}
        onPress={() => handleSelectCategory(item)}
        item={item}
      />
    ),
    []
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
    [noListingFound, config]
  );

  const Picker = () => (
    <View style={styles.pickerWrap}>
      {allCategoriesData[Object.keys(allCategoriesData).length - 1].map(
        (data) => (
          <TouchableOpacity
            key={data.term_id}
            style={[
              styles.subCategoryWrap,
              { alignItems: rtl_support ? "flex-end" : "flex-start" },
            ]}
            onPress={() => handleSelectSubCategory(data)}
          >
            <Text style={[styles.catPickerOptions, rtlText]} numberOfLines={1}>
              {decodeString(data.name)}
            </Text>
          </TouchableOpacity>
        )
      )}
    </View>
  );

  const renderListingCardItem = useCallback(
    ({ item }) => (
      <ListingCard onPress={() => handleSingleListingPress(item)} item={item} />
    ),
    [noListingFound, config]
  );

  const handleSingleListingPress = (item) => {
    navigation.navigate(routes.listingDetailScreen, {
      listingId: item.listing_id,
    });
  };

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

  const emptyComponent = () => {
    return (
      <View style={styles.noListingsWrap}>
        <Fontisto name="frowning" size={100} color={COLORS.primary_soft} />
        <Text style={styles.noListingsMessage}>
          {__("searchScreenTexts.noListingFoundMessage", appSettings.lng)}
        </Text>
      </View>
    );
  };

  const handleFilterOpen = () => {
    setFilterVisible(true);
  };

  const handleResetAll = () => {
    setListingsData([]);
    // clear location
    dispatch({
      type: "SET_SEARCH_LOCATIONS",
      search_locations: [],
    });
    //clear current category
    setCurrentCategory([]);
    // remove all categories data to certain level
    setAllCategoriesData((prevAllCategoriesData) => {
      return {
        0: prevAllCategoriesData[0],
      };
    });
    // bottom level
    setBottomLevel(false);
    // pagination
    setPagination({});
    // filters
    setFilterSearchData({});
    setFilterCustomData({});
    setFilterPriceRange([]);
    setRadiusSearchData({
      distance: config?.radius_search?.default_distance ?? 10,
    });
    setRadiusSearchAddress("");
    setIsFiltered(false);
    setApplyFilter(false);
    //searchData
    setSearchData({ ...initialSearchData });
  };

  const getLocationPermissionAsync = async () => {
    setLocationLoading(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      alert(__("searchScreenTexts.locationPermissionAlert", appSettings.lng));
      setLocationLoading(false);
      return;
    }
    let location = await Location.getCurrentPositionAsync({});
    setRadiusSearchData((prevRadiusSearchData) => {
      return {
        ...prevRadiusSearchData,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    });
    if (config?.map?.type === "google") {
      Geocoder.init(config.map.api_key);
      Geocoder.from(location.coords.latitude, location.coords.longitude)
        .then((json) => {
          var addressComponent = json.results[0].formatted_address;
          if (addressComponent) {
            setRadiusSearchAddress(addressComponent);
          }
        })
        .catch((error) => {
          console.warn(error);
          setLocationLoading(false);
          // TODO  display error
        })
        .then(() => {
          setLocationLoading(false);
        });
    } else {
      const params = reverseParams({
        lat: location.coords.latitude,
        lon: location.coords.longitude,
      });
      osmApi
        .get("reverse", params)
        .then((res) => {
          if (res.ok) {
            setRadiusSearchAddress(res.data?.display_name);
          }
        })
        .then(() => {
          setLocationLoading(false);
        });
    }
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

  return (
    <View style={styles.container}>
      <TabScreenHeader
        style={{ elevation: 0 }}
        right={bottomLevel}
        rightIcon="refresh"
        onRightClick={handleResetAll}
        sideBar
      />
      {/* Loading Indicator */}
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.text, rtlText]}>
            {bottomLevel
              ? __("searchScreenTexts.loadingListingMessage", appSettings.lng)
              : __(" searchScreenTexts.loadingDataMessage", appSettings.lng)}
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Topbar */}
          {((!hideTopBar && config.location_type === "local") ||
            (!hideTopBar && config.location_type === "geo" && bottomLevel)) && (
            <View style={styles.listingTop}>
              <View style={styles.combinedContainer}>
                {config.location_type === "local" && (
                  <TouchableOpacity
                    style={[styles.flex2, rtlView]}
                    onPress={() => {
                      navigation.navigate(routes.selectLocationScreen, {
                        data: locationsData,
                        type: "search",
                      });
                      if (noListingFound) {
                        setNoListingFound(false);
                      }
                    }}
                  >
                    <FontAwesome5
                      name="map-marker-alt"
                      size={15}
                      color={COLORS.primary}
                    />
                    <Text
                      style={[
                        styles.combinedTexonomy,
                        {
                          marginLeft: rtl_support ? 0 : 5,
                          marginRight: rtl_support ? 5 : 0,
                        },
                        rtlText,
                      ]}
                      numberOfLines={1}
                    >
                      {!!search_locations && !!search_locations.length
                        ? getTexonomy("location")
                        : __("searchScreenTexts.location", appSettings.lng)}
                    </Text>
                  </TouchableOpacity>
                )}
                {!!currentCategory.length && (
                  <>
                    <View style={styles.separetor} />
                    <TouchableOpacity
                      style={[
                        config.location_type === "local"
                          ? styles.flex2
                          : styles.flex5,
                        rtlView,
                      ]}
                      onPress={() => {
                        setCurrentCategory([]);
                        setAllCategoriesData((prevAllCategoriesData) => {
                          return {
                            0: prevAllCategoriesData[0],
                          };
                        });
                        setBottomLevel(false);
                      }}
                    >
                      <FontAwesome
                        name="tags"
                        size={15}
                        color={COLORS.primary}
                      />
                      <Text
                        style={[
                          styles.combinedTexonomy,
                          {
                            marginLeft: rtl_support ? 0 : 5,
                            marginRight: rtl_support ? 5 : 0,
                          },
                          rtlText,
                        ]}
                        numberOfLines={1}
                      >
                        {currentCategory.length
                          ? getTexonomy("category")
                          : __("searchScreenTexts.category", appSettings.lng)}
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.separetor} />
                  </>
                )}
                {bottomLevel && (
                  <TouchableOpacity
                    style={styles.flex1}
                    onPress={handleFilterOpen}
                  >
                    <FontAwesome
                      name="sliders"
                      size={24}
                      color={COLORS.primary}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          {/* Main category flatlist */}
          {!currentCategory.length && (
            <View style={{ flex: 1 }}>
              <View
                style={{
                  backgroundColor: COLORS.white,
                  paddingHorizontal: "3%",
                  flexDirection: rtl_support ? "row-reverse" : "row",
                  alignItems: "center",
                  height: 37,
                }}
              >
                <Text
                  style={[
                    {
                      fontSize: 12,
                      fontWeight: "bold",
                    },
                    rtlText,
                  ]}
                >
                  {__("searchScreenTexts.allCategories", appSettings.lng)}
                </Text>
              </View>

              <View
                style={
                  {
                    // flex: 1,
                    // height:
                    //   (!hideTopBar && config.location_type === "local") ||
                    //   (!hideTopBar &&
                    //     config.location_type === "geo" &&
                    //     bottomLevel)
                    //     ? windowHeight -
                    //       Constants.statusBarHeight -
                    //       50 -
                    //       40 -
                    //       37 -
                    //       50
                    //     : windowHeight - Constants.statusBarHeight - 50 - 37 - 50,
                  }
                }
              >
                <FlatList
                  data={allCategoriesData[0]}
                  renderItem={renderCategory}
                  keyExtractor={keyExtractor}
                  numColumns={3}
                  // ItemSeparatorComponent={({ highlighted }) => (
                  //   <View style={styles.itemSeparator} />
                  // )}
                  contentContainerStyle={{
                    // borderTopWidth: 1,
                    // borderBottomWidth: 1,
                    // borderColor: COLORS.bg_dark,
                    // backgroundColor: COLORS.bg_dark,
                    paddingHorizontal: windowWidth * 0.015,
                  }}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            </View>
          )}
          {/* Listing flatlist */}
          {!!currentCategory.length && bottomLevel && !!listingsData.length && (
            <View
              style={[
                styles.ListingsList,
                {
                  height: windowHeight - 50,

                  paddingHorizontal: windowWidth * 0.015,
                },
              ]}
            >
              <FlatList
                key={appSettings?.listView ? "list" : "grid"}
                data={listingsData}
                renderItem={
                  appSettings?.listView
                    ? renderFeaturedItemList
                    : renderListingCardItem
                }
                numColumns={appSettings?.listView ? 1 : 2}
                maxToRenderPerBatch={appSettings?.listView ? 15 : 8}
                windowSize={appSettings?.listView ? 41 : 61}
                keyExtractor={keyExtractor}
                horizontal={false}
                // numColumns={2}
                showsVerticalScrollIndicator={false}
                onEndReached={handleNextPageLoading}
                onEndReachedThreshold={1}
                ListFooterComponent={featuredListFooter}
                contentContainerStyle={{
                  paddingBottom: 110,
                  paddingTop: windowWidth * 0.03,
                }}
              />
            </View>
          )}
          {/* No Listing Found Text */}
          {bottomLevel && !listingsData.length && noListingFound && (
            <View style={styles.noListingsWrap}>
              <Fontisto
                name="frowning"
                size={100}
                color={COLORS.primary_soft}
              />
              <Text style={[styles.noListingsMessage, rtlText]}>
                {__("searchScreenTexts.noListingFoundMessage", appSettings.lng)}
              </Text>
            </View>
          )}
          {/* Sub category picker */}
          {!!currentCategory?.lenght && (
            <View style={styles.catPickerWrap}>
              <ScrollView>
                {!loading &&
                  Object.keys(allCategoriesData).length > 1 &&
                  !bottomLevel && (
                    <>
                      {!!currentCategory.length &&
                        currentCategory.map((cat, index) => (
                          <TouchableOpacity
                            key={cat}
                            style={[styles.selected, rtlView]}
                            onPress={() =>
                              handleSelectedCatagoryTouch(cat, index)
                            }
                          >
                            <Text style={[styles.selectedText, rtlText]}>
                              {decodeString(
                                allCategoriesData[index].find(
                                  (i) => i.term_id === cat
                                ).name
                              )}
                            </Text>
                            <Entypo
                              name="cross"
                              size={20}
                              color={COLORS.primary}
                            />
                          </TouchableOpacity>
                        ))}
                      <Picker />
                    </>
                  )}
              </ScrollView>
            </View>
          )}
        </View>
      )}
      {/* Filter Section */}
      <Modal animationType="slide" transparent={true} visible={filterVisible}>
        <View
          style={[
            styles.filterWrap,
            {
              paddingTop: 10,
              backgroundColor: COLORS.white,
              marginTop: "40%",
              elevation: 10,
              borderTopRightRadius: 20,
              borderTopLeftRadius: 20,
              shadowColor: COLORS.black,
              shadowOpacity: 0.5,
              shadowRadius: 10,
              shadowOffset: {
                width: 5,
                height: 10,
              },
            },
          ]}
        >
          <View style={[styles.filterTopWrap, rtlView]}>
            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={styles.filterTitle}>
                {__("searchScreenTexts.filterTitle", appSettings.lng)}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose}>
              <FontAwesome5 name="times" size={22} color={COLORS.text_dark} />
            </TouchableOpacity>
          </View>
          {/* Filter Loading Component */}
          {filterLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={[styles.text, rtlText]}>
                {__("searchScreenTexts.loadingFiltersMessage", appSettings.lng)}
              </Text>
            </View>
          ) : (
            <View style={styles.filterMainContentWrap}>
              <ScrollView contentContainerStyle={styles.filterContentWrap}>
                {(!!filterData?.order_by || !!filterData?.listing_type) && (
                  <View style={{ paddingBottom: 15 }}>
                    <View
                      style={[styles.commonFiltersWrap, styles.filtersWrap]}
                    >
                      {!!filterData.order_by && (
                        <View style={styles.filterField}>
                          <Text style={[styles.filterLabel, rtlTextA]}>
                            {__(
                              "searchScreenTexts.filterLabels.sortBy",
                              appSettings.lng
                            )}
                          </Text>
                          <DynamicFilterListPicker
                            onselect={(item) => {
                              setFilterSearchData((prevFilterSearchData) => {
                                return {
                                  ...prevFilterSearchData,
                                  ["order_by"]: item.id,
                                };
                              });
                            }}
                            selected={
                              filterSearchData.order_by
                                ? filterData.order_by.filter(
                                    (_data) =>
                                      _data.id === filterSearchData.order_by
                                  )[0].name
                                : null
                            }
                            data={filterData.order_by}
                          />
                        </View>
                      )}
                    </View>
                    <View
                      style={[styles.commonFiltersWrap, styles.filtersWrap]}
                    >
                      {!!filterData.listing_type && (
                        <View style={styles.filterField}>
                          <Text style={[styles.filterLabel, rtlTextA]}>
                            {__(
                              "searchScreenTexts.filterLabels.listingType",
                              appSettings.lng
                            )}
                          </Text>

                          <DynamicFilterListPicker
                            onselect={(item) => {
                              setFilterSearchData((prevFilterSearchData) => {
                                return {
                                  ...prevFilterSearchData,
                                  ["listing_type"]: item.id,
                                };
                              });
                            }}
                            selected={
                              filterSearchData.listing_type
                                ? filterData.listing_type.filter(
                                    (_data) =>
                                      _data.id === filterSearchData.listing_type
                                  )[0].name
                                : null
                            }
                            data={filterData.listing_type}
                          />
                        </View>
                      )}
                    </View>
                  </View>
                )}
                {config?.map && (
                  <View style={[styles.filtersWrap, { paddingBottom: 15 }]}>
                    <View style={styles.filterField}>
                      <Text style={[styles.filterLabel, rtlTextA]}>
                        {__(
                          "searchScreenTexts.radiusSearchTitle",
                          appSettings.lng
                        )}
                      </Text>
                      <View style={styles.radiusSearchContent}>
                        <View style={styles.radiusSearchLocationPickerWrap}>
                          <GooglePlacesAutocomplete
                            type={config.map?.type || "osm"}
                            placeholder={
                              radiusSearchAddress
                                ? radiusSearchAddress
                                : __(
                                    "searchScreenTexts.radiusSearchCenterPlaceholder",
                                    appSettings.lng
                                  )
                            }
                            textInputProps={{
                              placeholderTextColor: radiusSearchAddress
                                ? COLORS.text_dark
                                : "#b6b6b6",
                            }}
                            onPress={(data, details = null, inputRef) => {
                              if (data.description) {
                                setRadiusSearchAddress(data.description);
                              }
                              let latLng = null;
                              if (
                                "google" === config.map?.type &&
                                details?.geometry?.location
                              ) {
                                latLng = {
                                  lat: details.geometry.location.lat,
                                  lng: details.geometry.location.lng,
                                };
                              } else if (data?.details?.geometry?.location) {
                                latLng = {
                                  lat: data.details.geometry.location.lat,
                                  lng: data.details.geometry.location.lng,
                                };
                              }
                              if (latLng) {
                                setRadiusSearchData((prevRadiusSearchData) => {
                                  return {
                                    ...prevRadiusSearchData,
                                    latitude: latLng.lat,
                                    longitude: latLng.lng,
                                  };
                                });
                              }

                              if (inputRef) {
                                inputRef.clear();
                              }
                            }}
                            fetchDetails={"google" === config.map?.type}
                            query={
                              "google" === config.map?.type
                                ? {
                                    key: config.map.api_key,
                                    language: "en",
                                  }
                                : { language: "en" }
                            }
                            debounce={500}
                            timeout={15000} //15 seconds
                          />
                          <TouchableOpacity
                            style={styles.deviceLocationButton}
                            onPress={getLocationPermissionAsync}
                            disabled={locationLoading}
                          >
                            {locationLoading ? (
                              <ActivityIndicator
                                size="small"
                                color={COLORS.primary}
                              />
                            ) : (
                              <MaterialIcons
                                name="my-location"
                                size={28}
                                color={COLORS.primary}
                              />
                            )}
                          </TouchableOpacity>
                        </View>
                        {/* Radius Search Slider */}
                        <View style={styles.radiusSearchDistanceSlider}>
                          <View>
                            <Slider
                              style={{
                                width: windowWidth * 0.75,
                                // maximumTrackWidth: 5,
                              }}
                              minimumValue={0}
                              maximumValue={
                                config?.radius_search?.max_distance ?? 300
                              }
                              minimumTrackTintColor={COLORS.primary}
                              maximumTrackTintColor={COLORS.gray}
                              step={1}
                              onValueChange={(value) => {
                                setRadiusSearchData((prevRadiusSearchData) => {
                                  return {
                                    ...prevRadiusSearchData,
                                    distance: value,
                                  };
                                });
                              }}
                              thumbTintColor={COLORS.dodgerblue}
                              thumbImage={require("../assets/slider_thumb.png")}
                              tapToSeek={true}
                              value={
                                config?.radius_search?.default_distance ?? 10
                              }
                            />
                            <View style={styles.sliderRange}>
                              <Text style={styles.text}>
                                {config?.radius_search?.min_distance ?? 0}
                              </Text>
                              <Text style={styles.text}>
                                {config?.radius_search?.max_distance ?? 500}
                              </Text>
                            </View>
                          </View>

                          <View
                            style={[
                              styles.sliderRight,
                              { marginLeft: ios ? 10 : 0 },
                            ]}
                          >
                            <View
                              style={styles.radiusSearchDistanceSliderValueWrap}
                            >
                              <Text
                                style={styles.radiusSearchDistanceSliderValue}
                                numberOfLines={1}
                              >
                                {radiusSearchData.distance}
                              </Text>
                            </View>
                            <Text style={styles.sliderRightUnit}>
                              {config.radius_search.units
                                .charAt(0)
                                .toUpperCase() +
                                config.radius_search.units.slice(1)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
                <View style={[styles.filtersWrap, { marginBottom: 20 }]}>
                  <View style={styles.filterField}>
                    <Text style={[styles.filterLabel, rtlTextA]}>
                      {__(
                        "searchScreenTexts.filterLabels.priceRangeLabel",
                        appSettings.lng
                      )}{" "}
                      <Text
                        style={{
                          fontSize: 16,
                          color: COLORS.text_medium,
                          fontWeight: "bold",
                        }}
                      >
                        {` (${getCurrencySymbol(config.currency)})`}
                      </Text>
                    </Text>
                    <View style={[styles.rangeWrap, rtlView]}>
                      <View
                        style={[
                          styles.filterInputField,
                          {
                            marginRight: rtl_support ? 0 : 5,
                            marginLeft: rtl_support ? 5 : 0,
                          },
                        ]}
                      >
                        <TextInput
                          style={[styles.numRangeInput, rtlTextA]}
                          value={filterPriceRange[0] ? filterPriceRange[0] : ""}
                          onChangeText={(value) => {
                            const newRange = [
                              value,
                              filterPriceRange[1] ? filterPriceRange[1] : "",
                            ];
                            setFilterPriceRange(newRange);
                          }}
                          keyboardType="decimal-pad"
                          placeholder={__(
                            "searchScreenTexts.rangeStart",
                            appSettings.lng
                          )}
                        />
                      </View>
                      <View
                        style={[
                          styles.filterInputField,
                          {
                            marginRight: rtl_support ? 5 : 0,
                            marginLeft: rtl_support ? 0 : 5,
                          },
                        ]}
                      >
                        <TextInput
                          style={[styles.numRangeInput, rtlTextA]}
                          value={filterPriceRange[1] ? filterPriceRange[1] : ""}
                          onChangeText={(value) => {
                            const newRange = [
                              filterPriceRange[0] ? filterPriceRange[0] : "",
                              value,
                            ];
                            setFilterPriceRange(newRange);
                          }}
                          keyboardType="decimal-pad"
                          placeholder={__(
                            "searchScreenTexts.rangeEnd",
                            appSettings.lng
                          )}
                        />
                      </View>
                    </View>
                  </View>
                </View>
                {!!filterData?.custom_fields?.length && (
                  <View style={[styles.customFiltersWrap, styles.filtersWrap]}>
                    {filterData.custom_fields.map((field) => (
                      <View key={field.id}>
                        {validateCfDependency.includes(field.id) && (
                          <View style={{ marginTop: 15 }}>
                            {["radio", "select", "checkbox"].includes(
                              field.type
                            ) &&
                              field?.options?.choices && (
                                <View style={styles.view}>
                                  <Text style={[styles.filterLabel, rtlTextA]}>
                                    {decodeString(field.label)}
                                  </Text>
                                  <DynamicCheckbox
                                    field={field}
                                    handleClick={(value) => {
                                      setFilterCustomData(
                                        (prevFilterCustomData) => {
                                          return {
                                            ...prevFilterCustomData,
                                            [field.meta_key]: value,
                                          };
                                        }
                                      );
                                    }}
                                    selected={
                                      filterCustomData[field.meta_key]
                                        ? filterCustomData[field.meta_key]
                                        : []
                                    }
                                  />
                                </View>
                              )}
                            {field.type === "number" && (
                              <>
                                <Text style={[styles.filterLabel, rtlTextA]}>
                                  {decodeString(field.label)}
                                </Text>
                                <View style={styles.rangeWrap}>
                                  <View
                                    style={[
                                      styles.filterInputField,
                                      { marginRight: 5 },
                                    ]}
                                  >
                                    <TextInput
                                      placeholder={__(
                                        "searchScreenTexts.rangeStart",
                                        appSettings.lng
                                      )}
                                      style={styles.numRangeInput}
                                      keyboardType="decimal-pad"
                                      value={
                                        filterCustomData[field.meta_key]
                                          ? filterCustomData[field.meta_key][0]
                                            ? filterCustomData[
                                                field.meta_key
                                              ][0]
                                            : ""
                                          : ""
                                      }
                                      onChangeText={(value) => {
                                        const newRange = [
                                          value,
                                          filterCustomData[field.meta_key]
                                            ? filterCustomData[
                                                field.meta_key
                                              ][1]
                                              ? filterCustomData[
                                                  field.meta_key
                                                ][1]
                                              : ""
                                            : "",
                                        ];
                                        setFilterCustomData(
                                          (prevFilterCustomData) => {
                                            return {
                                              ...prevFilterCustomData,
                                              [field.meta_key]: newRange,
                                            };
                                          }
                                        );
                                      }}
                                    />
                                  </View>
                                  <View
                                    style={[
                                      styles.filterInputField,
                                      { marginLeft: 5 },
                                    ]}
                                  >
                                    <TextInput
                                      placeholder={__(
                                        "searchScreenTexts.rangeEnd",
                                        appSettings.lng
                                      )}
                                      style={styles.numRangeInput}
                                      keyboardType="decimal-pad"
                                      value={
                                        filterCustomData[field.meta_key]
                                          ? filterCustomData[field.meta_key][1]
                                            ? filterCustomData[
                                                field.meta_key
                                              ][1]
                                            : ""
                                          : ""
                                      }
                                      onChangeText={(value) => {
                                        const newRange = [
                                          filterCustomData[field.meta_key][0]
                                            ? filterCustomData[
                                                field.meta_key
                                              ][0]
                                              ? filterCustomData[
                                                  field.meta_key
                                                ][0]
                                              : ""
                                            : "",
                                          value,
                                        ];
                                        setFilterCustomData(
                                          (prevFilterCustomData) => {
                                            return {
                                              ...prevFilterCustomData,
                                              [field.meta_key]: newRange,
                                            };
                                          }
                                        );
                                      }}
                                    />
                                  </View>
                                </View>
                              </>
                            )}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          <View style={styles.filterBottomWrap}>
            <TouchableOpacity
              style={[
                styles.filterButton_clear,
                { paddingVertical: ios ? 15 : 12 },
              ]}
              onPress={handleClear}
              disabled={filterLoading}
            >
              <Text style={[styles.filterButton_clearText, rtlText]}>
                {__("searchScreenTexts.clearAllButtonTitle", appSettings.lng)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton_apply,
                { paddingVertical: ios ? 15 : 12 },
              ]}
              onPress={handleApplyFilter}
              disabled={filterLoading}
            >
              <Text style={[styles.filterButton_applyText, rtlText]}>
                {__(
                  "searchScreenTexts.applyFiltersButtonTitle",
                  appSettings.lng
                )}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  catPickerOptions: {
    fontSize: 14,
  },
  catPickerWrap: {
    // height: windowHeight - 50 - 73,
    // height: windowHeight - Constants.statusBarHeight - 50 - 50,
    flex: 1,
  },
  combinedContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    marginHorizontal: "3%",
    borderRadius: 3,
    height: 35,
    marginBottom: 5,
  },
  combinedTexonomy: {},
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  deviceLocationButton: {
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 5,
  },
  featuredItemLocation: {
    color: COLORS.text_gray,
    fontSize: 10,
    paddingHorizontal: 5,
  },
  featuredItemLocationWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
  },
  featuredItemPrice: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "bold",
  },
  featuredItemTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.text_dark,
  },
  featuredItemWrap: {
    backgroundColor: COLORS.white,
    marginHorizontal: windowWidth * 0.015,
    marginBottom: windowWidth * 0.03,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    overflow: "hidden",
  },
  featuredItemCategory: {
    fontSize: 10,
    color: COLORS.text_gray,
  },
  featuredItemDetailWrap: {
    alignItems: "flex-start",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  featuredItemImage: {
    height: 150,
    width: "100%",
    resizeMode: "cover",
  },
  featuredItemImageWrap: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    width: "100%",
  },
  filterWrap: {
    flex: 1,
    marginTop: 10,
  },
  filterBottomWrap: {
    flexDirection: "row",
    bottom: 0,
    position: "absolute",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingVertical: 20,
    elevation: 5,
    shadowColor: COLORS.black,
    shadowRadius: 3,
    shadowOpacity: 0.5,
    shadowOffset: {
      height: 3,
      width: 2,
    },
    paddingHorizontal: "3%",
    width: "100%",
    justifyContent: "space-between",
  },
  filterButton_apply: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    width: "47%",
  },
  filterButton_applyText: {
    color: COLORS.white,
    fontWeight: "bold",
  },
  filterButton_clear: {
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.bg_dark,
    width: "47%",
    borderRadius: 5,
  },
  filterButton_clearText: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  filterContentWrap: {
    paddingBottom: windowHeight * 0.11 + Constants.statusBarHeight,
  },
  filterField: {
    marginTop: 10,
  },
  filterInputField: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 16,
    color: "#212121",
    marginBottom: 10,
    fontWeight: "bold",
  },
  filterMainContentWrap: {
    flex: 1,
  },
  filterPickerWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text_dark,
  },
  filterTopWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: "3%",
    marginTop: windowHeight * 0.01,
    height: windowHeight * 0.04,
  },
  filtersWrap: {
    marginHorizontal: "3%",
  },
  flex1: {
    flex: 1,
    alignItems: "center",
  },
  flex2: {
    flex: 2,
    alignItems: "center",
    paddingHorizontal: 10,
    flexDirection: "row",
    justifyContent: "center",
  },
  flex5: {
    flex: 5,
    alignItems: "center",
    paddingHorizontal: 10,
    flexDirection: "row",
    justifyContent: "center",
  },
  itemSeparator: {
    height: 1,
    backgroundColor: COLORS.bg_dark,
  },
  listingSearchBtnContainer: {
    position: "absolute",
    top: "60%",
    right: "3%",
  },
  ListingSearchContainer: {
    paddingVertical: 10,
    width: "94%",
  },
  listingTop: {
    backgroundColor: COLORS.primary,
    display: "flex",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -1,
    paddingTop: 1,
  },
  listingsWrap: {
    paddingTop: 10,
  },
  loadMoreWrap: {
    marginBottom: 20,
  },
  locationContainer: {
    width: "94%",
  },
  locationContent: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  locationContentText: {
    paddingLeft: 10,
    color: COLORS.white,
  },
  loading: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  noListingsMessage: {
    fontSize: 18,
    color: COLORS.text_gray,
  },
  noListingsWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  numRangeInput: {
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border_light,
    borderRadius: 5,
    paddingHorizontal: 10,
    minHeight: 40,
    justifyContent: "center",
  },
  pickerWrap: {
    marginHorizontal: "3%",
    marginVertical: 10,
  },
  radiusSearchDistanceSlider: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  radiusSearchDistanceSliderValueWrap: {
    padding: 5,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: COLORS.gray,
    alignItems: "center",
    justifyContent: "center",
  },

  radiusSearchLocationPickerWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    minHeight: 32,
  },
  rangeWrap: {
    flexDirection: "row",
  },
  screenSeparetor: {
    width: "100%",
    marginVertical: 20,
  },
  searchIconWrap: {
    height: windowHeight - 120,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: windowWidth / 2.5,
  },
  searchInput: {
    height: 35,
    backgroundColor: "white",
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  selected: {
    marginHorizontal: "3%",
    marginVertical: 10,
    backgroundColor: COLORS.white,
    borderRadius: 3,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedText: {
    fontWeight: "bold",
    color: COLORS.primary,
    fontSize: 15,
  },
  separetor: {
    height: "100%",
    width: 1,
    backgroundColor: COLORS.primary,
  },
  sliderRange: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 5,
  },
  sliderRight: {
    flex: 1,
  },
  sliderRightUnit: {
    textAlign: "center",
  },
  subCategoryWrap: {
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    marginVertical: 5,
    paddingHorizontal: 8,
  },
});

export default SearchScreen;
