import React from "react";
import { FontAwesome } from "@expo/vector-icons";
import { Zocial } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { Fontisto } from "@expo/vector-icons";
import { Octicons } from "@expo/vector-icons";
import { SimpleLineIcons } from "@expo/vector-icons";
import { Entypo } from "@expo/vector-icons";
import { Feather } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import { AntDesign } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const icons = require("../icons.json");

const CategoryIcon = ({ iconName, iconSize, iconColor }) => {
  if (iconName == "stackoverflow") {
    return <Zocial name={iconName} size={iconSize} color={iconColor} />;
  } else if (iconName == "attach") {
    return <Ionicons name={iconName} size={iconSize} color={iconColor} />;
  } else if (icons.fontisto.includes(iconName)) {
    return <Fontisto name={iconName} size={iconSize} color={iconColor} />;
  } else if (icons.octicons.includes(iconName)) {
    return <Octicons name={iconName} size={iconSize} color={iconColor} />;
  } else if (icons.simpleLineIcons.includes(iconName)) {
    return (
      <SimpleLineIcons name={iconName} size={iconSize} color={iconColor} />
    );
  } else if (icons.entypo.includes(iconName)) {
    return <Entypo name={iconName} size={iconSize} color={iconColor} />;
  } else if (icons.feather.includes(iconName)) {
    return <Feather name={iconName} size={iconSize} color={iconColor} />;
  } else if (icons.materialIcons.includes(iconName)) {
    return <MaterialIcons name={iconName} size={iconSize} color={iconColor} />;
  } else if (icons.antDesign.includes(iconName)) {
    return <AntDesign name={iconName} size={iconSize} color={iconColor} />;
  } else if (icons.materialCommunityIcons.includes(iconName)) {
    return (
      <MaterialCommunityIcons
        name={iconName}
        size={iconSize}
        color={iconColor}
      />
    );
  } else if (icons.none.includes(iconName) || !iconName) {
    return <FontAwesome name="tag" size={iconSize} color={iconColor} />;
  } else {
    return <FontAwesome name={iconName} size={iconSize} color={iconColor} />;
  }
};

export default CategoryIcon;
