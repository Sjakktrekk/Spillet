/**
 * Hjelpefunksjoner for ferdighetssystemet
 */

/**
 * Beregn skade basert på en ferdighet
 * @param {number} baseDamage - Basisskade fra våpen
 * @param {number} skillLevel - Ferdighetsnivå
 * @param {string} skillType - Type ferdighet (Nærkamp/Skyteferdighet)
 * @returns {number} - Beregnet skade med ferdighetsbonuser
 */
export function calculateDamageWithSkill(baseDamage, skillLevel, skillType = 'Nærkamp') {
  if (skillType !== 'Nærkamp' && skillType !== 'Skyteferdighet') {
    return baseDamage;
  }
  
  // 8% ekstra skade per ferdighetsnivå
  const skillBonus = 1 + (skillLevel * 0.08);
  return Math.floor(baseDamage * skillBonus);
}

/**
 * Beregn pris basert på Overtalelse-ferdighet
 * @param {number} basePrice - Basispris
 * @param {number} skillLevel - Overtalelse-ferdighetsnivå
 * @param {boolean} isBuying - Om spilleren kjøper (true) eller selger (false)
 * @returns {number} - Beregnet pris med ferdighetsbonuser
 */
export function calculatePriceWithSkill(basePrice, skillLevel, isBuying = true) {
  // 3% bedre pris per ferdighetsnivå
  const skillBonus = skillLevel * 0.03;
  
  if (isBuying) {
    // Reduser prisen ved kjøp
    return Math.floor(basePrice * (1 - skillBonus));
  } else {
    // Øk prisen ved salg
    return Math.floor(basePrice * (1 + skillBonus));
  }
}

/**
 * Beregn sjansen for å finne skjulte gjenstander basert på Utforskning-ferdighet
 * @param {number} baseChance - Basissjanse (0-1)
 * @param {number} skillLevel - Utforskning-ferdighetsnivå
 * @returns {number} - Beregnet sjanse (0-1)
 */
export function calculateDiscoveryChance(baseChance, skillLevel) {
  // 5% økt sjanse per ferdighetsnivå
  const skillBonus = skillLevel * 0.05;
  return Math.min(1, baseChance + skillBonus);
}

/**
 * Beregn erfaringspoeng basert på Kunnskap-ferdighet
 * @param {number} baseXP - Basis erfaringspoeng
 * @param {number} skillLevel - Kunnskap-ferdighetsnivå
 * @returns {number} - Beregnet erfaringspoeng med bonuser
 */
export function calculateXPWithSkill(baseXP, skillLevel) {
  // 5% mer XP per ferdighetsnivå
  const skillBonus = 1 + (skillLevel * 0.05);
  return Math.floor(baseXP * skillBonus);
}

/**
 * Beregn kvaliteten på en laget gjenstand basert på Håndverk-ferdighet
 * @param {number} baseQuality - Basiskvalitet (0-1)
 * @param {number} skillLevel - Håndverk-ferdighetsnivå
 * @returns {number} - Beregnet kvalitet (0-1)
 */
export function calculateCraftingQuality(baseQuality, skillLevel) {
  // 10% økt kvalitet per ferdighetsnivå
  const skillBonus = skillLevel * 0.1;
  return Math.min(1, baseQuality + skillBonus);
}

/**
 * Beregn effekten av magi basert på Magi-ferdighet
 * @param {number} baseEffect - Basiseffekt
 * @param {number} skillLevel - Magi-ferdighetsnivå
 * @returns {number} - Beregnet effekt med bonuser
 */
export function calculateMagicEffect(baseEffect, skillLevel) {
  // 10% sterkere effekt per ferdighetsnivå
  const skillBonus = 1 + (skillLevel * 0.1);
  return Math.floor(baseEffect * skillBonus);
}

/**
 * Beregn maks helse og energi basert på Utholdenhet-ferdighet
 * @param {number} baseHealth - Basis maks helse
 * @param {number} baseEnergy - Basis maks energi
 * @param {number} skillLevel - Utholdenhet-ferdighetsnivå
 * @returns {Object} - Beregnet maks helse og energi
 */
export function calculateMaxStats(baseHealth, baseEnergy, skillLevel) {
  // 5 helse og 4 energi per ferdighetsnivå
  return {
    maxHealth: baseHealth + (skillLevel * 5),
    maxEnergy: baseEnergy + (skillLevel * 4)
  };
}

/**
 * Beregn skadereduksjon basert på forsvarsverdien
 * @param {number} baseDamage - Utgangsskade før reduksjon
 * @param {number} defense - Forsvarsverdien
 * @returns {Object} - Objekt med originalskade, redusert skade og blokkert skade
 */
export function calculateDamageReduction(baseDamage, defense) {
  // Hvert forsvarspoeng gir 1% skadereduksjon, men med avtagende effekt
  // Maksimalt 50% skadereduksjon ved 100 forsvar
  const defenseMultiplier = Math.min(0.5, defense / 100);
  const damageReduction = Math.floor(baseDamage * defenseMultiplier);
  const finalDamage = Math.max(1, baseDamage - damageReduction); // Minimum 1 i skade
  
  return {
    originalDamage: baseDamage,
    reducedDamage: finalDamage,
    damageBlocked: damageReduction,
    defensePercentage: Math.round(defenseMultiplier * 100) // Prosent skadereduksjon
  };
} 