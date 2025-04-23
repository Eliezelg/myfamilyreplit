import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Photo, FamilyMember, User } from "@shared/schema";
import { X, UploadCloud, Image as ImageIcon } from "lucide-react";
import PhotoViewerModal from "./photo-viewer-modal";

interface PhotosViewerModalProps {
  photos: Photo[];
  members?: (FamilyMember & { user?: User })[];
  familyId: number;
  isOpen: boolean;
  onClose: () => void;
  onUploadClick: () => void;
}

export default function PhotosViewerModal({ 
  photos, 
  members, 
  familyId, 
  isOpen, 
  onClose,
  onUploadClick 
}: PhotosViewerModalProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  
  if (!isOpen) return null;
  
  // Récupérer l'utilisateur associé à la photo
  const getPhotoUser = (photo: Photo) => {
    const member = members?.find(m => m.userId === photo.userId);
    return member?.user;
  };
  
  return (
    <>
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-auto">
          <div className="p-4 flex justify-between items-center border-b sticky top-0 bg-white">
            <h2 className="text-xl font-bold">תמונות משפחתיות</h2>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1"
                onClick={onUploadClick}
              >
                <UploadCloud className="h-4 w-4" />
                העלה תמונות
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <div className="p-6">
            {photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {photos.map((photo) => {
                  const user = getPhotoUser(photo);
                  
                  return (
                    <div 
                      key={photo.id} 
                      className="relative group rounded-lg overflow-hidden bg-neutral-200 cursor-pointer"
                      style={{ aspectRatio: '1' }}
                      onClick={() => {
                        setSelectedPhoto(photo);
                        setIsPhotoModalOpen(true);
                      }}
                    >
                      <img 
                        src={photo.imageUrl} 
                        alt={photo.caption || "תמונת משפחה"} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full overflow-hidden bg-primary flex items-center justify-center text-white shrink-0">
                            {user?.profileImage ? (
                              <img 
                                src={user.profileImage} 
                                alt={user.username || "משתמש"} 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="font-bold text-xs">
                                {user?.username ? user.username.charAt(0).toUpperCase() : "מ"}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-white truncate">{user?.username || "משתמש"}</p>
                        </div>
                        {photo.caption && (
                          <p className="text-white text-sm mt-1 line-clamp-2">{photo.caption}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <ImageIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-2">עדיין אין תמונות</p>
                <Button onClick={onUploadClick}>העלה תמונות</Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {selectedPhoto && (
        <PhotoViewerModal 
          photo={selectedPhoto}
          user={getPhotoUser(selectedPhoto)}
          isOpen={isPhotoModalOpen}
          onClose={() => {
            setIsPhotoModalOpen(false);
            setTimeout(() => setSelectedPhoto(null), 300);
          }}
        />
      )}
    </>
  );
}