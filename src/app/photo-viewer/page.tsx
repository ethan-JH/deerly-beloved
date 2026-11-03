import { PHOTOS } from '@/lib/photos'

export default function PhotoViewerPage() {
  return (
    <div className="min-h-screen bg-[#111] p-6">
      <h1 className="font-mono text-white text-lg mb-6 tracking-widest">
        PHOTO VIEWER — {PHOTOS.length} photos · edit <code className="text-yellow-300">pos</code> in src/lib/photos.ts
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {PHOTOS.map((photo) => (
          <div key={photo.src} className="flex flex-col gap-1">
            <div className="relative w-full overflow-hidden bg-black rounded" style={{ aspectRatio: '4/3' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src}
                alt=""
                className="w-full h-full object-cover"
                style={{ objectPosition: photo.pos }}
              />
            </div>
            <div className="font-mono text-xs text-gray-400 flex justify-between px-0.5">
              {/* The real filename, not the index. Deleted photos leave gaps in
                  the numbering, so an index-derived label points at the wrong
                  entry for everything after the first gap. */}
              <span className="text-white">{photo.src.split('/').pop()}</span>
              <span className="text-yellow-300">{photo.pos}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
