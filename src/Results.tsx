import React, { useState } from 'react';
import {
  Box,
  Typography,
  Alert,
  Card,
  CardContent,
  CardMedia,
  Dialog,
  IconButton,
  DialogContent,
  DialogTitle,
  Fade
} from '@mui/material';
import {
  ErrorOutline,
  InsertChart,
  ViewModule,
  Map,
  Close,
  NavigateNext,
  NavigateBefore,
  ZoomIn,
  ZoomOut,
  ZoomOutMap
} from '@mui/icons-material';
import { AnalysisResponse } from './types';

interface ResultsProps {
  response: AnalysisResponse | null;
  error: string | null;
  loading: boolean;
}

interface CustomImageViewerProps {
  images: Array<{
    key: string;
    plotId: string;
    src: string;
    index: number;
  }>;
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  plotDetails: any[];
}

const CustomImageViewer: React.FC<CustomImageViewerProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNext,
  onPrev,
  plotDetails
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const currentImage = images[currentIndex];
  const currentPlot = plotDetails.find(p => p.plot_id === parseInt(currentImage?.plotId));

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.5, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.5, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [isOpen, currentIndex]);

  if (!isOpen || !currentImage) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth={false}
      fullScreen
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          margin: 0,
        }
      }}
    >
      <DialogTitle sx={{ 
        color: 'white', 
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 2
      }}>
        <Box>
          <Typography variant="h6" sx={{ color: 'white' }}>
            Plot {currentImage.plotId} - Highlighted View
          </Typography>
          {currentPlot && (
            <Typography variant="body2" sx={{ color: '#ccc', mt: 0.5 }}>
              {currentPlot.shape_type} • {currentPlot.area_value} sq.m • {currentPlot.num_sides} sides
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ color: '#ccc' }}>
            {currentIndex + 1} of {images.length}
          </Typography>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ 
        p: 0, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Navigation Controls */}
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: 20,
          transform: 'translateY(-50%)',
          zIndex: 10
        }}>
          <IconButton
            onClick={onPrev}
            disabled={images.length <= 1}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              },
              '&:disabled': {
                opacity: 0.3
              }
            }}
          >
            <NavigateBefore fontSize="large" />
          </IconButton>
        </Box>

        <Box sx={{
          position: 'absolute',
          top: '50%',
          right: 20,
          transform: 'translateY(-50%)',
          zIndex: 10
        }}>
          <IconButton
            onClick={onNext}
            disabled={images.length <= 1}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              },
              '&:disabled': {
                opacity: 0.3
              }
            }}
          >
            <NavigateNext fontSize="large" />
          </IconButton>
        </Box>

        {/* Zoom Controls */}
        <Box sx={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          display: 'flex',
          gap: 1,
          zIndex: 10
        }}>
          <IconButton
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
              '&:disabled': { opacity: 0.3 }
            }}
          >
            <ZoomOut />
          </IconButton>
          <IconButton
            onClick={handleResetZoom}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
            }}
          >
            <ZoomOutMap />
          </IconButton>
          <IconButton
            onClick={handleZoomIn}
            disabled={zoom >= 5}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
              '&:disabled': { opacity: 0.3 }
            }}
          >
            <ZoomIn />
          </IconButton>
        </Box>

        {/* Image Container */}
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            overflow: 'hidden'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <Fade in={true} timeout={300}>
            <Box
              component="img"
              src={currentImage.src}
              alt={`Highlighted Plot ${currentImage.plotId}`}
              sx={{
                maxWidth: zoom === 1 ? '90%' : 'none',
                maxHeight: zoom === 1 ? '90%' : 'none',
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                userSelect: 'none',
                pointerEvents: 'none'
              }}
            />
          </Fade>
        </Box>

        {/* Plot Details Overlay */}
        {currentPlot && (
          <Box sx={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            p: 2,
            borderRadius: 1,
            maxWidth: 300
          }}>
            <Typography variant="subtitle2" gutterBottom>
              Plot {currentImage.plotId} Details
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              Shape: {currentPlot.shape_type} ({currentPlot.num_sides} sides)
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              Area: {currentPlot.area_value} sq.m ({(currentPlot.area_value * 10.764).toFixed(1)} sq.ft)
            </Typography>
            <Typography variant="body2">
              Edges: {currentPlot.edge_dimensions.map((edge: any) => `${edge.length_meters}m`).join(', ')}
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

const Results: React.FC<ResultsProps> = ({ response, error, loading }) => {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (loading) {
    return (
      <div className="results-section">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <Typography variant="h6" gutterBottom>
            Processing Your Site Plan
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Analyzing the image and generating detailed plots...
          </Typography>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-section">
        <div className="error-container">
          <ErrorOutline className="error-icon" />
          <Typography variant="h6" gutterBottom>
            Analysis Failed
          </Typography>
          <Alert severity="error" variant="outlined" sx={{ mt: 2, maxWidth: 400 }}>
            {error}
          </Alert>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="results-section">
        <div className="empty-state">
          <InsertChart className="empty-icon" />
          <Typography variant="h6" gutterBottom>
            Ready for Analysis
          </Typography>
          <Typography variant="body1">
            Upload a site plan image above to get started with the analysis
          </Typography>
        </div>
      </div>
    );
  }

  const { summary, svgs, images } = response;

  // Calculate total area
  const totalArea = summary.plots.reduce((sum, plot) => sum + plot.area_value, 0);

  // Prepare ONLY highlighted plot photos for gallery
  const plotPhotos = Object.entries(svgs || images || {})
    .filter(([key, value]) => {
      // Only include highlighted plots and exclude overview
      return key.includes('_highlighted') && key !== 'overview' && value !== undefined && value.trim() !== '';
    })
    .map(([key, content], index) => {
      // Extract plot ID from key (e.g., "plot_1_highlighted" -> "1")
      const plotIdMatch = key.match(/plot_(\d+)_highlighted/);
      const plotId = plotIdMatch ? plotIdMatch[1] : key;

      let src: string;
      if (svgs) {
        // SVG content - inline
        const cleanSvgString = (content as string).trim();
        src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cleanSvgString)}`;
      } else if (images) {
        // Base64 encoded image - use directly
        src = content as string;
      } else {
        src = '';
      }

      return {
        key,
        plotId,
        src,
        index,
      };
    })
    .sort((a, b) => parseInt(a.plotId) - parseInt(b.plotId));

  const openViewer = (index: number) => {
    setCurrentImageIndex(index);
    setViewerOpen(true);
  };

  const closeViewer = () => {
    setViewerOpen(false);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % plotPhotos.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev + plotPhotos.length - 1) % plotPhotos.length);
  };

  return (
    <div className="results-section">
      <div className="results-header">
        <Typography variant="h2" gutterBottom>
          Analysis Results
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Detailed breakdown of your site plan with interactive visualizations
        </Typography>
      </div>

      <div className="results-content">
        <div className="summary-section">
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            Summary Statistics
          </Typography>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{summary.total_plots}</div>
              <div className="stat-label">Total Plots</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{totalArea.toFixed(1)}</div>
              <div className="stat-label">Total Area (sq.m)</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{(totalArea * 10.764).toFixed(0)}</div>
              <div className="stat-label">Total Area (sq.ft)</div>
            </div>
          </div>

          <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
            Plot Details
          </Typography>
          
          {/* <div className="table-container">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Plot ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Shape</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Area (sq.m)</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Area (sq.ft)</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Highlighted Plot</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Edge Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summary.plots.map((plot, index) => (
                    <TableRow
                      key={plot.plot_id}
                      sx={{
                        backgroundColor: index % 2 === 0 ? 'white' : '#f8fafc',
                        '&:hover': { backgroundColor: '#f0f4ff' }
                      }}
                    >
                      <TableCell sx={{ fontWeight: 500 }}>{plot.plot_id}</TableCell>
                      <TableCell>{`${plot.shape_type} (${plot.num_sides} sides)`}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{plot.area_value}</TableCell>
                      <TableCell sx={{ color: '#64748b' }}>{(plot.area_value * 10.764).toFixed(1)}</TableCell>
                      <TableCell>
                        {svgs[`plot_${plot.plot_id}_highlighted`] ? (
                          <div
                            style={{
                              border: '1px solid #e2e8f0',
                              borderRadius: '4px',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center'
                            }}
                            dangerouslySetInnerHTML={{
                              __html: svgs[`plot_${plot.plot_id}_highlighted`]
                            }}
                          />
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            No highlighted version available
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ fontSize: '0.875rem', color: '#64748b' }}>
                          {plot.edge_dimensions
                            .map((edge) => `${edge.length_meters}m (${edge.source})`)
                            .join(', ')}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div> */}
        </div>

        <div className="gallery-section">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <Map sx={{ color: '#6366f1' }} />
            <Typography variant="h6">
              Site Plan Overview
            </Typography>
          </Box>

          {(svgs?.overview || images?.overview) && (
            <div className="overview-container">
              {svgs?.overview ? (
                <div dangerouslySetInnerHTML={{ __html: svgs.overview }} />
              ) : images?.overview ? (
                <img
                  src={images.overview}
                  alt="Site Plan Overview"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              ) : null}
            </div>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <ViewModule sx={{ color: '#6366f1' }} />
            <Typography variant="h6">
              Highlighted Plot Gallery ({plotPhotos.length} highlighted plots)
            </Typography>
          </Box>
          
          {plotPhotos.length > 0 ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
              {plotPhotos.map((photo, index) => {
                const plot = summary.plots.find(p => p.plot_id === parseInt(photo.plotId));
                if (!plot) return null;
                return (
                  <Card
                    key={photo.key}
                    sx={{
                      maxWidth: 345,
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                      }
                    }}
                    onClick={() => openViewer(index)}
                  >
                    <CardMedia
                      component="img"
                      height="400"
                      width="100%"
                      image={photo.src}
                      alt={`Highlighted Plot ${photo.plotId}`}
                    />
                    <CardContent>
                      <Typography gutterBottom variant="h5" component="div">
                        Plot {photo.plotId} (Highlighted)
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Shape: {plot.shape_type} ({plot.num_sides} sides)
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Area: {plot.area_value} sq.m ({(plot.area_value * 10.764).toFixed(1)} sq.ft)
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Edges: {plot.edge_dimensions.map((edge) => `${edge.length_meters}m (${edge.source})`).join(', ')}
                      </Typography>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              py: 6,
              color: '#64748b'
            }}>
              <ViewModule sx={{ fontSize: '3rem', mb: 2, color: '#cbd5e1' }} />
              <Typography variant="body1">
                No highlighted plots available for display
              </Typography>
            </Box>
          )}
        </div>
      </div>

      <CustomImageViewer
        images={plotPhotos}
        currentIndex={currentImageIndex}
        isOpen={viewerOpen}
        onClose={closeViewer}
        onNext={nextImage}
        onPrev={prevImage}
        plotDetails={summary.plots}
      />
    </div>
  );
};

export default Results;
