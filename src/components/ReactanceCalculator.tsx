import React, { useState } from 'react';
import { Cpu, Zap, CircleDot, GitMerge, Calculator } from 'lucide-react';
import { TOROID_CORES } from '../data/rfData';
import { dBmToSMeter } from '../utils/formatters';

interface ReactanceCalculatorProps {
  freqMHz: number;
  onFreqChange: (f: number) => void;
}

type SubTab = 'dbm' | 'lc' | 'toroid' | 'lnetwork';

export const ReactanceCalculator: React.FC<ReactanceCalculatorProps> = ({ freqMHz, onFreqChange }) => {
  const [subTab, setSubTab] = useState<SubTab>('dbm');

  // --- SubTab 1: dB / dBm / Watts / Voltage / S-Meter ---
  const [powerWatts, setPowerWatts] = useState<number>(100);
  const [systemImpedance, setSystemImpedance] = useState<number>(50);
  const [gainChangeDb, setGainChangeDb] = useState<number>(3.0);

  const safeWatts = Math.max(1e-18, powerWatts || 0);
  const safeZ = Math.max(0.1, systemImpedance || 50);
  const dBm = 10 * Math.log10(safeWatts * 1000);
  const dBW = 10 * Math.log10(safeWatts);
  const vRms = Math.sqrt(safeWatts * safeZ);
  const vPeak = vRms * Math.SQRT2;
  const vPeakToPeak = vPeak * 2;
  const iRmsAmps = Math.sqrt(safeWatts / safeZ);
  const sMeter = dBmToSMeter(dBm, freqMHz >= 30);

  const outputPowerAfterDbW = safeWatts * Math.pow(10, (gainChangeDb || 0) / 10);
  const voltageRatioFromDb = Math.pow(10, (gainChangeDb || 0) / 20);
  const powerRatioFromDb = Math.pow(10, (gainChangeDb || 0) / 10);

  const handleDbmChange = (newDbm: number) => {
    const w = Math.pow(10, (newDbm - 30) / 10);
    setPowerWatts(w);
  };

  const handleVRmsChange = (newVRms: number) => {
    const w = (newVRms * newVRms) / safeZ;
    setPowerWatts(w);
  };

  // --- SubTab 2: LC Resonance & Reactance ---
  const [lcSolveMode, setLcSolveMode] = useState<'freq' | 'ind' | 'cap'>('freq');
  const [inductanceUH, setInductanceUH] = useState<number>(2.5);
  const [capacitancePF, setCapacitancePF] = useState<number>(50);
  const [coilResistanceOhm, setCoilResistanceOhm] = useState<number>(1.5);

  const safeF = Math.max(0.001, freqMHz || 14.225);
  const fHz = safeF * 1e6;
  const lHenries = Math.max(1e-12, inductanceUH * 1e-6);
  const cFarads = Math.max(1e-15, capacitancePF * 1e-12);

  // Resonant frequency from L and C
  const resonantFreqMHz = 1 / (2 * Math.PI * Math.sqrt(lHenries * cFarads)) / 1e6;
  // Required L (uH) for target freqMHz and C (pF)
  const requiredLuH = (1 / (4 * Math.PI * Math.PI * fHz * fHz * cFarads)) * 1e6;
  // Required C (pF) for target freqMHz and L (uH)
  const requiredCpF = (1 / (4 * Math.PI * Math.PI * fHz * fHz * lHenries)) * 1e12;

  const activeFreqMHz = lcSolveMode === 'freq' ? resonantFreqMHz : safeF;
  const activeLHenries = lcSolveMode === 'ind' ? requiredLuH * 1e-6 : lHenries;
  const activeCFarads = lcSolveMode === 'cap' ? requiredCpF * 1e-12 : cFarads;

  const xL = 2 * Math.PI * (activeFreqMHz * 1e6) * activeLHenries;
  const xC = 1 / (2 * Math.PI * (activeFreqMHz * 1e6) * activeCFarads);
  const netReactance = xL - xC;
  const seriesImpedanceMag = Math.sqrt(coilResistanceOhm * coilResistanceOhm + netReactance * netReactance);
  const coilQ = xL / Math.max(0.01, coilResistanceOhm);
  const bandwidth3dBkHz = (activeFreqMHz * 1000) / Math.max(0.1, coilQ);

  // --- SubTab 3: Toroid & Air-Core Inductor Winding ---
  const [selectedCoreId, setSelectedCoreId] = useState<string>('t50-2');
  const [targetToroidLuH, setTargetToroidLuH] = useState<number>(2.2);
  // Air core (Wheeler's single-layer formula): L(uH) = (d^2 * n^2) / (18*d + 40*l) where d, l in inches
  const [airDiameterIn, setAirDiameterIn] = useState<number>(1.0);
  const [airLengthIn, setAirLengthIn] = useState<number>(1.5);
  const [airTurns, setAirTurns] = useState<number>(16);

  const selectedCore = TOROID_CORES.find((t) => t.id === selectedCoreId) || TOROID_CORES[1];
  // L(uH) = AL_per_100_turns_uH * (N / 100)^2  => N = 100 * sqrt(L_uH / AL_per_100_turns_uH)
  const exactTurns = 100 * Math.sqrt(Math.max(0, targetToroidLuH) / selectedCore.alPer100TurnsUH);
  const roundedTurns = Math.max(1, Math.round(exactTurns));
  const actualLuHAtRoundedTurns = selectedCore.alPer100TurnsUH * Math.pow(roundedTurns / 100, 2);
  const xLAtFreqForToroid = 2 * Math.PI * safeF * actualLuHAtRoundedTurns;

  const airCoreLuH =
    (airDiameterIn * airDiameterIn * airTurns * airTurns) /
    Math.max(0.01, 18 * airDiameterIn + 40 * airLengthIn);

  // --- SubTab 4: L-Network Impedance Matching ---
  const [rSource, setRSource] = useState<number>(50);
  const [rTarget, setRTarget] = useState<number>(200);

  const rLow = Math.min(Math.max(0.1, rSource), Math.max(0.1, rTarget));
  const rHigh = Math.max(Math.max(0.1, rSource), Math.max(0.1, rTarget));
  const lNetQ = Math.sqrt(Math.max(0, rHigh / rLow - 1));
  const xSeries = lNetQ * rLow;
  const xShunt = rHigh / Math.max(0.0001, lNetQ);

  // Low-pass L-network: Series L, Shunt C
  const lpSeriesLuH = xSeries / (2 * Math.PI * safeF);
  const lpShuntCpF = 1e6 / (2 * Math.PI * safeF * xShunt);
  // High-pass L-network: Series C, Shunt L
  const hpSeriesCpF = 1e6 / (2 * Math.PI * safeF * xSeries);
  const hpShuntLuH = xShunt / (2 * Math.PI * safeF);

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex flex-wrap gap-2 bg-slate-900/70 p-2 rounded-xl border border-slate-800">
        {[
          { id: 'dbm', label: 'dB / dBm / Watts / Voltage / S-Meter', icon: Zap },
          { id: 'lc', label: 'LC Resonance, Reactance & Q-Factor', icon: Cpu },
          { id: 'toroid', label: 'Toroid & Air-Core Coil Calculator', icon: CircleDot },
          { id: 'lnetwork', label: 'L-Network Impedance Matcher', icon: GitMerge },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setSubTab(item.id as SubTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                subTab === item.id
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-lg shadow-amber-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: dBm / Watts / Voltage / S-Meter */}
      {subTab === 'dbm' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-amber-400" />
              Bi-Directional RF Power & Voltage Converter
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Power in Watts (W)</label>
                <input
                  type="number"
                  step="any"
                  value={powerWatts}
                  onChange={(e) => setPowerWatts(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-amber-500/40 rounded-lg px-3 py-2 font-mono text-amber-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Power Level (dBm)</label>
                <input
                  type="number"
                  step="0.5"
                  value={Number(dBm.toFixed(2))}
                  onChange={(e) => handleDbmChange(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-cyan-500/40 rounded-lg px-3 py-2 font-mono text-cyan-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">RMS Voltage V_rms (Volts)</label>
                <input
                  type="number"
                  step="0.1"
                  value={Number(vRms.toFixed(4))}
                  onChange={(e) => handleVRmsChange(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-emerald-500/40 rounded-lg px-3 py-2 font-mono text-emerald-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">System Impedance Z₀ (Ω)</label>
                <input
                  type="number"
                  min="1"
                  value={systemImpedance}
                  onChange={(e) => setSystemImpedance(parseFloat(e.target.value) || 50)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-slate-200"
                />
              </div>
            </div>

            {/* Quick Power Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { label: 'S9 HF (-73 dBm)', w: Math.pow(10, (-73 - 30) / 10) },
                { label: '1 mW (0 dBm)', w: 0.001 },
                { label: '5W QRP', w: 5 },
                { label: '20W Portable', w: 20 },
                { label: '100W Barefoot', w: 100 },
                { label: '1500W Legal Limit', w: 1500 },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => setPowerWatts(p.w)}
                  className="text-xs font-mono px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Derived Electrical Readouts */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800 font-mono">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-[11px] text-slate-400">dBW (rel to 1W)</div>
                <div className="text-base font-bold text-slate-100 mt-0.5">{dBW.toFixed(2)} dBW</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-[11px] text-slate-400">Peak Voltage (V_pk)</div>
                <div className="text-base font-bold text-amber-300 mt-0.5">
                  {vPeak < 0.01 ? `${(vPeak * 1e6).toFixed(1)} µV` : `${vPeak.toFixed(2)} V`}
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-[11px] text-slate-400">Peak-to-Peak (V_pp)</div>
                <div className="text-base font-bold text-cyan-300 mt-0.5">
                  {vPeakToPeak < 0.01 ? `${(vPeakToPeak * 1e6).toFixed(1)} µV` : `${vPeakToPeak.toFixed(2)} V`}
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-[11px] text-slate-400">RMS Current (I_rms)</div>
                <div className="text-base font-bold text-emerald-400 mt-0.5">
                  {iRmsAmps < 0.01 ? `${(iRmsAmps * 1000).toFixed(2)} mA` : `${iRmsAmps.toFixed(2)} A`}
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 col-span-2">
                <div className="text-[11px] text-slate-400">
                  IARU S-Meter ({freqMHz >= 30 ? 'VHF S9 = -93 dBm' : 'HF S9 = -73 dBm'})
                </div>
                <div className="text-base font-bold text-amber-400 mt-0.5">{sMeter.label}</div>
              </div>
            </div>
          </div>

          {/* Relative dB Gain / Attenuation Calculator */}
          <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              Relative dB Gain / Loss & Amplifier Stage Calculator
            </h3>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Stage Gain or Loss (dB)</span>
                <span className="font-mono font-bold text-amber-400">
                  {gainChangeDb >= 0 ? `+${gainChangeDb.toFixed(1)}` : gainChangeDb.toFixed(1)} dB
                </span>
              </div>
              <input
                type="range"
                min="-30"
                max="30"
                step="0.5"
                value={gainChangeDb}
                onChange={(e) => setGainChangeDb(parseFloat(e.target.value))}
                className="w-full accent-amber-500"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[-20, -10, -6, -3, -1, 3, 6, 10, 13, 20].map((val) => (
                  <button
                    key={val}
                    onClick={() => setGainChangeDb(val)}
                    className="text-xs font-mono px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
                  >
                    {val > 0 ? `+${val}` : val} dB
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-mono">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Power Multiplier</div>
                <div className="text-xl font-bold text-amber-400 mt-1">{powerRatioFromDb.toFixed(3)}×</div>
                <div className="text-[11px] text-slate-500">10^(dB / 10)</div>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Voltage Multiplier</div>
                <div className="text-xl font-bold text-cyan-400 mt-1">{voltageRatioFromDb.toFixed(3)}×</div>
                <div className="text-[11px] text-slate-500">10^(dB / 20)</div>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-500/30">
                <div className="text-xs text-slate-400">Resulting Output Power</div>
                <div className="text-xl font-bold text-emerald-400 mt-1">
                  {outputPowerAfterDbW >= 1
                    ? `${outputPowerAfterDbW.toFixed(2)} W`
                    : `${(outputPowerAfterDbW * 1000).toFixed(2)} mW`}
                </div>
                <div className="text-[11px] text-slate-500">{(dBm + gainChangeDb).toFixed(2)} dBm</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LC Resonance & Reactance */}
      {subTab === 'lc' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                LC Tank & Reactance Solver
              </h3>
              <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                {[
                  { id: 'freq', label: 'Find f₀' },
                  { id: 'ind', label: 'Find L' },
                  { id: 'cap', label: 'Find C' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setLcSolveMode(m.id as 'freq' | 'ind' | 'cap')}
                    className={`px-2.5 py-1 rounded font-medium ${
                      lcSolveMode === m.id ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {lcSolveMode !== 'freq' && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Target Frequency f₀ (MHz)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={freqMHz}
                    onChange={(e) => onFreqChange(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-amber-500/40 rounded-lg px-3 py-2 font-mono text-amber-400 font-bold"
                  />
                </div>
              )}

              {lcSolveMode !== 'ind' && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Inductance L (µH)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.001"
                    value={inductanceUH}
                    onChange={(e) => setInductanceUH(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-cyan-500/40 rounded-lg px-3 py-2 font-mono text-cyan-400 font-bold"
                  />
                </div>
              )}

              {lcSolveMode !== 'cap' && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Capacitance C (pF)</label>
                  <input
                    type="number"
                    step="1"
                    min="0.1"
                    value={capacitancePF}
                    onChange={(e) => setCapacitancePF(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-emerald-500/40 rounded-lg px-3 py-2 font-mono text-emerald-400 font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 mb-1">Coil ESR / Series R (Ω)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.01"
                  value={coilResistanceOhm}
                  onChange={(e) => setCoilResistanceOhm(parseFloat(e.target.value) || 0.1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-slate-200"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-400">
              Solved Resonance & Reactance Values
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-amber-500/40">
                <div className="text-xs text-slate-400">
                  {lcSolveMode === 'freq'
                    ? 'Resonant Freq f₀'
                    : lcSolveMode === 'ind'
                    ? 'Required Inductance L'
                    : 'Required Capacitance C'}
                </div>
                <div className="text-xl font-bold text-amber-400 mt-1">
                  {lcSolveMode === 'freq' && `${resonantFreqMHz.toFixed(4)} MHz`}
                  {lcSolveMode === 'ind' && `${requiredLuH.toFixed(3)} µH`}
                  {lcSolveMode === 'cap' && `${requiredCpF.toFixed(2)} pF`}
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Inductive Reactance X_L</div>
                <div className="text-xl font-bold text-cyan-400 mt-1">{xL.toFixed(1)} Ω</div>
                <div className="text-[11px] text-slate-500">2π·f·L</div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Capacitive Reactance X_C</div>
                <div className="text-xl font-bold text-emerald-400 mt-1">{xC.toFixed(1)} Ω</div>
                <div className="text-[11px] text-slate-500">1 / (2π·f·C)</div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Quality Factor (Q)</div>
                <div className="text-lg font-bold text-slate-100 mt-1">{coilQ.toFixed(1)}</div>
                <div className="text-[11px] text-slate-500">Q = X_L / R_esr</div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">-3 dB Bandwidth</div>
                <div className="text-lg font-bold text-amber-300 mt-1">{bandwidth3dBkHz.toFixed(1)} kHz</div>
                <div className="text-[11px] text-slate-500">BW = f₀ / Q</div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Series |Z| at {activeFreqMHz.toFixed(2)}MHz</div>
                <div className="text-lg font-bold text-slate-100 mt-1">{seriesImpedanceMag.toFixed(2)} Ω</div>
                <div className="text-[11px] text-slate-500">√(R² + (X_L - X_C)²)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Toroid & Air-Core Coil Calculator */}
      {subTab === 'toroid' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Toroid Core Winding */}
          <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-400">
              Toroid Core Turns & Inductance Calculator
            </h3>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Select Amidon / Fair-Rite Toroid Core</label>
              <select
                value={selectedCoreId}
                onChange={(e) => setSelectedCoreId(e.target.value)}
                className="w-full bg-slate-950 border border-amber-500/40 rounded-lg px-3 py-2 text-sm text-slate-100"
              >
                {TOROID_CORES.map((core) => (
                  <option key={core.id} value={core.id}>
                    {core.name} ({core.material} — {core.color}) — A_L: {core.alPer100TurnsUH} µH/100t
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1.5 bg-slate-950 p-2 rounded border border-slate-800">
                {selectedCore.notes} • Optimal Range: {selectedCore.freqRange} • OD: {selectedCore.odInch}"
              </p>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Target Inductance L (µH)</label>
              <input
                type="number"
                step="0.1"
                min="0.01"
                value={targetToroidLuH}
                onChange={(e) => setTargetToroidLuH(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-amber-400 font-bold"
              />
            </div>

            <div className="grid grid-cols-3 gap-3 font-mono">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-500/40">
                <div className="text-xs text-slate-400">Recommended Turns</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">{roundedTurns} turns</div>
                <div className="text-[11px] text-slate-500">Exact: {exactTurns.toFixed(2)}</div>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Actual L ({roundedTurns}t)</div>
                <div className="text-xl font-bold text-amber-400 mt-1">{actualLuHAtRoundedTurns.toFixed(2)} µH</div>
                <div className="text-[11px] text-slate-500">A_L × (N/100)²</div>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Reactance at {safeF}MHz</div>
                <div className="text-xl font-bold text-cyan-400 mt-1">{xLAtFreqForToroid.toFixed(0)} Ω</div>
                <div className="text-[11px] text-slate-500">X_L = 2πfL</div>
              </div>
            </div>
          </div>

          {/* Wheeler Air-Core Solenoid Calculator */}
          <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
              Single-Layer Air-Core Solenoid (Wheeler Formula)
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Coil Diameter d (in)</label>
                <input
                  type="number"
                  step="0.125"
                  min="0.1"
                  value={airDiameterIn}
                  onChange={(e) => setAirDiameterIn(parseFloat(e.target.value) || 0.1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Coil Length l (in)</label>
                <input
                  type="number"
                  step="0.125"
                  min="0.1"
                  value={airLengthIn}
                  onChange={(e) => setAirLengthIn(parseFloat(e.target.value) || 0.1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Number of Turns N</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={airTurns}
                  onChange={(e) => setAirTurns(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-amber-400 font-bold"
                />
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/30 flex items-center justify-between font-mono">
              <div>
                <div className="text-xs text-slate-400">Calculated Air-Core Inductance</div>
                <div className="text-[11px] text-slate-500 mt-0.5">L(µH) = (d² · N²) / (18d + 40l)</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-cyan-400">{airCoreLuH.toFixed(2)} µH</div>
                <div className="text-xs text-slate-400">
                  X_L = {(2 * Math.PI * safeF * airCoreLuH).toFixed(1)} Ω @ {safeF} MHz
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: L-Network Impedance Matching */}
      {subTab === 'lnetwork' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              L-Network Impedance Matching Parameters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Frequency (MHz)</label>
                <input
                  type="number"
                  step="0.1"
                  value={freqMHz}
                  onChange={(e) => onFreqChange(parseFloat(e.target.value) || 14.225)}
                  className="w-full bg-slate-950 border border-amber-500/40 rounded-lg px-3 py-2 font-mono text-amber-400 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Source R_s (Ω)</label>
                <input
                  type="number"
                  min="1"
                  value={rSource}
                  onChange={(e) => setRSource(parseFloat(e.target.value) || 50)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Load R_L (Ω)</label>
                <input
                  type="number"
                  min="1"
                  value={rTarget}
                  onChange={(e) => setRTarget(parseFloat(e.target.value) || 200)}
                  className="w-full bg-slate-950 border border-cyan-500/40 rounded-lg px-3 py-2 font-mono text-cyan-400 font-bold"
                />
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs space-y-1">
              <div className="text-slate-300">
                Network Transformation Q = √(R_high / R_low - 1) ={' '}
                <span className="text-amber-400 font-bold">{lNetQ.toFixed(3)}</span>
              </div>
              <div className="text-slate-400">
                Series Reactance |X_ser| = <span className="text-cyan-400">{xSeries.toFixed(1)} Ω</span> (on {rLow}Ω side)
              </div>
              <div className="text-slate-400">
                Shunt Reactance |X_shunt| = <span className="text-emerald-400">{xShunt.toFixed(1)} Ω</span> (across {rHigh}Ω side)
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Low-Pass Topology */}
            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">
                  Low-Pass L-Network
                </h4>
                <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded">
                  Attenuates Harmonics
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Series Inductor L on {rLow}Ω side + Shunt Capacitor C across {rHigh}Ω side:
              </p>
              <div className="space-y-2 font-mono">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between">
                  <span className="text-xs text-slate-400">Series Inductor L</span>
                  <span className="text-base font-bold text-amber-400">{lpSeriesLuH.toFixed(2)} µH</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between">
                  <span className="text-xs text-slate-400">Shunt Capacitor C</span>
                  <span className="text-base font-bold text-cyan-400">{lpShuntCpF.toFixed(1)} pF</span>
                </div>
              </div>
            </div>

            {/* High-Pass Topology */}
            <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">
                  High-Pass L-Network
                </h4>
                <span className="text-[10px] font-mono bg-cyan-500/15 text-cyan-300 px-2 py-0.5 rounded">
                  DC Static Drain
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Series Capacitor C on {rLow}Ω side + Shunt Inductor L across {rHigh}Ω side:
              </p>
              <div className="space-y-2 font-mono">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between">
                  <span className="text-xs text-slate-400">Series Capacitor C</span>
                  <span className="text-base font-bold text-cyan-400">{hpSeriesCpF.toFixed(1)} pF</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between">
                  <span className="text-xs text-slate-400">Shunt Inductor L</span>
                  <span className="text-base font-bold text-amber-400">{hpShuntLuH.toFixed(2)} µH</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
