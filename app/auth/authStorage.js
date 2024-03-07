import AsyncStorage from "@react-native-async-storage/async-storage";

const key = "authUser";

const storeUser = async (authUser) => {
  try {
    await AsyncStorage.setItem(key, authUser);
  } catch (error) {
    // TODO add error storing
  }
};

const getUser = async () => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    // TODO add error storing
  }
};

const removeUser = async () => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    // TODO add error storing
  }
};

export default { storeUser, getUser, removeUser };
