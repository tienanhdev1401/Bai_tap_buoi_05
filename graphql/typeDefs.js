const typeDefs = `#graphql
  type CartProduct {
    id: ID!
    name: String!
    price: Float!
    imageUrl: String
    description: String
    category: String
  }

  type CartItem {
    id: ID!
    product: CartProduct
    quantity: Int!
    selected: Boolean!
    subtotal: Float!
  }

  type CartTotals {
    totalQuantity: Int!
    totalPrice: Float!
    selectedQuantity: Int!
    selectedPrice: Float!
  }

  type Cart {
    id: ID!
    items: [CartItem!]!
    totals: CartTotals!
  }

  type Query {
    cart: Cart!
  }

  type Mutation {
    addToCart(productId: ID!, quantity: Int = 1): Cart!
    updateCartItem(itemId: ID!, quantity: Int, selected: Boolean): Cart!
    removeCartItem(itemId: ID!): Cart!
    selectCartItems(itemIds: [ID!]!): Cart!
  }
`;

module.exports = typeDefs;
