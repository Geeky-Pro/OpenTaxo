export type UnitConversionFactors = {
  dimension_id: string;
  to_base_multiplier: number;
  to_base_offset: number;
};

export type DirectConversion = {
  multiplier: number;
  offset_value: number;
};

/**
 * Returns the direct equation target = source * multiplier + offset
 * from the source/target unit's canonical-base factors.
 */
export function conversionFromFactors(
  source: UnitConversionFactors,
  target: UnitConversionFactors,
): DirectConversion {
  if (source.dimension_id !== target.dimension_id) {
    throw new Error('Cannot convert between different physical dimensions.');
  }
  if (
    !Number.isFinite(source.to_base_multiplier) ||
    source.to_base_multiplier <= 0 ||
    !Number.isFinite(target.to_base_multiplier) ||
    target.to_base_multiplier <= 0 ||
    !Number.isFinite(source.to_base_offset) ||
    !Number.isFinite(target.to_base_offset)
  ) {
    throw new Error('Unit conversion factors are invalid.');
  }

  return {
    multiplier: source.to_base_multiplier / target.to_base_multiplier,
    offset_value: (source.to_base_offset - target.to_base_offset) / target.to_base_multiplier,
  };
}

export function convertWithFactors(
  value: number,
  source: UnitConversionFactors,
  target: UnitConversionFactors,
): number {
  if (!Number.isFinite(value)) throw new Error('A finite numeric value is required.');
  const direct = conversionFromFactors(source, target);
  return value * direct.multiplier + direct.offset_value;
}
