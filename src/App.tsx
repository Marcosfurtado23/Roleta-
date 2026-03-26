import { useState, useRef, useEffect } from 'react';

export default function App() {
  const [started, setStarted] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastSliceRef = useRef<number>(0);
  const requestRef = useRef<number | null>(null);

  const playTick = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  };

  const trackRotation = () => {
    if (!wheelRef.current) return;
    const st = window.getComputedStyle(wheelRef.current);
    const tr = st.getPropertyValue("transform");
    
    if (tr !== 'none') {
      const values = tr.split('(')[1].split(')')[0].split(',');
      const a = parseFloat(values[0]);
      const b = parseFloat(values[1]);
      let angle = Math.atan2(b, a) * (180 / Math.PI);
      if (angle < 0) angle += 360;

      const slice = Math.floor(angle / 60);
      if (slice !== lastSliceRef.current) {
        playTick();
        lastSliceRef.current = slice;
      }
    }
    requestRef.current = requestAnimationFrame(trackRotation);
  };

  const spin = () => {
    if (isSpinning) return;

    // Initialize audio context on first user interaction to comply with browser policies
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    setIsSpinning(true);

    // Target offsets for "SIM" (clockwise spinning)
    // Slices: 0=Sim, 1=Não, 2=Sim, 3=Não, 4=Sim, 5=Não
    // Sim centers at 30, 150, 270.
    // To get Sim at top (0deg), we need the wheel rotation to end at 330, 210, or 90.
    const simOffsets = [90, 210, 330];
    const targetOffset = simOffsets[Math.floor(Math.random() * simOffsets.length)];

    const currentMod = rotation % 360;
    const diff = targetOffset - currentMod;
    const additionalRotation = diff >= 0 ? diff : diff + 360;

    // Spin at least 5 full times
    const finalRotation = rotation + (360 * 5) + additionalRotation;

    setRotation(finalRotation);

    // Start tracking for ticks
    requestRef.current = requestAnimationFrame(trackRotation);

    // Stop spinning after transition ends (4 seconds)
    setTimeout(() => {
      setIsSpinning(false);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  if (!started) {
    return (
      <div className="min-h-screen rainbow-bg flex flex-col items-center justify-center overflow-hidden font-sans relative">
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10 flex flex-col items-center w-full max-w-4xl px-4 text-center">
          <h1 
            className="text-6xl md:text-8xl font-black mb-16 uppercase tracking-tighter rainbow-text"
            style={{ 
              WebkitTextStroke: '3px white',
              filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.8))'
            }}
          >
            Saiba se você é gay !
          </h1>
          <button
            onClick={() => setStarted(true)}
            className="px-16 py-6 bg-white text-black font-black text-3xl md:text-4xl rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.6)] hover:scale-105 active:scale-95 transition-all"
          >
            INICIAR
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen rainbow-bg flex flex-col items-center justify-center overflow-hidden font-sans relative">
      {/* Dark overlay to make the wheel and text pop against the rainbow background */}
      <div className="absolute inset-0 bg-black/30"></div>
      
      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-4">
        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] mb-12 text-center">
          A Roleta
        </h1>

        {/* Wheel Container */}
        <div className="relative mt-8">
          {/* Pointer */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-30 text-white drop-shadow-[0_6px_6px_rgba(0,0,0,0.9)]">
            <svg width="70" height="70" viewBox="0 0 24 24" fill="#f8fafc" stroke="#334155" strokeWidth="1">
              <path d="M12 24L2 4h20z" />
            </svg>
          </div>

          {/* Metallic Ring */}
          <div className="metallic-ring p-4 md:p-5 rounded-full relative z-20">
            {/* Wheel */}
            <div
              ref={wheelRef}
              className="w-72 h-72 md:w-80 md:h-80 rounded-full overflow-hidden relative shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? 'transform 4s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
              }}
            >
            {/* Rainbow background for SIM slices */}
            <div className="absolute inset-0 rainbow-bg"></div>

            {/* Blue slices for NÃO */}
            <div
              className="absolute inset-0"
              style={{
                background: `conic-gradient(
                  transparent 0deg 60deg,
                  #3b82f6 60deg 120deg,
                  transparent 120deg 180deg,
                  #3b82f6 180deg 240deg,
                  transparent 240deg 300deg,
                  #3b82f6 300deg 360deg
                )`
              }}
            ></div>

            {/* Text Labels */}
            {Array.from({ length: 6 }).map((_, i) => {
              const isSim = i % 2 === 0;
              const angle = i * 60 + 30; // Center of the slice
              return (
                <div
                  key={i}
                  className="absolute w-full h-full flex items-start justify-center pt-6 md:pt-8"
                  style={{ transform: `rotate(${angle}deg)` }}
                >
                  <span
                    className={`font-black text-4xl md:text-5xl text-white drop-shadow-[0_3px_3px_rgba(0,0,0,0.9)]`}
                  >
                    {isSim ? 'SIM' : 'NÃO'}
                  </span>
                </div>
              );
            })}
            </div>
          </div>
        </div>

        {/* Spin Button */}
        <button
          onClick={spin}
          disabled={isSpinning}
          className={`mt-16 px-16 py-5 bg-white text-black font-black text-3xl rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all ${
            isSpinning ? 'opacity-50 cursor-not-allowed scale-95' : 'hover:scale-105 hover:shadow-[0_10px_40px_rgba(255,255,255,0.6)] active:scale-95'
          }`}
        >
          {isSpinning ? 'GIRANDO...' : 'GIRAR'}
        </button>
      </div>
    </div>
  );
}
