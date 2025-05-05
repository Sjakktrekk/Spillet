/**
 * Utility-klasse for å generere matteproblemer til kampmoduset
 */
class MathProblemGenerator {
  /**
   * Generer et multiplikasjonsproblem
   * @param {number} maxFactor - Høyeste tall som kan bli brukt i multiplikasjonen
   * @returns {Object} Et problem-objekt med to faktorer og svaret
   */
  static generateMultiplicationProblem(maxFactor = 10) {
    // Generer to tilfeldige tall mellom 1 og maxFactor
    const factor1 = Math.floor(Math.random() * maxFactor) + 1
    const factor2 = Math.floor(Math.random() * maxFactor) + 1
    
    return {
      factor1,
      factor2,
      answer: factor1 * factor2,
      type: 'multiplication'
    }
  }
  
  /**
   * Generer et addisjonsproblem
   * @param {number} maxNumber - Høyeste tall som kan bli brukt i addisjonen
   * @returns {Object} Et problem-objekt med to tall og svaret
   */
  static generateAdditionProblem(maxNumber = 20) {
    const num1 = Math.floor(Math.random() * maxNumber) + 1
    const num2 = Math.floor(Math.random() * maxNumber) + 1
    
    return {
      factor1: num1,
      factor2: num2,
      answer: num1 + num2,
      type: 'addition'
    }
  }
  
  /**
   * Generer et subtraksjonsproblem
   * @param {number} maxNumber - Høyeste tall som kan bli brukt i subtraksjonen
   * @param {boolean} allowNegative - Om negative svar er tillatt
   * @returns {Object} Et problem-objekt med to tall og svaret
   */
  static generateSubtractionProblem(maxNumber = 20, allowNegative = false) {
    let num1, num2
    
    if (allowNegative) {
      num1 = Math.floor(Math.random() * maxNumber) + 1
      num2 = Math.floor(Math.random() * maxNumber) + 1
    } else {
      // Sørg for at vi ikke får negative svar
      num1 = Math.floor(Math.random() * maxNumber) + 1
      num2 = Math.floor(Math.random() * num1) + 1
    }
    
    return {
      factor1: num1,
      factor2: num2,
      answer: num1 - num2,
      type: 'subtraction'
    }
  }
  
  /**
   * Generer et problem basert på vanskelighetsgrad
   * @param {number} difficulty - Vanskelighetsgrad (1-10)
   * @returns {Object} Et problem-objekt
   */
  static generateProblemByDifficulty(difficulty = 1) {
    // Juster vanskelighetsgrad til et gyldig område
    const level = Math.max(1, Math.min(10, difficulty))
    
    // For enkle vanskelighetsgrader, bruk bare multiplikasjon fra den lille gangetabellen
    if (level <= 3) {
      return this.generateMultiplicationProblem(Math.min(5 + level, 10))
    }
    
    // For mellomliggende vanskelighetsgrader, varier mellom multiplikasjon og addisjon/subtraksjon
    if (level <= 7) {
      const type = Math.random() > 0.3 ? 'multiplication' : (Math.random() > 0.5 ? 'addition' : 'subtraction')
      
      switch (type) {
        case 'multiplication':
          return this.generateMultiplicationProblem(Math.min(level + 3, 12))
        case 'addition':
          return this.generateAdditionProblem(10 + level * 3)
        case 'subtraction':
          return this.generateSubtractionProblem(10 + level * 3)
        default:
          return this.generateMultiplicationProblem(10)
      }
    }
    
    // For høye vanskelighetsgrader, bruk vanskeligere multiplikasjon
    return this.generateMultiplicationProblem(Math.min(10 + (level - 7) * 2, 20))
  }
  
  /**
   * Generer et sett med problemer for en kamp
   * @param {number} count - Antall problemer som skal genereres
   * @param {number} difficulty - Vanskelighetsgrad (1-10)
   * @returns {Array} En array med problemobjekter
   */
  static generateProblemSet(count = 5, difficulty = 1) {
    const problems = []
    
    for (let i = 0; i < count; i++) {
      problems.push(this.generateProblemByDifficulty(difficulty))
    }
    
    return problems
  }
}

export default MathProblemGenerator 