import Svg, {
  Circle,
  Line,
  Path,
} from "react-native-svg";

export default function ForumIcon({
  color = "#ffffff",
  filled = false,
  name,
  size = 20,
  strokeWidth = 2.2,
  style,
}) {
  const commonProps = {
    fill: "none",
    stroke: color,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth,
  };
  const filledProps = {
    ...commonProps,
    fill: filled ? color : "none",
  };

  if (name === "post") {
    return (
      <Svg
        height={size}
        style={style}
        viewBox="0 0 210 210"
        width={size}
      >
        <Path
          d="M91 2.72727C91 1.22104 92.221 0 93.7273 0C108.79 0 121 12.2104 121 27.2727V207.273C121 208.779 119.779 210 118.273 210C103.21 210 91 197.79 91 182.727V2.72727Z"
          fill={color}
        />
        <Path
          d="M207.273 122C208.779 122 210 120.779 210 119.273C210 104.21 197.79 92 182.727 92H2.72727C1.22104 92 0 93.221 0 94.7273C0 109.79 12.2104 122 27.2727 122H207.273Z"
          fill={color}
        />
      </Svg>
    );
  }

  return (
    <Svg
      height={size}
      style={style}
      viewBox="0 0 24 24"
      width={size}
    >
      {name === "search" ? (
        <>
          <Circle cx="11" cy="11" r="7" {...commonProps} />
          <Line x1="16.2" x2="21" y1="16.2" y2="21" {...commonProps} />
        </>
      ) : null}
      {name === "save" ? (
        <Path d="M6 4.5C6 3.7 6.7 3 7.5 3h9c.8 0 1.5.7 1.5 1.5V21l-6-3.8L6 21V4.5Z" {...filledProps} />
      ) : null}
      {name === "like" ? (
        <Path d="M20.8 5.9c-1.8-1.8-4.8-1.8-6.6 0L12 8.1 9.8 5.9C8 4.1 5 4.1 3.2 5.9s-1.8 4.8 0 6.6L12 21l8.8-8.5c1.8-1.8 1.8-4.8 0-6.6Z" {...filledProps} />
      ) : null}
      {name === "comment" ? (
        <Path d="M21 11.5a8 8 0 0 1-8 8H7.8L3 22l1.4-4.4A8 8 0 1 1 21 11.5Z" {...commonProps} />
      ) : null}
    </Svg>
  );
}
