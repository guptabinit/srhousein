const lngs = {
  en: require("./en.json"),
  ar: require("./ar.json"),
};
const defaultLng = "en";

// Do not edit/remove/add anything below this line!!!

import { getOptionsExtraData } from "../app/services/AccountOptions/optionsExtraData";
import { getSellFastImages } from "../app/services/HowToSellFast/images";
import { getMoreRoutes } from "../app/services/More/moreRoutes";
const routes = getMoreRoutes();
const images = getSellFastImages();
const optionsExtraData = getOptionsExtraData();

//  General String
const __ = (keyString, selectedLanguage) => {
  const lng = lngs[selectedLanguage];
  let tmp = null;
  keyString.split(".").map((_item) => {
    tmp = tmp ? tmp[_item] : lng[_item];
  });
  return tmp;
};

// Account Options
const getAccountOptionsData = (selectedLanguage) => {
  let resData = lngs[selectedLanguage]["options_user"];
  resData.map((_dat) => {
    _dat["assetUri"] = optionsExtraData[_dat.id].assetUri;
    _dat["icon"] = optionsExtraData[_dat.id].icon;
    _dat["routeName"] = optionsExtraData[_dat.id].routeName;
  });
  return resData;
};
// Drawer Account Options
const getDrawerAccountOptionsData = (selectedLanguage) => {
  let resData = lngs[selectedLanguage]["drawer_account_options"];
  resData.map((_dat) => {
    _dat["assetUri"] = optionsExtraData[_dat.id].assetUri;
    _dat["icon"] = optionsExtraData[_dat.id].icon;
    _dat["routeName"] = optionsExtraData[_dat.id].routeName;
  });

  return resData;
};
// Drawer Support Options
const getDrawerSupportOptionsData = (selectedLanguage) => {
  let resData = lngs[selectedLanguage]["drawer_support_options"];
  resData.map((_dat) => {
    _dat["assetUri"] = optionsExtraData[_dat.id].assetUri;
    _dat["icon"] = optionsExtraData[_dat.id].icon;
    _dat["routeName"] = optionsExtraData[_dat.id].routeName;
  });

  return resData;
};

// App Description
const getAppDescription = (selectedLanguage) => {
  return lngs[selectedLanguage]["appDescription"];
};

// FAQ
const getFAQ = (selectedLanguage) => {
  return lngs[selectedLanguage]["frequentlyAskedQuestions"];
};

// Sell Faster
const getSellFastTips = (selectedLanguage) => {
  const data = lngs[selectedLanguage]["sellFastTips"];
  const myData = data.map((_obj) => {
    const tempObj = { ..._obj };
    tempObj["uri"] = images[`${_obj.id}`];
    return tempObj;
  });
  return myData;
};

// Privacy Policy
const getPrivacyPolicy = (selectedLanguage) => {
  return lngs[selectedLanguage]["privacyPolicy"];
};

// TnC
const getTnC = (selectedLanguage) => {
  return lngs[selectedLanguage]["termsAndConditions"];
};

const getRelativeTimeConfig = (selectedLanguage) => {
  return lngs[selectedLanguage]["relativeTime"];
};

// week
const getWeek = (selectedLanguage) => {
  return lngs[selectedLanguage]["weekDayNames"];
};

export {
  __,
  getAccountOptionsData,
  getAppDescription,
  getFAQ,
  getSellFastTips,
  getPrivacyPolicy,
  getTnC,
  getRelativeTimeConfig,
  getDrawerAccountOptionsData,
  getDrawerSupportOptionsData,
  getWeek,
  defaultLng,
};
