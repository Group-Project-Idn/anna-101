'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Hapus constraint unique lama dulu (yang masih berbasis kolom `date`)
    await queryInterface.removeConstraint('Candles', 'uq_candle_stock_date_interval');

    // 2. Rename kolom date jadi datetime sekaligus ubah tipenya
    await queryInterface.renameColumn('Candles', 'date', 'datetime');

    await queryInterface.changeColumn('Candles', 'datetime', {
      type: Sequelize.DATE, // Sequelize DATE = TIMESTAMP di Postgres (punya jam:menit:detik)
      allowNull: false
    });

    // 3. Tambah constraint unique baru berbasis datetime
    await queryInterface.addConstraint('Candles', {
      fields: ['stock_id', 'datetime', 'interval'],
      type: 'unique',
      name: 'uq_candle_stock_datetime_interval'
    });
  },

  async down(queryInterface, Sequelize) {
    // Rollback: balik ke constraint & kolom lama
    await queryInterface.removeConstraint('Candles', 'uq_candle_stock_datetime_interval');

    await queryInterface.changeColumn('Candles', 'datetime', {
      type: Sequelize.DATEONLY,
      allowNull: false
    });

    await queryInterface.renameColumn('Candles', 'datetime', 'date');

    await queryInterface.addConstraint('Candles', {
      fields: ['stock_id', 'date', 'interval'],
      type: 'unique',
      name: 'uq_candle_stock_date_interval'
    });
  }
};