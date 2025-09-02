import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useVerificationImages, useVerificationImagesBySubmission } from '@/hooks/useVerificationImages';
import { verificationImagesService } from '@/services/verificationImages';
import { Camera, MapPin, Calendar, Download, Eye, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';

interface VerificationImagesProps {
  caseId: string;
  submissionId?: string;
  title?: string;
  showStats?: boolean;
}

interface ImageViewerProps {
  imageUrl: string;
  imageName: string;
  isOpen: boolean;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ imageUrl, imageName, isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {imageName}
          </DialogTitle>
        </DialogHeader>
        <div className="flex justify-center">
          <img
            src={verificationImagesService.getImageDisplayUrl(imageUrl)}
            alt={imageName}
            className="max-w-full max-h-[70vh] object-contain rounded-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const VerificationImages: React.FC<VerificationImagesProps> = ({
  caseId,
  submissionId,
  title = "Verification Images",
  showStats = true
}) => {
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);

  // Use appropriate hook based on whether submissionId is provided
  const { data, isLoading, error } = submissionId
    ? useVerificationImagesBySubmission(caseId, submissionId)
    : useVerificationImages(caseId);

  const images = data?.data || [];

  const handleImageClick = (imageUrl: string, imageName: string) => {
    setSelectedImage({ url: imageUrl, name: imageName });
  };

  const handleDownload = async (imageUrl: string, imageName: string) => {
    try {
      const blob = await verificationImagesService.downloadVerificationImage(imageUrl);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = imageName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  const formatGeoLocation = (geoLocation: any) => {
    if (!geoLocation) return null;
    return `${geoLocation.latitude.toFixed(6)}, ${geoLocation.longitude.toFixed(6)}`;
  };

  const getPhotoTypeColor = (photoType: string) => {
    switch (photoType) {
      case 'verification':
        return 'bg-blue-100 text-blue-800';
      case 'selfie':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Failed to load verification images</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (images.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No verification images found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group images by type for better organization
  const verificationPhotos = images.filter(img => img.photoType === 'verification');
  const selfiePhotos = images.filter(img => img.photoType === 'selfie');

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              {title}
            </div>
            {showStats && (
              <div className="flex gap-2">
                <Badge variant="outline">
                  {images.length} image{images.length !== 1 ? 's' : ''}
                </Badge>
                {verificationPhotos.length > 0 && (
                  <Badge className="bg-blue-100 text-blue-800">
                    {verificationPhotos.length} verification
                  </Badge>
                )}
                {selfiePhotos.length > 0 && (
                  <Badge className="bg-green-100 text-green-800">
                    {selfiePhotos.length} selfie
                  </Badge>
                )}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Verification Photos */}
            {verificationPhotos.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Verification Photos ({verificationPhotos.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {verificationPhotos.map((image) => (
                    <div key={image.id} className="group relative">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={image.thumbnailUrl 
                            ? verificationImagesService.getThumbnailDisplayUrl(image.thumbnailUrl)
                            : verificationImagesService.getImageDisplayUrl(image.url)
                          }
                          alt={image.originalName}
                          className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                          onClick={() => handleImageClick(image.url, image.originalName)}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleImageClick(image.url, image.originalName)}
                              className="mr-2"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleDownload(image.url, image.originalName)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">{image.originalName}</p>
                          <Badge className={getPhotoTypeColor(image.photoType)}>
                            {image.photoType}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(image.uploadedAt), 'MMM dd, yyyy HH:mm')}
                        </div>
                        {image.geoLocation && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" />
                            {formatGeoLocation(image.geoLocation)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selfie Photos */}
            {selfiePhotos.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Selfie Photos ({selfiePhotos.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selfiePhotos.map((image) => (
                    <div key={image.id} className="group relative">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={image.thumbnailUrl 
                            ? verificationImagesService.getThumbnailDisplayUrl(image.thumbnailUrl)
                            : verificationImagesService.getImageDisplayUrl(image.url)
                          }
                          alt={image.originalName}
                          className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                          onClick={() => handleImageClick(image.url, image.originalName)}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleImageClick(image.url, image.originalName)}
                              className="mr-2"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleDownload(image.url, image.originalName)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">{image.originalName}</p>
                          <Badge className={getPhotoTypeColor(image.photoType)}>
                            {image.photoType}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(image.uploadedAt), 'MMM dd, yyyy HH:mm')}
                        </div>
                        {image.geoLocation && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" />
                            {formatGeoLocation(image.geoLocation)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image Viewer Modal */}
      {selectedImage && (
        <ImageViewer
          imageUrl={selectedImage.url}
          imageName={selectedImage.name}
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  );
};

export default VerificationImages;
