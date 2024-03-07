import * as React from "react";
import Svg, { G, Path } from "react-native-svg";

const RenewIcon = (props) => (
  <Svg
    width={18}
    height={18}
    viewBox="0 0 1024 1024"
    className="icon"
    xmlns="http://www.w3.org/2000/svg"
    stroke="#000"
    strokeWidth={3.072}
    {...props}
  >
    <G fill={props.fillColor}>
      <Path d="M277.333 277.333c0-70.4 57.6-128 128-128h213.334c70.4 0 128 57.6 128 128H832C832 160 736 64 618.667 64H405.333C288 64 192 160 192 277.333v238.934h85.333V277.333z" />
      <Path d="m98.133 469.333 136.534 179.2 136.533-179.2zM746.667 746.667c0 70.4-57.6 128-128 128H405.333c-70.4 0-128-57.6-128-128H192C192 864 288 960 405.333 960h213.334C736 960 832 864 832 746.667v-256h-85.333v256z" />
      <Path d="m652.8 554.667 136.533-179.2 136.534 179.2z" />
    </G>
  </Svg>
);

export default RenewIcon;
