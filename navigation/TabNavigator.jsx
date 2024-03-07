/* eslint-disable react/display-name */
import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  TouchableWithoutFeedback,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";

// Vector Icons
import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";

// Custom Components
import { useStateValue } from "../StateProvider";
import { COLORS } from "../variables/color";
import AccountScreen from "../screens/AccountScreen";
import ChatListScreen from "../screens/ChatListScreen";
import HomeScreen from "../screens/HomeScreen";
import NewListingScreen from "../screens/NewListingScreen";
import SearchScreen from "../screens/SearchScreen";
import TestScreen from "../screens/TestScreen";
import { __ } from "../language/stringPicker";
import { routes } from "./routes";
import { TabBg } from "./svg/TabBg";

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const [{ user, chat_badge, appSettings }, dispatch] = useStateValue();
  const _renderIcon = (routeName, isFocused) => {
    let icon = "";

    switch (routeName) {
      case __("tabTitles.home", appSettings.lng):
        icon = "home";
        break;
      case __("tabTitles.search", appSettings.lng):
        icon = "search";
        break;
      case __("tabTitles.chatList", appSettings.lng):
        icon = "chatbubble-ellipses-outline";
        break;
      case __("tabTitles.account", appSettings.lng):
        icon = "person-outline";
        break;
    }

    if (routeName === __("tabTitles.home", appSettings.lng)) {
      return (
        <MaterialCommunityIcons
          name={icon}
          size={25}
          color={isFocused ? COLORS.primary : COLORS.gray}
        />
      );
    } else if (routeName === __("tabTitles.search", appSettings.lng)) {
      return (
        <Ionicons
          name={icon}
          size={25}
          color={isFocused ? COLORS.primary : COLORS.gray}
        />
      );
    } else
      return (
        <Ionicons
          name={icon}
          size={25}
          color={isFocused ? COLORS.primary : COLORS.gray}
        />
      );
  };
  const _renderLabel = (routeName, isFocused) => {
    let _label = "";

    switch (routeName) {
      case __("tabTitles.home", appSettings.lng):
        icon = "home";
        break;
      case __("tabTitles.search", appSettings.lng):
        icon = "search";
        break;
      case __("tabTitles.chatList", appSettings.lng):
        icon = "chatbubble-ellipses-outline";
        break;
      case __("tabTitles.account", appSettings.lng):
        icon = "person-outline";
        break;
    }

    if (routeName === __("tabTitles.home", appSettings.lng)) {
      return (
        <MaterialCommunityIcons
          name={icon}
          size={25}
          color={isFocused ? COLORS.primary : COLORS.gray}
        />
      );
    } else if (routeName === __("tabTitles.search", appSettings.lng)) {
      return (
        <Ionicons
          name={icon}
          size={25}
          color={isFocused ? COLORS.primary : COLORS.gray}
        />
      );
    } else
      return (
        <Ionicons
          name={icon}
          size={25}
          color={isFocused ? COLORS.primary : COLORS.gray}
        />
      );
  };

  const MyTabBar = ({ state, descriptors, navigation }) => {
    const focusedOptions = descriptors[state.routes[state.index].key].options;
    if (focusedOptions.tabBarVisible === false) {
      return null;
    }
    return (
      <View
        style={{
          flexDirection: "row",
          backgroundColor: "transparent",
          position: "absolute",
          bottom: 0,

          shadowColor: COLORS.black,
          shadowOpacity: 0.2,
          shadowRadius: 3,
          shadowOffset: { height: -2, width: 0 },
          paddingTop: 10,
          marginTop: 10,
          elevation: 5,
          // maxHeight: 50,
        }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              // The `merge: true` option makes sure that the params inside the tab screen are preserved
              navigation.navigate({ name: route.name, merge: true });
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return route.name === routes.newListingScreen ? (
            <View style={{ elevation: 10 }} key={`${index}`}>
              <View style={{ height: 50, elevation: 10 }}>
                <TabBg />
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    alignItems: "center",
                    width: "100%",
                    paddingBottom: 2,
                  }}
                >
                  <Text
                    style={{
                      color: isFocused ? COLORS.primary : COLORS.gray,
                      fontSize: 13.5,
                    }}
                  >
                    {__("tabTitles.new", appSettings.lng)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  onPress();
                  dispatch({
                    type: "SET_NEW_LISTING_SCREEN",
                    newListingScreen: true,
                  });
                }}
                style={{
                  position: "absolute",
                  bottom: "50%",
                  left: "50%",
                  transform: [{ translateX: -60 / 2 }],
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <LinearGradient
                  // Background Linear Gradient
                  colors={["#028A6A", "#00F0B8"]}
                  style={{
                    height: 60,
                    width: 60,
                    borderRadius: 60 / 2,
                    alignItems: "center",
                    justifyContent: "center",
                    elevation: 2,
                  }}
                >
                  <FontAwesome5 name="plus" size={25} color={COLORS.white} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableWithoutFeedback onPress={onPress} key={`${index}`}>
              <View
                key={`${index}`}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onLongPress={onLongPress}
                style={{
                  flex: 1,
                  flex: 1,
                  backgroundColor: "white",
                  alignContent: "center",
                  // alignSelf: "center",
                  alignItems: "center",
                  justifyContent: "center",
                  maxHeight: 50,
                  // elevation: 10,
                }}
              >
                {route.name === routes.chatListScreen && !!chat_badge && (
                  <View
                    style={{
                      position: "absolute",
                      backgroundColor: COLORS.red,
                      right: 15,
                      top: 1,
                      // padding: 5,
                      borderRadius: 30,
                      height: 20,
                      width: 20,
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 1,
                    }}
                  >
                    <Text style={{ color: COLORS.white, fontSize: 11 }}>
                      {chat_badge <= 9
                        ? chat_badge
                        : __("chatBadgeNumber", appSettings.lng)}
                    </Text>
                  </View>
                )}
                {_renderIcon(route.name, isFocused)}
                <Text
                  style={{ color: isFocused ? COLORS.primary : COLORS.gray }}
                >
                  {label}
                  {/* {_renderLabel(route.name, isFocused)} */}
                </Text>
              </View>
            </TouchableWithoutFeedback>
          );
        })}
      </View>
    );
  };

  return (
    <Tab.Navigator
      screenOptions={{
        showLabel: true,
        keyboardHidesTabBar: true,
        labelStyle: {
          marginBottom: 5,
          fontSize: 12,
        },
        style: {
          height: 50,
        },
        headerShown: false,
      }}
      tabBar={(props) => <MyTabBar {...props} />}
    >
      <Tab.Screen
        name={__("tabTitles.home", appSettings.lng)}
        component={HomeScreen}
        // component={TestScreen}
        // options={{
        //   tabBarIcon: ({ color }) => (
        //     <FontAwesome5 name="home" size={20} color={color} />
        //   ),
        //   tabBarActiveTintColor: COLORS.primary,
        // }}
      />
      <Tab.Screen
        name={__("tabTitles.search", appSettings.lng)}
        component={SearchScreen}
        // options={{
        //   tabBarIcon: ({ color }) => (
        //     <FontAwesome5 name="search" size={20} color={color} />
        //   ),
        //   tabBarActiveTintColor: COLORS.primary,
        // }}
      />
      <Tab.Screen
        // name={__("tabTitles.new", appSettings.lng)}
        name={routes.newListingScreen}
        component={NewListingScreen}
        options={({ navigation }) => ({
          // tabBarButton: () => (
          //   <NewListingButton
          //     onPress={() => {
          //       navigation.navigate(routes.newListingScreen);
          //       dispatch({
          //         type: "SET_NEW_LISTING_SCREEN",
          //         newListingScreen: true,
          //       });
          //     }}
          //   />
          // ),
          tabBarVisible: !user,
        })}
      />
      <Tab.Screen
        name={__("tabTitles.chatList", appSettings.lng)}
        component={ChatListScreen}
        // options={{
        //   tabBarBadge: chat_badge,
        //   tabBarIcon: ({ color }) => (
        //     <FontAwesome name="comments" size={23} color={color} />
        //   ),
        //   tabBarActiveTintColor: COLORS.primary,
        // }}
      />
      <Tab.Screen
        name={__("tabTitles.account", appSettings.lng)}
        component={AccountScreen}
        // options={{
        //   tabBarIcon: ({ color }) => (
        //     <FontAwesome5 name="user-alt" size={20} color={color} />
        //   ),
        //   title: __("screenTitles.accountScreen", appSettings.lng),
        //   tabBarActiveTintColor: COLORS.primary,
        // }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
