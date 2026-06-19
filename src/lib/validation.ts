export const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const isValidEmail = (value: string) => {
    const email = normalizeEmail(value);
    if (email.length < 6 || email.length > 254) return false;
    return /^[a-z0-9]+([._%+-]?[a-z0-9]+)*@[a-z0-9]+([.-]?[a-z0-9]+)*\.[a-z]{2,63}$/.test(email);
};

export const isStrongPassword = (value: string) =>
    value.length >= 8 && value.length <= 72 && /[A-Za-z]/.test(value) && /\d/.test(value);

export const isValidDisplayName = (value: string) => {
    const name = value.trim();
    return name.length >= 2 && name.length <= 40 && !/[<>\u0000-\u001F\u007F]/.test(name);
};
