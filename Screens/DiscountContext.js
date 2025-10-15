import React, { createContext, useState, useContext, useCallback } from "react";

const DiscountContext = createContext();

export const DiscountProvider = ({ children }) => {
  const [discount, setDiscount] = useState({
    percentage: 0,
    type: null, // 'voucher' or 'promo'
    code: null,
    expiry: null,
    originalFare: null,
    discountAmount: 0
  });

  /**
   * Applies a discount
   * @param {number} percentage - Discount percentage (0-100)
   * @param {string} type - 'voucher' or 'promo'
   * @param {string} code - Voucher/promo code
   * @param {number} expiresInMinutes - Duration in minutes
   * @param {number} originalFare - Original fare before discount
   */
  const applyDiscount = useCallback((percentage, type, code, expiresInMinutes, originalFare) => {
    const discountAmount = (originalFare * percentage) / 100;
    
    let expiryTime = null;
    if (expiresInMinutes) {
      expiryTime = new Date();
      expiryTime.setMinutes(expiryTime.getMinutes() + expiresInMinutes);
    }

    setDiscount({
      percentage,
      type,
      code,
      expiry: expiryTime,
      originalFare,
      discountAmount
    });
  }, []);

  /**
   * Completely resets the discount
   */
  const resetDiscount = useCallback(() => {
    setDiscount({
      percentage: 0,
      type: null,
      code: null,
      expiry: null,
      originalFare: null,
      discountAmount: 0
    });
  }, []);

  /**
   * Checks if discount is still valid
   */
  const isDiscountValid = useCallback(() => {
    if (!discount.expiry) return true;
    return new Date() < new Date(discount.expiry);
  }, [discount.expiry]);

  /**
   * Gets current active discount information
   */
  const getDiscountInfo = useCallback(() => {
    return {
      ...discount,
      isValid: isDiscountValid()
    };
  }, [discount, isDiscountValid]);

  return (
    <DiscountContext.Provider
      value={{
        // State
        discountPercentage: discount.percentage,
        discountType: discount.type,
        discountCode: discount.code,
        discountExpiry: discount.expiry,
        discountAmount: discount.discountAmount,
        originalFare: discount.originalFare,
        
        // Actions
        applyDiscount,
        resetDiscount,
        isDiscountValid,
        getDiscountInfo
      }}
    >
      {children}
    </DiscountContext.Provider>
  );
};

export const useDiscount = () => {
  const context = useContext(DiscountContext);
  if (!context) {
    throw new Error('useDiscount must be used within a DiscountProvider');
  }
  return context;
};