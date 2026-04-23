import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type GatewayForwardHeaders = {
  authorization: string;
  xEnseignantRole?: string;
};

@Injectable()
export class GatewayPedagogieClient {
  private readonly logger = new Logger(GatewayPedagogieClient.name);

  constructor(private readonly config: ConfigService) {}

  private baseUrl(): string {
    const raw =
      this.config.get<string>('GATEWAY_BASE_URL') ??
      process.env.GATEWAY_BASE_URL ??
      'http://api-gateway:8080';
    return raw.endsWith('/') ? raw.slice(0, -1) : raw;
  }

  private headers(fwd: GatewayForwardHeaders): Record<string, string> {
    const h: Record<string, string> = {};
    const a = fwd.authorization?.trim();
    if (a) {
      h.Authorization = /^Bearer\s+/i.test(a) ? a : `Bearer ${a}`;
    }
    if (fwd.xEnseignantRole) {
      h['X-Enseignant-Role'] = fwd.xEnseignantRole;
    }
    return h;
  }

  /** Profil de l’utilisateur connecté (ROLE_ETUDIANT / chef pour tests) — pour résoudre l’id métier sans claim JWT. */
  async getEtudiantMeJson(fwd: GatewayForwardHeaders): Promise<Record<string, unknown>> {
    const url = `${this.baseUrl()}/etudiants/me`;
    const res = await fetch(url, { headers: this.headers(fwd) });
    if (res.status === 404) {
      throw new Error('ETUDIANT_ME_404');
    }
    if (!res.ok) {
      this.logger.warn(`GET ${url} → ${res.status}`);
      throw new Error(`ETUDIANT_ME_HTTP:${res.status}`);
    }
    return (await res.json()) as Record<string, unknown>;
  }

  async getEtudiantJson(id: number, fwd: GatewayForwardHeaders): Promise<Record<string, unknown>> {
    const url = `${this.baseUrl()}/etudiants/${id}`;
    const res = await fetch(url, { headers: this.headers(fwd) });
    if (res.status === 404) {
      throw new Error(`ETUDIANT_404:${id}`);
    }
    if (!res.ok) {
      this.logger.warn(`GET ${url} → ${res.status}`);
      throw new Error(`ETUDIANT_HTTP:${res.status}`);
    }
    return (await res.json()) as Record<string, unknown>;
  }

  async getMatiereJson(id: number, fwd: GatewayForwardHeaders): Promise<Record<string, unknown>> {
    const url = `${this.baseUrl()}/matieres/${id}`;
    const res = await fetch(url, { headers: this.headers(fwd) });
    if (res.status === 403) {
      throw new Error('MATIERE_403');
    }
    if (res.status === 404) {
      throw new Error(`MATIERE_404:${id}`);
    }
    if (!res.ok) {
      this.logger.warn(`GET ${url} → ${res.status}`);
      throw new Error(`MATIERE_HTTP:${res.status}`);
    }
    return (await res.json()) as Record<string, unknown>;
  }
}
