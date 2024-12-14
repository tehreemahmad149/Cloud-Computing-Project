const STORAGE_API_URL = "http://localhost:3002/api/storage";

// Define a Video interface
interface Video {
  _id: string;
  userId: string;
  videoUrl: string;
  publicId: string;
  name: string;
  size: number;
}

// Upload a video
export const uploadVideo = async (
  token: string,
  file: File,
  name: string
): Promise<void> => {
  const formData = new FormData();
  formData.append("video", file);
  formData.append("name", name);

  const response = await fetch(`${STORAGE_API_URL}/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to upload video");
  }
};

// Replace a video
export const replaceVideo = async (
  token: string,
  file: File,
  videoId: string,
  name: string
): Promise<void> => {
  const formData = new FormData();
  formData.append("video", file);
  formData.append("videoId", videoId);
  formData.append("name", name);

  const response = await fetch(`${STORAGE_API_URL}/replace`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to replace video");
  }
};

// Fetch all videos for a user
export const getVideos = async (token: string): Promise<Video[]> => {
  const response = await fetch(`${STORAGE_API_URL}/:userId/videos`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch videos");
  }

  const data = await response.json();
  return data.videos as Video[]; // Use the defined Video interface
};

// Delete a video
export const deleteVideo = async (
  token: string,
  videoId: string
): Promise<void> => {
  const response = await fetch(`${STORAGE_API_URL}/delete`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ videoId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete video");
  }
};

// Bulk delete videos
export const bulkDeleteVideos = async (
  token: string,
  videoIds: string[]
): Promise<void> => {
  const response = await fetch(`${STORAGE_API_URL}/bulk-delete`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ videoIds }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to bulk delete videos");
  }
};
