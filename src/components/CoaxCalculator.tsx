import React, { useState } from 'react';
import { Cable, Flame, Zap, ArrowRight, Layers } from 'lucide-react';
import { COAX_CABLES, calculateCableLossPer100Ft } from '../data/rfData';
import { formatFeetAndInches, formatMetricLength } from '../utils/formatters';

interface CoaxCalculatorProps {
  freqMHz: number;
  onFreqChange: (f: number) => void;
}

export const CoaxCalculator: React.FC<CoaxCalculatorProps> = ({ freqMHz, onFreqChange }) => {
  const [selectedCableId, setSelectedCableId] = useState<string>('lmr400');
  const [lengthFeet, setLengthFeet] = useState<number>(100);
  const [txPowerWatts, setTxPowerWatts] = useState<number>(100);
  const [loadSwr, setLoadSwr] = useState<number>(1.5);

  const safeFreq = Math.max(0.1, freqMHz || 14.225);
  const selectedCable = COAX_CABLES.find((c) => c.id === selectedCableId) || COAX_CABLES[6];

  // Matched Loss Calculation
  const lossPer100Ft = calculateCableLossPer100Ft(selectedCable, safeFreq);
  const matchedLossDb = (lossPer100Ft * Math.max(0, lengthFeet)) / 100;

  // Additional Loss due to SWR at the antenna load
  // Exact transmission line equation:
  // a = 10^(A_m / 10), |Gamma_L| = (SWR - 1)/(SWR + 1)
  // Total Loss (dB) = -10 * log10( (1 - |Gamma_L|^2) / (a - |Gamma_L|^2 / a) )
  const clampedSwr = Math.max(1.0, loadSwr || 1.0);
  const gammaLoad = (clampedSwr - 1) / (clampedSwr + 1);
  const gammaLoadSq = gammaLoad * gammaLoad;
  const aFactor = Math.pow(10, matchedLossDb / 10);

  const totalLossRatio = (aFactor - gammaLoadSq / aFactor) / Math.max(0.0001, 1 - gammaLoadSq);
  const totalLossDb = 10 * Math.log10(Math.max(1.0, totalLossRatio));
  const swrExtraLossDb = Math.max(0, totalLossDb - matchedLossDb);

  // SWR seen at the transmitter (attenuated reflection coefficient)
  // |Gamma_in| = |Gamma_L| * 10^(-matchedLossDb / 10)
  const gammaShack = gammaLoad * Math.pow(10, -matchedLossDb / 10);
  const swrAtShack = (1 + gammaShack) / Math.max(0.001, 1 - gammaShack);

  // Power delivered vs lost as heat
  const efficiencyFrac = Math.pow(10, -totalLossDb / 10);
  const powerAtAntennaW = txPowerWatts * efficiencyFrac;
  const powerLostInCoaxW = txPowerWatts - powerAtAntennaW;

  // Electrical Length & Stubs considering cable Velocity Factor (VF)
  const lambdaFreeSpaceFt = 983.571056 / safeFreq;
  const lambdaInCoaxFt = lambdaFreeSpaceFt * selectedCable.vf;
  const electricalWavelengths = lengthFeet / lambdaInCoaxFt;
  const quarterWaveStubFt = lambdaInCoaxFt / 4;
  const halfWaveRepeatFt = lambdaInCoaxFt / 2;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Feedline Configuration */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Cable className="w-4 h-4 text-amber-400" />
            Feedline & System Configuration
          </h3>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Select Coax / Balanced Transmission Line</label>
            <select
              value={selectedCableId}
              onChange={(e) => setSelectedCableId(e.target.value)}
              className="w-full bg-slate-950 border border-amber-500/40 rounded-lg px-3 py-2 text-sm font-medium text-slate-100 focus:border-amber-400 focus:outline-none"
            >
              {COAX_CABLES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.z0}Ω (VF {c.vf})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1.5 bg-slate-950/70 p-2 rounded border border-slate-800">
              {selectedCable.notes} • Ø {selectedCable.diameterIn}" • {selectedCable.jacket}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Frequency (MHz)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={freqMHz}
                onChange={(e) => onFreqChange(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-amber-400 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Cable Run Length ({(lengthFeet * 0.3048).toFixed(1)} m)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={lengthFeet}
                  onChange={(e) => setLengthFeet(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-slate-100 font-bold"
                />
                <span className="text-xs font-mono text-slate-400">ft</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">TX Power Input (Watts)</label>
              <input
                type="number"
                min="0.1"
                max="10000"
                value={txPowerWatts}
                onChange={(e) => setTxPowerWatts(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-emerald-400 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Antenna Feedpoint SWR</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="1.0"
                  max="30.0"
                  step="0.1"
                  value={loadSwr}
                  onChange={(e) => setLoadSwr(Math.max(1.0, parseFloat(e.target.value) || 1.0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-cyan-400 font-bold"
                />
                <span className="text-xs font-mono text-slate-400">:1</span>
              </div>
            </div>
          </div>

          {/* Quarter-Wave & Half-Wave Coax Stubs */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Coax Stub & Electrical Length (VF = {selectedCable.vf})
            </div>
            <div className="grid grid-cols-2 gap-2.5 font-mono">
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5">
                <div className="text-[10px] text-slate-400">1/4λ Stub / Q-Section</div>
                <div className="text-sm font-bold text-amber-400">{formatFeetAndInches(quarterWaveStubFt)}</div>
                <div className="text-[11px] text-cyan-400">{formatMetricLength(quarterWaveStubFt * 0.3048)}</div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5">
                <div className="text-[10px] text-slate-400">1/2λ Impedance Repeater</div>
                <div className="text-sm font-bold text-amber-400">{formatFeetAndInches(halfWaveRepeatFt)}</div>
                <div className="text-[11px] text-cyan-400">{formatMetricLength(halfWaveRepeatFt * 0.3048)}</div>
              </div>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Current {lengthFeet} ft run is <span className="text-slate-200 font-bold">{electricalWavelengths.toFixed(2)} λ</span> ({((electricalWavelengths * 360) % 360).toFixed(0)}° electrical phase) inside {selectedCable.name}.
            </div>
          </div>
        </div>

        {/* Right: Visual Power Flow & Attenuation Results */}
        <div className="lg:col-span-7 space-y-5">
          {/* End-to-End Power Flow Diagram */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Shack-to-Antenna RF Power & SWR Masking Flow
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              {/* Transmitter Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                <div className="text-[11px] uppercase text-slate-400">1. Shack Transmitter</div>
                <div className="text-xl font-mono font-bold text-slate-100 mt-1">{txPowerWatts.toFixed(1)} W</div>
                <div className="text-xs font-mono text-cyan-400 mt-1">
                  Shack SWR: {swrAtShack.toFixed(2)}:1
                </div>
              </div>

              {/* Feedline Loss Box */}
              <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-3.5 relative">
                <div className="text-[11px] uppercase text-amber-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  2. Feedline Loss
                </div>
                <div className="text-xl font-mono font-bold text-rose-400 mt-1">
                  -{totalLossDb.toFixed(2)} dB
                </div>
                <div className="text-xs font-mono text-slate-400 mt-1">
                  -{powerLostInCoaxW.toFixed(1)} W dissipated as heat
                </div>
              </div>

              {/* Antenna Radiation Box */}
              <div className="bg-slate-950 border border-emerald-500/40 rounded-xl p-3.5">
                <div className="text-[11px] uppercase text-emerald-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  3. Antenna Radiated
                </div>
                <div className="text-xl font-mono font-bold text-emerald-400 mt-1">
                  {powerAtAntennaW.toFixed(1)} W
                </div>
                <div className="text-xs font-mono text-slate-300 mt-1">
                  {(efficiencyFrac * 100).toFixed(1)}% Efficiency (Load {clampedSwr.toFixed(1)}:1)
                </div>
              </div>
            </div>

            {/* Loss Breakdown Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800 font-mono">
              <div>
                <div className="text-[11px] text-slate-400">Attenuation / 100ft</div>
                <div className="text-sm font-bold text-slate-200">{lossPer100Ft.toFixed(2)} dB</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Matched Loss</div>
                <div className="text-sm font-bold text-amber-400">{matchedLossDb.toFixed(2)} dB</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Extra SWR Loss</div>
                <div className="text-sm font-bold text-rose-400">+{swrExtraLossDb.toFixed(2)} dB</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Total Line Loss</div>
                <div className="text-sm font-bold text-cyan-400">{totalLossDb.toFixed(2)} dB</div>
              </div>
            </div>
          </div>

          {/* Side-by-Side Feedline Comparison Table at Current Settings */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                All Feedlines Compared at {safeFreq} MHz ({lengthFeet} ft, SWR {clampedSwr}:1, {txPowerWatts}W)
              </h4>
            </div>
            <div className="overflow-x-auto max-h-[260px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead className="sticky top-0 bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-2.5">Cable Type</th>
                    <th className="py-2 px-2 text-right">dB/100ft</th>
                    <th className="py-2 px-2 text-right">Total Loss</th>
                    <th className="py-2 px-2 text-right">P_out (W)</th>
                    <th className="py-2 px-2.5 text-right">Efficiency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {COAX_CABLES.map((cable) => {
                    const cLoss100 = calculateCableLossPer100Ft(cable, safeFreq);
                    const cMatched = (cLoss100 * lengthFeet) / 100;
                    const cAFactor = Math.pow(10, cMatched / 10);
                    const cTotalRatio = (cAFactor - gammaLoadSq / cAFactor) / Math.max(0.0001, 1 - gammaLoadSq);
                    const cTotalDb = 10 * Math.log10(Math.max(1.0, cTotalRatio));
                    const cEff = Math.pow(10, -cTotalDb / 10);
                    const cWatts = txPowerWatts * cEff;
                    const isSelected = cable.id === selectedCableId;

                    return (
                      <tr
                        key={cable.id}
                        onClick={() => setSelectedCableId(cable.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-amber-500/15 text-amber-300 font-bold' : 'hover:bg-slate-800/60 text-slate-300'
                        }`}
                      >
                        <td className="py-2 px-2.5">{cable.name}</td>
                        <td className="py-2 px-2 text-right">{cLoss100.toFixed(2)}</td>
                        <td className="py-2 px-2 text-right text-rose-400">-{cTotalDb.toFixed(2)} dB</td>
                        <td className="py-2 px-2 text-right text-emerald-400">{cWatts.toFixed(1)} W</td>
                        <td className="py-2 px-2.5 text-right">{(cEff * 100).toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
