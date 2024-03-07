import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  TouchableWithoutFeedback,
} from "react-native";

// External Libraries
import moment from "moment";
import "moment/locale/en-gb";
import { useFocusEffect } from "@react-navigation/native";

// Vector Icons
import { FontAwesome } from "@expo/vector-icons";
import { FontAwesome5 } from "@expo/vector-icons";
import { Feather } from "@expo/vector-icons";

// Custom Components & Functions
import TabScreenHeader from "../components/TabScreenHeader";
import { COLORS } from "../variables/color";
import AppButton from "../components/AppButton";
import { useStateValue } from "../StateProvider";
import api, { setAuthToken, removeAuthToken } from "../api/client";
import LoadingIndicator from "../components/LoadingIndicator";
import FlashNotification from "../components/FlashNotification";
import { getRelativeTimeConfig, __ } from "../language/stringPicker";
import { decodeString } from "../helper/helper";
import { routes } from "../navigation/routes";

const chatListItemFallbackImageUrl = require("../assets/200X150.png");

const ChatListScreen = ({ navigation, route }) => {
  const [
    {
      user,
      auth_token,
      is_connected,
      newListingScreen,
      appSettings,
      rtl_support,
    },
    dispatch,
  ] = useStateValue();
  const [chatListData, setChatListData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoload, setAutoload] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [flashNotification, setFlashNotification] = useState(false);
  const [flashNotificationMessage, setFlashNotificationMessage] = useState();

  useFocusEffect(
    useCallback(() => {
      if (loading) return;
      setRefreshing(true);
    }, [])
  );

  // initial for externel event
  useEffect(() => {
    const relativeTime = getRelativeTimeConfig(appSettings.lng);
    moment.updateLocale("en-gb", {
      relativeTime: relativeTime,
    });
    if (newListingScreen) {
      dispatch({
        type: "SET_NEW_LISTING_SCREEN",
        newListingScreen: false,
      });
    }
    dispatch({
      type: "SET_CHAT_BADGE",
      chat_badge: null,
    });
  }, []);

  // initial load conversation
  useEffect(() => {
    if (!user) {
      setChatListData([]);
      return;
    }
    handleLoadConversations();
  }, [user]);

  // refreshing load conversation
  useEffect(() => {
    if (!refreshing) return;
    handleLoadConversations();
  }, [refreshing]);
  const handleLoadConversations = () => {
    if (!user) {
      return;
    }
    if (autoload) return;
    setAutoload(true);
    setAuthToken(auth_token);
    api
      .get("my/chat")
      .then((res) => {
        if (res.ok) {
          setChatListData(res.data);
        } else {
          //TODO print error
        }
      })
      .then(() => {
        removeAuthToken();
        setLoading(false);
        setAutoload(false);
        setRefreshing(false);
      });
  };
  const handleDeleteAlert = (item) => {
    Alert.alert(
      "",
      `${__("chatListScreenTexts.deletePromptMessage", appSettings.lng)}`,
      [
        {
          text: __("chatListScreenTexts.cancelButtonTitle", appSettings.lng),
        },
        {
          text: __("chatListScreenTexts.deleteButtonTitle", appSettings.lng),
          onPress: () => handleDeleteConversation(item),
        },
      ],
      { cancelable: false }
    );
  };
  const handleDeleteConversation = (item) => {
    setDeleteLoading(true);
    setAuthToken(auth_token);
    api.delete("my/chat/conversation", { con_id: item.con_id }).then((res) => {
      if (res.ok) {
        setChatListData(chatListData.filter((message) => message != item));
        removeAuthToken();
        setDeleteLoading(false);
        handleSuccess(
          __("chatListScreenTexts.chatDeleteSuccessText", appSettings.lng)
        );
      } else {
        setDeleteLoading(false);
        removeAuthToken();
        handleError(
          res?.data?.error_message ||
            res?.data?.error ||
            res?.problem ||
            __("chatListScreenTexts.chatDeleteErrorText", appSettings.lng)
        );
      }
    });
  };
  const Chat = ({
    thumb,
    chatTitle,
    addTitle,
    lastmessage,
    onPress,
    time,
    onLongPress,
    is_read,
    source_id,
  }) => (
    <TouchableWithoutFeedback onPress={onPress} onLongPress={onLongPress}>
      <View style={[styles.message, rtlView]}>
        <View style={styles.chatImageContainer}>
          <Image
            style={styles.chatImage}
            source={
              thumb === null
                ? chatListItemFallbackImageUrl
                : {
                    uri: thumb,
                  }
            }
          />
        </View>
        <View
          style={[
            styles.chatDetails,
            {
              marginLeft: rtl_support ? 0 : 10,
              marginRight: rtl_support ? 10 : 0,
            },
          ]}
        >
          <View style={[styles.titleRow, rtlView]}>
            <Text style={styles.chatTitle} numberOfLines={1}>
              {decodeString(chatTitle)}
            </Text>
            <Text>{time}</Text>
          </View>
          <Text
            style={[
              styles.addTitle,
              rtlText,
              {
                marginRight: rtl_support ? 0 : "30%",
                marginLeft: rtl_support ? "30%" : 0,
              },
            ]}
            numberOfLines={1}
          >
            {decodeString(addTitle)}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              is_read == 0 && user.id != source_id
                ? { fontWeight: "bold" }
                : {},
              rtlText,
              {
                marginRight: rtl_support ? 0 : "30%",
                marginLeft: rtl_support ? "30%" : 0,
              },
            ]}
          >
            {decodeString(lastmessage)}
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );

  const renderChats = ({ item }) => (
    <Chat
      onPress={() =>
        navigation.navigate(routes.chatScreen, { ...item, from: "list" })
      }
      thumb={
        item.listing.images.length > 0
          ? item.listing.images[0].sizes.thumbnail.src
          : null
      }
      chatTitle={item.display_name}
      addTitle={item.listing.title}
      lastmessage={item.last_message}
      time={moment(item.last_message_created_at).fromNow()}
      onLongPress={() => handleDeleteAlert(item)}
      is_read={item.is_read}
      source_id={item.source_id}
    />
  );

  const onRefresh = () => {
    setRefreshing(true);
  };

  const keyExtractor = useCallback((item, index) => `${index}`, []);

  const itemSeparator = () => <View style={styles.itemSeparator} />;
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

  const EmptyChatList = () => (
    <View style={styles.noChatWrap}>
      <Text style={styles.noChatTitle}>
        {__("chatListScreenTexts.noChatTitleMessage", appSettings.lng)}
      </Text>
      <View style={styles.noChatIcon}>
        <FontAwesome name="wechat" size={100} color={COLORS.primary_soft} />
        <Image style={styles.shadow} source={require("../assets/NoChat.png")} />
      </View>
      <Text style={styles.noChatMessage}>
        {__("chatListScreenTexts.noChatMessage", appSettings.lng)}
      </Text>
      <View style={{ marginTop: 20, alignItems: "center" }}>
        <Text style={{ color: COLORS.primary }}>
          {__("chatListScreenTexts.scrollToRefresh", appSettings.lng)}
        </Text>
        <Feather name="chevrons-down" size={24} color={COLORS.primary} />
      </View>
    </View>
  );

  const rtlText = rtl_support && {
    writingDirection: "rtl",
    textAlign: "right",
  };
  const rtlTextOnly = rtl_support && {
    writingDirection: "rtl",
  };
  const rtlView = rtl_support && {
    flexDirection: "row-reverse",
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Screen Header Component */}
      <TabScreenHeader sideBar />
      {is_connected ? (
        <>
          {user && loading && (
            // {* Loading Component *}
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={[styles.loadingMessage, rtlTextOnly]}>
                {__("chatListScreenTexts.loadingMessage", appSettings.lng)}
              </Text>
            </View>
          )}
          {(!loading || user === null) && (
            <View
              style={[
                user && !chatListData.length ? styles.bgWhite : styles.bgDark,
                { flex: 1 },
              ]}
            >
              {/* user not logged in; */}
              {!user && (
                <View style={styles.noUserWrap}>
                  <FontAwesome
                    name="user-times"
                    size={100}
                    color={COLORS.bg_dark}
                  />
                  <Text style={[styles.noUserMessage, rtlTextOnly]}>
                    {__("chatListScreenTexts.noUserMessage", appSettings.lng)}
                  </Text>

                  <AppButton
                    title={__(
                      "chatListScreenTexts.loginButtonTitle",
                      appSettings.lng
                    )}
                    style={styles.chatLogIn}
                    onPress={() => navigation.navigate(routes.loginScreen)}
                    textStyle={rtlTextOnly}
                  />
                </View>
              )}

              {/*user logged in and has chat data */}
              {!!user && !loading && (
                <View style={styles.chatListWrap}>
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
                  <FlatList
                    ItemSeparatorComponent={itemSeparator}
                    data={chatListData}
                    renderItem={renderChats}
                    keyExtractor={keyExtractor}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    ListEmptyComponent={EmptyChatList}
                  />
                </View>
              )}
            </View>
          )}
          {/* Flash Notification Component */}
          <FlashNotification
            falshShow={flashNotification}
            flashMessage={flashNotificationMessage}
          />
        </>
      ) : (
        // {* No Internet Component *}
        <View style={styles.noInternet}>
          <FontAwesome5
            name="exclamation-circle"
            size={35}
            color={COLORS.primary}
          />
          <Text style={[styles.text, rtlTextOnly]}>
            {__("chatListScreenTexts.offlineNoticeText", appSettings.lng)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  addTitle: {
    color: COLORS.text_gray,
    fontWeight: "bold",
  },
  bgWhite: {
    backgroundColor: COLORS.white,
    flex: 1,
  },
  bgDark: {
    backgroundColor: COLORS.bg_dark,
    flex: 1,
  },
  chatDetails: {
    display: "flex",
    flex: 1,
  },
  chatImage: {
    height: 60,
    width: 60,
    resizeMode: "cover",
  },
  chatImageContainer: {
    height: 60,
    width: 60,
    borderRadius: 30,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  chatListWrap: {
    flex: 1,
  },
  chatLogIn: {
    width: "60%",
    paddingVertical: 10,
    borderRadius: 3,
    marginVertical: 40,
  },
  chatTitle: {
    fontSize: 15,
    color: COLORS.text_dark,
    fontWeight: "bold",
  },
  deleteLoading: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
    flex: 1,
    height: "100%",
    width: "100%",
  },
  deleteLoadingContentWrap: {
    paddingHorizontal: "3%",

    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  itemSeparator: {
    height: 1,
    width: "100%",
    backgroundColor: COLORS.bg_dark,
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
    zIndex: 5,
    flex: 1,
  },
  message: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 5,
  },
  noChatIcon: {
    marginVertical: 30,
    alignItems: "center",
  },
  noChatMessage: {
    color: COLORS.text_gray,
  },
  noChatTitle: {
    fontSize: 16,
    color: COLORS.text_dark,
  },
  noChatWrap: {
    paddingVertical: 40,
    backgroundColor: COLORS.white,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  noUserMessage: {
    textAlign: "center",
    fontSize: 17,
    color: COLORS.text_gray,
    marginTop: 20,
  },
  noUserWrap: {
    paddingTop: 40,
    alignItems: "center",
    flex: 1,
    backgroundColor: "white",
  },
  noInternet: {
    alignItems: "center",
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
  },
  shadow: {
    width: 110,
    resizeMode: "contain",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flex: 1,
    alignItems: "center",
  },
});

export default ChatListScreen;
