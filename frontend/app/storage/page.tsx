"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthContext";
import {
  uploadVideo,
  replaceVideo,
  getVideos,
  deleteVideo,
  bulkDeleteVideos,
} from "../api/storage/route";

interface Video {
  _id: string;
  userId: string;
  videoUrl: string;
  publicId: string;
  name: string;
  size: number;
}

const StoragePage = () => {
  const { token } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const fetchVideos = async () => {
    if (!token) return;

    try {
      const fetchedVideos = await getVideos(token);
      setVideos(fetchedVideos);
      setError(null);
    } catch (err) {
      console.error("Error fetching videos:", err);
      setError("Failed to fetch videos.");
    }
  };

  const handleUpload = async () => {
    if (!token || !file || !name) {
      setError("All fields are required.");
      return;
    }

    try {
      await uploadVideo(token, file, name);
      setError(null);
      fetchVideos();
    } catch (err) {
      console.error("Error uploading video:", err);
      setError("Failed to upload video.");
    }
  };

  const handleReplace = async () => {
    if (!token || !file || !selectedVideoId || !name) {
      setError("All fields are required for replacement.");
      return;
    }

    try {
      await replaceVideo(token, file, selectedVideoId, name);
      setError(null);
      fetchVideos();
    } catch (err) {
      console.error("Error replacing video:", err);
      setError("Failed to replace video.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;

    try {
      await deleteVideo(token, id);
      fetchVideos();
    } catch (err) {
      console.error("Error deleting video:", err);
    }
  };

  const handleBulkDelete = async () => {
    const videoIds = videos.map((video) => video._id);
    if (!token || videoIds.length === 0) return;

    try {
      await bulkDeleteVideos(token, videoIds);
      fetchVideos();
    } catch (err) {
      console.error("Error bulk deleting videos:", err);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [token]);

  return (
    <div>
      <h1>Storage Management</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Upload Video Section */}
      <input
        type="text"
        placeholder="Video Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="file"
        onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
      />
      <button onClick={handleUpload}>Upload Video</button>

      {/* Video List Section */}
      <h2>Videos</h2>
      <ul>
        {videos.map((video) => (
          <li key={video._id}>
            <p>{video.name}</p>
            <video src={video.videoUrl} controls width="300" />
            <button onClick={() => handleDelete(video._id)}>Delete</button>
            <button onClick={() => setSelectedVideoId(video._id)}>
              Select for Replace
            </button>
          </li>
        ))}
      </ul>

      {/* Bulk Delete Section */}
      <button onClick={handleBulkDelete}>Bulk Delete All Videos</button>

      {/* Replace Video Section */}
      <h2>Replace Selected Video</h2>
      {selectedVideoId && <p>Selected Video ID: {selectedVideoId}</p>}
      <input
        type="file"
        onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
      />
      <button onClick={handleReplace}>Replace Video</button>
    </div>
  );
};

export default StoragePage;
