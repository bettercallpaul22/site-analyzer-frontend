import React, { useRef, useState, useCallback } from 'react';
import { Button, Box, Typography, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import { CloudUpload, Analytics, CheckCircle, Crop } from '@mui/icons-material';
import Cropper, { ReactCropperElement } from 'react-cropper';
// @ts-ignore
import 'cropperjs/dist/cropper.css';
import { AnalysisResponse } from './types';
import { BASE_URL } from './url';

interface UploadProps {
  setResponse: (response: AnalysisResponse | null) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

const Upload: React.FC<UploadProps> = ({ setResponse, setError, setLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropperRef = useRef<ReactCropperElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [outputFormat, setOutputFormat] = useState<'svg' | 'jpeg'>('svg');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (['image/png', 'image/jpeg'].includes(file.type)) {
        setSelectedFile(file);
        // Create image URL for cropping
        const reader = new FileReader();
        reader.onload = () => {
          setImageSrc(reader.result as string);
          setShowCropModal(true);
        };
        reader.readAsDataURL(file);
        if (fileInputRef.current) {
          const dt = new DataTransfer();
          dt.items.add(file);
          fileInputRef.current.files = dt.files;
        }
      } else {
        setError('Please select a PNG or JPG file.');
      }
    }
  }, [setError]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (['image/png', 'image/jpeg'].includes(file.type)) {
        setSelectedFile(file);
        // Create image URL for cropping
        const reader = new FileReader();
        reader.onload = () => {
          setImageSrc(reader.result as string);
          setShowCropModal(true);
        };
        reader.readAsDataURL(file);
      } else {
        setError('Please select a PNG or JPG file.');
      }
    }
  };

  const handleCropComplete = () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      try {
        cropper.getCroppedCanvas().toBlob((blob) => {
          if (blob) {
            const croppedFile = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
            setSelectedFile(croppedFile);
            setShowCropModal(false);
            setImageSrc('');
          }
        }, 'image/jpeg', 0.95);
      } catch (error) {
        console.error('Error cropping image:', error);
        setError('Failed to crop image');
      }
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setImageSrc('');
    // Reset to original file if user cancels
    if (fileInputRef.current?.files?.[0]) {
      setSelectedFile(fileInputRef.current.files[0]);
    }
  };

  const handleAnalyze = async () => {
    setError(null);
    setResponse(null);

    const file = selectedFile || fileInputRef.current?.files?.[0];
    if (!file) {
      setError('Please select an image file.');
      return;
    }
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setError('Please select a PNG or JPG file.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('output_format', outputFormat);
      const res = await fetch(`${BASE_URL}/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const data: AnalysisResponse = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResponse(data);
        setShowSuccess(true);
      }
    } catch (err) {
      setError(`Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-section">
      <div className="upload-header">
        <h1 className="upload-title">Site Plan Analyzer</h1>
        <p className="upload-subtitle">
          Upload your site plan image and get detailed analysis with interactive visualizations
        </p>
      </div>

      <div className="upload-form">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/png,image/jpeg"
          style={{ display: 'none' }}
        />
        
        <div
          className={`drag-drop-zone ${dragOver ? 'drag-over' : ''} ${selectedFile ? 'has-image' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !selectedFile && fileInputRef.current?.click()}
          style={{ 
            cursor: selectedFile ? 'default' : 'pointer',
            backgroundImage: selectedFile ? `url(${URL.createObjectURL(selectedFile)})` : 'none'
          }}
        >
          {selectedFile ? (
            <>
              <CheckCircle className="upload-icon" style={{ color: '#10b981', filter: 'drop-shadow(0 2px 8px rgba(16, 185, 129, 0.6))' }} />
              <div className="drag-drop-text" style={{ color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                File Selected
              </div>
              <div className="drag-drop-subtext" style={{ color: 'rgba(255,255,255,0.95)', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                {selectedFile.name}
              </div>
              <div className="drag-drop-subtext" style={{ color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
              
              <Box sx={{ mt: 'auto', pt: 3 }}>
                <Typography variant="caption" sx={{ 
                  display: 'block', 
                  color: 'rgba(255,255,255,0.95)', 
                  mb: 2,
                  textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                  fontWeight: 500
                }}>
                  This image will be analyzed
                </Typography>
                <Button
                  size="small"
                  variant="contained"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  sx={{ 
                    background: 'rgba(255, 255, 255, 0.25)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.35)',
                      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)',
                    }
                  }}
                >
                  Change Image
                </Button>
              </Box>
            </>
          ) : (
            <>
              <CloudUpload className="upload-icon" />
              <div className="drag-drop-text">
                Drag & drop your image here
              </div>
              <div className="drag-drop-subtext">
                or click to browse files
              </div>
              <div className="file-types">
                PNG, JPG up to 10MB
              </div>
            </>
          )}
        </div>

        <Box sx={{ mt: 2, mb: 1.5 }}>
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600, color: '#f1f5f9', fontSize: '0.875rem' }}>
              Output Format
            </FormLabel>
            <RadioGroup
              row
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value as 'svg' | 'jpeg')}
            >
              <FormControlLabel 
                value="svg" 
                control={<Radio size="small" sx={{ color: '#818cf8', '&.Mui-checked': { color: '#818cf8' } }} />} 
                label={<Typography sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#f1f5f9' }}>SVG (Vector)</Typography>} 
              />
              {/* <FormControlLabel value="jpeg" control={<Radio />} label="JPEG (Raster)" /> */}
            </RadioGroup>
          </FormControl>
        </Box>

        <Box sx={{ mt: 'auto', pt: 2 }}>
          <Button
            variant="contained"
            startIcon={<Analytics />}
            onClick={handleAnalyze}
            className="analyze-button"
            disabled={!selectedFile}
            size="large"
          >
            Analyze Site Plan
          </Button>
        </Box>
      </div>

      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowSuccess(false)}
          severity="success"
          variant="filled"
          sx={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
            borderRadius: 2,
            fontWeight: 600,
          }}
        >
          Analysis completed successfully!
        </Alert>
      </Snackbar>

      <Dialog
        open={showCropModal}
        onClose={handleCropCancel}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          borderBottom: '1px solid #e2e8f0',
        }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Crop sx={{ color: '#6366f1' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Crop Your Site Plan Image</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box display="flex" justifyContent="center" mb={2}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              Adjust the crop area to focus on the site plan you want to analyze
            </Typography>
          </Box>
          {imageSrc && (
            <Box position="relative" width="100%" height="60vh">
              <Cropper
                ref={cropperRef}
                src={imageSrc}
                style={{ height: '100%', width: '100%' }}
                guides={true}
                cropBoxResizable={true}
                cropBoxMovable={true}
                dragMode="move"
                responsive={true}
                checkOrientation={false}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
          <Button 
            onClick={handleCropCancel} 
            sx={{ 
              color: '#64748b',
              fontWeight: 600,
              '&:hover': {
                background: '#e2e8f0',
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCropComplete}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                boxShadow: '0 6px 16px rgba(99, 102, 241, 0.5)',
              }
            }}
          >
            Apply Crop
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Upload;
