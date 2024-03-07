import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  Linking,
  Alert,
  ActivityIndicator,
  Share,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import moment from "moment-timezone";
import "moment/locale/en-gb";
import ReadMore from "react-native-read-more-text";
import ReactNativeZoomableView from "@openspacelabs/react-native-zoomable-view/src/ReactNativeZoomableView";
import MapView, { Marker, UrlTile } from "react-native-maps";
import YoutubePlayer from "react-native-youtube-iframe";
import { Formik } from "formik";
import * as Yup from "yup";
import { paginationData } from "../app/pagination/paginationData";
import WebView from "react-native-webview";
import {
  FontAwesome5,
  FontAwesome,
  Ionicons,
  MaterialIcons,
  Entypo,
  Feather,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import ListingHeader from "../components/ListingHeader";
import { COLORS } from "../variables/color";
import AppSeparator from "../components/AppSeparator";
import SimilarAdFlatList from "../components/SimilarAdFlatList";
import SellerContact from "../components/SellerContact";
import { useStateValue } from "../StateProvider";
import api, { setAuthToken, removeAuthToken } from "../api/client";
import { getPrice, decodeString } from "../helper/helper";
import Badge from "../components/Badge";
import AppButton from "../components/AppButton";
import AppTextButton from "../components/AppTextButton";
import { getRelativeTimeConfig, __ } from "../language/stringPicker";
import FlashNotification from "../components/FlashNotification";
import { admobConfig } from "../app/services/adMobConfig";
import { routes } from "../navigation/routes";
import TotalRating from "../components/TotalRating";
import AdmobBanner from "../components/AdmobBanner";
import CategoryIcon from "../components/CategoryIcon";
import { useIsFocused } from "@react-navigation/native";
import { miscConfig } from "../app/services/miscConfig";

const { width: windowWidth, height: windowHeight } = Dimensions.get("window");
const { height: screenHeight } = Dimensions.get("screen");

const ListingDetailScreen = ({ route, navigation }) => {
  const [{ user, auth_token, config, ios, appSettings, rtl_support }] =
    useStateValue();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentSlideZoom, setCurrentSlideZoom] = useState(0);
  const [badgeDim, setBadgeDim] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [listingData, setListingData] = useState();
  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [moreloading, setMoreLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(
    pagination.current_page || paginationData.rating.page
  );
  const [favoriteDisabled, setFavoriteDisabled] = useState(false);
  const [imageViewer, setImageViewer] = useState(false);
  const [viewingImage, setViewingImage] = useState();
  const [mapType, setMapType] = useState("standard");
  const [playing, setPlaying] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [flashNotification, setFlashNotification] = useState(false);
  const [flashNotificationMessage, setFlashNotificationMessage] = useState();
  const [today, setToday] = useState(new Date().getDay());
  const [now, setNow] = useState(
    new Date().getHours() + ":" + new Date().getMinutes()
  );
  const [ratingShown, setRatingShown] = useState(false);
  const [formShown, setFormShown] = useState(false);
  const [admobError, setAdmobError] = useState(false);
  const [validationSchema, setValidationSchema] = useState(
    config?.review?.rating
      ? Yup.object().shape({
          author_name: Yup.string().required(
            __("listingDetailScreenTexts.formLabels.name", appSettings.lng) +
              " " +
              __(
                "listingDetailScreenTexts.formValidation.required",
                appSettings.lng
              )
          ),
          author_email: Yup.string()
            .required(
              __("listingDetailScreenTexts.formLabels.email", appSettings.lng) +
                " " +
                __(
                  "listingDetailScreenTexts.formValidation.required",
                  appSettings.lng
                )
            )
            .email(
              __("listingDetailScreenTexts.formLabels.email", appSettings.lng) +
                " " +
                __(
                  "listingDetailScreenTexts.formValidation.invalid",
                  appSettings.lng
                )
            ),
          rating: Yup.number()
            .required(
              __(
                "listingDetailScreenTexts.formLabels.rating",
                appSettings.lng
              ) +
                " " +
                __(
                  "listingDetailScreenTexts.formValidation.required",
                  appSettings.lng
                )
            )
            .positive()
            .integer(),
          title: Yup.string().required(
            __("listingDetailScreenTexts.formLabels.title", appSettings.lng) +
              " " +
              __(
                "listingDetailScreenTexts.formValidation.required",
                appSettings.lng
              )
          ),
          content: Yup.string().required(
            __("listingDetailScreenTexts.formLabels.review", appSettings.lng) +
              " " +
              __(
                "listingDetailScreenTexts.formValidation.required",
                appSettings.lng
              )
          ),
        })
      : Yup.object().shape({
          author_name: Yup.string().required(
            __("listingDetailScreenTexts.formLabels.name", appSettings.lng) +
              " " +
              __(
                "listingDetailScreenTexts.formValidation.required",
                appSettings.lng
              )
          ),
          author_email: Yup.string()
            .required(
              __("listingDetailScreenTexts.formLabels.email", appSettings.lng) +
                " " +
                __(
                  "listingDetailScreenTexts.formValidation.required",
                  appSettings.lng
                )
            )
            .email(
              __("listingDetailScreenTexts.formLabels.email", appSettings.lng) +
                " " +
                __(
                  "listingDetailScreenTexts.formValidation.invalid",
                  appSettings.lng
                )
            ),
          title: Yup.string().required(
            __("listingDetailScreenTexts.formLabels.title", appSettings.lng) +
              " " +
              __(
                "listingDetailScreenTexts.formValidation.required",
                appSettings.lng
              )
          ),
          content: Yup.string().required(
            __("listingDetailScreenTexts.formLabels.review", appSettings.lng) +
              " " +
              __(
                "listingDetailScreenTexts.formValidation.required",
                appSettings.lng
              )
          ),
        })
  );
  const [ratingData, setRatingData] = useState();
  // const [yelpData, setYelpData] = useState({});
  const [yelpData, setYelpData] = useState([]);
  const [floorPlanViewer, setfloorPlanViewer] = useState([]);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionOverlay, setActionOverlay] = useState(false);

  const scrollRef = useRef();
  const mapRef = useRef();
  const zoomScrollView = useRef();
  const isFocused = useIsFocused();

  // Initial Get Listing Data

  useEffect(() => {
    if (user) {
      setAuthToken(auth_token);
    }
    const relativeTime = getRelativeTimeConfig(appSettings.lng);
    moment.updateLocale("en-gb", {
      relativeTime: relativeTime,
    });

    api.get(`/listings/${route.params.listingId}`).then((res) => {
      if (isFocused) {
        if (res.ok) {
          if (res?.data?.floor_plan?.length) {
            const tempFPV = res?.data?.floor_plan.map(
              (fPV, index) => index === 0
            );
            setfloorPlanViewer(tempFPV);
          }
          if (res?.data?.yelp_categories?.length && config?.yelp) {
            if (res?.data?.contact?.locations?.length) {
              // const location = res.data.contact.locations
              //   .map((_loc) => _loc.name)
              //   .join(", ");
              // console.log("loc", res.data.contact.locations);
              // res.data.yelp_categories.map((_yc, index) => {
              //   const apiUrl = `https://api.yelp.com/v3/businesses/search?term=${_yc}&location=${location}&limit=${
              //     config.yelp.limit || 3
              //   }&sortby=${config.yelp.sortby || "rating"}&radius=${
              //     config.yelp.radius || 10000
              //   }`;
              //   fetch(apiUrl, {
              //     method: "GET",
              //     headers: {
              //       "Content-Type": "application/json",
              //       Authorization: `Bearer ${config.yelp.apiKey}`,
              //     },
              //   })
              //     .then((response) => response.json())
              //     .then((data) => {
              //       console.log(data);
              //       // setYelpData((prevYD) => {
              //       //   return { ...prevYD, [index]: data.business };
              //       // });
              //       // const tempArr = data.business;
              //       // setYelpData((prevYD) => [...prevYD, ...data.businesses]);
              //     })
              //     .catch((error) => {
              //       console.error("Error:", error);
              //     });
              // });
            } else if (
              res?.data?.contact?.latitude &&
              res?.data?.contact?.longitude
            ) {
              res.data.yelp_categories.map((_yc, index) => {
                fetch(
                  `https://api.yelp.com/v3/businesses/search?term=${_yc}&latitude=${
                    res.data.contact.latitude || 0
                  }&longitude=${res.data.contact.longitude || 0}&limit=${
                    config.yelp.limit || 3
                  }&sortby=${config.yelp.sortby || "rating"}&radius=${
                    config.yelp.radius || 10000
                  }`,
                  {
                    method: "GET",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${config.yelp.apiKey}`,
                    },
                  }
                )
                  .then((response) => response.json())
                  .then((data) => {
                    // setYelpData((prevYD) => {
                    //   return { ...prevYD, [index]: data.business };
                    // });
                    setYelpData((prevYD) => [...prevYD, ...data.businesses]);
                  })
                  .catch((error) => {
                    console.error("Error:", error);
                  });
              });
            }
          }
          if (!!res?.data?.bh?.special_bhs?.length) {
            let tempListingData = { ...res.data };
            let tempbhs = { ...res.data.bh.bhs };
            const tempsbhs = [...res.data.bh.special_bhs];
            const dataArr = tempsbhs.filter(
              (_sbhObj) =>
                moment(_sbhObj.date, "YYYY-MM-DD")._i ==
                moment(new Date()).format("YYYY-MM-DD")
            );
            if (dataArr.length) {
              const tempReplacingObj = dataArr[dataArr.length - 1];
              tempbhs[new Date().getDay()] = tempReplacingObj;
            }
            const tempBH = { bhs: tempbhs, special_bhs: tempsbhs };
            tempListingData.bh = tempBH;
            setListingData(tempListingData);
          } else {
            setListingData(res.data);
          }

          removeAuthToken();
          setLoading(false);
        } else {
          // print error
          // TODO handle error
          removeAuthToken();
          setLoading(false);
        }
      }
    });

    getComments(paginationData.rating);
  }, [route.params.listingId]);

  useEffect(() => {
    if (viewingImage) {
      ppp(viewingImage - 1);
    }
  }, [viewingImage]);

  const ppp = (arg) => {
    setTimeout(() => {
      zoomScrollView.current.scrollTo({
        x: windowWidth * arg,
        y: 0,
        animated: true,
        duration: 100,
      });
    }, 30);
  };

  const getComments = (args) => {
    api
      .get("/reviews", { listing: route.params.listingId, ...args })
      .then((res) => {
        if (isFocused) {
          if (res.ok) {
            if (moreloading) {
              setRatingData((prevRD) => [...prevRD, ...res.data.data]);
            } else {
              setRatingData(res.data.data);
            }
            if (res.data.pagination) {
              setPagination(res.data.pagination);
            }
          } else {
            // TODO error handling
          }
        }
      })
      .then(() => {
        if (moreloading && isFocused) {
          setMoreLoading(false);
        }
      });
  };

  useEffect(() => {
    if (!moreloading) {
      return;
    }

    let tempArgs = { ...pagination };
    pagination.current_page = currentPage + 1;
    getComments(tempArgs);
  }, [moreloading]);

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
  const handleScroll = (e) => {
    if (playing) {
      setPlaying(false);
    }
    setCurrentSlide(Math.round(e.nativeEvent.contentOffset.x / windowWidth));
  };
  const handleScrollZoom = (e) => {
    if (playing) {
      setPlaying(false);
    }
    setCurrentSlideZoom(
      Math.round(e.nativeEvent.contentOffset.x / windowWidth)
    );
  };
  const handleChatLoginAlert = () => {
    Alert.alert(
      "",
      __("listingDetailScreenTexts.chatLoginAlert", appSettings.lng),
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
  const handleEmailLoginAlert = () => {
    Alert.alert(
      "",
      __("listingDetailScreenTexts.emailLoginAlert", appSettings.lng),
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
  const getLocation = (contact) => {
    let locationData;
    if (config.location_type === "local") {
      locationData =
        contact?.locations?.map((item) => item?.name).join(", ") || "";
      return contact?.address
        ? locationData + ", " + decodeString(contact.address)
        : locationData;
    }
    if (config.location_type === "geo") {
      return decodeString(contact?.geo_address) || "";
    }
  };

  const handleFavourite = () => {
    setFavLoading(true);
    setFavoriteDisabled((favoriteDisabled) => true);
    setAuthToken(auth_token);
    api
      .post("my/favourites", { listing_id: listingData.listing_id })
      .then((res) => {
        if (res.ok) {
          const newListingData = { ...listingData };
          newListingData.is_favourite = res.data.includes(
            listingData.listing_id
          );
          setListingData(newListingData);
          setFavLoading(false);
          setFavoriteDisabled((favoriteDisabled) => false);
          removeAuthToken();
        } else {
          // print error
          // TODO handle error
          handleError(
            res?.data?.error_message || res?.data?.error || res?.problem
          );
          setFavLoading(false);
          setFavoriteDisabled((favoriteDisabled) => false);
          removeAuthToken();
          // setLoading(false);
        }
      });
  };
  const renderTruncatedFooter = (handleDescriptionToggle) => {
    return (
      <Text
        style={{
          color: COLORS.text_gray,
          marginTop: 10,
          fontWeight: "bold",
          textAlign: "center",
        }}
        onPress={handleDescriptionToggle}
      >
        {__("listingDetailScreenTexts.showMore", appSettings.lng)}
      </Text>
    );
  };
  const renderRevealedFooter = (handleDescriptionToggle) => {
    return (
      <Text
        style={{
          color: COLORS.text_gray,
          marginTop: 10,
          fontWeight: "bold",
          textAlign: "center",
        }}
        onPress={handleDescriptionToggle}
      >
        {__("listingDetailScreenTexts.showLess", appSettings.lng)}
      </Text>
    );
  };
  const handleChat = () => {
    if (playing) {
      setPlaying(false);
    }
    const data = {
      id: listingData.listing_id,
      title: listingData.title,
      images: listingData.images,
      category: listingData.categories,
      location: listingData.contact.locations,
    };
    user !== null && user.id !== listingData.author_id
      ? navigation.navigate(routes.chatScreen, {
          listing: data,
          from: "listing",
          listing_id: listingData.listing_id,
        })
      : handleChatLoginAlert();
  };

  const handleEmail = () => {
    if (playing) {
      setPlaying(false);
    }

    const data = {
      id: listingData.listing_id,
      title: listingData.title,
    };
    if (user !== null && user.id !== listingData.author_id) {
      navigation.navigate(routes.sendEmailScreen, {
        listing: data,
        source: "listing",
      });
    } else {
      handleEmailLoginAlert();
    }
  };

  const getCheckboxValue = (field) => {
    const checkBoxValue = field.value.map(
      (value) =>
        field.options.choices.filter((choice) => choice.id == value)[0]?.name ||
        __("listingDetailScreenTexts.deletedValue", appSettings.lng)
    );
    return decodeString(checkBoxValue.filter((_val) => !!_val).join(", "));
  };

  const getSellerName = () => {
    if (!!listingData.author.first_name || !!listingData.author.last_name) {
      return decodeString(
        listingData.author.first_name + " " + listingData.author.last_name
      );
    } else {
      return decodeString(listingData.author.username);
    }
  };

  const handleImageZoomView = (ind) => {
    setViewingImage(ind + 1);
    setTimeout(() => {
      setImageViewer(true);
    }, 10);
  };

  const handleImageViewerClose = () => {
    setImageViewer(false);
    setViewingImage();
  };

  const getRangeField = (field) => {
    if (!!field.value.start || !!field.value.end) {
      return true;
    } else return false;
  };

  const closeCallModal = () => {
    setModalVisible(false);
  };

  const getAddress = (contact) => {
    if (!contact) return "";
    const address = [];
    if (config?.location_type === "local") {
      if (contact?.address) {
        address.push(contact.address);
      }
      if (contact?.zipcode) {
        address.push(contact.zipcode);
      }
      if (contact?.locations?.length) {
        contact.locations.map((loc) => {
          address.push(loc.name);
        });
      }
    } else {
      if (contact?.geo_address) {
        address.push(contact.geo_address);
      }
    }

    return address.length ? decodeString(address.join(", ")) : "";
  };

  const handleMapTypeChange = () => {
    if (mapType == "standard") {
      setMapType("hybrid");
    } else {
      setMapType("standard");
    }
  };

  const getCustomFields = () => {
    return listingData?.custom_fields?.filter((_field) => !!_field?.value)
      ?.length
      ? true
      : false;
  };

  const handleStorePress = () => {
    if (playing) {
      setPlaying(false);
    }
    navigation.push(routes.storeDetailsScreen, {
      storeId: listingData.store.id,
    });
  };

  const getListingTime = () => {
    let resultTime = "";
    if (config?.tz) {
      if (config.tz?.timezone_type == 1) {
        resultTime = moment
          .parseZone(listingData.created_at + config.tz.timezone)
          .fromNow();
      } else if (config.tz?.timezone_type == 3) {
        resultTime = moment
          .tz(listingData.created_at, config.timezone.timezone)
          .fromNow();
      }
    } else {
      // TODO:  This method will be depricated from app and plugin in future version (3.0)
      resultTime = moment(listingData.created_at, "YYYY-MM-DD").fromNow();
    }
    return resultTime;
  };

  const getTotalSlideCount = () => {
    return listingData.images.length;
    // if (!listingData?.video_urls?.length) {
    //   return listingData.images.length;
    // }
    // if (!listingData?.images?.length) {
    //   return listingData.video_urls.length;
    // }
    // return listingData.images.length + listingData.video_urls.length;
  };

  const get_sanitized_embed_url = (url) => {
    const regExp =
      /^https?\:\/\/(?:www\.youtube(?:\-nocookie)?\.com\/|m\.youtube\.com\/|youtube\.com\/)?(?:ytscreeningroom\?vi?=|youtu\.be\/|vi?\/|user\/.+\/u\/\w{1,2}\/|embed\/|watch\?(?:.*\&)?vi?=|\&vi?=|\?(?:.*\&)?vi?=)([^#\&\?\n\/<>"']*)/i;
    const match = url.match(regExp);
    const ytId = match && match[1].length === 11 ? match[1] : null;

    if (ytId) {
      return (
        <View key={ytId}>
          <YoutubePlayer
            webViewStyle={{ opacity: 0.99 }}
            height={(windowWidth * 9) / 16}
            width={windowWidth}
            play={playing}
            videoId={ytId}
            onChangeState={onStateChange}
            forceAndroidAutoplay={false}
            initialPlayerParams={{
              showClosedCaptions: false,
              // controls: false,
              loop: false,
              cc_lang_pref: "en",
              modestbranding: 1,
              rel: false,
            }}
          />
        </View>
      );
    }

    return null;
  };

  const onStateChange = useCallback((state) => {
    if (state === "playing") {
      setPlaying(true);
    }
  }, []);
  const handleReport = () => {
    closeActionModal();
    if (playing) {
      setPlaying(false);
    }
    navigation.navigate(routes.reportScreen, {
      listingId: listingData.listing_id,
      listingTitle: listingData.title,
    });
  };

  const handleSocialProfileClick = (_profile) => {
    Linking.openURL(listingData.social_profiles[_profile]);
  };

  const handleError = (message) => {
    setFlashNotificationMessage((prevFlashNotificationMessage) => message);
    setTimeout(() => {
      setFlashNotification((prevFlashNotification) => true);
    }, 5);
    setTimeout(() => {
      setFlashNotification((prevFlashNotification) => false);
      setFlashNotificationMessage();
    }, 1200);
  };

  const BHDayComponent = ({ day, index, dataArr }) => (
    <View
      style={[
        styles.bHDayWrap,
        {
          borderBottomWidth: dataArr.length - 1 === index ? 0 : 1,
        },
        rtlView,
      ]}
    >
      <View
        style={[
          styles.dayNameWrap,
          {
            borderRightWidth: rtl_support ? 0 : 1,
            borderLeftWidth: rtl_support ? 1 : 0,
            alignItems: rtl_support ? "flex-end" : "flex-start",
          },
        ]}
      >
        <Text style={[styles.dayName, rtlText]} numberOfLines={1}>
          {day.name}
        </Text>
      </View>
      <View style={styles.hoursSlotsWrap}>{getTimeObject(day)}</View>
    </View>
  );

  const getTimeObject = (day) => {
    const tempDayObj = listingData.bh.bhs[day.id];
    if (tempDayObj?.open) {
      if (tempDayObj?.times?.length) {
        const tempTimes = tempDayObj.times.filter(
          (_timeSlot) => !!_timeSlot.start && !!_timeSlot.end
        );
        if (tempTimes.length) {
          // Open and has valid time slot
          return tempTimes.map((_slot, index, arr) => (
            <View
              style={[
                styles.slotWrap,
                {
                  borderBottomWidth: arr.length - 1 > index ? 1 : 0,
                  borderBottomColor: COLORS.gray,
                },
                rtlView,
              ]}
              key={index}
            >
              <View
                style={[
                  styles.slotTimeWrap,
                  { alignItems: rtl_support ? "flex-end" : "flex-start" },
                ]}
              >
                <Text
                  style={[
                    styles.slotText,
                    {
                      color:
                        day.id === today &&
                        isTimeBetween(_slot.start, _slot.end, now)
                          ? COLORS.green
                          : COLORS.text_gray,
                    },
                    rtlText,
                  ]}
                >
                  {moment(_slot.start, "HH:mm").format(
                    config.datetime_fmt.time
                  )}
                </Text>
              </View>
              <View
                style={[
                  styles.slotTimeWrap,
                  {
                    borderLeftColor: COLORS.gray,
                    borderLeftWidth: rtl_support ? 0 : 1,
                    borderRightWidth: rtl_support ? 1 : 0,
                    alignItems: rtl_support ? "flex-end" : "flex-start",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.slotText,
                    {
                      color:
                        day.id === today &&
                        isTimeBetween(_slot.start, _slot.end, now)
                          ? COLORS.green
                          : COLORS.text_gray,
                    },
                    rtlText,
                  ]}
                >
                  {moment(_slot.end, "HH:mm").format(config.datetime_fmt.time)}
                </Text>
              </View>
            </View>
          ));
        }
        // Open and all slots are invalid
        return (
          <View style={[styles.slotWrap, rtlView]}>
            <Text
              style={[
                styles.slotText,
                { color: day.id === today ? COLORS.green : COLORS.text_gray },
                rtlText,
              ]}
            >
              {day.id === today
                ? __(
                    "listingDetailScreenTexts.bHTexts.openTodayText",
                    appSettings.lng
                  )
                : __(
                    "listingDetailScreenTexts.bHTexts.openText",
                    appSettings.lng
                  )}
            </Text>
          </View>
        );
      }
      // Full day open
      return (
        <View style={[styles.slotWrap, rtlView]}>
          <Text
            style={[
              styles.slotText,
              { color: day.id === today ? COLORS.green : COLORS.text_gray },
              rtlText,
            ]}
          >
            {day.id === today
              ? __(
                  "listingDetailScreenTexts.bHTexts.openTodayText",
                  appSettings.lng
                )
              : __(
                  "listingDetailScreenTexts.bHTexts.openText",
                  appSettings.lng
                )}
          </Text>
        </View>
      );
    }
    // Full day closed
    return (
      <View style={[styles.slotWrap, rtlView]}>
        <Text
          style={[
            styles.slotText,
            { color: day.id === today ? COLORS.red : COLORS.text_gray },
            rtlText,
          ]}
        >
          {day.id === today
            ? __(
                "listingDetailScreenTexts.bHTexts.closeTodayText",
                appSettings.lng
              )
            : __("listingDetailScreenTexts.bHTexts.closeText", appSettings.lng)}
        </Text>
      </View>
    );
  };

  const getCurrentStatus = () => {
    const tempDay = listingData?.bh?.bhs[today];

    if (tempDay.open) {
      if (tempDay?.times?.length) {
        const tempTimes = tempDay.times.filter(
          (_timeSlot) => !!_timeSlot.start && !!_timeSlot.end
        );
        if (tempTimes.length) {
          if (
            tempTimes.filter((_tempSlot) =>
              isTimeBetween(_tempSlot.start, _tempSlot.end, now)
            ).length
          ) {
            return (
              <Text
                style={[styles.currentStatus, { color: COLORS.green }, rtlText]}
              >
                {__(
                  "listingDetailScreenTexts.bHTexts.currentStatusOpen",
                  appSettings.lng
                )}
              </Text>
            );
          } else {
            return (
              <Text
                style={[styles.currentStatus, { color: COLORS.red }, rtlText]}
              >
                {__(
                  "listingDetailScreenTexts.bHTexts.currentStatusClose",
                  appSettings.lng
                )}
              </Text>
            );
          }
        }
        // Open and all slots are invalid
        return (
          <Text
            style={[styles.currentStatus, { color: COLORS.green }, rtlText]}
          >
            {__(
              "listingDetailScreenTexts.bHTexts.currentStatusOpen",
              appSettings.lng
            )}
          </Text>
        );
      }
      // Full day open
      return (
        <Text style={[styles.currentStatus, { color: COLORS.green }, rtlText]}>
          {__(
            "listingDetailScreenTexts.bHTexts.currentStatusOpen",
            appSettings.lng
          )}
        </Text>
      );
    }
    // Full day closed
    return (
      <Text style={[styles.currentStatus, { color: COLORS.red }, rtlText]}>
        {__(
          "listingDetailScreenTexts.bHTexts.currentStatusClose",
          appSettings.lng
        )}
      </Text>
    );
  };

  const isTimeBetween = function (startTime, endTime, now) {
    let start = moment(startTime, "HH:mm");
    let end = moment(endTime, "HH:mm");
    let time = moment(now, "HH:mm");
    // if (end < start) {
    //   return (
    //     (time >= start && time <= moment("23:59:59", "h:mm:ss")) ||
    //     (time >= moment("0:00:00", "h:mm:ss") && time < end)
    //   );
    // }
    return time >= start && time < end;
  };

  const onShare = async () => {
    // closeActionModal();
    const tempShare = ios
      ? { url: listingData.url }
      : { message: listingData.url };
    try {
      const result = await Share.share(tempShare);
      if (result.action === Share.sharedAction) {
        // if (result.activityType) {
        // } else {
        // }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleWhatsapp = () => {
    if (playing) {
      setPlaying(false);
    }

    if (user === null && config?.registered_only?.listing_contact) {
      handleLoginAlert();
    } else {
      Linking.openURL(
        "http://api.whatsapp.com/send?phone=" +
          listingData.contact.whatsapp_number
      );
    }
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

  const handleMarkerPress = (e) => {
    const scheme = Platform.select({
      ios: "maps://0,0?q=",
      android: "geo:0,0?q=",
    });
    const latLng = `${e.nativeEvent.coordinate.latitude},${e.nativeEvent.coordinate.longitude}`;
    const label = listingData.title;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });
    Linking.openURL(url);
  };

  const handleHeaderLayout = (e) => {
    setBadgeDim(e.nativeEvent.layout);
  };

  const toggleRatings = () => {
    setRatingShown((prevRS) => !prevRS);
  };

  const handleRating = (fn, val, current) => {
    if (val === current) return;
    fn("rating", val);
  };

  const handleReview = (values) => {
    setPosting(true);
    const tempArgs = { ...values, listing: route.params.listingId };
    if (!config?.review?.rating) {
      delete tempArgs.rating;
    }
    if (user) {
      setAuthToken(auth_token);
    }
    api
      .post("reviews", tempArgs)
      .then((res) => {
        if (res.ok) {
          if (res?.data?.status === "approved") {
            setRatingData((prevRatingData) => [...prevRatingData, res.data]);
            alert(
              __("listingDetailScreenTexts.reviewApproved", appSettings.lng)
            );
          } else {
            alert(__("listingDetailScreenTexts.reviewNotice", appSettings.lng));
          }
        } else {
          alert(
            res?.data?.message ||
              res?.data?.error_message ||
              res?.data?.error ||
              res?.problem
          );
        }
      })
      .then(() => {
        if (user) {
          removeAuthToken();
        }
        setPosting(false);
      });
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

  const html_script = `

<!DOCTYPE html>
<html>
<head>

	<title>Quick Start - Leaflet</title>

	<meta charset="utf-8" />
	<meta name="viewport" content="initial-scale=1.0">

	<link rel="shortcut icon" type="image/x-icon" href="docs/images/favicon.ico" />

    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.6.0/dist/leaflet.css" integrity="sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ==" crossorigin=""/>
    <script src="https://unpkg.com/leaflet@1.6.0/dist/leaflet.js" integrity="sha512-gZwIG9x3wUXg2hdXF6+rVkLF/0Vi9U8D2Ntg4Ga5I5BZpVkVxlJWbSQtXPSiUTtC0TjtGOmxa1AJPuV0CPthew==" crossorigin=""></script>

</head>
<body style="padding: 0; margin: 0">

<div id="map" style="width: 100%; height: 100vh;"></div>
<script>

var osmLayer = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }
);
var map = L.map('map', {
  zoom: 10,
  maxZoom: 18,
  center: [${
    listingData?.contact?.latitude || config?.map?.center?.lat || 0
  }, ${listingData?.contact?.longitude || config?.map?.center?.lng || 0}],
  layers: [osmLayer],
  dragging:false
});

const marker = L.marker([${
    listingData?.contact?.latitude || config?.map?.center?.lat || 0
  }, ${
    listingData?.contact?.longitude || config?.map?.center?.lng || 0
  }], { draggable: false }).addTo(map);
marker.setPopupContent("Address jhfashf asdjhfskjhdfk").openPopup();

</script>

</body>
</html>

`;

  const CustomField = ({ item }) => (
    <View
      style={[
        {
          justifyContent: "flex-start",
          alignItems: "center",
          width: (windowWidth * 0.94 - 10) / 4, //23%
          paddingTop: 10,
          paddingHorizontal: 5,
          borderRadius: 6,
          marginBottom: windowWidth * 0.03,
        },
      ]}
    >
      <View
        style={[
          {
            height: windowWidth * 0.15,
            width: windowWidth * 0.15,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: COLORS.bg_primary,
            borderRadius: windowWidth * 0.08,
          },
        ]}
      >
        <CategoryIcon
          iconName={
            item.icon.trim().includes("flaticon-")
              ? item.icon.trim().slice(9)
              : item.icon
          }
          // iconName={item.icon.slice(9)}
          iconSize={windowWidth / 15}
          iconColor={COLORS.primary}
        />
      </View>

      <Text
        numberOfLines={1}
        style={{ textAlign: "center", marginTop: 10, fontWeight: "bold" }}
      >
        {decodeString(item.label)}
      </Text>
      <Text
        // numberOfLines={1}
        style={{
          textAlign: "center",
          marginTop: 5,
          marginBottom: 5,
          fontSize: 13,
          color: COLORS.text_gray,
        }}
      >
        {getCustomFielValue(item)}
      </Text>
    </View>
  );

  const getCustomFielValue = (field) => {
    if (["text", "textarea"].includes(field.type) && field?.value !== "null") {
      return (
        decodeString(field?.value) ||
        __("listingDetailScreenTexts.deletedValue", appSettings.lng)
      );
    } else if (["url", "number"].includes(field.type)) {
      return (
        field?.value ||
        __("listingDetailScreenTexts.deletedValue", appSettings.lng)
      );
    } else if (["radio", "select"].includes(field.type)) {
      if (
        !!field.value &&
        !!field.options.choices.filter((choice) => choice.id == field.value)
          .length
      ) {
        return (
          decodeString(
            field.options.choices.filter(
              (choice) => choice.id == field.value
            )[0].name
          ) || __("listingDetailScreenTexts.deletedValue", appSettings.lng)
        );
      } else {
        return __("listingDetailScreenTexts.deletedValue", appSettings.lng);
      }
    } else if (field.type === "checkbox") {
      const checkBoxValue = field.value.map(
        (value) =>
          field.options.choices.filter((choice) => choice.id == value)[0]
            ?.name ||
          __("listingDetailScreenTexts.deletedValue", appSettings.lng)
      );
      return decodeString(checkBoxValue.filter((_val) => !!_val).join(", "));
    } else if (field.type === "date") {
      if (field.date.type === "date") {
        return (
          field?.value ||
          __("listingDetailScreenTexts.deletedValue", appSettings.lng)
        );
      } else if (field.date.type === "date_time") {
        field?.value ||
          __("listingDetailScreenTexts.deletedValue", appSettings.lng);
      } else if (field.date.type === "date_range") {
        __(
          "listingDetailScreenTexts.custom_fields.date_range.start",
          appSettings.lng
        ) +
          field.value.start +
          "\n" +
          __(
            "listingDetailScreenTexts.custom_fields.date_range.end",
            appSettings.lng
          ) +
          field.value.end ||
          __("listingDetailScreenTexts.deletedValue", appSettings.lng);
      } else if (field.date.type === "date_time_range") {
        __(
          "listingDetailScreenTexts.custom_fields.date_time_range.start",
          appSettings.lng
        ) +
          field.value.start +
          "\n" +
          __(
            "listingDetailScreenTexts.custom_fields.date_time_range.end",
            appSettings.lng
          ) +
          field.value.end ||
          __("listingDetailScreenTexts.deletedValue", appSettings.lng);
      }
    } else console.log("=", field.type);
  };

  const handleFloorPlanViewerToggle = (itemIndex) => {
    const tempFPVArr = floorPlanViewer.map((item, index, arr) => {
      if (arr[itemIndex] === true) {
        return false;
      } else {
        return index === itemIndex;
      }
    });
    setfloorPlanViewer(tempFPVArr);
  };

  const onAdmobError = (error) => {
    setAdmobError(true);
  };

  const closeActionModal = () => {
    setActionModalVisible(false);
  };

  const onAction = () => {
    setActionModalVisible(true);
  };

  const onBlockUserAlert = () => {
    Alert.alert(
      "",
      __("listingDetailScreenTexts.blockUserAlert", appSettings.lng),
      [
        {
          text: __(
            "listingDetailScreenTexts.blockUserCancelBtn",
            appSettings.lng
          ),
        },
        {
          text: __(
            "listingDetailScreenTexts.blockUserConfirmBtn",
            appSettings.lng
          ),
          onPress: onBlockUserConfirm,
        },
      ]
    );
  };

  const onBlockUserConfirm = () => {
    setActionOverlay(true);
    setActionModalVisible(false);
    setAuthToken(auth_token);
    api
      .post("privacy/user/block", {
        user_id: listingData?.author_id,
      })
      .then((res) => {
        if (res?.ok) {
          handleSuccess(
            __(
              "listingDetailScreenTexts.blockUserSuccessMessage",
              appSettings.lng
            )
          );
        } else {
          handleError(res?.data?.message || res?.data?.error || res?.problem);
          setActionOverlay(false);
        }
      });
  };
  const onHideListingAlert = () => {
    Alert.alert(
      "",
      __("listingDetailScreenTexts.blockAdAlert", appSettings.lng),
      [
        {
          text: __(
            "listingDetailScreenTexts.blockAdCancelBtn",
            appSettings.lng
          ),
        },
        {
          text: __(
            "listingDetailScreenTexts.blockAdConfirmBtn",
            appSettings.lng
          ),
          onPress: onHideListingConfirm,
        },
      ]
    );
  };

  const onHideListingConfirm = () => {
    setActionOverlay(true);
    setActionModalVisible(false);
    setAuthToken(auth_token);
    api
      .post("privacy/listing/block", {
        listing_id: listingData?.listing_id || route.params.listingId,
      })
      .then((res) => {
        if (res?.ok) {
          handleSuccess(
            __(
              "listingDetailScreenTexts.blockAdSuccessMessage",
              appSettings.lng
            )
          );
        } else {
          handleError(res?.data?.message || res?.data?.error || res?.problem);
          setActionOverlay(false);
        }
      });
  };

  const handleSuccess = (message) => {
    setFlashNotificationMessage(message);
    setTimeout(() => {
      setFlashNotification(true);
    }, 10);
    setTimeout(() => {
      setFlashNotification(false);
      setFlashNotificationMessage("");
      navigation.replace(routes.drawerNavigator);
    }, 1200);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={ios ? "padding" : "height"}
      keyboardVerticalOffset={15}
    >
      {/* Page Header */}
      <ListingHeader
        onBack={() => navigation.goBack()}
        onFavorite={handleFavourite}
        author={listingData ? listingData.author_id : null}
        is_favourite={listingData ? listingData.is_favourite : null}
        favoriteDisabled={favoriteDisabled || loading}
        style={{
          backgroundColor: COLORS.primary,
          // position: "absolute", zIndex: 2, top: 0, left: 0, right: 0
        }}
        favLoading={favLoading}
        sharable={!!listingData?.url}
        reportable={user !== null && user.id !== listingData?.author_id}
        onAction={onAction}
        loading={loading}
      />
      {/* Loading Component */}
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.text, rtlText]}>
            {__("listingDetailScreenTexts.loadingText", appSettings.lng)}
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View
            style={{
              backgroundColor: COLORS.white,
              flex: 1,
            }}
          >
            {/* main scrollview */}
            <ScrollView
              bounces={false}
              contentContainerStyle={styles.container}
              ref={scrollRef}
              // scrollEnabled={false}
            >
              {/* Sold out badge */}
              {listingData?.badges?.includes("is-sold") && badgeDim ? (
                <View
                  style={{
                    backgroundColor: COLORS.primary,
                    height: badgeDim.height * 1.1,
                    width: badgeDim.width * 2,
                    position: "absolute",
                    // top: 0,
                    right: 0,
                    transform: [
                      {
                        translateX:
                          badgeDim.width / 2 + (badgeDim.height * 1.1) / 2,
                      },
                      {
                        translateY: badgeDim.width / 2 - badgeDim.height * 1.1,
                      },
                      { rotate: "45deg" },
                    ],
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 5,
                  }}
                >
                  <Text style={styles.soldOutMessage}>
                    {__(
                      "listingDetailScreenTexts.soldOutMessage",
                      appSettings.lng
                    )}
                  </Text>
                </View>
              ) : (
                <View
                  onLayout={(event) => handleHeaderLayout(event)}
                  style={[
                    styles.soldOutBadge,
                    {
                      top: !ios
                        ? screenHeight - windowHeight
                          ? "3%"
                          : "3.5%"
                        : "4%",

                      left: ios ? "73%" : "73%",
                      width: "35%",
                      // elevation: 2,
                      opacity: 0,
                    },
                  ]}
                >
                  <Text style={styles.soldOutMessage}>
                    {__(
                      "listingDetailScreenTexts.soldOutMessage",
                      appSettings.lng
                    )}
                  </Text>
                </View>
              )}
              {/* Media Slider */}
              {!!listingData?.images?.length && (
                // ||
                //   !!listingData?.video_urls?.length
                <View style={styles.imageSlider}>
                  <ScrollView
                    horizontal
                    pagingEnabled
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    showsHorizontalScrollIndicator={false}
                  >
                    {/* {!!listingData?.video_urls?.length &&
                      listingData.video_urls.map((url) =>
                        get_sanitized_embed_url(url)
                      )} */}

                    {listingData.images.map((image, ind) => (
                      <TouchableWithoutFeedback
                        key={image.ID}
                        onPress={() => handleImageZoomView(ind)}
                      >
                        <Image
                          style={{
                            width: windowWidth,
                            // height: 300,
                            height: windowWidth * 0.75,
                            resizeMode: "contain",
                          }}
                          source={{
                            uri: image.sizes.full.src,
                          }}
                        />
                      </TouchableWithoutFeedback>
                    ))}
                  </ScrollView>

                  {listingData?.images?.length > 1 && (
                    // ||
                    //   listingData?.video_urls?.length +
                    //     listingData?.images?.length >
                    //     1
                    <>
                      {rtl_support ? (
                        <View style={styles.scrollProgress}>
                          <Text style={styles.scrollProgressText}>
                            {getTotalSlideCount()}
                            {" / "}
                            {currentSlide + 1}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.scrollProgress}>
                          <Text style={styles.scrollProgressText}>
                            {currentSlide + 1} / {getTotalSlideCount()}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              )}

              {/* title, location, date, badges */}
              <View
                style={{
                  overflow: "hidden",
                  alignItems: rtl_support ? "flex-end" : "flex-start",
                  backgroundColor: COLORS.white,
                  paddingHorizontal: "3%",
                  width: "100%",
                  paddingTop: !!listingData?.images?.length ? 20 : 70,
                }}
              >
                {/* Title */}
                <Text style={[styles.listingTitle, rtlTextA]}>
                  {decodeString(listingData.title)}
                </Text>

                {/* Other Badges */}
                {listingData?.badges?.length > 0 && (
                  <View style={styles.badgeSection}>
                    {listingData.badges.map((_badge, index) => (
                      <Badge badgeName={_badge} key={_badge} />
                    ))}
                  </View>
                )}
                {/* Location */}
                {!!getLocation(listingData.contact) &&
                  config?.available_fields?.single_listing.includes(
                    "location"
                  ) && (
                    <View
                      style={[styles.locationData, styles.flexRow, rtlView]}
                    >
                      <View
                        style={[
                          styles.listingLocationAndTimeIconContainer,
                          {
                            alignItems: rtl_support ? "flex-end" : "flex-start",
                          },
                        ]}
                      >
                        <FontAwesome5
                          name="map-marker-alt"
                          size={15}
                          color={COLORS.text_gray}
                        />
                      </View>
                      <View
                        style={{
                          flex: 1,
                          alignItems: rtl_support ? "flex-end" : "flex-start",
                        }}
                      >
                        <Text
                          style={[styles.listingLocationAndTimeText, rtlTextA]}
                        >
                          {getLocation(listingData.contact)}
                        </Text>
                      </View>
                    </View>
                  )}

                {/* Date & Time */}
                {config?.available_fields?.single_listing.includes("date") && (
                  <View
                    style={[styles.listingTimeData, styles.flexRow, rtlView]}
                  >
                    <View
                      style={[
                        styles.listingLocationAndTimeIconContainer,
                        { alignItems: rtl_support ? "flex-end" : "flex-start" },
                      ]}
                    >
                      <FontAwesome5
                        name="clock"
                        size={15}
                        color={COLORS.text_gray}
                      />
                    </View>
                    <Text style={[styles.listingLocationAndTimeText, rtlText]}>
                      {__(
                        "listingDetailScreenTexts.postTimePrefix",
                        appSettings.lng
                      )}
                      {getListingTime()}
                    </Text>
                  </View>
                )}
              </View>
              {/* Price */}
              <View style={{ marginVertical: 10 }}>
                {listingData.pricing_type !== "disabled" &&
                  config?.available_fields?.single_listing.includes(
                    "price"
                  ) && (
                    <View
                      style={{
                        overflow: "hidden",
                        alignItems: rtl_support ? "flex-end" : "flex-start",
                        backgroundColor: COLORS.white,
                        paddingHorizontal: "3%",
                        width: "100%",
                      }}
                    >
                      <View style={styles.priceWrap}>
                        <Text
                          style={{
                            fontSize: 25,
                            fontWeight: "bold",
                            color: COLORS.text_dark,
                          }}
                        >
                          {getPrice(
                            listingData?.currency
                              ? {
                                  ...config.currency,
                                  ...listingData.currency,
                                }
                              : config.currency,
                            {
                              pricing_type: listingData.pricing_type,
                              showPriceType:
                                config?.available_fields?.single_listing.includes(
                                  "price_type"
                                ),
                              price_type:
                                config?.available_fields?.single_listing.includes(
                                  "price_type"
                                )
                                  ? listingData?.price_type
                                  : undefined,
                              price: listingData.price,
                              max_price: listingData.max_price,
                              price_unit: listingData.price_unit,
                              price_units: listingData.price_units,
                            },
                            appSettings.lng,
                            true
                          )}
                        </Text>
                      </View>
                    </View>
                  )}
              </View>

              {/* custom fields & description */}
              {(getCustomFields() || !!listingData.description) && (
                <>
                  <View
                    style={{
                      backgroundColor: COLORS.white,
                      paddingHorizontal: "3%",
                      width: "100%",
                    }}
                  >
                    {/* Custom Fields */}
                    {getCustomFields() && (
                      <>
                        <View
                          style={{
                            backgroundColor: COLORS.white,
                            width: "100%",
                            borderWidth: 1,
                            borderRadius: 10,
                            borderColor: COLORS.border_light,
                            flexDirection: "row",
                            flexWrap: "wrap",
                          }}
                        >
                          {listingData.custom_fields.map((field, index) => {
                            if (
                              field.type !== "checkbox" &&
                              field?.value &&
                              field?.value !== "null"
                            ) {
                              return (
                                <CustomField item={field} key={`${index}`} />
                              );
                            }
                          })}
                        </View>

                        {/* Features & Amenities */}
                        {listingData?.custom_fields?.map((cfChkBx, indx) => {
                          if (
                            cfChkBx.type === "checkbox" &&
                            cfChkBx?.value?.length
                          ) {
                            return (
                              <View
                                style={{
                                  backgroundColor: COLORS.white,
                                  width: "100%",
                                  paddingVertical: 20,
                                }}
                                key={`${indx}`}
                              >
                                <View
                                  style={{
                                    alignItems: rtl_support
                                      ? "flex-end"
                                      : "flex-start",
                                  }}
                                >
                                  <Text style={[styles.bHTitle, rtlText]}>
                                    {decodeString(cfChkBx.label)}
                                  </Text>
                                </View>
                                <View
                                  style={[
                                    styles.screenSeparatorWrap,
                                    { marginVertical: 10 },
                                  ]}
                                >
                                  <AppSeparator
                                    style={styles.screenSeparator}
                                  />
                                </View>

                                <View
                                  style={{
                                    flexDirection: "row",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  {cfChkBx.value.map((_val, index) => (
                                    <View
                                      key={`${index}`}
                                      style={{
                                        minWidth: (windowWidth * 0.94) / 2,
                                        flexDirection: rtl_support
                                          ? "row-reverse"
                                          : "row",
                                        alignItems: "center",
                                      }}
                                    >
                                      <View style={{ padding: 5 }}>
                                        <FontAwesome5
                                          color={COLORS.primary}
                                          size={16}
                                          name="check"
                                        />
                                      </View>
                                      <View style={{ padding: 5, flex: 1 }}>
                                        <Text
                                          style={[
                                            {
                                              color: COLORS.text_gray,
                                              fontSize: 15,
                                              fontWeight: "bold",
                                            },
                                            rtlTextA,
                                          ]}
                                        >
                                          {
                                            cfChkBx.options.choices.filter(
                                              (_ch) => _val == _ch.id
                                            )[0].name
                                          }
                                        </Text>
                                      </View>
                                    </View>
                                  ))}
                                </View>
                              </View>
                            );
                          }
                        })}
                      </>
                    )}

                    {(getCustomFields() && !!listingData.description) ||
                      (!getCustomFields() && !!listingData.description && (
                        <View
                          style={{
                            width: "100%",
                            height: 20,
                          }}
                        />
                      ))}
                    {/* Description */}
                    {!!listingData.description && (
                      <View
                        style={[
                          styles.listingDescriptionWrap,
                          {
                            marginTop: !listingData.custom_fields.length
                              ? -7
                              : 0,
                          },
                          {
                            alignItems: rtl_support ? "flex-end" : "flex-start",
                          },
                        ]}
                      >
                        <Text style={[styles.descriptionTitle, rtlText]}>
                          {__(
                            "listingDetailScreenTexts.description",
                            appSettings.lng
                          )}
                        </Text>
                        <View
                          style={{
                            backgroundColor: COLORS.bg_light,
                            borderRadius: 5,
                            paddingHorizontal: 10,
                            borderWidth: 1,
                            borderColor: COLORS.bg_dark,
                            paddingVertical: 5,
                            width: "100%",
                          }}
                        >
                          <ReadMore
                            numberOfLines={3}
                            renderTruncatedFooter={renderTruncatedFooter}
                            renderRevealedFooter={renderRevealedFooter}
                          >
                            <Text
                              style={[
                                styles.cardText,
                                rtlText,
                                {
                                  textAlign: rtl_support ? "right" : "justify",
                                },
                              ]}
                            >
                              {decodeString(listingData.description).trim()}
                            </Text>
                          </ReadMore>
                        </View>
                      </View>
                    )}
                  </View>
                </>
              )}
              {/* seller */}
              <View style={styles.bgWhite_W100_PH3}>
                {/* Seller or Store */}
                {
                  // config?.store_enabled && !!listingData?.store &&
                  <View
                    style={{
                      backgroundColor: COLORS.white,
                      borderRadius: 6,
                      elevation: 0.5,
                      shadowColor: COLORS.border_light,
                      shadowOpacity: 0.2,
                      shadowRadius: 5,
                      shadowOffset: { height: 1, width: 0 },
                      // marginBottom: 10,
                      width: "100%",
                    }}
                  >
                    <View
                      style={{
                        overflow: "hidden",
                        borderRadius: 6,
                        backgroundColor: "#white",
                      }}
                    >
                      <View>
                        <View
                          style={[
                            {
                              flexDirection: "row",
                              alignItems: "flex-start",
                              width: "100%",
                              paddingVertical: 15,
                              paddingHorizontal: "1.5%",
                            },
                            rtlView,
                          ]}
                        >
                          <View
                            style={{
                              height: 70,
                              width: 70,
                              borderRadius: 70 / 2,
                              alignItems: "center",
                              justifyContent: "center",
                              overflow: "hidden",
                              marginHorizontal: "1.5%",
                              borderWidth: listingData?.author?.pp_thumb_url
                                ? 0
                                : 0.7,
                              borderColor: COLORS.border_light,
                              backgroundColor: "red",
                            }}
                          >
                            {listingData.author.pp_thumb_url ? (
                              <Image
                                source={{
                                  uri: listingData.author.pp_thumb_url,
                                }}
                                style={{
                                  height: "100%",
                                  width: "100%",
                                  resizeMode: "contain",
                                }}
                              />
                            ) : (
                              <Ionicons
                                name="person-outline"
                                size={30}
                                color="black"
                              />
                            )}
                          </View>
                          <View
                            style={{
                              marginHorizontal: "1.5%",
                              // flex: 1,
                            }}
                          >
                            <View style={styles.view}>
                              <Text
                                style={[
                                  {
                                    fontSize: 16,
                                    color: COLORS.text_dark,
                                    fontWeight: "bold",
                                  },
                                  rtlTextA,
                                ]}
                              >
                                {config?.store_enabled && !!listingData?.store
                                  ? decodeString(listingData.store.title)
                                  : getSellerName()}
                              </Text>
                            </View>
                            {listingData?.author?.seller_verified && (
                              <View
                                style={{
                                  flexDirection: rtl_support
                                    ? "row-reverse"
                                    : "row",
                                  alignItems: "center",
                                  paddingTop: 5,
                                }}
                              >
                                <MaterialIcons
                                  name="verified"
                                  size={20}
                                  color={
                                    config?.seller_verification?.badge_color ||
                                    "green"
                                  }
                                />
                                <View style={{ paddingHorizontal: 5 }}>
                                  <Text
                                    style={[
                                      {
                                        fontSize: 15,
                                        color:
                                          config?.seller_verification
                                            ?.badge_color || "green",
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
                            {config?.store_enabled && !!listingData?.store && (
                              <View
                                style={{
                                  paddingVertical: 10,
                                  alignItems: "center",
                                }}
                              >
                                <AppButton
                                  title={__(
                                    "listingDetailScreenTexts.seeAllAds",
                                    appSettings.lng
                                  )}
                                  style={{
                                    paddingHorizontal: 10,
                                    paddingVertical: 7,
                                  }}
                                  textStyle={{ fontWeight: "normal" }}
                                  onPress={handleStorePress}
                                />
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                }
              </View>
              {/* Admob banner Component */}
              {admobConfig.admobEnabled &&
                !admobError &&
                admobConfig.singleListingScreen && (
                  <View
                    style={{
                      alignItems: "center",
                      justifyContent: "center",
                      height: 100,
                      marginTop: 20,
                    }}
                  >
                    <AdmobBanner onError={onAdmobError} />
                  </View>
                )}

              {/* Business Hours Component */}

              {!!listingData?.bh?.bhs &&
                !!Object.keys(listingData.bh.bhs).length && (
                  <View style={styles.bgWhite_W100_PH3}>
                    <View
                      style={[
                        styles.bHTitleWrap,
                        { alignItems: rtl_support ? "flex-end" : "flex-start" },
                      ]}
                    >
                      <Text style={[styles.bHTitle, rtlText]}>
                        {__(
                          "listingDetailScreenTexts.businessHoursTitle",
                          appSettings.lng
                        )}
                      </Text>
                    </View>
                    <View style={styles.businessHourContentWrap}>
                      <View
                        style={[
                          styles.currentStatusWrap,
                          {
                            alignItems: rtl_support ? "flex-end" : "flex-start",
                          },
                        ]}
                      >
                        {getCurrentStatus()}
                      </View>
                      <View style={styles.bHTableWrap}>
                        {config.week_days.map((_day, index, arr) => (
                          <BHDayComponent
                            day={_day}
                            key={index}
                            dataArr={arr}
                            index={index}
                          />
                        ))}
                      </View>
                    </View>
                  </View>
                )}

              {/* Map Component */}
              {!listingData?.contact?.hide_map &&
                !!listingData?.contact?.latitude &&
                !!listingData?.contact?.longitude &&
                !!config?.map && (
                  <View
                    style={{
                      marginTop:
                        !!getCustomFields() || !!listingData.description
                          ? 20
                          : 0,
                      backgroundColor: COLORS.white,
                    }}
                  >
                    {"google" === config?.map?.type ? (
                      <>
                        {/* Map Type Change Buttons */}
                        <View style={styles.mapViewButtonsWrap}>
                          {/* Standard */}
                          <TouchableOpacity
                            style={[
                              styles.mapViewButton,
                              {
                                backgroundColor:
                                  mapType == "standard"
                                    ? COLORS.dodgerblue
                                    : "transparent",
                              },
                            ]}
                            onPress={handleMapTypeChange}
                            disabled={mapType == "standard"}
                          >
                            <Text
                              style={[
                                styles.mapViewButtonTitle,
                                {
                                  color:
                                    mapType == "standard"
                                      ? COLORS.white
                                      : COLORS.text_gray,
                                },
                              ]}
                            >
                              {__(
                                "listingDetailScreenTexts.mapButtons.standard",
                                appSettings.lng
                              )}
                            </Text>
                          </TouchableOpacity>
                          {/* Hybrid */}
                          <TouchableOpacity
                            style={[
                              styles.mapViewButton,
                              {
                                backgroundColor:
                                  mapType == "hybrid"
                                    ? COLORS.dodgerblue
                                    : "transparent",
                              },
                            ]}
                            onPress={handleMapTypeChange}
                            disabled={mapType == "hybrid"}
                          >
                            <Text
                              style={[
                                styles.mapViewButtonTitle,
                                {
                                  color:
                                    mapType == "hybrid"
                                      ? COLORS.white
                                      : COLORS.text_gray,
                                },
                              ]}
                            >
                              {__(
                                "listingDetailScreenTexts.mapButtons.hybrid",
                                appSettings.lng
                              )}
                            </Text>
                          </TouchableOpacity>
                        </View>
                        {/* MapView */}
                        <MapView
                          style={{
                            width: windowWidth,
                            height: windowWidth * 0.7,
                          }}
                          initialRegion={{
                            latitude: parseFloat(
                              listingData?.contact?.latitude ||
                                config?.map?.center?.lat ||
                                0
                            ),
                            longitude: parseFloat(
                              listingData?.contact?.longitude ||
                                config?.map?.center?.lng ||
                                0
                            ),
                            latitudeDelta: 0.0135135,
                            longitudeDelta: 0.0135135 * 0.7,
                          }}
                          provider={MapView.PROVIDER_GOOGLE}
                          // provider={null}
                          mapType={mapType}
                          scrollEnabled={false}
                        >
                          {/* Marker */}
                          <Marker
                            coordinate={{
                              latitude: parseFloat(
                                listingData?.contact?.latitude ||
                                  config?.map?.center?.lat ||
                                  0
                              ),
                              longitude: parseFloat(
                                listingData?.contact?.longitude ||
                                  config?.map?.center?.lng ||
                                  0
                              ),
                            }}
                            title={getAddress(listingData?.contact || {})}
                            onPress={(e) => handleMarkerPress(e)}
                          />
                          <UrlTile
                            urlTemplate="http://a.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png"
                            maximumZ={19}
                            flipY={false}
                          />
                        </MapView>
                      </>
                    ) : (
                      <View
                        style={{
                          width: windowWidth,
                          height: windowWidth * 0.7,
                        }}
                      >
                        <WebView
                          ref={mapRef}
                          source={{ html: html_script }}
                          style={{ flex: 1, opacity: 0.99 }}
                          // scrollEnabled={true}
                          // panGestureEnabled={false}
                          androidHardwareAccelerationDisabled={true}
                        />
                      </View>
                    )}
                  </View>
                )}

              {/* FloorPlan Section */}

              {config?.floorPlane && !!listingData?.floor_plan?.length && (
                <View style={{ width: "100%" }}>
                  <View
                    style={{
                      alignItems: rtl_support ? "flex-end" : "flex-start",
                      paddingHorizontal: "3%",
                      width: "100%",
                      paddingVertical: 20,
                    }}
                  >
                    <Text style={[styles.bHTitle, rtlText]}>
                      {__(
                        listingData?.floor_plan?.length < 2
                          ? "listingDetailScreenTexts.floorPlan.titleSingle"
                          : "listingDetailScreenTexts.floorPlan.titlePlural",
                        appSettings.lng
                      )}
                    </Text>
                  </View>
                  <View style={styles.view}>
                    {listingData.floor_plan.map((floorPlan, index, arr) => (
                      <View
                        style={{
                          // backgroundColor: COLORS.bg_dark,
                          marginBottom: index < arr.length - 1 ? 10 : 0,
                          paddingBottom: 10,
                        }}
                        key={`${index}`}
                      >
                        <View
                          style={{
                            flexDirection: rtl_support ? "row-reverse" : "row",
                            alignItems: "center",
                            paddingHorizontal: windowWidth * 0.03,
                            backgroundColor: COLORS.primary,
                            marginHorizontal: "3%",
                            borderRadius: 5,
                            paddingVertical: 5,
                          }}
                        >
                          {!!floorPlan?.title && (
                            <View style={{ flex: 1 }}>
                              <Text
                                style={[
                                  {
                                    fontSize: 15.5,
                                    color: COLORS.white,
                                    fontWeight: "bold",
                                  },
                                  rtlTextA,
                                ]}
                                numberOfLines={floorPlanViewer[index] ? 10 : 1}
                              >
                                {decodeString(floorPlan.title)}
                              </Text>
                            </View>
                          )}
                          <TouchableOpacity
                            style={{
                              height: 30,
                              width: 30,
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: COLORS.primary,
                              borderRadius: 15,
                            }}
                            onPress={() => handleFloorPlanViewerToggle(index)}
                          >
                            <FontAwesome
                              name={floorPlanViewer[index] ? "minus" : "plus"}
                              color={COLORS.white}
                              size={15}
                            />
                          </TouchableOpacity>
                        </View>
                        {floorPlanViewer[index] && (
                          <View style={styles.view}>
                            {!!floorPlan?.description && (
                              <View
                                style={{
                                  paddingHorizontal: windowWidth * 0.03,
                                  // width: "100%",
                                }}
                              >
                                <View
                                  style={{
                                    backgroundColor: COLORS.white,
                                    marginVertical: 10,
                                    paddingHorizontal: windowWidth * 0.03,
                                    paddingVertical: windowWidth * 0.015,
                                    borderRadius: 5,
                                    borderWidth: 1,
                                    borderColor: COLORS.border_light,
                                  }}
                                >
                                  <Text
                                    style={{
                                      textAlign: "justify",
                                      color: COLORS.text_gray,
                                    }}
                                  >
                                    {decodeString(floorPlan.description)}
                                  </Text>
                                </View>
                              </View>
                            )}
                            {(!!floorPlan?.bed ||
                              !!floorPlan?.bath ||
                              !!floorPlan?.size ||
                              !!floorPlan?.parking) && (
                              <View
                                style={{
                                  paddingVertical: 10,
                                  flexDirection: rtl_support
                                    ? "row-reverse"
                                    : "row",
                                  alignItems: "center",
                                  flexWrap: "wrap",

                                  backgroundColor: COLORS.bg_primary,
                                  marginHorizontal: "3%",
                                }}
                              >
                                {!!floorPlan?.bed && (
                                  <View
                                    style={{
                                      paddingHorizontal: windowWidth * 0.03,
                                      width: "50%",
                                      paddingBottom: 5,
                                      flexDirection: rtl_support
                                        ? "row-reverse"
                                        : "row",
                                      alignItems: "center",
                                    }}
                                  >
                                    <View style={styles.view}>
                                      <Ionicons
                                        name="bed-outline"
                                        size={20}
                                        color={COLORS.gray}
                                      />
                                    </View>
                                    <Text
                                      style={{
                                        paddingHorizontal: 5,
                                        fontWeight: "bold",
                                        color: COLORS.text_gray,
                                      }}
                                    >
                                      {__(
                                        "listingDetailScreenTexts.floorPlan.bedLabel",
                                        appSettings.lng
                                      )}
                                    </Text>
                                    <Text style={styles.text}>:</Text>
                                    <Text
                                      style={{
                                        paddingHorizontal: 5,
                                        fontWeight: "bold",
                                        color: COLORS.text_gray,
                                      }}
                                    >
                                      {decodeString(floorPlan.bed)}
                                    </Text>
                                  </View>
                                )}
                                {!!floorPlan?.bath && (
                                  <View
                                    style={{
                                      paddingHorizontal: windowWidth * 0.03,
                                      width: "50%",
                                      paddingBottom: 5,
                                      flexDirection: rtl_support
                                        ? "row-reverse"
                                        : "row",
                                      alignItems: "center",
                                    }}
                                  >
                                    <View style={styles.view}>
                                      <FontAwesome
                                        name="shower"
                                        size={20}
                                        color={COLORS.gray}
                                      />
                                    </View>
                                    <Text
                                      style={{
                                        paddingHorizontal: 5,
                                        fontWeight: "bold",
                                        color: COLORS.text_gray,
                                      }}
                                    >
                                      {__(
                                        "listingDetailScreenTexts.floorPlan.bathLabel",
                                        appSettings.lng
                                      )}
                                    </Text>
                                    <Text style={styles.text}>:</Text>
                                    <Text
                                      style={{
                                        paddingHorizontal: 5,
                                        fontWeight: "bold",
                                        color: COLORS.text_gray,
                                      }}
                                    >
                                      {decodeString(floorPlan.bath)}
                                    </Text>
                                  </View>
                                )}
                                {!!floorPlan?.size && (
                                  <View
                                    style={{
                                      paddingHorizontal: windowWidth * 0.03,
                                      width: "50%",
                                      paddingBottom: 5,
                                      flexDirection: rtl_support
                                        ? "row-reverse"
                                        : "row",
                                      alignItems: "center",
                                    }}
                                  >
                                    <View style={styles.view}>
                                      <FontAwesome5
                                        name="car"
                                        size={20}
                                        color={COLORS.gray}
                                      />
                                    </View>
                                    <Text
                                      style={{
                                        paddingHorizontal: 5,
                                        fontWeight: "bold",
                                        color: COLORS.text_gray,
                                      }}
                                    >
                                      {__(
                                        "listingDetailScreenTexts.floorPlan.parkingLabel",
                                        appSettings.lng
                                      )}
                                    </Text>
                                    <Text style={styles.text}>:</Text>
                                    <Text
                                      style={{
                                        paddingHorizontal: 5,
                                        fontWeight: "bold",
                                        color: COLORS.text_gray,
                                      }}
                                    >
                                      {decodeString(floorPlan.parking)}
                                    </Text>
                                  </View>
                                )}
                                {!!floorPlan?.parking && (
                                  <View
                                    style={{
                                      paddingHorizontal: windowWidth * 0.03,
                                      width: "50%",
                                      paddingBottom: 5,
                                      flexDirection: rtl_support
                                        ? "row-reverse"
                                        : "row",
                                      alignItems: "center",
                                    }}
                                  >
                                    <View style={styles.view}>
                                      <FontAwesome
                                        name="arrows-alt"
                                        size={20}
                                        color={COLORS.gray}
                                      />
                                    </View>
                                    <Text
                                      style={{
                                        paddingHorizontal: 5,
                                        fontWeight: "bold",
                                        color: COLORS.text_gray,
                                      }}
                                    >
                                      {__(
                                        "listingDetailScreenTexts.floorPlan.areaLabel",
                                        appSettings.lng
                                      )}
                                    </Text>
                                    <Text style={styles.text}>:</Text>
                                    <Text
                                      style={{
                                        paddingHorizontal: 5,
                                        fontWeight: "bold",
                                        color: COLORS.text_gray,
                                      }}
                                    >
                                      {decodeString(floorPlan.size)}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            )}
                            {!!floorPlan?.floor_img && (
                              <View
                                style={{
                                  width: windowWidth * 0.94,
                                  height: windowWidth * 0.8,
                                  paddingHorizontal: windowWidth * 0.03,
                                  marginHorizontal: windowWidth * 0.03,
                                  backgroundColor: COLORS.bg_primary,
                                  // borderRadius: 5,
                                }}
                              >
                                <Image
                                  source={{ uri: floorPlan.floor_img }}
                                  style={{
                                    resizeMode: "contain",
                                    width: windowWidth * 0.88,
                                    height: windowWidth * 0.8 * 0.88,
                                  }}
                                />
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Video Section */}
              {!!listingData?.video_urls?.length && (
                <View style={styles.view}>
                  <View
                    style={{
                      alignItems: rtl_support ? "flex-end" : "flex-start",
                      paddingHorizontal: "3%",
                      width: "100%",
                      paddingVertical: 20,
                    }}
                  >
                    <Text style={[styles.bHTitle, rtlText]}>
                      {__(
                        "listingDetailScreenTexts.listingVideoTitle",
                        appSettings.lng
                      )}
                    </Text>
                  </View>

                  {listingData?.video_urls.map((_url) =>
                    get_sanitized_embed_url(_url)
                  )}
                </View>
              )}

              {/* Penorama Section */}
              {listingData?.panorama?.view_url &&
                config?.panorama &&
                !loading && (
                  <View>
                    <View
                      style={{
                        alignItems: rtl_support ? "flex-end" : "flex-start",
                        paddingHorizontal: "3%",
                        width: "100%",
                        paddingVertical: 20,
                      }}
                    >
                      <Text style={[styles.bHTitle, rtlText]}>
                        {__(
                          "listingDetailScreenTexts.panoromaTitle",
                          appSettings.lng
                        )}
                      </Text>
                    </View>

                    <View
                      style={{
                        height: windowWidth * 0.8,
                        width: windowWidth,
                      }}
                    >
                      <WebView
                        source={{
                          uri: `${listingData.panorama.view_url}&height=${
                            windowWidth * 0.8
                          }px&showControl=1&autoLoad=0`,
                        }}
                        style={{
                          height: windowWidth * 0.8,
                          width: windowWidth,
                          opacity: 0.99,
                        }}
                        scrollEnabled
                      />
                    </View>
                  </View>
                )}

              {/* Social Profiles */}
              {!!listingData?.social_profiles &&
                !!Object.keys(listingData.social_profiles).length && (
                  <View style={styles.bgWhite_W100_PH3}>
                    <View style={[styles.socialProfileComponentWrap, rtlView]}>
                      <View style={styles.sclPrflTtlWrap}>
                        <Text style={[styles.sclPrflTtl, rtlTextA]}>
                          {__(
                            "listingDetailScreenTexts.socialProfileTitle",
                            appSettings.lng
                          )}
                        </Text>
                      </View>
                      <View style={styles.sclPrflsWrap}>
                        <View style={styles.sclPrfls}>
                          {Object.keys(listingData.social_profiles).map(
                            (_profile, index) => (
                              <TouchableOpacity
                                style={[
                                  styles.sclPrflIconWrap,
                                  {
                                    marginLeft: index === 0 ? 14 : 7,
                                    marginRight:
                                      index ===
                                      listingData.social_profiles.length - 1
                                        ? 15
                                        : 7,
                                  },
                                ]}
                                key={_profile}
                                onPress={() =>
                                  handleSocialProfileClick(_profile)
                                }
                              >
                                <FontAwesome
                                  name={_profile}
                                  size={20}
                                  color={COLORS.primary}
                                />
                              </TouchableOpacity>
                            )
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              {/* Yelp Nearby Places Section */}
              {config?.yelp &&
                !!listingData?.yelp_categories?.length &&
                !!yelpData?.length && (
                  <View
                    style={{
                      backgroundColor: COLORS.white,
                      width: "100%",
                      paddingVertical: 20,
                    }}
                  >
                    <View
                      style={{
                        alignItems: rtl_support ? "flex-end" : "flex-start",
                        paddingHorizontal: "3%",
                      }}
                    >
                      <Text style={[styles.bHTitle, rtlText]}>
                        {__(
                          "listingDetailScreenTexts.yelpTitle",
                          appSettings.lng
                        )}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.screenSeparatorWrap,
                        { marginVertical: 10 },
                      ]}
                    >
                      <AppSeparator style={styles.screenSeparator} />
                    </View>
                    <View style={{ paddingHorizontal: "3%" }}>
                      <View>
                        {yelpData.map((_yD, index) => (
                          <View
                            key={`${index}`}
                            style={{
                              width: "100%",
                              paddingVertical: 10,
                            }}
                          >
                            <View style={{ paddingBottom: 5 }}>
                              <Text
                                style={{
                                  fontSize: 14,
                                  fontWeight: "bold",
                                  color: COLORS.text_dark,
                                }}
                              >
                                {_yD.name}
                              </Text>
                            </View>
                            <View style={styles.view}>
                              <Text
                                style={{
                                  fontSize: 13,
                                  fontWeight: "bold",
                                  color: COLORS.text_gray,
                                }}
                              >
                                {__(
                                  "listingDetailScreenTexts.yelpPlaceDistance",
                                  appSettings.lng
                                )}
                                {" ("}
                                {(_yD.distance * 0.000621371).toPrecision(2)}
                                {")"}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                )}

              {/* Whatsapp Button */}
              {!!listingData?.contact?.whatsapp_number &&
                (user === null || user.id !== listingData.author_id) && (
                  <View
                    style={[
                      styles.bgWhite_W100_PH3,
                      {
                        paddingBottom:
                          user?.id === listingData?.author_id ? 20 : 0,
                        alignItems: "center",
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.whatsappWrap}
                      onPress={handleWhatsapp}
                    >
                      <Text style={{ color: COLORS.white, fontWeight: "bold" }}>
                        {__(
                          "listingDetailScreenTexts.whatsappButton",
                          appSettings.lng
                        )}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

              {/* Similar Ads */}
              {(user === null || user.id !== listingData.author_id) &&
                listingData.related.length > 0 && (
                  <View style={styles.similarAddWrap}>
                    <View
                      style={[
                        styles.similarAddTitleWrap,
                        {
                          paddingTop: user === null ? 15 : 0,
                          alignItems: rtl_support ? "flex-end" : "flex-start",
                        },
                      ]}
                    >
                      <Text style={[styles.similarAddTitle, rtlText]}>
                        {__(
                          "listingDetailScreenTexts.similar",
                          appSettings.lng
                        )}
                      </Text>
                    </View>
                    <View
                      style={{
                        paddingHorizontal: "3%",
                        width: "100%",
                        marginVertical: 5,
                      }}
                    >
                      {listingData.related.map((similar) => (
                        <SimilarAdFlatList
                          key={similar.listing_id}
                          category={
                            similar.categories.length
                              ? similar.categories[0].name
                              : null
                          }
                          time={moment(similar.created_at).fromNow()}
                          title={similar.title}
                          url={
                            similar.images.length
                              ? similar.images[0].sizes.thumbnail.src
                              : null
                          }
                          views={similar.view_count}
                          id={similar.listing_id}
                          price={similar.price}
                          price_type={similar.price_type}
                          onClick={() => {
                            if (playing) {
                              setPlaying(false);
                            }
                            if (miscConfig?.similarAdsOpenInSamePage) {
                              setLoading(true);
                              setListingData(null);
                              navigation.navigate(routes.listingDetailScreen, {
                                listingId: similar.listing_id,
                              });
                            } else {
                              navigation.push(routes.listingDetailScreen, {
                                listingId: similar.listing_id,
                              });
                            }
                          }}
                          item={similar}
                        />
                      ))}
                    </View>
                  </View>
                )}

              {/* Reviews & Rating */}
              {!!listingData?.review && !!config?.review && (
                <View style={styles.ratingReviewSectionWrap}>
                  <View style={styles.ratingDisplayWrap}>
                    <View
                      style={[
                        styles.ratingDisHdrWrap,
                        {
                          justifyContent: config?.review?.rating
                            ? "space-between"
                            : "flex-start",
                        },
                        rtlView,
                      ]}
                    >
                      <View style={styles.ratingCountWrap}>
                        {listingData?.review?.rating?.count === 0 ? (
                          <Text style={[styles.ratingCount, rtlText]}>
                            {__(
                              "listingDetailScreenTexts.ratingHeader.zero",
                              appSettings.lng
                            )}
                          </Text>
                        ) : (
                          <>
                            {rtl_support ? (
                              <Text style={[styles.ratingCount, rtlText]}>
                                {__(
                                  listingData?.review?.rating?.count === 1
                                    ? "listingDetailScreenTexts.ratingHeader.single"
                                    : "listingDetailScreenTexts.ratingHeader.multiple",
                                  appSettings.lng
                                )}{" "}
                                {listingData?.review?.rating?.count}
                              </Text>
                            ) : (
                              <Text style={[styles.ratingCount, rtlText]}>
                                {listingData?.review?.rating?.count}{" "}
                                {__(
                                  listingData?.review?.rating?.count === 1
                                    ? "listingDetailScreenTexts.ratingHeader.single"
                                    : "listingDetailScreenTexts.ratingHeader.multiple",
                                  appSettings.lng
                                )}
                              </Text>
                            )}
                          </>
                        )}
                      </View>
                      {config?.review?.rating && (
                        <TotalRating
                          ratio={listingData?.review?.rating?.average || 0}
                          // rating.toFixed(2).toString()
                        />
                      )}
                    </View>
                    {listingData?.review?.rating?.count >= 1 && (
                      <>
                        <View
                          style={{
                            height: 1,
                            width: "100%",
                            backgroundColor: COLORS.text_gray,
                            marginBottom: 8,
                          }}
                        />
                        {ratingShown && (
                          <View style={styles.ratingsList}>
                            {/* map function will return the following component */}
                            {ratingData.map((rat, ind) => (
                              <View
                                style={[styles.ratingWrap, rtlView]}
                                key={ind}
                              >
                                <View style={styles.avatarWrap}>
                                  {rat?.author_avatar_urls ? (
                                    <Image
                                      source={{
                                        uri:
                                          rat.author_avatar_urls["96"] ||
                                          rat.author_avatar_urls["48"] ||
                                          rat.author_avatar_urls["24"],
                                      }}
                                      style={styles.ratingAvatar}
                                    />
                                  ) : (
                                    <FontAwesome
                                      name={"user-circle-o"}
                                      size={45}
                                      color={COLORS.text_gray}
                                    />
                                  )}
                                </View>

                                <View
                                  style={[
                                    styles.detailWrap,
                                    {
                                      paddingLeft: rtl_support ? 0 : 5,
                                      paddingRight: rtl_support ? 5 : 0,
                                    },
                                  ]}
                                >
                                  <View
                                    style={{
                                      flexDirection: rtl_support
                                        ? "row-reverse"
                                        : "row",
                                      alignItems: "center",
                                    }}
                                  >
                                    <View
                                      style={[
                                        styles.reviewTitleWrap,
                                        {
                                          alignItems: rtl_support
                                            ? "flex-end"
                                            : "flex-start",
                                        },
                                      ]}
                                    >
                                      <Text
                                        style={[styles.reviewTitle, rtlText]}
                                      >
                                        {rat.title}
                                      </Text>
                                    </View>
                                    {config?.review?.rating && (
                                      <TotalRating
                                        ratio={
                                          rat.rating.toFixed(2).toString() || 0
                                        }
                                      />
                                    )}
                                  </View>

                                  <View
                                    style={[
                                      styles.userWrap,
                                      {
                                        alignItems: rtl_support
                                          ? "flex-end"
                                          : "flex-start",
                                      },
                                    ]}
                                  >
                                    <Text style={[styles.username, rtlText]}>
                                      {rat.author_name}
                                    </Text>
                                  </View>

                                  <View
                                    style={[
                                      styles.timeWrap,
                                      {
                                        alignItems: rtl_support
                                          ? "flex-end"
                                          : "flex-start",
                                      },
                                    ]}
                                  >
                                    <Text style={[styles.reviewTime, rtlText]}>
                                      {moment(rat.date).format("MMM Do, YYYY")}
                                    </Text>
                                  </View>
                                  <View
                                    style={[
                                      styles.reviewdetailWrap,
                                      {
                                        alignItems: rtl_support
                                          ? "flex-end"
                                          : "flex-start",
                                      },
                                    ]}
                                  >
                                    <Text
                                      style={[styles.reviewDetail, rtlText]}
                                    >
                                      {decodeString(rat.content.raw)}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            ))}
                            {pagination.total_pages >
                              pagination.current_page && (
                              <>
                                {moreloading ? (
                                  <View style={styles.moreLoadingWrap}>
                                    <ActivityIndicator
                                      size="small"
                                      color={COLORS.primary}
                                    />
                                  </View>
                                ) : (
                                  <View style={styles.showMoreWrap}>
                                    <AppTextButton
                                      title={__(
                                        "listingDetailScreenTexts.showMore",
                                        appSettings.lng
                                      )}
                                      onPress={() => setMoreLoading(true)}
                                    />
                                  </View>
                                )}
                              </>
                            )}
                          </View>
                        )}
                        <View style={styles.showReviewBtnWrap}>
                          <AppTextButton
                            title={
                              ratingShown
                                ? __(
                                    "listingDetailScreenTexts.hideRatingBtn",
                                    appSettings.lng
                                  )
                                : __(
                                    "listingDetailScreenTexts.showRatingBtn",
                                    appSettings.lng
                                  )
                            }
                            style={{ marginBottom: 15 }}
                            onPress={toggleRatings}
                          />
                        </View>
                      </>
                    )}
                  </View>
                  {config?.review && (
                    <View style={styles.ratingFormWrap}>
                      <TouchableWithoutFeedback
                        onPress={() => {
                          setFormShown(true);
                          setTimeout(() => {
                            scrollRef.current.scrollToEnd({
                              animated: true,
                              duration: 100,
                            });
                          }, 10);
                        }}
                      >
                        <View
                          style={[
                            styles.formTitleWrap,
                            {
                              alignItems: formShown
                                ? rtl_support
                                  ? "flex-end"
                                  : "flex-start"
                                : "center",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.formTitle,
                              {
                                color: formShown
                                  ? COLORS.text_dark
                                  : COLORS.primary,
                              },
                              rtlText,
                            ]}
                          >
                            {__(
                              "listingDetailScreenTexts.ratingFormTitle",
                              appSettings.lng
                            )}
                          </Text>
                        </View>
                      </TouchableWithoutFeedback>
                      {formShown && (
                        <>
                          <View
                            style={{
                              width: "100%",
                              height: 1,
                              backgroundColor: COLORS.text_gray,
                            }}
                          />
                          <Formik
                            initialValues={{
                              author_name:
                                listingData?.review?.item?.author_name ||
                                user?.first_name + user?.last_name ||
                                user?.first_name ||
                                user?.last_name ||
                                user?.username ||
                                "",
                              author_email:
                                listingData?.review?.item?.author_email ||
                                user?.email ||
                                "",
                              title: listingData?.review?.item?.title || "",
                              rating: listingData?.review?.item?.rating || "",
                              content:
                                listingData?.review?.item?.content?.raw || "",
                            }}
                            onSubmit={(values) => handleReview(values)}
                            validationSchema={validationSchema}
                          >
                            {({
                              handleChange,
                              handleBlur,
                              handleSubmit,
                              values,
                              errors,
                              touched,
                              setFieldValue,
                            }) => (
                              <View
                                style={{
                                  backgroundColor: COLORS.bg_light,
                                  paddingHorizontal: "3%",
                                  paddingVertical: 10,
                                }}
                              >
                                <View
                                  style={[
                                    styles.ratingNoticeWrap,
                                    {
                                      alignItems: rtl_support
                                        ? "flex-end"
                                        : "flex-start",
                                    },
                                  ]}
                                >
                                  <Text style={[styles.ratingNotice, rtlText]}>
                                    {__(
                                      "listingDetailScreenTexts.ratingFormNotice",
                                      appSettings.lng
                                    )}
                                  </Text>
                                </View>
                                {!user?.first_name &&
                                  !user?.last_name &&
                                  !user?.username && (
                                    <View style={styles.formFieldWrap}>
                                      <View
                                        style={[
                                          styles.formFieldLabelWrap,
                                          {
                                            alignItems: rtl_support
                                              ? "flex-end"
                                              : "flex-start",
                                          },
                                        ]}
                                      >
                                        <Text
                                          style={[
                                            styles.formFieldLabel,
                                            rtlText,
                                          ]}
                                        >
                                          {__(
                                            "listingDetailScreenTexts.formLabels.name",
                                            appSettings.lng
                                          )}
                                          <Text style={styles.mendatory}>
                                            {" "}
                                            *
                                          </Text>
                                        </Text>
                                      </View>
                                      <TextInput
                                        style={[
                                          styles.formImput,
                                          {
                                            textAlign: rtl_support
                                              ? "right"
                                              : "left",
                                          },
                                        ]}
                                        onChangeText={handleChange(
                                          "author_name"
                                        )}
                                        onBlur={handleBlur("author_name")}
                                        value={values.author_name}
                                      />
                                      <View
                                        style={[
                                          styles.formFieldErrorWrap,
                                          {
                                            alignItems: rtl_support
                                              ? "flex-end"
                                              : "flex-start",
                                          },
                                        ]}
                                      >
                                        {touched.author_name &&
                                          errors.author_name && (
                                            <Text
                                              style={[
                                                styles.formFieldError,
                                                rtlText,
                                              ]}
                                            >
                                              {errors.author_name}
                                            </Text>
                                          )}
                                      </View>
                                    </View>
                                  )}
                                {!user?.email && (
                                  <View style={styles.formFieldWrap}>
                                    <View
                                      style={[
                                        styles.formFieldLabelWrap,
                                        {
                                          alignItems: rtl_support
                                            ? "flex-end"
                                            : "flex-start",
                                        },
                                      ]}
                                    >
                                      <Text
                                        style={[styles.formFieldLabel, rtlText]}
                                      >
                                        {__(
                                          "listingDetailScreenTexts.formLabels.email",
                                          appSettings.lng
                                        )}
                                        <Text style={styles.mendatory}> *</Text>
                                      </Text>
                                    </View>
                                    <TextInput
                                      style={[
                                        styles.formImput,
                                        {
                                          textAlign: rtl_support
                                            ? "right"
                                            : "left",
                                        },
                                      ]}
                                      onChangeText={handleChange(
                                        "author_email"
                                      )}
                                      onBlur={handleBlur("author_email")}
                                      value={values.author_email}
                                    />
                                    <View
                                      style={[
                                        styles.formFieldErrorWrap,
                                        {
                                          alignItems: rtl_support
                                            ? "flex-end"
                                            : "flex-start",
                                        },
                                      ]}
                                    >
                                      {touched.author_email &&
                                        errors.author_email && (
                                          <Text
                                            style={[
                                              styles.formFieldError,
                                              rtlText,
                                            ]}
                                          >
                                            {errors.author_email}
                                          </Text>
                                        )}
                                    </View>
                                  </View>
                                )}
                                <View style={styles.formFieldWrap}>
                                  <View
                                    style={[
                                      styles.formFieldLabelWrap,
                                      {
                                        alignItems: rtl_support
                                          ? "flex-end"
                                          : "flex-start",
                                      },
                                    ]}
                                  >
                                    <Text
                                      style={[styles.formFieldLabel, rtlText]}
                                    >
                                      {__(
                                        "listingDetailScreenTexts.formLabels.title",
                                        appSettings.lng
                                      )}
                                      <Text style={styles.mendatory}> *</Text>
                                    </Text>
                                  </View>
                                  <TextInput
                                    style={[
                                      styles.formImput,
                                      {
                                        textAlign: rtl_support
                                          ? "right"
                                          : "left",
                                      },
                                    ]}
                                    onChangeText={handleChange("title")}
                                    onBlur={handleBlur("title")}
                                    value={values.title}
                                  />
                                  <View
                                    style={[
                                      styles.formFieldErrorWrap,
                                      {
                                        alignItems: rtl_support
                                          ? "flex-end"
                                          : "flex-start",
                                      },
                                    ]}
                                  >
                                    {touched.title && errors.title && (
                                      <Text
                                        style={[styles.formFieldError, rtlText]}
                                      >
                                        {errors.title}
                                      </Text>
                                    )}
                                  </View>
                                </View>
                                {config?.review?.rating && (
                                  <View style={styles.formFieldWrap}>
                                    <View
                                      style={[
                                        styles.formFieldLabelWrap,
                                        {
                                          alignItems: rtl_support
                                            ? "flex-end"
                                            : "flex-start",
                                        },
                                      ]}
                                    >
                                      <Text
                                        style={[styles.formFieldLabel, rtlText]}
                                      >
                                        {__(
                                          "listingDetailScreenTexts.formLabels.rating",
                                          appSettings.lng
                                        )}
                                        <Text style={styles.mendatory}> *</Text>
                                      </Text>
                                    </View>
                                    <View style={[styles.ratingWrap, rtlView]}>
                                      <View
                                        style={[
                                          styles.totalRatingWrap,
                                          rtlView,
                                        ]}
                                      >
                                        <TouchableOpacity
                                          style={styles.ratingStarWrap}
                                          onPress={() =>
                                            handleRating(
                                              setFieldValue,
                                              1,
                                              values.rating
                                            )
                                          }
                                        >
                                          <FontAwesome
                                            name={
                                              values.rating > 0
                                                ? "star"
                                                : "star-o"
                                            }
                                            size={30}
                                            color={COLORS.rating_star}
                                          />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                          style={styles.ratingStarWrap}
                                          onPress={() =>
                                            handleRating(
                                              setFieldValue,
                                              2,
                                              values.rating
                                            )
                                          }
                                        >
                                          <FontAwesome
                                            name={
                                              values.rating > 1
                                                ? "star"
                                                : "star-o"
                                            }
                                            size={30}
                                            color={COLORS.rating_star}
                                          />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                          style={styles.ratingStarWrap}
                                          onPress={() =>
                                            handleRating(
                                              setFieldValue,
                                              3,
                                              values.rating
                                            )
                                          }
                                        >
                                          <FontAwesome
                                            name={
                                              values.rating > 2
                                                ? "star"
                                                : "star-o"
                                            }
                                            size={30}
                                            color={COLORS.rating_star}
                                          />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                          style={styles.ratingStarWrap}
                                          onPress={() =>
                                            handleRating(
                                              setFieldValue,
                                              4,
                                              values.rating
                                            )
                                          }
                                        >
                                          <FontAwesome
                                            name={
                                              values.rating > 3
                                                ? "star"
                                                : "star-o"
                                            }
                                            size={30}
                                            color={COLORS.rating_star}
                                          />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                          style={styles.ratingStarWrap}
                                          onPress={() =>
                                            handleRating(
                                              setFieldValue,
                                              5,
                                              values.rating
                                            )
                                          }
                                        >
                                          <FontAwesome
                                            name={
                                              values.rating > 4
                                                ? "star"
                                                : "star-o"
                                            }
                                            size={30}
                                            color={COLORS.rating_star}
                                          />
                                        </TouchableOpacity>
                                      </View>
                                    </View>

                                    <View
                                      style={[
                                        styles.formFieldErrorWrap,
                                        {
                                          alignItems: rtl_support
                                            ? "flex-end"
                                            : "flex-start",
                                        },
                                      ]}
                                    >
                                      {touched.rating && errors.rating && (
                                        <Text
                                          style={[
                                            styles.formFieldError,
                                            rtlText,
                                          ]}
                                        >
                                          {errors.rating}
                                        </Text>
                                      )}
                                    </View>
                                  </View>
                                )}
                                <View style={styles.formFieldWrap}>
                                  <View
                                    style={[
                                      styles.formFieldLabelWrap,
                                      {
                                        alignItems: rtl_support
                                          ? "flex-end"
                                          : "flex-start",
                                      },
                                    ]}
                                  >
                                    <Text
                                      style={[styles.formFieldLabel, rtlText]}
                                    >
                                      {__(
                                        "listingDetailScreenTexts.formLabels.review",
                                        appSettings.lng
                                      )}
                                      <Text style={styles.mendatory}> *</Text>
                                    </Text>
                                  </View>
                                  <TextInput
                                    style={[
                                      styles.formImput,
                                      {
                                        height: 80,
                                        textAlign: rtl_support
                                          ? "right"
                                          : "left",
                                      },
                                    ]}
                                    onChangeText={handleChange("content")}
                                    onBlur={handleBlur("content")}
                                    value={values.content}
                                    multiline
                                  />
                                  <View
                                    style={[
                                      styles.formFieldErrorWrap,
                                      {
                                        alignItems: rtl_support
                                          ? "flex-end"
                                          : "flex-start",
                                      },
                                    ]}
                                  >
                                    {touched.content && errors.content && (
                                      <Text
                                        style={[styles.formFieldError, rtlText]}
                                      >
                                        {errors.content}
                                      </Text>
                                    )}
                                  </View>
                                </View>
                                <AppButton
                                  onPress={handleSubmit}
                                  title={__(
                                    "listingDetailScreenTexts.submitBtn",
                                    appSettings.lng
                                  )}
                                  disabled={posting}
                                  loading={posting}
                                />
                              </View>
                            )}
                          </Formik>
                        </>
                      )}
                    </View>
                  )}
                </View>
              )}
              <FlashNotification
                falshShow={flashNotification}
                flashMessage={flashNotificationMessage}
              />
            </ScrollView>
          </View>
          {/*  Seller contact  */}
          {(user === null || user?.id !== listingData.author_id) &&
            !config?.disabled?.listing_contact &&
            !!listingData.contact && (
              <SellerContact
                phone={!!listingData.contact?.phone}
                email={!!listingData.contact?.email}
                onCall={() => {
                  if (playing) {
                    setPlaying(false);
                  }
                  if (
                    user === null &&
                    config?.registered_only?.listing_contact
                  ) {
                    handleLoginAlert();
                  } else {
                    setModalVisible(true);
                  }
                }}
                onChat={handleChat}
                onEmail={handleEmail}
              />
            )}
        </View>
      )}
      {imageViewer && (
        <View style={styles.imageViewerWrapq}>
          <TouchableOpacity
            style={styles.imageViewerCloseButton}
            onPress={handleImageViewerClose}
          >
            <FontAwesome5 name="times" size={24} color="black" />
          </TouchableOpacity>
          <ScrollView
            ref={zoomScrollView}
            pagingEnabled
            onScroll={handleScrollZoom}
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false}
            horizontal
          >
            {listingData?.images?.map((_image) => (
              <View key={_image.ID} style={styles.imageViewer}>
                <ReactNativeZoomableView
                  maxZoom={2}
                  minZoom={1}
                  zoomStep={0.5}
                  initialZoom={1}
                  bindToBorders={true}
                  style={{
                    padding: 10,
                    backgroundColor: COLORS.black,
                  }}
                >
                  <Image
                    style={{
                      width: windowWidth - 20,
                      height: windowHeight,
                      resizeMode: "contain",
                    }}
                    source={{
                      uri: _image.sizes.full.src,
                    }}
                  />
                </ReactNativeZoomableView>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
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
      {listingData && !loading && (
        <Modal animationType="slide" transparent={true} visible={modalVisible}>
          <View style={styles.actionModal}>
            <View style={styles.aMWrap}>
              <TouchableWithoutFeedback onPress={closeCallModal}>
                <View style={styles.aMOverlay} />
              </TouchableWithoutFeedback>
              <View style={styles.aMContentWrap}>
                <View
                  style={{
                    paddingHorizontal: "3%",
                    padding: 20,
                    backgroundColor: COLORS.white,
                    width: "100%",
                  }}
                >
                  <Text style={[styles.callText, rtlText]}>
                    {__("listingDetailScreenTexts.call", appSettings.lng)}
                    {listingData.author.first_name}{" "}
                    {listingData.author.last_name}?
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleCall(listingData.contact.phone)}
                    style={[styles.phone, rtlView]}
                  >
                    <Text style={[styles.phoneText, rtlText]}>
                      {listingData.contact.phone}
                    </Text>
                    {rtl_support ? (
                      <FontAwesome5
                        name="phone-alt"
                        size={18}
                        color={COLORS.primary}
                      />
                    ) : (
                      <FontAwesome5
                        name="phone"
                        size={18}
                        color={COLORS.primary}
                      />
                    )}
                  </TouchableOpacity>
                  <AppTextButton
                    title={__(
                      "listingDetailScreenTexts.cancelButtonTitle",
                      appSettings.lng
                    )}
                    style={{ marginTop: 20 }}
                    onPress={() => setModalVisible(false)}
                  />
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
      <Modal
        animationType="slide"
        transparent={true}
        visible={actionModalVisible}
      >
        <View style={styles.actionModal}>
          <View style={styles.aMWrap}>
            <TouchableWithoutFeedback onPress={closeActionModal}>
              <View style={styles.aMOverlay} />
            </TouchableWithoutFeedback>
            <View style={styles.aMContentWrap}>
              {!!listingData?.url && (
                <TouchableOpacity onPress={onShare}>
                  <View style={[styles.actionOptionWrap, rtlView]}>
                    <View style={styles.aOIconWrap}>
                      <MaterialCommunityIcons
                        name="share-variant"
                        size={20}
                        color={COLORS.text_gray}
                      />
                    </View>
                    <View style={styles.aOtextWrap}>
                      <Text
                        numberOfLines={1}
                        style={[styles.actionOptionText, rtlTextA]}
                      >
                        {__("listingDetailScreenTexts.share", appSettings.lng)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              {user !== null && user.id !== listingData?.author_id && (
                <>
                  <TouchableOpacity onPress={onHideListingAlert}>
                    <View style={[styles.actionOptionWrap, rtlView]}>
                      <View style={styles.aOIconWrap}>
                        <Entypo
                          name="block"
                          size={18}
                          color={COLORS.text_gray}
                        />
                      </View>
                      <View style={styles.aOtextWrap}>
                        <Text
                          numberOfLines={1}
                          style={[styles.actionOptionText, rtlTextA]}
                        >
                          {__(
                            "listingDetailScreenTexts.blockAd",
                            appSettings.lng
                          )}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={onBlockUserAlert}>
                    <View style={[styles.actionOptionWrap, rtlView]}>
                      <View style={styles.aOIconWrap}>
                        <Feather
                          name="user-x"
                          size={20}
                          color={COLORS.text_gray}
                        />
                      </View>
                      <View style={styles.aOtextWrap}>
                        <Text
                          numberOfLines={1}
                          style={[styles.actionOptionText, rtlTextA]}
                        >
                          {__(
                            "listingDetailScreenTexts.unfollowSeller",
                            appSettings.lng
                          )}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleReport}>
                    <View style={[styles.actionOptionWrap, rtlView]}>
                      <View style={styles.aOIconWrap}>
                        <MaterialIcons
                          name="outlined-flag"
                          size={21}
                          color={COLORS.red}
                        />
                      </View>
                      <View style={styles.aOtextWrap}>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.actionOptionText,
                            rtlTextA,
                            { color: COLORS.red },
                          ]}
                        >
                          {__(
                            "listingDetailScreenTexts.reportAd",
                            appSettings.lng
                          )}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  actionOptionText: {
    fontSize: 14,
    color: COLORS.text_gray,
  },
  aOIconWrap: {
    paddingHorizontal: "3%",
  },
  actionOptionWrap: {
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomColor: COLORS.border_light,
    borderBottomWidth: 1,
  },
  aMContentWrap: {
    zIndex: 2,
    backgroundColor: COLORS.white,
    overflow: "hidden",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
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
  aMWrap: {
    flex: 1,
    justifyContent: "flex-end",
  },
  avatarWrap: {
    height: 45,
    width: 45,
    borderRadius: 45 / 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  badgeSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  bgWhite_W100_PH3: {
    backgroundColor: COLORS.white,
    paddingHorizontal: "3%",
    width: "100%",
    paddingVertical: 20,
  },
  bHDayWrap: {
    borderBottomColor: COLORS.gray,

    flexDirection: "row",
  },
  bHTableWrap: {
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  bHTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  businessHourContentWrap: {},
  callText: {
    fontSize: 20,
    color: COLORS.text_dark,
    textAlign: "center",
  },
  cardText: {
    fontSize: 14,
    lineHeight: 22,

    color: COLORS.gray,
  },
  container: {
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  currentStatus: {
    fontWeight: "bold",
  },
  currentStatusWrap: {
    marginVertical: 15,
  },
  customfield: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
  },
  customfieldName: {
    width: "37%",
    fontWeight: "bold",
    fontSize: 13,
  },
  customfieldValue: {
    width: "57%",
    fontWeight: "bold",
    fontSize: 13,
    color: COLORS.text_gray,
  },
  dayName: {
    fontWeight: "bold",
    color: COLORS.text_gray,
  },
  dayNameWrap: {
    padding: 5,
    flex: 1,
    borderRightColor: COLORS.gray,
  },
  descriptionText: {
    color: COLORS.text_gray,
    textAlign: "justify",
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text_dark,
    paddingBottom: 10,
  },
  detailWrap: {
    flex: 1,
  },
  flexRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  formFieldError: {
    color: COLORS.red,
    fontSize: 12,
  },
  formFieldErrorWrap: {
    minHeight: 20,
    justifyContent: "center",
  },
  formFieldLabel: {
    fontWeight: "bold",
    color: COLORS.text_gray,
  },
  formImput: {
    // backgroundColor: "red",
    height: 40,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.border_light,
    paddingHorizontal: 10,
    marginTop: 7,
    textAlignVertical: "top",
    paddingVertical: 10,
  },
  formTitle: {
    fontSize: 16,
    color: COLORS.text_dark,
    fontWeight: "bold",
  },
  formTitleWrap: {
    backgroundColor: COLORS.bg_light,
    paddingVertical: 10,
    paddingHorizontal: "3%",
    marginTop: 10,
  },
  hoursSlotsWrap: {
    flex: 3,
  },
  imageSlider: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    // paddingTop: 15,
  },
  imageViewer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageViewerCloseButton: {
    position: "absolute",
    right: 15,
    top: 15,
    zIndex: 10,
    height: 25,
    width: 25,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
  },
  imageViewerWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    width: "100%",
    height: "100%",
    flex: 1,
  },
  imageViewerWrapq: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    width: "100%",
    // height: "100%",
    zIndex: 2,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  locationData: {
    marginBottom: 10,
  },
  listingDescriptionWrap: {},
  listingLocationAndTimeText: {
    fontSize: 15,
    color: COLORS.text_gray,
  },
  listingLocationAndTimeIconContainer: {
    width: 25,
  },
  listingPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.white,
  },
  listingPricenegotiable: {
    color: COLORS.text_gray,
    fontSize: 15,
    fontWeight: "bold",
  },
  listingPriceWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    paddingVertical: 5,
  },
  listingTitle: {
    color: COLORS.text_dark,
    fontSize: 20,
    fontWeight: "bold",
    paddingBottom: 10,
    marginTop: -5,
  },
  listingPriceAndOwnerWrap: {},
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
  mapViewButtonsWrap: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    top: 5,
    right: 10,
    zIndex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 5,
  },
  mapViewButton: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 5,
  },
  mapViewButtonTitle: {
    textTransform: "capitalize",
    fontSize: 12,
    fontWeight: "bold",
  },
  mendatory: {
    color: COLORS.red,
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
  priceTag: {
    backgroundColor: COLORS.primary,
    // position: "absolute",
    left: -(windowWidth * 0.031),
    paddingLeft: windowWidth * 0.031,
    paddingVertical: 10,
    paddingRight: 30,
    flexDirection: "row",
    alignItems: "center",
  },
  ratingAvatar: {
    height: 45,
    width: 45,
    resizeMode: "contain",
  },
  ratingCount: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text_dark,
  },
  ratingDisHdrWrap: {
    flexDirection: "row",
    alignItems: "center",

    paddingVertical: 10,
  },
  ratingDisplayWrap: {
    backgroundColor: COLORS.bg_light,
    width: "100%",
    paddingHorizontal: 10,
  },
  ratingFormWrap: {
    marginBottom: 50,
  },
  ratingReviewSectionWrap: {
    width: "100%",
    paddingHorizontal: "3%",
    marginTop: 10,
  },
  ratingsList: {
    paddingVertical: 5,
  },
  ratingNoticeWrap: {
    marginBottom: 10,
  },
  ratingStarWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 1.5,
  },
  ratingWrap: {
    flexDirection: "row",
    paddingVertical: 5,
  },
  reportText: {
    fontSize: 16,
    color: COLORS.text_gray,
    paddingLeft: 5,
  },
  reportWrap: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#d4cfcf",
    borderRadius: 5,
    paddingHorizontal: 20,
  },

  reviewDetail: {
    textAlign: "justify",
    color: COLORS.text_dark,
  },
  reviewTime: {
    color: COLORS.text_gray,
    fontSize: 12,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text_,
  },
  reviewTitleWrap: {
    flex: 1,
    marginBottom: 4,
  },
  sclPrfls: {
    flexDirection: "row",
    alignItems: "center",
  },
  sclPrflTtl: {
    fontSize: 18,
    fontWeight: "bold",
  },
  sclPrflTtlWrap: {
    backgroundColor: COLORS.white,
    // paddingBottom: 10,
  },
  sclPrflsWrap: {
    flex: 1,
  },
  screenSeparator: {
    width: "94%",
  },
  screenSeparatorWrap: {
    width: "100%",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  scrollProgress: {
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, .3)",
    fontWeight: "bold",
    color: COLORS.white,
    position: "absolute",
    right: "3%",
    bottom: "3%",
  },
  scrollProgressText: {
    fontWeight: "bold",
    color: COLORS.white,
  },
  sellerIcon: {
    height: 16,
    width: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    overflow: "hidden",
  },
  sellerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  sellerName: {
    fontWeight: "bold",
    color: COLORS.text_dark,
  },
  sellerWrap: {
    color: COLORS.text_gray,
  },
  showMore: {
    color: COLORS.text_gray,
    paddingRight: 5,
  },
  showMoreWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  showReviewBtnWrap: {
    marginTop: 10,
  },
  similarAddTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  similarAddTitleWrap: {
    paddingHorizontal: "3%",
    backgroundColor: COLORS.white,
    paddingBottom: 10,
  },

  similarAddWrap: {
    backgroundColor: COLORS.white,
    marginTop: 10,
  },
  slotText: {
    fontWeight: "bold",
    padding: 5,
  },
  slotTimeWrap: {
    flex: 1,
  },
  slotWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  socialProfileComponentWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  soldOutBadge: {
    position: "absolute",
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
    transform: [{ rotate: "45deg" }],
    zIndex: 5,
  },
  soldOutMessage: {
    color: COLORS.white,
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  storeIcon: {
    // height: 118,
    // width: 18,
    alignItems: "center",
    justifyContent: "center",
    // borderRadius: 8,
    // overflow: "hidden",
  },
  storeIconImage: {
    height: 18,
    width: 18,
  },
  storeName: {
    fontWeight: "bold",
    color: COLORS.dodgerblue,
  },
  timeWrap: {
    marginVertical: 5,
  },
  totalRatingWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  whatsappWrap: {
    backgroundColor: "#4FCE5D",
    // width: "100%",
    // marginHorizontal: "3%",
    paddingHorizontal: "3%",
    paddingVertical: 10,
    // marginTop: 20,
    alignItems: "center",
    borderRadius: 3,
  },
  username: {
    color: COLORS.dodgerblue,
    fontWeight: "bold",
  },
});

export default ListingDetailScreen;
