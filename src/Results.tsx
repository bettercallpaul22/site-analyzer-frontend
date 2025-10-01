import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Alert,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  CircularProgress,
  Modal,
} from '@mui/material';
import {
  ErrorOutline,
  InsertChart,
  ViewModule,
  Map,
  Close,
  Download,
} from '@mui/icons-material';
import { AnalysisResponse } from './types';

interface ResultsProps {
  response: AnalysisResponse | null;
  error: string | null;
  loading: boolean;
}

const Results: React.FC<ResultsProps> = ({ response, error, loading }) => {
  const [selectedPlotId, setSelectedPlotId] = useState<number | null>(null);
  const [highlightLoading] = useState(false);
  const [highlightError] = useState<string | null>(null);
  const [highlightedOverview, setHighlightedOverview] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // eslint-disable-next-line 
  const colors = [
    { fill: '#f59e0b', stroke: '#b45309' }, // orange
    { fill: '#10b981', stroke: '#047857' }, // green
    { fill: '#3b82f6', stroke: '#1d4ed8' }, // blue
    { fill: '#ef4444', stroke: '#dc2626' }, // red
    { fill: '#8b5cf6', stroke: '#7c3aed' }, // purple
    { fill: '#f97316', stroke: '#ea580c' }, // orange2
    { fill: '#06b6d4', stroke: '#0891b2' }, // cyan
    { fill: '#84cc16', stroke: '#65a30d' }, // lime
    { fill: '#ec4899', stroke: '#db2777' }, // pink
    { fill: '#f59e0b', stroke: '#b45309' }  // fallback
  ];

  const { summary, svgs, images } = response || {};

  const plotPhotos = useMemo(() => {
    if (!response || (!svgs && !images)) return [];
    return Object.entries(svgs || images || {})
      .filter(([key, value]) => key.includes('_highlighted') && key !== 'overview' && value)
      .map(([key, content], index) => {
        const plotIdMatch = key.match(/plot_(\d+)_highlighted/);
        const plotId = plotIdMatch ? plotIdMatch[1] : key;

        let src: string;
        if (svgs) {
          src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent((content as string).trim())}`;
        } else {
          src = content as string;
        }

        return { key, plotId, src, index };
      })
      .sort((a, b) => parseInt(a.plotId) - parseInt(b.plotId));
  }, [response, svgs, images]);

  const selectedPlotPhoto = useMemo(() => {
    if (!selectedPlotId) return null;
    return plotPhotos.find(p => parseInt(p.plotId) === selectedPlotId);
  }, [selectedPlotId, plotPhotos]);

  const selectedPlotDetails = useMemo(() => {
    if (!selectedPlotId || !summary?.plots) return null;
    return summary.plots.find((p: any) => p.plot_id === selectedPlotId);
  }, [selectedPlotId, summary?.plots]);

  // Log details when a plot is selected for debugging
  useEffect(() => {
    if (selectedPlotId) {
      console.group(`[DEBUG] Plot ID: ${selectedPlotId}`);
      console.log("Selected Plot Photo:", selectedPlotPhoto);
      console.log("Selected Plot Details:", selectedPlotDetails);
      console.log("Available Plot Photos:", plotPhotos);
      // console.log("Available Plot Summaries:", summary?.plots);
      console.groupEnd();
    }
  }, [selectedPlotId, selectedPlotPhoto, selectedPlotDetails, plotPhotos, summary?.plots]);

  const handleOverviewClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as SVGElement;
    const plotElement = target.closest<SVGElement>("[id^='plot_']");

    if (plotElement) {
      const plotId = parseInt(plotElement.id.replace("plot_", ""), 10);

      // Toggle selection
      if (selectedPlotId === plotId) {
        setSelectedPlotId(null);
      } else {
        setSelectedPlotId(plotId);
      }
    } else {
      // Clicked on the background, deselect
      if (selectedPlotId !== null) setSelectedPlotId(null);
      setHighlightedOverview(null);
      console.log('Clicked on SVG background, deselecting.');
    }
  }, [selectedPlotId]);

  // This effect now handles swapping the overview SVG to the highlighted version
  // when a plot is selected, using the data we already have.
  useEffect(() => {
    if (selectedPlotId && svgs) {
      const highlightedSvgKey = `plot_${selectedPlotId}_highlighted`;
      const newSvgHtml = svgs[highlightedSvgKey];
      setHighlightedOverview(newSvgHtml || null);
    } else {
      setHighlightedOverview(null);
    }
  }, [selectedPlotId, svgs]);

  // Highlight selected plot by changing style (keep existing logic for immediate feedback)
  useEffect(() => {
    if (!response || (!svgs?.overview && !highlightedOverview)) return;
    const container = document.getElementById(highlightedOverview ? "highlighted-overview-container" : "overview-svg-container");
    if (!container) return;
    const svgEl = container.querySelector("svg");
    if (!svgEl) return;

    svgEl.style.cursor = "pointer";
    const plots = svgEl.querySelectorAll<SVGElement>("[id^='plot_']");
    plots.forEach((plot) => {
      const pid = parseInt(plot.id.replace("plot_", ""), 10);
      const isSelected = pid === selectedPlotId;
      const colorIndex = pid % colors.length;
      const color = colors[colorIndex];
      (plot as SVGElement).setAttribute("fill", isSelected ? color.fill : "#ebe5e5ff");
      (plot as SVGElement).setAttribute("stroke", isSelected ? color.stroke : "#a5b4fc");
      (plot as SVGElement).setAttribute("stroke-width", isSelected ? "2" : "1");
    });
  }, [response, svgs?.overview, highlightedOverview, selectedPlotId, colors]);

  const handleDownload = useCallback((event: React.MouseEvent, src: string, plotId: string) => {
    event.stopPropagation(); // Prevent triggering the card click

    // Extract SVG content from data URL
    const svgContent = decodeURIComponent(src.replace('data:image/svg+xml;charset=utf-8,', ''));

    // Create blob and download
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `plot_${plotId}_highlighted.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

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
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#dc2626' }}>
            Analysis Failed
          </Typography>
          <Alert 
            severity="error" 
            variant="outlined" 
            sx={{ 
              mt: 2, 
              maxWidth: 500,
              borderRadius: 2,
              borderWidth: 2,
              fontWeight: 500,
            }}
          >
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

  // Calculate total area
  const totalArea = summary!.plots.reduce((sum: number, plot: any) => sum + plot.area_value, 0);

  return (
    <div className="results-section">
      <div className="results-header">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
            <Typography variant="h2" gutterBottom sx={{ mb: 1 }}>
              Analysis Results
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Detailed breakdown of your site plan with interactive visualizations
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <div className="stat-card-compact">
              <div className="stat-number-compact">{summary!.total_plots}</div>
              <div className="stat-label-compact">Total Plots</div>
            </div>
            <div className="stat-card-compact stat-card-compact-2">
              <div className="stat-number-compact">{totalArea.toFixed(1)}</div>
              <div className="stat-label-compact">Area (sq.m)</div>
            </div>
            <div className="stat-card-compact stat-card-compact-3">
              <div className="stat-number-compact">{(totalArea * 10.764).toFixed(0)}</div>
              <div className="stat-label-compact">Area (sq.ft)</div>
            </div>
          </Box>
        </Box>
      </div>

      <div className="results-content">

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', lg: '1.2fr 1fr' }, 
          gap: 2, 
          p: 3,
          minHeight: 0,
        }}>
          {/* --- Left Column: Overview Map --- */}
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Map sx={{ color: '#6366f1', fontSize: '1.25rem' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#f1f5f9', fontSize: '1rem' }}>Site Plan Overview</Typography>
              {highlightLoading && <CircularProgress size={18} />}
            </Box>
            {highlightError && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 2,
                  borderRadius: 2,
                  fontWeight: 500,
                }}
              >
                {highlightError}
              </Alert>
            )}
            {/* Show highlighted overview if available, otherwise show original */}
            {highlightedOverview ? (
              <div
                id="highlighted-overview-container"
                onClick={handleOverviewClick}
                className="overview-container"
                dangerouslySetInnerHTML={{ __html: highlightedOverview }}
              />
            ) : (svgs?.overview || images?.overview) ? (
              <div
                id="overview-svg-container"
                onClick={handleOverviewClick}
                className="overview-container"
                dangerouslySetInnerHTML={{ __html: svgs?.overview || "" }}
              />
            ) : null}
          </Box>

          {/* --- Right Column: Highlighted Plot Details --- */}
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#f1f5f9', fontSize: '1rem' }}>Plot Details</Typography>
            </Box>
            {selectedPlotPhoto && selectedPlotDetails ? (
              <div style={{ position: 'sticky', top: '20px' }}>
                <Card sx={{ 
                  position: 'relative', 
                  borderRadius: 2,
                  border: '1px solid rgba(71, 85, 105, 0.3)',
                  background: 'rgba(10, 14, 26, 0.6)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(129, 140, 248, 0.3)',
                    transform: 'translateY(-1px)',
                    borderColor: 'rgba(129, 140, 248, 0.4)',
                  }
                }}>
                <CardMedia
                  component="img"
                  image={selectedPlotPhoto.src}
                  alt={`Highlighted Plot ${selectedPlotDetails.plot_id}`}
                />
                  <IconButton
                  onClick={(event) => handleDownload(event, selectedPlotPhoto.src, selectedPlotPhoto.plotId)}
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                      boxShadow: '0 6px 16px rgba(99, 102, 241, 0.5)',
                      transform: 'scale(1.05)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  <Download />
                </IconButton>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography gutterBottom variant="h5" component="div">
                      Plot {selectedPlotDetails.plot_id}
                    </Typography>
                    <IconButton size="small" onClick={() => {
                      setSelectedPlotId(null);
                      setHighlightedOverview(null);
                    }}>
                      <Close />
                    </IconButton>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Shape: {selectedPlotDetails.shape_type} ({selectedPlotDetails.num_sides} sides)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Area: {selectedPlotDetails.area_value} sq.m ({(selectedPlotDetails.area_value * 10.764).toFixed(1)} sq.ft)
                  </Typography>
                </CardContent>
                </Card>
              </div>
            ) : (
              <Card variant="outlined" sx={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                p: 3, 
                minHeight: '300px', 
                background: 'linear-gradient(135deg, rgba(3, 2, 19, 0.6) 0%, rgba(10, 14, 26, 0.6) 100%)',
                borderRadius: 2,
                border: '2px dashed rgba(71, 85, 105, 0.3)',
                boxShadow: 'none',
              }}>
                <Typography variant="body1" color="text.secondary" align="center" sx={{ fontWeight: 500 }}>
                  Click a plot on the map to view its details here.
                </Typography>
              </Card>
            )}
          </Box>
        </Box>

        {/* --- Individual Plot Gallery --- */}
        <div className="gallery-section" style={{ borderTop: '1px solid rgba(71, 85, 105, 0.5)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <ViewModule sx={{ color: '#6366f1', fontSize: '1.25rem' }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#f1f5f9', fontSize: '1rem' }}>
              Highlighted Plot Gallery ({plotPhotos.length} plots)
            </Typography>
          </Box>

          {plotPhotos.length > 0 ? (
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
              gap: 2,
              '@media (max-width: 768px)': {
                gridTemplateColumns: '1fr',
              }
            }}>
              {plotPhotos.map((photo: any, index: number) => {
                const plot = summary!.plots.find((p: any) => p.plot_id === parseInt(photo.plotId));
                if (!plot) return null;
                return (
                  <Card
                    key={photo.key}
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      borderRadius: 2,
                      border: '1px solid rgba(71, 85, 105, 0.3)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                      overflow: 'hidden',
                      background: 'rgba(10, 14, 26, 0.6)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 20px rgba(129, 140, 248, 0.3), 0 0 0 1px #818cf8',
                        borderColor: 'transparent',
                        '& .plot-image': {
                          transform: 'scale(1.03)',
                        },
                        '& .plot-badge': {
                          background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
                          color: '#030213',
                          borderColor: 'transparent',
                        },
                        '& .download-btn': {
                          opacity: 1,
                          transform: 'scale(1)',
                        }
                      }
                    }}
                    onClick={() => {
                      setPreviewImage(photo.src);
                      setPreviewOpen(true);
                    }}
                  >
                    {/* Image Container */}
                    <Box sx={{ 
                      position: 'relative', 
                      overflow: 'hidden',
                      background: 'linear-gradient(135deg, rgba(3, 2, 19, 0.6) 0%, rgba(10, 14, 26, 0.6) 100%)',
                      height: 320,
                    }}>
                      <CardMedia
                        component="img"
                        className="plot-image"
                        sx={{
                          height: '100%',
                          width: '100%',
                          objectFit: 'contain',
                          transition: 'transform 0.4s ease',
                          padding: 2,
                        }}
                        image={photo.src}
                        alt={`Highlighted Plot ${photo.plotId}`}
                      />
                      
                      {/* Download Button */}
                      <IconButton
                        className="download-btn"
                        onClick={(event) => handleDownload(event, photo.src, photo.plotId)}
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          background: 'rgba(10, 14, 26, 0.95)',
                          backdropFilter: 'blur(10px)',
                          color: '#818cf8',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                          border: '1px solid rgba(129, 140, 248, 0.3)',
                          opacity: 0,
                          transform: 'scale(0.8)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
                            color: '#030213',
                            boxShadow: '0 6px 20px rgba(129, 140, 248, 0.5)',
                            transform: 'scale(1.1) !important',
                          },
                        }}
                      >
                        <Download fontSize="small" />
                      </IconButton>

                      {/* Plot Badge */}
                      <Box
                        className="plot-badge"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          background: 'rgba(10, 14, 26, 0.95)',
                          backdropFilter: 'blur(10px)',
                          color: '#f1f5f9',
                          px: 2,
                          py: 0.75,
                          borderRadius: 2,
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                          border: '1px solid rgba(129, 140, 248, 0.3)',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        Plot {photo.plotId}
                      </Box>
                    </Box>

                    {/* Card Content */}
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ mb: 1.5 }}>
                        <Typography 
                          variant="h6" 
                          component="div" 
                          sx={{ 
                            fontWeight: 600, 
                            color: '#f1f5f9',
                            mb: 1,
                            fontSize: '1rem',
                          }}
                        >
                          {plot.shape_type}
                        </Typography>
                      </Box>

                      {/* Info Grid */}
                      <Box sx={{ 
                        display: 'grid', 
                        gap: 1,
                      }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: 1,
                        }}>
                          <Box sx={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
                          }} />
                          <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                            <strong style={{ color: '#f1f5f9' }}>{plot.num_sides}</strong> sides
                          </Typography>
                        </Box>

                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: 1,
                        }}>
                          <Box sx={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            background: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)',
                          }} />
                          <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                            <strong style={{ color: '#f1f5f9' }}>{plot.area_value} sq.m</strong> ({(plot.area_value * 10.764).toFixed(1)} sq.ft)
                          </Typography>
                        </Box>

                        {/* Edge Dimensions */}
                        <Box sx={{ 
                          mt: 0.5,
                          pt: 1.5, 
                          borderTop: '1px solid rgba(71, 85, 105, 0.5)',
                        }}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: '#94a3b8', 
                              fontSize: '0.6875rem',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              mb: 0.75,
                              display: 'block',
                            }}
                          >
                            Dimensions
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {plot.edge_dimensions.slice(0, 4).map((edge: any, idx: number) => (
                              <Box
                                key={idx}
                                sx={{
                                  background: 'linear-gradient(135deg, rgba(3, 2, 19, 0.6) 0%, rgba(10, 14, 26, 0.6) 100%)',
                                  border: '1px solid rgba(71, 85, 105, 0.3)',
                                  px: 1.25,
                                  py: 0.375,
                                  borderRadius: 1,
                                  fontSize: '0.6875rem',
                                  color: '#cbd5e1',
                                  fontWeight: 500,
                                }}
                              >
                                {edge.length_meters}m
                              </Box>
                            ))}
                            {plot.edge_dimensions.length > 4 && (
                              <Box
                                sx={{
                                  background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.2) 0%, rgba(165, 180, 252, 0.2) 100%)',
                                  border: '1px solid rgba(129, 140, 248, 0.4)',
                                  px: 1.25,
                                  py: 0.375,
                                  borderRadius: 1,
                                  fontSize: '0.6875rem',
                                  color: '#a5b4fc',
                                  fontWeight: 600,
                                }}
                              >
                                +{plot.edge_dimensions.length - 4} more
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          ) : (
            <Typography variant="body1" color="textSecondary">
              No highlighted plots available
            </Typography>
          )}
        </div>

        {/* Image Preview Modal */}
        <Modal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          aria-labelledby="gallery-preview"
        >
          <Box sx={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)', 
            bgcolor: 'background.paper', 
            p: 4, 
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
            borderRadius: 3,
            maxWidth: '90vw', 
            maxHeight: '90vh', 
            overflow: 'auto' 
          }}>
            {previewImage && <img src={previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '8px' }} />}
            <IconButton 
              onClick={() => setPreviewOpen(false)} 
              sx={{ 
                position: 'absolute', 
                top: 10, 
                right: 10,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                }
              }}
            >
              <Close />
            </IconButton>
          </Box>
        </Modal>
      </div>
    </div>
  );
};

export default Results;
