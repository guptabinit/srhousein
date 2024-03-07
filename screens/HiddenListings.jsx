import { useIsFocused } from "@react-navigation/native";
import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import api, { setAuthToken, removeAuthToken } from "../api/client";
import { __ } from "../language/stringPicker";
import { useStateValue } from "../StateProvider";
import FlashNotification from "../components/FlashNotification";
import HiddenListingCard from "../components/HiddenListingCard";
import { COLORS } from "../variables/color";

const HiddenListings = (props) => {
  const [{ user, auth_token, config, ios, appSettings, rtl_support }] =
    useStateValue();
  const [hiddenListingData, setHiddenListingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [flashNotification, setFlashNotification] = useState(false);
  const [flashNotificationMessage, setFlashNotificationMessage] = useState("");
  const [actionOverlay, setActionOverlay] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!refreshing) return;
    handleLoaddiddenList();
  }, [refreshing]);
  useEffect(() => {
    handleLoaddiddenList();
  }, []);

  const handleLoaddiddenList = () => {
    setAuthToken(auth_token);
    api
      .get("privacy/listing/block")
      .then((res) => {
        if (isFocused) {
          if (res.ok) {
            setHiddenListingData(res.data);
          } else {
            handleError(res?.data?.message || res?.data?.error || res?.problem);
          }
        }
      })
      .finally(() => {
        removeAuthToken();
        setLoading(false);
        setRefreshing(false);
      });
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

  const handleSuccess = (message) => {
    setFlashNotificationMessage(message);
    setTimeout(() => {
      setFlashNotification(true);
    }, 10);
    setTimeout(() => {
      setFlashNotification(false);
      setFlashNotificationMessage("");
    }, 1200);
    setRefreshing(true);
  };

  const renderListingItem = useCallback(
    ({ item }) => (
      <HiddenListingCard item={item} onUnBlock={onUnBlockListingAlert} />
    ),
    [hiddenListingData]
  );

  const onUnBlockListingAlert = (id) => {
    Alert.alert("", __("hiddenListingsTexts.unBlockAlert", appSettings.lng), [
      {
        text: __("hiddenListingsTexts.cancelBtnTitle", appSettings.lng),
      },
      {
        text: __("hiddenListingsTexts.okBtnTitle", appSettings.lng),
        onPress: () => onUnBlockListingConfirm(id),
      },
    ]);
  };

  const onUnBlockListingConfirm = (id) => {
    setActionOverlay(true);
    setAuthToken(auth_token);
    api
      .delete("privacy/listing/block", {
        listing_id: id,
      })
      .then((res) => {
        if (res?.ok) {
          handleSuccess(
            __("hiddenListingsTexts.unBlockSuccessMessage", appSettings.lng)
          );
          setRefreshing(true);
        } else {
          handleError(res?.data?.message || res?.data?.error || res?.problem);
        }
      })
      .then(() => {
        removeAuthToken();
        setActionOverlay(false);
      });
  };

  const keyExtractor = (item, index) => `${index}`;

  const onRefresh = () => {
    setRefreshing(true);
  };

  const ListEmptyComponent = () => (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyText}>
        {__("hiddenListingsTexts.listEmptyMessage", appSettings.lng)}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size={"large"} color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={hiddenListingData}
          renderItem={renderListingItem}
          keyExtractor={keyExtractor}
          ListEmptyComponent={ListEmptyComponent}
          maxToRenderPerBatch={14}
          onRefresh={onRefresh}
          refreshing={refreshing}
          contentContainerStyle={{
            paddingVertical: 5,
            flex: 1,
          }}
        />
      )}
      <FlashNotification
        falshShow={flashNotification}
        flashMessage={flashNotificationMessage}
      />
      <Modal animationType="slide" transparent={true} visible={actionOverlay}>
        <View style={styles.actionModal}>
          <View style={{ flex: 1, justifyContent: "center" }}>
            <View style={styles.aMOverlay} />
            <View style={{ zIndex: 2 }}>
              <ActivityIndicator color={COLORS.primary} size={"large"} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  aMOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: COLORS.border_dark,
    zIndex: 1,
    opacity: 0.5,
  },
  actionModal: {
    flex: 1,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 15,
    color: COLORS.text_gray,
    lineHeight: 30,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  container: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default HiddenListings;
