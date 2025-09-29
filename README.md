# Site Analyzer Frontend

A React-based frontend application for analyzing site plans using computer vision. This application allows users to upload site plan images, send them to the backend API for analysis, and view detailed results including detected plots with dimensions and area calculations.

## Features

- **Image Upload**: Drag-and-drop or click-to-select image uploads
- **Real-time Analysis**: Connects to the backend API for automated site plan analysis
- **Results Visualization**: Displays detected plots with dimensions and area measurements
- **Responsive Design**: Works on desktop and mobile devices using Material-UI
- **Modern UI**: Clean, intuitive interface for ease of use

## Prerequisites

- Node.js 14+ and npm (comes with Node.js)
- The backend service running (see [backend README](../site-analyzer-backend-main/README.md))

## Quick Start

### 1. Navigate to Frontend Directory

```bash
cd site-analyzer-frontend-main
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Backend URL

Edit `src/config.ts` to point to your backend:
- For production: `https://pacific-taiga-69560-964a51d44167.herokuapp.com`
- For local development: `http://localhost:5000`

### 4. Start Development Server

```bash
npm run dev
```

The application will open at [http://localhost:3000](http://localhost:3000)

## Available Scripts

### Development

```bash
npm run dev
```
Runs the app in development mode with hot reloading.

### Production Build

```bash
npm run build
npm start
```
Builds the app for production and serves the optimized build.

### Testing

```bash
npm test
```
Launches the test runner in interactive watch mode.

### Eject

```bash
npm run eject
```
**Note: irreversibly ejects from create-react-app.**

## Backend Connection

This frontend requires the [Site Analyzer Backend](../site-analyzer-backend-main/) to function properly:

- **Local Development**: Ensure the backend is running on the configured URL (default: `http://localhost:5000`)
- **Production**: Deployed backend available at `https://pacific-taiga-69560-964a51d44167.herokuapp.com`

## Technologies Used

- **React 19**: Frontend framework
- **TypeScript**: Type safety
- **Material-UI**: Component library
- **React Cropper**: Image cropping functionality
- **Axios**: HTTP client for API calls
- **Create React App**: Build tooling

## Project Structure

```
site-analyzer-frontend-main/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable React components
│   ├── services/          # API integration services
│   ├── types/             # TypeScript type definitions
│   ├── App.tsx            # Main application component
│   ├── config.ts          # Configuration constants
│   └── index.tsx          # Application entry point
├── package.json           # Dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

## Usage

1. Start the frontend development server (`npm run dev`)
2. Ensure the backend is running
3. Open [http://localhost:3000](http://localhost:3000) in your browser
4. Upload a site plan image
5. View analysis results including detected plots and dimensions

## Contributing

1. Follow the existing code style and TypeScript types
2. Add tests for new features
3. Update this README if adding new features or scripts

## Troubleshooting

- **Build Errors**: Run `npm install` to ensure all dependencies are installed
- **Backend Connection Issues**: Verify the backend URL in `src/config.ts`
- **Port Conflicts**: Default dev server runs on port 3000; can be changed if needed
