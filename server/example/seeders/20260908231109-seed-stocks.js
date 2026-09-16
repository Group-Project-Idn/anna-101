'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Stocks', [
      // Technology
      { symbol: 'AAPL', name: 'Apple Inc', sector: 'Technology', exchange: 'NASDAQ', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'MSFT', name: 'Microsoft Corp', sector: 'Technology', exchange: 'NASDAQ', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'NVDA', name: 'NVIDIA Corp', sector: 'Technology', exchange: 'NASDAQ', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'ORCL', name: 'Oracle Corp', sector: 'Technology', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'CRM', name: 'Salesforce Inc', sector: 'Technology', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },

      // Healthcare
      { symbol: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'LLY', name: 'Eli Lilly and Co', sector: 'Healthcare', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'ABBV', name: 'AbbVie Inc', sector: 'Healthcare', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'MRK', name: 'Merck & Co', sector: 'Healthcare', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },

      // Financials
      { symbol: 'JPM', name: 'JPMorgan Chase & Co', sector: 'Financials', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'BAC', name: 'Bank of America Corp', sector: 'Financials', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'WFC', name: 'Wells Fargo & Co', sector: 'Financials', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'GS', name: 'Goldman Sachs Group', sector: 'Financials', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'V', name: 'Visa Inc', sector: 'Financials', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },

      // Consumer Discretionary
      { symbol: 'AMZN', name: 'Amazon.com Inc', sector: 'Consumer Discretionary', exchange: 'NASDAQ', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'TSLA', name: 'Tesla Inc', sector: 'Consumer Discretionary', exchange: 'NASDAQ', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'HD', name: 'Home Depot Inc', sector: 'Consumer Discretionary', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'MCD', name: "McDonald's Corp", sector: 'Consumer Discretionary', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'NKE', name: 'Nike Inc', sector: 'Consumer Discretionary', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },

      // Consumer Staples
      { symbol: 'PG', name: 'Procter & Gamble Co', sector: 'Consumer Staples', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'KO', name: 'Coca-Cola Co', sector: 'Consumer Staples', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'PEP', name: 'PepsiCo Inc', sector: 'Consumer Staples', exchange: 'NASDAQ', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'WMT', name: 'Walmart Inc', sector: 'Consumer Staples', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'COST', name: 'Costco Wholesale Corp', sector: 'Consumer Staples', exchange: 'NASDAQ', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },

      // Communication Services
      { symbol: 'GOOGL', name: 'Alphabet Inc', sector: 'Communication Services', exchange: 'NASDAQ', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'META', name: 'Meta Platforms Inc', sector: 'Communication Services', exchange: 'NASDAQ', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'NFLX', name: 'Netflix Inc', sector: 'Communication Services', exchange: 'NASDAQ', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'DIS', name: 'Walt Disney Co', sector: 'Communication Services', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'T', name: 'AT&T Inc', sector: 'Communication Services', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },

      // Industrials
      { symbol: 'GE', name: 'General Electric Co', sector: 'Industrials', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'CAT', name: 'Caterpillar Inc', sector: 'Industrials', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'BA', name: 'Boeing Co', sector: 'Industrials', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'HON', name: 'Honeywell International', sector: 'Industrials', exchange: 'NASDAQ', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'UPS', name: 'United Parcel Service', sector: 'Industrials', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },

      // Energy
      { symbol: 'XOM', name: 'Exxon Mobil Corp', sector: 'Energy', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'CVX', name: 'Chevron Corp', sector: 'Energy', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'COP', name: 'ConocoPhillips', sector: 'Energy', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'SLB', name: 'Schlumberger NV', sector: 'Energy', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'EOG', name: 'EOG Resources Inc', sector: 'Energy', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },

      // Utilities
      { symbol: 'NEE', name: 'NextEra Energy Inc', sector: 'Utilities', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'DUK', name: 'Duke Energy Corp', sector: 'Utilities', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'SO', name: 'Southern Co', sector: 'Utilities', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'AEP', name: 'American Electric Power', sector: 'Utilities', exchange: 'NASDAQ', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'EXC', name: 'Exelon Corp', sector: 'Utilities', exchange: 'NASDAQ', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },

      // Real Estate
      { symbol: 'PLD', name: 'Prologis Inc', sector: 'Real Estate', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'AMT', name: 'American Tower Corp', sector: 'Real Estate', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'EQIX', name: 'Equinix Inc', sector: 'Real Estate', exchange: 'NASDAQ', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'SPG', name: 'Simon Property Group', sector: 'Real Estate', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'PSA', name: 'Public Storage', sector: 'Real Estate', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },

      // Materials
      { symbol: 'LIN', name: 'Linde PLC', sector: 'Materials', exchange: 'NASDAQ', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'SHW', name: 'Sherwin-Williams Co', sector: 'Materials', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'APD', name: 'Air Products and Chemicals', sector: 'Materials', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'ECL', name: 'Ecolab Inc', sector: 'Materials', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() },
      { symbol: 'FCX', name: 'Freeport-McMoRan Inc', sector: 'Materials', exchange: 'NYSE', country: 'US', regulator: 'SEC', updated_at: new Date(), created_at: new Date() }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Stocks', null, {});
  }
};