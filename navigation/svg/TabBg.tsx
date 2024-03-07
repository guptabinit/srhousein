import React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

type Props = SvgProps & {
  color?: string;
};

export const TabBg = ({ color = "#FFFFFF", ...props }) => {
  return (
    <Svg
      width={85}
      height={55}
      viewBox="0 0 85 55"
      {...props}
      // style={{ elevation: 800 }}
    >
      <Path
        d="M 85.2 0 v 61 H 0 V 0 c 4.1 0 7 4 7.9 7.1 C 12 21 25 33 43 33 c 21 0 30 -13 34 -26 c 1 -3 3.9 -7.1 7.9 -7.1 h 0.1 z"
        fill={color}
      />
    </Svg>
  );
};
