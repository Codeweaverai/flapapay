const createPrefixedReference = (prefix, size = 6) =>
    `${prefix}-${require('crypto').randomBytes(size).toString('hex').toUpperCase()}`;

module.exports = {
    createPrefixedReference,
};
