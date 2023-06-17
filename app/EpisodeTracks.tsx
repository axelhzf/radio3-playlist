'use client';

import { Episode } from '../services/ivoxFetcher';
import { useState } from 'react';

export function EpisodeTracks(props: {
  podcastName: string;
  episode: Episode;
}) {
  const { podcastName, episode } = props;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function addTracks() {
    setLoading(true);
    try {
      await fetch('/api/add-tracks', {
        method: 'POST',
        body: JSON.stringify([
          {
            name: podcastName,
            episodes: [episode],
          },
        ]),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h4 className="flex items-center">
        <div className="my-3 mr-2">
          <button
            disabled={loading}
            onClick={addTracks}
            className="bg-green-500 hover:bg-green-700 py-1 px-4 text-xs rounded-md text-white"
          >
            {!loading && <span>Add</span>}
            {loading && <span>Adding...</span>}
          </button>
        </div>
        <div className="cursor-pointer" onClick={() => setOpen((o) => !o)}>
          {episode.title}
        </div>
      </h4>
      {open && (
        <div>
          <ul className="pl-5 pt-2 pb-10 bg-gray-800">
            {episode.playlist.map((track) => (
              <li key={`${track.artist} - ${track.title}`}>
                {track.artist} - {track.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
