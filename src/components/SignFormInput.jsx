import { View, TextInput, Image } from "react-native";

const iconMap = {
  user: require("../assets/icons/user.png"),
};

export default function SignFormInput({ text, image, inputProps, type }) {
  const iconSource = image ? iconMap[image] : null;
  return (
    <View
      style={{
        borderWidth: 2,
        borderColor: "#585858",
        borderRadius: 120,
        marginHorizontal: 20,
        backgroundColor: "#151515",
        height: 70,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 15,
      }}
    >
      {iconSource ? (
        <Image
          source={iconSource}
          style={{ width: 30, height: 30, marginLeft: 10, marginRight: 10 }}
        />
      ) : null}
      <TextInput
        placeholder={text}
        placeholderTextColor="#fff"
        style={{
          color: "#fff",
          fontFamily: "BebasNeue",
          fontSize: 20,
          flex: 1,
          textAlignVertical: "center",
          height: "100%",
          paddingVertical: 0,
        }}
        {...inputProps}
      />
    </View>
  );
}

