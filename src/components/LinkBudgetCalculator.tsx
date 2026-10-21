import React, { useState } from 'react';
import { Mountain, RadioTower, Signal, Eye, Compass } from 'lucide-react';
import { dBmToSMeter } from '../utils/formatters';

interface LinkBudgetCalculatorProps {
  freqMHz: number;
  onFreqChange: (f: number) => void;
}

export const LinkBudgetCalculator: React.FC<LinkBudgetCalculatorProps> = ({ freqMHz, onFreqChange }) => {
  const [distanceMiles, setDistanceMiles] = useState<number>(25);
  const [txPowerWatts, setTxPowerWatts] = useState<number>(50);
  const [txLineLossDb, setTxLineLossDb] = useState<number>(1.5);
  const [txAntGainDbi, setTxAntGainDbi] = useState<number>(6.0);
  const [rxAntGainDbi, setRxAntGainDbi] = useState<number>(3.0);
  const [rxLineLossDb, setRxLineLossDb] = useState<number>(1.0);
  const [miscFadeLossDb, setMiscFadeLossDb] = useState<number>(0.0);
  const [rxNoiseFloorDbm, setRxNoiseFloorDbm] = useState<number>(-121);

  // Antenna Heights for Radio Horizon & Repeater Line of Sight
  const [txHeightFt, setTxHeightFt] = useState<number>(60);
  const [rxHeightFt, setRxHeightFt] = useState<number>(15);

  const safeFreq = Math.max(0.1, freqMHz || 146.52);
  const safeDistMiles = Math.max(0.01, distanceMiles || 1);
  const distKm = safeDistMiles * 1.609344;

  // Transmitter Power in dBm
  const txPowerDbm = 10 * Math.log10(Math.max(0.0001, txPowerWatts) * 1000);

  // EIRP & ERP (where dBd = dBi - 2.15)
  const eirpDbm = txPowerDbm - txLineLossDb + txAntGainDbi;
  const eirpWatts = Math.pow(10, (eirpDbm - 30) / 10);
  const erpDbm = eirpDbm - 2.15;
  const erpWatts = Math.pow(10, (erpDbm - 30) / 10);

  // Free Space Path Loss (FSPL)
  // FSPL(dB) = 20*log10(d_km) + 20*log10(f_MHz) + 32.44
  const fsplDb = 20 * Math.log10(distKm) + 20 * Math.log10(safeFreq) + 32.44;

  // Received Power at Receiver Input Port
  const rxPowerDbm = eirpDbm - fsplDb - miscFadeLossDb + rxAntGainDbi - rxLineLossDb;
  const rxPowerWatts = Math.pow(10, (rxPowerDbm - 30) / 10);
  const rxMicrovolts50Ohm = Math.sqrt(rxPowerWatts * 50) * 1e6;

  // Link Margin / SNR above Receiver Sensitivity or Noise Floor
  const linkMarginDb = rxPowerDbm - rxNoiseFloorDbm;
  const sMeter = dBmToSMeter(rxPowerDbm, safeFreq >= 30);

  // 1st Fresnel Zone Radius at Path Midpoint
  // F1(meters) = 8.656 * sqrt(D_km / f_GHz) = 8.656 * sqrt((D_km * 1000) / f_MHz)
  const fresnelMidpointMeters = 8.656 * Math.sqrt((distKm * 1000) / safeFreq);
  const fresnelMidpointFeet = fresnelMidpointMeters * 3.28084;
  const fresnel60PctClearanceFt = fresnelMidpointFeet * 0.6;

  // Radio Horizon (4/3 Earth Effective Radius Refraction)
  // d_miles = sqrt(2 * h_feet)
  const txHorizonMiles = Math.sqrt(2 * Math.max(0, txHeightFt));
  const rxHorizonMiles = Math.sqrt(2 * Math.max(0, rxHeightFt));
  const totalRadioHorizonMiles = txHorizonMiles + rxHorizonMiles;
  const isWithinRadioHorizon = safeDistMiles <= totalRadioHorizonMiles;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Link Budget & Horizon Inputs */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <RadioTower className="w-4 h-4 text-amber-400" />
            RF Link & Propagation Parameters
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Frequency (MHz)</label>
              <input
                type="number"
                step="0.1"
                value={freqMHz}
                onChange={(e) => onFreqChange(parseFloat(e.target.value) || 146.52)}
                className="w-full bg-slate-950 border border-amber-500/40 rounded-lg px-3 py-2 font-mono text-amber-400 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Path Distance ({distKm.toFixed(1)} km)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="1"
                  min="0.1"
                  value={distanceMiles}
                  onChange={(e) => setDistanceMiles(parseFloat(e.target.value) || 0.1)}
                  className="w-full bg-slate-950 border border-cyan-500/40 rounded-lg px-3 py-2 font-mono text-cyan-400 font-bold"
                />
                <span className="text-xs font-mono text-slate-400">mi</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">TX Power (Watts)</label>
              <input
                type="number"
                step="1"
                min="0.01"
                value={txPowerWatts}
                onChange={(e) => setTxPowerWatts(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-emerald-400 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">TX Coax Loss (dB)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={txLineLossDb}
                onChange={(e) => setTxLineLossDb(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-rose-400"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">TX Antenna Gain (dBi)</label>
              <input
                type="number"
                step="0.5"
                value={txAntGainDbi}
                onChange={(e) => setTxAntGainDbi(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">RX Antenna Gain (dBi)</label>
              <input
                type="number"
                step="0.5"
                value={rxAntGainDbi}
                onChange={(e) => setRxAntGainDbi(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">RX Coax Loss (dB)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={rxLineLossDb}
                onChange={(e) => setRxLineLossDb(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-rose-400"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">RX MDS / Noise Floor (dBm)</label>
              <input
                type="number"
                step="1"
                value={rxNoiseFloorDbm}
                onChange={(e) => setRxNoiseFloorDbm(parseFloat(e.target.value) || -121)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-slate-300"
              />
            </div>
          </div>

          {/* Antenna Heights for Radio Horizon */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Mountain className="w-3.5 h-3.5 text-cyan-400" />
              4/3 Earth Radio Horizon Heights
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Station 1 / Repeater Height (ft)</label>
                <input
                  type="number"
                  min="1"
                  value={txHeightFt}
                  onChange={(e) => setTxHeightFt(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Station 2 / Mobile Height (ft)</label>
                <input
                  type="number"
                  min="1"
                  value={rxHeightFt}
                  onChange={(e) => setRxHeightFt(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-slate-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Link Budget Dashboard, S-Meter & Fresnel/Horizon */}
        <div className="lg:col-span-7 space-y-5">
          {/* Illuminated S-Meter & Signal Summary */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Signal className="w-4 h-4 text-emerald-400" />
                  Estimated Receiver Signal Level
                </span>
                <div className="text-2xl font-mono font-bold text-amber-400 mt-1">
                  {sMeter.label}{' '}
                  <span className="text-sm font-normal text-slate-300">
                    ({rxPowerDbm.toFixed(1)} dBm / {rxMicrovolts50Ohm < 1000 ? `${rxMicrovolts50Ohm.toFixed(2)} µV` : `${(rxMicrovolts50Ohm / 1000).toFixed(2)} mV`})
                  </span>
                </div>
              </div>

              <div
                className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold ${
                  linkMarginDb >= 15
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : linkMarginDb >= 3
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                }`}
              >
                Link Margin: {linkMarginDb >= 0 ? `+${linkMarginDb.toFixed(1)}` : linkMarginDb.toFixed(1)} dB SNR
              </div>
            </div>

            {/* S-Meter Bargraph */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>S1</span>
                <span>S3</span>
                <span>S5</span>
                <span>S7</span>
                <span className="text-emerald-400 font-bold">S9</span>
                <span className="text-amber-400">+20</span>
                <span className="text-rose-400">+40</span>
                <span className="text-rose-500">+60dB</span>
              </div>
              <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-amber-400 transition-all duration-150"
                  style={{ width: `${sMeter.percentScale}%` }}
                />
              </div>
            </div>

            {/* 4 Key Link Budget Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-[11px] text-slate-400">ERP (Dipole Ref)</div>
                <div className="text-sm font-bold text-amber-400 mt-0.5">{erpWatts.toFixed(1)} W</div>
                <div className="text-[10px] text-slate-500">{erpDbm.toFixed(1)} dBm</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-[11px] text-slate-400">EIRP (Isotropic)</div>
                <div className="text-sm font-bold text-cyan-400 mt-0.5">{eirpWatts.toFixed(1)} W</div>
                <div className="text-[10px] text-slate-500">{eirpDbm.toFixed(1)} dBm</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-[11px] text-slate-400">Free Space Loss</div>
                <div className="text-sm font-bold text-rose-400 mt-0.5">-{fsplDb.toFixed(1)} dB</div>
                <div className="text-[10px] text-slate-500">{safeDistMiles} mi @ {safeFreq} MHz</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-[11px] text-slate-400">System Gain/Loss</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">
                  {(txAntGainDbi + rxAntGainDbi - txLineLossDb - rxLineLossDb).toFixed(1)} dB
                </div>
                <div className="text-[10px] text-slate-500">Antennas - Coax</div>
              </div>
            </div>
          </div>

          {/* Fresnel Zone & Radio Horizon Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  1st Fresnel Zone Clearance
                </h4>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-mono">
                <div className="text-xs text-slate-400">Midpoint 1st Fresnel Radius (F₁)</div>
                <div className="text-xl font-bold text-cyan-400 mt-0.5">
                  {fresnelMidpointFeet.toFixed(1)} ft{' '}
                  <span className="text-xs text-slate-400">({fresnelMidpointMeters.toFixed(1)} m)</span>
                </div>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-lg border border-amber-500/30 font-mono">
                <div className="text-xs text-slate-300">Min 60% Diffraction-Free Clearance</div>
                <div className="text-lg font-bold text-amber-400 mt-0.5">
                  {fresnel60PctClearanceFt.toFixed(1)} ft{' '}
                  <span className="text-xs text-slate-400">({(fresnelMidpointMeters * 0.6).toFixed(1)} m)</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Compass className="w-4 h-4" />
                  Radio Horizon (4/3 Earth)
                </h4>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    isWithinRadioHorizon
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {isWithinRadioHorizon ? 'LINE-OF-SIGHT OK' : 'BEYOND HORIZON'}
                </span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-mono">
                <div className="text-xs text-slate-400">Combined Radio Horizon Range</div>
                <div className="text-xl font-bold text-emerald-400 mt-0.5">
                  {totalRadioHorizonMiles.toFixed(1)} mi{' '}
                  <span className="text-xs text-slate-400">({(totalRadioHorizonMiles * 1.60934).toFixed(1)} km)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">TX Horizon ({txHeightFt}ft)</div>
                  <div className="font-bold text-slate-200">{txHorizonMiles.toFixed(1)} mi</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">RX Horizon ({rxHeightFt}ft)</div>
                  <div className="font-bold text-slate-200">{rxHorizonMiles.toFixed(1)} mi</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
