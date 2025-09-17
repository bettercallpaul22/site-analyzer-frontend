import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  ErrorOutline, 
  InsertChart, 
  ViewModule,
  Map
} from '@mui/icons-material';
import PhotoGallery from 'react-photo-gallery';
import Lightbox from 'react-image-lightbox';
import 'react-image-lightbox/style.css';
import { AnalysisResponse } from './types';

interface ResultsProps {
  response: AnalysisResponse | null;
  error: string | null;
  loading: boolean;
}

const Results: React.FC<ResultsProps> = ({ response, error, loading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

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

  const { summary, svgs } = response;

  // Calculate total area
  const totalArea = summary.plots.reduce((sum, plot) => sum + plot.area_value, 0);

  // Prepare photos for gallery
  const plotPhotos = Object.entries(svgs)
    .filter(([key, value]) => key !== 'overview' && value !== undefined)
    .map(([key, svgString], index) => ({
      key,
      src: `data:image/svg+xml;base64,${btoa(svgString as string)}`,
      width: 4,
      height: 3,
      index,
    }));

  const openLightbox = (event: React.MouseEvent, { index }: { index: number }) => {
    setPhotoIndex(index);
    setIsOpen(true);
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
          
          <div className="table-container">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Plot ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Shape</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Area (sq.m)</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Area (sq.ft)</TableCell>
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
          </div>
        </div>

        <div className="gallery-section">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <Map sx={{ color: '#6366f1' }} />
            <Typography variant="h6">
              Site Plan Overview
            </Typography>
          </Box>
          
          {svgs.overview && (
            <div className="overview-container">
              <div dangerouslySetInnerHTML={{ __html: svgs.overview }} />
            </div>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <ViewModule sx={{ color: '#6366f1' }} />
            <Typography variant="h6">
              Individual Plot Gallery ({plotPhotos.length} plots)
            </Typography>
          </Box>
          
          {plotPhotos.length > 0 ? (
            <div className="gallery-container">
              <div className="react-photo-gallery--gallery">
                {plotPhotos.map((photo, index) => (
                  <div 
                    key={photo.key}
                    className="gallery-item"
                    onClick={(e) => openLightbox(e, { index })}
                  >
                    <img
                      src={photo.src}
                      alt={`Plot ${photo.key}`}
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                        borderRadius: '8px'
                      }}
                    />
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        mt: 1, 
                        textAlign: 'center', 
                        color: '#64748b',
                        fontWeight: 500
                      }}
                    >
                      Plot {photo.key}
                    </Typography>
                  </div>
                ))}
              </div>
            </div>
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
                No individual plots available for display
              </Typography>
            </Box>
          )}
        </div>
      </div>

      {isOpen && plotPhotos.length > 0 && (
        <Lightbox
          mainSrc={plotPhotos[photoIndex].src}
          nextSrc={plotPhotos[(photoIndex + 1) % plotPhotos.length].src}
          prevSrc={plotPhotos[(photoIndex + plotPhotos.length - 1) % plotPhotos.length].src}
          onCloseRequest={() => setIsOpen(false)}
          onMovePrevRequest={() => setPhotoIndex((photoIndex + plotPhotos.length - 1) % plotPhotos.length)}
          onMoveNextRequest={() => setPhotoIndex((photoIndex + 1) % plotPhotos.length)}
          imageTitle={`Plot ${plotPhotos[photoIndex].key}`}
          imageCaption={`Plot ${plotPhotos[photoIndex].key} - Detailed view`}
        />
      )}
    </div>
  );
};

export default Results;