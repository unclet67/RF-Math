import SwiftUI
import Foundation

// MARK: - FormulaCategory

enum FormulaCategory: String, CaseIterable, Identifiable {
    case frequencyWavelength = "Frequency & Wavelength"
    case powerDecibels       = "Power & Decibels"
    case antenna             = "Antenna Design"
    case radar               = "Radar Systems"
    case electronicWarfare   = "Electronic Warfare"
    case sigint              = "SIGINT"
    case linkBudget          = "Link Budget"
    case ham                 = "HAM Radio"

    var id: String { rawValue }

    var systemImage: String {
        switch self {
        case .frequencyWavelength: return "waveform"
        case .powerDecibels:       return "bolt.fill"
        case .antenna:             return "antenna.radiowaves.left.and.right"
        case .radar:               return "scope"
        case .electronicWarfare:   return "shield.fill"
        case .sigint:              return "eye.fill"
        case .linkBudget:          return "link"
        case .ham:                 return "dot.radiowaves.left.and.right"
        }
    }

    var color: Color {
        switch self {
        case .frequencyWavelength: return .blue
        case .powerDecibels:       return .green
        case .antenna:             return .orange
        case .radar:               return Color(red: 0.85, green: 0.2, blue: 0.2)
        case .electronicWarfare:   return .purple
        case .sigint:              return Color(red: 0.8, green: 0.65, blue: 0.0)
        case .linkBudget:          return .cyan
        case .ham:                 return .mint
        }
    }

    var description: String {
        switch self {
        case .frequencyWavelength: return "Wavelength, frequency, period, and skin depth"
        case .powerDecibels:       return "dBm, dBW, noise figure, and thermal noise"
        case .antenna:             return "Dipole length, gain, aperture, and beamwidth"
        case .radar:               return "Range equation, Doppler, PRF, SNR, and FMCW"
        case .electronicWarfare:   return "FSPL, EIRP, J/S ratio, and burn-through range"
        case .sigint:              return "Intercept range, bandwidth, and POI"
        case .linkBudget:          return "End-to-end link analysis and margin"
        case .ham:                 return "SWR, coax, Yagi, and RF exposure"
        }
    }
}

// MARK: - FormulaInput

struct FormulaInput: Identifiable {
    let id        = UUID()
    let label:    String
    let symbol:   String
    let unit:     String
    let hint:     String
    let defaultValue: Double?

    init(_ label: String, symbol: String, unit: String,
         hint: String = "", defaultValue: Double? = nil) {
        self.label        = label
        self.symbol       = symbol
        self.unit         = unit
        self.hint         = hint
        self.defaultValue = defaultValue
    }
}

// MARK: - FormulaOutput

struct FormulaOutput {
    let label:  String
    let symbol: String
    let unit:   String

    init(_ label: String, symbol: String, unit: String) {
        self.label  = label
        self.symbol = symbol
        self.unit   = unit
    }
}

// MARK: - Formula

struct Formula: Identifiable {
    let id             = UUID()
    let name:          String
    let category:      FormulaCategory
    let description:   String
    let formulaDisplay: String
    let notes:         String
    let inputs:        [FormulaInput]
    let output:        FormulaOutput
    let calculate:     ([String: Double]) -> Double?
}
