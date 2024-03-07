/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";

// vector Icons
import { FontAwesome } from "@expo/vector-icons";
import { FontAwesome5 } from "@expo/vector-icons";

// Custom Components & Functions
import { useStateValue } from "../StateProvider";
import FavoritesFlatList from "../components/FavoritesFlatList";
import AppButton from "../components/AppButton";
import { COLORS } from "../variables/color";
import api, { setAuthToken, removeAuthToken } from "../api/client";
import FlashNotification from "../components/FlashNotification";
import LoadingIndicator from "../components/LoadingIndicator";
import { paginationData } from "../app/pagination/paginationData";
import { getRelativeTimeConfig, __ } from "../language/stringPicker";
import { admobConfig } from "../app/services/adMobConfig";
import AdmobBanner from "../components/AdmobBanner";
import { routes } from "../navigation/routes";
import moment from "moment";
import "moment/locale/en-gb";

const FavoritesScreen = ({ navigation }) => {
  const [{ auth_token, is_connected, appSettings, rtl_support }, dispatch] =
    useStateValue();

  const [myFavs, setMyFavs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initial, setInitial] = useState(true);
  const [errorMessage, setErrorMessage] = useState();
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [moreLoading, setMoreLoading] = useState(false);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(
    pagination.current_page || paginationData.favourites.page
  );
  const [flashNotification, setFlashNotification] = useState(false);
  const [flashNotificationMessage, setFlashNotificationMessage] = useState();
  const [admobError, setAdmobError] = useState(false);

  // Initial get listing call
  useEffect(() => {
    const relativeTime = getRelativeTimeConfig(appSettings.lng);
    moment.updateLocale("en-gb", {
      relativeTime: relativeTime,
    });
    if (!initial) return;
    handleLoadFavsList(paginationData.favourites);
    setInitial(false);
  }, [initial]);

  // Refresh get listing call
  useEffect(() => {
    if (!refreshing) return;
    setCurrentPage(1);
    setPagination({});
    handleLoadFavsList(paginationData.favourites);
  }, [refreshing]);

  // next page get listing call
  useEffect(() => {
    if (!moreLoading) return;
    const data = {
      per_page: paginationData.favourites.per_page,
      page: currentPage,
    };
    handleLoadFavsList(data);
  }, [moreLoading]);

  const handleLoadFavsList = (data) => {
    setAuthToken(auth_token);

    api.get("my/favourites", data).then((res) => {
      if (res.ok) {
        if (refreshing) {
          setRefreshing(false);
        }
        if (moreLoading) {
          setMyFavs((prevMyFavs) => [...prevMyFavs, ...res.data.data]);
          setMoreLoading(false);
        } else {
          setMyFavs(res.data.data);
        }
        setPagination(res?.data?.pagination || {});

        removeAuthToken();
        if (loading) {
          setLoading(false);
        }
      } else {
        if (refreshing) {
          setRefreshing(false);
        }
        if (moreLoading) {
          setMoreLoading(false);
        }
        handleError(
          res?.data?.error_message ||
            res?.data?.error ||
            res?.problem ||
            __(
              "favoritesScreenTexts.customServerResponseError",
              appSettings.lng
            )
        );
        if (loading) {
          setLoading(false);
        }
        removeAuthToken();
      }
    });
  };

  const handleRemoveFavAlert = (listing) => {
    Alert.alert(
      "",
      __("favoritesScreenTexts.removePromptMessage", appSettings.lng),
      [
        {
          text: __("favoritesScreenTexts.cancelButtonTitle", appSettings.lng),

          style: "cancel",
        },
        {
          text: __("favoritesScreenTexts.removeButtonTitle", appSettings.lng),
          onPress: () => handleRemoveFromFavorites(listing),
        },
      ],
      { cancelable: false }
    );
  };
  const handleRemoveFromFavorites = (listing) => {
    setDeleteLoading(true);
    setAuthToken(auth_token);
    api
      .post("my/favourites", { listing_id: listing.listing_id })
      .then((res) => {
        if (res.ok) {
          setMyFavs(myFavs.filter((fav) => fav != listing));
          removeAuthToken();
          setDeleteLoading(false);
          handleSuccess(
            __("favoritesScreenTexts.favRemoveSuccessMessage", appSettings.lng)
          );
        } else {
          setErrorMessage(
            res?.data?.error_message ||
              res?.data?.error ||
              res?.problem ||
              __(
                "favoritesScreenTexts.favRemoveErrorCustomMessage",
                appSettings.lng
              )
          );
          removeAuthToken();
          setDeleteLoading(false);
          handleError(
            res?.data?.error_message ||
              res?.data?.error ||
              res?.problem ||
              __(
                "favoritesScreenTexts.favRemoveErrorCustomMessage",
                appSettings.lng
              )
          );
        }
      });
  };

  const handleNewListing = () => {
    navigation.navigate(routes.newListingScreen);
    dispatch({
      type: "SET_NEW_LISTING_SCREEN",
      newListingScreen: true,
    });
  };

  const renderFavsItem = ({ item }) => (
    <FavoritesFlatList
      item={item}
      onDelete={() => handleRemoveFavAlert(item)}
      onClick={() => handleViewListing(item)}
    />
  );

  const handleViewListing = (item) => {
    navigation.navigate(routes.listingDetailScreen, {
      listingId: item.listing_id,
    });
  };

  const keyExtractor = useCallback((item, index) => `${index}`, []);

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

  const handleSuccess = (message) => {
    setFlashNotificationMessage(message);
    setTimeout(() => {
      setFlashNotification(true);
    }, 10);
    setTimeout(() => {
      setFlashNotification(false);
      setFlashNotificationMessage();
    }, 1000);
  };
  const handleError = (message) => {
    setFlashNotificationMessage(message);
    setTimeout(() => {
      setFlashNotification(true);
    }, 10);
    setTimeout(() => {
      setFlashNotification(false);
      setFlashNotificationMessage();
    }, 1200);
  };

  const rtlText = rtl_support && {
    writingDirection: "rtl",
  };

  const onAdmobError = (error) => {
    setAdmobError(true);
  };

  const ListHeaderComponent = () => {
    if (admobConfig?.admobEnabled && admobConfig.favorites && !admobError) {
      return (
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            height: 100,
            marginVertical: 10,
            width: "100%",
          }}
        >
          <AdmobBanner onError={onAdmobError} />
        </View>
      );
    } else return null;
  };

  const ListEmptyComponent = () => (
    <View style={styles.noFavWrap}>
      <FontAwesome name="exclamation-triangle" size={30} color={COLORS.gray} />
      <Text style={[styles.noFavTitle, rtlText]}>
        {__("favoritesScreenTexts.noFavoriteMessage", appSettings.lng)}
      </Text>
      <AppButton
        title={__("favoritesScreenTexts.postAdButtonTitle", appSettings.lng)}
        style={styles.postButton}
        onPress={handleNewListing}
        textStyle={rtlText}
      />
    </View>
  );

  return is_connected ? (
    <>
      {loading ? (
        <View style={styles.loadingWrap}>
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={[styles.loadingMessage, rtlText]}>
              {__("favoritesScreenTexts.loadingMessage", appSettings.lng)}
            </Text>
          </View>
        </View>
      ) : (
        <>
          {!!deleteLoading && (
            <View style={styles.deleteLoading}>
              <View style={styles.deleteLoadingContentWrap}>
                <LoadingIndicator
                  visible={true}
                  style={{
                    width: "100%",
                    marginLeft: "3.125%",
                  }}
                />
              </View>
            </View>
          )}

          {!loading && (
            <View
              style={{
                backgroundColor: COLORS.white,
                flex: 1,
                paddingVertical: 5,
                paddingHorizontal: "3%",
              }}
            >
              <FlatList
                ListHeaderComponent={ListHeaderComponent}
                data={myFavs}
                renderItem={renderFavsItem}
                keyExtractor={keyExtractor}
                horizontal={false}
                onEndReached={handleNextPageLoading}
                onEndReachedThreshold={0.2}
                ListFooterComponent={listFooter}
                onRefresh={onRefresh}
                refreshing={refreshing}
                ListEmptyComponent={ListEmptyComponent}
              />
            </View>
          )}
          {!myFavs.length && false && (
            <View style={styles.noFavWrap}>
              <FontAwesome
                name="exclamation-triangle"
                size={100}
                color={COLORS.gray}
              />
              <Text style={[styles.noFavTitle, rtlText]}>
                {__("favoritesScreenTexts.noFavoriteMessage", appSettings.lng)}
              </Text>
              <AppButton
                title={__(
                  "favoritesScreenTexts.postAdButtonTitle",
                  appSettings.lng
                )}
                style={styles.postButton}
                onPress={handleNewListing}
                textStyle={rtlText}
              />
            </View>
          )}
          <FlashNotification
            falshShow={flashNotification}
            flashMessage={flashNotificationMessage}
          />
        </>
      )}
    </>
  ) : (
    <View style={styles.noInternet}>
      <FontAwesome5
        name="exclamation-circle"
        size={24}
        color={COLORS.primary}
      />
      <Text style={[styles.text, rtlText]}>
        {__("favoritesScreenTexts.noInternet", appSettings.lng)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  containerNoFavs: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  deleteLoading: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.8,
    backgroundColor: "rgba(255,255,255,.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
    flex: 1,
    height: "100%",
    width: "100%",
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
  loadingWrap: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  noFavTitle: {
    fontSize: 18,
    color: COLORS.text_gray,
    marginTop: 10,
  },
  noFavWrap: {
    alignItems: "center",
    marginHorizontal: "3%",
    flex: 1,
    justifyContent: "center",
  },
  noInternet: {
    alignItems: "center",
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  postButton: {
    borderRadius: 3,
    marginTop: 40,
    width: "60%",
  },
});

export default FavoritesScreen;
