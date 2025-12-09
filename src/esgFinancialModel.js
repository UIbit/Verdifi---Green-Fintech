/**
 * ESG Financial Modeling Module
 * Calculates ESG scores, financial impact, and investment metrics
 * for Green Fintech applications
 */

class ESGFinancialModel {
  constructor() {
    this.esgWeights = {
      environmental: 0.4,
      social: 0.3,
      governance: 0.3
    };

    this.carbonIntensityFactors = {
      high: 0.8,
      medium: 0.5,
      low: 0.2,
      renewable: 0.1
    };
  }

  /**
   * Calculate overall ESG Score (0-100)
   * @param {object} metrics - ESG metrics
   * @returns {object} ESG score breakdown
   */
  calculateESGScore(metrics) {
    const {
      carbonFootprint = 0,
      renewableEnergy = 0,
      wasteReduction = 0,
      employeeSatisfaction = 0,
      diversity = 0,
      communityImpact = 0,
      boardIndependence = 0,
      transparency = 0,
      ethicsCompliance = 0
    } = metrics;

    // Environmental Score (0-40)
    const carbonScore = Math.max(0, 15 - (carbonFootprint / 100));
    const renewableScore = (renewableEnergy / 100) * 15;
    const wasteScore = (wasteReduction / 100) * 10;
    const environmentalScore = carbonScore + renewableScore + wasteScore;

    // Social Score (0-30)
    const employeeScore = (employeeSatisfaction / 100) * 10;
    const diversityScore = (diversity / 100) * 10;
    const communityScore = (communityImpact / 100) * 10;
    const socialScore = employeeScore + diversityScore + communityScore;

    // Governance Score (0-30)
    const boardScore = (boardIndependence / 100) * 10;
    const transparencyScore = (transparency / 100) * 10;
    const ethicsScore = (ethicsCompliance / 100) * 10;
    const governanceScore = boardScore + transparencyScore + ethicsScore;

    const totalScore = environmentalScore + socialScore + governanceScore;

    return {
      overall: Math.round(totalScore),
      environmental: Math.round(environmentalScore * (40 / (environmentalScore || 1))),
      social: Math.round(socialScore * (30 / (socialScore || 1))),
      governance: Math.round(governanceScore * (30 / (governanceScore || 1))),
      breakdown: {
        environmental: {
          carbonFootprint: Math.round(carbonScore),
          renewableEnergy: Math.round(renewableScore),
          wasteReduction: Math.round(wasteScore)
        },
        social: {
          employeeSatisfaction: Math.round(employeeScore),
          diversity: Math.round(diversityScore),
          communityImpact: Math.round(communityScore)
        },
        governance: {
          boardIndependence: Math.round(boardScore),
          transparency: Math.round(transparencyScore),
          ethicsCompliance: Math.round(ethicsScore)
        }
      }
    };
  }

  /**
   * Calculate financial impact of ESG performance
   * @param {number} esgScore - Overall ESG score
   * @param {number} revenue - Annual revenue
   * @param {number} carbonEmissions - Annual carbon emissions (tons)
   * @returns {object} Financial impact metrics
   */
  calculateFinancialImpact(esgScore, revenue, carbonEmissions) {
    // ESG premium/discount (higher ESG = better financial performance)
    const esgPremium = (esgScore / 100) * 0.15; // Up to 15% premium
    const adjustedRevenue = revenue * (1 + esgPremium);

    // Carbon cost calculation (carbon pricing)
    const carbonPricePerTon = 50; // USD per ton CO2
    const carbonCost = carbonEmissions * carbonPricePerTon;
    const potentialSavings = carbonEmissions * carbonPricePerTon * 0.3; // 30% reduction potential

    // Risk-adjusted returns
    const baseReturn = 0.08; // 8% base return
    const esgRiskAdjustment = (esgScore / 100) * 0.03; // Up to 3% risk reduction
    const adjustedReturn = baseReturn + esgRiskAdjustment;

    // Cost of capital reduction (better ESG = lower cost)
    const baseCostOfCapital = 0.10; // 10% base
    const esgCostReduction = (esgScore / 100) * 0.02; // Up to 2% reduction
    const adjustedCostOfCapital = baseCostOfCapital - esgCostReduction;

    // Valuation impact (ESG premium in multiples)
    const valuationMultiple = 10 + (esgScore / 100) * 2; // 10-12x revenue multiple
    const enterpriseValue = adjustedRevenue * valuationMultiple;

    return {
      esgPremium: (esgPremium * 100).toFixed(2),
      adjustedRevenue: adjustedRevenue.toFixed(2),
      carbonCost: carbonCost.toFixed(2),
      potentialSavings: potentialSavings.toFixed(2),
      adjustedReturn: (adjustedReturn * 100).toFixed(2),
      adjustedCostOfCapital: (adjustedCostOfCapital * 100).toFixed(2),
      valuationMultiple: valuationMultiple.toFixed(2),
      enterpriseValue: enterpriseValue.toFixed(2),
      metrics: {
        revenueImpact: ((adjustedRevenue - revenue) / revenue * 100).toFixed(2),
        costSavings: potentialSavings,
        returnImprovement: (esgRiskAdjustment * 100).toFixed(2),
        capitalCostReduction: (esgCostReduction * 100).toFixed(2)
      }
    };
  }

  /**
   * Calculate portfolio ESG metrics
   * @param {array} investments - Array of investment objects
   * @returns {object} Portfolio ESG metrics
   */
  calculatePortfolioESG(investments) {
    if (!investments || investments.length === 0) {
      return {
        portfolioScore: 0,
        weightedAverage: 0,
        carbonIntensity: 0,
        breakdown: {}
      };
    }

    let totalValue = 0;
    let weightedESG = 0;
    let weightedCarbon = 0;

    const breakdown = {
      environmental: 0,
      social: 0,
      governance: 0
    };

    investments.forEach(investment => {
      const { value, esgScore, carbonIntensity, esgBreakdown } = investment;
      totalValue += value;
      weightedESG += esgScore * value;
      
      if (carbonIntensity) {
        weightedCarbon += carbonIntensity * value;
      }

      if (esgBreakdown) {
        breakdown.environmental += (esgBreakdown.environmental || 0) * value;
        breakdown.social += (esgBreakdown.social || 0) * value;
        breakdown.governance += (esgBreakdown.governance || 0) * value;
      }
    });

    const portfolioScore = totalValue > 0 ? weightedESG / totalValue : 0;
    const avgCarbonIntensity = totalValue > 0 ? weightedCarbon / totalValue : 0;

    return {
      portfolioScore: Math.round(portfolioScore),
      weightedAverage: portfolioScore,
      carbonIntensity: avgCarbonIntensity.toFixed(2),
      totalValue: totalValue.toFixed(2),
      breakdown: {
        environmental: totalValue > 0 ? (breakdown.environmental / totalValue).toFixed(2) : 0,
        social: totalValue > 0 ? (breakdown.social / totalValue).toFixed(2) : 0,
        governance: totalValue > 0 ? (breakdown.governance / totalValue).toFixed(2) : 0
      },
      investmentCount: investments.length
    };
  }

  /**
   * Calculate ESG-based investment recommendation
   * @param {object} currentMetrics - Current ESG metrics
   * @param {object} targetMetrics - Target ESG metrics
   * @param {number} investmentAmount - Amount to invest
   * @returns {object} Investment recommendation
   */
  generateInvestmentRecommendation(currentMetrics, targetMetrics, investmentAmount) {
    const currentScore = this.calculateESGScore(currentMetrics);
    const targetScore = this.calculateESGScore(targetMetrics);

    const scoreGap = targetScore.overall - currentScore.overall;
    const improvementNeeded = scoreGap / 100;

    // Calculate required investment in ESG initiatives
    const costPerPoint = investmentAmount * 0.02; // 2% per ESG point
    const requiredInvestment = Math.abs(scoreGap * costPerPoint);

    // Expected ROI from ESG improvement
    const roiMultiplier = 1 + (improvementNeeded * 0.5); // 50% ROI per 10 points
    const expectedReturn = investmentAmount * roiMultiplier;

    // Risk reduction
    const riskReduction = (scoreGap / 100) * 0.15; // Up to 15% risk reduction

    return {
      currentScore: currentScore.overall,
      targetScore: targetScore.overall,
      scoreGap: scoreGap,
      requiredInvestment: requiredInvestment.toFixed(2),
      expectedReturn: expectedReturn.toFixed(2),
      expectedROI: ((roiMultiplier - 1) * 100).toFixed(2),
      riskReduction: (riskReduction * 100).toFixed(2),
      paybackPeriod: (requiredInvestment / (expectedReturn - investmentAmount)).toFixed(1),
      recommendation: scoreGap > 0 
        ? 'Invest in ESG improvements' 
        : 'Maintain current ESG performance'
    };
  }

  /**
   * Calculate carbon footprint financial impact
   * @param {number} carbonEmissions - Carbon emissions in tons CO2e
   * @param {number} electricityCost - Annual electricity cost
   * @returns {object} Carbon financial metrics
   */
  calculateCarbonFinancialImpact(carbonEmissions, electricityCost) {
    const carbonPrice = 50; // USD per ton
    const totalCarbonCost = carbonEmissions * carbonPrice;
    
    // Potential savings from efficiency
    const efficiencyPotential = 0.3; // 30% reduction possible
    const potentialSavings = totalCarbonCost * efficiencyPotential;
    
    // Renewable energy transition cost
    const renewablePremium = 0.15; // 15% premium
    const renewableCost = electricityCost * (1 + renewablePremium);
    const transitionSavings = (electricityCost * efficiencyPotential) - (renewableCost - electricityCost);

    return {
      currentCarbonCost: totalCarbonCost.toFixed(2),
      potentialSavings: potentialSavings.toFixed(2),
      renewableTransitionCost: (renewableCost - electricityCost).toFixed(2),
      netSavings: transitionSavings.toFixed(2),
      paybackPeriod: ((renewableCost - electricityCost) / (potentialSavings / 12)).toFixed(1),
      roi: ((transitionSavings / (renewableCost - electricityCost)) * 100).toFixed(2)
    };
  }

  /**
   * Generate ESG risk assessment
   * @param {object} esgScore - ESG score object
   * @returns {object} Risk assessment
   */
  assessESGRisk(esgScore) {
    const overall = esgScore.overall;
    
    let riskLevel = 'low';
    let riskScore = 0;

    if (overall >= 80) {
      riskLevel = 'low';
      riskScore = 20;
    } else if (overall >= 60) {
      riskLevel = 'medium';
      riskScore = 40;
    } else if (overall >= 40) {
      riskLevel = 'high';
      riskScore = 60;
    } else {
      riskLevel = 'critical';
      riskScore = 80;
    }

    const riskFactors = [];
    if (esgScore.environmental < 30) riskFactors.push('Environmental compliance risk');
    if (esgScore.social < 20) riskFactors.push('Social responsibility risk');
    if (esgScore.governance < 20) riskFactors.push('Governance risk');

    return {
      riskLevel,
      riskScore,
      riskFactors,
      recommendation: this.getRiskRecommendation(riskLevel)
    };
  }

  getRiskRecommendation(riskLevel) {
    const recommendations = {
      low: 'Maintain current ESG standards',
      medium: 'Focus on improving weak ESG areas',
      high: 'Immediate ESG improvement needed',
      critical: 'Urgent ESG remediation required'
    };
    return recommendations[riskLevel] || 'Review ESG strategy';
  }
}

export default ESGFinancialModel;

