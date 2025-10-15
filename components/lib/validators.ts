export const isValidPromotionCode = (code: string) => {
    return /^[A-Z0-9]{4,8}$/.test(code);
  };