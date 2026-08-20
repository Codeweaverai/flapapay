// --- Subscription Billing API (Developer Gateway) ---

// Products
app.post('/v1/products', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const { name, description, metadata } = req.body;
        if (!name) return res.status(400).json({ error: 'Missing required field: name' });

        const result = await pool.query(
            'INSERT INTO products (name, description, metadata, merchant_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, description || '', metadata || {}, merchant.owner_id]
        );
        res.status(201).json(DeveloperGateway.formatResponse(result.rows[0], merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.get('/v1/products', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const result = await pool.query('SELECT * FROM products WHERE merchant_id = $1 ORDER BY created_at DESC', [merchant.owner_id]);
        res.json(DeveloperGateway.formatResponse(result.rows, merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.patch('/v1/products/:id', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const { name, description, status, metadata } = req.body;
        const result = await pool.query(
            'UPDATE products SET name = COALESCE($1, name), description = COALESCE($2, description), status = COALESCE($3, status), metadata = COALESCE($4, metadata), updated_at = NOW() WHERE id = $5 AND merchant_id = $6 RETURNING *',
            [name, description, status, metadata, req.params.id, merchant.owner_id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
        res.json(DeveloperGateway.formatResponse(result.rows[0], merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.delete('/v1/products/:id', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const result = await pool.query('DELETE FROM products WHERE id = $1 AND merchant_id = $2 RETURNING id', [req.params.id, merchant.owner_id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
        res.json(DeveloperGateway.formatResponse({ deleted: true, id: req.params.id }, merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

// Prices
app.post('/v1/prices', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const { product_id, amount, currency, interval, interval_count, trial_days } = req.body;
        if (!product_id || !amount || !currency || !interval) return res.status(400).json({ error: 'Missing req fields' });

        const prodCheck = await pool.query('SELECT id FROM products WHERE id = $1 AND merchant_id = $2', [product_id, merchant.owner_id]);
        if (prodCheck.rows.length === 0) return res.status(404).json({ error: 'Product not found' });

        const result = await pool.query(
            'INSERT INTO prices (product_id, amount, currency, interval, interval_count, trial_days) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [product_id, amount, currency.toUpperCase(), interval, interval_count || 1, trial_days || 0]
        );
        res.status(201).json(DeveloperGateway.formatResponse(result.rows[0], merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.get('/v1/prices', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const { product_id } = req.query;
        let query = 'SELECT p.* FROM prices p JOIN products pr ON p.product_id = pr.id WHERE pr.merchant_id = $1';
        let params = [merchant.owner_id];
        if (product_id) {
            query += ' AND pr.id = $2';
            params.push(product_id);
        }
        const result = await pool.query(query, params);
        res.json(DeveloperGateway.formatResponse(result.rows, merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

// Customers
app.post('/v1/customers', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const { email, name } = req.body;
        if (!email) return res.status(400).json({ error: 'Missing email' });

        let stripeCustomerId = null;
        try {
            const stripeCust = await stripe.customers.create({ email, name, metadata: { merchant_id: merchant.owner_id } });
            stripeCustomerId = stripeCust.id;
        } catch (e) { console.error('Stripe cust err', e.message); }

        const result = await pool.query(
            'INSERT INTO customers (email, name, stripe_id, merchant_id) VALUES ($1, $2, $3, $4) ON CONFLICT (email, merchant_id) DO UPDATE SET name = $2 RETURNING *',
            [email, name || '', stripeCustomerId, merchant.owner_id]
        );
        res.status(201).json(DeveloperGateway.formatResponse(result.rows[0], merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.get('/v1/customers', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const result = await pool.query('SELECT * FROM customers WHERE merchant_id = $1 ORDER BY created_at DESC', [merchant.owner_id]);
        res.json(DeveloperGateway.formatResponse(result.rows, merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.get('/v1/customers/:id', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const result = await pool.query('SELECT * FROM customers WHERE id = $1 AND merchant_id = $2', [req.params.id, merchant.owner_id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(DeveloperGateway.formatResponse(result.rows[0], merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.patch('/v1/customers/:id', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const { name } = req.body;
        const result = await pool.query('UPDATE customers SET name = COALESCE($1, name), updated_at = NOW() WHERE id = $2 AND merchant_id = $3 RETURNING *', [name, req.params.id, merchant.owner_id]);
        res.json(DeveloperGateway.formatResponse(result.rows[0], merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

// Subscriptions
app.post('/v1/subscriptions', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const { customer_id, price_id } = req.body;

        const custCheck = await pool.query('SELECT id, stripe_id FROM customers WHERE id = $1 AND merchant_id = $2', [customer_id, merchant.owner_id]);
        if (custCheck.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });

        const priceCheck = await pool.query('SELECT p.* FROM prices p JOIN products pr ON p.product_id = pr.id WHERE p.id = $1 AND pr.merchant_id = $2', [price_id, merchant.owner_id]);
        if (priceCheck.rows.length === 0) return res.status(404).json({ error: 'Price not found' });

        const price = priceCheck.rows[0];
        const customer = custCheck.rows[0];

        const subInsert = await pool.query(
            'INSERT INTO subscriptions (customer_id, price_id, status) VALUES ($1, $2, $3) RETURNING *',
            [customer_id, price_id, 'incomplete']
        );
        const subscription = subInsert.rows[0];

        const amountInCents = Math.round(parseFloat(price.amount) * 100);
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: price.currency.toLowerCase(),
            customer: customer.stripe_id,
            setup_future_usage: 'off_session',
            metadata: {
                subscription_id: subscription.id,
                merchant_id: merchant.owner_id,
                price_id: price.id,
                type: 'subscription_first_payment'
            }
        });

        res.status(201).json(DeveloperGateway.formatResponse({
            subscription,
            client_secret: paymentIntent.client_secret
        }, merchant.environment));

    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.get('/v1/subscriptions', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const { customer_id } = req.query;
        let query = 'SELECT s.* FROM subscriptions s JOIN customers c ON s.customer_id = c.id WHERE c.merchant_id = $1';
        let params = [merchant.owner_id];
        if (customer_id) {
            query += ' AND c.id = $2';
            params.push(customer_id);
        }
        query += ' ORDER BY s.created_at DESC';
        const result = await pool.query(query, params);
        res.json(DeveloperGateway.formatResponse(result.rows, merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.get('/v1/subscriptions/:id', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const result = await pool.query('SELECT s.* FROM subscriptions s JOIN customers c ON s.customer_id = c.id WHERE s.id = $1 AND c.merchant_id = $2', [req.params.id, merchant.owner_id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(DeveloperGateway.formatResponse(result.rows[0], merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.post('/v1/subscriptions/:id/cancel', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const result = await pool.query('UPDATE subscriptions s SET status = $1, updated_at = NOW() FROM customers c WHERE s.customer_id = c.id AND s.id = $2 AND c.merchant_id = $3 RETURNING s.*', ['canceled', req.params.id, merchant.owner_id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Subscription not found' });
        res.json(DeveloperGateway.formatResponse(result.rows[0], merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.post('/v1/payment-intents', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const { amount, currency, customer_id } = req.body;

        let stripeCustomerId;
        if (customer_id) {
            const custCheck = await pool.query('SELECT stripe_id FROM customers WHERE id = $1 AND merchant_id = $2', [customer_id, merchant.owner_id]);
            if (custCheck.rows.length > 0) stripeCustomerId = custCheck.rows[0].stripe_id;
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(parseFloat(amount) * 100),
            currency: currency.toLowerCase(),
            customer: stripeCustomerId,
            metadata: { merchant_id: merchant.owner_id }
        });

        res.status(201).json(DeveloperGateway.formatResponse(paymentIntent, merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.get('/v1/invoices', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const { subscription_id, customer_id } = req.query;
        let query = 'SELECT i.* FROM sub_invoice i JOIN customers c ON i.customer_id = c.id WHERE c.merchant_id = $1';
        let params = [merchant.owner_id];
        let paramCount = 2;
        if (subscription_id) {
            query += \` AND i.subscription_id = $\${paramCount++}\`;
            params.push(subscription_id);
        }
        if (customer_id) {
            query += \` AND i.customer_id = $\${paramCount++}\`;
            params.push(customer_id);
        }
        query += ' ORDER BY i.created_at DESC';
        const result = await pool.query(query, params);
        res.json(DeveloperGateway.formatResponse(result.rows, merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

