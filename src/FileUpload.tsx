import React, { useState, useRef, useEffect } from 'react';
import { AnalysisResponse } from './types';
import { BASE_URL } from './url';
import {
  Box,
  Button,
  Paper,
  Typography,
  Container,
  Stack, 
  IconButton,
  Tooltip
} from '@mui/material';
import { UploadFile, RestartAlt, Crop, Delete, Download } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

interface UploadProps {
  setResponse: (response: AnalysisResponse | null) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: Number(theme.shape.borderRadius) * 2,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[3],
}));

const DropZone = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(4),
  textAlign: 'center',
  backgroundColor: theme.palette.grey[100],
  transition: 'border-color 0.3s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.grey[200],
  },
  cursor: 'pointer',
}));

const FileUpload: React.FC<UploadProps> = ({ setResponse, setError, setLoading }) => {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [croppedImg, setCroppedImg] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const image = new Image();
      image.onload = () => {
        setImg(image);
        setPoints([]);
        setCroppedImg(null);
      };
      image.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      loadImage(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadImage(file);
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    if (points.length > 0) {
      ctx.strokeStyle = '#1976d2';
      ctx.fillStyle = 'rgba(25, 118, 210, 0.2)';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      if (points.length > 2) {
        ctx.closePath();
        ctx.fill();
      }
      ctx.stroke();

      points.forEach((pt) => {
        ctx.fillStyle = '#1976d2';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }
  };

  useEffect(() => {
    drawCanvas();
  }, [img, points]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const clickedIdx = points.findIndex(
      (pt) => Math.hypot(pt.x - x, pt.y - y) < 10
    );

    if (clickedIdx === -1) {
      setPoints([...points, { x, y }]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const idx = points.findIndex((pt) => Math.hypot(pt.x - x, pt.y - y) < 10);
    if (idx !== -1) {
      setDragIdx(idx);
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragIdx === null || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const newPoints = [...points];
    newPoints[dragIdx] = { x, y };
    setPoints(newPoints);
  };

  const handleMouseUp = () => {
    setDragIdx(null);
  };

  const cropImage = () => {
    if (!img || points.length < 3) return;

    const minX = Math.min(...points.map((p) => p.x));
    const maxX = Math.max(...points.map((p) => p.x));
    const minY = Math.min(...points.map((p) => p.y));
    const maxY = Math.max(...points.map((p) => p.y));

    const w = maxX - minX;
    const h = maxY - minY;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.beginPath();
    tempCtx.moveTo(points[0].x - minX, points[0].y - minY);
    for (let i = 1; i < points.length; i++) {
      tempCtx.lineTo(points[i].x - minX, points[i].y - minY);
    }
    tempCtx.closePath();
    tempCtx.clip();

    tempCtx.drawImage(img, -minX, -minY);

    setCroppedImg(tempCanvas.toDataURL());
  };

  const reset = () => {
    setPoints([]);
    setCroppedImg(null);
  };

  const clearImage = () => {
    setImg(null);
    setPoints([]);
    setCroppedImg(null);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
        Multi-Point Image Cropper
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Click to add points, drag to move them, and create a polygon to crop your image.
      </Typography>

      {!img ? (
        <DropZone
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadFile fontSize="large" color="action" sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Drop an image here or click to browse
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Supports JPG, PNG, GIF
          </Typography>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
        </DropZone>
      ) : (
        <Box>
          <Stack direction="row" spacing={2} sx={{ mb: 3 }} justifyContent="center">
            <Tooltip title="Load a new image">
              <Button
                variant="contained"
                startIcon={<UploadFile />}
                onClick={() => fileInputRef.current?.click()}
              >
                New Image
              </Button>
            </Tooltip>
            <Tooltip title="Reset all points">
              <Button
                variant="outlined"
                startIcon={<RestartAlt />}
                onClick={reset}
              >
                Reset Points
              </Button>
            </Tooltip>
            <Tooltip title={points.length < 3 ? "Need at least 3 points to crop" : "Crop the selected area"}>
              <span>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<Crop />}
                  onClick={cropImage}
                  disabled={points.length < 3}
                >
                  Crop Image
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Clear everything">
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={clearImage}
              >
                Clear All
              </Button>
            </Tooltip>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
          </Stack>

          <StyledPaper sx={{ maxWidth: '600px', mx: 'auto' }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" color="text.secondary">
                Points: <strong>{points.length}</strong>
                {points.length < 3 && (
                  <Typography component="span" color="warning.main" sx={{ ml: 2 }}>
                    Need at least 3 points to crop
                  </Typography>
                )}
              </Typography>
            </Box>
            <Box sx={{ overflow: 'auto', bgcolor: 'grey.900', borderRadius: 2, p: 2 }}>
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ maxWidth: '100%', height: 'auto', cursor: 'crosshair', display: 'block' }}
              />
            </Box>
          </StyledPaper>

          {croppedImg && (
            <StyledPaper sx={{ mt: 3, maxWidth: '600px', mx: 'auto' }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                Cropped Result
              </Typography>
              <Box sx={{ bgcolor: 'grey.900', borderRadius: 2, p: 2, display: 'inline-block' }}>
                <img src={croppedImg} alt="Cropped" style={{ maxWidth: '100%', height: 'auto' }} />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<Download />}
                  href={croppedImg}
                  download="cropped-image.png"
                >
                  Download Cropped Image
                </Button>
              </Box>
            </StyledPaper>
          )}
        </Box>
      )}
    </Container>
  );
};

export default FileUpload;
