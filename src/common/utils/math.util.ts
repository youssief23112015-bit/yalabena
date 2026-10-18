/** Round to 2 decimals — money math helper shared by finance services. */
export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;