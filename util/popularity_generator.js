const {query, transaction, commit, rollback} = require('./mysqlcon');


const popularityAutoUpdate = async () => {
  //Calculation Formula:
  //total = 100
  //All Sold Quantity * 20 + Sold Quantity in 1 Day * 20 + popularity_weight * 60
  try {
    await transaction();
    const soldProductsSumSQL = `SELECT product_id, SUM(quantity) AS qty , p.popularity_weight 
                                  FROM order_product AS op
                                  INNER JOIN product AS p ON op.product_id = p.id
                                  GROUP BY product_id`;
    const soldProductsCount = await query(soldProductsSumSQL);
    const soldTotal = soldProductsCount.reduce((sum, p) => sum + p.qty, 0);

    const time = Date.now() - (24 * 60 * 60 * 1000);
    const soldProductsIn1WeekSumSQL = `SELECT op.product_id, SUM(op.quantity) AS qty
                                        FROM order_product AS op
                                        INNER JOIN order_table AS o ON op.order_id = o.id
                                        WHERE o.time > ?
                                        GROUP BY product_id`;
    const soldProductsIn1WeekCount = await query(soldProductsIn1WeekSumSQL, [time]);
    const soldProductsIn1WeekMap = soldProductsIn1WeekCount.reduce((acc, p) => ({ ...acc, [p.product_id]: p.qty }),{});
    const sold1WeekTotal = soldProductsIn1WeekCount.reduce((sum, p) => sum + p.qty, 0);

    const data = soldProductsCount.map((p) => {
      const soldIn1Week = soldProductsIn1WeekMap[p.product_id] ? soldProductsIn1WeekMap[p.product_id] : 0;
      const popularity = ((p.qty / soldTotal * 20) + (soldIn1Week / sold1WeekTotal * 20) + (p.popularity_weight / 100 * 60)).toFixed(2);
      return [ p.product_id, popularity ];
    });
    await query('INSERT INTO product (id, popularity) VALUES ? ON DUPLICATE KEY UPDATE popularity = VALUES(popularity)', [data]);
    await commit();
    console.log('popularity update succeed');
  } catch (error) {
    console.log(error);
    await rollback();
  }
};

module.exports = {
  popularityAutoUpdate
};