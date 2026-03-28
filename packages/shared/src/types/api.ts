export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  framework: 'react-native' | 'flutter';
}

export interface CreateBuildRequest {
  platform: 'android' | 'ios';
}

export interface CreateDeployRequest {
  store: 'play-store' | 'app-store';
}

export interface SendMessageRequest {
  content: string;
  provider?: string;
}

export interface SaveApiKeyRequest {
  provider: string;
  key: string;
}
