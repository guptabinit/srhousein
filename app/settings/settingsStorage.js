import AsyncStorage from "@react-native-async-storage/async-storage";

const key = "appSettings";

const storeAppSettings = async (appSettings) => {
  try {
    await AsyncStorage.setItem(key, appSettings);
  } catch (error) {
    // TODO add error storing
  }
};

const getAppSettings = async () => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    // TODO add error storing
  }
};

const removeAppSettings = async () => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    // TODO add error storing
  }
};

export default { storeAppSettings, getAppSettings, removeAppSettings };
