export interface AnalysisResponse {
  summary: {
    total_plots: number;
    plots: Array<{
      plot_id: number;
      shape_type: string;
      num_sides: number;
      area_value: number;
      edge_dimensions: Array<{
        edge_index: number;
        length_meters: number;
        source: string;
      }>;
    }>;
  };
  svgs?: Record<string, string>;
  images?: Record<string, string>;
  error?: string;
}
