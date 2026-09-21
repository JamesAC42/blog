import { useRef, useState, useEffect } from 'react';
import styles from './mediaplayer.module.scss';
import { Button } from '../Button/Button';

import pauseIcon from '@/assets/images/mediaplayer/pause.png';
import playIcon from '@/assets/images/mediaplayer/play.png';
import muteIcon from '@/assets/images/mediaplayer/mute.png';
import volumeIcon from '@/assets/images/mediaplayer/volume.png';
import stopIcon from '@/assets/images/mediaplayer/stop.png';

import albumCover from '@/assets/images/homepage/elma.jpg';

import Image from 'next/image';

export const MediaPlayer = () => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volumeLevel, setVolumeLevel] = useState(1);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.addEventListener('timeupdate', () => {
                setCurrentTime(audioRef.current?.currentTime || 0);
            });
            audioRef.current.addEventListener('loadedmetadata', () => {
                setDuration(audioRef.current?.duration || 0);
            });
        }
    }, []);

    const stopAudio = (reset: boolean = false) => {
        if (audioRef.current) {
            audioRef.current.pause();
            if (reset) {
                audioRef.current.currentTime = 0;
                setCurrentTime(0);
            }
        }
    };

    const playAudio = () => {
        if (audioRef.current) {
            audioRef.current.play();
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
        const vol = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.volume = vol;
            setVolumeLevel(vol);
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <>
            <div className={styles.albumCover}>
                <Image src={albumCover} alt="album cover" width={400} height={395} />
            </div>
            <div className={styles.mediaPlayer}>
                <audio ref={audioRef} src="/rainwithcapuccino.mp3" />
                
                <div className={styles.songInfo}>
                    <strong>rain with capuccino</strong> - yorushika
                </div>

                <div className={styles.controls}>
                    <div className={styles.seekBar}>
                        <div className={styles.timeDisplay}>
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                        <input 
                            type="range"
                            min={0}
                            max={duration}
                            value={currentTime}
                            onChange={handleSeek}
                        />
                    </div>

                    <div className={styles.playbackControls}>
                        <Button small onClick={playAudio} aria-label="Play" title="Play">
                            <Image src={playIcon} alt="" className={styles.playButton} width={24} height={24} aria-hidden="true" />
                        </Button>
                        <Button small onClick={() => stopAudio(false)} aria-label="Pause" title="Pause">
                            <Image src={pauseIcon} alt="" className={styles.playButton} width={24} height={24} aria-hidden="true" />
                        </Button>
                        <Button small onClick={() => stopAudio(true)} aria-label="Stop" title="Stop">
                            <Image src={stopIcon} alt="" className={styles.playButton} width={24} height={24} aria-hidden="true" />
                        </Button>

                        <div className={styles.volumeControl}>
                            <Image src={volumeLevel === 0 ? muteIcon : volumeIcon} alt="" width={24} height={24} aria-hidden="true" />
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.1}
                                value={volumeLevel}
                                onChange={handleVolume}
                                aria-label="Volume"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};