import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";

const RATE_LIMIT_MS = 1100;
let lastRequestTime = 0;

async function rateLimitedFetch(url: string, headers: Record<string, string>) {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - elapsed));
  }
  lastRequestTime = Date.now();
  return fetch(url, { headers });
}

async function searchMusicBrainz(title: string, artist?: string) {
  try {
    let query: string;
    if (artist && artist.trim() && artist !== 'Unknown Artist') {
      query = encodeURIComponent(`recording:"${title}" AND artist:"${artist}"`);
    } else {
      query = encodeURIComponent(`recording:"${title}"`);
    }
    const url = `https://musicbrainz.org/ws/2/recording?query=${query}&limit=3&fmt=json`;

    const res = await rateLimitedFetch(url, {
      'User-Agent': 'Sonora/1.0.0 ( sonora-music-player@replit.com )',
      'Accept': 'application/json',
    });

    if (!res.ok) return null;
    const data = await res.json();

    if (data.recordings && data.recordings.length > 0) {
      const recording = data.recordings[0];
      const release = recording.releases?.[0];
      const releaseId = release?.id;
      let coverArt: string | null = null;

      if (releaseId) {
        try {
          const coverRes = await rateLimitedFetch(
            `https://coverartarchive.org/release/${releaseId}`,
            {
              'User-Agent': 'Sonora/1.0.0 ( sonora-music-player@replit.com )',
              'Accept': 'application/json',
            }
          );
          if (coverRes.ok) {
            const coverData = await coverRes.json();
            const front = coverData.images?.find((img: any) => img.front);
            coverArt = front?.thumbnails?.['500'] || front?.thumbnails?.large || front?.thumbnails?.['250'] || front?.image || null;
          }
        } catch {
        }
      }

      if (!coverArt && releaseId) {
        coverArt = `https://coverartarchive.org/release/${releaseId}/front-250`;
      }

      return {
        title: recording.title || title,
        artist: recording['artist-credit']?.[0]?.name || artist || 'Unknown Artist',
        album: release?.title || null,
        year: release?.date?.substring(0, 4) || null,
        coverArt,
        mbid: recording.id,
        releaseId,
      };
    }

    return null;
  } catch (err) {
    console.error('MusicBrainz search error:', err);
    return null;
  }
}

async function searchByTitleOnly(title: string) {
  const cleanTitle = title
    .replace(/\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/feat\.?.*/i, '')
    .replace(/ft\.?.*/i, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let result = await searchMusicBrainz(cleanTitle);
  if (result) return result;

  const words = cleanTitle.split(' ').filter(w => w.length > 2);
  if (words.length > 3) {
    const shorterTitle = words.slice(0, 3).join(' ');
    result = await searchMusicBrainz(shorterTitle);
    if (result) return result;
  }

  return null;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get('/api/metadata/search', async (req: Request, res: Response) => {
    const { title, artist } = req.query;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'title query parameter is required' });
    }

    const artistStr = typeof artist === 'string' ? artist : undefined;

    let result = await searchMusicBrainz(title, artistStr);

    if (!result) {
      result = await searchByTitleOnly(title);
    }

    if (result) {
      res.json(result);
    } else {
      res.status(404).json({ error: 'No metadata found' });
    }
  });

  app.post('/api/metadata/batch', async (req: Request, res: Response) => {
    const { tracks } = req.body;
    if (!Array.isArray(tracks)) {
      return res.status(400).json({ error: 'tracks array is required' });
    }

    const results: Record<string, any> = {};
    const limit = Math.min(tracks.length, 10);

    for (let i = 0; i < limit; i++) {
      const { id, title, artist } = tracks[i];
      if (!title) continue;

      try {
        let result = await searchMusicBrainz(title, artist);
        if (!result) {
          result = await searchByTitleOnly(title);
        }
        if (result) {
          results[id] = result;
        }
      } catch (err) {
        console.error(`Metadata fetch error for "${title}":`, err);
      }
    }

    res.json({ results });
  });

  const httpServer = createServer(app);
  return httpServer;
}
