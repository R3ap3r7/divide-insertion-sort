import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type SortState = {
  array: number[];
  currentIndex: number;
  compareIndex: number;
  sortedUntil: number;
  isMoving: boolean;
  stepDescription: string;
  comparisons: number;
  shifts: number;
  inversions: number;
};

const INITIAL_SIZE = 20;

export default function App() {
  const [array, setArray] = useState<number[]>([]);
  const [history, setHistory] = useState<SortState[]>([]);
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(500);
  const [customInput, setCustomInput] = useState('');
  const [arraySize, setArraySize] = useState(INITIAL_SIZE);
  
  // UI States
  const [isMetricsOpen, setIsMetricsOpen] = useState(true);
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);

  const timerRef = useRef<number | null>(null);

  const generateRandomArray = useCallback((size: number) => {
    const newArray = Array.from({ length: size }, () => Math.floor(Math.random() * 90) + 10);
    resetWithArray(newArray);
  }, []);

  const resetWithArray = (newArray: number[]) => {
    const initialState: SortState = {
      array: [...newArray],
      currentIndex: 1,
      compareIndex: 1,
      sortedUntil: 0,
      isMoving: false,
      stepDescription: 'Ready to start sorting.',
      comparisons: 0,
      shifts: 0,
      inversions: countInversions(newArray),
    };
    setArray(newArray);
    setHistory([initialState]);
    setStep(0);
    setIsPlaying(false);
  };

  const countInversions = (arr: number[]) => {
    let count = 0;
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        if (arr[i] > arr[j]) count++;
      }
    }
    return count;
  };

  useEffect(() => {
    generateRandomArray(INITIAL_SIZE);
  }, [generateRandomArray]);

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

  const calculateNextState = (state: SortState): SortState | null => {
    const { array, currentIndex, compareIndex, comparisons, shifts } = state;
    const newArray = [...array];
    
    // Finished sorting
    if (currentIndex >= array.length) return null;

    // Insertion Sort Logic Step-by-Step
    
    // Case 1: We are about to start a new element insertion
    if (compareIndex === currentIndex) {
       return {
         ...state,
         compareIndex: currentIndex - 1,
         isMoving: true,
         stepDescription: `Picking up ${array[currentIndex]} at index ${currentIndex}.`,
       };
    }

    // Case 2: Comparing and shifting
    if (compareIndex >= 0 && newArray[compareIndex] > newArray[compareIndex + 1]) {
      const temp = newArray[compareIndex];
      newArray[compareIndex] = newArray[compareIndex + 1];
      newArray[compareIndex + 1] = temp;
      
      return {
        ...state,
        array: newArray,
        compareIndex: compareIndex - 1,
        comparisons: comparisons + 1,
        shifts: shifts + 1,
        inversions: countInversions(newArray),
        stepDescription: `Comparing ${newArray[compareIndex + 1]} with ${newArray[compareIndex]}. Since ${newArray[compareIndex + 1]} < ${newArray[compareIndex]}, we shift.`,
      };
    } else {
      // Case 3: Found the correct position or reached the start
      return {
        ...state,
        currentIndex: currentIndex + 1,
        compareIndex: currentIndex + 1,
        sortedUntil: currentIndex,
        isMoving: false,
        comparisons: compareIndex >= 0 ? comparisons + 1 : comparisons,
        stepDescription: `Placed element in its correct position. Next element is ${array[currentIndex + 1] || 'none'}.`,
      };
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        const hasNext = nextStep();
        if (!hasNext) setIsPlaying(false);
      }, 1000 - speed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, nextStep]);

  const currentState = history[step] || history[0];

  if (!currentState) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ opacity: 0.5 }}>Loading Playground...</h2>
      </div>
    );
  }

  const handleCustomInput = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = customInput.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    if (parsed.length > 0) {
      resetWithArray(parsed);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>divide<span>.</span></h1>
        <div className="playback-btns">
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
          <div className="canvas-area">
            {currentState.array.map((val, idx) => {
              const isActive = (idx === currentState.compareIndex + 1 && currentState.isMoving);
              const isComparing = (idx === currentState.compareIndex);
              const isSorted = idx <= currentState.sortedUntil && !isActive && !isComparing;
              
              return (
                <motion.div
                  key={`${idx}-${val}`}
                  layout
                  className={`bar ${isActive ? 'active' : ''} ${isComparing ? 'comparing' : ''} ${isSorted ? 'sorted' : ''}`}
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

            <div className="speed-control">
              <span className="metric-label">Speed</span>
              <input 
                type="range" 
                min="0" 
                max="950" 
                step="50" 
                value={speed} 
                onChange={(e) => setSpeed(parseInt(e.target.value))} 
              />
            </div>

            <div className="metric-item" style={{ gap: '12px' }}>
              <span className="metric-label">Step</span>
              <span className="metric-value">{step}</span>
            </div>
          </div>
        </section>

        <aside className="sidebar">
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
                  <div className="metric-item">
                    <span className="metric-label">Time Complexity</span>
                    <span className="metric-value">O(n²)</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Configuration Panel */}
          <div className="panel">
            <div className="panel-header" onClick={() => setIsConfigOpen(!isConfigOpen)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Settings size={16} />
                <h3>Configuration</h3>
              </div>
              {isConfigOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            <AnimatePresence>
              {isConfigOpen && (
                <motion.div 
                  initial={{ height: 0 }} 
                  animate={{ height: 'auto' }} 
                  exit={{ height: 0 }}
                  className="panel-content"
                >
                  <div className="input-group">
                    <label>Array Size</label>
                    <input 
                      type="range" 
                      min="5" 
                      max="50" 
                      value={arraySize} 
                      onChange={(e) => {
                        const s = parseInt(e.target.value);
                        setArraySize(s);
                        generateRandomArray(s);
                      }} 
                    />
                  </div>
                  <form className="input-group" onSubmit={handleCustomInput}>
                    <label>Custom Input (comma-separated)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 10, 5, 8, 12" 
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>Apply</button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Step Details Panel */}
          <div className="panel">
            <div className="panel-header" onClick={() => setIsDetailsOpen(!isDetailsOpen)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Info size={16} />
                <h3>Live Explanation</h3>
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>
      </main>
    </div>
  );
}
