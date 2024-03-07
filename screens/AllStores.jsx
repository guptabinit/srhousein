import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Pressable,
} from "react-native";

// Custom Components & Constants
import api from "../api/client";
import { paginationData } from "../app/pagination/paginationData";
import { COLORS } from "../variables/color.js";
import { useStateValue } from "../StateProvider";
import { __ } from "../language/stringPicker";
import { routes } from "../navigation/routes";
import SearchIcon from "../components/svgComponents/SearchIcon";
import { Feather } from "@expo/vector-icons";
import { admobConfig } from "../app/services/adMobConfig";
import AdmobBanner from "../components/AdmobBanner";

const { width: windowWidth } = Dimensions.get("window");

const allStoresFallBackImages = {
  storeCardLogo: require("../assets/200X150.png"),
};

const AllStores = ({ navigation }) => {
  const [{ appSettings, rtl_support }] = useStateValue();
  const [loading, setLoading] = useState(true);
  const [storesData, setStoresData] = useState();
  const [refreshing, setRefreshing] = useState(false);
  const [moreLoading, setMoreLoading] = useState(false);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(
    pagination.page || paginationData.allStores.page
  );
  const [search, setSearch] = useState("");
  const [admobError, setAdmobError] = useState(false);
  //  Initial Call
  useEffect(() => {
    getStoresData(paginationData.allStores);
  }, []);

  // Refreshing get stores call
  useEffect(() => {
    if (!refreshing) return;
    setCurrentPage(1);
    setPagination({});
    getStoresData(paginationData.allStores);
  }, [refreshing]);

  // next page get stores call
  useEffect(() => {
    if (!moreLoading) return;
    const data = {
      per_page: paginationData.allStores.per_page,
      page: currentPage,
    };
    getStoresData(data);
  }, [moreLoading]);

  const getStoresData = (args) => {
    api.get("stores", { ...args }).then((res) => {
      if (res.ok) {
        if (refreshing) {
          setRefreshing(false);
        }
        if (moreLoading) {
          setStoresData((prevStoresData) => [
            ...prevStoresData,
            ...res.data.data,
          ]);
          setMoreLoading(false);
        } else {
          setStoresData(res.data.data);
        }
        setPagination(res.data.pagination ? res.data.pagination : {});

        setLoading(false);
      } else {
        // print error
        if (refreshing) {
          setRefreshing(false);
        }
        // TODO handle error
        if (moreLoading) {
          setMoreLoading(false);
        }
        setLoading(false);
      }
    });
  };

  const renderListItem = useCallback(
    ({ item }) => <StoreCard item={item} />,
    []
  );

  const handleStoreCardPress = (item) => {
    navigation.navigate(routes.storeDetailsScreen, { storeId: item.id });
  };
  const StoreCard = ({ item }) => (
    <View style={styles.storeWrap}>
      <TouchableOpacity
        style={styles.storeContent}
        onPress={() => handleStoreCardPress(item)}
      >
        <View style={styles.logoWrap}>
          {item.logo ? (
            <Image source={{ uri: item.logo }} style={styles.logo} />
          ) : (
            <Image
              source={allStoresFallBackImages.storeCardLogo}
              style={styles.logo}
            />
          )}
        </View>
        <Text style={[styles.storeCardTitle, rtlText]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.storeCardListingCount, rtlText]}>
          {item.listings_count ? item.listings_count : 0}{" "}
          {__("allStoresTexts.storeAdCount", appSettings.lng)}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const keyExtractor = useCallback((item, index) => `${index}`, []);
  const EmptyListComponent = () => (
    <View
      style={{
        alignItems: "center",
        marginVertical: 20,
      }}
    >
      <Text
        style={{ fontSize: 16, fontWeight: "bold", color: COLORS.text_light }}
      >
        {__("allStoresTexts.noShopText", appSettings.lng)}
      </Text>
    </View>
  );
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

  const onRefresh = () => {
    if (moreLoading) return;
    setRefreshing(true);
  };

  const handleNextPageLoading = () => {
    if (refreshing) return;
    if (pagination && pagination.total_pages > pagination.current_page) {
      setCurrentPage((prevCurrentPage) => prevCurrentPage + 1);
      setMoreLoading(true);
    }
  };
  const rtlText = rtl_support && {
    writingDirection: "rtl",
  };

  const searchRef = useRef(null);

  const handleSearch = (e) => {
    if (e?.nativeEvent?.text && e?.nativeEvent?.text?.trim()) {
      setLoading(true);
      setSearch(e.nativeEvent.text);
      const args = { ...paginationData, search: e.nativeEvent.text };
      getStoresData(args);
    } else {
      searchRef.current.clear();
    }
  };

  const handleClear = () => {
    searchRef.current.clear();
    onRefresh();
  };

  const onAdmobError = (error) => {
    setAdmobError(true);
  };

  const ListHeaderComponent = () => (
    <View
      style={{
        width: "100%",
        alignItems: "center",
        marginVertical: 10,
      }}
    >
      <AdmobBanner onError={onAdmobError} />
    </View>
  );

  return (
    <>
      <View
        style={{
          height: 41,
          borderWidth: 1,
          borderRadius: 4,
          borderColor: COLORS.border_light,
          flexDirection: "row",
          alignItems: "center",
          marginTop: 10,
          marginHorizontal: "3%",
        }}
      >
        <Pressable onPress={() => searchRef.current.focus()}>
          <View
            style={{
              paddingHorizontal: 12,
            }}
          >
            <SearchIcon color={COLORS.gray} />
          </View>
        </Pressable>
        <TextInput
          ref={searchRef}
          style={{
            flex: 1,
            paddingRight: 40,
            paddingLeft: 5,
            height: "100%",
            // color: RbxColors.black,
          }}
          placeholder={__("allStoresTexts.searchPlaceholder", appSettings.lng)}
          placeholderTextColor={COLORS.text_light}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <View
          style={{
            position: "absolute",
            right: 0,
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Pressable onPress={handleClear}>
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                width: 40,
              }}
            >
              <Feather name={"x"} size={20} color={COLORS.gray} />
            </View>
          </Pressable>
        </View>
      </View>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={rtlText}>
            {__("allStoresTexts.loadingText", appSettings.lng)}
          </Text>
        </View>
      ) : (
        <View style={styles.container}>
          {/* Stores List */}
          <FlatList
            data={storesData}
            renderItem={renderListItem}
            keyExtractor={keyExtractor}
            horizontal={false}
            numColumns={3}
            showsVerticalScrollIndicator={false}
            onEndReached={handleNextPageLoading}
            onEndReachedThreshold={1}
            ListFooterComponent={listFooter}
            maxToRenderPerBatch={15}
            windowSize={60}
            onRefresh={onRefresh}
            refreshing={refreshing}
            scrollEventThrottle={1}
            ListEmptyComponent={EmptyListComponent}
            contentContainerStyle={{
              marginHorizontal: windowWidth * 0.02,
              paddingVertical: 20,
            }}
            ListHeaderComponent={
              admobConfig?.admobEnabled && admobConfig?.allStores && !admobError
                ? ListHeaderComponent
                : null
            }
          />
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg_light,
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
    height: windowWidth * 0.17,
    width: windowWidth * 0.25,
    resizeMode: "contain",
  },
  logoWrap: {
    height: windowWidth * 0.17,
    width: windowWidth * 0.25,
    overflow: "hidden",
  },
  storeCardListingCount: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.text_gray,
  },
  storeCardTitle: {
    fontWeight: "bold",
    fontSize: 14,
    marginVertical: 5,
  },
  storeContent: {
    height: windowWidth * 0.32,
    width: windowWidth * 0.3,
    backgroundColor: COLORS.white,
    overflow: "hidden",
    alignItems: "center",
    padding: 5,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  storeWrap: {
    height: windowWidth * 0.33,
    width: windowWidth * 0.3,
    marginHorizontal: windowWidth * 0.01,
    backgroundColor: COLORS.primary,
    marginBottom: windowWidth * 0.02,
    borderRadius: 5,
    overflow: "hidden",
    alignItems: "center",
    elevation: 3,
    shadowColor: COLORS.black,
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: {
      height: 0,
      width: 0,
    },
  },
});

export default AllStores;
