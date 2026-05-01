import { create } from 'zustand'

export const usePlayerStore = create((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 0.8,
  progress: 0,
  duration: 0,
  queue: [],

  setTrack: (track) => set({ currentTrack: track, isPlaying: true, progress: 0 }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setVolume: (volume) => set({ volume }),
  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),
  addToQueue: (track) => set((s) => ({ queue: [...s.queue, track] })),
  clearQueue: () => set({ queue: [] }),
  playNext: () => {
    const { queue, currentTrack } = get()
    if (!queue.length) return
    const idx = queue.findIndex((t) => t.id === currentTrack?.id)
    const next = queue[idx + 1] || queue[0]
    set({ currentTrack: next, isPlaying: true, progress: 0 })
  },
  playPrev: () => {
    const { queue, currentTrack } = get()
    if (!queue.length) return
    const idx = queue.findIndex((t) => t.id === currentTrack?.id)
    const prev = queue[idx - 1] || queue[queue.length - 1]
    set({ currentTrack: prev, isPlaying: true, progress: 0 })
  },
}))
