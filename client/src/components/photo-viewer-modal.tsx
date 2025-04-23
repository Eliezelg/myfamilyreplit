import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Photo, User } from "@shared/schema";
import { X } from "lucide-react";

interface PhotoViewerModalProps {
  photo: Photo;
  user?: User;
  isOpen: boolean;
  onClose: () => void;
}

export default function PhotoViewerModal({ photo, user, isOpen, onClose }: PhotoViewerModalProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 flex justify-between items-center border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full overflow-hidden bg-primary flex items-center justify-center text-white">
              {user?.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt={user.username || "משתמש"} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="font-bold text-lg">
                  {user?.username ? user.username.charAt(0).toUpperCase() : "מ"}
                </span>
              )}
            </div>
            <div>
              <p className="font-medium">{user?.username || "משתמש"}</p>
              <p className="text-sm text-gray-500">
                {photo.uploadedAt ? new Date(photo.uploadedAt).toLocaleDateString("he-IL") : ""}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="relative flex-1 min-h-[50vh] overflow-hidden bg-black flex items-center justify-center">
          <img 
            src={photo.imageUrl} 
            alt="תמונת משפחה" 
            className="max-h-full max-w-full object-contain"
          />
        </div>
        
        {photo.caption && (
          <div className="p-4 border-t">
            <p className="text-lg">{photo.caption}</p>
          </div>
        )}
      </div>
    </div>
  );
}