import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Minus,
  Code2,
  Grid3X3,
  Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type SortState = {
  array: number[];
  currentIndex: number;
  compareIndex: number;
  isMoving: boolean;
  stepDescription: string;
  comparisons: number;
  shifts: number;
  inversions: number;
  activeLine: number;
  currentPivot: number;
};

const INITIAL_SIZE = 20;

const CODE_LINES = [
  "function insertionSort(arr) {",
  "  for (let i = 1; i < arr.length; i++) {",
  "    let pivot = arr[i];",
  "    let j = i - 1;",
  "    while (j >= 0 && arr[j] > pivot) {",
  "      arr[j + 1] = arr[j];",
  "      j--;",
  "    }",
  "    arr[j + 1] = pivot;",
  "  }",
  "}"
];

export default function App() {
  const [history, setHistory] = useState<SortState[]>([]);
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [arraySize, setArraySize] = useState(INITIAL_SIZE);
  
  // UI States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isConfigOverlayOpen, setIsConfigOverlayOpen] = useState(false);
  const [isAllInversionsOpen, setIsAllInversionsOpen] = useState(false);
  const [isInversionMode, setIsInversionMode] = useState(false);
  const [isDebuggerMode, setIsDebuggerMode] = useState(true);
  const [isMetricsOpen, setIsMetricsOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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
      isMoving: false,
      stepDescription: 'Ready to start sorting. Elements are placed in order one by one.',
      comparisons: 0,
      shifts: 0,
      inversions: countInversions(newArray),
      activeLine: 1,
      currentPivot: newArray[1] || 0,
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
    const { array, currentIndex, compareIndex, comparisons, shifts, currentPivot } = state;
    const newArray = [...array];
    
    if (currentIndex >= array.length) {
      if (state.activeLine !== 11) {
        return { ...state, activeLine: 11, stepDescription: 'Sorting complete.' };
      }
      return null;
    }

    if (compareIndex === currentIndex) {
       const pivotValue = array[currentIndex];
       return {
         ...state,
         compareIndex: currentIndex - 1,
         isMoving: true,
         activeLine: 3,
         currentPivot: pivotValue,
         stepDescription: `Current element to insert is ${pivotValue}. Setting pivot and j = ${currentIndex - 1}.`,
       };
    }

    if (compareIndex >= 0) {
      const leftValue = newArray[compareIndex];
      
      if (leftValue > currentPivot) {
        newArray[compareIndex + 1] = leftValue;
        newArray[compareIndex] = currentPivot;
        
        return {
          ...state,
          array: newArray,
          compareIndex: compareIndex - 1,
          comparisons: comparisons + 1,
          shifts: shifts + 1,
          inversions: countInversions(newArray),
          activeLine: 6,
          stepDescription: `${leftValue} is greater than pivot ${currentPivot}, so we shift it right.`,
        };
      } else {
        return {
          ...state,
          currentIndex: currentIndex + 1,
          compareIndex: currentIndex + 1,
          isMoving: false,
          comparisons: comparisons + 1,
          activeLine: 9,
          stepDescription: `${leftValue} is smaller than or equal to pivot ${currentPivot}. Found insertion point.`,
        };
      }
    } else {
      return {
        ...state,
        currentIndex: currentIndex + 1,
        compareIndex: currentIndex + 1,
        isMoving: false,
        activeLine: 9,
        stepDescription: `Reached the start of the array. Element ${currentPivot} is placed at index 0.`,
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

  const allInversionsMap = useMemo(() => {
    if (!currentState) return new Map();
    const map = new Map<number, { idx: number, val: number }[]>();
    for (let i = 0; i < currentState.array.length; i++) {
      const invs = [];
      for (let j = i + 1; j < currentState.array.length; j++) {
        if (currentState.array[i] > currentState.array[j]) {
          invs.push({ idx: j, val: currentState.array[j] });
        }
      }
      if (invs.length > 0) map.set(i, invs);
    }
    return map;
  }, [currentState]);

  if (!currentState) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#121212' }}>
        <h2 style={{ color: '#3b82f6', fontSize: '1.5rem', fontWeight: 800 }}>DIVIDE.</h2>
      </div>
    );
  }

  const allInversions = getInversions(currentState.array);

  const speedOptions = [0.5, 1, 2, 4, 8];

  const handleArrayElementChange = (idx: number, val: number) => {
    const newArr = [...currentState.array];
    newArr[idx] = val;
    resetWithArray(newArr);
  };

  const progressPercentage = Math.round((currentState.currentIndex / currentState.array.length) * 100);

  const toggleDebuggerMode = () => {
    const newMode = !isDebuggerMode;
    setIsDebuggerMode(newMode);
    if (newMode) {
      setIsMetricsOpen(false);
      setIsDetailsOpen(false);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 style={{ textTransform: 'uppercase' }}>DIVIDE<span>.</span></h1>
          <button className="btn" onClick={() => setIsConfigOverlayOpen(true)} title="Settings">
            <Settings size={20} />
          </button>
          <button className="btn" onClick={() => setIsAllInversionsOpen(true)} title="All Inversions Matrix">
            <Grid3X3 size={20} />
          </button>
        </div>
        <div className="playback-btns">
          <button className={`btn ${isDebuggerMode ? 'btn-primary' : ''}`} onClick={toggleDebuggerMode} title={isDebuggerMode ? "Exit Debugger Mode" : "Enter Debugger Mode"}>
            <Terminal size={20} />
          </button>
          <button className="btn" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} title={isSidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}>
            {isSidebarCollapsed ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
          </button>
          <button className="btn" onClick={() => setIsInversionMode(!isInversionMode)} title={isInversionMode ? "Hide Visual Inversions" : "Show Visual Inversions"}>
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
          <div className="canvas-area">
            {currentState.array.map((val, idx) => {
              const isPivot = (idx === currentState.compareIndex + 1 && currentState.isMoving);
              const isComparing = (idx === currentState.compareIndex);
              
              let statusClass = '';
              if (isPivot) statusClass = 'active';
              else if (isComparing) {
                const pivotValue = currentState.currentPivot;
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
                <button className="btn" onClick={nextStep} disabled={currentState.activeLine === 11}>
                  <ChevronRight size={24} />
                </button>
                <button className="btn" onClick={jumpToEnd} disabled={currentState.activeLine === 11} title="Jump to End">
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

        <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isDebuggerMode ? 'debugger-mode' : ''}`}>
          {isDebuggerMode && (
            <div className="panel flex-grow">
              <div className="panel-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Code2 size={16} />
                  <h3>Debugger Source Code</h3>
                </div>
              </div>
              <div className="panel-content" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="code-block">
                  {CODE_LINES.map((line, idx) => (
                    <div key={idx} className={`code-line ${currentState.activeLine === idx + 1 ? 'active' : ''}`}>
                      <span className="line-number">{idx + 1}</span>
                      {line}
                    </div>
                  ))}
                </div>
                <div className="vars-display">
                  <div className="var-item">
                    <span className="var-name">i</span>
                    <span className="var-val">{currentState.currentIndex < currentState.array.length ? currentState.currentIndex : '-'}</span>
                  </div>
                  <div className="var-item">
                    <span className="var-name">j</span>
                    <span className="var-val">{currentState.compareIndex !== currentState.currentIndex ? Math.max(-1, currentState.compareIndex) : '-'}</span>
                  </div>
                  <div className="var-item">
                    <span className="var-name">pivot</span>
                    <span className="var-val">{currentState.currentPivot ?? '-'}</span>
                  </div>
                  <div className="var-item">
                    <span className="var-name">arr[j]</span>
                    <span className="var-val">{currentState.compareIndex >= 0 ? currentState.array[currentState.compareIndex] : '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isDebuggerMode && (
            <>
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
                        <span className="metric-label">Total Inversions</span>
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
            </>
          )}
        </aside>
      </main>

      {/* All Inversions Matrix Overlay */}
      <AnimatePresence>
        {isAllInversionsOpen && (
          <div className="overlay">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="overlay-panel"
              style={{ width: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Grid3X3 className="primary-text" size={24} color="var(--primary)" />
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>ALL INVERSIONS</h2>
                </div>
                <button className="btn" onClick={() => setIsAllInversionsOpen(false)}><X size={24} /></button>
              </div>
              <div className="inversions-grid">
                {allInversionsMap.size > 0 ? (
                  Array.from(allInversionsMap.entries()).map(([i, invs]) => (
                    <div key={i} className="inversion-row">
                      <div className="inversion-row-header">
                        Index {i} <span style={{ color: 'var(--on-surface-variant)', fontWeight: 400 }}>(Val: {currentState.array[i]})</span>
                      </div>
                      <div className="inversion-tags">
                        {invs.map((inv: { idx: number; val: number }) => (
                          <span key={inv.idx} className="inversion-tag">
                            Idx {inv.idx} (Val: {inv.val})
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--on-surface-variant)', fontStyle: 'italic', background: 'var(--surface-low)', borderRadius: 'var(--radius-md)' }}>
                    No inversions found. The array is sorted!
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Configuration Overlay */}
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

      {/* Visual Inversions Overlay */}
      <AnimatePresence>
        {isInversionMode && (
          <div className="overlay">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="overlay-panel"
              style={{ width: '90vw', maxWidth: '1000px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Eye className="primary-text" size={24} color="var(--primary)" />
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>VISUAL INVERSIONS</h2>
                </div>
                <button className="btn" onClick={() => setIsInversionMode(false)}><X size={24} /></button>
              </div>
              <div style={{ flex: 1, position: 'relative', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
                  {allInversions.map(([i, j], idx) => {
                    const len = currentState.array.length;
                    const stepWidth = 100 / len;
                    const x1 = (i * stepWidth) + (stepWidth / 2);
                    const x2 = (j * stepWidth) + (stepWidth / 2);
                    
                    return (
                      <motion.path
                        key={`inv-overlay-${i}-${j}-${idx}`}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.6 }}
                        d={`M ${x1}% 60% Q ${(x1 + x2) / 2}% 0% ${x2}% 60%`}
                        stroke="rgba(239, 68, 68, 0.4)"
                        strokeWidth="2"
                        fill="none"
                      />
                    );
                  })}
                </svg>
                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', zIndex: 1, position: 'relative' }}>
                  {currentState.array.map((val, idx) => (
                    <div key={idx} style={{ 
                      flex: 1, 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      padding: '8px 0',
                      background: 'var(--surface-high)',
                      margin: '0 2px',
                      borderRadius: '4px',
                      border: '1px solid var(--outline)',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: 'var(--on-surface)'
                    }}>
                      {val}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 16, fontSize: '14px', color: 'var(--on-surface-variant)', textAlign: 'center' }}>
                Arcs denote values that are out of order (e.g. {allInversions.length > 0 ? `${currentState.array[allInversions[0][0]]} > ${currentState.array[allInversions[0][1]]}` : 'None'}). Total Inversions: {allInversions.length}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}