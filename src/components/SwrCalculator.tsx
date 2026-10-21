import React, { useState } from 'react';
import { Activity, Gauge, AlertTriangle, CheckCircle2, Sliders } from 'lucide-react';

type SwrInputMode = 'swr' | 'power' | 'returnLoss' | 'impedance';

export const SwrCalculator: React.FC = () => {
  const [mode, setMode] = useState<SwrInputMode>('swr');

  // Mode 1: Direct SWR
  const [swrInput, setSwrInput] = useState<number>(1.5);
  const [txPowerW, setTxPowerW] = useState<number>(100);

  // Mode 2: Forward & Reflected Power
  const [fwdPowerW, setFwdPowerW] = useState<number>(100);
  const [refPowerW, setRefPowerW] = useState<number>(4.0);

  // Mode 3: Return Loss (dB)
  const [rlInputDb, setRlInputDb] = useState<number>(13.98);

  // Mode 4: Complex Impedance Z_L = R + jX on system Z_0
  const [z0, setZ0] = useState<number>(50);
  const [rLoad, setRLoad] = useState<number>(75);
  const [xLoad, setXLoad] = useState<number>(25);

  // Compute reflection coefficient magnitude |Gamma| (0 <= gamma < 1)
  let gammaMag = 0;
  let gammaPhaseDeg = 0;
  let forwardWatts = txPowerW;

  if (mode === 'swr') {
    const clampedSwr = Math.max(1.0, swrInput || 1.0);
    gammaMag = (clampedSwr - 1) / (clampedSwr + 1);
    forwardWatts = Math.max(0.001, txPowerW || 100);
  } else if (mode === 'power') {
    const pf = Math.max(0.01, fwdPowerW || 100);
    const pr = Math.max(0, Math.min(pf * 0.9999, refPowerW || 0));
    gammaMag = Math.sqrt(pr / pf);
    forwardWatts = pf;
  } else if (mode === 'returnLoss') {
    const rl = Math.max(0.01, rlInputDb || 0.01);
    gammaMag = Math.pow(10, -rl / 20);
    forwardWatts = Math.max(0.001, txPowerW || 100);
  } else if (mode === 'impedance') {
    const r0 = Math.max(1, z0 || 50);
    const rL = Math.max(0.01, rLoad);
    const xL = xLoad || 0;
    // Complex Gamma = (Z_L - Z_0) / (Z_L + Z_0) = ((R - Z0) + jX) / ((R + Z0) + jX)
    const numReal = rL - r0;
    const numImag = xL;
    const denReal = rL + r0;
    const denImag = xL;
    const denMagSq = denReal * denReal + denImag * denImag;
    const gammaReal = (numReal * denReal + numImag * denImag) / denMagSq;
    const gammaImag = (numImag * denReal - numReal * denImag) / denMagSq;
    gammaMag = Math.min(0.9999, Math.sqrt(gammaReal * gammaReal + gammaImag * gammaImag));
    gammaPhaseDeg = (Math.atan2(gammaImag, gammaReal) * 180) / Math.PI;
    forwardWatts = Math.max(0.001, txPowerW || 100);
  }

  // Derived RF quantities
  const vswr = gammaMag >= 0.999 ? 999.0 : (1 + gammaMag) / (1 - gammaMag);
  const returnLossDb = gammaMag <= 0.00001 ? 100.0 : -20 * Math.log10(gammaMag);
  const reflectedPowerFrac = gammaMag * gammaMag;
  const transmittedPowerFrac = 1 - reflectedPowerFrac;
  const mismatchLossDb = -10 * Math.log10(Math.max(0.00001, transmittedPowerFrac));

  const calcReflectedWatts = forwardWatts * reflectedPowerFrac;
  const calcDeliveredWatts = forwardWatts * transmittedPowerFrac;

  // Standing wave voltages on Z0 line
  const sysZ0 = Math.max(1, z0 || 50);
  const vForwardRms = Math.sqrt(forwardWatts * sysZ0);
  const vMaxRms = vForwardRms * (1 + gammaMag);
  const vMinRms = vForwardRms * (1 - gammaMag);
  const vPeakMax = vMaxRms * Math.SQRT2;

  // SWR health assessment
  const swrStatus =
    vswr <= 1.5
      ? { label: 'EXCELLENT MATCH — No Tuner Needed', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' }
      : vswr <= 2.0
      ? { label: 'GOOD OPERATIONAL MATCH — Safe for Solid-State PAs', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' }
      : vswr <= 3.0
      ? { label: 'MODERATE SWR — Internal Rig ATU Recommended', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' }
      : { label: 'HIGH SWR — External Tuner or Antenna Adjustment Required', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' };

  return (
    <div className="space-y-6">
      {/* Mode Selector Tabs */}
      <div className="flex flex-wrap gap-2 bg-slate-900/70 p-2 rounded-xl border border-slate-800">
        {[
          { id: 'swr', label: 'Solve from VSWR (e.g., 1.5:1)' },
          { id: 'power', label: 'Solve from Forward & Reflected Watts' },
          { id: 'returnLoss', label: 'Solve from Return Loss (dB)' },
          { id: 'impedance', label: 'Solve from Complex Impedance (R ± jX)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMode(tab.id as SwrInputMode)}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === tab.id
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-lg shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Controls */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            Input Measurement Parameters
          </h3>

          {mode === 'swr' && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Standing Wave Ratio (VSWR)</span>
                  <span className="font-mono text-amber-400 font-bold">{swrInput.toFixed(2)} : 1</span>
                </div>
                <input
                  type="range"
                  min="1.00"
                  max="10.00"
                  step="0.05"
                  value={Math.min(10, swrInput)}
                  onChange={(e) => setSwrInput(parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min="1.0"
                    max="100"
                    step="0.05"
                    value={swrInput}
                    onChange={(e) => setSwrInput(Math.max(1.0, parseFloat(e.target.value) || 1.0))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-amber-400 font-bold"
                  />
                  <span className="font-mono text-sm text-slate-400">: 1</span>
                </div>
                {/* Quick SWR Presets */}
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {[1.0, 1.2, 1.5, 1.7, 2.0, 2.5, 3.0, 5.0, 10.0].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setSwrInput(preset)}
                      className="text-xs font-mono px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
                    >
                      {preset.toFixed(1)}:1
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Transmitter Forward Power (Watts)</label>
                <input
                  type="number"
                  min="0.1"
                  max="10000"
                  value={txPowerW}
                  onChange={(e) => setTxPowerW(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-slate-100"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[5, 10, 20, 50, 100, 500, 1500].map((p) => (
                    <button
                      key={p}
                      onClick={() => setTxPowerW(p)}
                      className="text-xs font-mono px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
                    >
                      {p}W
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {mode === 'power' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Forward Power P_fwd (Watts)</label>
                <input
                  type="number"
                  min="0.1"
                  step="1"
                  value={fwdPowerW}
                  onChange={(e) => setFwdPowerW(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-emerald-400 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Reflected Power P_ref (Watts)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={refPowerW}
                  onChange={(e) => setRefPowerW(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-rose-400 font-bold"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Formula: VSWR = (1 + √(P_ref / P_fwd)) / (1 - √(P_ref / P_fwd))
                </p>
              </div>
            </div>
          )}

          {mode === 'returnLoss' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Return Loss (dB)</label>
                <input
                  type="number"
                  min="0.1"
                  max="80"
                  step="0.5"
                  value={rlInputDb}
                  onChange={(e) => setRlInputDb(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-cyan-400 font-bold"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[6.0, 9.54, 13.98, 15.56, 20.0, 26.0, 30.0].map((rl) => (
                    <button
                      key={rl}
                      onClick={() => setRlInputDb(rl)}
                      className="text-xs font-mono px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
                    >
                      {rl} dB
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Transmitter Forward Power (Watts)</label>
                <input
                  type="number"
                  min="0.1"
                  value={txPowerW}
                  onChange={(e) => setTxPowerW(parseFloat(e.target.value) || 100)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-slate-100"
                />
              </div>
            </div>
          )}

          {mode === 'impedance' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">System Characteristic Impedance Z₀ (Ω)</label>
                <input
                  type="number"
                  min="1"
                  value={z0}
                  onChange={(e) => setZ0(parseFloat(e.target.value) || 50)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Load Resistance R (Ω)</label>
                  <input
                    type="number"
                    min="0.1"
                    step="1"
                    value={rLoad}
                    onChange={(e) => setRLoad(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-amber-400 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Load Reactance ±jX (Ω)</label>
                  <input
                    type="number"
                    step="1"
                    value={xLoad}
                    onChange={(e) => setXLoad(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-cyan-400 font-bold"
                  />
                </div>
              </div>
              <div className="text-xs font-mono text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                Z_L = {rLoad} {xLoad >= 0 ? `+ j${xLoad}` : `- j${Math.abs(xLoad)}`} Ω | Phase ∠Γ = {gammaPhaseDeg.toFixed(1)}°
              </div>
            </div>
          )}

          {/* Status Banner */}
          <div className={`p-3.5 rounded-xl border ${swrStatus.bg} flex items-center gap-3`}>
            {vswr <= 2.0 ? (
              <CheckCircle2 className={`w-5 h-5 shrink-0 ${swrStatus.color}`} />
            ) : (
              <AlertTriangle className={`w-5 h-5 shrink-0 ${swrStatus.color}`} />
            )}
            <div className={`text-xs font-semibold ${swrStatus.color}`}>{swrStatus.label}</div>
          </div>
        </div>

        {/* Right: Meter & Solved RF Quantities */}
        <div className="lg:col-span-7 space-y-4">
          {/* Illuminated Shack SWR Meter Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-amber-400" />
                Digital Bargraph SWR & Power Meter
              </span>
              <span className="text-lg font-mono font-bold text-amber-400">
                VSWR {vswr >= 99 ? '∞' : vswr.toFixed(2)} : 1
              </span>
            </div>

            {/* Segmented SWR Scale */}
            <div className="space-y-2 mt-3">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>1.0</span>
                <span>1.2</span>
                <span>1.5</span>
                <span>2.0</span>
                <span className="text-amber-400">3.0</span>
                <span className="text-rose-400">5.0</span>
                <span className="text-rose-500">10+</span>
              </div>
              <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-150 ${
                    vswr <= 1.5
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                      : vswr <= 2.5
                      ? 'bg-gradient-to-r from-emerald-500 via-amber-400 to-amber-500'
                      : 'bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.max(3, ((vswr - 1) / 5) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* Power Delivery Split Bar */}
            <div className="mt-5 grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
              <div>
                <div className="text-xs text-slate-400">Radiated / Accepted Power</div>
                <div className="text-xl font-mono font-bold text-emerald-400 mt-0.5">
                  {calcDeliveredWatts.toFixed(2)} W{' '}
                  <span className="text-xs text-slate-400">({(transmittedPowerFrac * 100).toFixed(1)}%)</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Reflected Power</div>
                <div className="text-xl font-mono font-bold text-rose-400 mt-0.5">
                  {calcReflectedWatts.toFixed(2)} W{' '}
                  <span className="text-xs text-slate-400">({(reflectedPowerFrac * 100).toFixed(1)}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* 6-Card Grid of Precision Derived Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400">Reflection Coeff |Γ|</div>
              <div className="text-lg font-mono font-bold text-cyan-400 mt-1">{gammaMag.toFixed(4)}</div>
              <div className="text-[11px] font-mono text-slate-500">Γ = (SWR-1)/(SWR+1)</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400">Return Loss (RL)</div>
              <div className="text-lg font-mono font-bold text-amber-400 mt-1">
                {returnLossDb >= 99 ? '> 99' : returnLossDb.toFixed(2)} dB
              </div>
              <div className="text-[11px] font-mono text-slate-500">-20·log₁₀(|Γ|)</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400">Mismatch Loss</div>
              <div className="text-lg font-mono font-bold text-emerald-400 mt-1">{mismatchLossDb.toFixed(3)} dB</div>
              <div className="text-[11px] font-mono text-slate-500">-10·log₁₀(1 - |Γ|²)</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400">Max Standing Voltage</div>
              <div className="text-lg font-mono font-bold text-slate-100 mt-1">{vMaxRms.toFixed(1)} V_rms</div>
              <div className="text-[11px] font-mono text-amber-300/80">{vPeakMax.toFixed(1)} V_peak</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400">Min Standing Voltage</div>
              <div className="text-lg font-mono font-bold text-slate-100 mt-1">{vMinRms.toFixed(1)} V_rms</div>
              <div className="text-[11px] font-mono text-slate-500">V_max / V_min = SWR</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400">Equiv Resistive Bounds</div>
              <div className="text-sm font-mono font-bold text-slate-200 mt-1">
                {(sysZ0 / vswr).toFixed(1)} Ω or {(sysZ0 * vswr).toFixed(0)} Ω
              </div>
              <div className="text-[11px] font-mono text-slate-500">For Z₀ = {sysZ0} Ω line</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
