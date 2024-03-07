import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

// Vector Icons
import { FontAwesome5 } from "@expo/vector-icons";

// Custom Components & Functions
import api from "../api/client";
import { COLORS } from "../variables/color";
import { useStateValue } from "../StateProvider";
import { decodeString } from "../helper/helper";
import { __ } from "../language/stringPicker";

const maximumPickerLevelArr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const SelectLocationScreen = ({ route, navigation }) => {
  const [goBack, setGoBack] = useState(false);
  const [location, setLocation] = useState([]);
  const [{ appSettings, rtl_support }, dispatch] = useStateValue();

  const [locationData, setLocationData] = useState({
    0: [...route.params.data],
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!goBack) return;
    if (route.params.type === "search") {
      handleSearchLocationStateUpdate();
    } else if (route.params.type === "newListing") {
      handleListingLocationStateUpdate();
    }
  }, [goBack]);

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
  const handleSearchLocationStateUpdate = () => {
    if (location.length) {
      dispatch({
        type: "SET_SEARCH_LOCATIONS",
        search_locations: location,
      });
      navigation.goBack();
    } else {
      dispatch({
        type: "SET_SEARCH_LOCATIONS",
        search_locations: [],
      });
      navigation.goBack();
    }
  };
  const handleListingLocationStateUpdate = () => {
    if (location.length) {
      dispatch({
        type: "SET_LISTING_LOCATIONS",
        listing_locations: location,
      });
      navigation.goBack();
    } else {
      dispatch({
        type: "SET_LISTING_LOCATIONS",
        listing_locations: [],
      });
      navigation.goBack();
    }
  };
  const handlePickerSelection = (item) => {
    setLoading(true);
    setLocation((prevLocation) => [...prevLocation, item]);

    api.get("locations", { parent_id: item.term_id }).then((res) => {
      if (res.ok) {
        if (res.data.length) {
          setLocationData((prevLocationData) => {
            const index = Object.keys(prevLocationData).length;
            const newData = { ...prevLocationData };
            newData[index] = [...res.data];
            return newData;
          });
          setLoading(false);
        } else {
          setGoBack(true);
        }
      } else {
        // TODO
        // print error
        if (res.problem === "TIMEOUT_ERROR") {
          setErrorMessage(
            __(
              "selectLocationScreenTexts.errorMessages.timeOut",
              appSettings.lng
            )
          );
        } else {
          setErrorMessage(
            res?.data?.error_message ||
              res?.data?.error ||
              res?.problem ||
              __(
                "selectLocationScreenTexts.errorMessages.serverError",
                appSettings.lng
              )
          );
        }
        setLoading(false);
      }
    });
  };
  const handleAllOptionSelection = () => {
    setGoBack(true);
  };
  const handleWholeAreaSelection = () => {
    setGoBack(true);
  };
  const handleSelectedLocationPress = (arg) => {
    setLocation((prevLocation) => prevLocation.slice(0, arg));
    const selectedData = {};
    for (let i = 0; i <= arg; i++) {
      selectedData[i] = locationData[i];
    }
    setLocationData(selectedData);
  };
  const locationPicker = (index) => {
    if (location.length < index) return;
    return (
      <View key={index}>
        {location[index] && (
          <TouchableOpacity
            style={[styles.selectedOptionsWrap, rtlView]}
            disabled={loading}
            onPress={() => handleSelectedLocationPress(index)}
          >
            <Text style={[styles.selectedOptionsText, rtlText]}>
              {location[index]
                ? decodeString(location[index].name)
                : __(
                    "selectLocationScreenTexts.nextLevelLocation",
                    appSettings.lng
                  )}
            </Text>
            <FontAwesome5 name="times" size={16} color={COLORS.gray} />
          </TouchableOpacity>
        )}
        {location.length === 0 &&
          !location[index] &&
          !loading &&
          route.params.type === "search" && (
            <TouchableOpacity
              disabled={loading}
              style={styles.allLocationWrap}
              onPress={handleWholeAreaSelection}
            >
              <Text style={[styles.allLocationText, rtlText]}>
                {__("selectLocationScreenTexts.showAll", appSettings.lng)}
              </Text>
            </TouchableOpacity>
          )}
        {location.length > 0 &&
          !location[index] &&
          !loading &&
          route.params.type === "search" && (
            <TouchableOpacity
              style={[styles.pickerOptions, rtlView]}
              onPress={handleAllOptionSelection}
              disabled={loading}
            >
              <Text style={[styles.pickerOptionsText, rtlText]}>
                {__(
                  "selectLocationScreenTexts.showAllofLocation",
                  appSettings.lng
                )}{" "}
                {decodeString(location[index - 1].name)}
              </Text>
            </TouchableOpacity>
          )}
        {!location[index] && !loading && (
          <View style={styles.view}>
            {locationData[index].map((item) => (
              <TouchableOpacity
                key={item.term_id}
                onPress={() => handlePickerSelection(item)}
                style={[styles.pickerOptions, rtlView]}
                disabled={loading}
              >
                <Text style={[styles.pickerOptionsText, rtlText]}>
                  {decodeString(item.name)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {!location[index] && loading && (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}
        {!loading && !!errorMessage && (
          <View style={{ justifyContent: "center", alignItems: "center" }}>
            <Text style={[styles.text, rtlText]}>{errorMessage}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ backgroundColor: COLORS.white, flex: 1 }}>
      <ScrollView>
        {maximumPickerLevelArr.map((picker, index) => locationPicker(index))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  allLocationText: {
    color: COLORS.white,
    fontWeight: "bold",
  },
  allLocationWrap: {
    backgroundColor: COLORS.primary,
    paddingVertical: 5,
    alignItems: "center",
    borderRadius: 3,
    marginVertical: 15,
    marginHorizontal: "3%",
  },
  container: {
    backgroundColor: COLORS.white,
  },
  loading: {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.8,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
    flex: 1,
  },

  pickerOptions: {
    paddingVertical: 15,
    borderBottomColor: COLORS.bg_dark,
    borderBottomWidth: 1.5,
    marginHorizontal: "3%",
  },
  pickerOptionsText: {
    color: COLORS.text_gray,
    fontWeight: "bold",
  },
  scrollContainer: {},
  selectedOptionsText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "bold",
  },
  selectedOptionsWrap: {
    paddingVertical: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: "3%",
    backgroundColor: COLORS.bg_dark,
  },
});

export default SelectLocationScreen;
