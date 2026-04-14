import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  EyeOff
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
  const [array, setArray] = useState<number[]>([]);
  const [history, setHistory] = useState<SortState[]>([]);
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [customInput, setCustomInput] = useState('');
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
    setArray(newArray);
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

  const calculateNextState = (state: SortState): SortState | null => {
    const { array, currentIndex, compareIndex, comparisons, shifts } = state;
    const newArray = [...array];
    
    if (currentIndex >= array.length) return null;

    // Case 1: Start new element insertion
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

    // Case 2: Comparison phase
    if (compareIndex >= 0) {
      const leftValue = newArray[compareIndex];
      const pivotValue = newArray[compareIndex + 1];
      
      if (leftValue > pivotValue) {
        // Shift right
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
        // Found position
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
      // Reached the start
      return {
        ...state,
        currentIndex: currentIndex + 1,
        compareIndex: currentIndex + 1,
        pivotIndex: currentIndex + 1,
        isMoving: false,
        stepDescription: `Reached the start of the array. Element is in its relative sorted position.`,
      };
    }
  };

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
  }, [step, history]);

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      const baseSpeed = 1000;
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

  if (!currentState) return null;

  const inversions = useMemo(() => getInversions(currentState.array), [currentState.array]);

  const handleCustomInput = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = customInput.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    if (parsed.length > 0) {
      resetWithArray(parsed);
      setIsConfigOverlayOpen(false);
    }
  };

  const speedOptions = [0.5, 1, 2, 4];

  return (
    <div className="app-container">
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1>divide<span>.</span></h1>
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
          <button className="btn" onClick={() => resetWithArray(array)} title="Reset">
            <RotateCcw size={20} />
          </button>
        </div>
      </header>

      <main className="main-layout">
        <section className="viz-canvas">
          {isInversionMode && (
            <svg className="inversion-canvas">
              {inversions.map(([i, j], idx) => {
                const x1 = (i / currentState.array.length) * 100;
                const x2 = (j / currentState.array.length) * 100;
                return (
                  <motion.path
                    key={`inv-${idx}`}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.3 }}
                    d={`M ${x1 + 2.5}% 50 Q ${(x1 + x2) / 2 + 2.5}% 10 ${x2 + 2.5}% 50`}
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
                // Determine if it's higher or lower than the pivot
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
                    height: `${(val / Math.max(...array)) * 80 + 10}%`,
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
              <button className="btn" onClick={prevStep} disabled={step === 0}>
                <ChevronLeft size={24} />
              </button>
              <button className="btn btn-primary" onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
              </button>
              <button className="btn" onClick={nextStep} disabled={currentState.currentIndex >= currentState.array.length && !currentState.isMoving}>
                <ChevronRight size={24} />
              </button>
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

            <div className="metric-item" style={{ gap: '12px' }}>
              <span className="metric-label">Progress</span>
              <span className="metric-value">{Math.round((step / (history.length + 10)) * 100)}%</span>
            </div>
          </div>
        </section>

        <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          {/* Metrics Panel */}
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
                <motion.div 
                  initial={{ height: 0 }} 
                  animate={{ height: 'auto' }} 
                  exit={{ height: 0 }}
                  className="panel-content"
                >
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

          {/* Explanation Panel */}
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
                <motion.div 
                  initial={{ height: 0 }} 
                  animate={{ height: 'auto' }} 
                  exit={{ height: 0 }}
                  className="panel-content"
                >
                  <p className="step-explanation">
                    {currentState.stepDescription}
                  </p>
                  <div style={{ marginTop: 12, fontSize: '12px', opacity: 0.6 }}>
                    <strong>Insight:</strong> Insertion sort is efficient for small datasets or nearly sorted arrays.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>
      </main>

      {/* Configuration Overlay */}
      <AnimatePresence>
        {isConfigOverlayOpen && (
          <div className="overlay">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="overlay-panel"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Zap className="primary-text" size={24} color="var(--primary)" />
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Configure</h2>
                </div>
                <button className="btn" onClick={() => setIsConfigOverlayOpen(false)}>
                  <X size={24} />
                </button>
              </div>

              <div className="input-group">
                <label>Array Size: {arraySize}</label>
                <div className="preset-buttons">
                  {[10, 20, 30, 40, 50].map(s => (
                    <button 
                      key={s} 
                      className={`preset-btn ${arraySize === s ? 'active' : ''}`}
                      onClick={() => {
                        setArraySize(s);
                        generateRandomArray(s);
                      }}
                      style={arraySize === s ? { borderColor: 'var(--primary)', color: 'var(--primary)' } : {}}
                    >
                      {s} items
                    </button>
                  ))}
                </div>
              </div>

              <form className="input-group" onSubmit={handleCustomInput}>
                <label>Custom Data Set</label>
                <input 
                  type="text" 
                  placeholder="Enter numbers separated by commas (e.g. 5, 2, 9, 1)" 
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Apply Custom Array</button>
                  <button type="button" className="btn" style={{ flex: 1, background: 'var(--surface-low)' }} onClick={() => generateRandomArray(arraySize)}>Randomize Current Size</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
