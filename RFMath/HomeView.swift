import SwiftUI

struct HomeView: View {
    let columns = [GridItem(.adaptive(minimum: 160), spacing: 16)]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Header
                VStack(alignment: .leading, spacing: 4) {
                    Text("RF Math Reference")
                        .font(.largeTitle).bold()
                    Text("\(FormulaData.all.count) formulas across \(FormulaCategory.allCases.count) categories")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal)

                // Category grid
                LazyVGrid(columns: columns, spacing: 16) {
                    ForEach(FormulaCategory.allCases) { category in
                        NavigationLink(value: category) {
                            CategoryCard(category: category)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal)
            }
            .padding(.vertical)
        }
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(for: FormulaCategory.self) { category in
            FormulaListView(category: category)
        }
    }
}

struct CategoryCard: View {
    let category: FormulaCategory
    private var count: Int { FormulaData.formulas(for: category).count }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: category.systemImage)
                    .font(.title2)
                    .foregroundStyle(.white)
                Spacer()
                Text("\(count)")
                    .font(.caption).bold()
                    .foregroundStyle(.white.opacity(0.8))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(.white.opacity(0.2), in: Capsule())
            }

            VStack(alignment: .leading, spacing: 3) {
                Text(category.rawValue)
                    .font(.headline)
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.leading)
                Text(category.description)
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.75))
                    .multilineTextAlignment(.leading)
                    .lineLimit(2)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(
                colors: [category.color, category.color.opacity(0.7)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            ),
            in: RoundedRectangle(cornerRadius: 16)
        )
        .shadow(color: category.color.opacity(0.3), radius: 6, x: 0, y: 3)
    }
}

#Preview {
    NavigationStack {
        HomeView()
    }
}
