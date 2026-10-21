import React, { useState } from 'react';
import { Radio, Ruler, Compass, Info, Zap } from 'lucide-react';
import { formatFeetAndInches, formatMetricLength } from '../utils/formatters';

interface AntennaCalculatorProps {
  freqMHz: number;
  onFreqChange: (f: number) => void;
}

type AntennaType = 'dipole' | 'vertical' | 'efhw' | 'loop' | 'yagi' | 'jpole';

export const AntennaCalculator: React.FC<AntennaCalculatorProps> = ({ freqMHz, onFreqChange }) => {
  const [antennaType, setAntennaType] = useState<AntennaType>('dipole');
  const [velocityFactor, setVelocityFactor] = useState<number>(0.95); // Standard bare copper wire in air end-effect (~468/492 = 0.951)
  const [wireInsulationFactor, setWireInsulationFactor] = useState<number>(1.0); // 1.0 = bare copper, 0.975 = PVC insulated THHN
  const [invertedVAngle, setInvertedVAngle] = useState<number>(120); // Apex angle in degrees (90-180)
  const [mastHeightFt, setMastHeightFt] = useState<number>(30);

  const safeFreq = Math.max(0.1, freqMHz || 14.225);

  // Free space wavelength
  const lambdaMeters = 299.792458 / safeFreq;
  const lambdaFeet = 983.571056 / safeFreq;

  // Effective k-factor based on velocity/end-effect and insulation
  // Standard ARRL dipole formula uses 468 / f (which is 491.785 * 0.9516)
  const kFactor = (468 / 0.95) * velocityFactor * wireInsulationFactor;

  // 1. Half-wave Dipole
  const dipoleTotalFt = kFactor / safeFreq;
  const dipoleLegFt = dipoleTotalFt / 2;
  const dipoleTotalM = dipoleTotalFt * 0.3048;
  const dipoleLegM = dipoleLegFt * 0.3048;

  // Inverted-V geometry from mast height and apex angle
  const halfApexRad = ((invertedVAngle / 2) * Math.PI) / 180;
  const invVHorizontalSpanFt = 2 * dipoleLegFt * Math.sin(halfApexRad);
  const invVVerticalDropFt = dipoleLegFt * Math.cos(halfApexRad);
  const invVEndHeightFt = Math.max(0, mastHeightFt - invVVerticalDropFt);

  // 2. Quarter-Wave Vertical Ground Plane
  const verticalRadiatorFt = (dipoleTotalFt / 2); // 234 / f at standard VF
  const verticalRadiatorM = verticalRadiatorFt * 0.3048;
  const verticalRadialFt = verticalRadiatorFt * 1.05; // Radials 5% longer for resonant 45-deg droop
  const verticalRadialM = verticalRadialFt * 0.3048;

  // 3. End-Fed Half-Wave (EFHW) with 49:1 / 64:1 Unun
  const efhwTotalFt = (470 * wireInsulationFactor) / safeFreq;
  const efhwTotalM = efhwTotalFt * 0.3048;
  const efhwCounterpoiseFt = (0.05 * lambdaFeet);
  const efhwCounterpoiseM = efhwCounterpoiseFt * 0.3048;

  // 4. Full-Wave Loop (Quad / Delta Loop) -> L_ft = 1005 / f
  const loopTotalFt = (1005 * wireInsulationFactor) / safeFreq;
  const loopTotalM = loopTotalFt * 0.3048;
  const quadSideFt = loopTotalFt / 4;
  const deltaSideFt = loopTotalFt / 3;

  // 5. 3-Element Yagi-Uda Beam (Standard NBS/ARRL optimized spacing)
  const yagiReflectorFt = (492 * wireInsulationFactor) / safeFreq;
  const yagiDrivenFt = (468 * wireInsulationFactor) / safeFreq;
  const yagiDirectorFt = (446 * wireInsulationFactor) / safeFreq;
  const yagiRefToDrvFt = 0.18 * lambdaFeet;
  const yagiDrvToDirFt = 0.15 * lambdaFeet;
  const yagiTotalBoomFt = yagiRefToDrvFt + yagiDrvToDirFt;

  // 6. J-Pole (VHF/UHF 1/2 wave radiator + 1/4 wave matching stub)
  const jpoleLongFt = (708 * velocityFactor) / safeFreq; // 3/4 wave total tall section
  const jpoleStubFt = (236 * velocityFactor) / safeFreq; // 1/4 wave matching stub
  const jpoleFeedTapFt = (22 * velocityFactor) / safeFreq; // ~50-ohm tap point above shorting bar
  const jpoleSpacingIn = (175 / safeFreq); // center-to-center spacing in inches

  return (
    <div className="space-y-6">
      {/* Top Wavelength & Quick Reference Bar */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-400">Operating Freq</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <input
              type="number"
              step="0.001"
              min="0.1"
              max="30000"
              value={freqMHz}
              onChange={(e) => onFreqChange(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-amber-500/40 focus:border-amber-400 rounded-lg px-2.5 py-1 text-lg font-mono font-bold text-amber-400 focus:outline-none"
            />
            <span className="text-xs font-mono text-slate-400">MHz</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">
            {(safeFreq * 1000).toFixed(1)} kHz
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-400">Full Wave (1λ Free Space)</div>
          <div className="mt-1 text-lg font-mono font-bold text-cyan-400">{lambdaMeters.toFixed(3)} m</div>
          <div className="text-xs font-mono text-slate-400">
            {formatFeetAndInches(lambdaFeet)} ({lambdaFeet.toFixed(2)} ft)
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-400">Half Wave (1/2λ Free)</div>
          <div className="mt-1 text-lg font-mono font-bold text-emerald-400">{(lambdaMeters / 2).toFixed(3)} m</div>
          <div className="text-xs font-mono text-slate-400">
            {formatFeetAndInches(lambdaFeet / 2)} ({(lambdaFeet / 2).toFixed(2)} ft)
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-400">Quarter Wave (1/4λ Free)</div>
          <div className="mt-1 text-lg font-mono font-bold text-amber-300">{(lambdaMeters / 4).toFixed(3)} m</div>
          <div className="text-xs font-mono text-slate-400">
            {formatFeetAndInches(lambdaFeet / 4)} ({(lambdaFeet / 4).toFixed(2)} ft)
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-400">5/8 Wave (0.625λ)</div>
          <div className="mt-1 text-lg font-mono font-bold text-purple-400">{(lambdaMeters * 0.625).toFixed(3)} m</div>
          <div className="text-xs font-mono text-slate-400">
            {formatFeetAndInches(lambdaFeet * 0.625)} ({(lambdaFeet * 0.625).toFixed(2)} ft)
          </div>
        </div>
      </div>

      {/* Antenna Type Selector */}
      <div className="flex flex-wrap gap-2 bg-slate-900/70 p-2 rounded-xl border border-slate-800">
        {[
          { id: 'dipole', label: '1/2λ Dipole & Inverted-V', badge: '72Ω / 50Ω' },
          { id: 'vertical', label: '1/4λ Ground Plane Vertical', badge: '36Ω–50Ω' },
          { id: 'efhw', label: 'End-Fed Half-Wave (EFHW)', badge: '49:1 Unun' },
          { id: 'loop', label: 'Full-Wave Delta / Quad Loop', badge: '~100–120Ω' },
          { id: 'yagi', label: '3-Element Yagi-Uda Beam', badge: '~7.5 dBi' },
          { id: 'jpole', label: 'J-Pole (VHF/UHF End-Fed)', badge: '50Ω Stub' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setAntennaType(item.id as AntennaType)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
              antennaType === item.id
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-lg shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>{item.label}</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                antennaType === item.id ? 'bg-slate-950/25 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {item.badge}
            </span>
          </button>
        ))}
      </div>

      {/* Main Content Split: Controls & Cut-Sheet vs Live Schematic */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Parameters & Cut Sheet */}
        <div className="lg:col-span-6 space-y-5">
          {/* Wire / Element Physics Tuning */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Ruler className="w-4 h-4 text-amber-400" />
                Conductor & Environment Parameters
              </h3>
              <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Effective K = {kFactor.toFixed(1)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Conductor End-Effect Factor (VF)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0.90"
                    max="0.99"
                    step="0.005"
                    value={velocityFactor}
                    onChange={(e) => setVelocityFactor(parseFloat(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  <span className="font-mono text-sm text-amber-300 w-12 text-right">
                    {velocityFactor.toFixed(3)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  0.950 = Standard ARRL (468/f). Thicker tubing uses ~0.935.
                </p>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Wire Jacket / Insulation</label>
                <select
                  value={wireInsulationFactor}
                  onChange={(e) => setWireInsulationFactor(parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:border-amber-400 focus:outline-none"
                >
                  <option value={1.0}>Bare Copper / Aluminum (1.000x)</option>
                  <option value={0.985}>Enamel / Magnet Wire (0.985x)</option>
                  <option value={0.975}>THHN / PVC Insulated Wire (0.975x)</option>
                  <option value={0.960}>Heavy Jacketed Speaker/DX Wire (0.960x)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Dielectric insulation slows RF wave & shortens physical wire.
                </p>
              </div>
            </div>

            {antennaType === 'dipole' && (
              <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Inverted-V Apex Angle ({invertedVAngle}°)
                  </label>
                  <input
                    type="range"
                    min="90"
                    max="180"
                    step="5"
                    value={invertedVAngle}
                    onChange={(e) => setInvertedVAngle(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>90° (50Ω match)</span>
                    <span>120° (Ideal Inv-V)</span>
                    <span>180° (Flat-Top)</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Center Mast Height (ft)</label>
                  <input
                    type="number"
                    min="5"
                    max="200"
                    value={mastHeightFt}
                    onChange={(e) => setMastHeightFt(parseFloat(e.target.value) || 30)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono text-slate-200"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Height in wavelengths: {(mastHeightFt / lambdaFeet).toFixed(2)} λ
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Precision Builder's Cut-Sheet */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Compass className="w-4 h-4" />
              Precision Builder's Cut-Sheet ({safeFreq.toFixed(3)} MHz)
            </h3>

            {antennaType === 'dipole' && (
              <div className="space-y-3">
                <div className="bg-slate-950/90 border border-slate-800/80 rounded-lg p-3.5 flex justify-between items-center">
                  <div>
                    <div className="text-xs text-slate-400">Total Dipole Length (End-to-End)</div>
                    <div className="text-[11px] text-slate-500 font-mono">L = {kFactor.toFixed(1)} / f(MHz)</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-lg font-bold text-amber-400">{formatFeetAndInches(dipoleTotalFt)}</div>
                    <div className="text-xs text-cyan-400">{formatMetricLength(dipoleTotalM)}</div>
                  </div>
                </div>

                <div className="bg-slate-950/90 border border-amber-500/30 rounded-lg p-3.5 flex justify-between items-center">
                  <div>
                    <div className="text-xs font-semibold text-amber-300">Each Leg Length (Cut × 2)</div>
                    <div className="text-[11px] text-slate-400">Add 4–6" extra per end for insulator wrap & tuning</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-xl font-bold text-emerald-400">{formatFeetAndInches(dipoleLegFt)}</div>
                    <div className="text-xs text-cyan-300">{formatMetricLength(dipoleLegM)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
                    <div className="text-xs text-slate-400">Ground Footprint Span</div>
                    <div className="text-sm font-mono font-bold text-slate-200 mt-0.5">
                      {formatFeetAndInches(invVHorizontalSpanFt)} ({(invVHorizontalSpanFt * 0.3048).toFixed(2)} m)
                    </div>
                  </div>
                  <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
                    <div className="text-xs text-slate-400">End Insulator Height</div>
                    <div className="text-sm font-mono font-bold text-slate-200 mt-0.5">
                      {formatFeetAndInches(invVEndHeightFt)} ({(invVEndHeightFt * 0.3048).toFixed(2)} m)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {antennaType === 'vertical' && (
              <div className="space-y-3">
                <div className="bg-slate-950/90 border border-amber-500/30 rounded-lg p-3.5 flex justify-between items-center">
                  <div>
                    <div className="text-xs font-semibold text-amber-300">Vertical Radiator (1/4λ)</div>
                    <div className="text-[11px] text-slate-400">L = {(kFactor / 2).toFixed(1)} / f(MHz)</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-xl font-bold text-emerald-400">{formatFeetAndInches(verticalRadiatorFt)}</div>
                    <div className="text-xs text-cyan-300">{formatMetricLength(verticalRadiatorM)}</div>
                  </div>
                </div>

                <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3.5 flex justify-between items-center">
                  <div>
                    <div className="text-xs text-slate-300">Elevated Radials (Cut × 4, Droop 45°)</div>
                    <div className="text-[11px] text-slate-500">1.05 × radiator length raises feed impedance from 36Ω to ~50Ω</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-lg font-bold text-amber-400">{formatFeetAndInches(verticalRadialFt)}</div>
                    <div className="text-xs text-cyan-400">{formatMetricLength(verticalRadialM)}</div>
                  </div>
                </div>
              </div>
            )}

            {antennaType === 'efhw' && (
              <div className="space-y-3">
                <div className="bg-slate-950/90 border border-amber-500/30 rounded-lg p-3.5 flex justify-between items-center">
                  <div>
                    <div className="text-xs font-semibold text-amber-300">EFHW Radiator Wire (1/2λ at Fundamental)</div>
                    <div className="text-[11px] text-slate-400">Resonant on fundamental + even/odd harmonics (1, 2, 3, 4× f)</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-xl font-bold text-emerald-400">{formatFeetAndInches(efhwTotalFt)}</div>
                    <div className="text-xs text-cyan-300">{formatMetricLength(efhwTotalM)}</div>
                  </div>
                </div>

                <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3.5 flex justify-between items-center">
                  <div>
                    <div className="text-xs text-slate-300">Recommended Counterpoise (0.05λ)</div>
                    <div className="text-[11px] text-slate-500">Or place 1:1 common-mode choke at distance 0.05λ from 49:1 unun</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-lg font-bold text-amber-400">{formatFeetAndInches(efhwCounterpoiseFt)}</div>
                    <div className="text-xs text-cyan-400">{formatMetricLength(efhwCounterpoiseM)}</div>
                  </div>
                </div>
              </div>
            )}

            {antennaType === 'loop' && (
              <div className="space-y-3">
                <div className="bg-slate-950/90 border border-amber-500/30 rounded-lg p-3.5 flex justify-between items-center">
                  <div>
                    <div className="text-xs font-semibold text-amber-300">Total Full-Wave Loop Perimeter</div>
                    <div className="text-[11px] text-slate-400">L = 1005 / f(MHz) — Match with 1/4λ 75Ω RG-11/RG-6 Q-section</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-xl font-bold text-emerald-400">{formatFeetAndInches(loopTotalFt)}</div>
                    <div className="text-xs text-cyan-300">{formatMetricLength(loopTotalM)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3">
                    <div className="text-xs text-slate-400">Delta Loop (3 Equal Sides)</div>
                    <div className="text-base font-mono font-bold text-amber-400 mt-1">
                      {formatFeetAndInches(deltaSideFt)} / side
                    </div>
                    <div className="text-xs font-mono text-cyan-400">{formatMetricLength(deltaSideFt * 0.3048)}</div>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3">
                    <div className="text-xs text-slate-400">Quad Loop (4 Equal Sides)</div>
                    <div className="text-base font-mono font-bold text-amber-400 mt-1">
                      {formatFeetAndInches(quadSideFt)} / side
                    </div>
                    <div className="text-xs font-mono text-cyan-400">{formatMetricLength(quadSideFt * 0.3048)}</div>
                  </div>
                </div>
              </div>
            )}

            {antennaType === 'yagi' && (
              <div className="space-y-2.5">
                <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <div className="text-xs text-slate-300">Reflector Element (Rear)</div>
                    <div className="text-[11px] text-slate-500">492 / f(MHz)</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-base font-bold text-amber-400">{formatFeetAndInches(yagiReflectorFt)}</div>
                    <div className="text-xs text-cyan-400">{formatMetricLength(yagiReflectorFt * 0.3048)}</div>
                  </div>
                </div>

                <div className="bg-slate-950/90 border border-amber-500/30 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <div className="text-xs font-semibold text-amber-300">Driven Element (Center Fed)</div>
                    <div className="text-[11px] text-slate-400">468 / f(MHz)</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-base font-bold text-emerald-400">{formatFeetAndInches(yagiDrivenFt)}</div>
                    <div className="text-xs text-cyan-300">{formatMetricLength(yagiDrivenFt * 0.3048)}</div>
                  </div>
                </div>

                <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <div className="text-xs text-slate-300">Director Element (Front)</div>
                    <div className="text-[11px] text-slate-500">446 / f(MHz)</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-base font-bold text-amber-400">{formatFeetAndInches(yagiDirectorFt)}</div>
                    <div className="text-xs text-cyan-400">{formatMetricLength(yagiDirectorFt * 0.3048)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
                  <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2">
                    <div className="text-[10px] text-slate-400">Ref → Driven</div>
                    <div className="text-xs font-bold text-slate-200">{formatFeetAndInches(yagiRefToDrvFt)}</div>
                    <div className="text-[10px] text-cyan-400">{(yagiRefToDrvFt * 0.3048).toFixed(2)} m</div>
                  </div>
                  <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2">
                    <div className="text-[10px] text-slate-400">Driven → Dir</div>
                    <div className="text-xs font-bold text-slate-200">{formatFeetAndInches(yagiDrvToDirFt)}</div>
                    <div className="text-[10px] text-cyan-400">{(yagiDrvToDirFt * 0.3048).toFixed(2)} m</div>
                  </div>
                  <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2">
                    <div className="text-[10px] text-slate-400">Min Boom Length</div>
                    <div className="text-xs font-bold text-amber-300">{formatFeetAndInches(yagiTotalBoomFt)}</div>
                    <div className="text-[10px] text-cyan-400">{(yagiTotalBoomFt * 0.3048).toFixed(2)} m</div>
                  </div>
                </div>
              </div>
            )}

            {antennaType === 'jpole' && (
              <div className="space-y-2.5">
                <div className="bg-slate-950/90 border border-amber-500/30 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <div className="text-xs font-semibold text-amber-300">Long Element (3/4λ Radiator + Stub)</div>
                    <div className="text-[11px] text-slate-400">Measured from bottom shorting bar to top tip</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-base font-bold text-emerald-400">{formatFeetAndInches(jpoleLongFt)}</div>
                    <div className="text-xs text-cyan-300">{formatMetricLength(jpoleLongFt * 0.3048)}</div>
                  </div>
                </div>

                <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <div className="text-xs text-slate-300">Short Stub Element (1/4λ Matching Section)</div>
                    <div className="text-[11px] text-slate-500">Parallel to long radiator</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-base font-bold text-amber-400">{formatFeetAndInches(jpoleStubFt)}</div>
                    <div className="text-xs text-cyan-400">{formatMetricLength(jpoleStubFt * 0.3048)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3">
                    <div className="text-xs text-slate-400">50Ω Feed Tap Above Short</div>
                    <div className="text-sm font-mono font-bold text-amber-300 mt-1">
                      {(jpoleFeedTapFt * 12).toFixed(2)}" ({(jpoleFeedTapFt * 30.48).toFixed(1)} cm)
                    </div>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3">
                    <div className="text-xs text-slate-400">Parallel Element Spacing</div>
                    <div className="text-sm font-mono font-bold text-cyan-300 mt-1">
                      {jpoleSpacingIn.toFixed(2)}" ({(jpoleSpacingIn * 2.54).toFixed(1)} cm)
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Interactive Schematic Blueprint */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              Interactive Blueprint Diagram
            </h3>
            <span className="text-xs font-mono text-slate-400">
              λ = {lambdaMeters.toFixed(2)}m / {lambdaFeet.toFixed(1)}ft
            </span>
          </div>

          <div className="relative bg-[#070b12] border border-slate-800/90 rounded-xl p-4 flex-1 flex items-center justify-center min-h-[290px] overflow-hidden">
            {/* Subtle Blueprint Grid Background */}
            <svg className="w-full h-full max-h-[300px]" viewBox="0 0 500 280">
              <defs>
                <pattern id="rfGrid" width="25" height="25" patternUnits="userSpaceOnUse">
                  <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#1e293b" strokeWidth="0.6" />
                </pattern>
              </defs>
              <rect width="500" height="280" fill="url(#rfGrid)" />

              {antennaType === 'dipole' && (
                <g>
                  {/* Ground line */}
                  <line x1="20" y1="250" x2="480" y2="250" stroke="#334155" strokeWidth="2" strokeDasharray="6 4" />
                  <text x="30" y="266" fill="#64748b" fontSize="10" fontFamily="monospace">
                    GROUND LEVEL
                  </text>
                  {/* Center Mast */}
                  <line x1="250" y1="65" x2="250" y2="250" stroke="#475569" strokeWidth="3" />
                  {/* Feedpoint Balun */}
                  <rect x="240" y="55" width="20" height="16" rx="3" fill="#f59e0b" />
                  <text x="250" y="45" textAnchor="middle" fill="#fbbf24" fontSize="11" fontFamily="monospace" fontWeight="bold">
                    1:1 Current Balun ({invertedVAngle}° Apex)
                  </text>
                  {/* Dipole Legs (sloped by invertedVAngle) */}
                  {(() => {
                    const dropY = Math.cos(((invertedVAngle / 2) * Math.PI) / 180) * 140;
                    const spanX = Math.sin(((invertedVAngle / 2) * Math.PI) / 180) * 185;
                    return (
                      <>
                        <line
                          x1="240"
                          y1="63"
                          x2={250 - spanX}
                          y2={63 + dropY}
                          stroke="#22d3ee"
                          strokeWidth="3"
                        />
                        <line
                          x1="260"
                          y1="63"
                          x2={250 + spanX}
                          y2={63 + dropY}
                          stroke="#22d3ee"
                          strokeWidth="3"
                        />
                        <circle cx={250 - spanX} cy={63 + dropY} r="4" fill="#f59e0b" />
                        <circle cx={250 + spanX} cy={63 + dropY} r="4" fill="#f59e0b" />
                        <text
                          x={250 - spanX / 2 - 12}
                          y={63 + dropY / 2 - 10}
                          textAnchor="middle"
                          fill="#38bdf8"
                          fontSize="11"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          Leg 1: {formatFeetAndInches(dipoleLegFt)}
                        </text>
                        <text
                          x={250 + spanX / 2 + 12}
                          y={63 + dropY / 2 - 10}
                          textAnchor="middle"
                          fill="#38bdf8"
                          fontSize="11"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          Leg 2: {formatFeetAndInches(dipoleLegFt)}
                        </text>
                      </>
                    );
                  })()}
                  <text x="250" y="235" textAnchor="middle" fill="#cbd5e1" fontSize="11" fontFamily="monospace">
                    Total Wire: {formatFeetAndInches(dipoleTotalFt)} ({dipoleTotalM.toFixed(2)} m)
                  </text>
                </g>
              )}

              {antennaType === 'vertical' && (
                <g>
                  {/* Vertical Element */}
                  <line x1="250" y1="35" x2="250" y2="175" stroke="#34d399" strokeWidth="4" />
                  <circle cx="250" cy="35" r="4" fill="#34d399" />
                  {/* Feed Insulator */}
                  <rect x="242" y="175" width="16" height="12" rx="2" fill="#f59e0b" />
                  {/* 45 deg Drooping Radials */}
                  <line x1="242" y1="184" x2="135" y2="250" stroke="#38bdf8" strokeWidth="2.5" />
                  <line x1="258" y1="184" x2="365" y2="250" stroke="#38bdf8" strokeWidth="2.5" />
                  <line x1="245" y1="184" x2="175" y2="235" stroke="#0284c7" strokeWidth="1.8" strokeDasharray="4 2" />
                  <line x1="255" y1="184" x2="325" y2="235" stroke="#0284c7" strokeWidth="1.8" strokeDasharray="4 2" />
                  {/* Labels */}
                  <text x="265" y="105" fill="#34d399" fontSize="12" fontFamily="monospace" fontWeight="bold">
                    1/4λ Radiator: {formatFeetAndInches(verticalRadiatorFt)}
                  </text>
                  <text x="265" y="122" fill="#94a3b8" fontSize="11" fontFamily="monospace">
                    ({verticalRadiatorM.toFixed(3)} m)
                  </text>
                  <text x="250" y="268" textAnchor="middle" fill="#38bdf8" fontSize="11" fontFamily="monospace" fontWeight="bold">
                    4× Radials (45° droop for 50Ω): {formatFeetAndInches(verticalRadialFt)} each
                  </text>
                </g>
              )}

              {antennaType === 'efhw' && (
                <g>
                  {/* Unun Box at left */}
                  <rect x="65" y="165" width="44" height="34" rx="4" fill="#f59e0b" />
                  <text x="87" y="185" textAnchor="middle" fill="#090d16" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    49:1
                  </text>
                  {/* Sloping Half-Wave Wire */}
                  <line x1="109" y1="172" x2="435" y2="48" stroke="#34d399" strokeWidth="3.5" />
                  <circle cx="435" cy="48" r="5" fill="#f59e0b" />
                  {/* Counterpoise / Coax */}
                  <line x1="87" y1="199" x2="87" y2="250" stroke="#38bdf8" strokeWidth="2.5" />
                  <text x="260" y="95" textAnchor="middle" fill="#34d399" fontSize="12" fontFamily="monospace" fontWeight="bold">
                    1/2λ EFHW Wire: {formatFeetAndInches(efhwTotalFt)} ({efhwTotalM.toFixed(2)} m)
                  </text>
                  <text x="185" y="235" fill="#38bdf8" fontSize="11" fontFamily="monospace">
                    0.05λ Counterpoise: {formatFeetAndInches(efhwCounterpoiseFt)}
                  </text>
                </g>
              )}

              {antennaType === 'loop' && (
                <g>
                  {/* Delta Triangle */}
                  <polygon
                    points="250,40 120,220 380,220"
                    fill="rgba(34, 211, 238, 0.06)"
                    stroke="#22d3ee"
                    strokeWidth="3"
                  />
                  <rect x="242" y="213" width="16" height="14" rx="2" fill="#f59e0b" />
                  <text x="250" y="150" textAnchor="middle" fill="#fbbf24" fontSize="12" fontFamily="monospace" fontWeight="bold">
                    Total Loop: {formatFeetAndInches(loopTotalFt)}
                  </text>
                  <text x="250" y="168" textAnchor="middle" fill="#38bdf8" fontSize="11" fontFamily="monospace">
                    Delta Side: {formatFeetAndInches(deltaSideFt)} | Quad Side: {formatFeetAndInches(quadSideFt)}
                  </text>
                  <text x="250" y="252" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="monospace">
                    Feed via 1/4λ 75Ω Coax Matching Section ({formatFeetAndInches((lambdaFeet / 4) * 0.82)})
                  </text>
                </g>
              )}

              {antennaType === 'yagi' && (
                <g>
                  {/* Boom */}
                  <line x1="90" y1="140" x2="410" y2="140" stroke="#64748b" strokeWidth="5" />
                  {/* Reflector */}
                  <line x1="120" y1="30" x2="120" y2="250" stroke="#f59e0b" strokeWidth="3.5" />
                  {/* Driven */}
                  <line x1="255" y1="42" x2="255" y2="238" stroke="#34d399" strokeWidth="4" />
                  {/* Director */}
                  <line x1="375" y1="54" x2="375" y2="226" stroke="#38bdf8" strokeWidth="3.5" />
                  {/* Direction Arrow */}
                  <path d="M 415 140 L 460 140 L 448 132 M 460 140 L 448 148" stroke="#fbbf24" strokeWidth="2.5" fill="none" />
                  <text x="445" y="122" textAnchor="middle" fill="#fbbf24" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    TX BEAM
                  </text>
                  <text x="120" y="22" textAnchor="middle" fill="#f59e0b" fontSize="10" fontFamily="monospace">
                    REF: {formatFeetAndInches(yagiReflectorFt)}
                  </text>
                  <text x="255" y="32" textAnchor="middle" fill="#34d399" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    DRV: {formatFeetAndInches(yagiDrivenFt)}
                  </text>
                  <text x="375" y="44" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace">
                    DIR: {formatFeetAndInches(yagiDirectorFt)}
                  </text>
                </g>
              )}

              {antennaType === 'jpole' && (
                <g>
                  {/* Long Radiator */}
                  <line x1="220" y1="25" x2="220" y2="235" stroke="#34d399" strokeWidth="5" />
                  {/* Short Stub */}
                  <line x1="275" y1="160" x2="275" y2="235" stroke="#38bdf8" strokeWidth="5" />
                  {/* Bottom Shorting Bar */}
                  <line x1="218" y1="235" x2="277" y2="235" stroke="#f59e0b" strokeWidth="6" />
                  {/* 50 ohm feed tap */}
                  <circle cx="220" cy="215" r="4" fill="#fbbf24" />
                  <circle cx="275" cy="215" r="4" fill="#fbbf24" />
                  <text x="195" y="110" textAnchor="end" fill="#34d399" fontSize="11" fontFamily="monospace" fontWeight="bold">
                    3/4λ Long: {formatFeetAndInches(jpoleLongFt)}
                  </text>
                  <text x="290" y="185" fill="#38bdf8" fontSize="11" fontFamily="monospace" fontWeight="bold">
                    1/4λ Stub: {formatFeetAndInches(jpoleStubFt)}
                  </text>
                  <text x="290" y="218" fill="#fbbf24" fontSize="10" fontFamily="monospace">
                    50Ω Tap: {(jpoleFeedTapFt * 12).toFixed(1)}" up
                  </text>
                </g>
              )}
            </svg>
          </div>

          <div className="mt-3 bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 text-xs text-slate-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-200 font-medium">Field Tuning Tip: </span>
              Always cut wire elements <span className="text-amber-300 font-mono">2% to 3% longer</span> than calculated, then fold back rather than cutting the ends at the insulators while sweeping SWR with your antenna analyzer or NanoVNA.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
