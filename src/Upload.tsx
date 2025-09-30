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
          className={`drag-drop-zone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {selectedFile ? (
            <>
              <CheckCircle className="upload-icon" style={{ color: '#4caf50' }} />
              <div className="drag-drop-text">File Selected</div>
              <div className="drag-drop-subtext">{selectedFile.name}</div>
              <div className="drag-drop-subtext">
                Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
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
            </>
          )}
          <div className="file-types">
            PNG, JPG up to 10MB
          </div>
        </div>

        <Box sx={{ mt: 3, mb: 2 }}>
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>
              Output Format
            </FormLabel>
            <RadioGroup
              row
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value as 'svg' | 'jpeg')}
            >
              <FormControlLabel value="svg" control={<Radio />} label="SVG (Vector)" />
              <FormControlLabel value="jpeg" control={<Radio />} label="JPEG (Raster)" />
            </RadioGroup>
          </FormControl>
        </Box>

        {/* Cropped Image Preview */}
        {selectedFile && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Cropped Image Preview
            </Typography>
            <Box
              component="img"
              src={URL.createObjectURL(selectedFile)}
              alt="Cropped preview"
              sx={{
                maxWidth: '100%',
                maxHeight: 400,
                border: '2px solid #1976d2',
                borderRadius: 2,
                boxShadow: 2,
              }}
            />
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              This is the image that will be analyzed
            </Typography>
          </Box>
        )}

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
        >
          Analysis completed successfully!
        </Alert>
      </Snackbar>

      <Dialog
        open={showCropModal}
        onClose={handleCropCancel}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Crop />
            Crop Your Site Plan Image
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box display="flex" justifyContent="center" mb={2}>
            <Typography variant="body2" color="textSecondary">
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
        <DialogActions>
          <Button onClick={handleCropCancel} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={handleCropComplete}
            variant="contained"
            color="primary"
          >
            Apply Crop
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Upload;
