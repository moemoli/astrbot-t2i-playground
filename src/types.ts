export interface Endpoint {
  url: string;
  active: boolean;
}

export interface EndpointsResponse {
  data: Endpoint[];
}

export interface ScreenshotOptions {
  timeout?: number | null;
  quality?: number | null;
  full_page?: boolean | null;
  device_scale_factor_level?: 'normal' | 'high' | 'ultra' | null;
  omit_background?: boolean | null;
  animations?: 'allow' | 'disabled' | null;
  type?: 'png' | 'jpeg' | null;
  clip?: ClipProps | null;
}

export interface ClipProps{
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GenerateRequest {
  tmpl?: string | null;
  tmpldata?: Record<string, any> | null;
  options?: ScreenshotOptions | null;
  json?: boolean;
}

export interface PresetMeta {
  preset_name: string;
  description?: string;
  author?: string;
  social_url?: string;
  tmpldata?: Record<string, any>;
}

export interface Preset {
  id: string;
  template: string;
  meta: PresetMeta;
  preview?: string;
}

