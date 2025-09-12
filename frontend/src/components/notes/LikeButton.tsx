import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { likeNote, checkLikeStatus } from "../../lib/api/notes";

interface LikeButtonProps {
  noteId: string;
  initialLikeCount?: number;
  className?: string;
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  noteId,
  initialLikeCount = 0,
  className = "",
}) => {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Check like status on component mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        setIsCheckingStatus(true);
        const status = await checkLikeStatus(noteId);
        setLikeCount(status.likeCount);
        setIsLiked(status.liked);
      } catch (error) {
        console.error("Failed to check like status:", error);
        // Use initial values if check fails
        setLikeCount(initialLikeCount);
        setIsLiked(false);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkStatus();
  }, [noteId, initialLikeCount]);

  const handleLike = async () => {
    if (isLoading || isLiked) return;

    try {
      setIsLoading(true);
      const result = await likeNote(noteId);
      setLikeCount(result.likeCount);
      setIsLiked(result.liked);
    } catch (error: any) {
      console.error("Failed to like note:", error);

      // Show user-friendly error message
      if (error.message.includes("already liked")) {
        // If user already liked, update the state to reflect that
        setIsLiked(true);
      } else {
        // For other errors, you might want to show a toast notification
        alert("Failed to like the note. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingStatus) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-pulse">
          <Heart className="w-5 h-5 text-gray-300" />
        </div>
        <span className="text-sm text-gray-500 animate-pulse">...</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleLike}
      disabled={isLoading || isLiked}
      className={`
        flex items-center space-x-2 transition-all duration-200 
        ${
          isLiked
            ? "text-red-500 cursor-default"
            : "text-gray-500 hover:text-red-500 hover:scale-105 active:scale-95"
        }
        ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
      title={isLiked ? "You already liked this note" : "Like this note"}
    >
      <Heart
        className={`w-5 h-5 transition-all duration-200 ${
          isLiked ? "fill-current" : ""
        } ${isLoading ? "animate-pulse" : ""}`}
      />
      <span className="text-sm font-medium">{likeCount}</span>
    </button>
  );
};

export default LikeButton;
