import React, { useState } from "react";
import { View, Text } from "react-native";

// External Libraries
import DraggableFlatList from "react-native-draggable-flatlist";

// Custom Components & Constants
import ImageInput from "./ImageInput";
import { __ } from "../language/stringPicker";

const ImageInputList = ({
  imageUris = [],
  onRemoveImage,
  onAddImage,
  maxCount,
  reorder,
  type,
}) => {
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const renderImageItem = ({ item, drag, isActive }) => {
    return (
      <ImageInput
        imageUri={item}
        onChangeImage={() => onRemoveImage(item)}
        drag={drag}
        active={isActive}
        display={true}
        type={type}
      />
    );
  };
  return (
    <View
      style={{
        paddingHorizontal: "3%",
        marginVertical: !imageUris.length ? 15 / 2 : 15,
      }}
    >
      <DraggableFlatList
        ListHeaderComponent={
          imageUris.length < maxCount && (
            <ImageInput
              onChangeImage={(data) => {
                setPhotoModalVisible(false);
                onAddImage(data);
              }}
              addingImage={photoModalVisible}
              closePhotoModal={() => setPhotoModalVisible(false)}
              display={false}
              type={type}
            />
          )
        }
        data={imageUris}
        renderItem={renderImageItem}
        keyExtractor={(item, index) => `draggable-item-${index}`}
        onDragEnd={({ data }) => {
          if (type) {
            return;
          }
          reorder(data);
        }}
        horizontal
      />
    </View>
  );
};

export default ImageInputList;
