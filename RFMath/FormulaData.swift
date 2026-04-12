import Foundation

// MARK: - Formula Library

struct FormulaData {

    static let all: [Formula] =
        frequencyWavelength + powerDecibels + antenna +
        radar + electronicWarfare + sigint + linkBudget + ham

    static func formulas(for category: FormulaCategory) -> [Formula] {
        all.filter { $0.category == category }
    }

    // ─────────────────────────────────────────────────
    // MARK: Frequency & Wavelength
    // ─────────────────────────────────────────────────

    static let frequencyWavelength: [Formula] = [

        Formula(
            name: "Wavelength from Frequency",
            category: .frequencyWavelength,
            description: "Calculate the free-space wavelength of an EM wave given frequency.",
            formulaDisplay: "λ = c / f",
            notes: "Speed of light c = 2.998 × 10⁸ m/s. Quick rule: λ(m) ≈ 300/f(MHz).",
            inputs: [
                FormulaInput("Frequency", symbol: "f", unit: "MHz", hint: "e.g. 1000")
            ],
            output: FormulaOutput("Wavelength", symbol: "λ", unit: "m"),
            calculate: { i in
                guard let f = i["f"], f > 0 else { return nil }
                return 299.792458 / f          // c(MHz·m) / f(MHz) → meters
            }
        ),

        Formula(
            name: "Frequency from Wavelength",
            category: .frequencyWavelength,
            description: "Calculate frequency given free-space wavelength.",
            formulaDisplay: "f = c / λ",
            notes: "Speed of light c = 2.998 × 10⁸ m/s.",
            inputs: [
                FormulaInput("Wavelength", symbol: "λ", unit: "m", hint: "e.g. 0.03")
            ],
            output: FormulaOutput("Frequency", symbol: "f", unit: "MHz"),
            calculate: { i in
                guard let lam = i["λ"], lam > 0 else { return nil }
                return 299.792458 / lam
            }
        ),

        Formula(
            name: "Wave Period",
            category: .frequencyWavelength,
            description: "Time for one complete cycle of oscillation.",
            formulaDisplay: "T = 1 / f",
            notes: "Period and frequency are reciprocals.",
            inputs: [
                FormulaInput("Frequency", symbol: "f", unit: "Hz", hint: "e.g. 100e6")
            ],
            output: FormulaOutput("Period", symbol: "T", unit: "ns"),
            calculate: { i in
                guard let f = i["f"], f > 0 else { return nil }
                return (1.0 / f) * 1e9          // nanoseconds
            }
        ),

        Formula(
            name: "Wavelength in cm (GHz quick)",
            category: .frequencyWavelength,
            description: "Shortcut for microwave wavelength in centimeters.",
            formulaDisplay: "λ(cm) = 30 / f(GHz)",
            notes: "Handy for waveguide cutoff, antenna element sizing, and PCB trace length.",
            inputs: [
                FormulaInput("Frequency", symbol: "f", unit: "GHz", hint: "e.g. 10")
            ],
            output: FormulaOutput("Wavelength", symbol: "λ", unit: "cm"),
            calculate: { i in
                guard let f = i["f"], f > 0 else { return nil }
                return 30.0 / f
            }
        ),

        Formula(
            name: "Skin Depth in a Conductor",
            category: .frequencyWavelength,
            description: "Depth at which current density decays to 1/e (~37%) of its surface value.",
            formulaDisplay: "δ = 1 / √(π · f · μ · σ)",
            notes: "Copper: σ ≈ 5.8×10⁷ S/m, μr = 1. Silver is slightly better; steel is much worse.",
            inputs: [
                FormulaInput("Frequency", symbol: "f", unit: "Hz", hint: "e.g. 1e6"),
                FormulaInput("Conductivity", symbol: "σ", unit: "S/m", hint: "e.g. 5.8e7", defaultValue: 5.8e7),
                FormulaInput("Relative Permeability", symbol: "μr", unit: "", hint: "e.g. 1", defaultValue: 1.0)
            ],
            output: FormulaOutput("Skin Depth", symbol: "δ", unit: "μm"),
            calculate: { i in
                guard let f = i["f"], f > 0,
                      let sigma = i["σ"], sigma > 0,
                      let mur = i["μr"], mur > 0 else { return nil }
                let mu = mur * 4.0 * Double.pi * 1e-7
                let delta = 1.0 / sqrt(Double.pi * f * mu * sigma)
                return delta * 1e6              // meters → μm
            }
        )
    ]

    // ─────────────────────────────────────────────────
    // MARK: Power & Decibels
    // ─────────────────────────────────────────────────

    static let powerDecibels: [Formula] = [

        Formula(
            name: "Watts to dBm",
            category: .powerDecibels,
            description: "Convert transmit or receive power from watts to dBm.",
            formulaDisplay: "P(dBm) = 10 · log₁₀(P_W × 1000)",
            notes: "Reference: 1 W = +30 dBm, 1 mW = 0 dBm, 1 μW = −30 dBm.",
            inputs: [
                FormulaInput("Power", symbol: "P", unit: "W", hint: "e.g. 1.0")
            ],
            output: FormulaOutput("Power", symbol: "P", unit: "dBm"),
            calculate: { i in
                guard let p = i["P"], p > 0 else { return nil }
                return 10.0 * log10(p * 1000.0)
            }
        ),

        Formula(
            name: "dBm to Watts",
            category: .powerDecibels,
            description: "Convert power level from dBm to watts.",
            formulaDisplay: "P(W) = 10^(P_dBm / 10) / 1000",
            notes: "Every +10 dB doubles power twice (×10). Every +3 dB ≈ ×2.",
            inputs: [
                FormulaInput("Power", symbol: "P", unit: "dBm", hint: "e.g. 30")
            ],
            output: FormulaOutput("Power", symbol: "P", unit: "W"),
            calculate: { i in
                guard let p = i["P"] else { return nil }
                return pow(10.0, p / 10.0) / 1000.0
            }
        ),

        Formula(
            name: "Power Ratio to dB",
            category: .powerDecibels,
            description: "Express a power gain or loss as decibels.",
            formulaDisplay: "G(dB) = 10 · log₁₀(P₂ / P₁)",
            notes: "P₂/P₁ > 1 = gain; < 1 = loss. Use 10·log for power quantities.",
            inputs: [
                FormulaInput("Output Power", symbol: "P2", unit: "W", hint: "e.g. 100"),
                FormulaInput("Input Power",  symbol: "P1", unit: "W", hint: "e.g. 1")
            ],
            output: FormulaOutput("Gain / Loss", symbol: "G", unit: "dB"),
            calculate: { i in
                guard let p2 = i["P2"], p2 > 0,
                      let p1 = i["P1"], p1 > 0 else { return nil }
                return 10.0 * log10(p2 / p1)
            }
        ),

        Formula(
            name: "Voltage Ratio to dB",
            category: .powerDecibels,
            description: "Express a voltage (field quantity) ratio as decibels.",
            formulaDisplay: "G(dB) = 20 · log₁₀(V₂ / V₁)",
            notes: "Use 20·log for field quantities: voltage, current, E-field, H-field.",
            inputs: [
                FormulaInput("Output Voltage", symbol: "V2", unit: "V", hint: "e.g. 10"),
                FormulaInput("Input Voltage",  symbol: "V1", unit: "V", hint: "e.g. 1")
            ],
            output: FormulaOutput("Gain / Loss", symbol: "G", unit: "dB"),
            calculate: { i in
                guard let v2 = i["V2"], v2 > 0,
                      let v1 = i["V1"], v1 > 0 else { return nil }
                return 20.0 * log10(v2 / v1)
            }
        ),

        Formula(
            name: "Thermal Noise Power",
            category: .powerDecibels,
            description: "Johnson–Nyquist noise power in a given bandwidth at temperature T.",
            formulaDisplay: "N = k · T · B",
            notes: "Room temp (290 K): N(dBm) = −174 + 10·log₁₀(B). k = 1.38×10⁻²³ J/K.",
            inputs: [
                FormulaInput("Temperature", symbol: "T", unit: "K", hint: "e.g. 290", defaultValue: 290),
                FormulaInput("Bandwidth",   symbol: "B", unit: "Hz", hint: "e.g. 1e6")
            ],
            output: FormulaOutput("Noise Power", symbol: "N", unit: "dBm"),
            calculate: { i in
                guard let T = i["T"], T > 0,
                      let B = i["B"], B > 0 else { return nil }
                let k  = 1.380649e-23
                let Nw = k * T * B
                return 10.0 * log10(Nw * 1000.0)
            }
        ),

        Formula(
            name: "Noise Floor",
            category: .powerDecibels,
            description: "Minimum detectable signal for a receiver with given NF and bandwidth.",
            formulaDisplay: "N_floor = −174 + NF + 10·log₁₀(B)",
            notes: "Valid at 290 K. Add SNR_min to find minimum detectable signal.",
            inputs: [
                FormulaInput("Noise Figure", symbol: "NF", unit: "dB", hint: "e.g. 5"),
                FormulaInput("Bandwidth",    symbol: "B",  unit: "Hz", hint: "e.g. 1e6")
            ],
            output: FormulaOutput("Noise Floor", symbol: "N_floor", unit: "dBm"),
            calculate: { i in
                guard let nf = i["NF"],
                      let B  = i["B"], B > 0 else { return nil }
                return -174.0 + nf + 10.0 * log10(B)
            }
        ),

        Formula(
            name: "Noise Figure to Noise Temperature",
            category: .powerDecibels,
            description: "Convert noise figure (dB) to equivalent noise temperature.",
            formulaDisplay: "Te = T₀ · (10^(NF/10) − 1)",
            notes: "T₀ = 290 K (IEEE standard). Low-noise LNAs may have Te < 50 K.",
            inputs: [
                FormulaInput("Noise Figure",       symbol: "NF", unit: "dB", hint: "e.g. 3"),
                FormulaInput("Reference Temp",     symbol: "T0", unit: "K",  hint: "290 standard", defaultValue: 290)
            ],
            output: FormulaOutput("Noise Temperature", symbol: "Te", unit: "K"),
            calculate: { i in
                guard let nf = i["NF"],
                      let t0 = i["T0"], t0 > 0 else { return nil }
                return t0 * (pow(10.0, nf / 10.0) - 1.0)
            }
        ),

        Formula(
            name: "Cascaded Noise Figure (Friis)",
            category: .powerDecibels,
            description: "Total noise figure of two cascaded amplifier/filter stages.",
            formulaDisplay: "F_tot = F₁ + (F₂ − 1) / G₁",
            notes: "First stage NF dominates. Always place your best (lowest NF) LNA first.",
            inputs: [
                FormulaInput("NF of Stage 1",   symbol: "NF1", unit: "dB", hint: "e.g. 1"),
                FormulaInput("Gain of Stage 1", symbol: "G1",  unit: "dB", hint: "e.g. 20"),
                FormulaInput("NF of Stage 2",   symbol: "NF2", unit: "dB", hint: "e.g. 5")
            ],
            output: FormulaOutput("Total Noise Figure", symbol: "NF_tot", unit: "dB"),
            calculate: { i in
                guard let nf1 = i["NF1"],
                      let g1  = i["G1"],
                      let nf2 = i["NF2"] else { return nil }
                let F1     = pow(10.0, nf1 / 10.0)
                let G1lin  = pow(10.0, g1  / 10.0)
                let F2     = pow(10.0, nf2 / 10.0)
                return 10.0 * log10(F1 + (F2 - 1.0) / G1lin)
            }
        )
    ]

    // ─────────────────────────────────────────────────
    // MARK: Antenna Design
    // ─────────────────────────────────────────────────

    static let antenna: [Formula] = [

        Formula(
            name: "Half-Wave Dipole Length (feet)",
            category: .antenna,
            description: "Resonant half-wave dipole length including velocity factor correction.",
            formulaDisplay: "L(ft) = 468 / f(MHz)",
            notes: "The 468 factor accounts for ~0.95 VF vs theoretical 492. Each leg = L/2.",
            inputs: [
                FormulaInput("Frequency", symbol: "f", unit: "MHz", hint: "e.g. 146")
            ],
            output: FormulaOutput("Dipole Length", symbol: "L", unit: "ft"),
            calculate: { i in
                guard let f = i["f"], f > 0 else { return nil }
                return 468.0 / f
            }
        ),

        Formula(
            name: "Half-Wave Dipole Length (meters)",
            category: .antenna,
            description: "Resonant half-wave dipole length in meters.",
            formulaDisplay: "L(m) = 142.65 / f(MHz)",
            notes: "Equivalent to 468/f in feet. Trim and tune for best SWR.",
            inputs: [
                FormulaInput("Frequency", symbol: "f", unit: "MHz", hint: "e.g. 146")
            ],
            output: FormulaOutput("Dipole Length", symbol: "L", unit: "m"),
            calculate: { i in
                guard let f = i["f"], f > 0 else { return nil }
                return 142.65 / f
            }
        ),

        Formula(
            name: "Quarter-Wave Vertical (feet)",
            category: .antenna,
            description: "Resonant quarter-wave vertical antenna length.",
            formulaDisplay: "L(ft) = 234 / f(MHz)",
            notes: "Requires ground plane or elevated radials. Common for mobile VHF/UHF.",
            inputs: [
                FormulaInput("Frequency", symbol: "f", unit: "MHz", hint: "e.g. 146")
            ],
            output: FormulaOutput("Vertical Length", symbol: "L", unit: "ft"),
            calculate: { i in
                guard let f = i["f"], f > 0 else { return nil }
                return 234.0 / f
            }
        ),

        Formula(
            name: "Antenna Effective Aperture",
            category: .antenna,
            description: "Equivalent capture area of an antenna — the area it appears to collect power from.",
            formulaDisplay: "Ae = (G · λ²) / (4π)",
            notes: "G is linear (not dBi). Larger Ae = more received power for same power density.",
            inputs: [
                FormulaInput("Antenna Gain", symbol: "G",  unit: "dBi", hint: "e.g. 10"),
                FormulaInput("Frequency",    symbol: "f",  unit: "MHz", hint: "e.g. 1000")
            ],
            output: FormulaOutput("Effective Aperture", symbol: "Ae", unit: "m²"),
            calculate: { i in
                guard let g_dBi = i["G"],
                      let f     = i["f"], f > 0 else { return nil }
                let G      = pow(10.0, g_dBi / 10.0)
                let lambda = 299.792458 / f          // meters (f in MHz)
                return (G * lambda * lambda) / (4.0 * Double.pi)
            }
        ),

        Formula(
            name: "Parabolic Dish Gain",
            category: .antenna,
            description: "Gain of a parabolic dish antenna given diameter and frequency.",
            formulaDisplay: "G(dBi) = 10·log₁₀(η · (πD/λ)²)",
            notes: "Efficiency η typically 0.55–0.70. Larger dish or higher frequency = more gain.",
            inputs: [
                FormulaInput("Dish Diameter", symbol: "D",  unit: "m",  hint: "e.g. 1.2"),
                FormulaInput("Frequency",     symbol: "f",  unit: "GHz", hint: "e.g. 10"),
                FormulaInput("Efficiency",    symbol: "η",  unit: "",   hint: "0.55–0.70", defaultValue: 0.6)
            ],
            output: FormulaOutput("Antenna Gain", symbol: "G", unit: "dBi"),
            calculate: { i in
                guard let D   = i["D"],  D   > 0,
                      let f   = i["f"],  f   > 0,
                      let eta = i["η"],  eta > 0 else { return nil }
                let lambda = 0.3 / f        // meters (f in GHz)
                let G      = eta * pow(Double.pi * D / lambda, 2.0)
                return 10.0 * log10(G)
            }
        ),

        Formula(
            name: "Half-Power Beamwidth (Dish)",
            category: .antenna,
            description: "Approximate 3 dB beamwidth of a circular aperture antenna.",
            formulaDisplay: "HPBW ≈ 70 · λ / D  (degrees)",
            notes: "Constant varies 65–75 depending on illumination taper. Narrower beam = higher gain.",
            inputs: [
                FormulaInput("Dish Diameter", symbol: "D", unit: "m",   hint: "e.g. 1.2"),
                FormulaInput("Frequency",     symbol: "f", unit: "GHz", hint: "e.g. 10")
            ],
            output: FormulaOutput("Beamwidth", symbol: "HPBW", unit: "degrees"),
            calculate: { i in
                guard let D = i["D"], D > 0,
                      let f = i["f"], f > 0 else { return nil }
                let lambda = 0.3 / f
                return 70.0 * lambda / D
            }
        )
    ]

    // ─────────────────────────────────────────────────
    // MARK: Radar Systems
    // ─────────────────────────────────────────────────

    static let radar: [Formula] = [

        Formula(
            name: "Radar Range Equation",
            category: .radar,
            description: "Maximum detection range for a monostatic pulse radar.",
            formulaDisplay: "R = ⁴√[ Pt · G² · λ² · σ / ((4π)³ · Smin) ]",
            notes: "Smin = kTBFLoss·SNRmin. RCS σ in m² (0 dBsm = 1 m²). All linear values.",
            inputs: [
                FormulaInput("Peak TX Power",             symbol: "Pt",   unit: "W",   hint: "e.g. 1e6"),
                FormulaInput("Antenna Gain",              symbol: "G",    unit: "dBi", hint: "e.g. 30"),
                FormulaInput("Frequency",                 symbol: "f",    unit: "GHz", hint: "e.g. 10"),
                FormulaInput("Radar Cross Section (RCS)", symbol: "σ",    unit: "m²",  hint: "e.g. 1"),
                FormulaInput("Min Detectable Signal",     symbol: "Smin", unit: "dBm", hint: "e.g. -100")
            ],
            output: FormulaOutput("Maximum Range", symbol: "R", unit: "km"),
            calculate: { i in
                guard let Pt   = i["Pt"],   Pt   > 0,
                      let Gdbi = i["G"],
                      let f    = i["f"],    f    > 0,
                      let sig  = i["σ"],    sig  > 0,
                      let Sdbm = i["Smin"] else { return nil }
                let G      = pow(10.0, Gdbi / 10.0)
                let lam    = 0.3 / f                     // meters (f in GHz)
                let Smin   = pow(10.0, Sdbm / 10.0) / 1000.0  // watts
                let num    = Pt * G * G * lam * lam * sig
                let den    = pow(4.0 * Double.pi, 3.0) * Smin
                return pow(num / den, 0.25) / 1000.0    // km
            }
        ),

        Formula(
            name: "Maximum Unambiguous Range",
            category: .radar,
            description: "Farthest range target that won't fold back to a false range.",
            formulaDisplay: "R_ua = c / (2 · PRF)",
            notes: "Targets beyond R_ua appear at aliased (shorter) ranges. Low PRF = long range.",
            inputs: [
                FormulaInput("Pulse Repetition Frequency", symbol: "PRF", unit: "Hz", hint: "e.g. 1000")
            ],
            output: FormulaOutput("Max Unambiguous Range", symbol: "R_ua", unit: "km"),
            calculate: { i in
                guard let PRF = i["PRF"], PRF > 0 else { return nil }
                return 2.998e8 / (2.0 * PRF * 1000.0)  // km
            }
        ),

        Formula(
            name: "Range Resolution",
            category: .radar,
            description: "Minimum separation between two targets to be resolved in range.",
            formulaDisplay: "ΔR = c · τ / 2",
            notes: "Shorter pulse width → finer resolution. LFM/chirp uses compressed pulse width.",
            inputs: [
                FormulaInput("Pulse Width", symbol: "τ", unit: "μs", hint: "e.g. 1")
            ],
            output: FormulaOutput("Range Resolution", symbol: "ΔR", unit: "m"),
            calculate: { i in
                guard let tau = i["τ"], tau > 0 else { return nil }
                return 2.998e8 * (tau * 1e-6) / 2.0
            }
        ),

        Formula(
            name: "Duty Cycle",
            category: .radar,
            description: "Fraction of time the radar transmitter is on.",
            formulaDisplay: "DC = τ · PRF",
            notes: "Typical pulse radar: 0.1–5%. CW radar: 100%. Affects avg power and blind zones.",
            inputs: [
                FormulaInput("Pulse Width", symbol: "τ",   unit: "μs", hint: "e.g. 1"),
                FormulaInput("PRF",         symbol: "PRF", unit: "Hz", hint: "e.g. 1000")
            ],
            output: FormulaOutput("Duty Cycle", symbol: "DC", unit: "%"),
            calculate: { i in
                guard let tau = i["τ"], tau > 0,
                      let PRF = i["PRF"], PRF > 0 else { return nil }
                return tau * 1e-6 * PRF * 100.0
            }
        ),

        Formula(
            name: "Average Transmit Power",
            category: .radar,
            description: "Average power output of a pulsed radar transmitter.",
            formulaDisplay: "P_avg = P_peak · τ · PRF",
            notes: "Determines thermal load. High-duty-cycle modes like CPI/burst can stress the PA.",
            inputs: [
                FormulaInput("Peak Power", symbol: "Pp",  unit: "kW", hint: "e.g. 100"),
                FormulaInput("Pulse Width", symbol: "τ",  unit: "μs", hint: "e.g. 1"),
                FormulaInput("PRF",         symbol: "PRF", unit: "Hz", hint: "e.g. 1000")
            ],
            output: FormulaOutput("Average Power", symbol: "P_avg", unit: "W"),
            calculate: { i in
                guard let Pp  = i["Pp"],  Pp  > 0,
                      let tau = i["τ"],   tau > 0,
                      let PRF = i["PRF"], PRF > 0 else { return nil }
                return Pp * 1000.0 * tau * 1e-6 * PRF
            }
        ),

        Formula(
            name: "Doppler Frequency Shift",
            category: .radar,
            description: "Frequency shift of a radar return due to target radial velocity.",
            formulaDisplay: "f_d = 2 · v_r · f₀ / c",
            notes: "Factor of 2 for the two-way path. f_d > 0 = approaching, < 0 = receding.",
            inputs: [
                FormulaInput("Radial Velocity", symbol: "vr", unit: "m/s", hint: "e.g. 100"),
                FormulaInput("TX Frequency",    symbol: "f0", unit: "GHz", hint: "e.g. 10")
            ],
            output: FormulaOutput("Doppler Shift", symbol: "f_d", unit: "Hz"),
            calculate: { i in
                guard let vr = i["vr"],
                      let f0 = i["f0"], f0 > 0 else { return nil }
                return 2.0 * vr * (f0 * 1e9) / 2.998e8
            }
        ),

        Formula(
            name: "Target Velocity from Doppler",
            category: .radar,
            description: "Radial velocity computed from a measured Doppler shift.",
            formulaDisplay: "v_r = f_d · c / (2 · f₀)",
            notes: "Measures the line-of-sight (radial) component only. Cross-range velocity is invisible.",
            inputs: [
                FormulaInput("Doppler Shift", symbol: "fd", unit: "Hz",  hint: "e.g. 1000"),
                FormulaInput("TX Frequency",  symbol: "f0", unit: "GHz", hint: "e.g. 10")
            ],
            output: FormulaOutput("Radial Velocity", symbol: "v_r", unit: "m/s"),
            calculate: { i in
                guard let fd = i["fd"],
                      let f0 = i["f0"], f0 > 0 else { return nil }
                return fd * 2.998e8 / (2.0 * f0 * 1e9)
            }
        ),

        Formula(
            name: "Max Unambiguous Velocity",
            category: .radar,
            description: "Fastest radial velocity measurable without Doppler aliasing.",
            formulaDisplay: "v_max = PRF · λ / 4",
            notes: "Range–Doppler ambiguity: high PRF gives velocity but loses range; low PRF vice versa.",
            inputs: [
                FormulaInput("PRF",       symbol: "PRF", unit: "Hz",  hint: "e.g. 10000"),
                FormulaInput("Frequency", symbol: "f",   unit: "GHz", hint: "e.g. 10")
            ],
            output: FormulaOutput("Max Velocity", symbol: "v_max", unit: "m/s"),
            calculate: { i in
                guard let PRF = i["PRF"], PRF > 0,
                      let f   = i["f"],   f   > 0 else { return nil }
                let lambda = 0.3 / f
                return PRF * lambda / 4.0
            }
        ),

        Formula(
            name: "Radar Horizon (Line of Sight)",
            category: .radar,
            description: "Maximum radar range limited by Earth's curvature using 4/3 Earth model.",
            formulaDisplay: "R(km) = 4.12 · (√h_t + √h_r)",
            notes: "Heights in meters. 4/3 Earth model accounts for standard atmospheric refraction.",
            inputs: [
                FormulaInput("Transmitter Height", symbol: "ht", unit: "m", hint: "e.g. 30"),
                FormulaInput("Target Height",      symbol: "hr", unit: "m", hint: "e.g. 0", defaultValue: 0)
            ],
            output: FormulaOutput("Radar Horizon", symbol: "R", unit: "km"),
            calculate: { i in
                guard let ht = i["ht"], ht >= 0,
                      let hr = i["hr"], hr >= 0 else { return nil }
                return 4.12 * (sqrt(ht) + sqrt(hr))
            }
        ),

        Formula(
            name: "Pulse Compression Ratio",
            category: .radar,
            description: "Time-bandwidth product of an LFM (chirp) waveform — SNR improvement over uncompressed pulse.",
            formulaDisplay: "PCR = B · τ",
            notes: "Also equals compressed / uncompressed pulse width ratio. Typical: 10–10,000.",
            inputs: [
                FormulaInput("Chirp Bandwidth", symbol: "B", unit: "MHz", hint: "e.g. 100"),
                FormulaInput("Pulse Width",     symbol: "τ", unit: "μs",  hint: "e.g. 100")
            ],
            output: FormulaOutput("Compression Ratio", symbol: "PCR", unit: ""),
            calculate: { i in
                guard let B   = i["B"],   B   > 0,
                      let tau = i["τ"],   tau > 0 else { return nil }
                return B * 1e6 * tau * 1e-6
            }
        ),

        Formula(
            name: "FMCW Beat Frequency → Range",
            category: .radar,
            description: "Convert the IF beat frequency of an FMCW radar to target range.",
            formulaDisplay: "R = (f_b · c · T_sweep) / (2 · Δf)",
            notes: "T_sweep = chirp repeat period. Δf = total sweep bandwidth. Assumes linear chirp.",
            inputs: [
                FormulaInput("Beat Frequency",    symbol: "fb",  unit: "kHz", hint: "e.g. 100"),
                FormulaInput("Sweep Period",      symbol: "Tsw", unit: "ms",  hint: "e.g. 1"),
                FormulaInput("Sweep Bandwidth",   symbol: "Δf",  unit: "MHz", hint: "e.g. 100")
            ],
            output: FormulaOutput("Target Range", symbol: "R", unit: "m"),
            calculate: { i in
                guard let fb  = i["fb"],  fb  > 0,
                      let Tsw = i["Tsw"], Tsw > 0,
                      let df  = i["Δf"],  df  > 0 else { return nil }
                return (fb * 1e3 * 2.998e8 * Tsw * 1e-3) / (2.0 * df * 1e6)
            }
        ),

        Formula(
            name: "Radar SNR at Range",
            category: .radar,
            description: "Signal-to-noise ratio for a monostatic radar at a specified target range.",
            formulaDisplay: "SNR = (Pt·G²·λ²·σ) / ((4π)³·R⁴·k·T·B·F·L)",
            notes: "F = linear noise figure, L = linear system+path losses. SNR ≥ ~13 dB for Pd=0.9.",
            inputs: [
                FormulaInput("Peak Power",     symbol: "Pt",  unit: "kW",  hint: "e.g. 100"),
                FormulaInput("Antenna Gain",   symbol: "G",   unit: "dBi", hint: "e.g. 30"),
                FormulaInput("Frequency",      symbol: "f",   unit: "GHz", hint: "e.g. 10"),
                FormulaInput("RCS",            symbol: "σ",   unit: "m²",  hint: "e.g. 1"),
                FormulaInput("Range",          symbol: "R",   unit: "km",  hint: "e.g. 100"),
                FormulaInput("Bandwidth",      symbol: "B",   unit: "MHz", hint: "e.g. 1"),
                FormulaInput("Noise Figure",   symbol: "NF",  unit: "dB",  hint: "e.g. 3"),
                FormulaInput("System Losses",  symbol: "L",   unit: "dB",  hint: "e.g. 3")
            ],
            output: FormulaOutput("SNR", symbol: "SNR", unit: "dB"),
            calculate: { i in
                guard let Pt_kW = i["Pt"],  Pt_kW > 0,
                      let Gdbi  = i["G"],
                      let f_GHz = i["f"],   f_GHz > 0,
                      let sig   = i["σ"],   sig   > 0,
                      let R_km  = i["R"],   R_km  > 0,
                      let B_MHz = i["B"],   B_MHz > 0,
                      let NF_dB = i["NF"],
                      let L_dB  = i["L"]  else { return nil }
                let Pt  = Pt_kW * 1000.0
                let G   = pow(10.0, Gdbi  / 10.0)
                let lam = 0.3 / f_GHz
                let R   = R_km  * 1000.0
                let B   = B_MHz * 1e6
                let F   = pow(10.0, NF_dB / 10.0)
                let L   = pow(10.0, L_dB  / 10.0)
                let k   = 1.380649e-23
                let T   = 290.0
                let num = Pt * G * G * lam * lam * sig
                let den = pow(4.0 * Double.pi, 3.0) * pow(R, 4.0) * k * T * B * F * L
                return 10.0 * log10(num / den)
            }
        )
    ]

    // ─────────────────────────────────────────────────
    // MARK: Electronic Warfare
    // ─────────────────────────────────────────────────

    static let electronicWarfare: [Formula] = [

        Formula(
            name: "Free Space Path Loss",
            category: .electronicWarfare,
            description: "Attenuation of an RF signal propagating through free space.",
            formulaDisplay: "FSPL(dB) = 32.44 + 20·log₁₀(f_MHz) + 20·log₁₀(d_km)",
            notes: "Increases 6 dB per octave (×2) of distance or frequency. No terrain/atmosphere.",
            inputs: [
                FormulaInput("Frequency", symbol: "f", unit: "MHz", hint: "e.g. 1000"),
                FormulaInput("Distance",  symbol: "d", unit: "km",  hint: "e.g. 10")
            ],
            output: FormulaOutput("Path Loss", symbol: "FSPL", unit: "dB"),
            calculate: { i in
                guard let f = i["f"], f > 0,
                      let d = i["d"], d > 0 else { return nil }
                return 32.44 + 20.0 * log10(f) + 20.0 * log10(d)
            }
        ),

        Formula(
            name: "EIRP (Effective Isotropic Radiated Power)",
            category: .electronicWarfare,
            description: "Total power radiated in the boresight direction of the antenna.",
            formulaDisplay: "EIRP(dBm) = P_tx + G_tx − L_cable",
            notes: "ERP (referenced to half-wave dipole) = EIRP − 2.15 dB.",
            inputs: [
                FormulaInput("TX Power",     symbol: "Ptx", unit: "dBm", hint: "e.g. 43"),
                FormulaInput("TX Gain",      symbol: "Gtx", unit: "dBi", hint: "e.g. 10"),
                FormulaInput("Cable Loss",   symbol: "Lc",  unit: "dB",  hint: "e.g. 2", defaultValue: 0)
            ],
            output: FormulaOutput("EIRP", symbol: "EIRP", unit: "dBm"),
            calculate: { i in
                guard let Ptx = i["Ptx"], let Gtx = i["Gtx"], let Lc = i["Lc"] else { return nil }
                return Ptx + Gtx - Lc
            }
        ),

        Formula(
            name: "Power Density at Range",
            category: .electronicWarfare,
            description: "RF power density (Poynting flux) at a given distance from an emitter.",
            formulaDisplay: "S = P_tx · G_tx / (4π · R²)",
            notes: "Compare to MPE limits: 10 mW/cm² (occupational) at microwave. 1 W/m² = 0.1 mW/cm².",
            inputs: [
                FormulaInput("TX Power",   symbol: "Ptx", unit: "W",   hint: "e.g. 100"),
                FormulaInput("TX Gain",    symbol: "Gtx", unit: "dBi", hint: "e.g. 0"),
                FormulaInput("Range",      symbol: "R",   unit: "km",  hint: "e.g. 10")
            ],
            output: FormulaOutput("Power Density", symbol: "S", unit: "mW/m²"),
            calculate: { i in
                guard let Ptx = i["Ptx"], Ptx > 0,
                      let Gdbi = i["Gtx"],
                      let R_km = i["R"],   R_km > 0 else { return nil }
                let G = pow(10.0, Gdbi / 10.0)
                let R = R_km * 1000.0
                return (Ptx * G / (4.0 * Double.pi * R * R)) * 1000.0
            }
        ),

        Formula(
            name: "Received Signal Power (Friis)",
            category: .electronicWarfare,
            description: "Power delivered to a receiver antenna given transmitter parameters.",
            formulaDisplay: "Pr = Pt + Gt + Gr − FSPL",
            notes: "All in dB/dBm. FSPL = 32.44 + 20log(f_MHz) + 20log(d_km).",
            inputs: [
                FormulaInput("TX Power",   symbol: "Pt", unit: "dBm", hint: "e.g. 30"),
                FormulaInput("TX Gain",    symbol: "Gt", unit: "dBi", hint: "e.g. 10"),
                FormulaInput("RX Gain",    symbol: "Gr", unit: "dBi", hint: "e.g. 0"),
                FormulaInput("Frequency",  symbol: "f",  unit: "MHz", hint: "e.g. 1000"),
                FormulaInput("Distance",   symbol: "d",  unit: "km",  hint: "e.g. 10")
            ],
            output: FormulaOutput("Received Power", symbol: "Pr", unit: "dBm"),
            calculate: { i in
                guard let Pt = i["Pt"], let Gt = i["Gt"], let Gr = i["Gr"],
                      let f  = i["f"], f > 0,
                      let d  = i["d"], d > 0 else { return nil }
                let FSPL = 32.44 + 20.0 * log10(f) + 20.0 * log10(d)
                return Pt + Gt + Gr - FSPL
            }
        ),

        Formula(
            name: "Jamming-to-Signal Ratio (J/S)",
            category: .electronicWarfare,
            description: "Ratio of jammer power to radar target-return power at the radar receiver (monostatic).",
            formulaDisplay: "J/S(dB) = ERPj − ERPt + 40·log(Rt) − 20·log(Rj) + 10.99 − σ_dBsm",
            notes: "Self-protection (Rt=Rj): simplifies. J/S > 0 dB means jammer is winning.",
            inputs: [
                FormulaInput("Jammer ERP",             symbol: "ERPj",  unit: "dBm",  hint: "Pj+Gj"),
                FormulaInput("Radar ERP",              symbol: "ERPt",  unit: "dBm",  hint: "Pt+Gt"),
                FormulaInput("Radar–Target Range",     symbol: "Rt",    unit: "km",   hint: "e.g. 100"),
                FormulaInput("Radar–Jammer Range",     symbol: "Rj",    unit: "km",   hint: "e.g. 100"),
                FormulaInput("Target RCS",             symbol: "σ",     unit: "dBsm", hint: "e.g. 0")
            ],
            output: FormulaOutput("J/S Ratio", symbol: "J/S", unit: "dB"),
            calculate: { i in
                guard let ERPj = i["ERPj"], let ERPt = i["ERPt"],
                      let Rt   = i["Rt"],   Rt > 0,
                      let Rj   = i["Rj"],   Rj > 0,
                      let sig  = i["σ"]  else { return nil }
                let Rt_m = Rt * 1000.0
                let Rj_m = Rj * 1000.0
                // Monostatic derivation: signal ∝ 1/Rt⁴, jammer ∝ 1/Rj²
                return ERPj - ERPt + 40.0 * log10(Rt_m) - 20.0 * log10(Rj_m) + 10.99 - sig
            }
        ),

        Formula(
            name: "Burn-Through Range",
            category: .electronicWarfare,
            description: "Range at which radar SNR exceeds J/S — the jammer can no longer protect.",
            formulaDisplay: "R_bt = Rj · √(ERPt_lin / (ERPj_lin · JS_req_lin))",
            notes: "JS_req is the minimum J/S for effective jamming. Set JS_req = 0 dB for break-even.",
            inputs: [
                FormulaInput("Jammer–Radar Range",  symbol: "Rj",    unit: "km", hint: "e.g. 100"),
                FormulaInput("Radar ERP",           symbol: "ERPt",  unit: "dBm", hint: "Pt+Gt"),
                FormulaInput("Jammer ERP",          symbol: "ERPj",  unit: "dBm", hint: "Pj+Gj"),
                FormulaInput("Required J/S",        symbol: "JSreq", unit: "dB",  hint: "e.g. 0", defaultValue: 0)
            ],
            output: FormulaOutput("Burn-Through Range", symbol: "R_bt", unit: "km"),
            calculate: { i in
                guard let Rj    = i["Rj"],    Rj > 0,
                      let ERPt  = i["ERPt"],
                      let ERPj  = i["ERPj"],
                      let JSdB  = i["JSreq"] else { return nil }
                let Pt_lin = pow(10.0, ERPt / 10.0)
                let Pj_lin = pow(10.0, ERPj / 10.0)
                let JS_lin = pow(10.0, JSdB / 10.0)
                return Rj * sqrt(Pt_lin / (Pj_lin * JS_lin))
            }
        ),

        Formula(
            name: "One-Way Intercept Range",
            category: .electronicWarfare,
            description: "Maximum range at which an ES/SIGINT receiver can detect an emitter.",
            formulaDisplay: "Ri = √[ EIRP · Gr · λ² / (4π · Smin) ]",
            notes: "One-way (R²) vs radar's two-way (R⁴) gives SIGINT huge range advantage.",
            inputs: [
                FormulaInput("Emitter EIRP",      symbol: "EIRP",  unit: "dBm", hint: "e.g. 60"),
                FormulaInput("Intercept Ant Gain",symbol: "Gr",    unit: "dBi", hint: "e.g. 0"),
                FormulaInput("Frequency",         symbol: "f",     unit: "MHz", hint: "e.g. 1000"),
                FormulaInput("Receiver Sensitivity",symbol: "Smin", unit: "dBm", hint: "e.g. -90")
            ],
            output: FormulaOutput("Intercept Range", symbol: "Ri", unit: "km"),
            calculate: { i in
                guard let EIRP_dBm = i["EIRP"],
                      let Gr_dBi   = i["Gr"],
                      let f_MHz    = i["f"],   f_MHz > 0,
                      let Smin_dBm = i["Smin"] else { return nil }
                let P_eirp = pow(10.0, EIRP_dBm / 10.0) / 1000.0
                let Gr     = pow(10.0, Gr_dBi   / 10.0)
                let lam    = 299.792458 / f_MHz
                let Smin   = pow(10.0, Smin_dBm / 10.0) / 1000.0
                let R_m    = sqrt((P_eirp * Gr * lam * lam) / (4.0 * Double.pi * Smin))
                return R_m / 1000.0
            }
        ),

        Formula(
            name: "TDOA Range Difference",
            category: .electronicWarfare,
            description: "Convert time-difference-of-arrival measurement to a range difference for geolocation.",
            formulaDisplay: "ΔD = Δt · c",
            notes: "Produces a hyperbolic line of position. Two TDOAs give a 2-D fix.",
            inputs: [
                FormulaInput("Time Difference", symbol: "Δt", unit: "μs", hint: "e.g. 3.33")
            ],
            output: FormulaOutput("Range Difference", symbol: "ΔD", unit: "m"),
            calculate: { i in
                guard let dt = i["Δt"] else { return nil }
                return dt * 1e-6 * 2.998e8
            }
        )
    ]

    // ─────────────────────────────────────────────────
    // MARK: SIGINT
    // ─────────────────────────────────────────────────

    static let sigint: [Formula] = [

        Formula(
            name: "Carson's Rule (FM Bandwidth)",
            category: .sigint,
            description: "Approximate 98% power bandwidth of an FM signal.",
            formulaDisplay: "BW = 2 · (Δf + f_m)",
            notes: "Δf = peak freq deviation, f_m = highest modulating frequency. β = Δf/f_m.",
            inputs: [
                FormulaInput("Peak Freq Deviation",   symbol: "Δf", unit: "kHz", hint: "e.g. 75"),
                FormulaInput("Max Modulating Freq",   symbol: "fm", unit: "kHz", hint: "e.g. 15")
            ],
            output: FormulaOutput("Signal Bandwidth", symbol: "BW", unit: "kHz"),
            calculate: { i in
                guard let df = i["Δf"],
                      let fm = i["fm"], fm > 0 else { return nil }
                return 2.0 * (df + fm)
            }
        ),

        Formula(
            name: "FM Modulation Index",
            category: .sigint,
            description: "Ratio of frequency deviation to modulating frequency.",
            formulaDisplay: "β = Δf / f_m",
            notes: "β < 0.25 ≈ narrowband FM. β >> 1 = wideband FM. Affects spectral efficiency.",
            inputs: [
                FormulaInput("Freq Deviation",  symbol: "Δf", unit: "kHz", hint: "e.g. 75"),
                FormulaInput("Modulating Freq", symbol: "fm", unit: "kHz", hint: "e.g. 15")
            ],
            output: FormulaOutput("Modulation Index", symbol: "β", unit: ""),
            calculate: { i in
                guard let df = i["Δf"],
                      let fm = i["fm"], fm > 0 else { return nil }
                return df / fm
            }
        ),

        Formula(
            name: "Nyquist Sampling Rate",
            category: .sigint,
            description: "Minimum sample rate required to reconstruct a bandlimited signal.",
            formulaDisplay: "f_s ≥ 2 · f_max",
            notes: "In practice use 2.5–3× for real filters. SDR often samples at 2–4× bandwidth.",
            inputs: [
                FormulaInput("Max Signal Frequency", symbol: "fmax", unit: "MHz", hint: "e.g. 10")
            ],
            output: FormulaOutput("Minimum Sample Rate", symbol: "f_s", unit: "Msps"),
            calculate: { i in
                guard let fmax = i["fmax"], fmax > 0 else { return nil }
                return 2.0 * fmax
            }
        ),

        Formula(
            name: "Probability of Intercept",
            category: .sigint,
            description: "Probability of detecting a pulsed emitter with a scanning SIGINT receiver.",
            formulaDisplay: "POI = 1 − (1 − t_d/T_scan)^⌊T_scan/PRI⌋",
            notes: "Increase t_d (dwell) or decrease T_scan to improve POI.",
            inputs: [
                FormulaInput("Dwell Time / Channel", symbol: "td",  unit: "ms", hint: "e.g. 1"),
                FormulaInput("Scan Period",          symbol: "Ts",  unit: "ms", hint: "e.g. 100"),
                FormulaInput("Emitter PRI",          symbol: "PRI", unit: "ms", hint: "e.g. 2")
            ],
            output: FormulaOutput("POI", symbol: "POI", unit: "%"),
            calculate: { i in
                guard let td  = i["td"],  td  > 0,
                      let Ts  = i["Ts"],  Ts  > 0,
                      let PRI = i["PRI"], PRI > 0 else { return nil }
                let n   = Int(max(1.0, Ts / PRI))
                let poi = 1.0 - pow(1.0 - td / Ts, Double(n))
                return min(poi * 100.0, 100.0)
            }
        ),

        Formula(
            name: "Receiver SNR",
            category: .sigint,
            description: "Signal-to-noise ratio at a receiver given received power and system noise.",
            formulaDisplay: "SNR = Pr − (−174 + NF + 10·log B)",
            notes: "SNR ≥ ~10 dB for reliable demodulation of most waveforms.",
            inputs: [
                FormulaInput("Received Power",  symbol: "Pr",  unit: "dBm", hint: "e.g. -80"),
                FormulaInput("Noise Figure",    symbol: "NF",  unit: "dB",  hint: "e.g. 5"),
                FormulaInput("Bandwidth",       symbol: "B",   unit: "MHz", hint: "e.g. 0.2")
            ],
            output: FormulaOutput("SNR", symbol: "SNR", unit: "dB"),
            calculate: { i in
                guard let Pr = i["Pr"],
                      let NF = i["NF"],
                      let B  = i["B"], B > 0 else { return nil }
                let Nfloor = -174.0 + NF + 10.0 * log10(B * 1e6)
                return Pr - Nfloor
            }
        )
    ]

    // ─────────────────────────────────────────────────
    // MARK: Link Budget
    // ─────────────────────────────────────────────────

    static let linkBudget: [Formula] = [

        Formula(
            name: "Simple RF Link Budget",
            category: .linkBudget,
            description: "End-to-end received power including all gains and losses.",
            formulaDisplay: "Pr = Pt + Gt − FSPL + Gr − L_sys",
            notes: "FSPL is computed from frequency and distance. Add SNR_min to get sensitivity requirement.",
            inputs: [
                FormulaInput("TX Power",      symbol: "Pt",  unit: "dBm", hint: "e.g. 30"),
                FormulaInput("TX Ant Gain",   symbol: "Gt",  unit: "dBi", hint: "e.g. 10"),
                FormulaInput("Frequency",     symbol: "f",   unit: "MHz", hint: "e.g. 915"),
                FormulaInput("Distance",      symbol: "d",   unit: "km",  hint: "e.g. 1"),
                FormulaInput("RX Ant Gain",   symbol: "Gr",  unit: "dBi", hint: "e.g. 0"),
                FormulaInput("System Losses", symbol: "Ls",  unit: "dB",  hint: "cables, splitters", defaultValue: 0)
            ],
            output: FormulaOutput("Received Power", symbol: "Pr", unit: "dBm"),
            calculate: { i in
                guard let Pt = i["Pt"], let Gt = i["Gt"],
                      let f  = i["f"], f > 0,
                      let d  = i["d"], d > 0,
                      let Gr = i["Gr"],
                      let Ls = i["Ls"] else { return nil }
                let FSPL = 32.44 + 20.0 * log10(f) + 20.0 * log10(d)
                return Pt + Gt - FSPL + Gr - Ls
            }
        ),

        Formula(
            name: "Link Margin",
            category: .linkBudget,
            description: "Headroom above the minimum required signal level.",
            formulaDisplay: "LM = Pr − Sensitivity",
            notes: "Positive margin = link works. Rules of thumb: voice 3 dB, data 10 dB, EW 20 dB.",
            inputs: [
                FormulaInput("Received Power",      symbol: "Pr",   unit: "dBm", hint: "e.g. -80"),
                FormulaInput("Receiver Sensitivity", symbol: "Sens", unit: "dBm", hint: "e.g. -95")
            ],
            output: FormulaOutput("Link Margin", symbol: "LM", unit: "dB"),
            calculate: { i in
                guard let Pr   = i["Pr"],
                      let Sens = i["Sens"] else { return nil }
                return Pr - Sens
            }
        ),

        Formula(
            name: "Two-Ray Ground Reflection Path Loss",
            category: .linkBudget,
            description: "Path loss when both direct and ground-reflected rays are significant (low elevation).",
            formulaDisplay: "PL(dB) = 40·log(d) − 20·log(h_t) − 20·log(h_r)",
            notes: "Valid when d >> ht, hr. R⁴ loss dominates over FSPL at long ground-level ranges.",
            inputs: [
                FormulaInput("Distance", symbol: "d",  unit: "km", hint: "e.g. 10"),
                FormulaInput("TX Height", symbol: "ht", unit: "m",  hint: "e.g. 10"),
                FormulaInput("RX Height", symbol: "hr", unit: "m",  hint: "e.g. 2")
            ],
            output: FormulaOutput("Path Loss", symbol: "PL", unit: "dB"),
            calculate: { i in
                guard let d  = i["d"],  d  > 0,
                      let ht = i["ht"], ht > 0,
                      let hr = i["hr"], hr > 0 else { return nil }
                return 40.0 * log10(d * 1000.0) - 20.0 * log10(ht) - 20.0 * log10(hr)
            }
        ),

        Formula(
            name: "Receiver Figure of Merit (G/T)",
            category: .linkBudget,
            description: "Satellite/phased-array receiver quality metric — gain minus noise temperature.",
            formulaDisplay: "G/T = Gr − 10·log₁₀(T_sys)",
            notes: "Higher G/T = better weak-signal performance. Used for sat-com and ESM receivers.",
            inputs: [
                FormulaInput("Antenna Gain",        symbol: "Gr",   unit: "dBi", hint: "e.g. 40"),
                FormulaInput("System Noise Temp",   symbol: "Tsys", unit: "K",   hint: "e.g. 200")
            ],
            output: FormulaOutput("G/T", symbol: "G/T", unit: "dB/K"),
            calculate: { i in
                guard let Gr   = i["Gr"],
                      let Tsys = i["Tsys"], Tsys > 0 else { return nil }
                return Gr - 10.0 * log10(Tsys)
            }
        )
    ]

    // ─────────────────────────────────────────────────
    // MARK: HAM Radio
    // ─────────────────────────────────────────────────

    static let ham: [Formula] = [

        Formula(
            name: "SWR from Reflection Coefficient",
            category: .ham,
            description: "Standing Wave Ratio computed from the complex reflection coefficient magnitude.",
            formulaDisplay: "SWR = (1 + |Γ|) / (1 − |Γ|)",
            notes: "Γ = (ZL − Z0)/(ZL + Z0). Perfect match: Γ=0, SWR=1:1. Open/short: SWR=∞.",
            inputs: [
                FormulaInput("Reflection Coefficient |Γ|", symbol: "Γ", unit: "", hint: "0.0 – 0.99")
            ],
            output: FormulaOutput("SWR", symbol: "SWR", unit: ":1"),
            calculate: { i in
                guard let g = i["Γ"], g >= 0, g < 1 else { return nil }
                return (1.0 + g) / (1.0 - g)
            }
        ),

        Formula(
            name: "Return Loss from SWR",
            category: .ham,
            description: "Power reflected back toward the transmitter expressed in dB.",
            formulaDisplay: "RL = 20·log₁₀((SWR + 1) / (SWR − 1))",
            notes: "RL 10 dB → SWR 1.92, RL 20 dB → SWR 1.22, RL 30 dB → SWR 1.07.",
            inputs: [
                FormulaInput("SWR", symbol: "SWR", unit: ":1", hint: "e.g. 2.0")
            ],
            output: FormulaOutput("Return Loss", symbol: "RL", unit: "dB"),
            calculate: { i in
                guard let swr = i["SWR"], swr > 1 else { return nil }
                return 20.0 * log10((swr + 1.0) / (swr - 1.0))
            }
        ),

        Formula(
            name: "Coax Physical Length (Velocity Factor)",
            category: .ham,
            description: "Physical cable length required to achieve a desired electrical length.",
            formulaDisplay: "L_phys = L_elec · VF",
            notes: "VF: RG-58=0.66, RG-8X=0.82, LMR-400=0.85, PTFE=0.70, air=1.0.",
            inputs: [
                FormulaInput("Electrical Length", symbol: "Le", unit: "m",  hint: "e.g. 0.3"),
                FormulaInput("Velocity Factor",   symbol: "VF", unit: "",   hint: "0.66–0.85", defaultValue: 0.66)
            ],
            output: FormulaOutput("Physical Length", symbol: "Lp", unit: "m"),
            calculate: { i in
                guard let Le = i["Le"], Le > 0,
                      let VF = i["VF"], VF > 0 else { return nil }
                return Le * VF
            }
        ),

        Formula(
            name: "Quarter-Wave Coax Impedance Transformer",
            category: .ham,
            description: "Required line impedance to match two different load impedances using a λ/4 section.",
            formulaDisplay: "Z_line = √(Z₁ · Z₂)",
            notes: "Example: 50Ω → 200Ω requires 100Ω line. Physical length = λ/4 × VF.",
            inputs: [
                FormulaInput("Impedance 1", symbol: "Z1", unit: "Ω", hint: "e.g. 50"),
                FormulaInput("Impedance 2", symbol: "Z2", unit: "Ω", hint: "e.g. 200")
            ],
            output: FormulaOutput("Required Line Impedance", symbol: "Z_line", unit: "Ω"),
            calculate: { i in
                guard let Z1 = i["Z1"], Z1 > 0,
                      let Z2 = i["Z2"], Z2 > 0 else { return nil }
                return sqrt(Z1 * Z2)
            }
        ),

        Formula(
            name: "Yagi Driven Element Length",
            category: .ham,
            description: "Driven element length for a Yagi-Uda array (slightly shorter than a free dipole).",
            formulaDisplay: "L(ft) = 454 / f(MHz)",
            notes: "Reflector ≈ 5% longer than driven; directors ≈ 5% shorter. Spacing ≈ 0.2λ.",
            inputs: [
                FormulaInput("Frequency", symbol: "f", unit: "MHz", hint: "e.g. 146")
            ],
            output: FormulaOutput("Driven Element Length", symbol: "L", unit: "ft"),
            calculate: { i in
                guard let f = i["f"], f > 0 else { return nil }
                return 454.0 / f
            }
        ),

        Formula(
            name: "RF Exposure Power Density (FCC)",
            category: .ham,
            description: "Power density in mW/cm² for FCC RF exposure (MPE) assessment.",
            formulaDisplay: "S = EIRP / (4π · R²) × 0.1",
            notes: "FCC general-population MPE: 1 mW/cm² at 30–300 MHz. Occupational: 5 mW/cm².",
            inputs: [
                FormulaInput("EIRP",     symbol: "EIRP", unit: "W", hint: "e.g. 100"),
                FormulaInput("Distance", symbol: "R",    unit: "m", hint: "e.g. 3")
            ],
            output: FormulaOutput("Power Density", symbol: "S", unit: "mW/cm²"),
            calculate: { i in
                guard let EIRP = i["EIRP"], EIRP > 0,
                      let R    = i["R"],    R    > 0 else { return nil }
                let S_Wm2 = EIRP / (4.0 * Double.pi * R * R)
                return S_Wm2 * 0.1          // W/m² → mW/cm²
            }
        )
    ]
}
