import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Info } from 'lucide-react';
import { DUTY_CYCLE_PRESETS } from '../data/rfData';

interface RfSafetyCalculatorProps {
  freqMHz: number;
  onFreqChange: (f: number) => void;
}

/**
 * Computes FCC OET Bulletin 65 Maximum Permissible Exposure (MPE)
 * Power Density Limits (mW/cm^2) for Controlled and Uncontrolled Environments
 */
function getFccMpeLimits(freqMHz: number): {
  controlledMwCm2: number;
  uncontrolledMwCm2: number;
  formulaNote: string;
} {
  const f = Math.max(0.3, freqMHz);

  let controlled = 1.0;
  let uncontrolled = 0.2;
  let note = '30–300 MHz VHF Strictest Resonance Window';

  if (f < 1.34) {
    controlled = 100;
    uncontrolled = 100;
    note = '0.3–1.34 MHz MF Band Limit';
  } else if (f < 3.0) {
    controlled = 100;
    uncontrolled = 180 / (f * f);
    note = '1.34–3.0 MHz: Controlled 100, Uncontrolled 180/f²';
  } else if (f < 30.0) {
    controlled = 900 / (f * f);
    uncontrolled = 180 / (f * f);
    note = '3.0–30 MHz HF: Controlled 900/f², Uncontrolled 180/f²';
  } else if (f < 300.0) {
    controlled = 1.0;
    uncontrolled = 0.2;
    note = '30–300 MHz VHF: Controlled 1.0 mW/cm², Uncontrolled 0.2 mW/cm²';
  } else if (f < 1500.0) {
    controlled = f / 300.0;
    uncontrolled = f / 1500.0;
    note = '300–1500 MHz UHF: Controlled f/300, Uncontrolled f/1500';
  } else {
    controlled = 5.0;
    uncontrolled = 1.0;
    note = '1500–100,000 MHz Microwave Limit';
  }

  return {
    controlledMwCm2: controlled,
    uncontrolledMwCm2: uncontrolled,
    formulaNote: note,
  };
}

export const RfSafetyCalculator: React.FC<RfSafetyCalculatorProps> = ({ freqMHz, onFreqChange }) => {
  const [pepPowerWatts, setPepPowerWatts] = useState<number>(100);
  const [feedlineLossDb, setFeedlineLossDb] = useState<number>(1.0);
  const [antennaGainDbi, setAntennaGainDbi] = useState<number>(2.15); // Half-wave dipole default
  const [modeDutyFactor, setModeDutyFactor] = useState<number>(0.40); // CW default
  const [txTimeFraction, setTxTimeFraction] = useState<number>(0.50); // 50% TX / 50% RX over averaging period
  const [includeGroundReflection, setIncludeGroundReflection] = useState<boolean>(true);
  const [evaluationDistanceFt, setEvaluationDistanceFt] = useState<number>(15);

  const safeFreq = Math.max(0.3, freqMHz || 14.225);
  const mpe = getFccMpeLimits(safeFreq);

  // Average Power delivered to Antenna
  const feedlineEff = Math.pow(10, -Math.max(0, feedlineLossDb) / 10);
  const powerAtAntennaPepW = pepPowerWatts * feedlineEff;
  const averagePowerAtAntennaW = powerAtAntennaPepW * modeDutyFactor * txTimeFraction;

  // Numeric Antenna Gain (linear)
  const numericGain = Math.pow(10, antennaGainDbi / 10);
  const avgEirpWatts = averagePowerAtAntennaW * numericGain;
  const avgEirpMilliwatts = avgEirpWatts * 1000;

  // OET Bulletin 65 Reflection Factor:
  // With standard EPA/FCC ground reflection (reflection coeff = 0.6): (1 + 0.6)^2 = 2.56
  // Power density S = (2.56 * P_avg * G) / (4 * pi * R^2) = (0.2037 * EIRP_mW) / R_cm^2
  // Without ground reflection (free space): S = EIRP_mW / (4 * pi * R_cm^2)
  const reflectionMultiplier = includeGroundReflection ? 2.56 : 1.0;

  // Calculate Power Density S (mW/cm^2) at evaluationDistanceFt
  const evalDistMeters = Math.max(0.1, evaluationDistanceFt * 0.3048);
  const evalDistCm = evalDistMeters * 100;
  const powerDensityAtEvalMwCm2 =
    (reflectionMultiplier * avgEirpMilliwatts) / (4 * Math.PI * evalDistCm * evalDistCm);

  // Minimum Safe Separation Distance R_cm = sqrt( (reflectionMultiplier * avgEirpMilliwatts) / (4 * pi * S_limit) )
  const controlledMinCm = Math.sqrt(
    (reflectionMultiplier * avgEirpMilliwatts) / (4 * Math.PI * mpe.controlledMwCm2)
  );
  const uncontrolledMinCm = Math.sqrt(
    (reflectionMultiplier * avgEirpMilliwatts) / (4 * Math.PI * mpe.uncontrolledMwCm2)
  );

  const controlledMinMeters = controlledMinCm / 100;
  const controlledMinFeet = controlledMinMeters * 3.28084;

  const uncontrolledMinMeters = uncontrolledMinCm / 100;
  const uncontrolledMinFeet = uncontrolledMinMeters * 3.28084;

  const isControlledCompliant = powerDensityAtEvalMwCm2 <= mpe.controlledMwCm2;
  const isUncontrolledCompliant = powerDensityAtEvalMwCm2 <= mpe.uncontrolledMwCm2;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Station & Operating Duty Inputs */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            FCC OET Bulletin 65 Exposure Inputs
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Frequency (MHz)</label>
              <input
                type="number"
                step="0.1"
                min="0.3"
                value={freqMHz}
                onChange={(e) => onFreqChange(parseFloat(e.target.value) || 14.225)}
                className="w-full bg-slate-950 border border-amber-500/40 rounded-lg px-3 py-2 font-mono text-amber-400 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Transmitter PEP (Watts)</label>
              <input
                type="number"
                step="10"
                min="0.1"
                value={pepPowerWatts}
                onChange={(e) => setPepPowerWatts(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-emerald-400 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Feedline Loss (dB)</label>
              <input
                type="number"
                step="0.2"
                min="0"
                value={feedlineLossDb}
                onChange={(e) => setFeedlineLossDb(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Antenna Gain (dBi)</label>
              <input
                type="number"
                step="0.5"
                value={antennaGainDbi}
                onChange={(e) => setAntennaGainDbi(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-cyan-400 font-bold"
              />
            </div>
          </div>

          {/* Emission Mode Duty Factor */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Emission Mode Duty Factor ({(modeDutyFactor * 100).toFixed(0)}%)
            </label>
            <select
              value={modeDutyFactor}
              onChange={(e) => setModeDutyFactor(parseFloat(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
            >
              {DUTY_CYCLE_PRESETS.map((p) => (
                <option key={p.id} value={p.dutyFactor}>
                  {p.name} — {(p.dutyFactor * 100).toFixed(0)}%
                </option>
              ))}
            </select>
          </div>

          {/* Transmit/Receive Duty Ratio & Test Distance */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                TX / RX Time Ratio ({(txTimeFraction * 100).toFixed(0)}% TX)
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={txTimeFraction}
                onChange={(e) => setTxTimeFraction(parseFloat(e.target.value))}
                className="w-full accent-amber-500 mt-2"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Test Distance to Antenna (ft)</label>
              <input
                type="number"
                min="1"
                step="1"
                value={evaluationDistanceFt}
                onChange={(e) => setEvaluationDistanceFt(parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-cyan-500/40 rounded-lg px-3 py-1.5 font-mono text-cyan-400 font-bold"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={includeGroundReflection}
              onChange={(e) => setIncludeGroundReflection(e.target.checked)}
              className="rounded border-slate-700 accent-amber-500 w-4 h-4"
            />
            <span>Include FCC OET-65 Ground Reflection Factor (2.56× worst-case)</span>
          </label>
        </div>

        {/* Right: Safe Separation Distances & Compliance Report */}
        <div className="lg:col-span-7 space-y-5">
          {/* Controlled vs Uncontrolled Minimum Safe Distance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Controlled Environment */}
            <div
              className={`rounded-xl p-5 border ${
                isControlledCompliant
                  ? 'bg-slate-900/90 border-emerald-500/40'
                  : 'bg-rose-950/20 border-rose-500/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Controlled Environment (Operator)
                </span>
                {isControlledCompliant ? (
                  <span className="flex items-center gap-1 text-xs font-mono font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded">
                    <ShieldCheck className="w-3.5 h-3.5" /> PASS @ {evaluationDistanceFt}ft
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-mono font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded">
                    <AlertTriangle className="w-3.5 h-3.5" /> EXCEEDS @ {evaluationDistanceFt}ft
                  </span>
                )}
              </div>

              <div className="mt-3 font-mono">
                <div className="text-xs text-slate-400">Minimum Safe Distance</div>
                <div className="text-2xl font-bold text-slate-100 mt-0.5">
                  {controlledMinFeet.toFixed(1)} ft{' '}
                  <span className="text-sm text-cyan-400">({controlledMinMeters.toFixed(2)} m)</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 flex justify-between text-xs font-mono">
                <span className="text-slate-400">MPE Limit (6-min avg):</span>
                <span className="text-amber-300 font-bold">{mpe.controlledMwCm2.toFixed(3)} mW/cm²</span>
              </div>
            </div>

            {/* Uncontrolled Environment */}
            <div
              className={`rounded-xl p-5 border ${
                isUncontrolledCompliant
                  ? 'bg-slate-900/90 border-emerald-500/40'
                  : 'bg-rose-950/20 border-rose-500/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  Uncontrolled (General Public)
                </span>
                {isUncontrolledCompliant ? (
                  <span className="flex items-center gap-1 text-xs font-mono font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded">
                    <ShieldCheck className="w-3.5 h-3.5" /> PASS @ {evaluationDistanceFt}ft
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-mono font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded">
                    <AlertTriangle className="w-3.5 h-3.5" /> EXCEEDS @ {evaluationDistanceFt}ft
                  </span>
                )}
              </div>

              <div className="mt-3 font-mono">
                <div className="text-xs text-slate-400">Minimum Safe Distance</div>
                <div className="text-2xl font-bold text-slate-100 mt-0.5">
                  {uncontrolledMinFeet.toFixed(1)} ft{' '}
                  <span className="text-sm text-cyan-400">({uncontrolledMinMeters.toFixed(2)} m)</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 flex justify-between text-xs font-mono">
                <span className="text-slate-400">MPE Limit (30-min avg):</span>
                <span className="text-cyan-300 font-bold">{mpe.uncontrolledMwCm2.toFixed(3)} mW/cm²</span>
              </div>
            </div>
          </div>

          {/* Detailed Power Density Analysis */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Field Power Density Analysis at {evaluationDistanceFt} ft ({evalDistMeters.toFixed(2)} m)
              </h4>
              <span className="text-xs font-mono text-slate-400">{mpe.formulaNote}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-[11px] text-slate-400">Power @ Antenna</div>
                <div className="text-base font-bold text-slate-100 mt-0.5">{powerAtAntennaPepW.toFixed(1)} W PEP</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-[11px] text-slate-400">Time-Avg Power</div>
                <div className="text-base font-bold text-amber-400 mt-0.5">
                  {averagePowerAtAntennaW.toFixed(1)} W avg
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-[11px] text-slate-400">Time-Avg EIRP</div>
                <div className="text-base font-bold text-cyan-400 mt-0.5">{avgEirpWatts.toFixed(1)} W</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-amber-500/40">
                <div className="text-[11px] text-slate-300">Field Density (S)</div>
                <div className="text-base font-bold text-emerald-400 mt-0.5">
                  {powerDensityAtEvalMwCm2.toFixed(4)} mW/cm²
                </div>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 text-xs text-slate-400 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-200 font-medium">FCC Station Evaluation Note: </span>
                Per 47 CFR § 1.1307(b), all Amateur Radio stations must perform an routine RF exposure evaluation. Keep this summary in your station logbook to document compliance for your antenna configuration.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
