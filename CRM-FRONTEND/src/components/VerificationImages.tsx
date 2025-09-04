import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useVerificationImages, useVerificationImagesBySubmission } from '@/hooks/useVerificationImages';
import { verificationImagesService } from '@/services/verificationImages';
import { Camera, MapPin, Calendar, Download, Eye, Image as ImageIcon, ExternalLink, Navigation, Clock } from 'lucide-react';
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

  const getAccuracyBadge = (accuracy: number) => {
    if (accuracy <= 5) {
      return { text: 'High Accuracy', className: 'bg-green-100 text-green-800' };
    } else if (accuracy <= 20) {
      return { text: 'Medium Accuracy', className: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { text: 'Low Accuracy', className: 'bg-red-100 text-red-800' };
    }
  };

  const openInGoogleMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const openInAppleMaps = (lat: number, lng: number) => {
    const url = `https://maps.apple.com/?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const copyCoordinates = (lat: number, lng: number) => {
    const coordinates = `${lat}, ${lng}`;
    navigator.clipboard.writeText(coordinates);
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
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => handleImageClick(image.url, image.originalName)}
                        />
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

                        {/* Action buttons for images without location */}
                        {!image.geoLocation && (
                          <div className="flex gap-1 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs"
                              onClick={() => handleImageClick(image.url, image.originalName)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs"
                              onClick={() => handleDownload(image.url, image.originalName)}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        )}

                        {image.geoLocation && (
                          <div className="space-y-2 mt-2 p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <MapPin className="h-3 w-3" />
                                <span className="font-medium">Location</span>
                              </div>
                              <Badge className={getAccuracyBadge(image.geoLocation.accuracy || 0).className}>
                                {getAccuracyBadge(image.geoLocation.accuracy || 0).text}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-gray-500">Lat:</span>
                                <span className="ml-1 font-mono">{image.geoLocation.latitude.toFixed(6)}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Lng:</span>
                                <span className="ml-1 font-mono">{image.geoLocation.longitude.toFixed(6)}</span>
                              </div>
                            </div>

                            {image.geoLocation.accuracy && (
                              <div className="text-xs text-gray-500">
                                <span>Accuracy: ±{image.geoLocation.accuracy}m</span>
                              </div>
                            )}

                            {image.geoLocation.timestamp && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="h-3 w-3" />
                                <span>Captured: {format(new Date(image.geoLocation.timestamp), 'MMM dd, HH:mm')}</span>
                              </div>
                            )}

                            <div className="flex gap-1 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs"
                                onClick={() => handleImageClick(image.url, image.originalName)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs"
                                onClick={() => handleDownload(image.url, image.originalName)}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs"
                                onClick={() => openInGoogleMaps(image.geoLocation.latitude, image.geoLocation.longitude)}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Google
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs"
                                onClick={() => openInAppleMaps(image.geoLocation.latitude, image.geoLocation.longitude)}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Apple
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs"
                                onClick={() => copyCoordinates(image.geoLocation.latitude, image.geoLocation.longitude)}
                              >
                                <Navigation className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                            </div>
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
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => handleImageClick(image.url, image.originalName)}
                        />
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

                        {/* Action buttons for images without location */}
                        {!image.geoLocation && (
                          <div className="flex gap-1 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs"
                              onClick={() => handleImageClick(image.url, image.originalName)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs"
                              onClick={() => handleDownload(image.url, image.originalName)}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        )}

                        {image.geoLocation && (
                          <div className="space-y-2 mt-2 p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <MapPin className="h-3 w-3" />
                                <span className="font-medium">Location</span>
                              </div>
                              <Badge className={getAccuracyBadge(image.geoLocation.accuracy || 0).className}>
                                {getAccuracyBadge(image.geoLocation.accuracy || 0).text}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-gray-500">Lat:</span>
                                <span className="ml-1 font-mono">{image.geoLocation.latitude.toFixed(6)}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Lng:</span>
                                <span className="ml-1 font-mono">{image.geoLocation.longitude.toFixed(6)}</span>
                              </div>
                            </div>

                            {image.geoLocation.accuracy && (
                              <div className="text-xs text-gray-500">
                                <span>Accuracy: ±{image.geoLocation.accuracy}m</span>
                              </div>
                            )}

                            {image.geoLocation.timestamp && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="h-3 w-3" />
                                <span>Captured: {format(new Date(image.geoLocation.timestamp), 'MMM dd, HH:mm')}</span>
                              </div>
                            )}

                            <div className="flex gap-1 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs"
                                onClick={() => handleImageClick(image.url, image.originalName)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs"
                                onClick={() => handleDownload(image.url, image.originalName)}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs"
                                onClick={() => openInGoogleMaps(image.geoLocation.latitude, image.geoLocation.longitude)}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Google
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs"
                                onClick={() => openInAppleMaps(image.geoLocation.latitude, image.geoLocation.longitude)}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Apple
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs"
                                onClick={() => copyCoordinates(image.geoLocation.latitude, image.geoLocation.longitude)}
                              >
                                <Navigation className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                            </div>
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
