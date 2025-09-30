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
  const [highlightLoading, setHighlightLoading] = useState(false);
  const [highlightError, setHighlightError] = useState<string | null>(null);
  const [highlightedOverview, setHighlightedOverview] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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

  // Calculate total area
  const totalArea = summary!.plots.reduce((sum: number, plot: any) => sum + plot.area_value, 0);

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
              <div className="stat-number">{summary!.total_plots}</div>
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
        </div>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3, mt: 4 }}>
          {/* --- Left Column: Overview Map --- */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Map sx={{ color: '#6366f1' }} />
              <Typography variant="h6">Site Plan Overview</Typography>
              {highlightLoading && <CircularProgress size={20} />}
            </Box>
            {highlightError && (
              <Alert severity="error" sx={{ mb: 2 }}>
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
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant="h6">Plot Details</Typography>
            </Box>
            {selectedPlotPhoto && selectedPlotDetails ? (
              <div style={{ position: 'sticky', top: '20px' }}>
                <Card sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  image={selectedPlotPhoto.src}
                  alt={`Highlighted Plot ${selectedPlotDetails.plot_id}`}
                />
                <IconButton
                  onClick={(event) => handleDownload(event, selectedPlotPhoto.src, selectedPlotPhoto.plotId)}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)'
                    }
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
              <Card variant="outlined" sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, minHeight: '300px', backgroundColor: 'transparent' }}>
                <Typography variant="body1" color="text.secondary" align="center">
                  Click a plot on the map to view its details here.
                </Typography>
              </Card>
            )}
          </Box>
        </Box>

        {/* --- Individual Plot Gallery --- */}
        <div className="gallery-section" style={{ marginTop: '4rem' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, mt: 4 }}>
            <ViewModule sx={{ color: '#6366f1' }} />
            <Typography variant="h6">
              Highlighted Plot Gallery ({plotPhotos.length} highlighted plots)
            </Typography>
          </Box>

          {plotPhotos.length > 0 ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
              {plotPhotos.map((photo: any, index: number) => {
                const plot = summary!.plots.find((p: any) => p.plot_id === parseInt(photo.plotId));
                if (!plot) return null;
                return (
                  <Card
                    key={photo.key}
                    sx={{
                      maxWidth: 345,
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                      position: 'relative',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                      }
                    }}
                    onClick={() => {
                      setPreviewImage(photo.src);
                      setPreviewOpen(true);
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="400"
                      width="100%"
                      image={photo.src}
                      alt={`Highlighted Plot ${photo.plotId}`}
                    />
                    <IconButton
                      onClick={(event) => handleDownload(event, photo.src, photo.plotId)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)'
                        }
                      }}
                    >
                      <Download />
                    </IconButton>
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
                        Edges: {plot.edge_dimensions.map((edge: any) => `${edge.length_meters}m (${edge.source})`).join(', ')}
                      </Typography>
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
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', bgcolor: 'background.paper', p: 4, boxShadow: 24, maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }}>
            {previewImage && <img src={previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '80vh' }} />}
            <IconButton onClick={() => setPreviewOpen(false)} sx={{ position: 'absolute', top: 10, right: 10 }}>
              <Close />
            </IconButton>
          </Box>
        </Modal>
      </div>
    </div>
  );
};

export default Results;
