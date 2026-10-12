type VideoPlayerProps = {
  poster: string
  title: string
  videoUrl?: string
  emptyMessage?: string
}

function VideoPlayer({
  poster,
  title,
  videoUrl,
  emptyMessage = 'Demo video coming soon',
}: VideoPlayerProps) {
  return (
    <div className="video-player">
      {videoUrl ? (
        <video controls playsInline poster={poster} aria-label={title}>
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support video.
        </video>
      ) : (
        <div
          className="video-placeholder"
          role="img"
          aria-label={`${title}. ${emptyMessage}`}
          style={{ backgroundImage: `url("${poster}")` }}
        >
          <span className="video-placeholder-icon" aria-hidden="true">
            ▶
          </span>
          <span className="video-placeholder-message">{emptyMessage}</span>
        </div>
      )}
    </div>
  )
}

export default VideoPlayer