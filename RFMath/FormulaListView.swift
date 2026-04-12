import SwiftUI

struct FormulaListView: View {
    let category: FormulaCategory
    private var formulas: [Formula] { FormulaData.formulas(for: category) }

    var body: some View {
        List(formulas) { formula in
            NavigationLink(value: formula) {
                FormulaRow(formula: formula)
            }
        }
        .navigationTitle(category.rawValue)
        .navigationBarTitleDisplayMode(.large)
        .navigationDestination(for: Formula.self) { formula in
            CalculatorView(formula: formula)
        }
    }
}

struct FormulaRow: View {
    let formula: Formula

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(formula.name)
                .font(.headline)
            Text(formula.formulaDisplay)
                .font(.system(.subheadline, design: .monospaced))
                .foregroundStyle(formula.category.color)
            Text(formula.description)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(2)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Formula Hashable conformance for NavigationLink

extension Formula: Hashable {
    static func == (lhs: Formula, rhs: Formula) -> Bool { lhs.id == rhs.id }
    func hash(into hasher: inout Hasher) { hasher.combine(id) }
}

#Preview {
    NavigationStack {
        FormulaListView(category: .radar)
    }
}
