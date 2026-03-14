export const Colors = {
    // Elegant Navy & Royal Blue
    primary: '#1E3A8A',      // Deep Royal Navy
    primaryLight: '#3B82F6', // Lighter elegant blue
    primaryDark: '#1E293B',  // Slate for dark accents

    // Warm, inviting accents
    accent: '#F59E0B',       // Amber / Gold
    accentLight: '#FCD34D',

    // Semantic
    danger: '#E11D48',       // Rose red
    dangerLight: '#FFE4E6',
    present: '#059669',      // Emerald Green
    presentBg: '#ECFDF5',
    absent: '#E11D48',
    absentBg: '#FFF1F2',

    // Neutrals
    background: '#F8FAFC',   // Off-white/slate, easier on the eyes
    surface: '#FFFFFF',      // Pure white cards
    border: '#E2E8F0',
    text: '#0F172A',         // Slate 900 (softer than pure black)
    textSecondary: '#64748B',// Slate 500
    white: '#FFFFFF',
};

export const Fonts = {
    regular: 'System',
    medium: 'System',
    bold: 'System',
};

export const Radius = {
    sm: 8,
    md: 14, // Slightly larger for elegance
    lg: 20, // Modern card radius
    xl: 32, // Extra round for pills
};

// Soft, premium glassmorphism-style shadows
export const Shadows = {
    sm: {
        shadowColor: '#1E293B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    md: {
        shadowColor: '#1E293B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 4,
    },
    lg: {
        shadowColor: '#1E293B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 8,
    },
};
