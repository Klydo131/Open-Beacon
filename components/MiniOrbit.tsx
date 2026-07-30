'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
} from 'react';

type Scene = 'rain' | 'room' | 'wind';

const SCENES: Array<{ id: Scene; label: string; detail: string }> = [
  { id: 'rain', label: 'Soft rain', detail: 'Filtered local noise' },
  { id: 'room', label: 'Quiet room', detail: 'Low ambient tones' },
  { id: 'wind', label: 'Gentle wind', detail: 'Airy local noise' },
];

interface AudioGraph {
  context: AudioContext;
  gain: GainNode;
  sources: AudioScheduledSourceNode[];
}

export function MiniOrbit() {
  const [scene, setScene] = useState<Scene>('rain');
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.35);
  const graph = useRef<AudioGraph | null>(null);

  const [duration, setDuration] = useState(15 * 60);
  const [seconds, setSeconds] = useState(15 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    if (!timerRunning) return;
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timerRunning]);

  useEffect(() => {
    if (graph.current) graph.current.gain.gain.value = volume;
  }, [volume]);

  useEffect(
    () => () => {
      stopGraph(graph);
    },
    [],
  );

  const start = async (nextScene: Scene) => {
    stopGraph(graph);

    const context = new AudioContext();
    const gain = context.createGain();
    gain.gain.value = volume;
    gain.connect(context.destination);
    const sources: AudioScheduledSourceNode[] = [];

    if (nextScene === 'room') {
      for (const frequency of [110, 164.8]) {
        const oscillator = context.createOscillator();
        const toneGain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        toneGain.gain.value = frequency === 110 ? 0.055 : 0.025;
        oscillator.connect(toneGain).connect(gain);
        oscillator.start();
        sources.push(oscillator);
      }
    } else {
      const sampleCount = context.sampleRate * 2;
      const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let index = 0; index < sampleCount; index += 1) {
        samples[index] = Math.random() * 2 - 1;
      }

      const noise = context.createBufferSource();
      const filter = context.createBiquadFilter();
      noise.buffer = buffer;
      noise.loop = true;
      filter.type = nextScene === 'rain' ? 'lowpass' : 'bandpass';
      filter.frequency.value = nextScene === 'rain' ? 1350 : 520;
      filter.Q.value = nextScene === 'rain' ? 0.55 : 0.8;
      noise.connect(filter).connect(gain);
      noise.start();
      sources.push(noise);
    }

    await context.resume();
    graph.current = { context, gain, sources };
    setScene(nextScene);
    setPlaying(true);
  };

  const stop = () => {
    stopGraph(graph);
    setPlaying(false);
  };

  const chooseScene = (nextScene: Scene) => {
    setScene(nextScene);
    if (playing) void start(nextScene);
  };

  const chooseDuration = (minutes: number) => {
    const nextDuration = minutes * 60;
    setDuration(nextDuration);
    setSeconds(nextDuration);
    setTimerRunning(false);
  };

  const progress = duration === 0 ? 0 : (duration - seconds) / duration;
  const timerStyle = {
    '--timer-progress': `${progress * 360}deg`,
  } as CSSProperties;

  return (
    <section className="orbit-card" aria-label="Mini Orbit focus room">
      <div className="orbit-heading">
        <div>
          <p className="rail-kicker">Attached to your room</p>
          <h2>Mini Orbit</h2>
        </div>
        <span className={playing ? 'orbit-status playing' : 'orbit-status'}>
          {playing ? 'Playing' : 'Paused'}
        </span>
      </div>

      <div className={playing ? 'orbit-visual is-playing' : 'orbit-visual'}>
        <span className="orbit-path path-one" />
        <span className="orbit-path path-two" />
        <span className="orbit-planet">O</span>
        <span className="orbit-satellite" />
      </div>

      <div className="orbit-scenes" aria-label="Ambient sound">
        {SCENES.map((option) => (
          <button
            key={option.id}
            className={scene === option.id ? 'orbit-scene active' : 'orbit-scene'}
            onClick={() => chooseScene(option.id)}
            aria-pressed={scene === option.id}
          >
            <strong>{option.label}</strong>
            <small>{option.detail}</small>
          </button>
        ))}
      </div>

      <div className="orbit-controls">
        <button
          className="orbit-play"
          onClick={() => (playing ? stop() : void start(scene))}
          aria-label={playing ? 'Pause Mini Orbit' : 'Play Mini Orbit'}
        >
          {playing ? 'Ⅱ' : '▶'}
        </button>
        <label>
          <span>Volume</span>
          <input
            type="range"
            min="0"
            max="0.7"
            step="0.05"
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
          />
        </label>
      </div>

      <div className="focus-timer">
        <div className="timer-dial" style={timerStyle}>
          <span>{formatTime(seconds)}</span>
        </div>
        <div className="timer-actions">
          <p>Focus timer</p>
          <div>
            {[5, 15, 25].map((minutes) => (
              <button
                key={minutes}
                onClick={() => chooseDuration(minutes)}
                aria-pressed={duration === minutes * 60}
              >
                {minutes}m
              </button>
            ))}
          </div>
          <button
            className="timer-toggle"
            onClick={() => {
              if (seconds === 0) setSeconds(duration);
              setTimerRunning((value) => !value);
            }}
          >
            {timerRunning ? 'Pause timer' : seconds === 0 ? 'Restart timer' : 'Start timer'}
          </button>
        </div>
      </div>

      <p className="orbit-privacy">
        Sound is generated on this device. Nothing is streamed or recorded.
      </p>
    </section>
  );
}

function stopGraph(graph: MutableRefObject<AudioGraph | null>) {
  const active = graph.current;
  if (!active) return;
  for (const source of active.sources) {
    try {
      source.stop();
    } catch {
      // A source can already be stopped during rapid scene changes.
    }
  }
  void active.context.close();
  graph.current = null;
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}
