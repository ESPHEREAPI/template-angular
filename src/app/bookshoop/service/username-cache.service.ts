import { Injectable } from '@angular/core';

const CACHE_KEY = 'valid_username';
const VALIDITY_DURATION = 24 * 60 * 60 * 1000; // 1 jour (en ms)
@Injectable({
  providedIn: 'root'
})
export class UsernameCacheService {

 
  // Vérifie si le username est encore valide en cache
  isUsernameValid(username: string): boolean {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return false;

    const parsed = JSON.parse(cached);
    const now = Date.now();

    return parsed.username === username && now < parsed.expiration;
  }

  // Enregistre le username valide avec une date d'expiration
  saveValidUsername(username: string): void {
    const expiration = Date.now() + VALIDITY_DURATION;
    const data = { username, expiration };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  }

  // Supprime le cache
  clearCachedUsername(): void {
    localStorage.removeItem(CACHE_KEY);
  }

  // ✅ Récupère le username actuellement stocké (ou null)
  getCachedUsername(): string | null {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const parsed = JSON.parse(cached);
    const now = Date.now();

    if (now < parsed.expiration) {
      return parsed.username;
    } else {
      this.clearCachedUsername(); // Cache expiré
      return null;
    }
  }
}
