import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";

async function searchMusicBrainz(title: string, artist: string) {
  try {
    const query = encodeURIComponent(`recording:"${title}" AND artist:"${artist}"`);
    const url = `https://musicbrainz.org/ws/2/recording?query=${query}&limit=1&fmt=json`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Sonora/1.0 (music-player-app)',
      },
    });

    if (!res.ok) return null;
    const data = await res.json();

    if (data.recordings && data.recordings.length > 0) {
      const recording = data.recordings[0];
      const releaseId = recording.releases?.[0]?.id;
      let coverArt: string | null = null;

      if (releaseId) {
        try {
          const coverRes = await fetch(
            `https://coverartarchive.org/release/${releaseId}`,
            { headers: { 'User-Agent': 'Sonora/1.0 (music-player-app)' } }
          );
          if (coverRes.ok) {
            const coverData = await coverRes.json();
            const front = coverData.images?.find((img: any) => img.front);
            coverArt = front?.thumbnails?.['500'] || front?.thumbnails?.large || front?.image || null;
          }
        } catch {
          // cover art not available
        }
      }

      return {
        title: recording.title || title,
        artist: recording['artist-credit']?.[0]?.name || artist,
        album: recording.releases?.[0]?.title || null,
        year: recording.releases?.[0]?.date?.substring(0, 4) || null,
        coverArt,
        mbid: recording.id,
      };
    }

    return null;
  } catch (err) {
    console.error('MusicBrainz search error:', err);
    return null;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get('/api/metadata/search', async (req: Request, res: Response) => {
    const { title, artist } = req.query;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'title query parameter is required' });
    }

    const result = await searchMusicBrainz(
      title,
      typeof artist === 'string' ? artist : ''
    );

    if (result) {
      res.json(result);
    } else {
      res.status(404).json({ error: 'No metadata found' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
