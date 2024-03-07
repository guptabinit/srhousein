import { createDrawerNavigator } from "@react-navigation/drawer";
import DrawerScreen from "../screens/DrawerScreen";
import { routes } from "./routes";
import TabNavigator from "./TabNavigator";

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerScreen {...props} />}
      screenOptions={{
        drawerStyle: {
          width: "85%",
        },
        headerShown: false,
      }}
    >
      <Drawer.Screen name={routes.tabNavigator} component={TabNavigator} />
    </Drawer.Navigator>
  );
};
export default DrawerNavigator;
