/**
 * pick - Creates an object composed of the picked object properties:
 * @param {object} obj - the source object
 * @param {...string} fields - the properties paths to pick
 * @returns {object} - returns the new object
 */

//объект и произвольное количество строк – ключей объекта
export const pick = (obj, ...fields) => {
  let arr = Object.entries(obj);
  let filteredArr = arr.filter(([key]) => fields.includes(key));
  let result = Object.fromEntries(filteredArr);
  return result;
};
// const fruits = {
//   apple: 2,
//   orange: 4,
//   banana: 3,
// };

// pick(fruits, "apple", "banana");

// console.log(pick(fruits, "apple", "banana"));
