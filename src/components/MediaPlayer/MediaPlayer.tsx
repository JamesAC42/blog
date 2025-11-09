import { useRef, useState, useEffect } from 'react';
import styles from './mediaplayer.module.scss';
import { Button } from '../Button/Button';

import pauseIcon from '@/assets/images/mediaplayer/pause.png';
import playIcon from '@/assets/images/mediaplayer/play.png';
import muteIcon from '@/assets/images/mediaplayer/mute.png';
import volumeIcon from '@/assets/images/mediaplayer/volume.png';
import stopIcon from '@/assets/images/mediaplayer/stop.png';

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
                    <Button small onClick={playAudio}>
                        <Image src={playIcon} alt="play" className={styles.playButton} width={24} height={24} />
                    </Button>
                    <Button small onClick={() => stopAudio(false)    }>
                        <Image src={pauseIcon} alt="pause" className={styles.playButton} width={24} height={24} />
                    </Button>
                    <Button small onClick={() => stopAudio(true)}>
                        <Image src={stopIcon} alt="stop" className={styles.playButton} width={24} height={24} />
                    </Button>

                    <div className={styles.volumeControl}>
                        <Image src={volumeLevel === 0 ? muteIcon : volumeIcon} alt="volume" width={24} height={24} />
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.1}
                            value={volumeLevel}
                            onChange={handleVolume}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};