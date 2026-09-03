// Per-ninja colour helpers. Each ninja owns one accent, used for avatar rings,
// tints and progress fills so a person is recognisable by colour alone.

// Raw accent colour, for inline styles (rings, tints, progress fills).
// Prefer this over the Tailwind-class helper when the value feeds a CSS property.
export const getNinjaAccent = (ninja) => {
  switch (ninja?.name) {
    case 'Shilpha': return '#10B981'
    case 'Suhas': return '#EF4444'
    case 'Sudeep': return '#3B82F6'
    case 'Aneesh': return '#F59E0B'
    default: return '#8B5CF6'
  }
}

// Tailwind border class, for the Avatar component's borderColor prop.
export const getNinjaBorderColor = (ninja) => {
  switch (ninja?.name) {
    case 'Shilpha': return 'border-green-500/50'
    case 'Suhas': return 'border-red-500/50'
    case 'Sudeep': return 'border-blue-500/50'
    case 'Aneesh': return 'border-yellow-500/50'
    default: return 'border-gray-500/30'
  }
}

// Missions and repayments store the member's name, not their id, so rows have
// to be matched back to the roster to recover the avatar and accent.
export const getNinjaByName = (name, ninjas) => {
  return ninjas.find((n) => n.name === name)
}
