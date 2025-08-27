import { createContext, useState, useEffect, useContext } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const localData = localStorage.getItem('cartItems');
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      console.error('Could not parse cart items from localStorage', error);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (service) => {
    setCartItems((prevItems) => {
      const exist = prevItems.find((item) => item._id === service._id);
      if (exist) {
        return prevItems.map((item) =>
          item._id === service._id ? { ...item, qty: item.qty + 1 } : item
        );
      } else {
        return [...prevItems, { ...service, qty: 1 }];
      }
    });
    toast.success(`${service.title} added to cart!`);
  };

  const decreaseCartItem = (service) => {
    setCartItems((prevItems) => {
      const exist = prevItems.find((item) => item._id === service._id);
      if (exist && exist.qty > 1) {
        return prevItems.map((item) =>
          item._id === service._id ? { ...item, qty: item.qty - 1 } : item
        );
      } else {
        // If quantity is 1, remove the item from the cart
        return prevItems.filter((item) => item._id !== service._id);
      }
    });
  };

  const removeFromCart = (serviceId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item._id !== serviceId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, decreaseCartItem, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};
