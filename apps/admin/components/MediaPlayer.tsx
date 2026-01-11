import React, { useState, useRef, useEffect } from 'react';

interface MediaPlayerProps {
  url?: string;
  type: 'video' | 'audio';
  title?: string;
  onClose?: () => void;
}

export default function MediaPlayer({ url, type, title, onClose }: MediaPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const updateTime = () => setCurrentTime(media.currentTime);
    const updateDuration = () => setDuration(media.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    media.addEventListener('timeupdate', updateTime);
    media.addEventListener('loadedmetadata', updateDuration);
    media.addEventListener('play', handlePlay);
    media.addEventListener('pause', handlePause);
    media.addEventListener('ended', handleEnded);

    return () => {
      media.removeEventListener('timeupdate', updateTime);
      media.removeEventListener('loadedmetadata', updateDuration);
      media.removeEventListener('play', handlePlay);
      media.removeEventListener('pause', handlePause);
      media.removeEventListener('ended', handleEnded);
    };
  }, [url]);

  const togglePlayPause = () => {
    if (!mediaRef.current) return;

    if (isPlaying) {
      mediaRef.current.pause();
    } else {
      mediaRef.current.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (mediaRef.current) {
      mediaRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    if (mediaRef.current) {
      mediaRef.current.volume = vol;
      setVolume(vol);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if ((containerRef.current as any).webkitRequestFullscreen) {
        (containerRef.current as any).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const skip = (seconds: number) => {
    if (mediaRef.current) {
      mediaRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  };

  if (!url) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        padding: '20px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        width: type === 'video' ? '800px' : '400px',
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          color: 'white',
        }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
            {title || (type === 'video' ? 'Video Player' : 'Audio Player')}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            ×
          </button>
        </div>

        {/* Media Element */}
        <div
          ref={containerRef}
          style={{
            position: 'relative',
            backgroundColor: '#000',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          {type === 'video' ? (
            <video
              ref={mediaRef as React.RefObject<HTMLVideoElement>}
              src={url}
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '60vh',
                display: 'block',
              }}
              controls={false}
              autoPlay={false}
            />
          ) : (
            <audio
              ref={mediaRef as React.RefObject<HTMLAudioElement>}
              src={url}
              style={{ width: '100%' }}
              controls={false}
              autoPlay={false}
            />
          )}

          {/* Audio visualization for audio-only */}
          {type === 'audio' && (
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              right: '20px',
              height: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                display: 'flex',
                gap: '4px',
                alignItems: 'flex-end',
                height: '40px',
              }}>
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: '3px',
                      backgroundColor: '#007bff',
                      borderRadius: '2px',
                      height: `${Math.random() * 30 + 10}px`,
                      transition: 'height 0.1s ease',
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Custom Controls */}
        <div style={{
          marginTop: '16px',
          color: 'white',
        }}>
          {/* Progress Bar */}
          <div style={{ marginBottom: '12px' }}>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: '#333',
                outline: 'none',
                WebkitAppearance: 'none',
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.875rem',
              marginTop: '4px',
            }}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '12px',
          }}>
            <button
              onClick={() => skip(-10)}
              style={{
                background: '#333',
                border: 'none',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              -10s
            </button>
            
            <button
              onClick={togglePlayPause}
              style={{
                background: '#007bff',
                border: 'none',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
              }}
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>

            <button
              onClick={() => skip(10)}
              style={{
                background: '#333',
                border: 'none',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              +10s
            </button>
          </div>

          {/* Volume and Fullscreen */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                style={{
                  width: '80px',
                }}
              />
            </div>

            {type === 'video' && (
              <button
                onClick={toggleFullscreen}
                style={{
                  background: '#333',
                  border: 'none',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                {isFullscreen ? '⛶ Exit' : '⛶ Fullscreen'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
