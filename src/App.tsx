import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Shuffle, 
  ChevronDown, 
  ChevronUp,
  Activity,
  Settings,
  Info,
  Maximize2,
  Minimize2,
  X,
  Zap,
  Eye,
  EyeOff,
  SkipBack,
  SkipForward,
  Plus,
  Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type SortState = {
  array: number[];
  currentIndex: number;
  compareIndex: number;
  pivotIndex: number;
  isMoving: boolean;
  stepDescription: string;
  comparisons: number;
  shifts: number;
  inversions: number;
  lastComparedValue?: number;
};

const INITIAL_SIZE = 20;

export default function App() {
  const [history, setHistory] = useState<SortState[]>([]);
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [arraySize, setArraySize] = useState(INITIAL_SIZE);
  
  // UI States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isConfigOverlayOpen, setIsConfigOverlayOpen] = useState(false);
  const [isInversionMode, setIsInversionMode] = useState(false);
  const [isMetricsOpen, setIsMetricsOpen] = useState(true);
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);

  const timerRef = useRef<number | null>(null);

  const countInversions = (arr: number[]) => {
    let count = 0;
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        if (arr[i] > arr[j]) count++;
      }
    }
    return count;
  };

  const getInversions = (arr: number[]) => {
    const invs: [number, number][] = [];
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        if (arr[i] > arr[j]) invs.push([i, j]);
      }
    }
    return invs;
  };

  const resetWithArray = useCallback((newArray: number[]) => {
    const initialState: SortState = {
      array: [...newArray],
      currentIndex: 1,
      compareIndex: 1,
      pivotIndex: 1,
      isMoving: false,
      stepDescription: 'Ready to start sorting. Elements are placed in order one by one.',
      comparisons: 0,
      shifts: 0,
      inversions: countInversions(newArray),
    };
    setHistory([initialState]);
    setStep(0);
    setIsPlaying(false);
  }, []);

  const generateRandomArray = useCallback((size: number) => {
    const newArray = Array.from({ length: size }, () => Math.floor(Math.random() * 90) + 10);
    resetWithArray(newArray);
  }, [resetWithArray]);

  useEffect(() => {
    generateRandomArray(INITIAL_SIZE);
  }, [generateRandomArray]);

  const calculateNextState = useCallback((state: SortState): SortState | null => {
    const { array, currentIndex, compareIndex, comparisons, shifts } = state;
    const newArray = [...array];
    
    if (currentIndex >= array.length) return null;

    if (compareIndex === currentIndex) {
       const pivotValue = array[currentIndex];
       return {
         ...state,
         compareIndex: currentIndex - 1,
         pivotIndex: currentIndex,
         isMoving: true,
         stepDescription: `Current element to insert is ${pivotValue}. Comparing it with its left neighbors.`,
       };
    }

    if (compareIndex >= 0) {
      const leftValue = newArray[compareIndex];
      const pivotValue = newArray[compareIndex + 1];
      
      if (leftValue > pivotValue) {
        newArray[compareIndex + 1] = leftValue;
        newArray[compareIndex] = pivotValue;
        
        return {
          ...state,
          array: newArray,
          compareIndex: compareIndex - 1,
          comparisons: comparisons + 1,
          shifts: shifts + 1,
          inversions: countInversions(newArray),
          lastComparedValue: leftValue,
          stepDescription: `${leftValue} is greater than ${pivotValue}, so we swap them.`,
        };
      } else {
        return {
          ...state,
          currentIndex: currentIndex + 1,
          compareIndex: currentIndex + 1,
          pivotIndex: currentIndex + 1,
          isMoving: false,
          comparisons: comparisons + 1,
          lastComparedValue: leftValue,
          stepDescription: `${leftValue} is smaller than or equal to ${pivotValue}. Element ${pivotValue} is now in its sorted relative position.`,
        };
      }
    } else {
      return {
        ...state,
        currentIndex: currentIndex + 1,
        compareIndex: currentIndex + 1,
        pivotIndex: currentIndex + 1,
        isMoving: false,
        stepDescription: `Reached the start of the array. Element is in its relative sorted position.`,
      };
    }
  }, []);

  const nextStep = useCallback(() => {
    if (step >= history.length - 1) {
      const lastState = history[history.length - 1];
      const newState = calculateNextState(lastState);
      if (newState) {
        setHistory(prev => [...prev, newState]);
        setStep(prev => prev + 1);
        return true;
      } else {
        setIsPlaying(false);
        return false;
      }
    } else {
      setStep(prev => prev + 1);
      return true;
    }
  }, [step, history, calculateNextState]);

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
      setIsPlaying(false);
    }
  };

  const jumpToStart = () => {
    setStep(0);
    setIsPlaying(false);
  };

  const jumpToEnd = () => {
    let currentHistory = [...history];
    let currentState = currentHistory[currentHistory.length - 1];
    
    while (true) {
      const next = calculateNextState(currentState);
      if (!next) break;
      currentHistory.push(next);
      currentState = next;
    }
    
    setHistory(currentHistory);
    setStep(currentHistory.length - 1);
    setIsPlaying(false);
  };

  useEffect(() => {
    if (isPlaying) {
      const baseSpeed = 800;
      const delay = baseSpeed / speedMultiplier;
      timerRef.current = window.setInterval(() => {
        const hasNext = nextStep();
        if (!hasNext) setIsPlaying(false);
      }, delay);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speedMultiplier, nextStep]);

  const currentState = history[step];

  if (!currentState) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#121212' }}>
        <h2 style={{ color: '#3b82f6', fontSize: '1.5rem', fontWeight: 800 }}>DIVIDE.</h2>
      </div>
    );
  }

  const inversions = getInversions(currentState.array);

  const speedOptions = [0.5, 1, 2, 4, 8];

  const handleArrayElementChange = (idx: number, val: number) => {
    const newArr = [...currentState.array];
    newArr[idx] = val;
    resetWithArray(newArr);
  };

  const progressPercentage = Math.round((currentState.currentIndex / currentState.array.length) * 100);

  return (
    <div className="app-container">
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 style={{ textTransform: 'uppercase' }}>DIVIDE<span>.</span></h1>
          <button className="btn" onClick={() => setIsConfigOverlayOpen(true)} title="Settings">
            <Settings size={20} />
          </button>
        </div>
        <div className="playback-btns">
          <button className="btn" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} title={isSidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}>
            {isSidebarCollapsed ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
          </button>
          <button className="btn" onClick={() => setIsInversionMode(!isInversionMode)} title={isInversionMode ? "Hide Inversions" : "Show Inversions"}>
            {isInversionMode ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
          <button className="btn" onClick={() => generateRandomArray(arraySize)} title="Randomize">
            <Shuffle size={20} />
          </button>
          <button className="btn" onClick={() => resetWithArray(currentState.array)} title="Reset">
            <RotateCcw size={20} />
          </button>
        </div>
      </header>

      <main className="main-layout">
        <section className="viz-canvas">
          {isInversionMode && (
            <svg className="inversion-canvas" style={{ zIndex: 10 }}>
              {inversions.map(([i, j], idx) => {
                const stepX = 100 / currentState.array.length;
                const x1 = (i * stepX) + (stepX / 2);
                const x2 = (j * stepX) + (stepX / 2);
                return (
                  <motion.path
                    key={`inv-${idx}`}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.5 }}
                    d={`M ${x1}% 85 Q ${(x1 + x2) / 2}% 20 ${x2}% 85`}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="2"
                    strokeDasharray="4"
                  />
                );
              })}
            </svg>
          )}

          <div className="canvas-area">
            {currentState.array.map((val, idx) => {
              const isPivot = (idx === currentState.compareIndex + 1 && currentState.isMoving);
              const isComparing = (idx === currentState.compareIndex);
              
              let statusClass = '';
              if (isPivot) statusClass = 'active';
              else if (isComparing) {
                const pivotValue = currentState.array[currentState.compareIndex + 1];
                statusClass = val > pivotValue ? 'higher' : 'lower';
              } else if (idx < currentState.currentIndex) {
                statusClass = 'sorted';
              }
              
              return (
                <motion.div
                  key={`${idx}-${val}`}
                  layout
                  className={`bar ${statusClass}`}
                  style={{ 
                    height: `${(val / Math.max(...currentState.array, 1)) * 70 + 10}%`,
                  }}
                >
                  <span style={{ 
                    position: 'absolute', 
                    bottom: '-25px', 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    fontSize: '10px',
                    opacity: 0.7
                  }}>{val}</span>
                </motion.div>
              );
            })}
          </div>

          <div className="controls-bar">
            <div className="playback-btns">
              <div className="jump-btns">
                <button className="btn" onClick={jumpToStart} disabled={step === 0} title="Jump to Start">
                  <SkipBack size={20} />
                </button>
                <button className="btn" onClick={prevStep} disabled={step === 0}>
                  <ChevronLeft size={24} />
                </button>
              </div>
              
              <button className="btn btn-primary" onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
              </button>
              
              <div className="jump-btns">
                <button className="btn" onClick={nextStep} disabled={currentState.currentIndex >= currentState.array.length && !currentState.isMoving}>
                  <ChevronRight size={24} />
                </button>
                <button className="btn" onClick={jumpToEnd} disabled={currentState.currentIndex >= currentState.array.length && !currentState.isMoving} title="Jump to End">
                  <SkipForward size={20} />
                </button>
              </div>
            </div>

            <div className="scrubber-container">
              <input 
                type="range" 
                className="scrubber"
                min="0"
                max={history.length - 1}
                value={step}
                onChange={(e) => setStep(parseInt(e.target.value))}
              />
            </div>

            <div className="speed-presets">
              {speedOptions.map(opt => (
                <button 
                  key={opt}
                  className={`speed-btn ${speedMultiplier === opt ? 'active' : ''}`}
                  onClick={() => setSpeedMultiplier(opt)}
                >
                  {opt}x
                </button>
              ))}
            </div>

            <div className="metric-item" style={{ gap: '12px', minWidth: '80px' }}>
              <span className="metric-label">Progress</span>
              <span className="metric-value">{progressPercentage}%</span>
            </div>
          </div>
        </section>

        <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="panel">
            <div className="panel-header" onClick={() => setIsMetricsOpen(!isMetricsOpen)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={16} />
                <h3>Metrics</h3>
              </div>
              {isMetricsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            <AnimatePresence>
              {isMetricsOpen && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="panel-content">
                  <div className="metric-item">
                    <span className="metric-label">Comparisons</span>
                    <span className="metric-value">{currentState.comparisons}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Shifts (Swaps)</span>
                    <span className="metric-value">{currentState.shifts}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Inversions</span>
                    <span className="metric-value">{currentState.inversions}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="panel">
            <div className="panel-header" onClick={() => setIsDetailsOpen(!isDetailsOpen)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Info size={16} />
                <h3>Live Logic</h3>
              </div>
              {isDetailsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            <AnimatePresence>
              {isDetailsOpen && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="panel-content">
                  <p className="step-explanation">{currentState.stepDescription}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>
      </main>

      <AnimatePresence>
        {isConfigOverlayOpen && (
          <div className="overlay">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="overlay-panel"
              style={{ width: '700px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Zap className="primary-text" size={24} color="var(--primary)" />
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>DIVIDE CONFIG</h2>
                </div>
                <button className="btn" onClick={() => setIsConfigOverlayOpen(false)}><X size={24} /></button>
              </div>

              <div className="input-group">
                <label>Array Size: {arraySize}</label>
                <div className="size-controls">
                  <button className="size-btn" onClick={() => { setArraySize(Math.max(2, arraySize - 1)); generateRandomArray(Math.max(2, arraySize - 1)); }}><Minus size={16} /></button>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{arraySize}</span>
                  <button className="size-btn" onClick={() => { setArraySize(Math.min(100, arraySize + 1)); generateRandomArray(Math.min(100, arraySize + 1)); }}><Plus size={16} /></button>
                </div>
              </div>

              <div className="input-group" style={{ flex: 1, minHeight: 0 }}>
                <label>Manual Entry (Edit individual elements)</label>
                <div className="array-edit-grid">
                  {currentState.array.map((val, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: '10px', opacity: 0.5, textAlign: 'center' }}>#{idx}</span>
                      <input 
                        type="number" 
                        className="array-input" 
                        value={val} 
                        onChange={(e) => handleArrayElementChange(idx, parseInt(e.target.value) || 0)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setIsConfigOverlayOpen(false)}>Close and Preview</button>
                <button className="btn" style={{ flex: 1, background: 'var(--surface-low)' }} onClick={() => generateRandomArray(arraySize)}>Regenerate Random</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
