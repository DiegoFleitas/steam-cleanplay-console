// Javascript does not work well with integers greater than 53 bits precision... So we need
// to do our maths using strings.
const getDigit = (x, digitIndex) => {
  return digitIndex >= x.length ? "0" : x.charAt(x.length - digitIndex - 1);
};

const prefixZeros = (strint, zeroCount) => {
  let result = strint;
  for (let i = 0; i < zeroCount; i++) {
    result = "0" + result;
  }
  return result;
};

//Only works for positive numbers, which is fine in our use case.
const add = (x, y) => {
  const maxLength = Math.max(x.length, y.length);
  let result = "";
  let borrow = 0;
  let leadingZeros = 0;

  for (let i = 0; i < maxLength; i++) {
    let lhs = Number(getDigit(x, i));
    let rhs = Number(getDigit(y, i));
    let digit = lhs + rhs + borrow;
    borrow = 0;

    while (digit >= 10) {
      digit -= 10;
      borrow++;
    }

    if (digit === 0) {
      leadingZeros++;
    } else {
      result = String(digit) + prefixZeros(result, leadingZeros);
      leadingZeros = 0;
    }
  }

  if (borrow > 0) {
    result = String(borrow) + result;
  }

  return result;
};

export const getId = (miniProfileId) => {
  const steam64identifier = "76561197960265728";
  return add(steam64identifier, miniProfileId);
};
