import { gql } from '@apollo/client';

export const CART_FIELDS = gql`
  fragment CartFields on Cart {
    id
    items {
      id
      quantity
      selected
      subtotal
      product {
        id
        name
        price
        imageUrl
        description
        category
      }
    }
    totals {
      totalQuantity
      totalPrice
      selectedQuantity
      selectedPrice
    }
  }
`;

export const GET_CART = gql`
  ${CART_FIELDS}
  query GetCart {
    cart {
      ...CartFields
    }
  }
`;

export const ADD_TO_CART = gql`
  ${CART_FIELDS}
  mutation AddToCart($productId: ID!, $quantity: Int) {
    addToCart(productId: $productId, quantity: $quantity) {
      ...CartFields
    }
  }
`;

export const UPDATE_CART_ITEM = gql`
  ${CART_FIELDS}
  mutation UpdateCartItem($itemId: ID!, $quantity: Int, $selected: Boolean) {
    updateCartItem(itemId: $itemId, quantity: $quantity, selected: $selected) {
      ...CartFields
    }
  }
`;

export const REMOVE_CART_ITEM = gql`
  ${CART_FIELDS}
  mutation RemoveCartItem($itemId: ID!) {
    removeCartItem(itemId: $itemId) {
      ...CartFields
    }
  }
`;

export const SELECT_CART_ITEMS = gql`
  ${CART_FIELDS}
  mutation SelectCartItems($itemIds: [ID!]!) {
    selectCartItems(itemIds: $itemIds) {
      ...CartFields
    }
  }
`;
