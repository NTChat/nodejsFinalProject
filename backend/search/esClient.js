// backend/search/esClient.js
let client = null;
try {
  if (process.env.ELASTIC_URL) {
    const { Client } = require('@elastic/elasticsearch');
    client = new Client({ node: process.env.ELASTIC_URL });
  }
} catch (_) {}

exports.esSearch = async (q, limit = 20) => {
  if (!client) throw new Error('ES disabled');
  const resp = await client.search({
    index: 'products',
    size: limit,
    query: {
      multi_match: {
        query: q,
        fields: ['name^3', 'brand^2', 'description', 'shortDescription', 'variants.name'],
        fuzziness: 'AUTO'
      }
    },
    _source: ['name', 'brand', 'images', 'variants', 'avgRating', 'numRatings']
  });

  const products = resp.hits.hits.map(h => {
    const p = h._source;
    const lowestPrice = Array.isArray(p.variants) && p.variants.length
      ? Math.min(...p.variants.map(v => Number(v.price || 0)))
      : 0;
    return {
      ...p,
      id: h._id,
      lowestPrice,
      image: (p.images && p.images[0]) || null
    };
  });
  return { total: resp.hits.total?.value || products.length, products };
};
