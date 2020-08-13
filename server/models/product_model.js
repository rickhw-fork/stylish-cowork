const {transaction, commit, rollback, query} = require('../../util/mysqlcon.js');

const createProduct = async (product, variants) => {
    try {
        await transaction();
        const result = await query('INSERT INTO product SET ?', product);
        await query('INSERT INTO variant(color_code,color_name,size,stock,product_id) VALUES ?', [variants]);
        await commit();
        return result.insertId;
    } catch (error) {
        await rollback();
        return error;
    }
};

const getProducts = async (pageSize, paging = 0, requirement = {}) => {
    const condition = { sql: '', binding: [] };
    if (requirement.category) {
        condition.sql = 'WHERE category = ?';
        condition.binding = [requirement.category];
    } else if (requirement.keyword != null) {
        condition.sql = 'WHERE title LIKE ? OR tag LIKE ?';
        condition.binding = [`%${requirement.keyword}%`,`%${requirement.keyword}%`];
    } else if (requirement.id) {
        if (requirement.tag) {
            const tag = requirement.tag.split(',').map((t) => `[[:<:]]${t}[[:>:]]`).join('|');
            condition.sql = 'WHERE id != ? AND tag REGEXP ?';
            condition.binding = [requirement.id, tag ];
        } else {
            condition.sql = 'WHERE id = ?';
            condition.binding = [requirement.id];
        }
    }

    let products;
    if (requirement.tag) {
        const productQuery = 'SELECT * FROM product ' + condition.sql + ' ORDER BY create_at DESC';
        const productBindings = condition.binding;
        const result = await query(productQuery, productBindings);
        const tags = requirement.tag.split(',');
        const sortedProducts = result.map((p) => {
            p.tagCount = tags.reduce((acc, t) => {
                const re = new RegExp(t);
                if (p.tag.search(re) !== -1) {acc += 1;}
                return acc;
            }, 0);
            return p;
        }).sort((a, b) => { return b.tagCount - a.tagCount; });
        products = sortedProducts.slice(pageSize * paging, (pageSize * paging) + pageSize );
    } else {
        const limit = {
            sql: 'LIMIT ?, ?',
            binding: [pageSize * paging, pageSize]
        };
        const sort = requirement.sort ? requirement.sort : 'id';
        const order = requirement.order ? requirement.order : 'DESC';
        const productQuery = 'SELECT * FROM product ' + condition.sql + ` ORDER BY ${sort} ${order} ` + limit.sql;
        const productBindings = condition.binding.concat(limit.binding);
        products = await query(productQuery, productBindings);
    }

    const productCountQuery = 'SELECT COUNT(*) as count FROM product ' + condition.sql; // count number
    const productCountBindings = condition.binding;

    const productCounts = await query(productCountQuery, productCountBindings);
    const productCount = productCounts[0].count;
    // console.log(products);
    // console.log(productCount);
    return {
        products,
        productCount
    };
};

const getHotProducts = async (hotId) => {
    const productQuery = 'SELECT product.* FROM product INNER JOIN hot_product ON product.id = hot_product.product_id WHERE hot_product.hot_id = ? ORDER BY product.id';
    const productBindings = [hotId];
    return await query(productQuery, productBindings);
};

const getProductsVariants = async (productIds) => {
    const queryStr = 'SELECT * FROM variant WHERE product_id IN (?)';
    const bindings = [productIds];
    return await query(queryStr, bindings);
};

const getProductsComments = async (productId) => {
    const queryStr = `SELECT op.product_id, v.color_code, v.color_name, v.size, op.quantity,
                             u.name, op.rating, op.comment, op.comment_time 
                        FROM order_product AS op
                        INNER JOIN order_table AS o ON op.order_id = o.id
                        INNER JOIN variant AS v ON op.variant_id = v.id
                        INNER JOIN user AS u ON o.user_id = u.id
                        WHERE op.product_id = ?`;
    const bindings = [productId];
    return await query(queryStr, bindings);
};

const updateVariantStock = async (productID, size, color, quantity) => {
    const sql = `SELECT id FROM variant 
                    WHERE product_id = ? AND size = ? AND color_code = ? AND stock >= ? FOR UPDATE`;
    const result = await query(sql, [productID, size, color, quantity]);
    if (result.length > 0) {
        await query('UPDATE variant SET stock = stock - ? WHERE id = ?', [quantity, result[0].id]);
        return result[0].id;
    } else {
        const err = new Error(`Product ${productID}: Variant stock not enough`);
        err.status = 500;
        return err;
    }
};

module.exports = {
    createProduct,
    getProducts,
    getHotProducts,
    getProductsVariants,
    getProductsComments,
    updateVariantStock
};