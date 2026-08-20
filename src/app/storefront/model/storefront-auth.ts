// Correspond a EcomAuthController.AuthResponse (backend) - un JWT client
// (typ=customer), jamais confondu avec la session staff (voir AuthService).
export interface StorefrontSession {
  token: string;
  clientId: number;
  nom: string;
  email: string;
}
