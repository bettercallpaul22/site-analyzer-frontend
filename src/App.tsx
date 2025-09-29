import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
// import Upload from './Upload';
import Results from './Results';
import { AnalysisResponse } from './types';
import './App.css';
import Upload from './Upload';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      color: '#1976d2',
    },
    h2: {
      fontWeight: 600,
      fontSize: '1.875rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
    },
  },
});

const App: React.FC = () => {
  const [response, setResponse] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="app-container">
        <Box className="upload-container">
          <Upload setResponse={setResponse} setError={setError} setLoading={setLoading} />
        </Box>
        <Box className="results-container">
          <Results response={response} error={error} loading={loading} />
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default App;