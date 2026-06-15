import Svg, {
  Circle,
  Line,
  Path,
} from "react-native-svg";

export default function ForumIcon({
  color = "#ffffff",
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
        <Path d="M6 4.5C6 3.7 6.7 3 7.5 3h9c.8 0 1.5.7 1.5 1.5V21l-6-3.8L6 21V4.5Z" {...commonProps} />
      ) : null}
      {name === "like" ? (
        <Path d="M20.8 5.9c-1.8-1.8-4.8-1.8-6.6 0L12 8.1 9.8 5.9C8 4.1 5 4.1 3.2 5.9s-1.8 4.8 0 6.6L12 21l8.8-8.5c1.8-1.8 1.8-4.8 0-6.6Z" {...commonProps} />
      ) : null}
      {name === "comment" ? (
        <Path d="M21 11.5a8 8 0 0 1-8 8H7.8L3 22l1.4-4.4A8 8 0 1 1 21 11.5Z" {...commonProps} />
      ) : null}
      {name === "post" ? (
        <>
          <Circle cx="12" cy="12" r="9" {...commonProps} />
          <Line x1="12" x2="12" y1="8" y2="16" {...commonProps} />
          <Line x1="8" x2="16" y1="12" y2="12" {...commonProps} />
        </>
      ) : null}
    </Svg>
  );
}
