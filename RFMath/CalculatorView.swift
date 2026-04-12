import SwiftUI

struct CalculatorView: View {
    let formula: Formula

    @State private var inputStrings: [String: String] = [:]
    @FocusState private var focusedField: String?

    private var parsedInputs: [String: Double] {
        var result: [String: Double] = [:]
        for input in formula.inputs {
            if let text = inputStrings[input.symbol],
               let value = Double(text.trimmingCharacters(in: .whitespaces)) {
                result[input.symbol] = value
            }
        }
        return result
    }

    private var calculatedResult: Double? {
        let parsed = parsedInputs
        guard parsed.count == formula.inputs.count else { return nil }
        return formula.calculate(parsed)
    }

    private var allInputsFilled: Bool {
        parsedInputs.count == formula.inputs.count
    }

    // ─────────────────────────────────────────────────

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {

                // Description
                Text(formula.description)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                // Formula display box
                formulaBox

                // Inputs
                inputSection

                // Result
                resultSection

                // Notes
                if !formula.notes.isEmpty {
                    notesSection
                }

                Spacer(minLength: 40)
            }
            .padding()
        }
        .navigationTitle(formula.name)
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { loadDefaults() }
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("Done") { focusedField = nil }
            }
        }
    }

    // MARK: - Subviews

    private var formulaBox: some View {
        HStack {
            Text(formula.formulaDisplay)
                .font(.system(.body, design: .monospaced))
                .foregroundStyle(formula.category.color)
                .multilineTextAlignment(.leading)
            Spacer()
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(
            formula.category.color.opacity(0.08),
            in: RoundedRectangle(cornerRadius: 12)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(formula.category.color.opacity(0.3), lineWidth: 1)
        )
    }

    private var inputSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Inputs")
                .font(.headline)
            ForEach(formula.inputs) { input in
                InputField(input: input,
                           text: binding(for: input.symbol),
                           color: formula.category.color,
                           focusedField: $focusedField)
            }
        }
    }

    private var resultSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Result")
                .font(.headline)

            Group {
                if let result = calculatedResult {
                    HStack(alignment: .firstTextBaseline, spacing: 8) {
                        Text(formula.output.symbol)
                            .font(.system(.title3, design: .monospaced))
                            .foregroundStyle(.secondary)
                        Text("=")
                            .foregroundStyle(.secondary)
                        Text(formatResult(result))
                            .font(.system(.title, design: .monospaced).bold())
                            .foregroundStyle(formula.category.color)
                            .minimumScaleFactor(0.5)
                        Text(formula.output.unit)
                            .font(.headline)
                            .foregroundStyle(.secondary)
                        Spacer()
                    }
                } else if allInputsFilled {
                    Label("Invalid input — check values and units", systemImage: "exclamationmark.triangle")
                        .font(.subheadline)
                        .foregroundStyle(.orange)
                } else {
                    Text("Enter all inputs above to see the result.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(.quaternary, in: RoundedRectangle(cornerRadius: 12))
        }
    }

    private var notesSection: some View {
        VStack(alignment: .leading, spacing: 6) {
            Label("Notes", systemImage: "info.circle")
                .font(.headline)
            Text(formula.notes)
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.quaternary, in: RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Helpers

    private func binding(for symbol: String) -> Binding<String> {
        Binding(
            get: { inputStrings[symbol] ?? "" },
            set: { inputStrings[symbol] = $0 }
        )
    }

    private func loadDefaults() {
        for input in formula.inputs {
            if let def = input.defaultValue {
                if inputStrings[input.symbol] == nil {
                    inputStrings[input.symbol] = formatDefault(def)
                }
            }
        }
    }

    private func formatDefault(_ value: Double) -> String {
        if value == value.rounded() && abs(value) < 1e6 {
            return String(Int(value))
        }
        return String(value)
    }

    private func formatResult(_ value: Double) -> String {
        let absVal = abs(value)
        if absVal == 0 { return "0" }
        if absVal >= 0.001 && absVal < 100_000 {
            // Use up to 5 significant figures, trim trailing zeros
            let s = String(format: "%.5g", value)
            return s
        }
        // Scientific notation
        let exp = Int(floor(log10(absVal)))
        let mantissa = value / pow(10.0, Double(exp))
        return String(format: "%.4g × 10^%d", mantissa, exp)
    }
}

// MARK: - Input Field

struct InputField: View {
    let input:       FormulaInput
    @Binding var text: String
    let color:       Color
    var focusedField: FocusState<String?>.Binding

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 4) {
                Text(input.label)
                    .font(.subheadline).bold()
                Text("(\(input.symbol))")
                    .font(.system(.subheadline, design: .monospaced))
                    .foregroundStyle(color)
            }
            HStack {
                TextField(input.hint.isEmpty ? "Enter value" : input.hint, text: $text)
                    .keyboardType(.decimalPad)
                    .font(.system(.body, design: .monospaced))
                    .focused(focusedField, equals: input.symbol)
                if !input.unit.isEmpty {
                    Text(input.unit)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .padding(.leading, 4)
                }
            }
            .padding(10)
            .background(.quaternary, in: RoundedRectangle(cornerRadius: 8))
        }
    }
}

#Preview {
    NavigationStack {
        CalculatorView(formula: FormulaData.radar.first!)
    }
}
