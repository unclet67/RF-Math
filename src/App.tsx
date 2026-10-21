import React, { useState, useEffect } from 'react';
import {
  Radio,
  Gauge,
  Cable,
  Cpu,
  RadioTower,
  ShieldAlert,
  Clock,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { HAM_BANDS, HamBand } from './data/rfData';
import { AntennaCalculator } from './components/AntennaCalculator';
import { SwrCalculator } from './components/SwrCalculator';
import { CoaxCalculator } from './components/CoaxCalculator';
import { ReactanceCalculator } from './components/ReactanceCalculator';
import { LinkBudgetCalculator } from './components/LinkBudgetCalculator';
import { RfSafetyCalculator } from './components/RfSafetyCalculator';

type ActiveModule = 'antenna' | 'swr' | 'coax' | 'reactance' | 'link' | 'safety';

export function App() {
  const [activeModule, setActiveModule] = useState<ActiveModule>('antenna');
  const [freqMHz, setFreqMHz] = useState<number>(14.225);
  const [utcTime, setUtcTime] = useState<string>('');
  const [showFormulas, setShowFormulas] = useState<boolean>(false);

  // Live UTC Clock for the Radio Shack Header
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const iso = now.toISOString();
      setUtcTime(`${iso.slice(11, 19)} UTC`);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Identify active amateur band if frequency falls inside or near one
  const currentBand: HamBand | undefined = HAM_BANDS.find(
    (b) => freqMHz >= b.minMHz && freqMHz <= b.maxMHz
  );

  const navItems: {
    id: ActiveModule;
    label: string;
    shortLabel: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { id: 'antenna', label: 'Antenna & Wavelength', shortLabel: 'Antennas', icon: Radio },
    { id: 'swr', label: 'SWR, Return Loss & Z', shortLabel: 'SWR / Z', icon: Gauge },
    { id: 'coax', label: 'Coax & Feedline Loss', shortLabel: 'Coax Loss', icon: Cable },
    { id: 'reactance', label: 'dBm, LC, Toroids & Match', shortLabel: 'dB / LC / Toroid', icon: Cpu },
    { id: 'link', label: 'Link Budget & Horizon', shortLabel: 'Link Budget', icon: RadioTower },
    { id: 'safety', label: 'FCC RF Safety (OET-65)', shortLabel: 'RF Safety', icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      {/* Top Transceiver-Style Shack Header */}
      <header className="border-b border-slate-800/90 bg-[#0b101b]/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Brand & Callsign Style Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white font-mono">
                  SHACK<span className="text-amber-400">MATH</span>
                </h1>
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  HAM RF Workbench
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Precision Amateur Radio Antenna, Transmission Line, Reactance & Propagation Suite
              </p>
            </div>
          </div>

          {/* Center VFO Readout & Quick Mode Buttons */}
          <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span>VFO A FREQUENCY</span>
                {currentBand ? (
                  <span className="text-emerald-400 font-bold">[{currentBand.name} Band]</span>
                ) : (
                  <span className="text-amber-400">[General Coverage]</span>
                )}
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <input
                  type="number"
                  step="0.005"
                  min="0.1"
                  max="30000"
                  value={freqMHz}
                  onChange={(e) => setFreqMHz(parseFloat(e.target.value) || 0)}
                  className="w-28 bg-transparent font-mono text-xl font-bold text-amber-400 focus:outline-none border-b border-transparent focus:border-amber-400"
                />
                <span className="text-xs font-mono text-slate-400">MHz</span>
              </div>
            </div>

            {currentBand && (
              <div className="hidden md:flex flex-col gap-1 pl-3 border-l border-slate-800">
                <div className="flex gap-1">
                  <button
                    onClick={() => setFreqMHz(currentBand.cwMHz)}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800"
                  >
                    CW {currentBand.cwMHz}
                  </button>
                  {currentBand.ft8MHz && (
                    <button
                      onClick={() => setFreqMHz(currentBand.ft8MHz!)}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-slate-800"
                    >
                      FT8 {currentBand.ft8MHz}
                    </button>
                  )}
                  <button
                    onClick={() => setFreqMHz(currentBand.ssbMHz)}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800"
                  >
                    Voice {currentBand.ssbMHz}
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 truncate max-w-[210px]">
                  {currentBand.notes}
                </span>
              </div>
            )}
          </div>

          {/* Right: UTC Clock & Formula Reference Toggle */}
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl font-mono text-xs text-cyan-400">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{utcTime}</span>
            </div>

            <button
              onClick={() => setShowFormulas(!showFormulas)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                showFormulas
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>RF Formulas</span>
            </button>
          </div>
        </div>

        {/* Quick-Select Amateur Band Bar (160m to 23cm) */}
        <div className="border-t border-slate-800/70 bg-slate-950/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 shrink-0 mr-1">
              BANDS:
            </span>
            {HAM_BANDS.map((band) => {
              const isSelected = currentBand?.id === band.id;
              return (
                <button
                  key={band.id}
                  onClick={() => setFreqMHz(band.defaultMHz)}
                  className={`px-2.5 py-1 rounded text-xs font-mono shrink-0 transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                  }`}
                >
                  {band.id}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 space-y-6">
        {/* Module Navigation Bar */}
        <nav className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                  active
                    ? 'bg-gradient-to-br from-amber-500/20 to-cyan-500/10 border-amber-500/50 text-white shadow-lg shadow-amber-500/5'
                    : 'bg-slate-900/75 border-slate-800/90 text-slate-400 hover:bg-slate-900 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    active ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">{item.shortLabel}</div>
                  <div className="text-[10px] text-slate-500 truncate hidden xl:block">{item.label}</div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Optional Collapsible RF Engineering Formula Cheat Sheet */}
        {showFormulas && (
          <div className="bg-slate-900/95 border border-amber-500/30 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Core Amateur Radio & RF Engineering Equations
              </h2>
              <button
                onClick={() => setShowFormulas(false)}
                className="text-xs text-slate-400 hover:text-white font-mono"
              >
                [Close ×]
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="text-amber-300 font-bold">Antennas & Wavelength</div>
                <div className="text-slate-300">λ(m) = 299.792 / f(MHz)</div>
                <div className="text-slate-300">1/2λ Dipole (ft) = 468 / f(MHz)</div>
                <div className="text-slate-300">1/4λ Vertical (ft) = 234 / f(MHz)</div>
                <div className="text-slate-300">1λ Loop (ft) = 1005 / f(MHz)</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="text-cyan-300 font-bold">SWR, Reflection & Coax</div>
                <div className="text-slate-300">|Γ| = (VSWR - 1) / (VSWR + 1)</div>
                <div className="text-slate-300">Return Loss (dB) = -20·log₁₀(|Γ|)</div>
                <div className="text-slate-300">Mismatch Loss = -10·log₁₀(1 - |Γ|²)</div>
                <div className="text-slate-300">Coax Loss = k₁·√f + k₂·f (dB/100ft)</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="text-emerald-300 font-bold">Resonance, Path & Safety</div>
                <div className="text-slate-300">f₀ = 1 / (2π·√(L·C))</div>
                <div className="text-slate-300">FSPL(dB) = 20log₁₀(d_km) + 20log₁₀(f_MHz) + 32.44</div>
                <div className="text-slate-300">Horizon(mi) = √(2·h₁_ft) + √(2·h₂_ft)</div>
                <div className="text-slate-300">S_mpe = (2.56 · EIRP) / (4π · R²)</div>
              </div>
            </div>
          </div>
        )}

        {/* Active Calculator View */}
        <section>
          {activeModule === 'antenna' && (
            <AntennaCalculator freqMHz={freqMHz} onFreqChange={setFreqMHz} />
          )}
          {activeModule === 'swr' && <SwrCalculator />}
          {activeModule === 'coax' && (
            <CoaxCalculator freqMHz={freqMHz} onFreqChange={setFreqMHz} />
          )}
          {activeModule === 'reactance' && (
            <ReactanceCalculator freqMHz={freqMHz} onFreqChange={setFreqMHz} />
          )}
          {activeModule === 'link' && (
            <LinkBudgetCalculator freqMHz={freqMHz} onFreqChange={setFreqMHz} />
          )}
          {activeModule === 'safety' && (
            <RfSafetyCalculator freqMHz={freqMHz} onFreqChange={setFreqMHz} />
          )}
        </section>
      </main>

      {/* Shack Footer */}
      <footer className="border-t border-slate-800/80 bg-[#070a12] py-4 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 font-mono">
          <div>SHACKMATH // 73 DE AMATEUR RADIO RF WORKBENCH</div>
          <div>IMPERIAL (FT/IN) + METRIC (M/CM) • ARRL & FCC OET-65 COMPLIANT</div>
        </div>
      </footer>
    </div>
  );
}

export default App;
