import * as ImagePicker from "expo-image-picker";

import { storage } from "../config/firebase.js";
import { getDownloadURL, ref, uploadBytes } from "../config/firebaseSdk.js";
import { assertSafeFirestoreDocumentId } from "./inputValidation.js";

const DEFAULT_IMAGE_MIME_TYPE = "image/jpeg";
const DEFAULT_VIDEO_MIME_TYPE = "video/mp4";
const MAX_PROFILE_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_FORUM_MEDIA_BYTES = 100 * 1024 * 1024;

function getAssetMimeType(asset = {}, fallbackType = "image") {
  const explicitMimeType = String(asset.mimeType || "").trim().toLowerCase();

  if (explicitMimeType) {
    return explicitMimeType;
  }

  return fallbackType === "video" ? DEFAULT_VIDEO_MIME_TYPE : DEFAULT_IMAGE_MIME_TYPE;
}

function getFileExtension(asset = {}, mediaType = "image") {
  const fileName = String(asset.fileName || asset.uri || "").split("?")[0];
  const extensionMatch = fileName.match(/\.([a-z0-9]+)$/i);

  if (extensionMatch?.[1]) {
    return extensionMatch[1].toLowerCase();
  }

  const mimeType = getAssetMimeType(asset, mediaType);
  const mimeExtension = mimeType.split("/")[1]?.split(";")[0];

  if (mimeExtension) {
    return mimeExtension === "jpeg" ? "jpg" : mimeExtension;
  }

  return mediaType === "video" ? "mp4" : "jpg";
}

function getMediaType(asset = {}) {
  return asset.type === "video" ? "video" : "image";
}

function createStorageFileName(asset = {}, mediaType = "image") {
  const extension = getFileExtension(asset, mediaType);
  const entropy = Math.random().toString(36).slice(2, 10);

  return `${Date.now()}-${entropy}.${extension}`;
}

async function requestMediaLibraryAccess() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error("Media library access is needed to choose a file.");
  }
}

async function pickMedia(mediaTypes) {
  await requestMediaLibraryAccess();

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: false,
    mediaTypes,
    quality: 0.88,
    videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
  });

  if (result.canceled || !result.assets?.[0]?.uri) {
    return null;
  }

  return result.assets[0];
}

async function uploadAsset({ asset, ownerId, directory, forcedMediaType }) {
  if (!asset?.uri) {
    throw new Error("No media file was selected.");
  }

  const safeOwnerId = assertSafeFirestoreDocumentId(ownerId, "ownerId");
  const mediaType = forcedMediaType || getMediaType(asset);
  const mimeType = getAssetMimeType(asset, mediaType);
  const maxBytes =
    directory === "profilePictures" ?
      MAX_PROFILE_IMAGE_BYTES :
      MAX_FORUM_MEDIA_BYTES;

  if (asset.fileSize && asset.fileSize > maxBytes) {
    throw new Error(
      directory === "profilePictures" ?
        "Profile pictures must be under 10 MB." :
        "Forum media must be under 100 MB."
    );
  }

  const response = await fetch(asset.uri);

  if (!response.ok) {
    throw new Error("Could not read the selected media file.");
  }

  const blob = await response.blob();
  const fileRef = ref(
    storage,
    `${directory}/${safeOwnerId}/${createStorageFileName(asset, mediaType)}`
  );

  await uploadBytes(fileRef, blob, {
    contentType: mimeType,
    customMetadata: {
      ownerId: safeOwnerId,
      mediaType,
    },
  });

  return {
    mediaType,
    mimeType,
    url: await getDownloadURL(fileRef),
  };
}

export async function pickForumMedia() {
  return pickMedia(["images", "videos"]);
}

export async function pickProfileImage() {
  return pickMedia(["images"]);
}

export async function uploadForumMedia({ asset, ownerId }) {
  return uploadAsset({
    asset,
    ownerId,
    directory: "forumMedia",
  });
}

export async function uploadProfileImage({ asset, ownerId }) {
  return uploadAsset({
    asset,
    ownerId,
    directory: "profilePictures",
    forcedMediaType: "image",
  });
}
