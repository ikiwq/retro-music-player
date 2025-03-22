import {
  IconArrowsShuffle,
  IconMinus, 
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconPlayerSkipBackFilled, 
  IconPlayerSkipForwardFilled,
  IconPlus,
  IconRepeat,
  TablerIcon
} from "@tabler/icons-react";
import {
  ChangeEvent, 
  ChangeEventHandler, 
  RefObject, 
  useCallback, 
  useEffect, 
  useMemo, 
  useRef, 
  useState
} from "react";
import {Song} from "../lib/types";
import SONGS from "../data/songs.data";
import {calculateTime} from "../lib/utils";

export default function Mp3Player() {
  const [playing, setPlaying] = useState(false);
  const [songIndex, setSongIndex] = useState<number>(0);
  const [repeating, setRepeating] = useState(false);
  const [shuffling, setShuffling] = useState(false);

  const playingSong = useMemo(() => SONGS[songIndex], [songIndex]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeDisplayRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    const input = inputRef.current;
    if (!audio || !input) return;

    audio.volume = 0.05;

    const onLoadedMetadata = () => {
      input.value = "0";
      input.max = Math.floor(audio.duration).toString();
    };

    const onTimeUpdate = () => {
      if (audio && input && timeDisplayRef.current) {
        input.value = Math.floor(audio.currentTime).toString();
        timeDisplayRef.current.innerText = calculateTime(audio.currentTime);
      }
    };

    const onPlayPause = () => setPlaying(audio.paused ? false : true);

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("play", onPlayPause);
    audio.addEventListener("pause", onPlayPause);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.play();

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("play", onPlayPause);
      audio.removeEventListener("pause", onPlayPause);
      audio.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [audioRef, inputRef]);

  const onSongEnd = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setPlaying(false);
    timeDisplayRef.current!.innerText = "0:00";

    if (repeating) {
      audio.currentTime = 0;
    } else {
      setSongIndex(prevIndex => {
        if (shuffling) {
          let newIndex = getRandomSongIndex();
          while (newIndex === songIndex) newIndex = getRandomSongIndex();
          return newIndex;
        } else {
          return prevIndex === SONGS.length - 1 ? 0 : prevIndex + 1;
        }
      });
    }

    setPlayTimeout();
  }, [songIndex, repeating, shuffling]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.addEventListener("ended", onSongEnd);
    return () => audio.removeEventListener("ended", onSongEnd);
  }, [audioRef, onSongEnd]);

  const setPlayTimeout = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setTimeout(() => audio.play(), 100);
  }, [audioRef]);

  const onChangeInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const input = inputRef.current;
    const audio = audioRef.current;
    if (input && audio && timeDisplayRef.current) {
      const newTime = Number(e.target.value);
      audio.currentTime = newTime;
      timeDisplayRef.current.innerText = calculateTime(newTime);
    }
  }, [inputRef, audioRef, timeDisplayRef]);

  const onPressPlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if(playing){
      audio.pause()
      return;
    }
    audio.play();
  }, [playing]);

  const adjustVolume = (delta: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = Math.min(Math.max(audio.volume + delta, 0), 1);
    }
  };

  const onAudioPressUp = () => adjustVolume(0.01);
  const onAudioPressDown = () => adjustVolume(-0.01);

  const onForward = () => {
    setShuffling(false);
    setRepeating(false);
    setSongIndex(prevIndex => (prevIndex === SONGS.length - 1 ? 0 : prevIndex + 1));
    setPlayTimeout();
  };

  const onBackward = () => {
    setShuffling(false);
    setRepeating(false);
    setSongIndex(prevIndex => (prevIndex === 0 ? SONGS.length - 1 : prevIndex - 1));
    setPlayTimeout();
  };

  return (
    <div className={`
      w-72 h-32 
      bg-gradient-to-t from-neutral-700 to-neutral-600 
      rounded-full 
      border border-neutral-600 
      shadow-2xs shadow-neutral-500
      flex
      `}>
      <audio src={playingSong?.src} ref={audioRef}/>
      <MediaControls 
        playing={playing}
        onAudioPressUp={onAudioPressUp}
        onAudioPressDown={onAudioPressDown}
        onPressPlay={onPressPlay}
        onBackward={onBackward}
        onForward={onForward}
      />
      <MediaScreen 
        timeDisplayRef={timeDisplayRef}
        song={playingSong} 
        onChangeInput={onChangeInput}
        inputRef={inputRef}
        shuffling={shuffling}
        setShuffling={setShuffling}
        repeating={repeating}
        setRepeating={setRepeating}
      />
    </div>
  )
}

interface MediaControls {
  playing: boolean;
  onAudioPressUp: () => void;
  onAudioPressDown: () => void;
  onPressPlay: () => void;
  onForward: () => void;
  onBackward: () => void;
}

interface MediaButton {
  position: string;
  action: () => void;
  Icon: TablerIcon;
}

function MediaControls({
  playing,
  onAudioPressUp,
  onAudioPressDown,
  onPressPlay,
  onForward,
  onBackward
}: MediaControls) {

  const mediaButtons: Array<MediaButton> = [
    {
      position: "top-1.5",
      action: onAudioPressUp,
      Icon: IconPlus
    },
    {
      position: "bottom-1.5",
      action: onAudioPressDown,
      Icon: IconMinus
    },
    {
      position: "left-1.5",
      action: onBackward,
      Icon: IconPlayerSkipBackFilled
    },
    {
      position: "right-1.5",
      action: onForward,
      Icon: IconPlayerSkipForwardFilled
    }
  ]

  return (
    <div className="p-2 h-full aspect-square">
      <div className="h-full w-full rounded-full border border-neutral-800 shadow-xs shadow-neutral-800 p-2.5">
        <div className={`
            flex items-center justify-center
            h-full p-3
            bg-neutral-800 
            rounded-full 
            shadow-inner shadow-neutral-900
            relative
            text-white
          `}>
          {
            mediaButtons.map((mButton, i) => (
              <button 
                key={`media-button-${i}`}
                className={`${mButton.position} absolute hover:text-neutral-400 duration-200 cursor-pointer`}
                onClick={mButton.action}
              >
                <mButton.Icon className="w-4 h-4"/>
              </button>
            ))
          }
          <button 
            onClick={onPressPlay}
            className={`
              rounded-full 
              w-10 h-10 
              shadow-inner shadow-neutral-900 
              flex items-center justify-center 
              cursor-pointer
              hover:text-neutral-400 duration-200
            `}>
            {playing ? <IconPlayerPauseFilled className="w-8 h-8"/> : <IconPlayerPlayFilled className="w-8 h-8"/>}
          </button>
        </div>
      </div>
    </div>
  )
};

interface MediaScreenProps {
  song: Song | undefined;
  timeDisplayRef: RefObject<HTMLSpanElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
  onChangeInput: ChangeEventHandler<HTMLInputElement>;
  shuffling: boolean;
  setShuffling: (arg0: boolean) => void;
  repeating: boolean;
  setRepeating: (arg0: boolean) => void;
}

function MediaScreen({song, timeDisplayRef, inputRef, onChangeInput, shuffling, setShuffling, repeating, setRepeating}: MediaScreenProps) {
  return (
    <div className="w-full h-full rounded-full pr-3.5 pt-3.5 pb-3.5">
      <div className={`
          w-full h-full 
          bg-gradient-to-t from-neutral-900 to-neutral-700 
          rounded-full 
          shadow-inner shadow-neutral-900
          flex flex-col
          `}>
        <div className="text-neutral-200 h-full flex items-center justify-center pt-1.5">
          <p className="text-xs not-even:w-[80%] text-center pt-2">{song?.title}</p>
        </div>
        <div className="h-full flex flex-col items-center justify-center gap-2">
          <input
            ref={inputRef} 
            onChange={onChangeInput} 
            type="range" 
            className="w-[80%] h-2.5 rounded-full cursor-pointer accent-neutral-700"
          />
          <div className="flex w-[70%] justify-around">
            <button 
              onClick={() => setShuffling(!shuffling)}
              className={`${shuffling ? "text-neutral-200" : "hover:text-neutral-400 text-neutral-500"} duration-200 cursor-pointer`}
            >
              <IconArrowsShuffle className="w-4 h-4"/>
            </button>
            <span ref={timeDisplayRef} className="text-xs text-white">0:00</span>
            <button 
              onClick={() => setRepeating(!repeating)}
              className={`${repeating ? "text-neutral-200" : "hover:text-neutral-400 text-neutral-500"} duration-200 cursor-pointer`}
            >
              <IconRepeat className="w-4 h-4"/>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function getRandomSongIndex(){
  return Math.floor(Math.random() * SONGS.length);
}